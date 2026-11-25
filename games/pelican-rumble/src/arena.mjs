const redArt = new URL('../assets/arena/bell-knight.svg', import.meta.url).href;
const blueArt = new URL('../assets/arena/encore-king.webp', import.meta.url).href;
const leftSlot = 126;
const slotSpacing = 116;
const floorY = 247;
let arenaNumber = 0;

const xAt = (position) => leftSlot + (position - 1) * slotSpacing;
const stars = '<path d="M0-5l1.3 3.6L5 0l-3.7 1.3L0 5l-1.2-3.7L-5 0l3.8-1.4z"/>';
const wingCrest = `
  <path d="M-12-3q-22-4-56-16 12 10 26 14l-17-3q14 11 34 10l-11 1q10 8 24 3z
           M12-3q22-4 56-16-12 10-26 14l17-3Q45 3 25 2l11 1q-10 8-24 3z"/>
  <path fill-rule="evenodd" d="M0-22l17 8 2 13Q15 13 0 19-15 13-19-1l2-13z
    M-8-7q6-1 9-6l4 1 3 4-4 2 9 1-10 3Q0 5-5 3l-5 2 3-5-4 2 3-4-4 1z"/>`;

// Drawn at game scale in the same direction as the blue reference sprite.
export function fighterPortrait(side, full = false) {
  if (side === 1) {
    return `<svg class="fighter-portrait" viewBox="${full ? '0 0 140 140' : '0 0 90 64'}" aria-hidden="true"><image href="${blueArt}" x="-1" y="0" width="139" height="139"/></svg>`;
  }
  return `<svg class="fighter-portrait" viewBox="${full ? '-87 -176 186 183' : '-30 -174 126 91'}" aria-hidden="true"><image href="${redArt}" x="-86" y="-174" width="183" height="177"/></svg>`;
}

function lightingRig(x, angle, spread) {
  const bulbs = [-23, -8, 8, 23].map(i => `
    <g transform="translate(${i},2)">
      <ellipse rx="6" ry="4.5" fill="#333d40" stroke="#142b32" stroke-width="2"/>
      <ellipse rx="4.8" ry="2.9" fill="#fff1bd"/>
      <ellipse cy="1.1" rx="3.2" ry="1.1" fill="#fffbd8"/>
    </g>`).join('');
  return `<g transform="translate(${x},22) rotate(${angle})">
    <path d="M-27 1l${-spread} 244h${2 * spread + 54}L27 1z" fill="url(#ar-beam)"/>
    <path d="M-22 4l-36 155 64-155z" fill="#eadbb1" opacity=".045"/>
    <ellipse cy="12" rx="54" ry="31" fill="url(#ar-halo)"/>
    <path d="M-16-23v11l7 6h19l8-7v-10" fill="none" stroke="#12262d" stroke-width="4"/>
    <rect x="-35" y="-6" width="70" height="14" rx="4" fill="#152d32" stroke="#60817b" stroke-width="1.3"/>
    ${bulbs}</g>`;
}

function grandstand() {
  // Deterministic variation keeps each spectator in the same seat during a bout.
  let seed = 3421;
  const random = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
  return [0, 1, 2].map(row => {
    const out = [];
    const gap = 17 + row * 5;
    for (let x = -15; x < 1198; x += gap) {
      const seat = x + random() * 8;
      const curve = 10 * Math.cos((seat - 590) / 1180 * Math.PI * 1.4);
      const top = 116 + row * 26 + curve + random() * 11;
      const size = .63 + .19 * row + random() * .25;
      const cheer = random() > .71;
      const tilt = Math.round((random() - .5) * 14);
      const fill = [['#536d69','#5c746d','#506965'],['#3d5858','#465e5d','#415b59'],['#263f43','#304a4c','#2b4247']][row][Math.floor(random()*3)];
      out.push(`<g transform="translate(${seat.toFixed(1)} ${top.toFixed(1)}) scale(${size.toFixed(2)}) rotate(${tilt})" fill="${fill}">
        <path d="M-12 29q-1-13 3-18l5-3v-2q-4-2-4-7 0-6 6-7 6-1 8 4 2 6-3 10v2l5 3q5 4 6 18z"/>
        ${cheer ? '<path d="M-5 12l-7-4-4-12q-1-3-3-2l1 16 11 10z"/>' : ''}
      </g>`);
    }
    return out.join('');
  }).join('');
}

