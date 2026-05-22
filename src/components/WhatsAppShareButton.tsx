/**
 * WhatsApp Share Button Component
 * Reusable component for sharing content via WhatsApp
 */

import React from 'react';
import { motion } from 'framer-motion';
import { MessageCircle } from 'lucide-react';
import {
  shareEventToWhatsApp,
  shareProfileToWhatsApp,
  EventShareData,
  getWhatsAppButtonText,
  logWhatsAppShare,
} from '../utils/whatsappShare';

interface WhatsAppShareButtonProps {
  type: 'event' | 'profile';
  data: EventShareData | { profileName: string; profileBio?: string; profileLink?: string };
  className?: string;
  variant?: 'button' | 'icon';
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  onShare?: () => void;
}

export const WhatsAppShareButton: React.FC<WhatsAppShareButtonProps> = ({
  type,
  data,
  className = '',
  variant = 'button',
  size = 'md',
  label,
  onShare,
}) => {
  const handleShare = () => {
    try {
      if (type === 'event') {
        shareEventToWhatsApp(data as EventShareData);
        logWhatsAppShare('event', (data as any).eventTitle);
      } else if (type === 'profile') {
        const profileData = data as any;
        shareProfileToWhatsApp(profileData.profileName, profileData.profileBio, profileData.profileLink);
        logWhatsAppShare('profile', profileData.profileName);
      }

      if (onShare) {
        onShare();
      }
    } catch (error) {
      console.error('Error sharing to WhatsApp:', error);
    }
  };

  const buttonText = label || getWhatsAppButtonText(type);

  const sizeClasses = {
    sm: 'p-2',
    md: 'p-3',
    lg: 'p-4',
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  if (variant === 'icon') {
    return (
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleShare}
        className={`${sizeClasses[size]} rounded-lg bg-green-500 hover:bg-green-600 transition-colors ${className}`}
        title={buttonText}
        aria-label={buttonText}
      >
        <MessageCircle className={`${iconSizes[size]} text-white`} />
      </motion.button>
    );
  }

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={handleShare}
      className={`
        flex items-center gap-2 px-4 py-2 rounded-lg
        bg-green-500 hover:bg-green-600
        text-white font-medium text-sm
        transition-colors
        ${className}
      `}
    >
      <MessageCircle className="w-5 h-5" />
      {buttonText}
    </motion.button>
  );
};

interface WhatsAppShareMenuProps {
  type: 'event' | 'profile';
  data: EventShareData | { profileName: string; profileBio?: string; profileLink?: string };
  onClose?: () => void;
}

export const WhatsAppShareMenu: React.FC<WhatsAppShareMenuProps> = ({ type, data, onClose }) => {
  const handleShare = () => {
    if (type === 'event') {
      shareEventToWhatsApp(data as EventShareData);
      logWhatsAppShare('event', (data as any).eventTitle);
    } else if (type === 'profile') {
      const profileData = data as any;
      shareProfileToWhatsApp(profileData.profileName, profileData.profileBio, profileData.profileLink);
      logWhatsAppShare('profile', profileData.profileName);
    }

    if (onClose) {
      onClose();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="p-4 bg-white/10 border border-white/20 rounded-lg backdrop-blur-sm"
    >
      <p className="text-sm text-slate-300 mb-3">
        {type === 'event'
          ? 'Share this event on WhatsApp'
          : 'Share this profile on WhatsApp'}
      </p>
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={handleShare}
        className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-green-500 hover:bg-green-600 text-white font-medium transition-colors"
      >
        <MessageCircle className="w-5 h-5" />
        {getWhatsAppButtonText(type)}
      </motion.button>
    </motion.div>
  );
};
