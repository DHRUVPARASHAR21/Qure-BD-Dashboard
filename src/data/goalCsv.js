export const GOAL_CSV_HEADERS = ['Objective / milestone', 'Workstream', 'Owner', 'Status', 'Actual / target', 'Due date', 'Confidence'];
const ALLOWED_STATUSES = new Set(['On track', 'At risk', 'Off track']);

function parseRows(text) {
  const rows = [];
  let row = [];
  let cell = '';
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (quoted && char === '"' && text[index + 1] === '"') { cell += '"'; index += 1; continue; }
    if (char === '"') { quoted = !quoted; continue; }
    if (!quoted && char === ',') { row.push(cell.trim()); cell = ''; continue; }
    if (!quoted && (char === '\n' || char === '\r')) {
      if (char === '\r' && text[index + 1] === '\n') index += 1;
      row.push(cell.trim());
      if (row.some(Boolean)) rows.push(row);
      row = [];
      cell = '';
      continue;
    }
    cell += char;
  }
  row.push(cell.trim());
  if (row.some(Boolean)) rows.push(row);
  return rows;
}

const escape = (value) => `"${String(value ?? '').replaceAll('"', '""')}"`;

export function goalsToCsv(goals) {
  const rows = goals.map((goal) => [goal.title, goal.workstream, goal.owner, goal.status, goal.progress, goal.dueDate, goal.confidence]);
  return [GOAL_CSV_HEADERS, ...rows].map((row) => row.map(escape).join(',')).join('\n');
}

export function goalCsvTemplate() {
  return [GOAL_CSV_HEADERS, ['Example APAC evidence study', 'Evidence-led market access', 'Dr. Meera Shah', 'On track', '1 / 3', '20 Oct', '70']].map((row) => row.map(escape).join(',')).join('\n');
}

export function parseGoalCsv(text) {
  const rows = parseRows(text.replace(/^\uFEFF/, ''));
  if (!rows.length) return { goals: [], errors: ['The CSV file is empty.'] };
  const headerIndex = Object.fromEntries(rows[0].map((header, index) => [header.toLowerCase(), index]));
  const missing = GOAL_CSV_HEADERS.filter((header) => headerIndex[header.toLowerCase()] === undefined);
  if (missing.length) return { goals: [], errors: [`Missing required column${missing.length > 1 ? 's' : ''}: ${missing.join(', ')}.`] };
  const goals = [];
  const errors = [];
  rows.slice(1).forEach((row, index) => {
    const value = (header) => row[headerIndex[header.toLowerCase()]]?.trim() ?? '';
    const title = value('Objective / milestone');
    const workstream = value('Workstream');
    const owner = value('Owner');
    const status = value('Status');
    const progress = value('Actual / target');
    const dueDate = value('Due date');
    const confidence = Number(value('Confidence'));
    const rowNumber = index + 2;
    if (!title || !workstream || !owner || !progress || !dueDate || !Number.isFinite(confidence)) { errors.push(`Row ${rowNumber} needs all required fields and a numeric confidence score.`); return; }
    if (!ALLOWED_STATUSES.has(status)) { errors.push(`Row ${rowNumber} has an invalid status. Use On track, At risk, or Off track.`); return; }
    goals.push({ title, workstream, owner, status, progress, dueDate, confidence: Math.max(0, Math.min(100, confidence)) });
  });
  return { goals, errors };
}