function corner(side, front) {
  const blue = side === 1;
  const x = front ? 15 : 84;
  const bright = blue ? '#699aa9' : '#de8264';
  const color = blue ? '#3e6f83' : '#ae5345';
  const shade = blue ? '#2c5062' : '#723c36';
  const posts = [0, 1, 2].map(i => {
    const y = 135 + i * 28;
    return `<path d="M${x-1} ${y-6}q9-2 24 2l2 8q-15 4-27 0z" fill="${color}" stroke="#313a36" stroke-width="1.5"/>
      <path d="M${x+2} ${y-4}l18 1" stroke="${bright}" stroke-width="2.5"/>
      <path d="M${x+15} ${y+2}h9" stroke="${shade}" stroke-width="2"/>`;
  }).join('');
  return `<g transform="${blue ? 'translate(1180) scale(-1 1)' : ''}${front ? ' translate(0 21)' : ''}">
    <path d="M${x-10} 128q4-6 10-6l8 4-1 ${front ? 115 : 94}h-16z" fill="${shade}" stroke="#263537" stroke-width="2"/>
    <path d="M${x-5} 125h5v${front ? 118 : 95}h-5z" fill="${color}"/>
    <path d="M${x-11} 132v-9q7-5 17 0v10z" fill="${bright}" stroke="#293c3b" stroke-width="1.5"/>
    ${posts}</g>`;
}

function ropeCurve(y, left = 0, right = 0) {
  return `M92 ${y} C210 ${y+4+left} 420 ${y+6} 590 ${y+6} S970 ${y+4+right} 1088 ${y}`;
}

