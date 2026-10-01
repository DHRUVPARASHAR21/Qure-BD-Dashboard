import assert from 'node:assert/strict';
import test from 'node:test';
import { DASHBOARD_STORE_KEY, createSeedDashboard, loadDashboard, saveDashboard } from '../src/data/dashboardStore.js';

function memoryStorage() {
  const values = new Map();
  return { getItem: (key) => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) };
}

test('hydrates seed data when storage is empty', () => {
  const dashboard = loadDashboard(memoryStorage());
  assert.equal(dashboard.goals.length, 5);
  assert.equal(dashboard.tasks.length, 4);
});

test('round-trips a dashboard through storage', () => {
  const storage = memoryStorage();
  const dashboard = createSeedDashboard();
  dashboard.goals[0][3] = 'On track';
  assert.equal(saveDashboard(dashboard, storage), true);
  assert.equal(loadDashboard(storage).goals[0][3], 'On track');
  assert.ok(JSON.parse(storage.getItem(DASHBOARD_STORE_KEY)).savedAt);
});

test('recovers safely from corrupt stored data', () => {
  const storage = memoryStorage();
  storage.setItem(DASHBOARD_STORE_KEY, '{invalid json');
  assert.equal(loadDashboard(storage).goals.length, 5);
});
