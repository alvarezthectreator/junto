import { useCallback, useEffect, useRef, useState } from 'react';

export type CallState =
  | 'idle'
  | 'requesting-media'
  | 'creating-offer'
  | 'waiting-answer'
  | 'connecting'
  | 'connected'
  | 'ended'
  | 'error';

export interface WebRTCSignal {
  type: 'offer' | 'answer' | 'ice-candidate' | 'hang-up';
  payload: any;
  from?: string;
  to?: string;
  mode?: 'audio' | 'video';
}

export interface UseWebRTCOptions {
  /** 'audio' for voice-only, 'video' for video+audio */
  mode: 'audio' | 'video';
  /** The local user's ID */
  localUserId?: string;
  /** The remote peer's ID */
  remoteUserId?: string;
  /**
   * Your signalling layer: call this whenever the hook produces a signal
   * that needs to be delivered to the remote peer.
   * Typically wraps your existing API.sendMessage or a WebSocket emit.
   */
  sendSignal: (signal: WebRTCSignal) => Promise<void> | void;
}

export interface UseWebRTCReturn {
  callState: CallState;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  isMuted: boolean;
  isCameraOff: boolean;
  /** Call this to start an outgoing call (creates offer) */
  startCall: () => Promise<void>;
  /** Call this when you receive a signal from the remote peer */
  handleIncomingSignal: (signal: WebRTCSignal) => Promise<void>;
  toggleMute: () => void;
  toggleCamera: () => void;
  hangUp: (reason?: 'missed' | 'completed' | 'declined') => void;
  error: string | null;
}

const ICE_SERVERS: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  // Add TURN servers here for production reliability:
  // { urls: 'turn:your-turn-server.com', username: '...', credential: '...' }
];

