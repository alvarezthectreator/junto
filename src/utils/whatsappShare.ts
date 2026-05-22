/**
 * WhatsApp Sharing Utilities for Junto
 * Handles sharing events, profiles, and content via WhatsApp
 */

export interface ShareContent {
  type: 'event' | 'profile' | 'invite' | 'emergency';
  title: string;
  description?: string;
  url?: string;
  emoji?: string;
  customMessage?: string;
}

export interface EventShareData {
  eventTitle: string;
  eventDate: string;
  eventTime: string;
  eventLocation: string;
  eventDescription?: string;
  hostName: string;
  interestedCount?: number;
  eventLink?: string;
}

/**
 * Generate WhatsApp message for event sharing
 */
export const generateEventShareMessage = (event: EventShareData): string => {
  const message = `🎉 *${event.eventTitle}* 🎉

📅 ${event.eventDate}
🕐 ${event.eventTime}
📍 ${event.eventLocation}

${event.eventDescription ? `📝 ${event.eventDescription}\n\n` : ''}👤 Hosted by: ${event.hostName}
${event.interestedCount ? `❤️ ${event.interestedCount} people interested\n` : ''}
${event.eventLink ? `🔗 Join Junto to RSVP: ${event.eventLink}` : ''}

See you there! 🚀`;

  return message;
};

/**
 * Generate WhatsApp message for profile sharing
 */
export const generateProfileShareMessage = (
  profileName: string,
  profileBio?: string,
  profileLink?: string
): string => {
  const message = `👋 Check out ${profileName}'s profile on Junto!

${profileBio ? `Bio: ${profileBio}\n\n` : ''}${profileLink ? `🔗 ${profileLink}` : ''}

Let's hangout! 🎊`;

  return message;
};

/**
 * Generate WhatsApp message for emergency/SOS
 */
export const generateSOSMessage = (userName: string, contactNumber?: string): string => {
  const message = `🚨 *EMERGENCY* 🚨

I'm using Junto's safety feature to notify you that I need immediate assistance.

User: ${userName}
${contactNumber ? `Contact: ${contactNumber}\n` : ''}
Please respond ASAP!

Location sharing may be enabled in the Junto app.`;

  return message;
};

/**
 * Share event via WhatsApp
 */
export const shareEventToWhatsApp = (event: EventShareData): void => {
  const message = generateEventShareMessage(event);
  const encodedMessage = encodeURIComponent(message);
  const whatsappUrl = `https://wa.me/?text=${encodedMessage}`;

  window.open(whatsappUrl, '_blank');
};

/**
 * Share event via WhatsApp to specific contact
 */
export const shareEventToWhatsAppContact = (event: EventShareData, phoneNumber: string): void => {
  const message = generateEventShareMessage(event);
  const encodedMessage = encodeURIComponent(message);
  // Remove any non-digit characters and ensure it's in E.164 format
  const cleanPhone = phoneNumber.replace(/\D/g, '');
  const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodedMessage}`;

  window.open(whatsappUrl, '_blank');
};

/**
 * Share profile via WhatsApp
 */
export const shareProfileToWhatsApp = (
  profileName: string,
  profileBio?: string,
  profileLink?: string
): void => {
  const message = generateProfileShareMessage(profileName, profileBio, profileLink);
  const encodedMessage = encodeURIComponent(message);
  const whatsappUrl = `https://wa.me/?text=${encodedMessage}`;

  window.open(whatsappUrl, '_blank');
};

/**
 * Send SOS message via WhatsApp
 */
export const sendSOSViaWhatsApp = (phoneNumber: string, userName: string, userPhone?: string): void => {
  const message = generateSOSMessage(userName, userPhone);
  const encodedMessage = encodeURIComponent(message);
  const cleanPhone = phoneNumber.replace(/\D/g, '');
  const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodedMessage}`;

  window.open(whatsappUrl, '_blank');
};

/**
 * Generate shareable invitation link
 */
export const generateInviteLink = (eventId: string, referralCode?: string): string => {
  const baseUrl = window.location.origin;
  const params = new URLSearchParams({
    event: eventId,
    ...(referralCode && { ref: referralCode }),
  });

  return `${baseUrl}/invite?${params.toString()}`;
};

/**
 * Check if WhatsApp Web is available
 */
export const isWhatsAppAvailable = (): boolean => {
  const userAgent = navigator.userAgent;
  return /WhatsApp/i.test(userAgent);
};

/**
 * Get WhatsApp share button text
 */
export const getWhatsAppButtonText = (type: 'event' | 'profile' | 'invite'): string => {
  const texts = {
    event: 'Share on WhatsApp',
    profile: 'Share Profile on WhatsApp',
    invite: 'Invite on WhatsApp',
  };

  return texts[type];
};

/**
 * Format phone number to international format
 */
export const formatPhoneForWhatsApp = (phone: string, countryCode = '+234'): string => {
  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '');

  // If already has country code, return as is
  if (cleaned.startsWith(countryCode.replace('+', ''))) {
    return `${countryCode}${cleaned.slice(countryCode.length - 1)}`;
  }

  // If starts with 0, replace with country code
  if (cleaned.startsWith('0')) {
    return `${countryCode}${cleaned.slice(1)}`;
  }

  // Otherwise prepend country code
  return `${countryCode}${cleaned}`;
};

/**
 * Log sharing action for analytics
 */
export const logWhatsAppShare = (type: string, contentId: string): void => {
  console.log(`[Junto Analytics] WhatsApp share - Type: ${type}, Content ID: ${contentId}`);
  // TODO: Integrate with actual analytics service
};
