// Each vignette uses the two inks of its printed card and a shared paper highlight.
const ink = 'var(--art-ink)';
const accent = 'var(--art-accent)';
const paper = '#fff4d9';

const wing = `
  <path fill="${paper}" d="M72 57C61 55 52 49 45 41 37 32 33 20 31 8
    35 9 41 13 47 21L43 5C50 10 55 16 59 23L56 7C66 16 73 29 76 44Z"/>
  <path fill="${accent}" d="M32 10Q47 25 57 42L50 36Q55 47 65 52
    47 45 38 30 32 10ZM45 8Q58 23 63 38L56 29ZM58 11Q68 21 72 36L66 29Z"/>
  <path fill="none" stroke-width="1.35" d="M39 22Q44 33 49 37 M46 18L52 28
    M61 27Q68 37 69 44 M51 40L58 46 M58 37L62 43 M62 34L66 41"/>
`;

const drawings = {
  jab: `
    <g stroke="none" fill="${ink}">
      <path d="M6 31 54 27 53 30 3 32ZM12 36 41 34 38 37 10 38ZM5 47 34 43 30 46Z"/>
      <path fill="${accent}" d="M14 20 55 19 51 22 22 22ZM9 51 41 49 37 52Z"/>
    </g>
    <path fill="${ink}" stroke="none" d="M28 61 30 51 59 31 74 27 85 26 130 24
      126 29 91 39 68 39 49 51 49 56Z"/>
    <path fill="${paper}" d="M23 57 34 52 30 51 45 43Q54 39 56 31L49 33 55 26
      48 27Q57 20 66 19L61 17Q71 14 80 19 86 21 87 27L84 32
      Q70 33 63 40 53 52 37 59L40 54Z"/>
    <path fill="${accent}" d="M79 26Q99 25 129 21L125 26Q118 27 113 31
      96 42 83 36 78 33 78 29Z"/>
    <path fill="${paper}" d="M77 24Q96 24 126 19L132 19 127 24
      Q106 26 83 30L77 29Z"/>
    <path fill="none" stroke-width="1.2" d="M84 31Q94 34 107 30 M85 34Q91 37 98 35
      M44 49 54 44 M47 45 54 41 M60 28 65 25"/>
    <path fill="${ink}" stroke="none" d="m63 21 13 1-1 2-9 1Z"/>
    <circle cx="71.8" cy="25.5" r="2" fill="${ink}" stroke="none"/>
    <g fill="none" stroke="${accent}" stroke-width="2"><path d="m128 12 4-5m1 7 5-2m-2 12 4 2"/></g>
  `,
  guard: `
    <g fill="none" stroke="${accent}" stroke-width="1.8">
      <path d="m22 18-6-5m4 13-9-2m10 10-8 2m109-18 6-5m-4 13 9-2m-10 10 8 2"/>
    </g>
    <path fill="${ink}" stroke="none" d="M34 12Q53 26 72 51 94 26 111 12
      111 34 94 54 73 61 52 56 37 36 34 12Z"/>
    <path fill="${paper}" d="M58 33Q60 24 67 20L63 19 73 14 73 18 80 15 78 20
      Q87 21 89 32L80 44 64 42Z"/>
    <path fill="${ink}" stroke="none" d="M64 28 71 31 70 33 64 31ZM80 28 74 31 75 33 81 31Z"/>
    <path fill="${accent}" d="m68 34 5-3 5 3-5 15Z"/>
    ${wing}
    <g transform="translate(144 0) scale(-1 1)">${wing}</g>
    <path fill="${paper}" d="M64 47 73 42 82 47 80 53 72 58 65 53Z"/>
    <path fill="${accent}" stroke-width="1.2" d="m73 46 1.3 2.8 3.2.4-2.3 2.1.6 3.1-2.8-1.6-2.8 1.6.6-3.1-2.3-2.1 3.2-.4Z"/>
  `,
  throw: `
    <g fill="none" stroke="${ink}">
      <path stroke-width="1.3" d="M24 51C3 43 18 29 34 23M18 39Q19 33 29 28M102 45Q121 39 121 33"/>
      <path stroke="${accent}" stroke-width="2.8" d="M99 8C114 7 124 12 123 20"/>
    </g>
    <path fill="${accent}" stroke="none" d="m117 18 10-1-4 8Z"/>
    <path fill="${paper}" d="M27 50Q38 49 43 39 48 29 51 21L44 23 51 16 46 15 57 12
      55 9Q68 7 72 16L69 23Q58 29 57 38 55 50 43 56L46 50 33 55Z"/>
    <path fill="${ink}" stroke="none" d="m56 15 11-2 2 3-11 2Z"/>
    <circle cx="63" cy="19" r="1.9" fill="${ink}" stroke="none"/>
    <path fill="${accent}" d="M66 24C74 28 86 30 96 27L113 21Q109 38 94 47
      84 53 72 47 63 42 61 32Z"/>
    <path fill="${paper}" d="M77 27 75 20 79 22 80 15 84 22 87 17 88 22
      Q94 20 98 26L107 27 102 31 95 31 92 38Q84 42 77 36Z"/>
    <path fill="none" stroke-width="1.2" d="m84 27 3 3m0-3-3 3m9-3 2 1"/>
    <path fill="${paper}" d="M66 18Q83 20 100 17L114 14 117 12
      Q117 19 111 23L109 20Q90 26 70 26L64 23Z"/>
    <path fill="none" stroke-width="1.25" d="M72 36Q76 46 85 47 M76 38Q81 44 88 44
      M90 43Q101 40 106 32 M41 46 47 40"/>
    <path fill="${accent}" stroke="none" d="M30 58Q55 64 85 54 62 66 32 62Z"/>
  `,
  step: `
    <g fill="none" stroke="${ink}" stroke-width="1.4">
      <path d="m10 27 25-2M7 33l21-1m-13 9 19-3m52 15 28-2m-17 6 19-2"/>
    </g>
    <path fill="${accent}" stroke="none" d="m8 21 25-3-5 3Zm10 28 30-4-5 4Z"/>
    <path fill="${paper}" d="M49 10 69 8 62 17 57 18 50 30 45 37 39 34
      Q45 22 48 17L42 19Z"/>
    <path fill="${accent}" d="M41 31Q45 29 50 33L55 34 66 29Q68 28 66 31L58 37
      71 36Q74 36 71 39L58 42 65 45Q67 47 63 47L42 44 33 45 35 40 31 39Z"/>
    <path fill="none" stroke-width="1.3" d="m43 37 11-3m-12 5 15-2m-16 4 15 1m-8-19 6 1m-8 2 5 1"/>
    <path fill="${ink}" stroke="none" d="m67 53 13-10 27-3 20 9-24 3-13 5Z"/>
    <path fill="${paper}" d="M78 7 98 7 95 14 89 17 86 25 85 37 78 43 71 40
      77 29 78 16 73 19Z"/>
    <path fill="${accent}" d="M75 36Q80 33 85 38L89 41 105 34Q110 33 107 37L98 43
      120 40Q125 40 120 44L103 49 117 50Q121 52 117 54L94 53 79 52 64 54
      68 48 62 47 71 42Z"/>
    <path fill="none" stroke-width="1.45" d="m77 43 17-3m-17 6 23-2m-25 5 23 1m-17-26 5 1m-6 3 5 1"/>
    <path fill="${ink}" stroke="none" d="m75 16 8-3 8 1-8 2-7 4Z"/>
  `,
  feint: `
    <g transform="translate(12 -4)" fill="none" stroke="${accent}" stroke-width="1.55" stroke-dasharray="3 2">
      <path d="M35 56Q51 48 47 35L42 28 47 29 43 22 49 25Q48 12 61 12
        70 11 74 20 90 17 109 23L106 26 96 26Q87 39 71 35 66 32 64 30 56 35 61 43L61 52"/>
    </g>
    <path fill="${ink}" stroke="none" d="M31 60Q44 46 44 34L44 24Q50 15 61 18L70 28
      88 32 102 31Q93 44 74 42L61 36 60 50 55 58Z"/>
    <path fill="${paper}" d="M27 56Q41 49 42 39L41 32 34 34 39 27 34 27 41 20 36 19
      Q44 16 50 17L48 13Q62 10 69 21L70 28 63 31Q54 32 55 41 59 49 54 56L49 53 44 59 43 54Z"/>
    <path fill="${accent}" d="M63 27Q78 30 102 27 99 33 88 37 75 43 67 36L61 30Z"/>
    <path fill="${paper}" d="M63 23Q81 23 100 25L106 25 100 29 69 30 62 28Z"/>
    <path fill="none" stroke-width="1.25" d="M71 33Q79 37 87 34 M45 41Q48 48 44 51
      M46 25 49 22"/>
    <path fill="${ink}" stroke="none" d="m52 20 11-2 1 3-12 2Z"/>
    <circle cx="59" cy="23.8" r="2" fill="${ink}" stroke="none"/>
    <path fill="${accent}" d="m114 36 3 6 8-2-4 7 6 4-9 1-1 7-4-6-7 3 3-7-6-3 9-2Z"/>
    <g fill="none" stroke="${ink}" stroke-width="1.4"><path d="m117 13 4-4m-1 9 7-2m-97 26-10 3m11 1-7 4"/></g>
  `,
  dive: `
    <path fill="none" stroke="${ink}" stroke-width="2.4" d="M5 39Q22 54 53 48M3 46Q24 61 50 55"/>
    <g fill="none" stroke="${accent}" stroke-width="1.7">
      <path d="M12 26Q23 19 35 17 M16 31Q25 24 34 22m62 31 15 5"/>
    </g>
    <path fill="${ink}" stroke="none" d="m20 36 20-9 10-15 15 11 14 3 4 6 11 2 30 19-9 0
      -18-4-13-8-13-2-21-6-10 6 1-5Z"/>
    <path fill="${accent}" d="m46 29-12 6 2-5-9 1 6-4-6-1 14-3Z"/>
    <path fill="${paper}" d="M41 25Q48 21 58 24L47 16 42 5 52 10 49 3 63 12
      63 6Q76 13 82 25L83 29Q91 26 98 33L100 38 93 43 80 38
      Q67 40 57 34L48 30 37 32Z"/>
    <path fill="${accent}" d="M43 6 56 15 53 14 61 23 54 19ZM52 5 68 17 67 14 75 24 67 20ZM66 9 76 17 81 25 76 21Z"/>
    <path fill="${accent}" d="M95 36Q106 39 127 53L120 53Q106 52 98 48L91 41Z"/>
    <path fill="${paper}" d="M98 34Q114 43 127 49L133 54 126 53 95 39Z"/>
    <path fill="${ink}" stroke="none" d="m87 31 10 3-1 2-8-2Z"/>
    <circle cx="92.4" cy="35.3" r="1.3" fill="${ink}" stroke="none"/>
    <path fill="none" stroke-width="1.15" d="M62 28Q72 30 77 28 M53 29 63 32
      M69 33 73 34 M98 43Q105 48 112 49 M51 15 55 17"/>
    <path fill="${ink}" stroke="none" d="m94 51 22 8-5 .5-19-8ZM117 41l17 6-2 .7-16-6.3Z"/>
  `,
};

export function cardArt(id) {
  const drawing = drawings[id];
  if (!drawing) return '';
  return `<svg viewBox="0 0 144 65" aria-hidden="true" focusable="false"
    xmlns="http://www.w3.org/2000/svg" fill="none" stroke="${ink}" stroke-width="1.95"
    stroke-linecap="round" stroke-linejoin="round">${drawing}</svg>`;
}
