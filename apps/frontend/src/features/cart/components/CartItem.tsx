import { Minus, Plus, Trash2 } from 'lucide-react';
import type { CartItem as CartItemType } from '../store/cart.store';

interface CartItemProps {
  item: CartItemType;
  onRemove: (cartId: string) => void;
  onUpdateQuantity: (cartId: string, quantity: number) => void;
}

export function CartItemRow({ item, onRemove, onUpdateQuantity }: CartItemProps) {
  const removedAddons = item.addons.filter((addon) => addon.removed);
  const extraAddons = item.addons.filter((addon) => !addon.removed);

  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-1 flex-col gap-0.5">
          <span className="font-bold text-gray-900">{item.name}</span>
          {removedAddons.length > 0 && (
            <div className="mt-2 rounded-lg border border-red-100 bg-red-50 p-2">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-red-500">Removidos</p>
              <ul className="mt-1 flex flex-col gap-0.5">
                {removedAddons.map((a, index) => (
                  <li key={`${a.addonId}-removed-${index}`} className="text-xs font-medium text-red-600">
                    - Sem {a.name}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {extraAddons.length > 0 && (
            <div className="mt-2 rounded-lg border border-gray-100 bg-gray-50 p-2">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">Adicionais</p>
              <ul className="mt-1 flex flex-col gap-0.5">
                {extraAddons.map((a, index) => (
                  <li key={`${a.addonId}-${index}`} className="text-xs text-gray-600">
                    + {a.name} ×{a.quantity}
                    {a.price > 0 && ` (R$ ${(a.price * a.quantity).toFixed(2).replace('.', ',')})`}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {item.notes && (
            <p className="mt-1 text-xs italic text-gray-400">"{item.notes}"</p>
          )}
        </div>
        <button
          onClick={() => onRemove(item.cartId)}
          className="flex h-11 w-11 items-center justify-center rounded-full text-gray-400 transition hover:bg-red-50 hover:text-red-500 active:scale-90 focus:outline-none focus-visible:ring-4 focus-visible:ring-red-200"
          aria-label="Remover item"
        >
          <Trash2 className="h-5 w-5" />
        </button>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => onUpdateQuantity(item.cartId, item.quantity - 1)}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-gray-100 text-gray-700 transition hover:bg-gray-200 active:scale-90 focus:outline-none focus-visible:ring-4 focus-visible:ring-gray-200"
            aria-label="Diminuir"
          >
            <Minus className="h-4 w-4" />
          </button>
          <span className="w-6 text-center text-xl font-bold text-gray-900">{item.quantity}</span>
          <button
            onClick={() => onUpdateQuantity(item.cartId, item.quantity + 1)}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-primary-500 text-white shadow transition hover:bg-primary-600 active:scale-90 focus:outline-none focus-visible:ring-4 focus-visible:ring-primary-300"
            aria-label="Aumentar"
          >
            <Plus className="h-4 w-4" strokeWidth={3} />
          </button>
        </div>
        <span className="text-lg font-bold text-primary-600">
          R$ {item.subtotal.toFixed(2).replace('.', ',')}
        </span>
      </div>
    </div>
  );
}
