export const THEME_GROUPS = [
  {
    mode: 'dark',
    label: 'Dark',
    themes: [
      { id: 'forest', label: 'Forest', swatches: ['#081b15', '#123527', '#d9a441', '#f3ede1'] },
      { id: 'mono-blush', label: 'Mono Blush', swatches: ['#180804', '#3a1810', '#c09891', '#f4d8d8'] },
      { id: 'meadow-blush', label: 'Meadow Blush', swatches: ['#16220e', '#2f4522', '#f18fa4', '#eef5df'] },
      { id: 'ember', label: 'Ember', swatches: ['#161316', '#2b2429', '#ff6d29', '#f5f0ee'] },
      { id: 'teal-lagoon', label: 'Teal Lagoon', swatches: ['#06282b', '#0f4247', '#fce688', '#eafbf7'] },
      { id: 'cloud-sky', label: 'Cloud Sky', swatches: ['#071620', '#123044', '#a9def9', '#f1fafe'] },
      { id: 'rose-bloom', label: 'Rose Bloom', swatches: ['#0e1f19', '#1e4235', '#ffb7c3', '#f5ede9'] },
    ],
  },
  {
    mode: 'light',
    label: 'Light',
    themes: [
      { id: 'forest-light', label: 'Forest', swatches: ['#f6f3ea', '#e6ddc4', '#7d5110', '#081b15'] },
      { id: 'mono-blush-light', label: 'Mono Blush', swatches: ['#fbf2ef', '#ecd6cc', '#7d3f37', '#180804'] },
      { id: 'meadow-blush-light', label: 'Meadow Blush', swatches: ['#f8faf0', '#e2e8c5', '#a8265f', '#16220e'] },
      { id: 'ember-light', label: 'Ember', swatches: ['#f8f4f2', '#e7d8d2', '#a03a0e', '#161316'] },
      { id: 'teal-lagoon-light', label: 'Teal Lagoon', swatches: ['#eef9f6', '#c8e8dd', '#6e5600', '#06282b'] },
      { id: 'cloud-sky-light', label: 'Cloud Sky', swatches: ['#eef7fc', '#c8e5f3', '#155578', '#071620'] },
      { id: 'rose-bloom-light', label: 'Rose Bloom', swatches: ['#fcf0f1', '#f0d2d8', '#8f2540', '#0e1f19'] },
    ],
  },
]

// Flat list, kept for anything that just needs "every theme id" (e.g. validating
// a persisted choice) without caring about the dark/light grouping.
export const THEMES = THEME_GROUPS.flatMap((g) => g.themes)

export function themeMode(themeId) {
  return THEME_GROUPS.find((g) => g.themes.some((t) => t.id === themeId))?.mode || 'dark'
}
