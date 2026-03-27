import { Minus, Plus, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { CartAddon } from '@/features/cart/store/cart.store';
import { useAddons, useAllAddons } from '@/features/menu/hooks/useMenu';
import type { Addon, Combo } from '@/features/menu/types/menu.types';
import {
  buildComboUpgradeOptions,
  filterComboUpgradesFromExtras,
  isDrinkComboUpgradeName,
  isDrinkMenuItemName,
  isPotatoComboUpgradeName,
  UPGRADE_DRINK_G,
  UPGRADE_DRINK_M,
  UPGRADE_POTATO_G,
  UPGRADE_POTATO_M,
} from '@/features/menu/utils/combo-customization.utils';
import { useI18n } from '@/i18n';

interface SelectedIngredient {
  addonId: string;
  name: string;
  basePrice: number;
  quantityToAdd: number;
  removed: boolean;
}

type ComboStep = 'overview' | 'burger' | 'drink' | 'upgrades';

const ADDONS_PER_PAGE = 4;

interface ComboTouchModalProps {
  combo: Combo | null;
  open: boolean;
  onClose: () => void;
  onAddToCart: (combo: Combo, quantity: number, addons: CartAddon[]) => void;
}

function isBurgerName(name: string): boolean {
  return name.toLowerCase().includes('burger');
}

function normalizeScopeSource(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function isBurgerBuildItemName(name?: string): boolean {
  if (!name) return false;
  const value = normalizeScopeSource(name);
  return /(criacao|criar|monte|personaliz|custom)/.test(value) && /(hamburg|burger|lanche|sanduiche)/.test(value);
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
  onSelectFlavor,
  onChangeQuantity,
}: {
  addon: Addon;
  status: SelectedIngredient | undefined;
  onToggleRemove: (addon: Addon) => void;
  onSelectFlavor: (addon: Addon) => void;
  onChangeQuantity: (addon: Addon, delta: number) => void;
}) {
  const { t } = useI18n();
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
              {t(addon.name)}
            </p>
            <p className="text-xs text-stone-600">{isRemoved ? t('Removido') : t('Padrao do combo')}</p>
          </div>
          <span className={`inline-flex h-8 min-w-[88px] items-center justify-center rounded-xl px-3 text-xs font-bold ${isRemoved ? 'bg-red-600 text-white' : 'border border-stone-300 bg-white text-stone-700'}`}>
            {isRemoved ? t('Sem') : t('Manter')}
          </span>
        </div>
      </button>
    );
  }

  if (isFlavorAddon(addon.name)) {
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
            {addon.price > 0 && <p className="text-xs text-stone-600">+ R$ {formatCurrency(addon.price)}</p>}
          </div>
          <span className={`inline-flex h-8 min-w-[88px] items-center justify-center rounded-xl px-3 text-xs font-bold ${isSelectedFlavor ? 'bg-primary-600 text-white' : 'border border-stone-300 bg-white text-stone-700'}`}>
            {isSelectedFlavor ? t('Selecionado') : t('Selecionar')}
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
          >
            <Minus size={18} />
          </button>
          <span className="w-7 text-center text-lg font-bold text-stone-900">{quantityToAdd}</span>
          <button
            type="button"
            onClick={() => onChangeQuantity(addon, 1)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary-500 text-white"
          >
            <Plus size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}

function TouchCustomizationPanel({
  title,
  addons,
  selected,
  onChange,
}: {
  title: string;
  addons: Addon[];
  selected: SelectedIngredient[];
  onChange: (next: SelectedIngredient[]) => void;
}) {
  const { t } = useI18n();
  const [pageIndex, setPageIndex] = useState(0);

  const pagesCount = Math.max(1, Math.ceil(addons.length / ADDONS_PER_PAGE));
  const paginatedAddons = useMemo(() => {
    const start = pageIndex * ADDONS_PER_PAGE;
    return addons.slice(start, start + ADDONS_PER_PAGE);
  }, [addons, pageIndex]);

  function getStatus(addon: Addon) {
    return selected.find((entry) => entry.addonId === addon.id);
  }

  function toggleRemove(addon: Addon) {
    const existing = getStatus(addon);

    if (existing) {
      const updated = { ...existing, removed: !existing.removed };
      onChange(selected.map((entry) => (entry.addonId === addon.id ? updated : entry)));
      return;
    }

    onChange([
      ...selected,
      {
        addonId: addon.id,
        name: addon.name,
        basePrice: addon.price,
        quantityToAdd: 0,
        removed: true,
      },
    ]);
  }

  function selectFlavor(addon: Addon) {
    const flavorIds = new Set(addons.filter((entry) => isFlavorAddon(entry.name)).map((entry) => entry.id));
    const cleaned = selected.filter((entry) => !flavorIds.has(entry.addonId)).map((entry) => ({ ...entry }));
    const alreadySelected = selected.some((entry) => entry.addonId === addon.id && entry.quantityToAdd > 0);

    if (alreadySelected) {
      onChange(cleaned);
      return;
    }

    onChange([
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
      onChange(selected.filter((entry) => entry.addonId !== addon.id));
      return;
    }

    if (existing) {
      const updated = { ...existing, quantityToAdd: newQuantity, removed: false };
      onChange(selected.map((entry) => (entry.addonId === addon.id ? updated : entry)));
      return;
    }

    if (newQuantity > 0) {
      onChange([
        ...selected,
        {
          addonId: addon.id,
          name: addon.name,
          basePrice: addon.price,
          quantityToAdd: newQuantity,
          removed: false,
        },
      ]);
    }
  }

  return (
    <div className="flex h-full flex-col rounded-3xl border border-stone-200 bg-white p-4">
      <div className="mb-3 flex items-center justify-between">
        <h4 className="text-sm font-bold uppercase tracking-wide text-stone-700">{title}</h4>
        <div className="inline-flex items-center gap-1 rounded-lg border border-stone-200 bg-stone-50 px-2 py-1 text-xs font-semibold text-stone-700">
          <button
            type="button"
            onClick={() => setPageIndex((current) => (current > 0 ? current - 1 : 0))}
            disabled={pageIndex === 0}
            className="rounded border border-stone-300 px-2 py-0.5 disabled:opacity-40"
          >
            {t('Anterior')}
          </button>
          <span>{pageIndex + 1}/{pagesCount}</span>
          <button
            type="button"
            onClick={() => setPageIndex((current) => (current + 1 < pagesCount ? current + 1 : current))}
            disabled={pageIndex + 1 >= pagesCount}
            className="rounded border border-stone-300 px-2 py-0.5 disabled:opacity-40"
          >
            {t('Próxima')}
          </button>
        </div>
      </div>

      {addons.length === 0 ? (
        <div className="grid flex-1 place-items-center rounded-2xl border border-stone-200 bg-stone-50 text-sm text-stone-500">
          {t('Sem personalizacoes disponiveis.')}
        </div>
      ) : (
        <div className="grid flex-1 grid-rows-4 gap-2 overflow-hidden">
          {paginatedAddons.map((addon) => (
            <TouchAddonRow
              key={addon.id}
              addon={addon}
              status={getStatus(addon)}
              onToggleRemove={toggleRemove}
              onSelectFlavor={selectFlavor}
              onChangeQuantity={updateQuantityToAdd}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function ComboTouchModal({ combo, open, onClose, onAddToCart }: ComboTouchModalProps) {
  const { t } = useI18n();
  const [step, setStep] = useState<ComboStep>('overview');
  const [selectedUpgrade, setSelectedUpgrade] = useState<Record<string, number>>({});
  const [selectedBurgerIngredients, setSelectedBurgerIngredients] = useState<SelectedIngredient[]>([]);
  const [selectedDrinkIngredients, setSelectedDrinkIngredients] = useState<SelectedIngredient[]>([]);

  const { addons: allAddons } = useAllAddons();

  const burgerItem = useMemo(() => {
    if (!combo?.comboItems) return null;
    return combo.comboItems.find((entry) => isBurgerName(entry.menuItem.name))?.menuItem ?? null;
  }, [combo]);

  const drinkItem = useMemo(() => {
    if (!combo?.comboItems) return null;
    return combo.comboItems.find((entry) => isDrinkMenuItemName(entry.menuItem.name))?.menuItem ?? null;
  }, [combo]);

  const { addons: burgerAddons } = useAddons(open && burgerItem ? burgerItem.id : null);
  const { addons: drinkAddons } = useAddons(open && drinkItem ? drinkItem.id : null);

  const availableDrinkAddons = useMemo(
    () => filterComboUpgradesFromExtras(drinkAddons),
    [drinkAddons],
  );

  const availableBurgerAddons = useMemo(() => {
    if (!isBurgerBuildItemName(burgerItem?.name)) return burgerAddons;

    return burgerAddons.filter((addon) => addon.addonType !== 'EXTRA' && addon.addonType !== 'SIZE_CHANGE');
  }, [burgerAddons, burgerItem?.name]);

  const upgradeOptions = useMemo(() => buildComboUpgradeOptions(allAddons, combo), [allAddons, combo]);

  const potatoUpgrades = useMemo(
    () => upgradeOptions.filter((entry) => isPotatoComboUpgradeName(entry.name)),
    [upgradeOptions],
  );
  const drinkUpgrades = useMemo(
    () => upgradeOptions.filter((entry) => isDrinkComboUpgradeName(entry.name)),
    [upgradeOptions],
  );

  const drinkHasFlavorOptions = useMemo(
    () => availableDrinkAddons.some((addon) => isFlavorAddon(addon.name)),
    [availableDrinkAddons],
  );
  const drinkHasSelectedFlavor = useMemo(
    () => selectedDrinkIngredients.some((entry) => isFlavorAddon(entry.name) && entry.quantityToAdd > 0),
    [selectedDrinkIngredients],
  );

  const mustSelectDrinkFlavor = Boolean(drinkItem) && drinkHasFlavorOptions;
  const isDrinkFlavorValid = !mustSelectDrinkFlavor || drinkHasSelectedFlavor;

  function handleClose() {
    setStep('overview');
    setSelectedUpgrade({});
    setSelectedBurgerIngredients([]);
    setSelectedDrinkIngredients([]);
    onClose();
  }

  function setUpgradeQuantity(addonId: string, addonName: string, nextQuantity: number) {
    const safeNext = Math.max(0, nextQuantity);

    setSelectedUpgrade((current) => {
      const next = { ...current };

      if (safeNext === 0) {
        delete next[addonId];
      } else {
        next[addonId] = safeNext;
      }

      const potatoM = upgradeOptions.find((entry) => entry.name === UPGRADE_POTATO_M);
      const potatoG = upgradeOptions.find((entry) => entry.name === UPGRADE_POTATO_G);
      if (addonName === UPGRADE_POTATO_M && safeNext > 0 && potatoG) {
        delete next[potatoG.id];
      }
      if (addonName === UPGRADE_POTATO_G && safeNext > 0 && potatoM) {
        delete next[potatoM.id];
      }

      const drinkM = upgradeOptions.find((entry) => entry.name === UPGRADE_DRINK_M);
      const drinkG = upgradeOptions.find((entry) => entry.name === UPGRADE_DRINK_G);
      if (addonName === UPGRADE_DRINK_M && safeNext > 0 && drinkG) {
        delete next[drinkG.id];
      }
      if (addonName === UPGRADE_DRINK_G && safeNext > 0 && drinkM) {
        delete next[drinkM.id];
      }

      return next;
    });
  }

  function calcTotal() {
    if (!combo) return 0;

    const upgradesTotal = upgradeOptions.reduce((sum, addon) => sum + addon.price * (selectedUpgrade[addon.id] ?? 0), 0);

    const burgerExtrasTotal = selectedBurgerIngredients
      .filter((entry) => entry.quantityToAdd > 0)
      .reduce((sum, entry) => sum + entry.basePrice * entry.quantityToAdd, 0);

    const drinkExtrasTotal = selectedDrinkIngredients
      .filter((entry) => entry.quantityToAdd > 0)
      .reduce((sum, entry) => sum + entry.basePrice * entry.quantityToAdd, 0);

    return combo.price + upgradesTotal + burgerExtrasTotal + drinkExtrasTotal;
  }

  function handleAdd() {
    if (!combo || !isDrinkFlavorValid) return;

    const upgradeAddons: CartAddon[] = upgradeOptions
      .filter((addon) => (selectedUpgrade[addon.id] ?? 0) > 0)
      .map((addon) => ({
        addonId: addon.id,
        name: addon.name,
        price: addon.price,
        quantity: selectedUpgrade[addon.id],
      }));

    const burgerAddons: CartAddon[] = selectedBurgerIngredients
      .filter((entry) => entry.quantityToAdd > 0 || entry.removed)
      .map((entry) => ({
        addonId: entry.addonId,
        name: entry.name,
        price: entry.basePrice,
        quantity: entry.quantityToAdd,
        removed: entry.removed,
      }));

    const drinkAddonsToCart: CartAddon[] = selectedDrinkIngredients
      .filter((entry) => entry.quantityToAdd > 0 || entry.removed)
      .map((entry) => ({
        addonId: entry.addonId,
        name: entry.name,
        price: entry.basePrice,
        quantity: entry.quantityToAdd,
        removed: entry.removed,
      }));

    onAddToCart(combo, 1, [...upgradeAddons, ...burgerAddons, ...drinkAddonsToCart]);
    handleClose();
  }

  if (!combo) return null;

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && handleClose()}>
      <DialogContent className="h-[88vh] w-[95vw] max-w-[1020px] overflow-hidden rounded-[2rem] border border-stone-200 p-0">
        <DialogHeader className="border-b border-stone-200 bg-white px-5 py-4">
          <DialogTitle className="text-xl font-bold text-stone-900">{t(combo.name)}</DialogTitle>
          <DialogDescription className="sr-only">
            {t('Modal touch de personalizacao de combo com etapas para lanche, bebida e upgrades.')}
          </DialogDescription>
        </DialogHeader>

        <div className="grid h-[calc(88vh-168px)] grid-cols-1 gap-4 overflow-hidden bg-stone-50 p-4 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <section className="flex min-h-0 flex-col rounded-3xl border border-stone-200 bg-white p-4">
            <div className="mb-3 grid grid-cols-2 gap-2 lg:grid-cols-4">
              <button
                type="button"
                onClick={() => setStep('overview')}
                className={`rounded-xl px-3 py-2 text-xs font-bold transition-colors ${step === 'overview' ? 'bg-primary-500 text-white' : 'border border-stone-200 bg-white text-stone-700'}`}
              >
                {t('Visao geral')}
              </button>
              <button
                type="button"
                onClick={() => setStep('burger')}
                className={`rounded-xl px-3 py-2 text-xs font-bold transition-colors ${step === 'burger' ? 'bg-primary-500 text-white' : 'border border-stone-200 bg-white text-stone-700'}`}
                disabled={!burgerItem}
              >
                {t('Lanche')}
              </button>
              <button
                type="button"
                onClick={() => setStep('drink')}
                className={`rounded-xl px-3 py-2 text-xs font-bold transition-colors ${step === 'drink' ? 'bg-primary-500 text-white' : 'border border-stone-200 bg-white text-stone-700'}`}
                disabled={!drinkItem}
              >
                {t('Bebida')}
              </button>
              <button
                type="button"
                onClick={() => setStep('upgrades')}
                className={`rounded-xl px-3 py-2 text-xs font-bold transition-colors ${step === 'upgrades' ? 'bg-primary-500 text-white' : 'border border-stone-200 bg-white text-stone-700'}`}
              >
                {t('Upgrade do combo')}
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-hidden">
              {step === 'overview' && (
                <div className="grid h-full grid-rows-[auto_auto_1fr] gap-3">
                  <div className="rounded-2xl border border-stone-200 bg-stone-50 p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-stone-600">{t('Itens do combo')}</p>
                    <p className="mt-1 text-sm text-stone-700">
                      {combo.comboItems?.map((entry) => `${entry.quantity}x ${t(entry.menuItem.name)}`).join(' | ') || t('Sem itens vinculados')}
                    </p>
                  </div>

                  {mustSelectDrinkFlavor && !drinkHasSelectedFlavor && (
                    <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">
                      {t('Defina um sabor na etapa Bebida antes de adicionar o combo.')}
                    </p>
                  )}

                  <div className="rounded-2xl border border-stone-200 bg-white p-3 text-sm text-stone-700">
                    <p className="font-semibold text-stone-900">{t('Resumo rapido')}</p>
                    <p className="mt-1">{t('Use as etapas para ajustar lanche, bebida e upgrades.')}</p>
                    <p className="mt-2 text-xs text-stone-500">{t('O combo personalizado e adicionado como 1 unidade.')}</p>
                  </div>
                </div>
              )}

              {step === 'burger' && (
                <TouchCustomizationPanel
                  title={burgerItem ? t('Lanche: {name}', { name: t(burgerItem.name) }) : t('Lanche')}
                  addons={availableBurgerAddons}
                  selected={selectedBurgerIngredients}
                  onChange={setSelectedBurgerIngredients}
                />
              )}

              {step === 'drink' && (
                <TouchCustomizationPanel
                  title={drinkItem ? t('Bebida: {name}', { name: t(drinkItem.name) }) : t('Bebida')}
                  addons={availableDrinkAddons}
                  selected={selectedDrinkIngredients}
                  onChange={setSelectedDrinkIngredients}
                />
              )}

              {step === 'upgrades' && (
                <div className="h-full space-y-3 rounded-3xl border border-stone-200 bg-white p-4 overflow-hidden">
                  <p className="text-sm font-bold uppercase tracking-wide text-stone-700">{t('Upgrade do combo')}</p>

                  <div className="space-y-2">
                    <p className="text-sm font-bold uppercase tracking-wide text-stone-700">{t('Upgrade batata')}</p>
                    {potatoUpgrades.length === 0 ? (
                      <p className="rounded-xl border border-stone-200 bg-stone-50 p-3 text-sm text-stone-500">
                        {t('Sem upgrades de batata para este combo.')}
                      </p>
                    ) : (
                      potatoUpgrades.map((addon) => {
                        const quantity = selectedUpgrade[addon.id] ?? 0;
                        return (
                          <div key={addon.id} className="flex items-center justify-between rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5">
                            <div>
                              <p className="text-sm font-semibold text-stone-900">{t(addon.name)}</p>
                              <p className="text-xs text-stone-600">+ R$ {formatCurrency(addon.price)}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => setUpgradeQuantity(addon.id, addon.name, quantity - 1)}
                                disabled={quantity <= 0}
                                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-stone-300 bg-white text-stone-700 disabled:opacity-40"
                              >
                                <Minus size={16} />
                              </button>
                              <span className="w-7 text-center text-lg font-bold text-stone-900">{quantity}</span>
                              <button
                                type="button"
                                onClick={() => setUpgradeQuantity(addon.id, addon.name, 1)}
                                className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary-500 text-white"
                              >
                                <Plus size={16} />
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm font-bold uppercase tracking-wide text-stone-700">{t('Upgrade bebida')}</p>
                    {drinkUpgrades.length === 0 ? (
                      <p className="rounded-xl border border-stone-200 bg-stone-50 p-3 text-sm text-stone-500">
                        {t('Sem upgrades de bebida para este combo.')}
                      </p>
                    ) : (
                      drinkUpgrades.map((addon) => {
                        const quantity = selectedUpgrade[addon.id] ?? 0;
                        return (
                          <div key={addon.id} className="flex items-center justify-between rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5">
                            <div>
                              <p className="text-sm font-semibold text-stone-900">{t(addon.name)}</p>
                              <p className="text-xs text-stone-600">+ R$ {formatCurrency(addon.price)}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => setUpgradeQuantity(addon.id, addon.name, quantity - 1)}
                                disabled={quantity <= 0}
                                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-stone-300 bg-white text-stone-700 disabled:opacity-40"
                              >
                                <Minus size={16} />
                              </button>
                              <span className="w-7 text-center text-lg font-bold text-stone-900">{quantity}</span>
                              <button
                                type="button"
                                onClick={() => setUpgradeQuantity(addon.id, addon.name, 1)}
                                className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary-500 text-white"
                              >
                                <Plus size={16} />
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>
          </section>

          <aside className="flex flex-col rounded-3xl border border-stone-200 bg-white p-4">
            <h4 className="text-sm font-bold uppercase tracking-wide text-stone-700">{t('Resumo')}</h4>
            <p className="mt-2 text-sm text-stone-600">{t('Total do combo personalizado.')}</p>

            <div className="mt-4 rounded-2xl bg-primary-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-primary-700">{t('Total')}</p>
              <p className="mt-1 text-3xl font-bold text-primary-700">R$ {formatCurrency(calcTotal())}</p>
            </div>

            <button
              type="button"
              onClick={handleAdd}
              disabled={!isDrinkFlavorValid}
              className="mt-auto w-full rounded-2xl bg-primary-500 px-4 py-3.5 text-base font-bold text-white transition-colors hover:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {t('Adicionar combo')}
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
