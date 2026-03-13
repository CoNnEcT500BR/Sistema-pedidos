import { useI18n } from '@/i18n';

export function KioskPage() {
  const { t } = useI18n();
  return <h2 className="text-2xl font-bold">{t('Kiosk')}</h2>;
}
