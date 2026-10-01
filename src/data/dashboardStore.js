export const DASHBOARD_STORE_KEY = 'qure.life-sciences-bd.dashboard.v1';
export const DASHBOARD_SCHEMA_VERSION = 3;

const seedGoals = [
  ['Close Novartis evidence collaboration', 'Strategic pharma partnerships', 'Ananya Rao', 'At risk', '2 / 4', '18 Oct', 62],
  ['Convert 3 discovery tracks to proposal', 'Qualified pipeline', 'Rahul Menon', 'On track', '$5.6M / $8.5M', '04 Oct', 78],
  ['Lock APAC lung study protocol', 'Evidence-led market access', 'Dr. Meera Shah', 'Off track', '3 / 6', '29 Sep', 45],
  ['Review Japan and GCC account map', 'Whitespace opportunities', 'Vikram Iyer', 'On track', '9 / 12', '11 Oct', 70],
  ['Submit Roche RWE proposal', 'Proposal conversion', 'Sara Thomas', 'At risk', '43% / 50%', '02 Oct', 55],
];

const seedTasks = [
  { id: 'act-clinical-endpoints', title: 'Confirm clinical endpoint assumptions', owner: 'Dr. Meera Shah', dueDate: 'Today', status: 'Overdue' },
  { id: 'act-novartis-dpa', title: 'Resolve Novartis DPA redlines', owner: 'Ananya Rao', dueDate: '02 Oct', status: 'In progress' },
  { id: 'act-roche-pricing', title: 'Approve Roche pricing guardrails', owner: 'Amit Kulkarni', dueDate: '03 Oct', status: 'Not started' },
  { id: 'act-gcc-brief', title: 'Publish GCC whitespace brief', owner: 'Vikram Iyer', dueDate: '07 Oct', status: 'In progress' },
];

const clone = (value) => JSON.parse(JSON.stringify(value));

export function createSeedDashboard() {
  return {
    schemaVersion: DASHBOARD_SCHEMA_VERSION,
    goals: clone(seedGoals),
    tasks: clone(seedTasks),
    weeklyReview: { notes: [], savedAt: null },
    savedAt: null,
  };
}

function isDashboard(value) {
  return value && value.schemaVersion === DASHBOARD_SCHEMA_VERSION && Array.isArray(value.goals) && Array.isArray(value.tasks) && Array.isArray(value.weeklyReview?.notes);
}

function migrateDashboard(value) {
  if (!value || ![1, 2].includes(value.schemaVersion) || !Array.isArray(value.goals) || !Array.isArray(value.tasks)) return null;
  return {
    schemaVersion: DASHBOARD_SCHEMA_VERSION,
    goals: value.goals,
    tasks: value.tasks.map((task, index) => Array.isArray(task) ? {
      id: `migrated-action-${index}`,
      title: task[0],
      owner: task[1],
      dueDate: task[2],
      status: task[3],
    } : task),
    weeklyReview: { notes: [], savedAt: null },
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

export function createAction(dashboard, action) {
  const title = action.title?.trim();
  const owner = action.owner?.trim();
  if (!title || !owner || !action.dueDate) return dashboard;
  return {
    ...dashboard,
    tasks: [...dashboard.tasks, {
      id: globalThis.crypto?.randomUUID?.() ?? `action-${Date.now()}`,
      title,
      owner,
      dueDate: action.dueDate,
      status: action.status ?? 'Not started',
      createdAt: new Date().toISOString(),
    }],
  };
}

export function toggleActionComplete(dashboard, actionId) {
  return {
    ...dashboard,
    tasks: dashboard.tasks.map((task) => task.id === actionId ? {
      ...task,
      status: task.status === 'Complete' ? 'In progress' : 'Complete',
      completedAt: task.status === 'Complete' ? null : new Date().toISOString(),
    } : task),
  };
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
  return {
    ...dashboard,
    weeklyReview: {
      notes: [{ id: globalThis.crypto?.randomUUID?.() ?? `review-note-${Date.now()}`, body, savedAt }, ...existingNotes],
      savedAt,
    },
  };
}

export function saveDashboard(dashboard, storage = browserStorage()) {
  if (!storage || !isDashboard(dashboard)) return false;
  try {
    storage.setItem(DASHBOARD_STORE_KEY, JSON.stringify({ ...dashboard, savedAt: new Date().toISOString() }));
    return true;
  } catch { return false; }
}
