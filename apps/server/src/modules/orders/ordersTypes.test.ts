import assert from 'node:assert/strict';
import test from 'node:test';
import { createOrderSchema } from './ordersTypes.js';

const items = [{ menuItemId: 'item-1', quantity: 1 }];

test('defaults existing orders to pickup while leaving payment choice optional', () => {
  const parsed = createOrderSchema.parse({ items });

  assert.equal(parsed.fulfillmentType, 'PICKUP');
  assert.equal(parsed.paymentMethod, undefined);
});

test('requires customer and address details for delivery', () => {
  const parsed = createOrderSchema.safeParse({
    items,
    fulfillmentType: 'DELIVERY',
    deliveryZoneId: 'zone-1',
    paymentMethod: 'CASH_ON_DELIVERY',
  });

  assert.equal(parsed.success, false);
});

test('accepts a complete delivery order with payment on receipt', () => {
  const parsed = createOrderSchema.safeParse({
    items,
    fulfillmentType: 'DELIVERY',
    customerName: 'Cliente',
    customerPhone: '(11) 99999-0000',
    deliveryAddress: 'Rua A, 10',
    deliveryZoneId: 'zone-1',
    paymentMethod: 'PIX_ON_DELIVERY',
  });

  assert.equal(parsed.success, true);
});

test('rejects invalid delivery phone numbers and counter payment', () => {
  const parsed = createOrderSchema.safeParse({
    items,
    fulfillmentType: 'DELIVERY',
    customerName: 'Cliente',
    customerPhone: '123',
    deliveryAddress: 'Rua A, 10',
    deliveryZoneId: 'zone-1',
    paymentMethod: 'AT_COUNTER',
  });

  assert.equal(parsed.success, false);
});
