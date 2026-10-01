export const DASHBOARD_STORE_KEY = 'qure.life-sciences-bd.dashboard.v1';
export const DASHBOARD_SCHEMA_VERSION = 1;

const seedGoals = [
  ['Close Novartis evidence collaboration', 'Strategic pharma partnerships', 'Ananya Rao', 'At risk', '2 / 4', '18 Oct', 62],
  ['Convert 3 discovery tracks to proposal', 'Qualified pipeline', 'Rahul Menon', 'On track', '$5.6M / $8.5M', '04 Oct', 78],
  ['Lock APAC lung study protocol', 'Evidence-led market access', 'Dr. Meera Shah', 'Off track', '3 / 6', '29 Sep', 45],
  ['Review Japan and GCC account map', 'Whitespace opportunities', 'Vikram Iyer', 'On track', '9 / 12', '11 Oct', 70],
  ['Submit Roche RWE proposal', 'Proposal conversion', 'Sara Thomas', 'At risk', '43% / 50%', '02 Oct', 55],
];

const seedTasks = [
  ['Confirm clinical endpoint assumptions', 'Dr. Meera Shah', 'Today', 'Overdue'],
  ['Resolve Novartis DPA redlines', 'Ananya Rao', '02 Oct', 'In progress'],
  ['Approve Roche pricing guardrails', 'Amit Kulkarni', '03 Oct', 'Not started'],
  ['Publish GCC whitespace brief', 'Vikram Iyer', '07 Oct', 'In progress'],
];

const clone = (value) => JSON.parse(JSON.stringify(value));

export function createSeedDashboard() {
  return { schemaVersion: DASHBOARD_SCHEMA_VERSION, goals: clone(seedGoals), tasks: clone(seedTasks), savedAt: null };
}

function isDashboard(value) {
  return value && value.schemaVersion === DASHBOARD_SCHEMA_VERSION && Array.isArray(value.goals) && Array.isArray(value.tasks);
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
    return isDashboard(parsed) ? parsed : createSeedDashboard();
  } catch { return createSeedDashboard(); }
}

export function saveDashboard(dashboard, storage = browserStorage()) {
  if (!storage || !isDashboard(dashboard)) return false;
  try {
    storage.setItem(DASHBOARD_STORE_KEY, JSON.stringify({ ...dashboard, savedAt: new Date().toISOString() }));
    return true;
  } catch { return false; }
}