function sceneBackdrop() {
  const ribs = Array.from({length: 20}, (_, i) => {
    const x = i * 70 - 95;
    return `<path d="M${x} 0l49 30 32-30m-68 35 48-33" fill="none" stroke="#64817b" stroke-width="2.3"/>`;
  }).join('');
  const banners = [-1, 1].map(facing => `
    <g transform="translate(${590+facing*498} 72) scale(${facing},1)" opacity=".48">
      <path d="M-39-22h85v44l-42 11-43-11z" fill="#2b4b4a" stroke="#86a091"/>
      <g transform="translate(4,-1) scale(.43)" fill="#a6aa87">${wingCrest}</g>
    </g>`).join('');
  const bolts = Array.from({length: 14}, (_, i) => `<circle cx="${28+i*87}" cy="272" r="1.3" fill="#92a391"/>`).join('');
  const fans = [[245,146,-9,'#bf7e61'],[434,157,7,'#b89768'],[903,148,8,'#85a4a3']].map(([x,y,a,color]) => `
    <g transform="translate(${x} ${y}) rotate(${a})" opacity=".76">
      <path d="M-10 10v13m20-13v13" stroke="#536a64" stroke-width="2.5"/>
      <path d="M-18-10l35-1v22h-34z" fill="${color}" stroke="#354b48" stroke-width="1.5"/>
      <g fill="#f2dfb4" transform="scale(.22)"><use href="#ar-emblem"/></g>
    </g>`).join('');
  const grain = Array.from({length:86}, (_,i) => `<circle cx="${(i*13.68)%37}" cy="${(i*i*3.71)%39}" r="${i%3 ? .52 : .74}" fill="${i%2 ? '#132e30':'#fff1c0'}"/>`).join('');
  const rearRopes = ['#bd705b','#e1c995','#749b9e'].map((color, n) => `
    <path data-rope="${135+n*28}" d="${ropeCurve(135+n*28)}" stroke="#283e40" stroke-width="5.3" fill="none"/>
    <path data-rope="${134+n*28}" d="${ropeCurve(134+n*28)}" stroke="${color}" stroke-width="3.3" fill="none"/>`).join('');
  const rails = [0,1].map(side => {
    const colors = side ? ['#96b5b4','#e2d0a5','#628995'] : ['#e79b7e','#e6ce9c','#b86c55'];
    return `<g transform="${side ? 'translate(1180) scale(-1 1)' : ''}" fill="none">
      ${colors.map((color,n) => `<path d="M87 ${135+n*28}Q54 ${150+n*28} 18 ${156+n*28}" stroke="#344343" stroke-width="5.2"/>
      <path d="M87 ${134+n*28}Q54 ${149+n*28} 18 ${155+n*28}" stroke="${color}" stroke-width="3.2"/>`).join('')}</g>`;
  }).join('');
  return `<defs>
    <linearGradient id="ar-house" x2="0" y2="1" gradientUnits="objectBoundingBox">
      <stop stop-color="#193439"/><stop offset=".48" stop-color="#385b5c"/><stop offset="1" stop-color="#788b78"/>
    </linearGradient>
    <radialGradient id="ar-atmosphere"><stop stop-color="#bcc3a0" stop-opacity=".43"/><stop offset="1" stop-color="#829b88" stop-opacity="0"/></radialGradient>
    <radialGradient id="ar-halo"><stop stop-color="#ffe6ac" stop-opacity=".22"/><stop offset="1" stop-color="#eebf7b" stop-opacity="0"/></radialGradient>
    <linearGradient id="ar-beam" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#f7e4a9" stop-opacity=".27"/><stop offset="1" stop-color="#f5e6ae" stop-opacity="0"/></linearGradient>
    <linearGradient id="ar-mat" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#aea98c"/><stop offset=".48" stop-color="#e4d7aa"/><stop offset="1" stop-color="#ebe0bb"/></linearGradient>
    <pattern id="ar-halftone" width="5" height="5" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r=".8" fill="#173339"/></pattern>
    <pattern id="ar-diagonal" width="7" height="7" patternUnits="userSpaceOnUse"><path d="M-2 2l4-4m-2 9 7-7m-2 9 4-4" stroke="#314c49" stroke-width="1.3"/></pattern>
    <pattern id="ar-canvas" width="4" height="4" patternUnits="userSpaceOnUse"><path d="M0 1h3m-1 2h2" stroke="#686746" stroke-width=".45"/></pattern>
    <pattern id="ar-ink" width="37" height="39" patternUnits="userSpaceOnUse">${grain}</pattern>
    <g id="ar-spark">${stars}</g>
    <g id="ar-emblem">${wingCrest}</g>
  </defs>
  <rect width="1180" height="328" fill="url(#ar-house)"/>
  <ellipse cx="580" cy="145" rx="595" ry="183" fill="url(#ar-atmosphere)"/>
  <path d="M0 108q220-17 500 9t680-13v7q-311 31-615 16T0 115z" fill="#91a28f" opacity=".27"/>
  ${banners}
  <g opacity=".54">${ribs}<path d="M0 31q570 10 1180 0M0 6h1180" fill="none" stroke="#4d6968" stroke-width="4"/></g>
  ${lightingRig(171,-23,76)}${lightingRig(376,-10,72)}${lightingRig(804,10,72)}${lightingRig(1009,23,76)}
  <g fill="#fff5c9" opacity=".68">
    <use href="#ar-spark" transform="translate(312 93) scale(.65)"/><use href="#ar-spark" transform="translate(902 97) scale(.75)"/>
    <use href="#ar-spark" transform="translate(552 75) scale(.4)"/><use href="#ar-spark" transform="translate(1026 135) scale(.6)"/>
    <circle cx="758" cy="66" r="1.6"/><circle cx="219" cy="124" r="1.2"/><circle cx="528" cy="107" r="1.1"/><circle cx="72" cy="91" r="1.3"/>
  </g>
  <rect y="78" width="1180" height="145" fill="url(#ar-halftone)" opacity=".11"/>
  ${grandstand()}
  ${fans}
  <path d="M0 208q298-12 590-4t590-4v35H0z" fill="#273f40"/>
  ${rearRopes}
  ${corner(0,false)}${corner(1,false)}
  <path d="M84 211Q590 218 1096 211l84 52v25H0v-25z" fill="url(#ar-mat)" stroke="#364443" stroke-width="2.3"/>
  <path d="M87 215q490 7 1006 0l51 34q-565-8-1108 0z" fill="none" stroke="#8a8d76" stroke-width="1.2"/>
  <path d="M85 215l-54 39h96l35-40z" fill="#b7765e" opacity=".34"/>
  <path d="M1094 215l52 39h-97l-35-40z" fill="#729395" opacity=".45"/>
  <path d="M88 216l72 1-33 37H32zM1092 216l-74 1 33 37h93z" fill="url(#ar-diagonal)" opacity=".3"/>
  <path d="M89 214h1003l78 47H7z" fill="url(#ar-canvas)" opacity=".29"/>
  <g transform="translate(590,237) scale(1.55,.61)" fill="#747c65" opacity=".68"><use href="#ar-emblem"/></g>
  <path d="M350 251l9 .3m-15 1h7m451-30 10 .3m-389-.6 11 .5m232 25 8-.1m-468-7 8 .2m705 14h8" fill="none" stroke="#938c72" opacity=".7"/>
  <path d="M0 263q591 3 1180 0v17H0z" fill="#536a65"/>
  <path d="M0 263h1180v3H0z" fill="#d2c799"/><path d="M0 278h1180v3H0z" fill="#273c3f"/>
  ${bolts}${rails}${corner(0,true)}${corner(1,true)}
  <rect width="1180" height="280" fill="url(#ar-ink)" opacity=".075"/>`;
}

