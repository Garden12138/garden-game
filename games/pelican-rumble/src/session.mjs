import { createMatch, legal, nextRound, resolveRound } from './rules.mjs';

const PICK_MS = 15_000;
const REVEAL_MS = 2_800;
const RESULT_MS = 3_000;
const stepCard = (direction = 'forward', steps = 1) => ({ id: 'step', direction, steps });
const guard = () => ({ id: 'guard' });
const distance = state => Math.abs(state.fighters[0].position - state.fighters[1].position);

function trainingStart() {
  const state = createMatch();
  state.fighters[0].position = 5;
  state.fighters[1].position = 6;
  return state;
}

// The opponent commits when selection opens, before the player touches a card.
function readOpponent(state, history, random) {
  const gap = distance(state);
  if (gap === 1) {
    const lastThrow = history.findLastIndex(beat =>
      beat.choices[0].id === 'throw' && beat.effects[0] === 'hit');
    if (lastThrow >= 0 && legal(state, 1, { id: 'jab' })) {
      const testedJab = history.slice(lastThrow + 1).some(beat =>
        distance(beat.before) === 1 && beat.choices[1].id === 'jab');
      if (!testedJab) return { id: 'jab' };
    }
    if (!history.some(beat => distance(beat.before) === 1)) return guard();
  }

  let candidates;
  if (gap === 1) {
    candidates = [{ id: 'jab' }, { id: 'throw' }, guard(), stepCard('back', 2)];
  } else if (gap <= 3) {
    candidates = [{ id: 'jab' }, { id: 'jab' }, { id: 'dive' }, guard(), stepCard()];
  } else {
    candidates = [stepCard(), stepCard('forward', 2), { id: 'dive' }];
  }

  if (gap <= 2 && history.at(-1)?.choices[0].id === 'guard') {
    candidates.push({ id: gap === 1 ? 'throw' : 'feint' }, { id: 'feint' });
  }
  if (gap <= 3 && state.fighters[1].imbalance >= 2) {
    candidates.push(stepCard('back', 2));
  }
  const playable = candidates.filter(choice => legal(state, 1, choice));
  return playable[Math.floor(random() * playable.length)] ?? guard();
}

const systemClock = {
  now: () => performance.now(),
  setTimeout: (callback, delay) => setTimeout(callback, delay),
  clearTimeout: handle => clearTimeout(handle),
};

export function createSession({ onChange = () => {}, random = Math.random, clock = systemClock } = {}) {
  let mode;
  let phase;
  let lesson;
  let side;
  let state;
  let history = [];
  let lastResult;
  let selection;
  let locked = [null, null];
  let lessonTwoEntry;
  let deadline = null;
  let timer = null;
  let destroyed = false;

  function timeLeft() {
    return deadline === null ? null : Math.max(0, Math.ceil((deadline - clock.now()) / 1000));
  }

  function getView() {
    const previousChoices = lastResult?.choices ?? (mode === 'lesson' ? [{ id: 'jab' }, guard()] : null);
    return {
      mode, phase, lesson, side, state, selection, timeLeft: timeLeft(),
      lastResult, history, previousChoices,
      committed: locked.map(Boolean),
      lessonPassed: mode === 'lesson' && (phase === 'result' || phase === 'reveal')
        && (lesson === 2 || lastResult.choices[0].id === 'throw'),
    };
  }

  function notify() {
    onChange(getView());
  }

  function stopTimer() {
    clock.clearTimeout(timer);
    timer = null;
    deadline = null;
  }

  function onTick() {
    const remaining = deadline - clock.now();
    if (remaining <= 0) {
      commit();
      return;
    }
    timer = clock.setTimeout(onTick, remaining % 1000 || 1000);
    notify();
  }

  function openSelection() {
    phase = 'select';
    if (mode !== 'lesson') {
      deadline = clock.now() + PICK_MS;
      timer = clock.setTimeout(onTick, 1000);
    }
    notify();
  }

  function beginBeat(handoff = false) {
    stopTimer();
    selection = null;
    side = 0;
    locked = [null, null];
    if (mode === 'cpu') locked[1] = readOpponent(state, history, random);
    if (mode === 'lesson') locked[1] = lesson === 1 ? guard() : { id: 'dive' };
    if (handoff) {
      phase = 'handoff';
      notify();
    } else {
      openSelection();
    }
  }

  function start(newMode) {
    if (destroyed) return;
    if (!['lesson', 'cpu', 'local'].includes(newMode)) throw new RangeError('未知比赛模式');
    mode = newMode;
    lesson = mode === 'lesson' ? 1 : null;
    state = lesson ? trainingStart() : createMatch();
    history = [];
    lastResult = null;
    lessonTwoEntry = null;
    beginBeat();
  }

  function reveal() {
    const before = state;
    lastResult = { ...resolveRound(before, locked), before };
    state = lastResult.state;
    history = [...history, lastResult];
    phase = 'reveal';
    timer = clock.setTimeout(() => {
      phase = state.over && mode !== 'lesson' ? 'over' : 'result';
      if (phase === 'result' && mode !== 'lesson') timer = clock.setTimeout(next, RESULT_MS);
      notify();
    }, REVEAL_MS);
    notify();
  }

  function commit() {
    stopTimer();
    locked[side] = selection ?? guard();
    selection = null;
    if (mode === 'local' && side === 0) {
      side = 1;
      phase = 'handoff';
      notify();
    } else {
      reveal();
    }
  }

  function acceptingChoice() {
    if (destroyed || phase !== 'select') return false;
    if (deadline !== null && clock.now() >= deadline) {
      commit();
      return false;
    }
    return true;
  }

  function pick(id) {
    if (!acceptingChoice()) return;
    const choice = id === 'step' ? (selection?.id === 'step' ? selection : stepCard()) : { id };
    if (legal(state, side, choice)) {
      selection = choice;
      notify();
    }
  }

  function step(direction, steps) {
    if (!acceptingChoice()) return;
    const choice = stepCard(direction, steps);
    if (legal(state, side, choice)) {
      selection = choice;
      notify();
    }
  }

  function lock() {
    if (acceptingChoice()) commit();
  }

  function ready() {
    if (!destroyed && phase === 'handoff') openSelection();
  }

  function retry() {
    if (destroyed || !mode) return;
    if (mode === 'lesson' && lesson === 2) {
      lastResult = lessonTwoEntry;
      history = [lessonTwoEntry];
      state = nextRound(lessonTwoEntry);
      beginBeat();
    } else {
      start(mode);
    }
  }

  function next() {
    if (destroyed) return;
    if (phase === 'over') {
      start(mode);
    } else if (phase === 'result') {
      if (mode === 'lesson') {
        if (lesson === 2) return start('cpu');
        if (lastResult.choices[0].id !== 'throw') return retry();
        lesson = 2;
        lessonTwoEntry = lastResult;
      }
      state = nextRound(lastResult);
      beginBeat(mode === 'local');
    }
  }

  function destroy() {
    stopTimer();
    destroyed = true;
  }

  return { start, pick, step, lock, ready, next, retry, destroy, getView };
}
