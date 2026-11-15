// Hand-drawn-style line icons (24x24, stroke = currentColor) used across the UI
// in place of emoji, so they inherit the gold/ink palette from CSS.

const svg = (paths) =>
  `<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths}</svg>`;

export const ICONS = {
  gold: svg('<ellipse cx="12" cy="6.5" rx="7" ry="2.8"/><path d="M5 6.5v5c0 1.6 3.1 2.8 7 2.8s7-1.2 7-2.8v-5"/><path d="M5 11.5v5c0 1.6 3.1 2.8 7 2.8s7-1.2 7-2.8v-5"/>'),
  food: svg('<path d="M12 22V5"/><path d="M12 9c-3 0-4.5-2-4.5-4 3 0 4.5 2 4.5 4zM12 9c3 0 4.5-2 4.5-4-3 0-4.5 2-4.5 4zM12 14c-3 0-4.5-2-4.5-4 3 0 4.5 2 4.5 4zM12 14c3 0 4.5-2 4.5-4-3 0-4.5 2-4.5 4zM12 19c-3 0-4.5-2-4.5-4 3 0 4.5 2 4.5 4zM12 19c3 0 4.5-2 4.5-4-3 0-4.5 2-4.5 4z"/>'),
  army: svg('<path d="M4 4l11 11M13 17l4-4M16 16l4 4M20 4L9 15M7 13l4 4M8 16l-4 4"/>'),
  stability: svg('<path d="M4 8h16L12 3z"/><path d="M6 8v10M10 8v10M14 8v10M18 8v10"/><path d="M4 18h16M3 21h18"/>'),
  legitimacy: svg('<path d="M3 8l4.5 4L12 5l4.5 7L21 8l-2 10H5z"/><path d="M5 21h14"/>'),
  faith: svg('<path d="M12 2v20M6.5 8h11"/><circle cx="12" cy="8" r="3.2"/>'),
  prestige: svg('<path d="M12 3l2.6 5.6 6.1.7-4.5 4.2 1.2 6L12 16.6 6.6 19.5l1.2-6-4.5-4.2 6.1-.7z"/>'),

  strength: svg('<path d="M10 6.5l3-3 7.5 7.5-3 3z"/><path d="M14 10L4 20"/>'),
  eloquence: svg('<path d="M4 5h16v10H9.5L5 19v-4H4z"/><path d="M8 9h8M8 12h5"/>'),
  intelligence: svg('<path d="M3 5.5c3-1.2 6-1 9 1 3-2 6-2.2 9-1V19c-3-1.2-6-1-9 1-3-2-6-2.2-9-1z"/><path d="M12 6.5V20"/>'),
  patience: svg('<path d="M6 3h12M6 21h12"/><path d="M7.5 3c0 5 9 6.5 9 9s-9 4-9 9M16.5 3c0 5-9 6.5-9 9s9 4 9 9"/>'),

  favor: svg('<circle cx="12" cy="13" r="6"/><path d="M12 10v6M9 13h6"/><path d="M9 7.5L12 3l3 4.5"/>'),
  houses: svg('<path d="M4 21V9l4-3 4 3v12M12 21V6l4-3 4 3v15"/><path d="M2 21h20"/>'),
  forest: svg('<path d="M12 2l6 9h-3l4 6H5l4-6H6z"/><path d="M12 17v5"/>'),
  mountain: svg('<path d="M2 20l7-12 4 6 3-4 6 10z"/><path d="M7.5 10.5l1.5 1.5 1.5-1.5"/>'),
  traderoute: svg('<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="1.8"/><path d="M12 4v6.2M12 13.8V20M4 12h6.2M13.8 12H20"/>'),

  unknown: svg('<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.5v.7M12 17h.01"/>'),
  menu: svg('<path d="M4 7h16M4 12h16M4 17h16"/>'),
  sound: svg('<path d="M4 9h4l5-4v14l-5-4H4z"/><path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12"/>'),
  mute: svg('<path d="M4 9h4l5-4v14l-5-4H4z"/><path d="M17 9l5 6M22 9l-5 6"/>'),
};

// Troop types (troops.js): the same line style as the icons above.
export const TROOP_ICONS = {
  spear: svg('<path d="M14 22V8.5"/><path d="M14 2l3 6.5h-6z"/><path d="M11.5 11.5h5"/><path d="M6.8 12.6l4 1.6v3c0 2.4-1.9 4-4 4.8-2.1-.8-4-2.4-4-4.8v-3z"/>'),
  archer: svg('<path d="M7 3c9 3.5 9 14.5 0 18"/><path d="M7 3v18"/><path d="M2.5 12H21"/><path d="M18 9l3 3-3 3"/><path d="M4.5 12l-1.6-2.2M4.5 12l-1.6 2.2"/>'),
  horse: svg('<path d="M5.5 21h13"/><path d="M7.5 21c.2-3.2 1.2-5.2 3.2-7.2-2.1-.7-3.9-2.4-4.3-5l2.4-3.4.6 1.4 1.7-2.8c4.4.5 8 3.5 8 8.6 0 2.7-.5 5-.5 8.4"/><circle cx="11.2" cy="8.4" r=".5"/>'),
  siege: svg('<circle cx="6.5" cy="19" r="2.3"/><circle cx="17.5" cy="19" r="2.3"/><path d="M3 16.5h18"/><path d="M7.5 16.5L15.5 6"/><path d="M11.8 16.5l2.5-5.3"/><path d="M14 4.5l3.6 1.2-1.2 3.5"/><circle cx="19.6" cy="3.8" r="1.5"/>'),
  merc: svg('<circle cx="7.5" cy="16" r="4.3"/><circle cx="7.5" cy="16" r="1.6"/><path d="M16.5 2.5v12.5"/><path d="M13.5 13.5h6"/><path d="M16.5 15v5.5"/><path d="M15.2 4.5l1.3-2 1.3 2"/>'),
};
