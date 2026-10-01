import assert from 'node:assert/strict';
import test from 'node:test';
import { DASHBOARD_STORE_KEY, createAction, createSeedDashboard, loadDashboard, markRemindersSent, saveDashboard, toggleActionComplete } from '../src/data/dashboardStore.js';

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

test('creates, completes and timestamps action reminders', () => {
  const initial = createSeedDashboard();
  const withAction = createAction(initial, { title: 'Review APAC evidence scope', owner: 'Ananya Rao', dueDate: '10 Oct' });
  const completed = toggleActionComplete(withAction, withAction.tasks.at(-1).id);
  const reminded = markRemindersSent(completed);
  assert.equal(reminded.tasks.length, 5);
  assert.equal(reminded.tasks.at(-1).status, 'Complete');
  assert.equal(reminded.tasks[0].reminderSentAt.length > 0, true);
});
