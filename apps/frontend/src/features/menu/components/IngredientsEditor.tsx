import { Minus, Plus, X } from 'lucide-react';
import type { Addon } from '../types/menu.types';
import { useI18n } from '@/i18n';
import { cn } from '@/lib/utils';

export interface SelectedIngredient {
  addonId: string;
  name: string;
  basePrice: number;
  quantityToAdd: number; // quantidade EXTRA (além do que vem no item)
  removed: boolean; // se marcado como retirado
}

interface IngredientsEditorProps {
  addons: Addon[]; // ingredientes/adicionais do item
  selected: SelectedIngredient[];
  onChange: (selected: SelectedIngredient[]) => void;
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
  return addon.name.toLowerCase().startsWith('sabor ');
}

export function IngredientsEditor({ addons, selected, onChange }: IngredientsEditorProps) {
  const { t } = useI18n();
  if (addons.length === 0) return null;

  const removableIngredients = addons.filter((a) => isAssemblyIngredient(a));
  const breadIngredients = addons.filter((a) => isBreadIngredient(a));
  const extraIngredients = addons.filter((a) => isExtraIngredient(a));
  const sizeChangeIngredients = extraIngredients.filter((a) => isSizeChangeIngredient(a));
  const flavorIngredients = extraIngredients.filter((a) => isFlavorIngredient(a));
  const regularExtraIngredients = extraIngredients.filter(
    (a) => !isFlavorIngredient(a) && !isSizeChangeIngredient(a),
  );

  function toggleRemove(addon: Addon) {
    const existing = selected.find((s) => s.addonId === addon.id);

    if (existing) {
      // Toggle removed status (para ingredientes padrão)
      const updated = { ...existing, removed: !existing.removed };
      onChange(selected.map((s) => (s.addonId === addon.id ? updated : s)));
    } else {
      // Add new with removed=true para ingredientes padrão
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
  }

  function selectBread(addon: Addon) {
    const breadIds = new Set(breadIngredients.map((ingredient) => ingredient.id));
    const cleaned = selected.filter((entry) => !breadIds.has(entry.addonId)).map((entry) => ({ ...entry }));

    const alreadySelected = selected.find((entry) => entry.addonId === addon.id && entry.quantityToAdd > 0);
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

  function selectFlavor(addon: Addon) {
    const flavorIds = new Set(flavorIngredients.map((ingredient) => ingredient.id));
    const cleaned = selected.filter((entry) => !flavorIds.has(entry.addonId)).map((entry) => ({ ...entry }));

    const alreadySelected = selected.find((entry) => entry.addonId === addon.id && entry.quantityToAdd > 0);
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

  function selectSizeUpgrade(addon: Addon) {
    const sizeUpgradeIds = new Set(sizeChangeIngredients.map((ingredient) => ingredient.id));
    const cleaned = selected.filter((entry) => !sizeUpgradeIds.has(entry.addonId)).map((entry) => ({ ...entry }));

    const alreadySelected = selected.find((entry) => entry.addonId === addon.id && entry.quantityToAdd > 0);
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
    const existing = selected.find((s) => s.addonId === addon.id);
    const newQuantity = Math.max(0, (existing?.quantityToAdd ?? 0) + delta);

    if (newQuantity === 0 && (!existing || existing.quantityToAdd === 0)) {
      // Remover se quantidade é 0 e não havia antes
      onChange(selected.filter((s) => s.addonId !== addon.id));
    } else if (existing) {
      // Atualizar existente
      const updated = { ...existing, quantityToAdd: newQuantity };
      onChange(selected.map((s) => (s.addonId === addon.id ? updated : s)));
    } else if (newQuantity > 0) {
      // Criar novo
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

  function getStatus(addon: Addon) {
    return selected.find((s) => s.addonId === addon.id);
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Seção: Remover ingredientes */}
      {removableIngredients.length > 0 && (
        <div className="flex flex-col gap-2">
          <h4 className="text-sm font-semibold uppercase tracking-wide text-gray-600">
            🚫 {t('Remover')}
          </h4>

          <div className="flex flex-col gap-2">
            {removableIngredients.map((addon) => {
              const status = getStatus(addon);
              const isRemoved = status?.removed ?? false;

              return (
                <div
                  key={addon.id}
                  className={cn(
                    'flex items-center justify-between gap-3 rounded-xl border px-4 py-3 transition-all',
                    isRemoved
                      ? 'border-red-200 bg-red-50'
                      : 'border-gray-100 bg-white hover:border-gray-200',
                  )}
                >
                  <div className="flex flex-1 items-center gap-3">
                    {/* Checkbox para retirar */}
                    <button
                      onClick={() => toggleRemove(addon)}
                      className={cn(
                        'flex h-6 w-6 flex-shrink-0 items-center justify-center rounded border-2 transition-colors',
                        isRemoved
                          ? 'border-red-500 bg-red-500 text-white'
                          : 'border-gray-300 bg-white hover:border-gray-400',
                      )}
                      aria-label={isRemoved
                        ? t('Adicionar {name}', { name: t(addon.name) })
                        : t('Remover {name}', { name: t(addon.name) })}
                      title={isRemoved
                        ? t('{name} será retirado', { name: t(addon.name) })
                        : t('Retirar {name}', { name: t(addon.name) })}
                    >
                      {isRemoved && <X className="h-4 w-4" strokeWidth={3} />}
                    </button>

                    {/* Nome do ingrediente */}
                    <span
                      className={cn(
                        'flex-1 font-medium text-gray-800',
                        isRemoved && 'line-through text-red-600',
                      )}
                    >
                      {t(addon.name)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {breadIngredients.length > 0 && (
        <div className="flex flex-col gap-2">
          <h4 className="text-sm font-semibold uppercase tracking-wide text-gray-600">
            🍞 {t('Escolha o pão')}
          </h4>

          <div className="flex flex-col gap-2">
            {breadIngredients.map((addon) => {
              const status = getStatus(addon);
              const isSelectedBread = (status?.quantityToAdd ?? 0) > 0;

              return (
                <button
                  key={addon.id}
                  type="button"
                  onClick={() => selectBread(addon)}
                  className={cn(
                    'flex items-center justify-between gap-3 rounded-xl border px-4 py-3 text-left transition-all',
                    isSelectedBread
                      ? 'border-primary-300 bg-primary-50'
                      : 'border-gray-100 bg-white hover:border-gray-200',
                  )}
                >
                  <div className="flex flex-col gap-0.5">
                    <span className="font-medium text-gray-800">{t(addon.name)}</span>
                    {addon.price > 0 ? (
                      <span className="text-xs text-gray-400">+R$ {addon.price.toFixed(2).replace('.', ',')}</span>
                    ) : null}
                  </div>
                  <span
                    className={cn(
                      'rounded-full px-3 py-1 text-xs font-semibold',
                      isSelectedBread ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600',
                    )}
                  >
                    {isSelectedBread ? t('Selecionado') : t('Selecionar')}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {flavorIngredients.length > 0 && (
        <div className="flex flex-col gap-2">
          <h4 className="text-sm font-semibold uppercase tracking-wide text-gray-600">
            🥤 {t('Escolha o sabor da bebida')}
          </h4>

          <div className="flex flex-col gap-2">
            {flavorIngredients.map((addon) => {
              const status = getStatus(addon);
              const isSelectedFlavor = (status?.quantityToAdd ?? 0) > 0;

              return (
                <button
                  key={addon.id}
                  type="button"
                  onClick={() => selectFlavor(addon)}
                  className={cn(
                    'flex items-center justify-between gap-3 rounded-xl border px-4 py-3 text-left transition-all',
                    isSelectedFlavor
                      ? 'border-primary-300 bg-primary-50'
                      : 'border-gray-100 bg-white hover:border-gray-200',
                  )}
                >
                  <div className="flex flex-col gap-0.5">
                    <span className="font-medium text-gray-800">{t(addon.name)}</span>
                    {addon.price > 0 ? (
                      <span className="text-xs text-gray-400">+R$ {addon.price.toFixed(2).replace('.', ',')}</span>
                    ) : null}
                  </div>
                  <span
                    className={cn(
                      'rounded-full px-3 py-1 text-xs font-semibold',
                      isSelectedFlavor ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600',
                    )}
                  >
                    {isSelectedFlavor ? t('Selecionado') : t('Selecionar')}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {sizeChangeIngredients.length > 0 && (
        <div className="flex flex-col gap-2">
          <h4 className="text-sm font-semibold uppercase tracking-wide text-gray-600">
            🧃 {t('Upgrade da bebida')}
          </h4>

          <div className="flex flex-col gap-2">
            {sizeChangeIngredients.map((addon) => {
              const status = getStatus(addon);
              const isSelectedUpgrade = (status?.quantityToAdd ?? 0) > 0;

              return (
                <button
                  key={addon.id}
                  type="button"
                  onClick={() => selectSizeUpgrade(addon)}
                  className={cn(
                    'flex items-center justify-between gap-3 rounded-xl border px-4 py-3 text-left transition-all',
                    isSelectedUpgrade
                      ? 'border-primary-300 bg-primary-50'
                      : 'border-gray-100 bg-white hover:border-gray-200',
                  )}
                >
                  <div className="flex flex-col gap-0.5">
                    <span className="font-medium text-gray-800">{t(addon.name)}</span>
                    {addon.price > 0 ? (
                      <span className="text-xs text-gray-400">+R$ {addon.price.toFixed(2).replace('.', ',')}</span>
                    ) : null}
                  </div>
                  <span
                    className={cn(
                      'rounded-full px-3 py-1 text-xs font-semibold',
                      isSelectedUpgrade ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600',
                    )}
                  >
                    {isSelectedUpgrade ? t('Selecionado') : t('Selecionar')}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Seção: Adicionar extras */}
      {regularExtraIngredients.length > 0 && (
        <div className="flex flex-col gap-2">
          <h4 className="text-sm font-semibold uppercase tracking-wide text-gray-600">
            ➕ {t('Adicionar extras')}
          </h4>

          <div className="flex flex-col gap-2">
            {regularExtraIngredients.map((addon) => {
              const status = getStatus(addon);
              const quantityToAdd = status?.quantityToAdd ?? 0;

              return (
                <div
                  key={addon.id}
                  className={cn(
                    'flex items-center justify-between gap-3 rounded-xl border px-4 py-3 transition-all',
                    quantityToAdd > 0
                      ? 'border-primary-300 bg-primary-50'
                      : 'border-gray-100 bg-white hover:border-gray-200',
                  )}
                >
                  <div className="flex flex-1 flex-col gap-0.5">
                    {/* Nome e preço */}
                    <span className="font-medium text-gray-800">{t(addon.name)}</span>
                    {addon.price > 0 && (
                      <span className="text-xs text-gray-400">
                        +R$ {addon.price.toFixed(2).replace('.', ',')} ({t('adicional')})
                      </span>
                    )}
                  </div>

                  {/* Contador para adicionar mais */}
                  <div className="flex items-center gap-2">
                    {quantityToAdd > 0 && (
                      <>
                        <button
                          onClick={() => updateQuantityToAdd(addon, -1)}
                          className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-700 transition hover:bg-gray-200 active:scale-90"
                          aria-label={t('Menos {name}', { name: t(addon.name) })}
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="w-5 text-center text-sm font-bold">{quantityToAdd}</span>
                      </>
                    )}
                    <button
                      onClick={() => updateQuantityToAdd(addon, 1)}
                      className={cn(
                        'flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-white shadow transition active:scale-90',
                        quantityToAdd > 0
                          ? 'bg-primary-600 hover:bg-primary-700'
                          : 'bg-gray-400 hover:bg-gray-500',
                      )}
                      title={t('Adicionar mais {name}', { name: t(addon.name) })}
                    >
                      <Plus className="h-3 w-3" strokeWidth={3} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Dica */}
      {(removableIngredients.length > 0 || breadIngredients.length > 0) && (
        <p className="text-xs text-gray-400 italic">
          {t('💡 Clique no ✓ para remover ingredientes padrão. Em pão, sabor e upgrade de bebida, apenas uma opção pode ficar selecionada.')}
        </p>
      )}
    </div>
  );
}
