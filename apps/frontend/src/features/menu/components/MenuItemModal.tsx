import { Minus, Plus } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { CartAddon } from '@/features/cart/store/cart.store';
import type { MenuItem } from '../types/menu.types';
import { useAddons } from '../hooks/useMenu';
import { IngredientsEditor, type SelectedIngredient } from './IngredientsEditor';
import { useI18n } from '@/i18n';

function isDrinkName(name: string): boolean {
  const lower = name.toLowerCase();
  return (
    lower.includes('refrigerante') ||
    lower.includes('suco') ||
    lower.includes('cha gelado') ||
    lower.includes('agua mineral') ||
    lower.includes('milkshake')
  );
}

function isFlavorAddon(name: string): boolean {
  return name.toLowerCase().startsWith('sabor ');
}

interface MenuItemModalProps {
  item: MenuItem | null;
  open: boolean;
  onClose: () => void;
  onAddToCart: (item: MenuItem, quantity: number, addons: CartAddon[]) => void;
}

export function MenuItemModal({ item, open, onClose, onAddToCart }: MenuItemModalProps) {
  const { t } = useI18n();
  const [quantity, setQuantity] = useState(1);
  const [selectedIngredients, setSelectedIngredients] = useState<SelectedIngredient[]>([]);
  const increaseButtonRef = useRef<HTMLButtonElement | null>(null);
  const { addons, loading: addonsLoading } = useAddons(open && item ? item.id : null);
  const isDrinkItem = item ? isDrinkName(item.name) : false;
  const hasFlavorOptions = addons.some((addon) => isFlavorAddon(addon.name));
  const hasSelectedFlavor = selectedIngredients.some(
    (ingredient) => isFlavorAddon(ingredient.name) && ingredient.quantityToAdd > 0,
  );
  const mustSelectFlavor = isDrinkItem && hasFlavorOptions;
  const isFlavorSelectionValid = !mustSelectFlavor || hasSelectedFlavor;

  useEffect(() => {
    if (!open) return;

    const frame = requestAnimationFrame(() => {
      increaseButtonRef.current?.focus();
    });

    return () => cancelAnimationFrame(frame);
  }, [open, item?.id]);

  function handleClose() {
    setQuantity(1);
    setSelectedIngredients([]);
    onClose();
  }

  function handleAdd() {
    if (!item) return;

    // Converter selectedIngredients em CartAddons apenas para os que estão sendo adicionados/aumentados
    const cartAddons: CartAddon[] = selectedIngredients
      .filter((ing) => ing.quantityToAdd > 0 || ing.removed)
      .map((ing) => ({
        addonId: ing.addonId,
        name: ing.name,
        price: ing.basePrice,
        quantity: ing.quantityToAdd,
        removed: ing.removed,
      }));

    if (!isFlavorSelectionValid) {
      return;
    }

    onAddToCart(item, quantity, cartAddons);
    handleClose();
  }

  function calcTotal(): number {
    if (!item) return 0;

    // Preço base do item não muda (remover ingredientes não afeta)
    const basePrice = item.price * quantity;

    // Adicionar apenas os adicionais (ingredientes com quantityToAdd > 0)
    const addonsPrice = selectedIngredients
      .filter((ing) => ing.quantityToAdd > 0)
      .reduce((sum, ing) => sum + ing.basePrice * ing.quantityToAdd, 0) * quantity;

    return basePrice + addonsPrice;
  }

  if (!item) return null;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent
        className="max-h-[90vh] overflow-y-auto p-0 sm:max-w-lg"
        onOpenAutoFocus={(event) => {
          event.preventDefault();
          increaseButtonRef.current?.focus();
        }}
      >
        {/* Cabeçalho */}
        <DialogHeader className="sticky top-0 z-10 border-b border-gray-100 bg-white px-6 py-4">
          <DialogTitle className="text-xl font-bold text-gray-900">{t(item.name)}</DialogTitle>
          <DialogDescription className="sr-only">
            {t('Modal de personalizacao do item {name}. Ajuste ingredientes e quantidade antes de adicionar ao carrinho.', { name: t(item.name) })}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-5 px-6 pb-6 pt-4">
          {/* Imagem e descrição */}
          <div className="flex items-center gap-4">
            <div className="flex h-24 w-24 flex-shrink-0 items-center justify-center rounded-xl bg-orange-50 text-5xl shadow-sm">
              {item.imageUrl ? (
                <img src={item.imageUrl} alt={t(item.name)} className="h-full w-full rounded-xl object-cover" />
              ) : (
                '🍽️'
              )}
            </div>
            <div className="flex flex-col gap-1">
              {item.description && (
                <p className="text-sm text-gray-600">{t(item.description)}</p>
              )}
              <span className="text-2xl font-bold text-primary-600">
                R$ {item.price.toFixed(2).replace('.', ',')}
              </span>
            </div>
          </div>

          {/* Ingredientes */}
          {addonsLoading ? (
            <div className="flex items-center gap-2 text-gray-400">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-primary-500" />
              <span className="text-sm">{t('Carregando ingredientes...')}</span>
            </div>
          ) : (
            addons.length > 0 && (
              <IngredientsEditor
                addons={addons}
                selected={selectedIngredients}
                onChange={setSelectedIngredients}
              />
            )
          )}

          {mustSelectFlavor && !hasSelectedFlavor && (
            <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
              {t('Escolha obrigatoriamente um sabor para a bebida.')}
            </p>
          )}

          {/* Quantidade */}
          <div className="flex items-center justify-between">
            <span className="text-base font-semibold text-gray-700">{t('Quantidade')}</span>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="flex h-11 w-11 items-center justify-center rounded-full bg-gray-100 text-gray-700 transition hover:bg-gray-200 active:scale-90 disabled:opacity-40"
                disabled={quantity <= 1}
                aria-label={t('Diminuir quantidade')}
              >
                <Minus className="h-5 w-5" />
              </button>
              <span className="w-8 text-center text-2xl font-bold text-gray-900">{quantity}</span>
              <button
                ref={increaseButtonRef}
                onClick={() => setQuantity((q) => q + 1)}
                className="flex h-11 w-11 items-center justify-center rounded-full bg-primary-500 text-white shadow transition hover:bg-primary-600 active:scale-90"
                aria-label={t('Aumentar quantidade')}
              >
                <Plus className="h-5 w-5" strokeWidth={3} />
              </button>
            </div>
          </div>

          {/* Botão confirmar */}
          <button
            onClick={handleAdd}
            disabled={!isFlavorSelectionValid}
            className="flex w-full items-center justify-between rounded-2xl bg-primary-500 px-6 py-4 text-white shadow-md transition hover:bg-primary-600 active:scale-[0.98] focus:outline-none focus-visible:ring-4 focus-visible:ring-primary-300"
          >
            <span className="text-lg font-bold">{t('Adicionar ao Carrinho')}</span>
            <span className="text-lg font-bold">
              R$ {calcTotal().toFixed(2).replace('.', ',')}
            </span>
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
