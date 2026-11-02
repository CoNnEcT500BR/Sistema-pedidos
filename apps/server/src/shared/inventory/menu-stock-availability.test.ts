import assert from 'node:assert/strict';
import test from 'node:test';

import { isMenuItemStockAvailable } from './menu-stock-availability.js';

test('manual unavailability takes precedence over stock', () => {
  assert.equal(isMenuItemStockAvailable({ isAvailable: false, addons: [] }), false);
});

test('unknown initial stock does not block a menu item', () => {
  assert.equal(
    isMenuItemStockAvailable({
      isAvailable: true,
      addons: [
        {
          isRequired: true,
          stockQuantity: 1,
          inventoryIngredient: { currentQuantity: null },
        },
      ],
    }),
    true,
  );
});

test('counted stock below recipe consumption blocks a menu item', () => {
  assert.equal(
    isMenuItemStockAvailable({
      isAvailable: true,
      addons: [
        {
          isRequired: true,
          stockQuantity: 2,
          inventoryIngredient: { currentQuantity: 1 },
        },
      ],
    }),
    false,
  );
});

test('unavailable optional stock does not block the base menu item', () => {
  assert.equal(
    isMenuItemStockAvailable({
      isAvailable: true,
      addons: [
        {
          isRequired: false,
          stockQuantity: 1,
          inventoryIngredient: { currentQuantity: 0 },
        },
      ],
    }),
    true,
  );
});

test('an invalid required recipe quantity blocks a counted item', () => {
  assert.equal(
    isMenuItemStockAvailable({
      isAvailable: true,
      addons: [
        {
          isRequired: true,
          stockQuantity: null,
          inventoryIngredient: { currentQuantity: 5 },
        },
      ],
    }),
    false,
  );
});
