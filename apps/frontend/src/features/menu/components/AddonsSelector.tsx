import { Minus, Plus } from 'lucide-react';
import type { Addon } from '../types/menu.types';
import type { CartAddon } from '@/features/cart/store/cart.store';
import { useI18n } from '@/i18n';
import { cn } from '@/lib/utils';

interface AddonsSelectorProps {
  addons: Addon[];
  selected: CartAddon[];
  onChange: (selected: CartAddon[]) => void;
}

export function AddonsSelector({ addons, selected, onChange }: AddonsSelectorProps) {
  const { t } = useI18n();
  if (addons.length === 0) return null;

  function getQuantity(addonId: string): number {
    return selected.find((a) => a.addonId === addonId)?.quantity ?? 0;
  }

  function adjust(addon: Addon, delta: number) {
    const current = getQuantity(addon.id);
    const next = current + delta;

    if (next <= 0) {
      onChange(selected.filter((a) => a.addonId !== addon.id));
    } else if (current === 0) {
      onChange([...selected, { addonId: addon.id, name: addon.name, price: addon.price, quantity: next }]);
    } else {
      onChange(selected.map((a) => (a.addonId === addon.id ? { ...a, quantity: next } : a)));
    }
  }

  const extras = addons.filter((a) => a.addonType === 'EXTRA');
  const removals = addons.filter((a) => a.addonType === 'REMOVAL');
  const substitutions = addons.filter((a) => a.addonType === 'SUBSTITUTION');
  const sizeChanges = addons.filter((a) => a.addonType === 'SIZE_CHANGE');

  return (
    <div className="flex flex-col gap-4">
      {extras.length > 0 && (
        <AddonGroup label={t('Adicionais')} addons={extras} getQuantity={getQuantity} onAdjust={adjust} />
      )}
      {removals.length > 0 && (
        <AddonGroup label={t('Remover')} addons={removals} getQuantity={getQuantity} onAdjust={adjust} />
      )}
      {substitutions.length > 0 && (
        <AddonGroup label={t('Substituições')} addons={substitutions} getQuantity={getQuantity} onAdjust={adjust} />
      )}
      {sizeChanges.length > 0 && (
        <AddonGroup label={t('Alterar tamanho')} addons={sizeChanges} getQuantity={getQuantity} onAdjust={adjust} />
      )}
    </div>
  );
}

interface AddonGroupProps {
  label: string;
  addons: Addon[];
  getQuantity: (id: string) => number;
  onAdjust: (addon: Addon, delta: number) => void;
}

function AddonGroup({ label, addons, getQuantity, onAdjust }: AddonGroupProps) {
  const { t } = useI18n();

  return (
    <div>
      <h4 className="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-500">{label}</h4>
      <div className="flex flex-col gap-2">
        {addons.map((addon) => {
          const qty = getQuantity(addon.id);
          const isRemoval = addon.addonType === 'REMOVAL';
          return (
            <div
              key={addon.id}
              className={cn(
                'flex items-center justify-between rounded-xl border px-4 py-3 transition-colors',
                qty > 0 ? 'border-primary-300 bg-primary-50' : 'border-gray-100 bg-white',
              )}
            >
              <div className="flex flex-col">
                <span className="font-medium text-gray-800">{t(addon.name)}</span>
                {addon.price > 0 && (
                  <span className="text-sm text-primary-600">
                    +R$ {addon.price.toFixed(2).replace('.', ',')}
                  </span>
                )}
                {isRemoval && addon.price === 0 && (
                  <span className="text-sm text-gray-400">{t('sem custo')}</span>
                )}
              </div>

              <div className="flex items-center gap-3">
                {qty > 0 && (
                  <>
                    <button
                      onClick={() => onAdjust(addon, -1)}
                      className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-gray-700 transition hover:bg-gray-200 active:scale-90"
                      aria-label={t('Diminuir {name}', { name: t(addon.name) })}
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="w-6 text-center font-bold">{qty}</span>
                  </>
                )}
                <button
                  onClick={() => onAdjust(addon, 1)}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-500 text-white shadow transition hover:bg-primary-600 active:scale-90"
                  aria-label={t('Adicionar {name}', { name: t(addon.name) })}
                >
                  <Plus className="h-4 w-4" strokeWidth={3} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
