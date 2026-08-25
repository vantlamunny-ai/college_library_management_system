import { PresetAvatarSvg } from './avatars';
import { findPresetAvatar } from './avatarPresets';
import { initials } from '../../utils/format';

/**
 * Renders a profile picture from any of the three states a student's
 * `profile_picture` column can hold: a gallery photo (`data:image/...`
 * URI), a built-in preset (`avatar:<id>`), or nothing yet — in which case
 * it falls back to the plain initials circle used everywhere else in the
 * app, so this is a drop-in replacement wherever that pattern appeared.
 */
export function Avatar({ picture, name, size = 40, className = '' }) {
  const style = { width: size, height: size, borderRadius: '50%', overflow: 'hidden', flexShrink: 0 };

  if (picture && picture.startsWith('data:image')) {
    return (
      <div className={className} style={style}>
        <img src={picture} alt={name || 'Profile'} width={size} height={size} style={{ objectFit: 'cover', width: '100%', height: '100%' }} />
      </div>
    );
  }

  if (picture && picture.startsWith('avatar:')) {
    const preset = findPresetAvatar(picture.slice('avatar:'.length));
    if (preset) {
      return (
        <div className={className} style={style}>
          <PresetAvatarSvg preset={preset} size={size} />
        </div>
      );
    }
  }

  return (
    <div className={className} style={{ ...style, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {initials(name)}
    </div>
  );
}
