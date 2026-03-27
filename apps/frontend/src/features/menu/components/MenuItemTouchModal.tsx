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
import { useI18n } from '@/i18n';

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

type SizeSuffix = 'P' | 'M' | 'G';

const sizeRank: Record<SizeSuffix, number> = {
  P: 0,
  M: 1,
  G: 2,
};

function getSizeSuffix(value: string | undefined): SizeSuffix | null {
  if (!value) return null;
  const match = value.match(/\s([PMG])$/);
  return (match?.[1] as SizeSuffix | undefined) ?? null;
}

function isAllowedSizeChange(addonName: string, itemName: string): boolean {
  const sourceSize = getSizeSuffix(itemName);
  const targetSize = getSizeSuffix(addonName);

  if (!sourceSize || !targetSize) {
    return true;
  }

  return sizeRank[targetSize] > sizeRank[sourceSize];
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

function normalizeScopeSource(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function isBurgerBuildItem(item?: MenuItem | null): boolean {
  if (!item) return false;
  const value = normalizeScopeSource(`${item.category?.name ?? ''} ${item.name}`);
  return /(criacao|criar|monte|personaliz|custom)/.test(value) && /(hamburg|burger|lanche|sanduiche)/.test(value);
}

function formatCurrency(value: number): string {
  return value.toFixed(2).replace('.', ',');
}

function isAssemblyIngredient(addon: Addon): boolean {
  if (addon.assignmentType) {
    return addon.assignmentType === 'ASSEMBLY';
  }

  return addon.isRequired === true;
}

function isBreadIngredient(addon: Addon): boolean {
  return addon.assignmentType === 'BREAD';
}

function isExtraIngredient(addon: Addon): boolean {
  if (addon.assignmentType) {
    return addon.assignmentType === 'EXTRA';
  }

  return addon.isRequired !== true;
}

function isSizeChangeIngredient(addon: Addon): boolean {
  return addon.addonType === 'SIZE_CHANGE';
}

function isFlavorIngredient(addon: Addon): boolean {
  return isFlavorAddon(addon.name);
}

function TouchAddonRow({
  addon,
  status,
  onToggleRemove,
  onSelectBread,
  onSelectFlavor,
  onSelectSizeUpgrade,
  onChangeQuantity,
}: {
  addon: Addon;
  status: SelectedIngredient | undefined;
  onToggleRemove: (addon: Addon) => void;
  onSelectBread: (addon: Addon) => void;
  onSelectFlavor: (addon: Addon) => void;
  onSelectSizeUpgrade: (addon: Addon) => void;
  onChangeQuantity: (addon: Addon, delta: number) => void;
}) {
  const { t } = useI18n();
  const quantityToAdd = status?.quantityToAdd ?? 0;
  const isRemoved = status?.removed ?? false;

  if (isAssemblyIngredient(addon)) {
    return (
      <button
        type="button"
        onClick={() => onToggleRemove(addon)}
        className={`w-full rounded-2xl border px-4 py-3 text-left transition-colors ${isRemoved ? 'border-red-300 bg-red-50' : 'border-stone-200 bg-white hover:bg-stone-50'}`}
      >
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className={`text-sm font-bold ${isRemoved ? 'text-red-700 line-through' : 'text-stone-900'}`}>
              {t(addon.name)}
            </p>
            <p className="text-xs text-stone-600">
              {isRemoved ? t('Ingrediente removido') : t('Ingrediente padrão')}
            </p>
          </div>
          <span className={`inline-flex h-8 min-w-[88px] items-center justify-center rounded-xl px-3 text-xs font-bold ${isRemoved ? 'bg-red-600 text-white' : 'border border-stone-300 bg-white text-stone-700'}`}>
            {isRemoved ? t('Removido') : t('Manter')}
          </span>
        </div>
      </button>
    );
  }

  if (isBreadIngredient(addon)) {
    const isSelectedBread = quantityToAdd > 0;
    return (
      <button
        type="button"
        onClick={() => onSelectBread(addon)}
        className={`w-full rounded-2xl border px-4 py-3 text-left transition-colors ${isSelectedBread ? 'border-primary-300 bg-primary-50' : 'border-stone-200 bg-white hover:bg-stone-50'}`}
      >
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-bold text-stone-900">{t(addon.name)}</p>
            {addon.price > 0 ? <p className="text-xs text-stone-600">+ R$ {formatCurrency(addon.price)}</p> : null}
          </div>
          <span className={`inline-flex h-8 min-w-[88px] items-center justify-center rounded-xl px-3 text-xs font-bold ${isSelectedBread ? 'bg-primary-600 text-white' : 'border border-stone-300 bg-white text-stone-700'}`}>
            {isSelectedBread ? t('Selecionado') : t('Selecionar')}
          </span>
        </div>
      </button>
    );
  }

  if (isFlavorIngredient(addon)) {
    const isSelectedFlavor = quantityToAdd > 0;
    return (
      <button
        type="button"
        onClick={() => onSelectFlavor(addon)}
        className={`w-full rounded-2xl border px-4 py-3 text-left transition-colors ${isSelectedFlavor ? 'border-primary-300 bg-primary-50' : 'border-stone-200 bg-white hover:bg-stone-50'}`}
      >
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-bold text-stone-900">{t(addon.name)}</p>
            {addon.price > 0 ? <p className="text-xs text-stone-600">+ R$ {formatCurrency(addon.price)}</p> : null}
          </div>
          <span className={`inline-flex h-8 min-w-[88px] items-center justify-center rounded-xl px-3 text-xs font-bold ${isSelectedFlavor ? 'bg-primary-600 text-white' : 'border border-stone-300 bg-white text-stone-700'}`}>
            {isSelectedFlavor ? t('Selecionado') : t('Selecionar')}
          </span>
        </div>
      </button>
    );
  }

  if (isSizeChangeIngredient(addon)) {
    const isSelectedUpgrade = quantityToAdd > 0;
    return (
      <button
        type="button"
        onClick={() => onSelectSizeUpgrade(addon)}
        className={`w-full rounded-2xl border px-4 py-3 text-left transition-colors ${isSelectedUpgrade ? 'border-primary-300 bg-primary-50' : 'border-stone-200 bg-white hover:bg-stone-50'}`}
      >
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-bold text-stone-900">{t(addon.name)}</p>
            {addon.price > 0 ? <p className="text-xs text-stone-600">+ R$ {formatCurrency(addon.price)}</p> : null}
          </div>
          <span className={`inline-flex h-8 min-w-[88px] items-center justify-center rounded-xl px-3 text-xs font-bold ${isSelectedUpgrade ? 'bg-primary-600 text-white' : 'border border-stone-300 bg-white text-stone-700'}`}>
            {isSelectedUpgrade ? t('Selecionado') : t('Selecionar')}
          </span>
        </div>
      </button>
    );
  }

  return (
    <div className={`w-full rounded-2xl border px-4 py-3 ${quantityToAdd > 0 ? 'border-primary-300 bg-primary-50' : 'border-stone-200 bg-white'}`}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-stone-900">{t(addon.name)}</p>
          {addon.price > 0 && <p className="text-xs text-stone-600">+ R$ {formatCurrency(addon.price)}</p>}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onChangeQuantity(addon, -1)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-stone-300 bg-white text-stone-700 disabled:opacity-40"
            disabled={quantityToAdd <= 0}
            aria-label={t('Remover {name}', { name: t(addon.name) })}
          >
            <Minus size={18} />
          </button>
          <span className="w-7 text-center text-lg font-bold text-stone-900">{quantityToAdd}</span>
          <button
            type="button"
            onClick={() => onChangeQuantity(addon, 1)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary-500 text-white"
            aria-label={t('Adicionar {name}', { name: t(addon.name) })}
          >
            <Plus size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}

export function MenuItemTouchModal({ item, open, onClose, onAddToCart }: MenuItemTouchModalProps) {
  const { t } = useI18n();
  const [quantity, setQuantity] = useState(1);
  const [selectedIngredients, setSelectedIngredients] = useState<SelectedIngredient[]>([]);
  const [ingredientsPageIndex, setIngredientsPageIndex] = useState(0);
  const increaseButtonRef = useRef<HTMLButtonElement | null>(null);
  const { addons, loading: addonsLoading } = useAddons(open && item ? item.id : null);
  const availableAddons = useMemo(() => {
    let scopedAddons = addons;

    if (isBurgerBuildItem(item)) {
      scopedAddons = addons.filter((addon) => addon.addonType !== 'EXTRA' && addon.addonType !== 'SIZE_CHANGE');
    }

    if (!item) {
      return scopedAddons;
    }

    return scopedAddons.filter(
      (addon) => addon.addonType !== 'SIZE_CHANGE' || isAllowedSizeChange(addon.name, item.name),
    );
  }, [addons, item]);

  const removableIngredients = useMemo(
    () => availableAddons.filter((addon) => isAssemblyIngredient(addon)),
    [availableAddons],
  );
  const breadIngredients = useMemo(
    () => availableAddons.filter((addon) => isBreadIngredient(addon)),
    [availableAddons],
  );
  const flavorIngredients = useMemo(
    () => availableAddons.filter((addon) => isFlavorIngredient(addon)),
    [availableAddons],
  );
  const sizeUpgradeIngredients = useMemo(
    () => availableAddons.filter((addon) => isSizeChangeIngredient(addon)),
    [availableAddons],
  );
  const extraIngredients = useMemo(
    () =>
      availableAddons.filter(
        (addon) =>
          isExtraIngredient(addon) && !isFlavorIngredient(addon) && !isSizeChangeIngredient(addon),
      ),
    [availableAddons],
  );

  const isDrinkItem = item ? isDrinkName(item.name) : false;
  const hasFlavorOptions = flavorIngredients.length > 0;
  const hasSelectedFlavor = selectedIngredients.some(
    (ingredient) => flavorIngredients.some((flavor) => flavor.id === ingredient.addonId) && ingredient.quantityToAdd > 0,
  );
  const hasSelectedBread = selectedIngredients.some(
    (ingredient) => breadIngredients.some((bread) => bread.id === ingredient.addonId) && ingredient.quantityToAdd > 0,
  );
  const mustSelectFlavor = isDrinkItem && hasFlavorOptions;
  const mustSelectBread = breadIngredients.length > 1;
  const isFlavorSelectionValid = !mustSelectFlavor || hasSelectedFlavor;
  const isBreadSelectionValid = !mustSelectBread || hasSelectedBread;
  const isSelectionValid = isFlavorSelectionValid && isBreadSelectionValid;

  const ingredientItems = useMemo(() => {
    return [
      ...removableIngredients,
      ...breadIngredients,
      ...flavorIngredients,
      ...sizeUpgradeIngredients,
      ...extraIngredients,
    ];
  }, [removableIngredients, breadIngredients, flavorIngredients, sizeUpgradeIngredients, extraIngredients]);

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

  useEffect(() => {
    if (!open || breadIngredients.length !== 1) {
      return;
    }

    const singleBread = breadIngredients[0];
    const alreadySelected = selectedIngredients.some(
      (ingredient) => ingredient.addonId === singleBread.id && ingredient.quantityToAdd > 0,
    );

    if (alreadySelected) {
      return;
    }

    const breadIds = new Set(breadIngredients.map((ingredient) => ingredient.id));
    const withoutBread = selectedIngredients.filter((ingredient) => !breadIds.has(ingredient.addonId));

    setSelectedIngredients([
      ...withoutBread,
      {
        addonId: singleBread.id,
        name: singleBread.name,
        basePrice: singleBread.price,
        quantityToAdd: 1,
        removed: false,
      },
    ]);
  }, [breadIngredients, open, selectedIngredients]);

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

  function selectBread(addon: Addon) {
    const breadIds = new Set(breadIngredients.map((ingredient) => ingredient.id));
    const cleaned = selectedIngredients.filter((entry) => !breadIds.has(entry.addonId)).map((entry) => ({ ...entry }));

    const alreadySelected = selectedIngredients.some(
      (entry) => entry.addonId === addon.id && entry.quantityToAdd > 0,
    );

    if (alreadySelected) {
      setSelectedIngredients(cleaned);
      return;
    }

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

  function selectFlavor(addon: Addon) {
    const flavorIds = new Set(flavorIngredients.map((ingredient) => ingredient.id));
    const cleaned = selectedIngredients.filter((entry) => !flavorIds.has(entry.addonId)).map((entry) => ({ ...entry }));

    const alreadySelected = selectedIngredients.some(
      (entry) => entry.addonId === addon.id && entry.quantityToAdd > 0,
    );

    if (alreadySelected) {
      setSelectedIngredients(cleaned);
      return;
    }

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

  function selectSizeUpgrade(addon: Addon) {
    const sizeUpgradeIds = new Set(sizeUpgradeIngredients.map((ingredient) => ingredient.id));
    const cleaned = selectedIngredients.filter((entry) => !sizeUpgradeIds.has(entry.addonId)).map((entry) => ({ ...entry }));

    const alreadySelected = selectedIngredients.some(
      (entry) => entry.addonId === addon.id && entry.quantityToAdd > 0,
    );

    if (alreadySelected) {
      setSelectedIngredients(cleaned);
      return;
    }

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

  function updateQuantityToAdd(addon: Addon, delta: number) {
    const existing = getStatus(addon);
    const newQuantity = Math.max(0, (existing?.quantityToAdd ?? 0) + delta);

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
    if (!item || !isSelectionValid) return;

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
          <DialogTitle className="text-xl font-bold text-stone-900">{t(item.name)}</DialogTitle>
          <DialogDescription className="sr-only">
            {t('Modal touch para personalizar item, quantidade e ingredientes antes de adicionar ao pedido.')}
          </DialogDescription>
        </DialogHeader>

        <div className="grid h-[calc(88vh-168px)] grid-cols-1 gap-4 overflow-hidden bg-stone-50 p-4 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <div className="min-h-0 overflow-hidden rounded-3xl border border-stone-200 bg-white p-4">
            <div className="flex items-start gap-4">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-orange-50 text-4xl">
                {item.imageUrl ? (
                  <img src={item.imageUrl} alt={t(item.name)} className="h-full w-full object-cover" />
                ) : (
                  item.icon ?? '🍔'
                )}
              </div>

              <div>
                {item.description && <p className="text-sm leading-6 text-stone-700">{t(item.description)}</p>}
                <p className="mt-2 text-3xl font-bold text-primary-600">R$ {formatCurrency(item.price)}</p>
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-stone-200 bg-stone-50 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-stone-600">{t('Quantidade')}</p>
              <div className="mt-2 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setQuantity((current) => Math.max(1, current - 1))}
                  className="inline-flex h-12 w-12 items-center justify-center rounded-xl border border-stone-300 bg-white text-stone-700 disabled:opacity-40"
                  disabled={quantity <= 1}
                  aria-label={t('Diminuir quantidade')}
                >
                  <Minus size={20} />
                </button>

                <span className="min-w-[64px] text-center text-3xl font-bold text-stone-900">{quantity}</span>

                <button
                  ref={increaseButtonRef}
                  type="button"
                  onClick={() => setQuantity((current) => current + 1)}
                  className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary-500 text-white"
                  aria-label={t('Aumentar quantidade')}
                >
                  <Plus size={20} />
                </button>
              </div>
            </div>

            {addonsLoading ? (
              <div className="mt-4 rounded-2xl border border-stone-200 bg-stone-50 p-4 text-sm text-stone-500">
                {t('Carregando adicionais...')}
              </div>
            ) : (
              <div className="mt-4 h-[364px] rounded-2xl border border-stone-200 bg-stone-50 p-3">
                {ingredientItems.length === 0 ? (
                  <div className="grid h-full place-items-center text-sm text-stone-500">
                    {t('Este item não possui personalizações.')}
                  </div>
                ) : (
                  <div className="flex h-full flex-col">
                    <div className="mb-2 flex items-center justify-between">
                      <p className="text-xs font-bold uppercase tracking-wide text-stone-700">
                        {t('Personalização')}
                      </p>
                      <div className="inline-flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-2 py-1 text-xs font-semibold text-stone-700">
                        <button
                          type="button"
                          onClick={handlePreviousIngredientsPage}
                          disabled={ingredientsPageIndex === 0}
                          className="rounded-md border border-stone-200 px-2 py-0.5 disabled:opacity-40"
                        >
                          {t('Anterior')}
                        </button>
                        <span>{ingredientsPageIndex + 1}/{ingredientsPagesCount}</span>
                        <button
                          type="button"
                          onClick={handleNextIngredientsPage}
                          disabled={ingredientsPageIndex + 1 >= ingredientsPagesCount}
                          className="rounded-md border border-stone-200 px-2 py-0.5 disabled:opacity-40"
                        >
                          {t('Próxima')}
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
                          onSelectBread={selectBread}
                          onSelectFlavor={selectFlavor}
                          onSelectSizeUpgrade={selectSizeUpgrade}
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
                {t('Para bebida, escolha um sabor antes de adicionar.')}
              </p>
            )}

            {mustSelectBread && !hasSelectedBread && (
              <p className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">
                {t('Escolha um tipo de pão para continuar.')}
              </p>
            )}
          </div>

          <aside className="flex flex-col rounded-3xl border border-stone-200 bg-white p-4">
            <h4 className="text-sm font-bold uppercase tracking-wide text-stone-700">{t('Resumo')}</h4>
            <p className="mt-2 text-sm text-stone-600">{t('Confira o total e confirme para incluir no pedido.')}</p>

            <div className="mt-4 rounded-2xl bg-primary-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-primary-700">{t('Total deste item')}</p>
              <p className="mt-1 text-3xl font-bold text-primary-700">R$ {formatCurrency(calcTotal())}</p>
            </div>

            <div className="mt-3 rounded-2xl border border-stone-200 bg-stone-50 p-3 text-sm text-stone-700">
              {t('Quantidade')}: <span className="font-bold text-stone-900">{quantity}</span>
            </div>

            <button
              type="button"
              onClick={handleAdd}
              disabled={!isSelectionValid}
              className="mt-auto w-full rounded-2xl bg-primary-500 px-4 py-3.5 text-base font-bold text-white transition-colors hover:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {t('Adicionar ao pedido')}
            </button>

            <button
              type="button"
              onClick={handleClose}
              className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-stone-300 px-4 py-3 text-sm font-semibold text-stone-700"
            >
              <X size={16} />
              {t('Cancelar')}
            </button>
          </aside>
        </div>
      </DialogContent>
    </Dialog>
  );
}
