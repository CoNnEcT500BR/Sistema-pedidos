import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Combo, MenuItem } from '@/features/menu/types/menu.types';

export interface CartAddon {
  addonId: string;
  name: string;
  price: number;
  quantity: number;
  removed?: boolean;
}

export interface CartItem {
  cartId: string;
  menuItemId?: string;
  comboId?: string;
  name: string;
  price: number;
  quantity: number;
  notes?: string;
  addons: CartAddon[];
  subtotal: number;
}

export interface CartStore {
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
  const addonsTotal = addons.reduce((sum, addon) => {
    if (addon.removed || addon.quantity <= 0) return sum;
    return sum + addon.price * addon.quantity;
  }, 0);
  return (price + addonsTotal) * quantity;
}

function generateCartId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function createCartStore(storageKey: string) {
  return create<CartStore>()(
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
          set((state) => ({ items: state.items.filter((item) => item.cartId !== cartId) }));
        },

        updateQuantity: (cartId, quantity) => {
          if (quantity <= 0) {
            get().removeItem(cartId);
            return;
          }

          set((state) => ({
            items: state.items.map((item) =>
              item.cartId === cartId
                ? { ...item, quantity, subtotal: calcSubtotal(item.price, item.addons, quantity) }
                : item,
            ),
          }));
        },

        clear: () => set({ items: [] }),

        getTotalItems: () => get().items.reduce((sum, item) => sum + item.quantity, 0),

        getTotalPrice: () => get().items.reduce((sum, item) => sum + item.subtotal, 0),
      }),
      {
        name: storageKey,
        partialize: (state) => ({ items: state.items }),
      },
    ),
  );
}
