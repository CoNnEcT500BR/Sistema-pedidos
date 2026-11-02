import { useI18n } from '@/i18n';

interface LanguageToggleProps {
  className?: string;
}

export function LanguageToggle({ className }: LanguageToggleProps) {
  const { language, setLanguage } = useI18n();
  const containerClassName = className
    ?? 'fixed right-3 top-3 z-[120] inline-flex rounded-xl border border-gray-200 bg-white/95 p-1 shadow-md backdrop-blur';

  return (
    <div className={containerClassName}>
      <button
        type="button"
        onClick={() => setLanguage('pt')}
        aria-pressed={language === 'pt'}
        className={`touch-target min-w-11 rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${language === 'pt' ? 'bg-primary-700 text-white' : 'text-gray-700 hover:text-gray-900'}`}
      >
        PT
      </button>
      <button
        type="button"
        onClick={() => setLanguage('en')}
        aria-pressed={language === 'en'}
        className={`touch-target min-w-11 rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${language === 'en' ? 'bg-primary-700 text-white' : 'text-gray-700 hover:text-gray-900'}`}
      >
        EN
      </button>
    </div>
  );
}
