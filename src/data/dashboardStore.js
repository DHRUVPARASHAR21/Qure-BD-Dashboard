export const DASHBOARD_STORE_KEY = 'qure.life-sciences-bd.dashboard.v1';
export const DASHBOARD_SCHEMA_VERSION = 6;

const seedGoals = [
  ['Close Novartis evidence collaboration', 'Strategic pharma partnerships', 'Ananya Rao', 'At risk', '2 / 4', '18 Oct', 62],
  ['Convert 3 discovery tracks to proposal', 'Qualified pipeline', 'Rahul Menon', 'On track', '$5.6M / $8.5M', '04 Oct', 78],
  ['Lock APAC lung study protocol', 'Evidence-led market access', 'Dr. Meera Shah', 'Off track', '3 / 6', '29 Sep', 45],
  ['Review Japan and GCC account map', 'Whitespace opportunities', 'Vikram Iyer', 'On track', '9 / 12', '11 Oct', 70],
  ['Submit Roche RWE proposal', 'Proposal conversion', 'Sara Thomas', 'At risk', '43% / 50%', '02 Oct', 55],
];

const seedTasks = [
  { id: 'act-clinical-endpoints', title: 'Confirm clinical endpoint assumptions', owner: 'Dr. Meera Shah', workstream: 'Evidence-led market access', dueDate: 'Today', status: 'Overdue' },
  { id: 'act-novartis-dpa', title: 'Resolve Novartis DPA redlines', owner: 'Ananya Rao', workstream: 'Strategic pharma partnerships', dueDate: '02 Oct', status: 'In progress' },
  { id: 'act-roche-pricing', title: 'Approve Roche pricing guardrails', owner: 'Amit Kulkarni', workstream: 'Proposal conversion', dueDate: '03 Oct', status: 'Not started' },
  { id: 'act-gcc-brief', title: 'Publish GCC whitespace brief', owner: 'Vikram Iyer', workstream: 'Whitespace opportunities', dueDate: '07 Oct', status: 'In progress' },
];