export function useWebRTC({
  mode,
  localUserId,
  remoteUserId,
  sendSignal,
}: UseWebRTCOptions): UseWebRTCReturn {
  const [callState, setCallState] = useState<CallState>('idle');
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const pendingCandidatesRef = useRef<RTCIceCandidateInit[]>([]);
  const isCallerRef = useRef(false);

  /** Clean up everything */
  const cleanup = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
    setLocalStream(null);
    setRemoteStream(null);
    pendingCandidatesRef.current = [];
  }, []);

  /** Get mic + optional camera */
  const getMedia = useCallback(async (): Promise<MediaStream> => {
    setCallState('requesting-media');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: mode === 'video' ? { width: 1280, height: 720, facingMode: 'user' } : false,
      });
      localStreamRef.current = stream;
      setLocalStream(stream);
      return stream;
    } catch (err: any) {
      const msg =
        err?.name === 'NotAllowedError'
          ? 'Camera/microphone permission denied. Please allow access in your browser settings.'
          : err?.name === 'NotFoundError'
          ? 'No camera or microphone found on this device.'
          : `Could not access media devices: ${err?.message ?? String(err)}`;
      setError(msg);
      setCallState('error');
      throw new Error(msg);
    }
  }, [mode]);

  /** Build the RTCPeerConnection and wire up events */
  const createPeerConnection = useCallback(
    (stream: MediaStream): RTCPeerConnection => {
      const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });

      // Add local tracks
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      // Collect remote tracks into a single stream
      const remote = new MediaStream();
      pc.ontrack = (event) => {
        event.streams[0]?.getTracks().forEach((track) => remote.addTrack(track));
        setRemoteStream(remote);
      };

      // Send ICE candidates to the peer via your signalling layer
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          void sendSignal({
            type: 'ice-candidate',
            payload: event.candidate.toJSON(),
            from: localUserId,
            to: remoteUserId,
          });
        }
      };

      pc.onconnectionstatechange = () => {
        const state = pc.connectionState;
        if (state === 'connected') setCallState('connected');
        if (state === 'disconnected' || state === 'failed' || state === 'closed') {
          setCallState('ended');
          cleanup();
        }
      };

      pcRef.current = pc;
      return pc;
    },
    [sendSignal, localUserId, remoteUserId, cleanup]
  );

  /** Caller side: get media → create offer → send offer */
  const startCall = useCallback(async () => {
    if (callState !== 'idle') return;
    isCallerRef.current = true;
    setError(null);

    try {
      const stream = await getMedia();
      const pc = createPeerConnection(stream);

      setCallState('creating-offer');
      const offer = await pc.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: mode === 'video' });
      await pc.setLocalDescription(offer);

      setCallState('waiting-answer');
      await sendSignal({
        type: 'offer',
        payload: offer,
        from: localUserId,
        to: remoteUserId,
        mode,
      });
    } catch {
      // error already set inside getMedia
    }
  }, [callState, getMedia, createPeerConnection, mode, sendSignal, localUserId, remoteUserId]);

  /** Handle signals arriving from the remote peer */
  const handleIncomingSignal = useCallback(
    async (signal: WebRTCSignal) => {
      try {
        // ── OFFER (we are the callee) ──────────────────────────────────────
        if (signal.type === 'offer') {
          isCallerRef.current = false;
          setError(null);

          const stream = await getMedia();
          const pc = createPeerConnection(stream);

          await pc.setRemoteDescription(new RTCSessionDescription(signal.payload));

          // Flush any ICE candidates that arrived before the offer
          for (const candidate of pendingCandidatesRef.current) {
            await pc.addIceCandidate(new RTCIceCandidate(candidate)).catch(() => {});
          }
          pendingCandidatesRef.current = [];

          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          setCallState('connecting');

          await sendSignal({
            type: 'answer',
            payload: answer,
            from: localUserId,
            to: remoteUserId,
          });
        }

        // ── ANSWER (we are the caller) ─────────────────────────────────────
        else if (signal.type === 'answer') {
          const pc = pcRef.current;
          if (!pc) return;
          await pc.setRemoteDescription(new RTCSessionDescription(signal.payload));
          setCallState('connecting');

          // Flush pending candidates
          for (const candidate of pendingCandidatesRef.current) {
            await pc.addIceCandidate(new RTCIceCandidate(candidate)).catch(() => {});
          }
          pendingCandidatesRef.current = [];
        }

        // ── ICE CANDIDATE ──────────────────────────────────────────────────
        else if (signal.type === 'ice-candidate') {
          const pc = pcRef.current;
          if (!pc || !pc.remoteDescription) {
            // Queue it — remote description not set yet
            pendingCandidatesRef.current.push(signal.payload);
            return;
          }
          await pc.addIceCandidate(new RTCIceCandidate(signal.payload)).catch(() => {});
        }

        // ── HANG UP ────────────────────────────────────────────────────────
        else if (signal.type === 'hang-up') {
          setCallState('ended');
          cleanup();
        }
      } catch (err: any) {
        setError(`Call error: ${err?.message ?? String(err)}`);
        setCallState('error');
      }
    },
    [getMedia, createPeerConnection, sendSignal, localUserId, remoteUserId, cleanup]
  );

  const toggleMute = useCallback(() => {
    const stream = localStreamRef.current;
    if (!stream) return;
    stream.getAudioTracks().forEach((track) => {
      track.enabled = !track.enabled;
    });
    setIsMuted((prev) => !prev);
  }, []);

  const toggleCamera = useCallback(() => {
    const stream = localStreamRef.current;
    if (!stream) return;
    stream.getVideoTracks().forEach((track) => {
      track.enabled = !track.enabled;
    });
    setIsCameraOff((prev) => !prev);
  }, []);

  const hangUp = useCallback((reason?: 'missed' | 'completed' | 'declined') => {
    const resolvedReason = reason || (callState === 'connected' ? 'completed' : 'missed');

    try {
      const result = sendSignal({
        type: 'hang-up',
        payload: {
          reason: resolvedReason,
          mode,
        },
        from: localUserId,
        to: remoteUserId,
      });
      if (result instanceof Promise) {
        result.catch(() => {});
      }
    } catch {
      // ignore
    }

    setCallState('ended');
    cleanup();
  }, [callState, sendSignal, localUserId, remoteUserId, cleanup, mode]);

  // Cleanup on unmount
  useEffect(() => () => cleanup(), [cleanup]);

  return {
    callState,
    localStream,
    remoteStream,
    isMuted,
    isCameraOff,
    startCall,
    handleIncomingSignal,
    toggleMute,
    toggleCamera,
    hangUp,
    error,
  };
}