function positionStrip() {
  const cells = Array.from({length:9}, (_,i) => {
    const rope = i < 2 || i > 6;
    return `<g data-cell="${i + 1}" transform="translate(${xAt(i+1)},304)">
      <title>${i+1} 号位${rope ? '，借绳区' : ''}</title>
      <rect x="-54" y="-19" width="108" height="37" rx="3" fill="${rope ? '#385049' : '#2d423e'}"/>
      <path d="M-48 14h96" stroke="${rope ? '#8c916e' : '#52665b'}" stroke-width="1"/>
      ${rope ? '<path d="M-44-8l-4 6m11-6-4 6m77 0 4-6m3 6 4-6" stroke="#b1ae83" stroke-width="1.4" opacity=".63"/>' : ''}
      <rect data-chip x="-18" y="-15" width="36" height="23" rx="3" fill="transparent"/>
      <text data-digit y="2.8" text-anchor="middle" fill="#dfdfc3">${String(i+1).padStart(2,'0')}</text>
    </g>`;
  }).join('');
  return `<g class="plc-scale" aria-hidden="true"><rect y="281" width="1180" height="49" fill="#233732"/>
    ${cells}
    <g fill="#bbbd9e" font-size="10" text-anchor="middle" font-weight="700">
      <path d="M25 298h26m-26 0 5-3m-5 3 5 3m1125-3h-26m26 0-5-3m5 3-5 3" fill="none" stroke="#9fa483"/>
      <text x="38" y="315">借绳区</text><text x="1143" y="315">借绳区</text>
    </g></g>`;
}

function figure(side) {
  const image = `<image href="${blueArt}" x="-83" y="-166" width="167" height="167"/>`;
  const suit = side === 0 ? `
    <g stroke="#172e31" fill="none" stroke-linecap="round" stroke-linejoin="round">
      <use href="${redArt}#legs"/><use href="${redArt}#torso"/>
      <g class="plc-head"><use href="${redArt}#head"/></g>
      <g class="plc-wing"><use href="${redArt}#wing"/></g>
    </g>` : `
    <g transform="scale(-1 1)">
      <defs><clipPath id="ar-blue-head"><path d="M-87-169H87v52l-69 2-11 9-5 5-10 2-9-3-7-3-1-5h-62z"/></clipPath>
      <clipPath id="ar-blue-body"><path d="M-86-110h59l5 5 8 3 14 4 8-6 10-9 69-2V3H-86z"/></clipPath></defs>
      <g clip-path="url(#ar-blue-body)">${image}</g>
      <g class="plc-blue-head"><g clip-path="url(#ar-blue-head)">${image}</g></g>
    </g>`;
  return `<g data-figure="${side}">
    <g data-shadow fill="#37413a"><ellipse rx="59" ry="6.5" opacity=".19"/><ellipse rx="40" ry="3.6" opacity=".24"/></g>
    <g data-facing><g data-pose><g class="plc-breathe">${suit}
      <g class="plc-shield" stroke="#263637" stroke-linejoin="round" stroke-linecap="round">
        <path d="M-28-86q12-4 28-15l22-17q6-1 3 5l-8 9 14-8q5 0 2 4l-15 15 14-7q4 2 0 6L9-74q-22 18-36 12-10-8-1-24z" fill="#f9eac8" stroke-width="2.4"/>
        <path d="M-10-79q17-8 32-23m-30 29 26-17m-30 20 14-6m-14-14 10-6" fill="none" stroke-width="1.25"/>
        <path d="M-29-83q10-1 15 8l-2 6q-6-9-15-8z" fill="${side ? '#49879d' : '#b4513f'}" stroke-width="1.4"/>
      </g>
    </g></g></g>
    <g data-impact fill="none" stroke="#fff4b4" stroke-linecap="round" stroke-width="3" opacity="0">
      <path d="M-27 4l-9 3m18-20-7-8M-4-20l-2-11M14-19l4-9m7 18 8-7m-1 20 9 1"/>
    </g>
  </g>`;
}

