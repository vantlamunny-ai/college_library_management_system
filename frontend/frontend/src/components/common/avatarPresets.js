/**
 * Data-only half of the built-in avatar system — kept separate from
 * avatars.jsx (which only exports the <PresetAvatarSvg> component) so Fast
 * Refresh can treat that file as component-only.
 */

export const EAR_PATHS = {
  round: 'M 22 34 A 14 14 0 0 1 40 22 L 30 46 Z M 78 34 A 14 14 0 0 0 60 22 L 70 46 Z',
  pointy: 'M 18 40 L 34 12 L 42 38 Z M 82 40 L 66 12 L 58 38 Z',
  tall: 'M 30 8 C 26 8 24 30 30 44 C 34 46 38 44 37 34 C 36 22 36 8 30 8 Z M 70 8 C 74 8 76 30 70 44 C 66 46 62 44 63 34 C 64 22 64 8 70 8 Z',
  tufted: 'M 26 30 L 34 6 L 40 32 Z M 74 30 L 66 6 L 60 32 Z',
  none: '',
};

export const PRESET_AVATARS = [
  {
    id: 'bear-1', label: 'Bear', bg: '#c98a4b', ear: 'round', earFill: '#a8683a',
    face: '#e0a869', snout: '#f3d9ad', eye: '#2b1c12', cheeks: '#e8836b',
  },
  {
    id: 'bear-2', label: 'Panda', bg: '#f4f2ee', ear: 'round', earFill: '#2c2c2c',
    face: '#ffffff', snout: '#ffffff', eye: '#2c2c2c', mask: '#2c2c2c', cheeks: '#f2b3a4',
  },
  {
    id: 'fox-1', label: 'Fox', bg: '#e8763a', ear: 'pointy', earFill: '#c85a22',
    face: '#f3925a', snout: '#fbead9', eye: '#2b1c12', cheeks: '#f4a97e',
  },
  {
    id: 'cat-1', label: 'Cat', bg: '#8a8fae', ear: 'pointy', earFill: '#6d7290',
    face: '#a7abc4', snout: '#e9e9f2', eye: '#233', cheeks: '#c9a8c4', whiskers: true,
  },
  {
    id: 'cat-2', label: 'Tiger', bg: '#eaa736', ear: 'round', earFill: '#d18a1c',
    face: '#f5c467', snout: '#fbead9', eye: '#2b1c12', cheeks: '#f4a97e', stripes: '#2b1c12',
  },
  {
    id: 'rabbit-1', label: 'Rabbit', bg: '#f2d9e6', ear: 'tall', earFill: '#e9bdd6',
    face: '#fbeaf2', snout: '#ffffff', eye: '#5a3350', cheeks: '#f4a9c4',
  },
  {
    id: 'koala-1', label: 'Koala', bg: '#9aa5ab', ear: 'round', earFill: '#7d8a91',
    face: '#b7c0c4', snout: '#4d4d4d', eye: '#232323', cheeks: '#c9b3b3',
  },
  {
    id: 'owl-1', label: 'Owl', bg: '#7a6248', ear: 'tufted', earFill: '#5f4c38',
    face: '#a9835c', snout: '#e8a13a', eye: '#2b1c12', cheeks: '#d3a874', bigEyes: true,
  },
  {
    id: 'penguin-1', label: 'Penguin', bg: '#33414f', ear: 'none', earFill: '#33414f',
    face: '#ffffff', snout: '#f2a33e', eye: '#1a1f26', cheeks: '#ffffff', belly: true,
  },
  {
    id: 'frog-1', label: 'Frog', bg: '#7fb069', ear: 'none', earFill: '#7fb069',
    face: '#98c97e', snout: '#e9f4d8', eye: '#1e3d1a', cheeks: '#b7dba0', bigEyes: true,
  },
  {
    id: 'deer-1', label: 'Deer', bg: '#c49a6c', ear: 'pointy', earFill: '#a97c4f',
    face: '#d9b385', snout: '#f3e3c8', eye: '#2b1c12', cheeks: '#e2a97e', antlers: true,
  },
  {
    id: 'robot-1', label: 'Robot', bg: '#3f5b73', ear: 'none', earFill: '#3f5b73',
    face: '#7fa8bf', snout: '#7fa8bf', eye: '#e8f4fa', cheeks: 'transparent', antenna: true, robotMouth: true,
  },
];

export function findPresetAvatar(id) {
  return PRESET_AVATARS.find((p) => p.id === id) || null;
}
