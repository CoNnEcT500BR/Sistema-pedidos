import { Minus, Plus, X } from 'lucide-react';
import type { Addon } from '../types/menu.types';
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

export function IngredientsEditor({ addons, selected, onChange }: IngredientsEditorProps) {
  if (addons.length === 0) return null;

  // Separar ingredientes em dois grupos
  const removableIngredients = addons.filter((a) => a.isRequired === true);
  const extraIngredients = addons.filter((a) => a.isRequired === false);

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

  function updateQuantityToAdd(addon: Addon, delta: number) {
    const existing = selected.find((s) => s.addonId === addon.id);
    const isFlavorOption = addon.name.toLowerCase().startsWith('sabor ');
    const rawNext = (existing?.quantityToAdd ?? 0) + delta;
    const newQuantity = isFlavorOption ? (rawNext > 0 ? 1 : 0) : Math.max(0, rawNext);

    // Bloqueio inteligente: seleção única para extras de sabor
    if (isFlavorOption && newQuantity > 0) {
      const flavorIds = new Set(
        addons
          .filter((a) => a.name.toLowerCase().startsWith('sabor '))
          .map((a) => a.id),
      );

      const cleaned = selected
        .filter((s) => !flavorIds.has(s.addonId))
        .map((s) => ({ ...s }));

      const own = selected.find((s) => s.addonId === addon.id);
      if (own) {
        onChange([...cleaned, { ...own, quantityToAdd: 1, removed: false }]);
      } else {
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
      return;
    }

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
            🚫 Remover
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
                      aria-label={isRemoved ? `Adicionar ${addon.name}` : `Remover ${addon.name}`}
                      title={isRemoved ? `${addon.name} será retirado` : `Retirar ${addon.name}`}
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
                      {addon.name}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Seção: Adicionar extras */}
      {extraIngredients.length > 0 && (
        <div className="flex flex-col gap-2">
          <h4 className="text-sm font-semibold uppercase tracking-wide text-gray-600">
            ➕ Adicionar extras
          </h4>

          <div className="flex flex-col gap-2">
            {extraIngredients.map((addon) => {
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
                    <span className="font-medium text-gray-800">{addon.name}</span>
                    {addon.price > 0 && (
                      <span className="text-xs text-gray-400">
                        +R$ {addon.price.toFixed(2).replace('.', ',')} (adicional)
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
                          aria-label={`Menos ${addon.name}`}
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
                      title={`Adicionar mais ${addon.name}`}
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
      {removableIngredients.length > 0 && (
        <p className="text-xs text-gray-400 italic">
          💡 Clique no ✓ para remover do seu pedido (sem alterar preço). Use + para adicionar
          extras. Em sabor, apenas uma opção pode ficar selecionada.
        </p>
      )}
    </div>
  );
}
