import assert from 'node:assert/strict';
import test from 'node:test';
import { GOAL_CSV_HEADERS, goalCsvTemplate, goalsToCsv, parseGoalCsv } from '../src/data/goalCsv.js';

test('exports and imports quoted goal fields safely', () => {
  const csv = goalsToCsv([{ title: 'Submit Roche, RWE proposal', workstream: 'Proposal conversion', owner: 'Sara Thomas', status: 'At risk', progress: '43% / 50%', dueDate: '02 Oct', confidence: 55 }]);
  const parsed = parseGoalCsv(csv);
  assert.deepEqual(parsed.errors, []);
  assert.equal(parsed.goals[0].title, 'Submit Roche, RWE proposal');
  assert.equal(parsed.goals[0].confidence, 55);
});

test('validates required CSV columns and row data', () => {
  assert.match(parseGoalCsv('Title,Owner\nMissing data,Ananya').errors[0], /Missing required columns/);
  const invalidStatus = `${GOAL_CSV_HEADERS.join(',')}\nMilestone,Pipeline,Ananya,Delayed,1 / 3,20 Oct,70`;
  assert.match(parseGoalCsv(invalidStatus).errors[0], /invalid status/);
});

test('provides a usable import template', () => {
  const parsed = parseGoalCsv(goalCsvTemplate());
  assert.equal(parsed.errors.length, 0);
  assert.equal(parsed.goals.length, 1);
});
