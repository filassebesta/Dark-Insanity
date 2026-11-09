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

  forest: svg('<path d="M12 2l6 9h-3l4 6H5l4-6H6z"/><path d="M12 17v5"/>'),
  mountain: svg('<path d="M2 20l7-12 4 6 3-4 6 10z"/><path d="M7.5 10.5l1.5 1.5 1.5-1.5"/>'),
  traderoute: svg('<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="1.8"/><path d="M12 4v6.2M12 13.8V20M4 12h6.2M13.8 12H20"/>'),

  unknown: svg('<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.5v.7M12 17h.01"/>'),
  menu: svg('<path d="M4 7h16M4 12h16M4 17h16"/>'),
  sound: svg('<path d="M4 9h4l5-4v14l-5-4H4z"/><path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12"/>'),
  mute: svg('<path d="M4 9h4l5-4v14l-5-4H4z"/><path d="M17 9l5 6M22 9l-5 6"/>'),
};
