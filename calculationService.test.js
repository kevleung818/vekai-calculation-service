import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateNumerology } from './calculationService.js';

test('calculateNumerology enriches results with summary and movement details', () => {
  const result = calculateNumerology('13800138000');

  assert.deepEqual(result.numbers, [53, 63, 38, 18]);
  assert.deepEqual(result.fourNumbers, [53, 63, 38, 18]);
  assert.equal(result.tableResults.length, 4);
  assert.deepEqual(result.tableResults.map((item) => item.number), [53, 63, 38, 18]);
  assert.equal(typeof result.summary, 'string');
  assert.match(result.summary.toLowerCase(), /moving line|動爻|动爻/);
  assert.equal(typeof result.primary.summary, 'string');
  assert.equal(typeof result.secondary.summary, 'string');
  assert.equal(typeof result.primary.movement.movingLine, 'number');
  assert.equal(typeof result.secondary.movement.movingLine, 'number');
  assert.ok(result.primary.insight);
  assert.ok(result.secondary.insight);
});
