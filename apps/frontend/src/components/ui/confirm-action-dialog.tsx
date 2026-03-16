import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useI18n } from '@/i18n';

interface ConfirmActionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  description: string;
  contextLabel?: string;
  severity?: 'danger' | 'warning';
  confirmLabel?: string;
  loading?: boolean;
}

export function ConfirmActionDialog({
  open,
  onOpenChange,
  onConfirm,
  title,
  description,
  contextLabel,
  severity = 'danger',
  confirmLabel,
  loading = false,
}: ConfirmActionDialogProps) {
  const { t } = useI18n();

  const styles =
    severity === 'warning'
      ? {
          stripe: 'bg-amber-500',
          badge: 'border-amber-200 bg-amber-50 text-amber-800',
          action: 'bg-amber-600 hover:bg-amber-700',
        }
      : {
          stripe: 'bg-red-600',
          badge: 'border-red-200 bg-red-50 text-red-700',
          action: 'bg-red-600 hover:bg-red-700',
        };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-2xl p-0">
        <div className={`h-1.5 w-full ${styles.stripe}`} />
        <DialogHeader className="border-b border-stone-200 px-6 py-5">
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
          {contextLabel ? (
            <p className={`mt-2 rounded-xl border px-3 py-2 text-sm font-medium ${styles.badge}`}>
              {contextLabel}
            </p>
          ) : null}
        </DialogHeader>

        <DialogFooter className="border-t border-stone-200 px-6 py-5">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="rounded-2xl border border-stone-200 px-4 py-2.5 text-sm font-semibold text-stone-700 transition hover:bg-stone-100"
            disabled={loading}
          >
            {t('Cancelar')}
          </button>
          <button
            type="button"
            onClick={() => onConfirm()}
            disabled={loading}
            className={`rounded-2xl px-4 py-2.5 text-sm font-semibold text-white transition disabled:opacity-60 ${styles.action}`}
          >
            {loading ? t('Processando...') : confirmLabel ?? t('Remover')}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