function referee() {
  return `<g data-ref opacity="0">
    <g transform="translate(0,246)" stroke="#243a3a" stroke-linejoin="round" stroke-linecap="round" stroke-width="2">
      <ellipse cy="1" rx="23" ry="3" fill="#53605a" opacity=".28" stroke="none"/>
      <path d="M-10-16l-3 13-7 3 13 1 5-15m9-1 1 13 11 2-8-5v-12" fill="#dfa959"/>
      <path d="M-12-34q-16-3-17-9 13 1 22 6l4-10 12-1 6 13q7 11-1 21-16 5-29-1z" fill="#efe7c8"/>
      <path d="M-12-30l24 4m-25 3 26 4m-23 3 17 2" stroke-width="3.7"/>
      <path d="M-4-41q-3-9 0-15 8-6 14 2l18 4-16 3-6 10z" fill="#f3e6bd"/>
      <path d="M9-51l20 1-18 4z" fill="#d19d4b"/><circle cx="7" cy="-53" r="1" fill="#243a3a"/>
      <path d="M-5-30q8 2 16-7l9-12-1-6-5 8-1-5-3 8-9 5-9 3z" fill="#f5eccc"/>
    </g></g>`;
}

function bicycle() {
  return `<g data-bicycle opacity="0" fill="none" stroke="#293f3e" stroke-linejoin="round" stroke-linecap="round">
    <g fill="#e9dbad" stroke-width="2.5"><circle cx="-21" r="12"/><circle cx="19" r="12"/></g>
    <path d="M-21-11v22m-11-11h22m18 0h22m-11-11v22" stroke="#86918a" stroke-width="1"/>
    <path d="M-21 0l9-18L0-1l15-19-26 2L0-1zM19 0l-5-24" stroke="#b46143" stroke-width="3"/>
    <path d="M-13-23l12 22m-17-22h10" stroke-width="2.8"/>
    <path data-bars d="M14-22l1-4 10-2" stroke-width="2.8"/>
    <circle r="3.6" fill="#ddba71" stroke-width="1.7"/>
  </g>`;
}

const clamp01 = number => Math.max(0, Math.min(1, number));
const span = (ms, start, finish) => clamp01((ms-start)/(finish-start));
const ease = t => t*t*(3-2*t);
const mix = (a,b,t) => a + (b-a)*ease(t);

function motionFor(side, time, before, result) {
  const { choices, effects, footwork, landings, knockdowns } = result;
  const original = before.fighters[side].position;
  const target = result.state.fighters[side].position;
  const id = choices[side].id;
  const rival = 1-side;
  const incoming = choices[rival].id;
  const reach = span(time, 460, 930);
  const retract = 1 - ease(span(time, 940, 1420));
  const contactPose = ease(reach) * retract;
  const shove = span(time, 930, 1500);
  const falling = knockdowns[side] ? ease(span(time, 1170, 1730)) : 0;
  let position = mix(original,footwork[side],span(time,190,565));
  position += (landings[side] - footwork[side]) * ease(reach);
  position += (target - landings[side]) * ease(shove);
  let lift = 0, angle = 0, thrust = 0, stretch = 1;
  if (id === 'step' || id === 'jab') lift = -4 * Math.abs(Math.sin(Math.PI*2*span(time,190,565)));
  if (id === 'dive') {
    lift -= 53*Math.sin(Math.PI*reach);
    angle += 25*Math.sin(Math.PI*reach);
  }
  if (id === 'jab') {angle += 7*contactPose; thrust += 11*contactPose;}
  if (id === 'throw') {angle += 12*contactPose; thrust += 9*contactPose;}
  if (id === 'feint') angle += 9*Math.sin(Math.PI*span(time,440,850));
  if (id === 'guard') {angle -= 5*contactPose; stretch -= .055*contactPose;}
  const staggering = effects[rival] === 'hit' || effects[side] === 'blocked' || effects[side] === 'clash';
  if (staggering) {
    const arc = Math.sin(Math.PI * shove);
    const thrown = incoming === 'throw' && effects[rival] === 'hit';
    lift -= (thrown ? 57 : 9) * arc;
    angle -= (thrown ? 48 : 14) * arc;
    thrust -= 8 * arc;
  }
  angle -= falling * 66;
  return {position, lift, angle, thrust, stretch, falling, staggering};
}

