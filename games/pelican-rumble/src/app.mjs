import { CARDS, legal, rangeHint } from './rules.mjs';
import { createSession } from './session.mjs';
import { createArena, fighterPortrait } from './arena.mjs';
import { cardArt } from './card-art.mjs';
import { createSound } from './sound.mjs';
import { icon } from './icons.mjs';

const $ = selector => document.querySelector(selector);
const all = selector => [...document.querySelectorAll(selector)];
const names = ['车铃爵士', '返场大王'];
const corners = ['红角', '蓝角'];
const byId = new Map(CARDS.map(card => [card.id, card]));
const captions = {
  jab: ['前踏突刺，打断抱摔', '前踏后 1–2 格'],
  guard: ['挡下突刺与飞扑', '原地防守'],
  throw: ['抓破护翼，摔退两格', '贴身 1 格'],
  step: ['调整距离，后撤稳身', '进退 1–2 格'],
  feint: ['假动作骗开护翼', '距离 1–2 格'],
  dive: ['借绳起跳，重击对手', '绳边 · 2–4 格'],
};
const defaultChoice = id => id === 'step' ? { id, direction:'forward', steps:1 } : { id };
const choiceLabel = choice => choice.id === 'step'
  ? '滑步' + (choice.direction === 'back' ? '退' : '进') + choice.steps
  : byId.get(choice.id).name;
const sound = createSound();
let soundOn = false;
let lastView;
let shownScene;
let hudTimers = [];
let openedSheet;
const arena = createArena($('#arena'));
const session = createSession({ onChange:render });

all('[data-icon]').forEach(el => { el.innerHTML = icon(el.dataset.icon); });
const huds = all('.fighter-hud');
huds.forEach((el, side) => {
  el.innerHTML = '<div class="fighter-avatar" aria-hidden="true">'+fighterPortrait(side)+'</div>'+
    '<div class="identity"><span class="corner">'+corners[side]+'<small>'+['RED CORNER','BLUE CORNER'][side]+'</small></span>'+
    '<strong>'+names[side]+'</strong><span class="score-line"></span></div>'+
    '<div class="stats"><div class="stat stamina"></div><div class="stat balance"></div></div>';
});
$('#cards').innerHTML = CARDS.map(({id,name,cost},i) => '<button type="button" class="card" data-card="'+id+'" aria-keyshortcuts="'+(i+1)+'">'+
  '<span class="art-panel">'+cardArt(id)+'<span class="hotkey" aria-hidden="true">'+(i+1)+'</span><span class="cost" aria-label="消耗 '+cost+' 点体力">'+icon('bolt')+cost+'</span></span>'+
  '<span class="card-copy"><strong>'+name+'</strong><small>'+captions[id][0]+'</small></span><span class="card-foot"></span></button>').join('');