const clone = (value) => JSON.parse(JSON.stringify(value));
const id = (prefix) => globalThis.crypto?.randomUUID?.() ?? `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
const defaultTracker = () => ({ filters: { query: '', owner: 'All owners', status: 'All statuses', workstream: 'All workstreams' }, savedViews: [] });

function goalFromLegacy(goal, index) {
  if (!Array.isArray(goal)) return goal;
  return { id: `goal-${index + 1}`, title: goal[0], workstream: goal[1], owner: goal[2], status: goal[3], progress: goal[4], dueDate: goal[5], confidence: goal[6] };
}

function validGoal(goal) {
  return goal && typeof goal.id === 'string' && typeof goal.title === 'string' && typeof goal.workstream === 'string' && typeof goal.owner === 'string' && typeof goal.status === 'string' && typeof goal.progress === 'string' && typeof goal.dueDate === 'string' && Number.isFinite(Number(goal.confidence));
}

function inferTaskWorkstream(task) {
  if (task.workstream) return task.workstream;
  if (task.id?.includes('clinical')) return 'Evidence-led market access';
  if (task.id?.includes('novartis')) return 'Strategic pharma partnerships';
  if (task.id?.includes('roche')) return 'Proposal conversion';
  if (task.id?.includes('gcc')) return 'Whitespace opportunities';
  return 'General operating cadence';
}

export function createSeedDashboard() {
  return {
    schemaVersion: DASHBOARD_SCHEMA_VERSION,
    goals: seedGoals.map(goalFromLegacy),
    tasks: clone(seedTasks),
    weeklyReview: { notes: [], savedAt: null },
    tracker: defaultTracker(),
    savedAt: null,
  };
}

function isDashboard(value) {
  return value && value.schemaVersion === DASHBOARD_SCHEMA_VERSION && Array.isArray(value.goals) && value.goals.every(validGoal) && Array.isArray(value.tasks) && Array.isArray(value.weeklyReview?.notes) && value.tracker && typeof value.tracker.filters === 'object' && Array.isArray(value.tracker.savedViews);
}

function migrateDashboard(value) {
  if (!value || ![1, 2, 3, 4, 5].includes(value.schemaVersion) || !Array.isArray(value.goals) || !Array.isArray(value.tasks)) return null;
  return {
    schemaVersion: DASHBOARD_SCHEMA_VERSION,
    goals: value.goals.map(goalFromLegacy),
    tasks: value.tasks.map((task, index) => {
      const normalized = Array.isArray(task) ? { id: `migrated-action-${index}`, title: task[0], owner: task[1], dueDate: task[2], status: task[3] } : task;
      return { ...normalized, workstream: inferTaskWorkstream(normalized) };
    }),
    weeklyReview: value.weeklyReview?.notes ? value.weeklyReview : { notes: [], savedAt: null },
    tracker: value.tracker?.filters && Array.isArray(value.tracker.savedViews) ? value.tracker : defaultTracker(),
    savedAt: value.savedAt ?? null,
  };
}

function browserStorage() {
  if (typeof window === 'undefined') return null;
  try { return window.localStorage; } catch { return null; }
}

export function loadDashboard(storage = browserStorage()) {
  if (!storage) return createSeedDashboard();
  try {
    const saved = storage.getItem(DASHBOARD_STORE_KEY);
    if (!saved) return createSeedDashboard();
    const parsed = JSON.parse(saved);
    return isDashboard(parsed) ? parsed : migrateDashboard(parsed) ?? createSeedDashboard();
  } catch { return createSeedDashboard(); }
}

function sanitizeGoal(goal) {
  const title = goal.title?.trim();
  const workstream = goal.workstream?.trim();
  const owner = goal.owner?.trim();
  const progress = goal.progress?.trim();
  const dueDate = goal.dueDate?.trim();
  const confidence = Number(goal.confidence);
  if (!title || !workstream || !owner || !progress || !dueDate || !Number.isFinite(confidence)) return null;
  return { title, workstream, owner, progress, dueDate, status: goal.status ?? 'Not started', confidence: Math.max(0, Math.min(100, confidence)) };
}

export function createGoal(dashboard, goal) {
  const cleanGoal = sanitizeGoal(goal);
  if (!cleanGoal) return dashboard;
  return { ...dashboard, goals: [...dashboard.goals, { id: id('goal'), ...cleanGoal, createdAt: new Date().toISOString() }] };
}

export function importGoals(dashboard, goals) {
  return goals.reduce((current, goal) => createGoal(current, goal), dashboard);
}

export function updateGoal(dashboard, goalId, changes) {
  const cleanGoal = sanitizeGoal(changes);
  if (!cleanGoal) return dashboard;
  return { ...dashboard, goals: dashboard.goals.map((goal) => goal.id === goalId ? { ...goal, ...cleanGoal, updatedAt: new Date().toISOString() } : goal) };
}

export function deleteGoal(dashboard, goalId) {
  return { ...dashboard, goals: dashboard.goals.filter((goal) => goal.id !== goalId) };
}

export function saveTrackerFilters(dashboard, filters) {
  return { ...dashboard, tracker: { ...dashboard.tracker, filters: { ...defaultTracker().filters, ...filters } } };
}

export function createSavedView(dashboard, name, filters) {
  const title = name?.trim();
  if (!title) return dashboard;
  return { ...dashboard, tracker: { ...dashboard.tracker, savedViews: [...dashboard.tracker.savedViews, { id: id('view'), name: title, filters: { ...defaultTracker().filters, ...filters }, createdAt: new Date().toISOString() }] } };
}

export function deleteSavedView(dashboard, viewId) {
  return { ...dashboard, tracker: { ...dashboard.tracker, savedViews: dashboard.tracker.savedViews.filter((view) => view.id !== viewId) } };
}

export function createAction(dashboard, action) {
  const title = action.title?.trim();
  const owner = action.owner?.trim();
  if (!title || !owner || !action.dueDate) return dashboard;
  return { ...dashboard, tasks: [...dashboard.tasks, { id: id('action'), title, owner, workstream: action.workstream?.trim() || 'General operating cadence', dueDate: action.dueDate, status: action.status ?? 'Not started', createdAt: new Date().toISOString() }] };
}

export function toggleActionComplete(dashboard, actionId) {
  return { ...dashboard, tasks: dashboard.tasks.map((task) => task.id === actionId ? { ...task, status: task.status === 'Complete' ? 'In progress' : 'Complete', completedAt: task.status === 'Complete' ? null : new Date().toISOString() } : task) };
}

export function markRemindersSent(dashboard) {
  const sentAt = new Date().toISOString();
  return { ...dashboard, tasks: dashboard.tasks.map((task) => task.status === 'Complete' ? task : { ...task, reminderSentAt: sentAt }) };
}

export function saveWeeklyReviewNote(dashboard, text) {
  const body = text?.trim();
  if (!body) return dashboard;
  const savedAt = new Date().toISOString();
  const existingNotes = dashboard.weeklyReview?.notes ?? [];
  return { ...dashboard, weeklyReview: { notes: [{ id: id('review-note'), body, savedAt }, ...existingNotes], savedAt } };
}

export function saveDashboard(dashboard, storage = browserStorage()) {
  if (!storage || !isDashboard(dashboard)) return false;
  try {
    storage.setItem(DASHBOARD_STORE_KEY, JSON.stringify({ ...dashboard, savedAt: new Date().toISOString() }));
    return true;
  } catch { return false; }
}
