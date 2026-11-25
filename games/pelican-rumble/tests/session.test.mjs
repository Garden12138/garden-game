import test from 'node:test';
import assert from 'node:assert/strict';
import { createSession } from '../src/session.mjs';

function testClock() {
  let now = 0;
  let sequence = 0;
  const tasks = new Map();
  return {
    now: () => now,
    setTimeout(callback, delay) {
      const id = ++sequence;
      tasks.set(id, { callback, at: now + delay });
      return id;
    },
    clearTimeout(id) { tasks.delete(id); },
    advance(ms) {
      const end = now + ms;
      while (tasks.size) {
        const [id, task] = [...tasks].sort((a, b) => a[1].at - b[1].at)[0];
        if (task.at > end) break;
        now = Math.max(now, task.at);
        tasks.delete(id);
        task.callback();
      }
      now = end;
    },
    sleep(ms) { now += ms; },
  };
}

function setup(mode, random = () => 0) {
  const clock = testClock();
  const session = createSession({ clock, random });
  session.start(mode);
  return { clock, session, view: session.getView };
}

const positions = view => view.state.fighters.map(fighter => fighter.position);
const ids = choices => choices.map(choice => choice.id);

test('training plays every card and permits retries from either scripted position', () => {
  const { session, clock, view } = setup('lesson');
  assert.deepEqual(positions(view()), [5, 6]);
  assert.deepEqual(ids(view().previousChoices), ['jab', 'guard']);
  assert.equal(view().timeLeft, null);
  clock.advance(60_000);
  assert.equal(view().phase, 'select');

  session.pick('jab');
  session.lock();
  assert.equal(view().phase, 'reveal');
  assert.equal(view().state.fighters[0].imbalance, 1);
  clock.advance(2_800);
  assert.equal(view().lessonPassed, false);
  session.next();
  assert.equal(view().state.fighters[0].imbalance, 0);
  assert.equal(view().history.length, 0);

  session.pick('throw');
  session.lock();
  clock.advance(7_000);
  assert.equal(view().phase, 'result');
  assert.equal(view().lessonPassed, true);
  session.next();
  assert.equal(view().lesson, 2);
  assert.deepEqual(positions(view()), [5, 8]);
  assert.deepEqual(view().state.fighters.map(f => f.imbalance), [0, 2]);
  assert.deepEqual(view().state.fighters.map(f => f.stamina), [2, 4]);
  assert.deepEqual(ids(view().previousChoices), ['throw', 'guard']);

  session.pick('guard');
  session.lock();
  assert.deepEqual(view().lastResult.knockdowns, [false, true]);
  clock.advance(2_800);
  session.retry();
  assert.equal(view().phase, 'select');
  assert.deepEqual(positions(view()), [5, 8]);
  assert.deepEqual(view().state.fighters.map(f => f.score), [0, 0]);
  assert.deepEqual(ids(view().previousChoices), ['throw', 'guard']);
  session.pick('feint');
  session.lock();
  assert.equal(view().state.fighters[0].imbalance, 2);
  clock.advance(2_800);
  session.next();
  assert.equal(view().mode, 'cpu');
  assert.equal(view().timeLeft, 15);
  assert.deepEqual(positions(view()), [3, 7]);
});

test('each local player gets a private 15s turn and only committed public history is visible', () => {
  const { session, clock, view } = setup('local');
  session.pick('jab');
  session.pick('step');
  session.step('back', 2);
  session.step('toward', 3);
  assert.deepEqual(view().selection, { id: 'step', direction: 'back', steps: 2 });
  session.pick('dive');
  assert.equal(view().selection.id, 'step');
  clock.advance(14_000);
  assert.equal(view().timeLeft, 1);
  clock.advance(1_000);
  assert.equal(view().phase, 'handoff');
  assert.equal(view().side, 1);
  assert.equal(view().selection, null);
  assert.equal(view().previousChoices, null);
  assert.equal(view().lastResult, null);
  assert.deepEqual(view().committed, [true, false]);
  assert.equal(view().timeLeft, null);
  assert.equal(view().history.length, 0);
  clock.advance(40_000);
  session.pick('throw');
  session.lock();
  assert.equal(view().phase, 'handoff');

  session.ready();
  assert.equal(view().selection, null);
  assert.equal(view().timeLeft, 15);
  clock.advance(15_000);
  assert.equal(view().phase, 'reveal');
  assert.deepEqual(view().lastResult.choices, [{ id: 'step', direction: 'back', steps: 2 }, { id: 'guard' }]);
  assert.deepEqual(positions(view()), [1, 7]);
  clock.advance(2_800);
  session.next();
  assert.equal(view().phase, 'handoff');
  assert.equal(view().side, 0);
  assert.equal(view().state.round, 2);
  clock.advance(50_000);
  assert.equal(view().phase, 'handoff');
  session.ready();
  assert.deepEqual(view().committed, [false, false]);
});

test('late inputs cannot replace the timed-out choice, and old timers cannot affect a new session', () => {
  const { session, clock, view } = setup('cpu');
  session.pick('jab');
  clock.sleep(15_500);
  session.pick('guard');
  assert.equal(view().phase, 'reveal');
  assert.equal(view().lastResult.choices[0].id, 'jab');
  session.start('lesson');
  clock.advance(90_000);
  assert.equal(view().phase, 'select');
  assert.equal(view().timeLeft, null);
  session.destroy();
  session.lock();
  session.start('cpu');
  assert.equal(view().mode, 'lesson');
});

test('CPU guards its first close encounter and uses a jab on the first close turn after being thrown', () => {
  const rolls = [0, 0.55];
  const { session, clock, view } = setup('cpu', () => rolls.shift() ?? 0);
  const choices = [];
  function play() {
    session.lock();
    choices.push(view().lastResult.choices[1].id);
    clock.advance(5_800);
  }
  session.step('forward', 2);
  play();
  assert.deepEqual(positions(view()), [5, 6]);
  session.pick('throw');
  play();
  assert.deepEqual(positions(view()), [5, 8]);
  session.step('forward', 2);
  play();
  assert.equal(Math.abs(positions(view())[1] - positions(view())[0]), 1);
  session.pick('guard');
  play();
  assert.deepEqual(choices, ['step', 'guard', 'guard', 'jab']);
});

test('a 12-beat local draw stays on the final result until rematch', () => {
  const { session, clock, view } = setup('local');
  for (let round = 1; round <= 12; round++) {
    if (view().phase === 'handoff') session.ready();
    session.lock();
    session.ready();
    session.lock();
    assert.equal(view().lastResult.before.round, round);
    clock.advance(5_800);
  }
  assert.equal(view().phase, 'over');
  assert.equal(view().state.winner, null);
  assert.equal(view().history.length, 12);
  clock.advance(35_000);
  assert.equal(view().state.round, 12);
  session.next();
  assert.equal(view().mode, 'local');
  assert.equal(view().state.round, 1);
  assert.equal(view().history.length, 0);
});
