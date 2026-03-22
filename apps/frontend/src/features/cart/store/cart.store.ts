import { createCartStore } from './cart-store.base';

export type { CartAddon, CartItem, CartStore } from './cart-store.base';

export const useCartStore = createCartStore('kiosk-cart-v1');
