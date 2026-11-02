import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createDeliveryZoneSchema,
  isAllowedDeliveryStatusTransition,
} from './deliveryTypes.js';

test('validates delivery zone fees and time estimates', () => {
  assert.equal(
    createDeliveryZoneSchema.safeParse({
      name: 'Centro',
      fee: 5.5,
      estimatedMinutes: 45,
    }).success,
    true,
  );
  assert.equal(
    createDeliveryZoneSchema.safeParse({
      name: 'Centro',
      fee: -1,
      estimatedMinutes: 2,
    }).success,
    false,
  );
});

test('allows delivery status changes only along the operational workflow', () => {
  assert.equal(isAllowedDeliveryStatusTransition('QUEUED', 'ASSIGNED'), true);
  assert.equal(isAllowedDeliveryStatusTransition('ASSIGNED', 'DELIVERED'), false);
  assert.equal(isAllowedDeliveryStatusTransition('IN_ROUTE', 'DELIVERED'), true);
  assert.equal(isAllowedDeliveryStatusTransition('FAILED', 'ASSIGNED'), true);
});
