import test from 'node:test';
import assert from 'node:assert/strict';
import { CARDS, createMatch, legal, nextRound, rangeHint, resolveRound } from '../src/rules.mjs';

const jab = { id: 'jab' }, guard = { id: 'guard' }, grab = { id: 'throw' };
const feint = { id: 'feint' }, dive = { id: 'dive' };
const forward = steps => ({ id: 'step', steps, direction: 'forward' });
const back = steps => ({ id: 'step', steps, direction: 'back' });
const field = (state, key) => state.fighters.map(fighter => fighter[key]);

function at(left, right) {
  const state = createMatch();
  state.fighters[0].position = left;
  state.fighters[1].position = right;
  return state;
}

test('the ten-beat broadcast reproduces every position, imbalance and score', () => {
  const script = [
    [forward(1), forward(1), [4, 6], [0, 0], [0, 0]],
    [jab,        guard,      [5, 6], [1, 0], [0, 0]],
    [grab,       guard,      [5, 8], [1, 2], [0, 0]],
    [guard,      dive,       [5, 6], [1, 3], [1, 0]],
    [forward(1), forward(1), [4, 6], [0, 0], [1, 0]],
    [jab,        guard,      [5, 6], [1, 0], [1, 0]],
    [feint,      guard,      [5, 6], [1, 1], [1, 0]],
    [back(2),    grab,       [3, 6], [0, 1], [1, 0]],
    [forward(2), guard,      [5, 6], [0, 1], [1, 0]],
    [grab,       guard,      [5, 8], [0, 3], [2, 0]],
  ];
  let state = createMatch();
  for (const [i, [red, blue, positions, balance, score]] of script.entries()) {
    const result = resolveRound(state, [red, blue]);
    assert.equal(result.state.round, i + 1);
    assert.deepEqual(field(result.state, 'position'), positions);
    assert.deepEqual(field(result.state, 'imbalance'), balance);
    assert.deepEqual(field(result.state, 'score'), score);
    assert.equal(result.state.over, i === 9);
    state = nextRound(result);
    if (i === 3) {
      assert.deepEqual(field(state, 'stamina'), [3, 3]);
      assert.deepEqual(field(state, 'position'), [3, 7]);
      assert.deepEqual(field(state, 'imbalance'), [0, 0]);
    }
  }
  assert.equal(state.winner, 0);
  assert.equal(state.round, 10);
  assert.equal(legal(state, 0, guard), false);
});

test('selection checks energy, rope squares and locked slide parameters', () => {
  const state = createMatch();
  assert.equal(CARDS.length, 6);
  assert.deepEqual(field(state, 'stamina'), [3, 3]);
  for (let position = 1; position <= 9; position++) {
    state.fighters[0].position = position;
    assert.equal(legal(state, 0, dive), [1, 2, 8, 9].includes(position));
  }
  state.fighters[0].stamina = 1;
  assert.equal(legal(state, 0, dive), false);
  assert.equal(legal(state, 0, jab), true);
  assert.equal(legal(state, 0, grab), false);
  for (const invalid of [forward(0), back(3), { id: 'step' }, { id: 'step', direction: 'left', steps: 1 }, null]) {
    assert.equal(legal(state, 0, invalid), false);
    assert.throws(() => resolveRound(state, [invalid, guard]), RangeError);
  }
  assert.equal(legal(state, 0, back(1)), true);
  assert.equal(legal(state, 0, forward(2)), true);
});

test('hits, misses and capped regeneration use reveal and selection as distinct phases', () => {
  const state = at(1, 9);
  const result = resolveRound(state, [dive, grab]);
  assert.deepEqual(result.effects, ['miss', 'miss']);
  assert.deepEqual(field(result.state, 'stamina'), [1, 1]);
  assert.deepEqual(field(result.state, 'imbalance'), [0, 0]);
  assert.deepEqual(result.landings, [2, 9]);
  assert.deepEqual(field(nextRound(result), 'stamina'), [2, 2]);
  state.fighters[0].stamina = 4;
  assert.deepEqual(field(nextRound(resolveRound(state, [guard, guard])), 'stamina'), [4, 4]);
});

test('footwork allows following a vacated square, blocks crossing, and stops at ropes', () => {
  const feet = (left, right, red, blue) => resolveRound(at(left, right), [red, blue]).footwork;
  assert.deepEqual(feet(4, 5, forward(2), back(2)), [6, 7]);
  assert.deepEqual(feet(4, 5, back(2), jab), [2, 4]);
  assert.deepEqual(feet(4, 5, forward(2), forward(2)), [4, 5]);
  assert.deepEqual(feet(4, 6, forward(2), jab), [4, 6]);
  assert.deepEqual(feet(4, 6, forward(2), guard), [5, 6]);
  assert.deepEqual(feet(7, 8, forward(2), back(2)), [8, 9]);
  assert.deepEqual(feet(1, 9, back(2), back(2)), [1, 9]);
});

test('only an actual retreat that escapes a hit restores balance', () => {
  const retreat = (left, right, enemy) => {
    const state = at(left, right);
    state.fighters[0].imbalance = 1;
    return resolveRound(state, [back(2), enemy]);
  };
  assert.deepEqual(field(retreat(3, 4, grab).state, 'imbalance'), [0, 0]);
  assert.deepEqual(field(retreat(1, 2, guard).state, 'imbalance'), [1, 0]);
  assert.deepEqual(field(retreat(2, 3, jab).state, 'imbalance'), [2, 0]);
});

