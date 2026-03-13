import { Minus, Plus, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { CartAddon } from '@/features/cart/store/cart.store';
import { useAddons } from '@/features/menu/hooks/useMenu';
import type { Addon, MenuItem } from '@/features/menu/types/menu.types';

const INGREDIENTS_PER_PAGE = 4;

interface SelectedIngredient {
  addonId: string;
  name: string;
  basePrice: number;
  quantityToAdd: number;
  removed: boolean;
}

interface MenuItemTouchModalProps {
  item: MenuItem | null;
  open: boolean;
  onClose: () => void;
  onAddToCart: (item: MenuItem, quantity: number, addons: CartAddon[]) => void;
}

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

function formatCurrency(value: number): string {
  return value.toFixed(2).replace('.', ',');
}

function TouchAddonRow({
  addon,
  status,
  onToggleRemove,
  onChangeQuantity,
}: {
  addon: Addon;
  status: SelectedIngredient | undefined;
  onToggleRemove: (addon: Addon) => void;
  onChangeQuantity: (addon: Addon, delta: number) => void;
}) {
  const quantityToAdd = status?.quantityToAdd ?? 0;
  const isRemoved = status?.removed ?? false;

  if (addon.isRequired) {
    return (
      <button
        type="button"
        onClick={() => onToggleRemove(addon)}
        className={`w-full rounded-2xl border px-4 py-3 text-left transition-colors ${isRemoved ? 'border-red-300 bg-red-50' : 'border-stone-200 bg-white hover:bg-stone-50'}`}
      >
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className={`text-sm font-bold ${isRemoved ? 'text-red-700 line-through' : 'text-stone-900'}`}>
              {addon.name}
            </p>
            <p className="text-xs text-stone-600">
              {isRemoved ? 'Ingrediente removido' : 'Ingrediente padrão'}
            </p>
          </div>
          <span className={`inline-flex h-8 min-w-[88px] items-center justify-center rounded-xl px-3 text-xs font-bold ${isRemoved ? 'bg-red-600 text-white' : 'border border-stone-300 bg-white text-stone-700'}`}>
            {isRemoved ? 'Removido' : 'Manter'}
          </span>
        </div>
      </button>
    );
  }

  return (
    <div className={`w-full rounded-2xl border px-4 py-3 ${quantityToAdd > 0 ? 'border-primary-300 bg-primary-50' : 'border-stone-200 bg-white'}`}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-stone-900">{addon.name}</p>
          {addon.price > 0 && <p className="text-xs text-stone-600">+ R$ {formatCurrency(addon.price)}</p>}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onChangeQuantity(addon, -1)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-stone-300 bg-white text-stone-700 disabled:opacity-40"
            disabled={quantityToAdd <= 0}
            aria-label={`Remover ${addon.name}`}
          >
            <Minus size={18} />
          </button>
          <span className="w-7 text-center text-lg font-bold text-stone-900">{quantityToAdd}</span>
          <button
            type="button"
            onClick={() => onChangeQuantity(addon, 1)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary-500 text-white"
            aria-label={`Adicionar ${addon.name}`}
          >
            <Plus size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}

export function MenuItemTouchModal({ item, open, onClose, onAddToCart }: MenuItemTouchModalProps) {
  const [quantity, setQuantity] = useState(1);
  const [selectedIngredients, setSelectedIngredients] = useState<SelectedIngredient[]>([]);
  const [ingredientsPageIndex, setIngredientsPageIndex] = useState(0);
  const increaseButtonRef = useRef<HTMLButtonElement | null>(null);
  const { addons, loading: addonsLoading } = useAddons(open && item ? item.id : null);

  const removableIngredients = useMemo(() => addons.filter((addon) => addon.isRequired === true), [addons]);
  const extraIngredients = useMemo(() => addons.filter((addon) => addon.isRequired === false), [addons]);

  const isDrinkItem = item ? isDrinkName(item.name) : false;
  const hasFlavorOptions = addons.some((addon) => isFlavorAddon(addon.name));
  const hasSelectedFlavor = selectedIngredients.some((ingredient) => isFlavorAddon(ingredient.name) && ingredient.quantityToAdd > 0);
  const mustSelectFlavor = isDrinkItem && hasFlavorOptions;
  const isFlavorSelectionValid = !mustSelectFlavor || hasSelectedFlavor;

  const ingredientItems = useMemo(() => {
    return [...removableIngredients, ...extraIngredients];
  }, [removableIngredients, extraIngredients]);

  const ingredientsPagesCount = Math.max(1, Math.ceil(ingredientItems.length / INGREDIENTS_PER_PAGE));

  const paginatedIngredientItems = useMemo(() => {
    const start = ingredientsPageIndex * INGREDIENTS_PER_PAGE;
    return ingredientItems.slice(start, start + INGREDIENTS_PER_PAGE);
  }, [ingredientItems, ingredientsPageIndex]);

  useEffect(() => {
    if (!open) return;

    const frame = requestAnimationFrame(() => {
      increaseButtonRef.current?.focus();
    });

    return () => cancelAnimationFrame(frame);
  }, [open, item?.id]);

  useEffect(() => {
    if (!open) {
      setQuantity(1);
      setSelectedIngredients([]);
      setIngredientsPageIndex(0);
    }
  }, [open, item?.id]);

  useEffect(() => {
    if (ingredientsPageIndex <= ingredientsPagesCount - 1) return;
    setIngredientsPageIndex(Math.max(0, ingredientsPagesCount - 1));
  }, [ingredientsPageIndex, ingredientsPagesCount]);

  function handleClose() {
    setQuantity(1);
    setSelectedIngredients([]);
    setIngredientsPageIndex(0);
    onClose();
  }

  function handleNextIngredientsPage() {
    setIngredientsPageIndex((current) => (current + 1 >= ingredientsPagesCount ? current : current + 1));
  }

  function handlePreviousIngredientsPage() {
    setIngredientsPageIndex((current) => (current - 1 < 0 ? 0 : current - 1));
  }

  function getStatus(addon: Addon) {
    return selectedIngredients.find((selected) => selected.addonId === addon.id);
  }

  function toggleRemove(addon: Addon) {
    const existing = getStatus(addon);

    if (existing) {
      const updated = { ...existing, removed: !existing.removed };
      setSelectedIngredients((current) => current.map((entry) => (entry.addonId === addon.id ? updated : entry)));
      return;
    }

    setSelectedIngredients((current) => ([
      ...current,
      {
        addonId: addon.id,
        name: addon.name,
        basePrice: addon.price,
        quantityToAdd: 0,
        removed: true,
      },
    ]));
  }

  function updateQuantityToAdd(addon: Addon, delta: number) {
    const existing = getStatus(addon);
    const isFlavorOption = isFlavorAddon(addon.name);
    const rawNext = (existing?.quantityToAdd ?? 0) + delta;
    const newQuantity = isFlavorOption ? (rawNext > 0 ? 1 : 0) : Math.max(0, rawNext);

    if (isFlavorOption && newQuantity > 0) {
      const flavorIds = new Set(addons.filter((entry) => isFlavorAddon(entry.name)).map((entry) => entry.id));
      const cleaned = selectedIngredients.filter((entry) => !flavorIds.has(entry.addonId)).map((entry) => ({ ...entry }));

      if (existing) {
        setSelectedIngredients([...cleaned, { ...existing, quantityToAdd: 1, removed: false }]);
      } else {
        setSelectedIngredients([
          ...cleaned,
          {
            addonId: addon.id,
            name: addon.name,
            basePrice: addon.price,
            quantityToAdd: 1,
            removed: false,
          },
        ]);
      }
      return;
    }

    if (newQuantity === 0 && (!existing || existing.quantityToAdd === 0)) {
      setSelectedIngredients((current) => current.filter((entry) => entry.addonId !== addon.id));
      return;
    }

    if (existing) {
      const updated = { ...existing, quantityToAdd: newQuantity, removed: false };
      setSelectedIngredients((current) => current.map((entry) => (entry.addonId === addon.id ? updated : entry)));
      return;
    }

    if (newQuantity > 0) {
      setSelectedIngredients((current) => ([
        ...current,
        {
          addonId: addon.id,
          name: addon.name,
          basePrice: addon.price,
          quantityToAdd: newQuantity,
          removed: false,
        },
      ]));
    }
  }

  function calcTotal(): number {
    if (!item) return 0;

    const basePrice = item.price * quantity;
    const addonsPrice = selectedIngredients
      .filter((ingredient) => ingredient.quantityToAdd > 0)
      .reduce((sum, ingredient) => sum + ingredient.basePrice * ingredient.quantityToAdd, 0) * quantity;

    return basePrice + addonsPrice;
  }

  function handleAdd() {
    if (!item || !isFlavorSelectionValid) return;

    const cartAddons: CartAddon[] = selectedIngredients
      .filter((ingredient) => ingredient.quantityToAdd > 0 || ingredient.removed)
      .map((ingredient) => ({
        addonId: ingredient.addonId,
        name: ingredient.name,
        price: ingredient.basePrice,
        quantity: ingredient.quantityToAdd,
        removed: ingredient.removed,
      }));

    onAddToCart(item, quantity, cartAddons);
    handleClose();
  }

  if (!item) return null;

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && handleClose()}>
      <DialogContent
        className="h-[88vh] w-[95vw] max-w-[980px] overflow-hidden rounded-[2rem] border border-stone-200 p-0"
        onOpenAutoFocus={(event) => {
          event.preventDefault();
          increaseButtonRef.current?.focus();
        }}
      >
        <DialogHeader className="border-b border-stone-200 bg-white px-5 py-4">
          <DialogTitle className="text-xl font-bold text-stone-900">{item.name}</DialogTitle>
          <DialogDescription className="sr-only">
            Modal touch para personalizar item, quantidade e ingredientes antes de adicionar ao pedido.
          </DialogDescription>
        </DialogHeader>

        <div className="grid h-[calc(88vh-168px)] grid-cols-1 gap-4 overflow-hidden bg-stone-50 p-4 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <div className="min-h-0 overflow-hidden rounded-3xl border border-stone-200 bg-white p-4">
            <div className="flex items-start gap-4">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-orange-50 text-4xl">
                {item.imageUrl ? (
                  <img src={item.imageUrl} alt={item.name} className="h-full w-full object-cover" />
                ) : (
                  item.icon ?? '🍔'
                )}
              </div>

              <div>
                {item.description && <p className="text-sm leading-6 text-stone-700">{item.description}</p>}
                <p className="mt-2 text-3xl font-bold text-primary-600">R$ {formatCurrency(item.price)}</p>
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-stone-200 bg-stone-50 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-stone-600">Quantidade</p>
              <div className="mt-2 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setQuantity((current) => Math.max(1, current - 1))}
                  className="inline-flex h-12 w-12 items-center justify-center rounded-xl border border-stone-300 bg-white text-stone-700 disabled:opacity-40"
                  disabled={quantity <= 1}
                  aria-label="Diminuir quantidade"
                >
                  <Minus size={20} />
                </button>

                <span className="min-w-[64px] text-center text-3xl font-bold text-stone-900">{quantity}</span>

                <button
                  ref={increaseButtonRef}
                  type="button"
                  onClick={() => setQuantity((current) => current + 1)}
                  className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary-500 text-white"
                  aria-label="Aumentar quantidade"
                >
                  <Plus size={20} />
                </button>
              </div>
            </div>

            {addonsLoading ? (
              <div className="mt-4 rounded-2xl border border-stone-200 bg-stone-50 p-4 text-sm text-stone-500">
                Carregando adicionais...
              </div>
            ) : (
              <div className="mt-4 h-[364px] rounded-2xl border border-stone-200 bg-stone-50 p-3">
                {ingredientItems.length === 0 ? (
                  <div className="grid h-full place-items-center text-sm text-stone-500">
                    Este item não possui personalizações.
                  </div>
                ) : (
                  <div className="flex h-full flex-col">
                    <div className="mb-2 flex items-center justify-between">
                      <p className="text-xs font-bold uppercase tracking-wide text-stone-700">
                        Personalização
                      </p>
                      <div className="inline-flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-2 py-1 text-xs font-semibold text-stone-700">
                        <button
                          type="button"
                          onClick={handlePreviousIngredientsPage}
                          disabled={ingredientsPageIndex === 0}
                          className="rounded-md border border-stone-200 px-2 py-0.5 disabled:opacity-40"
                        >
                          Anterior
                        </button>
                        <span>{ingredientsPageIndex + 1}/{ingredientsPagesCount}</span>
                        <button
                          type="button"
                          onClick={handleNextIngredientsPage}
                          disabled={ingredientsPageIndex + 1 >= ingredientsPagesCount}
                          className="rounded-md border border-stone-200 px-2 py-0.5 disabled:opacity-40"
                        >
                          Próxima
                        </button>
                      </div>
                    </div>

                    <div className="grid flex-1 grid-rows-4 gap-2 overflow-hidden">
                      {paginatedIngredientItems.map((addon) => (
                        <TouchAddonRow
                          key={addon.id}
                          addon={addon}
                          status={getStatus(addon)}
                          onToggleRemove={toggleRemove}
                          onChangeQuantity={updateQuantityToAdd}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {mustSelectFlavor && !hasSelectedFlavor && (
              <p className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">
                Para bebida, escolha um sabor antes de adicionar.
              </p>
            )}
          </div>

          <aside className="flex flex-col rounded-3xl border border-stone-200 bg-white p-4">
            <h4 className="text-sm font-bold uppercase tracking-wide text-stone-700">Resumo</h4>
            <p className="mt-2 text-sm text-stone-600">Confira o total e confirme para incluir no pedido.</p>

            <div className="mt-4 rounded-2xl bg-primary-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-primary-700">Total deste item</p>
              <p className="mt-1 text-3xl font-bold text-primary-700">R$ {formatCurrency(calcTotal())}</p>
            </div>

            <div className="mt-3 rounded-2xl border border-stone-200 bg-stone-50 p-3 text-sm text-stone-700">
              Quantidade: <span className="font-bold text-stone-900">{quantity}</span>
            </div>

            <button
              type="button"
              onClick={handleAdd}
              disabled={!isFlavorSelectionValid}
              className="mt-auto w-full rounded-2xl bg-primary-500 px-4 py-3.5 text-base font-bold text-white transition-colors hover:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Adicionar ao pedido
            </button>

            <button
              type="button"
              onClick={handleClose}
              className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-stone-300 px-4 py-3 text-sm font-semibold text-stone-700"
            >
              <X size={16} />
              Cancelar
            </button>
          </aside>
        </div>
      </DialogContent>
    </Dialog>
  );
}
