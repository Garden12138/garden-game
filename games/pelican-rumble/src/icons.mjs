const paths = {
  cap:'<path d="m2 9 10-5 10 5-10 5z"/><path d="M6 11v5c3 3 9 3 12 0v-5m4-2v6"/>',
  cpu:'<rect x="5" y="5" width="14" height="14" rx="2"/><rect x="9" y="9" width="6" height="6"/><path d="M8 2v3m4-3v3m4-3v3M8 19v3m4-3v3m4-3v3M2 8h3m-3 4h3m-3 4h3m14-8h3m-3 4h3m-3 4h3"/>',
  users:'<circle cx="9" cy="8" r="3"/><path d="M3 20v-2c0-6 12-6 12 0v2m1-15a3 3 0 0 1 0 6m2 3c2 0 4 2 4 4v2"/>',
  mic:'<rect x="9" y="2" width="6" height="13" rx="3"/><path d="M5 10v1a7 7 0 0 0 14 0v-1m-7 8v4m-4 0h8"/>',
  history:'<path d="M3 11a9 9 0 1 1 2 7M3 5v6h6m3-5v6l4 2"/>',
  cards:'<path d="m5 17-2-9 5-2m0 13L7 4l6-1"/><rect x="11" y="5" width="10" height="16" rx="1.5"/><path d="m14 13 2-3 2 3-2 3z"/>',
  volume:'<path d="M3 9h4l5-5v16l-5-5H3zm12-2a7 7 0 0 1 0 10m3-13a11 11 0 0 1 0 16"/>',
  mute:'<path d="M3 9h4l5-5v16l-5-5H3zm13 0 6 6m0-6-6 6"/>',
  clock:'<circle cx="12" cy="13" r="8"/><path d="M12 9v5l3 1m-6-13h6m-3 0v3"/>',
  book:'<path d="M12 5c-3-2-6-2-10-1v14c4-1 7-1 10 1 3-2 6-2 10-1V4c-4-1-7-1-10 1zm0 0v14"/>',
  bolt:'<path fill="currentColor" stroke="none" d="M14 1 4 14h7l-1 9L21 9h-8z"/>',
  lock:'<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3m-4 5v2"/>',
  arrow:'<path d="M3 12h17m-6-6 6 6-6 6"/>',
  replay:'<path d="M3 5v6h6m-6 0a9 9 0 1 1 2 7"/>',
  close:'<path d="m5 5 14 14m0-14L5 19"/>',
  check:'<path d="m4 12 5 5L20 6"/>',
  target:'<circle cx="12" cy="12" r="7"/><path d="M12 1v5m0 12v5M1 12h5m12 0h5"/><circle cx="12" cy="12" r="2" fill="currentColor" stroke="none"/>',
  whistle:'<path d="m4 9 9 2 7-6 2 4-6 8-5-1a5 5 0 1 1-7-7z"/><circle cx="7" cy="14" r="1.4"/>',
  bell:'<path d="M3 17h18M5 17a7 7 0 0 1 14 0M2 21h20M10 7h4m-2 0v3"/>',
};
export function icon(name, size=18) {
  return '<svg aria-hidden="true" width="'+size+'" height="'+size+'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">'+paths[name]+'</svg>';
}
