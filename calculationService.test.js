import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateNumerology } from './calculationService.js';

test('calculateNumerology enriches results with summary and movement details', () => {
  const result = calculateNumerology('13800138000');

  assert.deepEqual(result.numbers, [44, 34, 88, 86]);
  assert.deepEqual(result.fourNumbers, [44, 34, 88, 86]);
  assert.equal(result.tableResults.length, 4);
  assert.deepEqual(result.tableResults.map((item) => item.number), [44, 34, 88, 86]);
  assert.equal(typeof result.summary, 'string');
  assert.match(result.summary.toLowerCase(), /moving line|動爻|动爻/);
  assert.equal(typeof result.primary.summary, 'string');
  assert.equal(typeof result.secondary.summary, 'string');
  assert.equal(typeof result.primary.movement.movingLine, 'number');
  assert.equal(typeof result.secondary.movement.movingLine, 'number');
  assert.ok(result.primary.insight);
  assert.ok(result.secondary.insight);
});

test('R1 calculates the inner set from the final four digits', () => {
  const result = calculateNumerology('18687654321');

  assert.deepEqual(result.primary.split, { left: '18687', right: '654321' });
  assert.deepEqual(result.primary.sums, { left: 30, right: 21, total: 51 });
  assert.equal(result.primary.base.number, 65);
  assert.equal(result.primary.movingLine, 3);
  assert.equal(result.primary.result.number, 66);

  assert.deepEqual(result.secondary.split, { left: '43', right: '21' });
  assert.deepEqual(result.secondary.sums, { left: 7, right: 3, total: 10 });
  assert.equal(result.secondary.base.number, 73);
  assert.equal(result.secondary.movingLine, 4);
  assert.equal(result.secondary.result.number, 33);
});

test('splits odd-length input into a shorter first group', () => {
  const result = calculateNumerology('13312334567');

  assert.deepEqual(result.groups.first, { digits: '13312', total: 10 });
  assert.deepEqual(result.groups.second, { digits: '334567', total: 28 });
});
