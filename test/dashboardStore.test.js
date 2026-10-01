import assert from 'node:assert/strict';
import test from 'node:test';
import { DASHBOARD_STORE_KEY, createAction, createGoal, createSeedDashboard, deleteGoal, loadDashboard, markRemindersSent, saveDashboard, saveWeeklyReviewNote, toggleActionComplete, updateGoal } from '../src/data/dashboardStore.js';

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
  dashboard.goals[0].status = 'On track';
  assert.equal(saveDashboard(dashboard, storage), true);
  assert.equal(loadDashboard(storage).goals[0].status, 'On track');
  assert.ok(JSON.parse(storage.getItem(DASHBOARD_STORE_KEY)).savedAt);
});

test('recovers safely from corrupt stored data', () => {
  const storage = memoryStorage();
  storage.setItem(DASHBOARD_STORE_KEY, '{invalid json');
  assert.equal(loadDashboard(storage).goals.length, 5);
});

test('creates, completes and timestamps action reminders', () => {
  const initial = createSeedDashboard();
  const withAction = createAction(initial, { title: 'Review APAC evidence scope', owner: 'Ananya Rao', workstream: 'Evidence-led market access', dueDate: '10 Oct' });
  const completed = toggleActionComplete(withAction, withAction.tasks.at(-1).id);
  const reminded = markRemindersSent(completed);
  assert.equal(reminded.tasks.length, 5);
  assert.equal(reminded.tasks.at(-1).status, 'Complete');
  assert.equal(reminded.tasks.at(-1).workstream, 'Evidence-led market access');
  assert.equal(reminded.tasks[0].reminderSentAt.length > 0, true);
});

test('migrates existing action items with linked workstreams', () => {
  const storage = memoryStorage();
  storage.setItem(DASHBOARD_STORE_KEY, JSON.stringify({ schemaVersion: 4, goals: createSeedDashboard().goals, tasks: [{ id: 'act-novartis-dpa', title: 'Resolve Novartis DPA redlines', owner: 'Ananya Rao', dueDate: '02 Oct', status: 'In progress' }], weeklyReview: { notes: [] } }));
  assert.equal(loadDashboard(storage).tasks[0].workstream, 'Strategic pharma partnerships');
});

test('saves weekly review notes across storage reloads', () => {
  const storage = memoryStorage();
  const withNote = saveWeeklyReviewNote(createSeedDashboard(), 'Legal confirmed the Novartis DPA route.');
  assert.equal(withNote.weeklyReview.notes[0].body, 'Legal confirmed the Novartis DPA route.');
  assert.ok(withNote.weeklyReview.notes[0].savedAt);
  saveDashboard(withNote, storage);
  assert.equal(loadDashboard(storage).weeklyReview.notes[0].body, 'Legal confirmed the Novartis DPA route.');
});

test('creates, edits and removes goal milestones', () => {
  const initial = createSeedDashboard();
  const created = createGoal(initial, { title: 'Publish India evidence plan', workstream: 'Evidence-led market access', owner: 'Dr. Meera Shah', status: 'On track', progress: '1 / 3', dueDate: '20 Oct', confidence: 76 });
  const added = created.goals.at(-1);
  const updated = updateGoal(created, added.id, { ...added, owner: 'Ananya Rao', status: 'At risk', progress: '1 / 4', confidence: 55 });
  assert.equal(updated.goals.at(-1).owner, 'Ananya Rao');
  assert.equal(updated.goals.at(-1).confidence, 55);
  assert.equal(deleteGoal(updated, added.id).goals.length, initial.goals.length);
});
