import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Combo, MenuItem } from '@/features/menu/types/menu.types';
import type { CartAddon, CartItem } from './cart.store';

interface StaffCartStore {
  items: CartItem[];
  addMenuItem: (item: MenuItem, quantity: number, addons: CartAddon[], notes?: string) => void;
  addCombo: (combo: Combo, quantity: number, addons: CartAddon[], notes?: string) => void;
  removeItem: (cartId: string) => void;
  updateQuantity: (cartId: string, quantity: number) => void;
  clear: () => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
}

function calcSubtotal(price: number, addons: CartAddon[], quantity: number): number {
  const addonsTotal = addons.reduce((sum, a) => {
    if (a.removed || a.quantity <= 0) return sum;
    return sum + a.price * a.quantity;
  }, 0);
  return (price + addonsTotal) * quantity;
}

function generateCartId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export const useStaffCartStore = create<StaffCartStore>()(
  persist(
    (set, get) => ({
      items: [],

      addMenuItem: (item, quantity, addons, notes) => {
        const cartItem: CartItem = {
          cartId: generateCartId(),
          menuItemId: item.id,
          name: item.name,
          price: item.price,
          quantity,
          notes,
          addons,
          subtotal: calcSubtotal(item.price, addons, quantity),
        };
        set((state) => ({ items: [...state.items, cartItem] }));
      },

      addCombo: (combo, quantity, addons, notes) => {
        const cartItem: CartItem = {
          cartId: generateCartId(),
          comboId: combo.id,
          name: combo.name,
          price: combo.price,
          quantity,
          notes,
          addons,
          subtotal: calcSubtotal(combo.price, addons, quantity),
        };
        set((state) => ({ items: [...state.items, cartItem] }));
      },

      removeItem: (cartId) => {
        set((state) => ({ items: state.items.filter((i) => i.cartId !== cartId) }));
      },

      updateQuantity: (cartId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(cartId);
          return;
        }
        set((state) => ({
          items: state.items.map((i) =>
            i.cartId === cartId
              ? { ...i, quantity, subtotal: calcSubtotal(i.price, i.addons, quantity) }
              : i,
          ),
        }));
      },

      clear: () => set({ items: [] }),

      getTotalItems: () => get().items.reduce((sum, i) => sum + i.quantity, 0),

      getTotalPrice: () => get().items.reduce((sum, i) => sum + i.subtotal, 0),
    }),
    {
      name: 'staff-cart-v1',
      partialize: (state) => ({ items: state.items }),
    },
  ),
);