test('stab and throw interactions include interruption, grappling through guard and mirrored hits', () => {
  const thrust = resolveRound(at(3, 5), [jab, grab]);
  assert.deepEqual(thrust.effects, ['hit', 'interrupted']);
  assert.deepEqual(field(thrust.state, 'imbalance'), [0, 1]);
  const blocked = resolveRound(at(1, 6), [jab, guard]);
  assert.deepEqual(blocked.effects, ['miss', 'idle']);
  for (const [left, right, destination] of [[3, 4, 6], [5, 6, 8], [8, 9, 9]]) {
    const caught = resolveRound(at(left, right), [grab, guard]);
    assert.equal(caught.state.fighters[1].position, destination);
    assert.equal(caught.state.fighters[1].imbalance, 2);
  }
  const clash = resolveRound(at(4, 5), [grab, grab]);
  assert.deepEqual(field(clash.state, 'imbalance'), [1, 1]);
  assert.deepEqual(field(clash.state, 'position'), [4, 5]);
  const mutual = resolveRound(at(3, 6), [jab, jab]);
  assert.deepEqual(mutual.footwork, [4, 5]);
  assert.deepEqual(field(mutual.state, 'position'), [3, 6]);
  assert.deepEqual(field(mutual.state, 'imbalance'), [1, 1]);
});

test('a feint needs a guard within two squares, including the alternate fourth beat', () => {
  assert.deepEqual(field(resolveRound(at(5, 7), [feint, guard]).state, 'imbalance'), [0, 1]);
  assert.deepEqual(field(resolveRound(at(5, 8), [guard, feint]).state, 'imbalance'), [0, 0]);
  assert.deepEqual(field(resolveRound(at(5, 6), [feint, back(1)]).state, 'imbalance'), [0, 0]);
});

test('dive range is measured after footwork, landing precedes knockback even on a mutual hit', () => {
  const mutual = resolveRound(at(5, 8), [jab, dive]);
  assert.deepEqual(mutual.footwork, [6, 8]);
  assert.deepEqual(mutual.effects, ['hit', 'hit']);
  assert.deepEqual(mutual.landings, [6, 7]);
  assert.deepEqual(field(mutual.state, 'position'), [6, 8]);
  assert.deepEqual(field(mutual.state, 'imbalance'), [2, 1]);
  const caught = resolveRound(at(7, 8), [grab, dive]);
  assert.deepEqual(caught.landings, [7, 8]);
  assert.deepEqual(caught.effects, ['hit', 'miss']);
  const blocked = resolveRound(at(4, 8), [guard, dive]);
  assert.deepEqual(blocked.landings, [4, 5]);
  assert.deepEqual(field(blocked.state, 'imbalance'), [0, 2]);
  const bothMiss = resolveRound(at(2, 8), [dive, dive]);
  assert.deepEqual(bothMiss.landings, [3, 7]);
  assert.deepEqual(bothMiss.effects, ['miss', 'miss']);
});

test('simultaneous falls score both before choosing the winner, including round twelve', () => {
  for (const [scores, expected, over, winner] of [
    [[0, 0], [1, 1], false, null],
    [[1, 0], [2, 1], true, 0],
    [[0, 1], [1, 2], true, 1],
    [[1, 1], [2, 2], true, null],
  ]) {
    const state = at(7, 8);
    state.fighters.forEach((fighter, side) => Object.assign(fighter, { imbalance: 2, score: scores[side] }));
    const result = resolveRound(state, [grab, grab]);
    assert.deepEqual(result.knockdowns, [true, true]);
    assert.deepEqual(field(result.state, 'score'), expected);
    assert.equal(result.state.over, over);
    assert.equal(result.state.winner, winner);
  }
  const last = at(7, 8);
  last.round = 12;
  last.fighters[0].imbalance = 1;
  const final = resolveRound(last, [guard, grab]).state;
  assert.equal(final.over, true);
  assert.equal(final.winner, 1);
  assert.deepEqual(field(final, 'score'), [0, 1]);
  const draw = resolveRound(last, [guard, guard]).state;
  assert.equal(draw.over, true);
  assert.equal(draw.winner, null);
});

test('range preview includes the jab step and leaves hidden rival choices out', () => {
  const state = at(5, 8);
  assert.match(rangeHint(state, 0, jab), /前踏.*2 格.*现在够得着/);
  assert.match(rangeHint(state, 0, grab), /现在够不着/);
  assert.match(rangeHint(state, 1, dive), /现在够得着/);
  assert.match(rangeHint(state, 0, dive), /绳边/);
  assert.match(rangeHint(state, 0, forward(2)), /7 号位/);
});

test('every legal pair on all 36 starting pairs preserves bounds, side symmetry and input state', () => {
  const choices = [jab, guard, grab, forward(1), forward(2), back(1), back(2), feint, dive];
  for (let left = 1; left < 9; left++) {
    for (let right = left + 1; right <= 9; right++) {
      const state = at(left, right);
      const original = structuredClone(state);
      const mirror = at(10 - right, 10 - left);
      for (const a of choices.filter(choice => legal(state, 0, choice))) {
        for (const b of choices.filter(choice => legal(state, 1, choice))) {
          const result = resolveRound(state, [a, b]);
          const reflected = resolveRound(mirror, [b, a]).state;
          for (const [side, fighter] of result.state.fighters.entries()) {
            assert.deepEqual(fighter, { ...reflected.fighters[1 - side], position: 10 - reflected.fighters[1 - side].position });
            assert.ok(fighter.stamina >= 0 && fighter.stamina <= 4);
            assert.ok(fighter.imbalance >= 0 && fighter.imbalance <= 3);
          }
          for (const [red, blue] of [result.footwork, result.landings, field(result.state, 'position')]) {
            assert.ok(1 <= red && red < blue && blue <= 9);
          }
        }
      }
      assert.deepEqual(state, original);
    }
  }
});