const cards = all('[data-card]');
function updateContents(el, html) {
  if (el._markup !== html) { el.innerHTML = html; el._markup = html; }
}
function meter(label,value,max) {
  return '<span>'+label+'</span><span class="meter" aria-label="'+value+' / '+max+'">'+
    Array.from({length:max},(_,i)=>'<i class="'+(i<value?'on':'')+'"></i>').join('')+'</span>';
}
function renderHUD(state, earlyScores) {
  $('#round').textContent = String(state.round).padStart(2,'0');
  state.fighters.forEach((fighter, side) => {
    const el = huds[side], score = earlyScores?.[side] ?? fighter.score;
    updateContents(el.querySelector('.stamina'), meter('体力',fighter.stamina,4));
    updateContents(el.querySelector('.balance'), meter('失衡',fighter.imbalance,3));
    const scoreLine = el.querySelector('.score-line');
    scoreLine.setAttribute('aria-label','击倒得分 '+score);
    updateContents(scoreLine,'击倒 '+score+' / 2 '+Array.from({length:2},(_,i)=>'<i class="'+(i<score?'on':'')+'"></i>').join(''));
  });
}
function animateHUD(view) {
  const {before,state,choices} = view.lastResult;
  const paid = before.fighters.map((fighter,i)=>({...fighter, stamina:fighter.stamina-byId.get(choices[i].id).cost}));
  renderHUD({...before,fighters:paid});
  hudTimers.push(setTimeout(()=>renderHUD(state,before.fighters.map(f=>f.score)),1250));
  hudTimers.push(setTimeout(()=>renderHUD(state),1950));
}
function paintArena(view) {
  const {phase,state,lastResult} = view;
  if (phase === 'reveal' && lastView?.lastResult !== lastResult) {
    arena.play(lastResult.before,lastResult);
    sound.reveal(lastResult);
    shownScene = state;
    animateHUD(view);
  } else if (phase !== 'reveal') {
    for (const timer of hudTimers) clearTimeout(timer);
    hudTimers = [];
    if (shownScene !== state) {
      if (view.mode !== 'lesson' && state.round === 1 && phase === 'select') {
        arena.introduce(state);
      } else {
        arena.show(state);
      }
      shownScene = state;
    }
    renderHUD(state);
  }
  const positions = state.fighters.map(f=>f.position);
  $('#arena').setAttribute('aria-label','九格擂台，红角在 '+positions[0]+' 号位，蓝角在 '+positions[1]+' 号位');
}
function showChoices(view) {
  const current = ['reveal','result','over'].includes(view.phase);
  const label = current ? '同揭' : '上拍';
  const choices = view.previousChoices;
  const el = $('#reveal-cards');
  el.hidden = !choices || view.phase === 'handoff' || view.phase === 'over';
  el.classList.toggle('previous',!current);
  $('.camera-label').hidden = current && view.phase !== 'over';
  if (!el.hidden) updateContents(el, (current?'':'<small>'+label+'</small>')+
    choices.map((choice,side)=>'<b class="'+(side?'blue':'red')+'">'+corners[side]+' · '+choiceLabel(choice)+'</b>').join(''));
}
function stageOverlay(view) {
  const el = $('#stage-message');
  el.hidden = view.phase !== 'handoff' && view.phase !== 'over';
  if (el.hidden) { updateContents(el,''); return; }
  if (view.phase === 'handoff') {
    updateContents(el, icon('users',28)+'<strong>请交给'+corners[view.side]+'选手</strong><p>接手后点击就位，开始本拍暗选。</p>'+
      '<button type="button" class="primary" data-action="ready">'+corners[view.side]+'已就位 '+icon('arrow')+'</button>');
  } else {
    const scores = view.state.fighters.map(f=>f.score);
    const victor = view.state.winner;
    const decisive = victor === null ? view.lastResult :
      view.history.findLast(beat=>beat.knockdowns[1-victor]) ?? view.lastResult;
    updateContents(el,'<strong>'+(victor === null?'平局终场':names[victor]+' 获胜')+'</strong>'+
      '<span class="end-score">'+scores.join(' · ')+'</span><p>第 '+decisive.state.round+' 拍 · '+decisive.choices.map(choiceLabel).join(' 对 ')+
      '</p><button type="button" class="primary" data-action="next">'+icon('replay')+'再赛一场</button>');
  }
}
function commentary(view) {
  if (view.phase === 'handoff') return view.side === 1?'红角已就位。蓝角接手后开始选招。':'新的一拍。请红角选手先接手。';
  if (view.phase === 'reveal') return '双方同时亮牌！'+view.lastResult.choices.map((card,i)=>corners[i]+'使出'+choiceLabel(card)).join('，')+'。';
  if (view.phase === 'result' || view.phase === 'over') return view.lastResult.summary;
  if (view.mode === 'lesson') {
    return view.lesson === 1?'它刚用护翼挡住了你的突刺。它还想再挡一次。':'蓝角的蹼已经踩上底绳。现在谁能借到绳？';
  }
  if (view.lastResult) return view.lastResult.summary;
  return '开场铃响！红角站在 3 号位，蓝角站在 7 号位。先拿两次击倒的选手获胜。';
}
function renderHand(view) {
  const {phase,state,selection,side} = view;
  const selecting = phase === 'select';
  const corner = $('#hand-side');
  corner.classList.toggle('blue',side === 1);
  corner.textContent = selecting ? corners[side]+'暗选' : phase === 'handoff' ? '换手中' : '双方亮牌';
  const status = $('#hand-status');
  if (selecting && view.timeLeft !== null) {
    updateContents(status, (view.committed[1-side] ? corners[1-side]+'已就位　·　' : '')+
      icon('clock')+'<span class="timer '+(view.timeLeft<=5?'urgent':'')+'">'+view.timeLeft+'s</span>');
  } else if (view.mode === 'lesson') {
    updateContents(status, icon('cap')+'教学 '+String(view.lesson).padStart(2,'0')+' / 02　·　不限时');
  } else {
    updateContents(status, icon('bell')+({reveal:'同时揭牌',result:'本拍结算',over:'比赛结束',handoff:'等待就位'}[phase]??''));
  }
  for (const [i,el] of cards.entries()) {
    const card = CARDS[i], allowed = legal(state,side,defaultChoice(card.id));
    const unavailable = selecting && !allowed;
    el.disabled = !selecting || !allowed;
    el.classList.toggle('unavailable',unavailable);
    el.setAttribute('aria-pressed',String(selecting && selection?.id === card.id));
    const range = unavailable ? rangeHint(state,side,defaultChoice(card.id)) : captions[card.id][1];
    updateContents(el.querySelector('.card-foot'),icon(unavailable?'lock':'target')+range);
    el.title = card.quote+' '+card.description+'　'+range;
  }
}
const primary = (action,label,glyph,disabled=false) => '<button class="primary" type="button" data-action="'+action+'"'+(disabled?' disabled':'')+'>'+icon(glyph)+label+'</button>';
const secondary = (action,label) => '<button class="secondary" type="button" data-action="'+action+'">'+icon('replay')+label+'</button>';
function renderActions(view) {
  const {phase,mode,lesson,selection,state,side} = view;
  let tactics, actions = '';
  if (phase === 'select') {
    actions = primary('lock','锁定出招','lock',!selection);
    if (selection) {
      const card = byId.get(selection.id);
      const stepControls = selection.id === 'step' ? '<div class="step-options" role="group" aria-label="滑步方向和步数">'+
        ['forward','back'].flatMap(dir=>[1,2].map(steps=>'<button data-dir="'+dir+'" data-steps="'+steps+'" type="button" aria-pressed="'+
          (selection.direction===dir && selection.steps===steps)+'">'+(dir==='forward'?'进':'退')+' '+steps+'</button>')).join('')+'</div>' : '';
      tactics = icon('target')+'<strong>'+card.name+'</strong>'+stepControls+'<small>'+rangeHint(state,side,selection)+'</small>'+
        '<small class="selected-detail">'+card.description+'</small>';
    } else if (mode === 'lesson') {
      tactics = icon('book')+'<strong>第'+(lesson===1?'一':'二')+'课 · '+(lesson===1?'破解护翼':'绳边起跳')+'</strong><small>'+
        (lesson===1?'选一张牌，试试怎样把贴身防守的蓝角摔出去。':'蓝角准备飞扑。选一张牌应对这次起跳。')+'</small>';
    } else {
      tactics = icon('cards')+'<strong>请选择一张动作卡</strong><small>锁定前可以改选，超时空选将自动护翼。</small>';
    }
  } else if (phase === 'result') {
    const isLesson = mode === 'lesson';
    tactics = icon('whistle')+'<strong>第 '+state.round+' 拍已结算</strong><small>'+
      (isLesson ? lesson === 2 ? '可以重摆绳边局面，或进入正式比赛。' :
        view.lessonPassed ? '这一摔把蓝角送到了绳边。' : '重摆局面，试试能抓破护翼的招式。' : '即将进入下一拍。')+'</small>';
    if (isLesson && view.lessonPassed) actions += secondary('retry','重试本课');
    actions += primary('next',!isLesson?'下一拍':lesson===2?'进入人机对战':view.lessonPassed?'进入第二课':'重试本课',!view.lessonPassed && isLesson?'replay':'arrow');
  } else if (phase === 'handoff') {
    tactics = icon('users')+'<strong>等待'+corners[side]+'选手就位</strong>';
  } else if (phase === 'over') {
    tactics = icon('bell')+'<strong>比赛结束</strong><small>可在回合记录中回看双方每一拍的选择。</small>';
    actions = secondary('history','查看回合记录');
  } else {
    tactics = icon('bell')+'<strong>双方同时揭牌</strong><small>脚步落定后判定射程。</small>';
  }
  updateContents($('#tactics'),'<div class="tactic-line">'+tactics+'</div>');
  updateContents($('#actions'),actions);
}
function render(view) {
  const phaseChanged = view.phase !== lastView?.phase;
  if (phaseChanged && view.phase === 'handoff') document.activeElement?.blur();
  all('[data-mode]').forEach(btn=>btn.setAttribute('aria-pressed',String(btn.dataset.mode===view.mode)));
  paintArena(view);
  showChoices(view);
  stageOverlay(view);
  const message = commentary(view);
  if ($('#comment-text').textContent !== message) $('#comment-text').textContent = message;
  renderHand(view);
  renderActions(view);
  if ($('#details').open && openedSheet === 'history' && view.history !== lastView?.history) fillSheet('history',view);
  lastView = view;
}
function refreshSoundButton() {
  const label = soundOn ? '音效开启' : '音效关闭';
  const el = $('#sound');
  el.innerHTML = icon(soundOn?'volume':'mute',17)+'<span>'+label+'</span>';
  el.setAttribute('aria-pressed', String(soundOn));
  el.setAttribute('aria-label',label);
  el.title = soundOn?'关闭音效':'开启音效';
}
function fillSheet(sheet, view=session.getView()) {
  const titles = {guide:'场边速查',fighters:'选手档案',history:'回合记录'};
  $('#dialog-title').textContent = titles[sheet];
  let body;
  if (sheet === 'guide') {
    body = '<p><b>先拿两次击倒获胜。</b> 失衡累积到 3 就会倒地。第 12 拍结束时比较击倒数，同分打平。</p>'+
      '<h3>每拍怎么打</h3><p>双方暗选一张牌，亮牌即付体力。先走滑步和突刺前踏，再按距离同时判招，最后处理落点、击退和击倒。双方不能同格或对穿。</p>'+
      '<p>开场体力 3，此后每拍选牌前回 1，上限 4。击倒后双方回到 3、7 号位，下一拍体力 3、失衡 0。两人同时倒地则各得一分。</p>'+
      '<h3>六张基础牌</h3><div class="guide-cards">'+CARDS.map(c=>'<div class="guide-card"><b>'+c.name+' · '+c.cost+' 体力</b><small>'+c.description+'</small></div>').join('')+'</div>'+
      '<h3>同招怎么判</h3><p>双突刺都够得到则互中，各退 1 格。贴身互抱，各失衡 +1，留在原位。双方飞扑同时判定射程，落点按逐格抢位处理。绳端会挡住击退。</p>'+
      '<h3>操作</h3><p>按 1–6 或点击卡牌来改选。滑步需选方向和步数，按 Enter 或点击「锁定出招」提交。标准赛每次暗选 15 秒，超时提交当前牌，空选默认护翼。</p>';
  } else if (sheet === 'fighters') {
    body = '<div class="profiles"><article class="profile"><div class="profile-art"><img src="./assets/arena/bell-knight.svg" alt="白羽、侧分、身穿深红背心的车铃爵士"></div>'+
      '<h3>红角 · 车铃爵士</h3><p>白羽、深红比赛背心，连头顶的侧分也要打理整齐。骑小单车进场后，爵士总要回头摆正车把。</p><small>选手造型 · GPT‑6（Codex）</small></article>'+
      '<article class="profile"><div class="profile-art"><img src="./assets/encore-king.webp" alt="披蓝色短披肩的返场大王举翼致意"></div>'+
      '<h3>蓝角 · 返场大王</h3><p>灰蓝翼尖配亮蓝披肩。钻过围绳后，它会再探一次头，让司仪把自己的名字喊第二遍。</p><small>选手立绘 · OpenAI ImageGen</small></article></div>'+
      '<p style="margin-top:12px">双方共享相同的六张牌、体力和射程。</p>';
  } else {
    const beats = [...view.history].reverse();
    body = beats.length ? beats.map(beat=>'<div class="history-item"><b>第 '+beat.state.round+' 拍</b><div><strong>'+
      beat.choices.map((c,i)=>corners[i]+' '+choiceLabel(c)).join('　／　')+'</strong><p>'+beat.summary+
      '　比分 '+beat.state.fighters.map(f=>f.score).join('∶')+'</p></div></div>').join('') :
      '<p>本场尚未揭牌。双方亮牌后，这里会记录动作、结果和比分。</p>';
  }
  $('#dialog-body').innerHTML = body;
}
function openSheet(sheet) {
  openedSheet = sheet;
  fillSheet(sheet);
  $('#details').showModal();
}
function restart(mode) {
  sound.stop();
  session.start(mode);
  sound.bell();
}
function pick(id) {
  session.pick(id);
  if (session.getView().selection?.id===id) sound.select();
}
document.addEventListener('click',event=>{
  const button = event.target.closest('button');
  if (!button) return;
  if (button.dataset.mode) {
    if (session.getView().mode !== button.dataset.mode) restart(button.dataset.mode);
    return;
  }
  if (button.dataset.nav) {
    if (button.dataset.nav!=='match') openSheet(button.dataset.nav);
    else $('#match').scrollIntoView({block:'start'});
    return;
  }
  if (button.id==='sound') { soundOn=sound.setEnabled(!soundOn); refreshSoundButton(); if(soundOn) sound.bell(); return; }
  if (button.id==='history' || button.dataset.action==='history') { openSheet('history'); return; }
  if (button.id==='close-dialog') { $('#details').close(); return; }
  if (button.dataset.card) { pick(button.dataset.card); return; }
  if (button.dataset.dir) { session.step(button.dataset.dir,Number(button.dataset.steps)); return; }
  const action = button.dataset.action;
  if (['ready','lock','next','retry'].includes(action)) { sound.stop(); session[action](); }
});
$('#details').addEventListener('click',event=>{
  if (event.target !== $('#details')) return;
  const box = $('#details').getBoundingClientRect();
  if (event.clientX<box.left || event.clientX>box.right || event.clientY<box.top || event.clientY>box.bottom) $('#details').close();
});
document.addEventListener('keydown',event=>{
  if (event.repeat || event.altKey || event.metaKey || event.ctrlKey || $('#details').open) return;
  const view = session.getView();
  if (view.phase !== 'select') return;
  if (/^[1-6]$/.test(event.key)) {
    event.preventDefault();
    const index = Number(event.key)-1;
    if (!cards[index].disabled) {
      cards[index].focus({preventScroll:true});
      pick(CARDS[index].id);
    }
  }
  if (event.key==='Enter' && view.selection && (!event.target.closest('button,a') || event.target.closest('[data-card],[data-dir]'))) {
    event.preventDefault(); session.lock();
  }
});
refreshSoundButton();
session.start('lesson');
