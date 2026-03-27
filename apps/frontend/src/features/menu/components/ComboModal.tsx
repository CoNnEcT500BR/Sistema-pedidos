import { Minus, Plus } from 'lucide-react';
import { useMemo, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { CartAddon } from '@/features/cart/store/cart.store';
import { useAddons, useAllAddons } from '../hooks/useMenu';
import type { Combo } from '../types/menu.types';
import { IngredientsEditor, type SelectedIngredient } from './IngredientsEditor';
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
} from '../utils/combo-customization.utils';
import { useI18n } from '@/i18n';

interface ComboModalProps {
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

export function ComboModal({ combo, open, onClose, onAddToCart }: ComboModalProps) {
  const { t } = useI18n();
  const { addons: allAddons, loading: allAddonsLoading } = useAllAddons();
  const [selectedUpgrade, setSelectedUpgrade] = useState<Record<string, number>>({});
  const [selectedBurgerIngredients, setSelectedBurgerIngredients] = useState<SelectedIngredient[]>([]);
  const [selectedDrinkIngredients, setSelectedDrinkIngredients] = useState<SelectedIngredient[]>([]);

  const burgerItem = useMemo(() => {
    if (!combo?.comboItems) return null;
    return combo.comboItems.find((ci) => isBurgerName(ci.menuItem.name))?.menuItem ?? null;
  }, [combo]);

  const drinkItem = useMemo(() => {
    if (!combo?.comboItems) return null;
    return combo.comboItems.find((ci) => isDrinkMenuItemName(ci.menuItem.name))?.menuItem ?? null;
  }, [combo]);

  const { addons: burgerAddons, loading: burgerAddonsLoading } = useAddons(
    open && burgerItem ? burgerItem.id : null,
  );

  const availableBurgerAddons = useMemo(() => {
    if (!isBurgerBuildItemName(burgerItem?.name)) return burgerAddons;

    return burgerAddons.filter((addon) => addon.addonType !== 'EXTRA' && addon.addonType !== 'SIZE_CHANGE');
  }, [burgerAddons, burgerItem?.name]);

  const { addons: drinkAddons, loading: drinkAddonsLoading } = useAddons(
    open && drinkItem ? drinkItem.id : null,
  );

  const availableDrinkAddons = useMemo(
    () => filterComboUpgradesFromExtras(drinkAddons),
    [drinkAddons],
  );

  const upgradeOptions = useMemo(() => {
    return buildComboUpgradeOptions(allAddons, combo);
  }, [allAddons, combo]);

  const potatoUpgrades = useMemo(
    () => upgradeOptions.filter((opt) => isPotatoComboUpgradeName(opt.name)),
    [upgradeOptions],
  );

  const drinkUpgrades = useMemo(
    () => upgradeOptions.filter((opt) => isDrinkComboUpgradeName(opt.name)),
    [upgradeOptions],
  );

  const selectedUpgradeSummary = useMemo(
    () =>
      upgradeOptions
        .map((opt) => ({ opt, quantity: selectedUpgrade[opt.id] ?? 0 }))
        .filter((entry) => entry.quantity > 0),
    [upgradeOptions, selectedUpgrade],
  );

  const burgerRemovedSummary = useMemo(
    () => selectedBurgerIngredients.filter((ing) => ing.removed),
    [selectedBurgerIngredients],
  );

  const burgerExtraSummary = useMemo(
    () => selectedBurgerIngredients.filter((ing) => ing.quantityToAdd > 0),
    [selectedBurgerIngredients],
  );

  const drinkFlavorSummary = useMemo(
    () => selectedDrinkIngredients.filter((ing) => isFlavorAddon(ing.name) && ing.quantityToAdd > 0),
    [selectedDrinkIngredients],
  );

  const drinkExtraSummary = useMemo(
    () => selectedDrinkIngredients.filter((ing) => !isFlavorAddon(ing.name) && ing.quantityToAdd > 0),
    [selectedDrinkIngredients],
  );

  const drinkRemovedSummary = useMemo(
    () => selectedDrinkIngredients.filter((ing) => ing.removed),
    [selectedDrinkIngredients],
  );

  const drinkHasFlavorOptions = useMemo(
    () => availableDrinkAddons.some((addon) => isFlavorAddon(addon.name)),
    [availableDrinkAddons],
  );

  const drinkHasSelectedFlavor = useMemo(
    () => selectedDrinkIngredients.some((ing) => isFlavorAddon(ing.name) && ing.quantityToAdd > 0),
    [selectedDrinkIngredients],
  );

  const mustSelectDrinkFlavor = Boolean(drinkItem) && drinkHasFlavorOptions;
  const isDrinkFlavorValid = !mustSelectDrinkFlavor || drinkHasSelectedFlavor;

  const hasAnyCustomization =
    selectedUpgradeSummary.length > 0 ||
    burgerRemovedSummary.length > 0 ||
    burgerExtraSummary.length > 0 ||
    drinkRemovedSummary.length > 0 ||
    drinkFlavorSummary.length > 0 ||
    drinkExtraSummary.length > 0;

  function handleClose() {
    setSelectedUpgrade({});
    setSelectedBurgerIngredients([]);
    setSelectedDrinkIngredients([]);
    onClose();
  }

  function setUpgradeQuantity(addonId: string, addonName: string, nextQuantity: number) {
    const safeNext = Math.max(0, nextQuantity);

    setSelectedUpgrade((prev) => {
      const next = { ...prev };
      if (safeNext === 0) {
        delete next[addonId];
      } else {
        next[addonId] = safeNext;
      }

      const potatoM = upgradeOptions.find((o) => o.name === UPGRADE_POTATO_M);
      const potatoG = upgradeOptions.find((o) => o.name === UPGRADE_POTATO_G);
      if (addonName === UPGRADE_POTATO_M && safeNext > 0 && potatoG) {
        delete next[potatoG.id];
      }
      if (addonName === UPGRADE_POTATO_G && safeNext > 0 && potatoM) {
        delete next[potatoM.id];
      }

      const drinkM = upgradeOptions.find((o) => o.name === UPGRADE_DRINK_M);
      const drinkG = upgradeOptions.find((o) => o.name === UPGRADE_DRINK_G);
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

    const upgradesTotal = upgradeOptions.reduce((sum, opt) => {
      const q = selectedUpgrade[opt.id] ?? 0;
      return sum + opt.price * q;
    }, 0);

    const burgerExtrasTotal = selectedBurgerIngredients
      .filter((ing) => ing.quantityToAdd > 0)
      .reduce((sum, ing) => sum + ing.basePrice * ing.quantityToAdd, 0);

    const drinkExtrasTotal = selectedDrinkIngredients
      .filter((ing) => ing.quantityToAdd > 0)
      .reduce((sum, ing) => sum + ing.basePrice * ing.quantityToAdd, 0);

    return combo.price + upgradesTotal + burgerExtrasTotal + drinkExtrasTotal;
  }

  function handleAdd() {
    if (!combo) return;
    if (!isDrinkFlavorValid) return;

    const upgradeAddons: CartAddon[] = upgradeOptions
      .filter((opt) => (selectedUpgrade[opt.id] ?? 0) > 0)
      .map((opt) => ({
        addonId: opt.id,
        name: opt.name,
        price: opt.price,
        quantity: selectedUpgrade[opt.id],
      }));

    const burgerAddons: CartAddon[] = selectedBurgerIngredients
      .filter((ing) => ing.quantityToAdd > 0 || ing.removed)
      .map((ing) => ({
        addonId: ing.addonId,
        name: ing.name,
        price: ing.basePrice,
        quantity: ing.quantityToAdd,
        removed: ing.removed,
      }));

    const drinkAddonsToCart: CartAddon[] = selectedDrinkIngredients
      .filter((ing) => ing.quantityToAdd > 0 || ing.removed)
      .map((ing) => ({
        addonId: ing.addonId,
        name: ing.name,
        price: ing.basePrice,
        quantity: ing.quantityToAdd,
        removed: ing.removed,
      }));

    // Combo personalizado deve ser adicionado um por vez para manter rastreabilidade das escolhas.
    onAddToCart(combo, 1, [...upgradeAddons, ...burgerAddons, ...drinkAddonsToCart]);
    handleClose();
  }

  if (!combo) return null;

  const comboImageUrl = combo.icon?.startsWith('http') ? combo.icon : undefined;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto p-0 sm:max-w-lg">
        <DialogHeader className="sticky top-0 z-10 border-b border-gray-100 bg-white px-6 py-4">
          <DialogTitle className="text-xl font-bold text-gray-900">{t(combo.name)}</DialogTitle>
          <DialogDescription className="sr-only">
            {t('Modal de personalizacao do combo {name}. Selecione upgrades e ingredientes antes de adicionar ao carrinho.', { name: t(combo.name) })}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-5 px-6 pb-6 pt-4">
          <div className="flex items-center gap-4">
            <div className="flex h-24 w-24 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl bg-orange-50 text-5xl shadow-sm">
              {comboImageUrl ? (
                <img src={comboImageUrl} alt={t(combo.name)} className="h-full w-full object-cover" />
              ) : (
                combo.icon || '🎁'
              )}
            </div>
            <div className="flex flex-col gap-1">
              {combo.description && <p className="text-sm text-gray-600">{t(combo.description)}</p>}
              <span className="text-2xl font-bold text-primary-600">
                R$ {combo.price.toFixed(2).replace('.', ',')}
              </span>
            </div>
          </div>

          {burgerItem && (
            <div className="flex flex-col gap-2">
              <h4 className="text-sm font-semibold uppercase tracking-wide text-gray-600">
                {t('Personalizar lanche do combo ({name})', { name: t(burgerItem.name) })}
              </h4>
              {burgerAddonsLoading ? (
                <span className="text-sm text-gray-400">{t('Carregando ingredientes do lanche...')}</span>
              ) : availableBurgerAddons.length === 0 ? (
                <span className="text-sm text-gray-400">{t('Esse lanche nao possui personalizacao.')}</span>
              ) : (
                <IngredientsEditor
                  addons={availableBurgerAddons}
                  selected={selectedBurgerIngredients}
                  onChange={setSelectedBurgerIngredients}
                />
              )}
            </div>
          )}

          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            <p className="font-semibold">{t('Regras deste combo')}</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>{t('O combo personalizado e adicionado 1 unidade por vez.')}</li>
              <li>{t('Upgrades de mesmo grupo sao exclusivos (ex.: bebida M ou G).')}</li>
              <li>{t('Em sabores de bebida, apenas 1 sabor pode ficar selecionado.')}</li>
            </ul>
          </div>

          {drinkItem && (
            <div className="flex flex-col gap-2">
              <h4 className="text-sm font-semibold uppercase tracking-wide text-gray-600">
                {t('Personalizar bebida do combo ({name})', { name: t(drinkItem.name) })}
              </h4>
              {drinkAddonsLoading ? (
                <span className="text-sm text-gray-400">{t('Carregando opcoes da bebida...')}</span>
              ) : availableDrinkAddons.length === 0 ? (
                <span className="text-sm text-gray-400">{t('Essa bebida nao possui personalizacao.')}</span>
              ) : (
                <IngredientsEditor
                  addons={availableDrinkAddons}
                  selected={selectedDrinkIngredients}
                  onChange={setSelectedDrinkIngredients}
                />
              )}

              {mustSelectDrinkFlavor && !drinkHasSelectedFlavor && (
                <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
                  {t('Escolha obrigatoriamente um sabor para a bebida do combo.')}
                </p>
              )}
            </div>
          )}

          <div className="flex flex-col gap-2">
            <h4 className="text-sm font-semibold uppercase tracking-wide text-gray-600">
              {t('Upgrade do combo')}
            </h4>

            {allAddonsLoading ? (
              <span className="text-sm text-gray-400">{t('Carregando opcoes...')}</span>
            ) : upgradeOptions.length === 0 ? (
              <span className="text-sm text-gray-400">{t('Sem upgrades para este combo.')}</span>
            ) : (
              <>
                {potatoUpgrades.length > 0 && (
                  <div className="flex flex-col gap-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                      {t('Upgrade de batata')}
                    </p>
                    {potatoUpgrades.map((opt) => {
                      const q = selectedUpgrade[opt.id] ?? 0;
                      return (
                        <div key={opt.id} className="flex items-center justify-between rounded-xl border border-gray-100 bg-white px-4 py-3">
                          <div className="flex flex-col">
                            <span className="font-medium text-gray-800">{t(opt.name)}</span>
                            <span className="text-xs text-gray-400">+R$ {opt.price.toFixed(2).replace('.', ',')}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            {q > 0 && (
                              <>
                                <button
                                  onClick={() => setUpgradeQuantity(opt.id, opt.name, q - 1)}
                                  className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-700 transition hover:bg-gray-200"
                                  aria-label={t('Remover {name}', { name: t(opt.name) })}
                                >
                                  <Minus className="h-3 w-3" />
                                </button>
                                <span className="w-5 text-center text-sm font-bold">{q}</span>
                              </>
                            )}
                            <button
                              onClick={() => setUpgradeQuantity(opt.id, opt.name, 1)}
                              className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-600 text-white shadow transition hover:bg-primary-700"
                              aria-label={t('Adicionar {name}', { name: t(opt.name) })}
                            >
                              <Plus className="h-3 w-3" strokeWidth={3} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {drinkUpgrades.length > 0 && (
                  <div className="flex flex-col gap-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                      {t('Upgrade de bebida')}
                    </p>
                    {drinkUpgrades.map((opt) => {
                      const q = selectedUpgrade[opt.id] ?? 0;
                      return (
                        <div key={opt.id} className="flex items-center justify-between rounded-xl border border-gray-100 bg-white px-4 py-3">
                          <div className="flex flex-col">
                            <span className="font-medium text-gray-800">{t(opt.name)}</span>
                            <span className="text-xs text-gray-400">+R$ {opt.price.toFixed(2).replace('.', ',')}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            {q > 0 && (
                              <>
                                <button
                                  onClick={() => setUpgradeQuantity(opt.id, opt.name, q - 1)}
                                  className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-700 transition hover:bg-gray-200"
                                  aria-label={t('Remover {name}', { name: t(opt.name) })}
                                >
                                  <Minus className="h-3 w-3" />
                                </button>
                                <span className="w-5 text-center text-sm font-bold">{q}</span>
                              </>
                            )}
                            <button
                              onClick={() => setUpgradeQuantity(opt.id, opt.name, 1)}
                              className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-600 text-white shadow transition hover:bg-primary-700"
                              aria-label={t('Adicionar {name}', { name: t(opt.name) })}
                            >
                              <Plus className="h-3 w-3" strokeWidth={3} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-4">
            <h4 className="text-sm font-semibold uppercase tracking-wide text-gray-600">{t('Voce escolheu')}</h4>

            {!hasAnyCustomization ? (
              <p className="mt-2 text-sm text-gray-500">{t('Sem personalizacoes adicionais neste combo.')}</p>
            ) : (
              <div className="mt-3 flex flex-col gap-3 text-sm text-gray-700">
                {selectedUpgradeSummary.length > 0 && (
                  <div className="rounded-xl border border-blue-100 bg-blue-50 p-3">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-blue-600">{t('Upgrade do combo')}</p>
                    <div className="mt-1 flex flex-col gap-1">
                      {selectedUpgradeSummary.map(({ opt }) => (
                        <p key={opt.id} className="text-xs font-medium text-blue-700">
                          + {t(opt.name)} (+R$ {opt.price.toFixed(2).replace('.', ',')})
                        </p>
                      ))}
                    </div>
                  </div>
                )}

                {(burgerRemovedSummary.length > 0 || drinkRemovedSummary.length > 0) && (
                  <div className="rounded-xl border border-red-100 bg-red-50 p-3">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-red-500">{t('Removidos')}</p>
                    <div className="mt-1 flex flex-col gap-1">
                      {burgerRemovedSummary.map((ing) => (
                        <p key={`burger-removed-${ing.addonId}`} className="text-xs font-medium text-red-600">
                          - {t('Sem {name} ({type})', { name: t(ing.name), type: t('lanche') })}
                        </p>
                      ))}
                      {drinkRemovedSummary.map((ing) => (
                        <p key={`drink-removed-${ing.addonId}`} className="text-xs font-medium text-red-600">
                          - {t('Sem {name} ({type})', { name: t(ing.name), type: t('bebida') })}
                        </p>
                      ))}
                    </div>
                  </div>
                )}

                {(burgerExtraSummary.length > 0 || drinkExtraSummary.length > 0) && (
                  <div className="rounded-xl border border-gray-100 bg-gray-50 p-3">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">{t('Adicionais')}</p>
                    <div className="mt-1 flex flex-col gap-1">
                      {burgerExtraSummary.map((ing) => (
                        <p key={`burger-extra-${ing.addonId}`} className="text-xs text-gray-600">
                          + {t('{quantity}x {name} ({type})', { quantity: String(ing.quantityToAdd), name: t(ing.name), type: t('lanche') })}
                        </p>
                      ))}
                      {drinkExtraSummary.map((ing) => (
                        <p key={`drink-extra-${ing.addonId}`} className="text-xs text-gray-600">
                          + {t('{quantity}x {name} ({type})', { quantity: String(ing.quantityToAdd), name: t(ing.name), type: t('bebida') })}
                        </p>
                      ))}
                    </div>
                  </div>
                )}

                {drinkFlavorSummary.length > 0 && (
                  <div className="rounded-xl border border-indigo-100 bg-indigo-50 p-3">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-indigo-600">{t('Sabor da bebida')}</p>
                    <div className="mt-1 flex flex-col gap-1">
                      {drinkFlavorSummary.map((ing) => (
                        <p key={`drink-flavor-${ing.addonId}`} className="text-xs font-medium text-indigo-700">
                          {t(ing.name)}
                        </p>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <p className="text-sm font-medium text-gray-500">
            {t('Este combo personalizado sera adicionado como 1 unidade por vez.')}
          </p>

          <button
            onClick={handleAdd}
            disabled={!isDrinkFlavorValid}
            className="flex w-full items-center justify-between rounded-2xl bg-primary-500 px-6 py-4 text-white shadow-md transition hover:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <span className="text-lg font-bold">{t('Adicionar Combo')}</span>
            <span className="text-lg font-bold">R$ {calcTotal().toFixed(2).replace('.', ',')}</span>
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
