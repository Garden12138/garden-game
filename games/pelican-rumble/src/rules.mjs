export const CARDS = [
  { id: 'jab', name: '长喙突刺', cost: 1, quote: '上一步，点他一下。', description: '前踏 1 格，攻击距离 1–2。命中使对手失衡 +1、退 1 格，并打断抱摔。' },
  { id: 'guard', name: '护翼反击', cost: 0, quote: '站稳，等他撞上来。', description: '原地挡住够得着的突刺或飞扑，分别让攻击者失衡 +1 或 +2。' },
  { id: 'throw', name: '喉囊抱摔', cost: 2, quote: '挨到身边，一囊兜走。', description: '距离 1 时抓住对手，令其失衡 +2、退 2 格。可以抓住护翼。' },
  { id: 'step', name: '滑步换位', cost: 0, quote: '这一拍，我要站到别处。', description: '前进或后退 1–2 格。实际后撤且未吃招，自身失衡 −1。' },
  { id: 'feint', name: '虚晃诱敌', cost: 0, quote: '让他自己把自己绊倒。', description: '距离 1–2 时骗过护翼，使守方失衡 +1。' },
  { id: 'dive', name: '蹬绳飞扑', cost: 2, quote: '借这根绳，飞过去！', description: '从 1、2、8、9 号位起跳，攻击距离 2–4。命中使对手失衡 +2，被挡则自身失衡 +2。' },
];

const cardsById = new Map(CARDS.map(card => [card.id, card]));
const corners = ['红角', '蓝角'];
const shortNames = { jab: '突刺', guard: '护翼', throw: '抱摔', step: '滑步', feint: '虚晃', dive: '飞扑' };
const homePositions = [3, 7];
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const onRopes = position => [1, 2, 8, 9].includes(position);

export function createMatch() {
  return {
    round: 1,
    fighters: homePositions.map(position => ({ position, stamina: 3, imbalance: 0, score: 0 })),
    over: false,
    winner: null,
  };
}

export function legal(state, side, choice) {
  const card = cardsById.get(choice?.id);
  const fighter = state.fighters[side];
  if (state.over || !fighter || !card || card.cost > fighter.stamina) return false;
  if (card.id === 'dive') return onRopes(fighter.position);
  if (card.id === 'step') {
    return ['forward', 'back'].includes(choice.direction) && [1, 2].includes(choice.steps);
  }
  return true;
}

// Signed moves are in ring coordinates. Test both proposals together so a
// fighter can follow the other into a vacated space within the same substep.
function moveTogether(positions, moves) {
  let current = [...positions];
  const facing = Math.sign(current[1] - current[0]);
  const count = Math.max(...moves.map(Math.abs));
  for (let step = 0; step < count; step++) {
    const next = current.map((position, side) => {
      const stride = step < Math.abs(moves[side]) ? Math.sign(moves[side]) : 0;
      return clamp(position + stride, 1, 9);
    });
    if (Math.sign(next[1] - next[0]) !== facing) break;
    current = next;
  }
  return current;
}

function footMove(choice, facing) {
  if (choice.id === 'jab') return facing;
  if (choice.id === 'step') return (choice.direction === 'back' ? -1 : 1) * facing * choice.steps;
  return 0;
}

function reaches(id, distance) {
  switch (id) {
    case 'throw': return distance === 1;
    case 'jab':
    case 'feint': return distance <= 2;
    case 'dive': return distance >= 2 && distance <= 4;
    default: return false;
  }
}

export function rangeHint(state, side, choice) {
  if (!cardsById.has(choice?.id)) return '';
  const own = state.fighters[side], rival = state.fighters[1 - side];
  if (cardsById.get(choice.id).cost > own.stamina) return '体力不足';
  if (choice.id === 'dive' && !onRopes(own.position)) return '需要在绳边起跳';
  if (choice.id === 'guard') return '原地护翼 · 防突刺与飞扑';
  if (choice.id === 'step' && !legal(state, side, choice)) return '选择方向和步数';
  const facing = Math.sign(rival.position - own.position);
  const [projected] = moveTogether([own.position, rival.position], [footMove(choice, facing), 0]);
  if (choice.id === 'step') return `对手原地时可到 ${projected} 号位`;
  const distance = Math.abs(rival.position - projected);
  const range = reaches(choice.id, distance) ? '现在够得着' : '现在够不着';
  const location = distance === 1 ? '贴身' : `相距 ${distance} 格`;
  return `${choice.id === 'jab' ? '计入前踏，' : ''}${location} · ${range}`;
}

function outcome(id, rival, distance) {
  const inReach = reaches(id, distance);
  switch (id) {
    case 'guard':
      return (rival === 'jab' || rival === 'dive') && reaches(rival, distance) ? 'guard' : 'idle';
    case 'feint': return inReach && rival === 'guard' ? 'hit' : 'feint';
    case 'step': return 'moved';
    case 'throw':
      if (rival === 'jab' && reaches('jab', distance)) return 'interrupted';
      if (inReach && rival === 'throw') return 'clash';
      return inReach ? 'hit' : 'miss';
    default: // jab or dive
      if (!inReach) return 'miss';
      return rival === 'guard' ? 'blocked' : 'hit';
  }
}

