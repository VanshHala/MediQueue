import React, { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';

export default function LanguageSelector() {
  const { lang, changeLanguage, languages } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentLang = languages.find((l) => l.code === lang) || languages[0];

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="h-9 px-2.5 sm:px-3 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500/20"
        title="Change Language / ભાષા બદલો / भाषा बदलें"
      >
        <span className="material-symbols-outlined text-[17px] text-teal-700">translate</span>
        <span className="hidden sm:inline font-medium text-slate-800">{currentLang.label}</span>
        <span className="sm:hidden font-bold text-teal-800">{currentLang.short}</span>
        <span className="material-symbols-outlined text-[15px] text-slate-400">expand_more</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1.5 w-44 rounded-xl bg-white shadow-lg border border-slate-200 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
          <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100">
            Select Language
          </div>
          {languages.map((item) => {
            const isSelected = item.code === lang;
            return (
              <button
                key={item.code}
                onClick={() => {
                  changeLanguage(item.code);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-3.5 py-2 text-xs flex items-center justify-between transition-colors ${
                  isSelected
                    ? 'bg-teal-50 font-bold text-teal-800'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${isSelected ? 'bg-teal-600' : 'bg-transparent'}`}></span>
                  <span>{item.label}</span>
                </div>
                <span className="text-[11px] font-mono text-slate-400 uppercase font-semibold">{item.short}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
