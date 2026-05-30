// Multilingual support for Junto - English, French, Swahili, Hausa

export type Language = 'en' | 'fr' | 'sw' | 'ha';

export const LANGUAGES = {
  en: { name: 'English', flag: '🇬🇧', nativeName: 'English' },
  fr: { name: 'Français', flag: '🇫🇷', nativeName: 'Français' },
  sw: { name: 'Kiswahili', flag: '🇹🇿', nativeName: 'Kiswahili' },
  ha: { name: 'Hausa', flag: '🇳🇬', nativeName: 'Hausa' },
} as const;

const translations = {
  en: {
    // Navigation
    'nav.discover': 'Discover',
    'nav.nearby': 'Nearby',
    'nav.myRequests': 'My Requests',
    'nav.messages': 'Messages',
    'nav.profile': 'Profile',
    'nav.notifications': 'Notifications',

    // Common Actions
    'action.post': 'Post',
    'action.search': 'Search',
    'action.filter': 'Filter',
    'action.create': 'Create',
    'action.edit': 'Edit',
    'action.delete': 'Delete',
    'action.save': 'Save',
    'action.cancel': 'Cancel',
    'action.submit': 'Submit',
    'action.message': 'Message',
    'action.like': 'Like',
    'action.decline': 'Decline',
    'action.accept': 'Accept',
    'action.block': 'Block',
    'action.report': 'Report',

    // Events
    'event.create': 'Create Event',
    'event.interested': "I'm Interested",
    'event.applicationSent': 'Application sent',
    'event.viewDetails': 'View Event →',
    'event.location': 'Location',
    'event.date': 'Date',
    'event.time': 'Time',
    'event.attendees': 'Attendees',
    'event.billing': 'Billing',
    'event.categories': 'Categories',
    'event.expired': 'Event Expired',
    'event.private': 'Private',
    'event.travelMode': 'Travel Mode',

    // Ratings
    'rating.rateHost': 'Rate Host',
    'rating.average': 'Avg Rating',
    'rating.reviews': 'Reviews',
    'rating.yourRating': 'Your Rating',
    'rating.outOf5': 'out of 5',

    // Search & Filter
    'search.searchEvents': 'Search events...',
    'search.category': 'Category',
    'search.billingTier': 'Billing Tier',
    'search.date': 'Date Range',
    'search.distance': 'Distance',
    'search.noResults': 'No events found',

    // Safety
    'safety.report': 'Report User',
    'safety.block': 'Block User',
    'safety.unblock': 'Unblock User',
    'safety.blocked': 'Blocked Users',
    'safety.trustedContacts': 'Trusted Contacts',
    'safety.sos': 'Emergency Alert',
    'safety.anonymous': 'Report is anonymous',

    // Notifications
    'notify.newMessage': 'New message from',
    'notify.eventInvite': 'You have been invited to',
    'notify.requestAccepted': 'Your request was accepted',
    'notify.requestDeclined': 'Your request was declined',
    'notify.profileShared': 'Your profile was shared',

    // Profile
    'profile.edit': 'Edit Profile',
    'profile.photos': 'Photos',
    'profile.videos': 'Videos',
    'profile.bio': 'Bio',
    'profile.verified': 'Verified',
    'profile.reliability': 'Reliability',
    'profile.hosted': 'Events Hosted',

    // Settings
    'settings.language': 'Language',
    'settings.notifications': 'Notifications',
    'settings.privacy': 'Privacy',
    'settings.safety': 'Safety',
    'settings.help': 'Help & Support',
    'settings.logout': 'Logout',

    // Billing
    'billing.fullyCovered': '100% covered',
    'billing.mostlyCovered': '~75% covered',
    'billing.splitCost': '50% covered',
    'billing.hostMe': 'Host Me',
    'billing.agreement': 'Financial Agreement',

    // Error messages
    'error.networkError': 'Network error. Please try again.',
    'error.notFound': 'Not found',
    'error.unauthorized': 'Unauthorized access',
    'error.serverError': 'Server error. Please try again later.',

    // Success messages
    'success.saved': 'Saved successfully',
    'success.eventCreated': 'Event created',
    'success.applicationSent': 'Application sent',
    'success.reported': 'Report submitted',
    'success.blocked': 'User blocked',
  },

  fr: {
    'nav.discover': 'Découvrir',
    'nav.nearby': 'Près de moi',
    'nav.myRequests': 'Mes Demandes',
    'nav.messages': 'Messages',
    'nav.profile': 'Profil',
    'nav.notifications': 'Notifications',

    'action.post': 'Publier',
    'action.search': 'Rechercher',
    'action.filter': 'Filtrer',
    'action.create': 'Créer',
    'action.edit': 'Modifier',
    'action.delete': 'Supprimer',
    'action.save': 'Enregistrer',
    'action.cancel': 'Annuler',
    'action.submit': 'Soumettre',
    'action.message': 'Message',
    'action.like': 'J\'aime',
    'action.decline': 'Refuser',
    'action.accept': 'Accepter',
    'action.block': 'Bloquer',
    'action.report': 'Signaler',

    'event.create': 'Créer un événement',
    'event.interested': 'Je suis intéressé',
    'event.applicationSent': 'Demande envoyée',
    'event.viewDetails': 'Voir les détails →',
    'event.location': 'Lieu',
    'event.date': 'Date',
    'event.time': 'Heure',
    'event.attendees': 'Participants',
    'event.billing': 'Facturation',
    'event.categories': 'Catégories',
    'event.expired': 'Événement expiré',
    'event.private': 'Privé',
    'event.travelMode': 'Mode voyage',

    'rating.rateHost': 'Noter l\'hôte',
    'rating.average': 'Note moyenne',
    'rating.reviews': 'Avis',
    'rating.yourRating': 'Votre note',
    'rating.outOf5': 'sur 5',

    'search.searchEvents': 'Rechercher des événements...',
    'search.category': 'Catégorie',
    'search.billingTier': 'Facturation',
    'search.date': 'Période',
    'search.distance': 'Distance',
    'search.noResults': 'Aucun événement trouvé',

    'safety.report': 'Signaler l\'utilisateur',
    'safety.block': 'Bloquer l\'utilisateur',
    'safety.unblock': 'Débloquer l\'utilisateur',
    'safety.blocked': 'Utilisateurs bloqués',
    'safety.trustedContacts': 'Contacts de confiance',
    'safety.sos': 'Alerte d\'urgence',
    'safety.anonymous': 'Le signalement est anonyme',

    'notify.newMessage': 'Nouveau message de',
    'notify.eventInvite': 'Vous avez été invité à',
    'notify.requestAccepted': 'Votre demande a été acceptée',
    'notify.requestDeclined': 'Votre demande a été refusée',
    'notify.profileShared': 'Votre profil a été partagé',

    'profile.edit': 'Modifier le profil',
    'profile.photos': 'Photos',
    'profile.videos': 'Vidéos',
    'profile.bio': 'Biographie',
    'profile.verified': 'Vérifié',
    'profile.reliability': 'Fiabilité',
    'profile.hosted': 'Événements organisés',

    'settings.language': 'Langue',
    'settings.notifications': 'Notifications',
    'settings.privacy': 'Confidentialité',
    'settings.safety': 'Sécurité',
    'settings.help': 'Aide & Support',
    'settings.logout': 'Déconnexion',

    'billing.fullyCovered': '100% couvert',
    'billing.mostlyCovered': '~75% couvert',
    'billing.splitCost': '50% couvert',
    'billing.hostMe': 'M\'héberger',
    'billing.agreement': 'Accord financier',

    'error.networkError': 'Erreur réseau. Veuillez réessayer.',
    'error.notFound': 'Non trouvé',
    'error.unauthorized': 'Accès non autorisé',
    'error.serverError': 'Erreur serveur. Veuillez réessayer plus tard.',

    'success.saved': 'Enregistré avec succès',
    'success.eventCreated': 'Événement créé',
    'success.applicationSent': 'Demande envoyée',
    'success.reported': 'Signalement soumis',
    'success.blocked': 'Utilisateur bloqué',
  },

  sw: {
    'nav.discover': 'Gundua',
    'nav.nearby': 'Karibu',
    'nav.myRequests': 'Ombi Zangu',
    'nav.messages': 'Ujumbe',
    'nav.profile': 'Wasifu',
    'nav.notifications': 'Arifa',

    'action.post': 'Chapisha',
    'action.search': 'Tafuta',
    'action.filter': 'Chujia',
    'action.create': 'Tengeneza',
    'action.edit': 'Hariri',
    'action.delete': 'Futa',
    'action.save': 'Hifadhi',
    'action.cancel': 'Ghairi',
    'action.submit': 'Wasilisha',
    'action.message': 'Ujumbe',
    'action.like': 'Napenda',
    'action.decline': 'Kataa',
    'action.accept': 'Kubali',
    'action.block': 'Zuia',
    'action.report': 'Kabidia',

    'event.create': 'Tengeneza Hafla',
    'event.interested': 'Ninatumaini',
    'event.applicationSent': 'Ombi limetumwa',
    'event.viewDetails': 'Angalia Maelezo →',
    'event.location': 'Mahali',
    'event.date': 'Tarehe',
    'event.time': 'Saa',
    'event.attendees': 'Wagombea',
    'event.billing': 'Malipo',
    'event.categories': 'Aina',
    'event.expired': 'Hafla Imemadilika',
    'event.private': 'Kibinafsi',
    'event.travelMode': 'Hali ya Safari',

    'rating.rateHost': 'Kamatia Mlezi',
    'rating.average': 'Wastani wa Kamatia',
    'rating.reviews': 'Maoni',
    'rating.yourRating': 'Kamatia Yako',
    'rating.outOf5': 'kati ya 5',

    'search.searchEvents': 'Tafuta hafla...',
    'search.category': 'Aina',
    'search.billingTier': 'Malipo',
    'search.date': 'Eneo la Tarehe',
    'search.distance': 'Umbali',
    'search.noResults': 'Hafla hazipatikani',

    'safety.report': 'Kabidia Mtumiaji',
    'safety.block': 'Zuia Mtumiaji',
    'safety.unblock': 'Ondoa Kuzuia Mtumiaji',
    'safety.blocked': 'Watumiaji Walio Zuiwa',
    'safety.trustedContacts': 'Wasiliani wa Kupigia Habari',
    'safety.sos': 'Onyo wa Dharura',
    'safety.anonymous': 'Kabidia ni kwa siri',

    'notify.newMessage': 'Ujumbe mpya kutoka kwa',
    'notify.eventInvite': 'Umwalika kwa',
    'notify.requestAccepted': 'Ombi lako limekamatika',
    'notify.requestDeclined': 'Ombi lako limekataliwa',
    'notify.profileShared': 'Wasifu wako umebagiliwa',

    'profile.edit': 'Hariri Wasifu',
    'profile.photos': 'Picha',
    'profile.videos': 'Video',
    'profile.bio': 'Wasifu',
    'profile.verified': 'Kuthibitishwa',
    'profile.reliability': 'Utegemezi',
    'profile.hosted': 'Hafla za Mlezi',

    'settings.language': 'Lugha',
    'settings.notifications': 'Arifa',
    'settings.privacy': 'Faragha',
    'settings.safety': 'Usalama',
    'settings.help': 'Msaada & Kusaidia',
    'settings.logout': 'Toka',

    'billing.fullyCovered': '100% kukamatia',
    'billing.mostlyCovered': '~75% kukamatia',
    'billing.splitCost': '50% kukamatia',
    'billing.hostMe': 'Nikamate Mtu',
    'billing.agreement': 'Mgogoro wa Fedha',

    'error.networkError': 'Hitilafu ya mtandao. Jaribu tena.',
    'error.notFound': 'Haipatikani',
    'error.unauthorized': 'Ufikiaji hauruhuswi',
    'error.serverError': 'Hitilafu ya seva. Jaribu tena baadaye.',

    'success.saved': 'Kuhifadhiwa kwa mafanikio',
    'success.eventCreated': 'Hafla iliyotengenezwa',
    'success.applicationSent': 'Ombi limetumwa',
    'success.reported': 'Kabidia iliyowasilishwa',
    'success.blocked': 'Mtumiaji auzuiwa',
  },

  ha: {
    'nav.discover': 'Gano',
    'nav.nearby': 'Kusa',
    'nav.myRequests': 'Bukatanai',
    'nav.messages': 'Saƙo',
    'nav.profile': 'Profil',
    'nav.notifications': 'Sanarwa',

    'action.post': 'Sai',
    'action.search': 'Nema',
    'action.filter': 'Tsaye',
    'action.create': 'Aiki',
    'action.edit': 'Gyara',
    'action.delete': 'Goge',
    'action.save': 'Ajiye',
    'action.cancel': 'Soke',
    'action.submit': 'Aika',
    'action.message': 'Saƙo',
    'action.like': 'Ƙauna',
    'action.decline': 'Kyale',
    'action.accept': 'Karba',
    'action.block': 'Toshe',
    'action.report': 'Kai Labari',

    'event.create': 'Aiki Taro',
    'event.interested': 'Na sha\'a',
    'event.applicationSent': 'Bukattar Kaita',
    'event.viewDetails': 'Duba Cikakken Bayanai →',
    'event.location': 'Wuri',
    'event.date': 'Jiya',
    'event.time': 'Lokaci',
    'event.attendees': 'Masu Halaka',
    'event.billing': 'Haraji',
    'event.categories': 'Abubuwan',
    'event.expired': 'Taro ya Akwai',
    'event.private': 'Sirri',
    'event.travelMode': 'Yaren Tafiya',

    'rating.rateHost': 'Sanya Mai Taro',
    'rating.average': 'Sanyi Gida',
    'rating.reviews': 'Sharhi',
    'rating.yourRating': 'Sanyen Ka',
    'rating.outOf5': 'cikin 5',

    'search.searchEvents': 'Nema taro...',
    'search.category': 'Oto',
    'search.billingTier': 'Haraji',
    'search.date': 'Lokaci',
    'search.distance': 'Nisa',
    'search.noResults': 'Babu taro',

    'safety.report': 'Kai Labarin Mai Amfani',
    'safety.block': 'Toshe Mai Amfani',
    'safety.unblock': 'Bugi Toshewa',
    'safety.blocked': 'Masu Amfanin da aka Toshe',
    'safety.trustedContacts': 'Sabani',
    'safety.sos': 'Tsoron Gaida',
    'safety.anonymous': 'Labarin sirri ne',

    'notify.newMessage': 'Saƙon Sabis daga',
    'notify.eventInvite': 'An gaida ka zuwa',
    'notify.requestAccepted': 'An karba bukatan ka',
    'notify.requestDeclined': 'An kyale bukatan ka',
    'notify.profileShared': 'An baje profil ka',

    'profile.edit': 'Gyara Profil',
    'profile.photos': 'Hotuna',
    'profile.videos': 'Bidiyo',
    'profile.bio': 'Bayanai',
    'profile.verified': 'Tabbatacce',
    'profile.reliability': 'Tabbatacce',
    'profile.hosted': 'Taroki da aka Aiki',

    'settings.language': 'Harshe',
    'settings.notifications': 'Sanarwa',
    'settings.privacy': 'Sirri',
    'settings.safety': 'Tsaro',
    'settings.help': 'Taimako & Karowa',
    'settings.logout': 'Fita',

    'billing.fullyCovered': '100% Haraji',
    'billing.mostlyCovered': '~75% Haraji',
    'billing.splitCost': '50% Haraji',
    'billing.hostMe': 'Tanadi Ni',
    'billing.agreement': 'Jiga na Kuɗi',

    'error.networkError': 'Kuskure na Saiti. Sake gwada.',
    'error.notFound': 'Ba a sani ba',
    'error.unauthorized': 'Ba a ɗauka ba',
    'error.serverError': 'Kuskure na Saiti. Sake gwada jiya.',

    'success.saved': 'Ajiyar Nasara',
    'success.eventCreated': 'An Aiki Taro',
    'success.applicationSent': 'An Aika Bukattar',
    'success.reported': 'An Aika Labarin',
    'success.blocked': 'An Toshe Mai Amfani',
  },
} as const;

type TranslationKey = keyof typeof translations.en;

export function getTranslation(language: Language, key: TranslationKey): string {
  return translations[language][key] || translations.en[key] || key;
}

export function useTranslation(language: Language) {
  return {
    t: (key: TranslationKey): string => getTranslation(language, key),
    language,
    languages: LANGUAGES,
  };
}

// Storage management
export function getStoredLanguage(): Language {
  try {
    const stored = localStorage.getItem('junto-language');
    if (stored && ['en', 'fr', 'sw', 'ha'].includes(stored)) {
      return stored as Language;
    }
  } catch (e) {
    console.error('Failed to get stored language:', e);
  }
  return 'en';
}

export function setStoredLanguage(lang: Language): void {
  try {
    localStorage.setItem('junto-language', lang);
  } catch (e) {
    console.error('Failed to store language:', e);
  }
}