const impact = {
  jab:   { imbalance: 1, push: 1 },
  throw: { imbalance: 2, push: 2 },
  feint: { imbalance: 1, push: 0 },
  dive:  { imbalance: 2, push: 0 },
};

function summarize(choices, effects, positions, knockdowns) {
  const lines = [];
  if (effects[0] === 'clash') {
    lines.push('两只喉囊同时兜住对方，双方原地绊了一跤');
  } else {
    for (const [side, effect] of effects.entries()) {
      const corner = corners[side], other = corners[1 - side];
      const id = choices[side].id, rival = choices[1 - side].id;
      switch (effect) {
        case 'hit': {
          if (id === 'throw') lines.push(`${corner}抱摔抓住${other}，将它摔到 ${positions[1 - side]} 号位`);
          if (id === 'jab') lines.push(`${corner}突刺${rival === 'throw' ? '打断抱摔' : '命中' }，${other}落在 ${positions[1 - side]} 号位`);
          if (id === 'dive') lines.push(`${corner}飞扑撞上${other}，${other}失衡 +2`);
          if (id === 'feint') lines.push(`${corner}虚晃骗开护翼，${other}失衡 +1`);
          break;
        }
        case 'guard':
          lines.push(`${corner}护翼挡下${shortNames[rival]}，${other}失衡 +${impact[rival].imbalance}`);
          break;
        case 'miss': lines.push(`${corner}${shortNames[id]}扑空`); break;
        case 'moved': lines.push(`${corner}滑步后站在 ${positions[side]} 号位`); break;
        case 'steady': lines.push(`${corner}后撤到 ${positions[side]} 号位，稳住了脚步`); break;
        case 'feint': lines.push(`${corner}虚晃一招`); break;
      }
    }
  }
  if (!lines.length) lines.push('双方都架起翅膀，等着对面先出手');
  if (knockdowns.every(Boolean)) lines.push('双方同时倒地');
  else if (knockdowns.some(Boolean)) lines.push(`${corners[knockdowns.indexOf(true)]}倒地`);
  return lines.join('，') + '。';
}

export function resolveRound(state, choices) {
  if (choices?.length !== 2 || !legal(state, 0, choices[0]) || !legal(state, 1, choices[1])) {
    throw new RangeError('本拍需要双方各提交一张可用的动作牌');
  }
  const start = state.fighters.map(fighter => fighter.position);
  const facing = start.map((position, side) => Math.sign(start[1 - side] - position));
  const footwork = moveTogether(start, choices.map((choice, side) => footMove(choice, facing[side])));
  const distance = Math.abs(footwork[1] - footwork[0]);
  const effects = choices.map((choice, side) => outcome(choice.id, choices[1 - side].id, distance));

  // Register both hits at the same distance, before applying any landing or push.
  const balanceChange = [0, 0], pushes = [0, 0];
  effects.forEach((effect, side) => {
    const move = impact[choices[side].id], rival = 1 - side;
    if (effect === 'hit') {
      balanceChange[rival] += move.imbalance;
      pushes[rival] = facing[side] * move.push;
    } else if (effect === 'blocked') {
      balanceChange[side] += move.imbalance;
    } else if (effect === 'clash') {
      balanceChange[side] += 1;
    }
  });
  const dives = choices.map((choice, side) => {
    if (choice.id !== 'dive') return 0;
    const strides = reaches('dive', distance) ? distance - 1 : Math.min(1, distance - 1);
    return strides * facing[side];
  });
  const landings = moveTogether(footwork, dives);
  const positions = moveTogether(landings, pushes);
  const fighters = state.fighters.map((fighter, side) => {
    const choice = choices[side];
    if (choice.id === 'step' && choice.direction === 'back' && footwork[side] !== start[side] && balanceChange[side] === 0) {
      balanceChange[side] = -1;
      effects[side] = 'steady';
    }
    return {
      ...fighter,
      position: positions[side],
      imbalance: clamp(fighter.imbalance + balanceChange[side], 0, 3),
      stamina: fighter.stamina - cardsById.get(choice.id).cost,
    };
  });
  const knockdowns = fighters.map(fighter => fighter.imbalance === 3);
  fighters.forEach((fighter, side) => { if (knockdowns[1 - side]) fighter.score++; });
  const over = state.round >= 12 || fighters.some(fighter => fighter.score >= 2);
  const [red, blue] = fighters;
  const winner = over && red.score !== blue.score ? Number(blue.score > red.score) : null;
  return {
    state: { round: state.round, fighters, over, winner },
    choices: choices.map(choice => ({ ...choice })),
    footwork, landings, effects, knockdowns,
    summary: summarize(choices, effects, positions, knockdowns),
  };
}

export function nextRound({ state, knockdowns }) {
  if (state.over) return state;
  const reset = knockdowns.some(Boolean);
  return {
    ...state,
    round: state.round + 1,
    fighters: state.fighters.map((fighter, side) => reset
      ? { ...fighter, position: homePositions[side], stamina: 3, imbalance: 0 }
      : { ...fighter, stamina: Math.min(4, fighter.stamina + 1) }),
  };
}
