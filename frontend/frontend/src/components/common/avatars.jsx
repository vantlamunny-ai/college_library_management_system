import { EAR_PATHS } from './avatarPresets';

/**
 * Renders one built-in cartoon avatar preset as a self-contained SVG (no
 * external image assets). See avatarPresets.js for the preset data and
 * Avatar.jsx for how a student's stored `avatar:<id>` string resolves here.
 */
export function PresetAvatarSvg({ preset, size = 40 }) {
  if (!preset) return null;
  const earPath = EAR_PATHS[preset.ear] || '';

  return (
    <svg width={size} height={size} viewBox="0 0 100 100" role="img" aria-label={preset.label}>
      <circle cx="50" cy="50" r="50" fill={preset.bg} />
      {earPath && <path d={earPath} fill={preset.earFill} />}
      {preset.antenna && (
        <>
          <line x1="50" y1="18" x2="50" y2="8" stroke={preset.earFill} strokeWidth="3" />
          <circle cx="50" cy="6" r="4" fill="#f2b23e" />
        </>
      )}
      {preset.antlers && (
        <path
          d="M 34 26 C 28 20 26 12 20 12 M 34 26 C 32 18 34 12 30 8 M 66 26 C 72 20 74 12 80 12 M 66 26 C 68 18 66 12 70 8"
          stroke={preset.earFill} strokeWidth="3" fill="none" strokeLinecap="round"
        />
      )}
      <circle cx="50" cy="58" r="30" fill={preset.face} />
      {preset.mask && (
        <>
          <ellipse cx="38" cy="52" rx="10" ry="12" fill={preset.mask} />
          <ellipse cx="62" cy="52" rx="10" ry="12" fill={preset.mask} />
        </>
      )}
      {preset.belly && <ellipse cx="50" cy="72" rx="18" ry="14" fill={preset.face === '#ffffff' ? '#eef3f6' : '#ffffff'} />}
      {/* cheeks */}
      {preset.cheeks && preset.cheeks !== 'transparent' && (
        <>
          <circle cx="30" cy="64" r="6" fill={preset.cheeks} opacity="0.7" />
          <circle cx="70" cy="64" r="6" fill={preset.cheeks} opacity="0.7" />
        </>
      )}
      {/* eyes */}
      {preset.bigEyes ? (
        <>
          <circle cx="38" cy="54" r="9" fill="#fff" />
          <circle cx="62" cy="54" r="9" fill="#fff" />
          <circle cx="38" cy="54" r="4.2" fill={preset.eye} />
          <circle cx="62" cy="54" r="4.2" fill={preset.eye} />
        </>
      ) : (
        <>
          <ellipse cx="38" cy="55" rx="3.4" ry="4.4" fill={preset.eye} />
          <ellipse cx="62" cy="55" rx="3.4" ry="4.4" fill={preset.eye} />
        </>
      )}
      {preset.robotMouth ? (
        <rect x="40" y="66" width="20" height="8" rx="2" fill="#1c2b36" />
      ) : (
        <>
          {/* snout / nose area */}
          <ellipse cx="50" cy="68" rx="12" ry="9" fill={preset.snout} />
          <ellipse cx="50" cy="64" rx="3.2" ry="2.4" fill={preset.eye} />
          <path d="M 50 66 Q 44 74 38 70" stroke={preset.eye} strokeWidth="1.6" fill="none" strokeLinecap="round" />
          <path d="M 50 66 Q 56 74 62 70" stroke={preset.eye} strokeWidth="1.6" fill="none" strokeLinecap="round" />
        </>
      )}
      {preset.stripes && (
        <>
          <path d="M 24 40 L 32 48" stroke={preset.stripes} strokeWidth="2.5" strokeLinecap="round" />
          <path d="M 76 40 L 68 48" stroke={preset.stripes} strokeWidth="2.5" strokeLinecap="round" />
          <path d="M 20 52 L 28 56" stroke={preset.stripes} strokeWidth="2.5" strokeLinecap="round" />
          <path d="M 80 52 L 72 56" stroke={preset.stripes} strokeWidth="2.5" strokeLinecap="round" />
        </>
      )}
      {preset.whiskers && (
        <>
          <path d="M 20 62 L 32 60 M 20 68 L 32 66" stroke="#fff" strokeWidth="1.4" strokeLinecap="round" />
          <path d="M 80 62 L 68 60 M 80 68 L 68 66" stroke="#fff" strokeWidth="1.4" strokeLinecap="round" />
        </>
      )}
    </svg>
  );
}