export function createArena(element) {
  const prefix = 'pr-arena-' + ++arenaNumber + '-';
  const markup = `<svg class="plc-scene" viewBox="0 0 1180 330" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
    ${sceneBackdrop()}${referee()}${bicycle()}${figure(0)}${figure(1)}${positionStrip()}</svg>`;
  element.innerHTML = markup.replaceAll('ar-', prefix);
  const scene = element.querySelector('.plc-scene');
  const cells = [...scene.querySelectorAll('[data-cell]')];
  const ref = scene.querySelector('[data-ref]');
  const bike = scene.querySelector('[data-bicycle]');
  const bars = bike.querySelector('[data-bars]');
  const ropes = [...scene.querySelectorAll('[data-rope]')];
  const actors = [...scene.querySelectorAll('[data-figure]')].map(group => ({
    group,
    shadow:group.querySelector('[data-shadow]'), facing:group.querySelector('[data-facing]'),
    pose:group.querySelector('[data-pose]'), impact:group.querySelector('[data-impact]'),
  }));
  let frame = 0;
  let blueHasSaluted = false;

  function markSlots(state) {
    const positions = state.fighters.map(f => f.position);
    cells.forEach((cell,index) => {
      const side = positions.indexOf(index+1);
      cell.querySelector('[data-chip]').setAttribute('fill', ['#d87759','#79a5b2'][side] ?? 'transparent');
      cell.querySelector('[data-digit]').setAttribute('fill', side < 0 ? '#e3dfc3' : '#162d30');
      cell.classList.toggle('plc-occupied', side >= 0);
    });
    element.setAttribute('aria-label', `红角站在 ${positions[0]} 号位，蓝角站在 ${positions[1]} 号位。1、2、8、9 号位可以借绳。`);
  }

  function place(side, position, gap, direction, motion = {}) {
    const actor = actors[side];
    const { lift=0, angle=0, thrust=0, stretch=1, falling=0 } = motion;
    const offset = Math.max(0, 2-gap) * 34;
    const x = xAt(position) - direction*offset;
    actor.group.setAttribute('transform', `translate(${x} ${floorY + (side === 0 ? 1 : -1)})`);
    actor.facing.setAttribute('transform', `scale(${direction} 1)`);
    // Lift the foot pivot during the roll so the outer wing lands on the canvas.
    actor.pose.setAttribute('transform', `translate(${thrust + falling*38} ${lift - falling*23}) rotate(${angle}) scale(1 ${stretch})`);
    actor.shadow.setAttribute('transform', `translate(${-direction*falling*30} 0) scale(${1 + lift*.004 + falling*.14} ${1 + lift*.005})`);
  }

  function flexRopes(left = 0, right = 0) {
    for (const rope of ropes) rope.setAttribute('d', ropeCurve(Number(rope.dataset.rope), left, right));
  }

  function show(state) {
    cancelAnimationFrame(frame);
    scene.classList.remove('plc-playing');
    ref.setAttribute('opacity','0');
    bike.setAttribute('opacity','0');
    flexRopes();
    const positions = state.fighters.map(f => f.position);
    const gap = Math.abs(positions[1]-positions[0]);
    actors.forEach((actor,side) => {
      actor.group.removeAttribute('data-action');
      actor.group.classList.remove('plc-curtain-call','plc-comb');
      actor.group.dataset.balance = state.fighters[side].imbalance;
      actor.group.classList.toggle('plc-salute', state.over && (state.winner == null || state.winner === side));
      actor.impact.setAttribute('opacity','0');
      const down = state.fighters[side].imbalance >= 3;
      place(side, positions[side], gap, Math.sign(positions[1-side]-positions[side]), down ? {angle:-66, falling:1} : {});
    });
    markSlots(state);
  }

  function introduce(state) {
    show(state);
    blueHasSaluted = false;
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      const started = performance.now();
      function enter(now) {
        const time = now - started;
        const arrived = ease(span(time,0,850));
        const dismount = Math.sin(Math.PI*span(time,700,1120));
        const redX = xAt(3) - 268*(1-arrived);
        const blueX = xAt(7) + 231*(1-ease(span(time,670,1370))) + 69*(1-ease(span(time,0,370))) + 22*Math.sin(Math.PI*span(time,370,740));
        const peek = Math.sin(Math.PI*span(time,285,805));
        actors[0].group.setAttribute('transform', `translate(${redX} ${floorY + 1})`);
        actors[1].group.setAttribute('transform', `translate(${blueX} ${floorY - 1})`);
        actors[1].facing.setAttribute('transform', `scale(${-1 + 1.96 * peek} 1)`);
        actors[1].pose.setAttribute('transform', `rotate(${peek * 9})`);
        actors[0].pose.setAttribute('transform', `translate(0 ${-20*(1-ease(span(time,760,1110))) - dismount*14}) rotate(${dismount*-6})`);
        bike.setAttribute('transform', `translate(${redX - 5 + 27 * ease(span(time,910,1300))} ${floorY - 9})`);
        bars.setAttribute('transform', `rotate(${24*(1-ease(span(time,1020,1250)))} 14 -22)`);
        bike.setAttribute('opacity', String(1-ease(span(time,1230,1510))));
        if (time < 1550) frame = requestAnimationFrame(enter);
        else bike.setAttribute('opacity','0');
      }
      frame = requestAnimationFrame(enter);
    }
  }

  function play(before,result) {
    show(before);
    scene.classList.add('plc-playing');
    const facing = actors.map((_,side) => Math.sign(before.fighters[1-side].position-before.fighters[side].position));
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    actors.forEach(({group},side) => {group.dataset.action = result.choices[side].id;});
    const started = performance.now();
    const blockedJab = result.choices[0].id === 'jab' && result.effects[0] === 'blocked';
    const salute = blockedJab && !blueHasSaluted && !result.knockdowns[1];
    const divingFrom = result.choices.flatMap((choice,side) => choice.id === 'dive' ? [before.fighters[side].position] : []);
    if (salute) blueHasSaluted = true;
    let marked = false;
    function draw(now) {
      const time = now-started;
      if (divingFrom.length && !reduced) {
        const windup = -20*Math.sin(Math.PI*span(time,150,510));
        const vibration = 12*Math.sin(Math.PI*4*span(time,510,1210))*(1-span(time,510,1210));
        const bend = windup+vibration;
        flexRopes(divingFrom.some(p => p <= 2) ? bend : 0, divingFrom.some(p => p >= 8) ? bend : 0);
      }
      const motions = actors.map((_,side) => motionFor(side,time,before,result));
      const gap = Math.abs(motions[0].position-motions[1].position);
      actors.forEach((actor,side) => {
        const motion = motions[side];
        place(side,motion.position,gap,facing[side],reduced ? {angle:motion.falling*-30} : motion);
        const flash = motion.staggering && time >= 914 && time < 1160 && !reduced;
        actor.impact.setAttribute('opacity', flash ? String(1-span(time,980,1160)) : '0');
        if (flash) actor.impact.setAttribute('transform',`translate(${facing[side]*21} -99)`);
      });
      if (time >= 1510 && !marked) {markSlots(result.state); marked=true;}
      if (salute && time >= 1490) actors[1].group.classList.add('plc-curtain-call');
      if (blockedJab && !result.knockdowns[0] && time >= 1320) actors[0].group.classList.add('plc-comb');
      if (result.knockdowns.some(Boolean) && time >= 1540) {
        const middle = (xAt(result.state.fighters[0].position)+xAt(result.state.fighters[1].position))/2;
        ref.setAttribute('opacity', String(span(time,1540,1830)));
        ref.setAttribute('transform', `translate(${middle-25*(1-ease(span(time,1540,1870)))},0)`);
      }
      if (time < 2320) frame = requestAnimationFrame(draw);
      else {
        scene.classList.remove('plc-playing');
        actors.forEach(({group},side) => {
          group.removeAttribute('data-action');
          group.dataset.balance = result.state.fighters[side].imbalance;
          group.classList.toggle('plc-salute', result.state.over && (result.state.winner == null || result.state.winner === side));
        });
      }
    }
    frame = requestAnimationFrame(draw);
  }
  return {show, play, introduce};
}
