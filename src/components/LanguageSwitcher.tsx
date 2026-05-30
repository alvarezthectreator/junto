import React from 'react';
import { LANGUAGES, type Language } from '../services/i18n';
import { useLanguage } from '../context/LanguageContext';
import { Globe } from 'lucide-react';

export function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-4">
        <Globe className="w-5 h-5 text-[#F59E0B]" />
        <h3 className="font-semibold text-white">Select Language</h3>
      </div>
      
      <div className="grid grid-cols-2 gap-2">
        {(Object.entries(LANGUAGES) as [Language, typeof LANGUAGES.en][]).map(([lang, { flag, nativeName }]) => (
          <button
            key={lang}
            onClick={() => setLanguage(lang)}
            className={`relative p-4 rounded-xl border transition-all duration-300 flex flex-col items-center gap-2 ${
              language === lang
                ? 'bg-gradient-to-r from-[#F59E0B]/20 to-[#FB923C]/20 border-[#F59E0B] shadow-lg shadow-[#F59E0B]/20'
                : 'bg-white/5 border-white/10 hover:border-white/20 hover:bg-white/8'
            }`}
          >
            <span className="text-3xl">{flag}</span>
            <span className="text-sm font-semibold text-white">{nativeName}</span>
            {language === lang && (
              <span className="absolute top-2 right-2 w-2 h-2 bg-[#F59E0B] rounded-full"></span>
            )}
          </button>
        ))}
      </div>

      <div className="mt-4 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
        <p className="text-xs text-blue-200">
          💡 Your language preference is saved and will be applied across the app.
        </p>
      </div>
    </div>
  );
}
