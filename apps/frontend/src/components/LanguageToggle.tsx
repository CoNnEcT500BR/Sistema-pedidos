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
        className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${language === 'pt' ? 'bg-primary-500 text-white' : 'text-gray-600 hover:text-gray-900'}`}
      >
        PT
      </button>
      <button
        type="button"
        onClick={() => setLanguage('en')}
        className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${language === 'en' ? 'bg-primary-500 text-white' : 'text-gray-600 hover:text-gray-900'}`}
      >
        EN
      </button>
    </div>
  );
}
