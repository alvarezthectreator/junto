import { useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Phone,
  PhoneOff,
  Video,
  VideoOff,
  Wifi,
  WifiOff,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { useWebRTC, type WebRTCSignal } from '../hooks/useWebRTC';
import * as API from '../services/api';

interface CallModalProps {
  type: 'audio' | 'video';
  name: string;
  localUserId?: string;
  remoteUserId?: string;
  conversationId?: string;
  onClose: () => void;
  /** Optional: if you have an incoming signal to handle immediately (callee side) */
  incomingSignal?: WebRTCSignal | null;
}

const STATE_LABELS: Record<string, string> = {
  idle: 'Initialising…',
  'requesting-media': 'Accessing microphone…',
  'creating-offer': 'Setting up call…',
  'waiting-answer': 'Ringing…',
  connecting: 'Connecting…',
  connected: 'Connected',
  ended: 'Call ended',
  error: 'Something went wrong',
};

/**
 * Sends a WebRTC signal to the remote peer.
 * Wraps API.sendMessage — signals are JSON-encoded as special messages.
 * Both peers must be online and polling / using the same signal channel.
 */
async function sendSignalViaAPI(signal: WebRTCSignal): Promise<void> {
  if (!signal.to) return;
  const encoded = JSON.stringify({ __webrtc_signal__: true, ...signal });
  await API.sendMessage(null, signal.to, encoded, 'text').catch((err) => {
    console.warn('[WebRTC] Failed to send signal:', err);
  });
}

function buildCallSummaryMessage(type: 'audio' | 'video', reason: 'completed' | 'missed' | 'declined') {
  const modeLabel = type === 'video' ? 'Video call' : 'Voice call';

  if (reason === 'completed') {
    return `${modeLabel} completed`;
  }

  if (reason === 'declined') {
    return `${modeLabel} declined`;
  }

  return `Missed ${modeLabel.toLowerCase()}`;
}

export function CallModal({
  type,
  name,
  localUserId,
  remoteUserId,
  conversationId,
  onClose,
  incomingSignal,
}: CallModalProps) {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const processedSignalKeysRef = useRef<Set<string>>(new Set());
  const initialSignalKeyRef = useRef<string | null>(null);

  const {
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
  } = useWebRTC({
    mode: type,
    localUserId,
    remoteUserId,
    sendSignal: sendSignalViaAPI,
  });

  // Wire streams to <video> elements
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  useEffect(() => {
    if (callState !== 'ended') {
      return;
    }

    const timeout = window.setTimeout(() => {
      onClose();
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [callState, onClose]);

  // Auto-start outgoing call or handle the first incoming offer.
  useEffect(() => {
    if (incomingSignal) {
      const signalKey = JSON.stringify(incomingSignal);
      if (initialSignalKeyRef.current !== signalKey) {
        initialSignalKeyRef.current = signalKey;
        processedSignalKeysRef.current.add(signalKey);
        void handleIncomingSignal(incomingSignal);
      }
      return;
    }

    if (initialSignalKeyRef.current !== 'outgoing-started') {
      initialSignalKeyRef.current = 'outgoing-started';
      void startCall();
    }
  }, [incomingSignal, handleIncomingSignal, startCall]);

  // Keep the live call synchronized with new offer/answer/ICE messages in the active conversation.
  useEffect(() => {
    if (!conversationId || !localUserId || !remoteUserId) {
      return;
    }

    let active = true;

    const syncSignals = async () => {
      try {
        const response = await API.getConversation(conversationId);
        if (!active) return;

        const messages = Array.isArray(response?.messages) ? response.messages : [];
        for (const message of messages) {
          let parsed: WebRTCSignal & { __webrtc_signal__?: boolean } | null = null;
          try {
            parsed = JSON.parse(message.content || 'null');
          } catch {
            parsed = null;
          }

          if (
            parsed?.__webrtc_signal__ &&
            String(parsed.from || '') === String(remoteUserId) &&
            String(parsed.to || '') === String(localUserId)
          ) {
            const signalKey = JSON.stringify(parsed);
            if (processedSignalKeysRef.current.has(signalKey)) {
              continue;
            }
            processedSignalKeysRef.current.add(signalKey);
            await handleIncomingSignal(parsed);
          }
        }
      } catch (error) {
        console.warn('[WebRTC] Failed to sync conversation signals:', error);
      }
    };

    void syncSignals();
    const interval = window.setInterval(() => void syncSignals(), 1200);

    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [conversationId, localUserId, remoteUserId, handleIncomingSignal]);

  const handleHangUp = () => {
    const reason = callState === 'connected' ? 'completed' : 'missed';

    if (conversationId && localUserId && remoteUserId) {
      void API.sendMessage(
        conversationId,
        remoteUserId,
        buildCallSummaryMessage(type, reason),
        'system'
      ).catch((error) => {
        console.warn('[WebRTC] Failed to log call summary:', error);
      });
    }

    hangUp(reason);
    onClose();
  };

  const isConnected = callState === 'connected';
  const isVideo = type === 'video';

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/90 px-4 backdrop-blur-sm">
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-white/10 bg-[#111115] shadow-2xl shadow-black/60">

        {/* ── VIDEO AREA ──────────────────────────────────────────────── */}
        {isVideo && (
          <div className="relative h-72 w-full overflow-hidden bg-[#0A0A0E]">
            {/* Remote video (full width) */}
            {remoteStream ? (
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <div className="text-center">
                  <div className="mx-auto mb-3 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-[#F59E0B] to-[#FB923C] text-3xl font-bold text-white">
                    {name.charAt(0).toUpperCase()}
                  </div>
                  <p className="text-sm text-gray-400">{STATE_LABELS[callState] ?? 'Calling…'}</p>
                </div>
              </div>
            )}

            {/* Local video (picture-in-picture) */}
            {localStream && (
              <div className="absolute bottom-3 right-3 h-24 w-16 overflow-hidden rounded-xl border-2 border-white/20 bg-black shadow-lg">
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`h-full w-full object-cover ${isCameraOff ? 'opacity-0' : ''}`}
                />
                {isCameraOff && (
                  <div className="absolute inset-0 flex items-center justify-center bg-[#0F0F13]">
                    <VideoOff size={16} className="text-gray-500" />
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── AUDIO CALL AVATAR (no video) ───────────────────────────── */}
        {!isVideo && (
          <div className="flex flex-col items-center py-10">
            <div className="relative mb-4">
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-[#F59E0B] to-[#FB923C] text-4xl font-bold text-white shadow-xl shadow-[#F59E0B]/25">
                {name.charAt(0).toUpperCase()}
              </div>
              {isConnected && (
                <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-[#111115] bg-green-500">
                  <span className="h-2 w-2 animate-ping rounded-full bg-green-300" />
                </span>
              )}
            </div>
            <p className="text-lg font-semibold text-white">{name}</p>
            <p className="mt-1 text-sm text-gray-400">
              {isConnected ? 'Voice call in progress' : STATE_LABELS[callState] ?? 'Calling…'}
            </p>
          </div>
        )}

        {/* ── STATUS BAR ─────────────────────────────────────────────── */}
        <div className="flex items-center justify-between border-t border-white/5 bg-white/[0.03] px-5 py-3">
          <div className="flex items-center gap-2 text-xs text-gray-400">
            {callState === 'connected' ? (
              <>
                <Wifi size={13} className="text-green-400" />
                <span className="text-green-400">Live</span>
              </>
            ) : callState === 'error' ? (
              <>
                <WifiOff size={13} className="text-red-400" />
                <span className="text-red-400 truncate max-w-[200px]">{error ?? 'Error'}</span>
              </>
            ) : (
              <>
                <Loader2 size={13} className="animate-spin text-[#FBBF24]" />
                <span>{STATE_LABELS[callState] ?? '…'}</span>
              </>
            )}
          </div>
          {isVideo && (
            <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] uppercase tracking-wider text-gray-400">
              HD Video
            </span>
          )}
        </div>

        {/* ── ERROR DETAIL ───────────────────────────────────────────── */}
        {error && (
          <div className="mx-4 mb-3 flex items-start gap-2 rounded-2xl border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-300">
            <AlertCircle size={14} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* ── CONTROLS ───────────────────────────────────────────────── */}
        <div className="flex items-center justify-center gap-4 px-5 pb-6 pt-3">
          {/* Mute */}
          <button
            onClick={toggleMute}
            className={`flex h-13 w-13 flex-col items-center justify-center gap-1 rounded-2xl border p-3 transition-colors ${
              isMuted
                ? 'border-red-500/30 bg-red-500/15 text-red-400'
                : 'border-white/10 bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white'
            }`}
            aria-label={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
            <span className="text-[10px]">{isMuted ? 'Unmute' : 'Mute'}</span>
          </button>

          {/* Camera toggle (video calls only) */}
          {isVideo && (
            <button
              onClick={toggleCamera}
              className={`flex flex-col items-center justify-center gap-1 rounded-2xl border p-3 transition-colors ${
                isCameraOff
                  ? 'border-red-500/30 bg-red-500/15 text-red-400'
                  : 'border-white/10 bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white'
              }`}
              aria-label={isCameraOff ? 'Turn camera on' : 'Turn camera off'}
            >
              {isCameraOff ? <VideoOff size={20} /> : <Video size={20} />}
              <span className="text-[10px]">{isCameraOff ? 'Cam off' : 'Camera'}</span>
            </button>
          )}

          {/* End call */}
          <button
            onClick={handleHangUp}
            className="flex flex-col items-center justify-center gap-1 rounded-2xl bg-red-500 p-3 text-white shadow-lg shadow-red-500/25 transition-colors hover:bg-red-400"
            aria-label="End call"
          >
            <PhoneOff size={20} />
            <span className="text-[10px]">End</span>
          </button>

          {/* Answer button — shown only in callee state before connecting */}
          {incomingSignal && callState === 'idle' && (
            <button
              onClick={() => void handleIncomingSignal(incomingSignal)}
              className="flex flex-col items-center justify-center gap-1 rounded-2xl bg-green-500 p-3 text-white shadow-lg shadow-green-500/25 transition-colors hover:bg-green-400"
              aria-label="Answer call"
            >
              <Phone size={20} />
              <span className="text-[10px]">Answer</span>
            </button>
          )}
        </div>

        {/* ── PERMISSION HINT ────────────────────────────────────────── */}
        {callState === 'requesting-media' && (
          <p className="pb-4 text-center text-[11px] text-gray-500">
            Your browser will ask for permission to use your {isVideo ? 'camera and ' : ''}microphone.
          </p>
        )}
      </div>
    </div>
  );
}
