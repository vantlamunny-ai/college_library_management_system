import { useRef, useState } from 'react';
import { Modal } from './Modal';
import { Avatar } from './Avatar';
import { PresetAvatarSvg } from './avatars';
import { PRESET_AVATARS } from './avatarPresets';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import * as studentService from '../../services/studentService';

const MAX_SOURCE_FILE_BYTES = 15 * 1024 * 1024; // reject absurdly large uploads before touching them
const OUTPUT_SIZE = 320; // px, square
const OUTPUT_QUALITY = 0.85;

/** Reads an image file, center-crops it to a square, and downsizes it — keeps the eventual data: URI small regardless of the source photo's resolution. */
function resizeToSquareDataUrl(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const side = Math.min(img.width, img.height);
      const sx = (img.width - side) / 2;
      const sy = (img.height - side) / 2;
      const canvas = document.createElement('canvas');
      canvas.width = OUTPUT_SIZE;
      canvas.height = OUTPUT_SIZE;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, sx, sy, side, side, 0, 0, OUTPUT_SIZE, OUTPUT_SIZE);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL('image/jpeg', OUTPUT_QUALITY));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Could not read this image file.'));
    };
    img.src = url;
  });
}

export function AvatarPicker({ open, onClose, currentPicture, name, onSaved }) {
  const toast = useToast();
  const { reloadStudentProfile } = useAuth();
  const fileInputRef = useRef(null);
  const [saving, setSaving] = useState(false);
  const [savingId, setSavingId] = useState(null);

  async function save(value) {
    setSaving(true);
    try {
      await studentService.updateMyProfile({ profile_picture: value });
      await reloadStudentProfile();
      toast.success('Profile picture updated.');
      onSaved?.(value);
      onClose();
    } catch (err) {
      toast.error(err?.message || 'Could not update your profile picture.');
    } finally {
      setSaving(false);
      setSavingId(null);
    }
  }

  async function handlePresetClick(preset) {
    setSavingId(preset.id);
    await save(`avatar:${preset.id}`);
  }

  async function handleFileChange(e) {
    const file = e.target.files?.[0];
    e.target.value = '' // allow re-selecting the same file later
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please choose an image file.');
      return;
    }
    if (file.size > MAX_SOURCE_FILE_BYTES) {
      toast.error('That image is too large — please choose one under 15MB.');
      return;
    }

    setSavingId('gallery');
    try {
      const dataUrl = await resizeToSquareDataUrl(file);
      await save(dataUrl);
    } catch (err) {
      toast.error(err?.message || 'Could not process this image.');
      setSavingId(null);
    }
  }

  return (
    <Modal open={open} title="Change profile picture" onClose={onClose} width={560}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
        <Avatar picture={currentPicture} name={name} size={56} className="clms-avatar" />
        <div>
          <button
            type="button"
            className="clms-btn clms-btn-primary clms-btn-small"
            disabled={saving}
            onClick={() => fileInputRef.current?.click()}
          >
            {savingId === 'gallery' ? <span className="clms-spinner" /> : <i className="ti ti-photo" />} Choose from gallery
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />
          <p className="clms-hint" style={{ margin: '6px 0 0' }}>JPG or PNG, any size — it's cropped and resized automatically.</p>
        </div>
      </div>

      <p style={{ margin: '0 0 10px', fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--muted)' }}>
        Or pick a built-in avatar
      </p>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(56px, 1fr))',
          gap: 10,
        }}
      >
        {PRESET_AVATARS.map((preset) => {
          const isCurrent = currentPicture === `avatar:${preset.id}`;
          return (
            <button
              key={preset.id}
              type="button"
              title={preset.label}
              aria-label={`Use the ${preset.label} avatar`}
              aria-pressed={isCurrent}
              disabled={saving}
              onClick={() => handlePresetClick(preset)}
              style={{
                position: 'relative',
                width: 56,
                height: 56,
                borderRadius: '50%',
                padding: 0,
                border: isCurrent ? '2px solid var(--gold)' : '2px solid transparent',
                cursor: saving ? 'default' : 'pointer',
                background: 'none',
                opacity: saving && savingId !== preset.id ? 0.5 : 1,
              }}
            >
              <PresetAvatarSvg preset={preset} size={52} />
              {savingId === preset.id && (
                <span
                  style={{
                    position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: 'rgba(0,0,0,0.4)', borderRadius: '50%',
                  }}
                >
                  <span className="clms-spinner" />
                </span>
              )}
            </button>
          );
        })}
      </div>
    </Modal>
  );
}
