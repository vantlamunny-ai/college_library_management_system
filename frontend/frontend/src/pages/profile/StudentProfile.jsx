import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageHeader } from '../../components/common/PageHeader'
import { Panel } from '../../components/common/Panel'
import { StatusBadge } from '../../components/common/StatusBadge'
import { Modal } from '../../components/common/Modal'
import { ConfirmDialog } from '../../components/common/ConfirmDialog'
import { Avatar } from '../../components/common/Avatar'
import { AvatarPicker } from '../../components/common/AvatarPicker'
import { UnavailableState } from '../../components/common/ErrorState'
import { SkeletonBlock } from '../../components/common/LoadingSkeleton'
import { useMutation } from '../../hooks/useApi'
import { useToast } from '../../context/ToastContext'
import { useAuth } from '../../context/AuthContext'
import * as studentService from '../../services/studentService'
import { looksLikeUsername } from '../../utils/validation'
import { formatDate } from '../../utils/date'

export default function StudentProfile() {
  const { user, studentProfile, studentProfileStatus, reloadStudentProfile, logout } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()

  const [avatarOpen, setAvatarOpen] = useState(false)
  const [usernameOpen, setUsernameOpen] = useState(false)
  const [academicOpen, setAcademicOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  const [deleteRun, deleteState] = useMutation(() => studentService.deleteMyAccount())

  async function handleDeleteAccount() {
    try {
      await deleteRun()
      toast.success('Your account has been deleted.')
      logout()
      navigate('/login', { replace: true })
    } catch (err) {
      toast.error(err?.message || 'Could not delete your account.')
      setDeleteOpen(false)
    }
  }

  const [bio, setBio] = useState('')
  const [interests, setInterests] = useState('')
  const [dirty, setDirty] = useState(false)

  /* eslint-disable react-hooks/set-state-in-effect --
     Syncs the editable bio/interests fields from the fetched profile —
     only re-runs when studentProfile changes identity (load or save),
     not on every render. */
  useEffect(() => {
    if (studentProfile) {
      setBio(studentProfile.bio || '')
      setInterests(studentProfile.interests || '')
      setDirty(false)
    }
  }, [studentProfile])
  /* eslint-enable react-hooks/set-state-in-effect */

  const [saveRun, saveState] = useMutation(() => studentService.updateMyProfile({ bio, interests }))

  async function handleSaveDetails(e) {
    e.preventDefault()
    try {
      await saveRun()
      await reloadStudentProfile()
      toast.success('Profile updated.')
      setDirty(false)
    } catch (err) {
      toast.error(err?.message || 'Could not save your profile.')
    }
  }

  if (studentProfileStatus === 'loading' || studentProfileStatus === 'idle') {
    return <SkeletonBlock height={360} />
  }

  if (studentProfileStatus === 'unavailable' || !studentProfile) {
    return (
      <div>
        <PageHeader title="My Profile" subtitle="Your details, bio, and account settings." />
        <Panel>
          <UnavailableState
            title="No student profile linked"
            message="Your account isn't linked to a student record yet — ask an admin to add one from Student Management, then your profile will appear here."
          />
        </Panel>
      </div>
    )
  }

  const interestChips = interests
    ? interests.split(',').map((s) => s.trim()).filter(Boolean)
    : []

  return (
    <div>
      <PageHeader title="My Profile" subtitle="Your details, bio, and account settings." />

      <Panel>
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <Avatar picture={studentProfile.profile_picture} name={studentProfile.student_name} size={84} className="clms-avatar-lg" />
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: '1.3rem', fontWeight: 600 }}>{studentProfile.student_name}</div>
            <div style={{ color: 'var(--muted)', fontSize: '0.85rem', marginTop: 2 }}>{studentProfile.roll_number} · {studentProfile.department || 'No department set'}</div>
            <div style={{ marginTop: 8 }}><StatusBadge status={studentProfile.account_status} /></div>
          </div>
          <button className="clms-btn clms-btn-ghost" onClick={() => setAvatarOpen(true)}>
            <i className="ti ti-camera" /> Change photo
          </button>
        </div>

        <div className="clms-row-card-fields" style={{ marginTop: 20 }}>
          <div className="clms-row-card-field"><span>Email</span><span>{studentProfile.email}</span></div>
          <div className="clms-row-card-field"><span>Roll number</span><span className="clms-cell-mono">{studentProfile.roll_number}</span></div>
          <div className="clms-row-card-field"><span>Department / Branch</span><span>{studentProfile.department || '—'}</span></div>
          <div className="clms-row-card-field"><span>Year</span><span>{studentProfile.year || '—'}</span></div>
          <div className="clms-row-card-field"><span>Semester</span><span>{studentProfile.semester || '—'}</span></div>
          <div className="clms-row-card-field"><span>Member since</span><span>{formatDate(studentProfile.created_at)}</span></div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
          <p className="clms-hint" style={{ margin: 0 }}>
            {studentProfile.academic_changes_used} of 2 branch/year/semester edits used this year
            {studentProfile.academic_changes_reset_at ? ` · resets ${formatDate(studentProfile.academic_changes_reset_at)}` : ''}.
          </p>
          <button
            className="clms-btn clms-btn-ghost clms-btn-small"
            disabled={studentProfile.academic_changes_remaining <= 0}
            onClick={() => setAcademicOpen(true)}
            title={studentProfile.academic_changes_remaining <= 0 ? "You've used all your changes for this year" : undefined}
          >
            <i className="ti ti-edit" /> Edit
          </button>
        </div>
      </Panel>

      <Panel title="Username">
        <p className="clms-hint" style={{ marginTop: -4 }}>
          You've used {studentProfile.username_changes_used} of 7 changes allowed this year
          {studentProfile.username_changes_reset_at ? ` · resets ${formatDate(studentProfile.username_changes_reset_at)}` : ''}.
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 10 }}>
          <span className="clms-cell-mono" style={{ fontSize: '0.95rem' }}>{user?.username}</span>
          <button
            className="clms-btn clms-btn-ghost clms-btn-small"
            disabled={studentProfile.username_changes_remaining <= 0}
            onClick={() => setUsernameOpen(true)}
            title={studentProfile.username_changes_remaining <= 0 ? "You've used all your changes for this year" : undefined}
          >
            Change username
          </button>
        </div>
      </Panel>

      <Panel title="About">
        <form onSubmit={handleSaveDetails}>
          <div className="clms-field">
            <label>Bio</label>
            <textarea
              className="clms-textarea"
              rows={4}
              maxLength={500}
              placeholder="Tell the library a little about yourself..."
              value={bio}
              onChange={(e) => { setBio(e.target.value); setDirty(true) }}
            />
          </div>
          <div className="clms-field">
            <label>Interests</label>
            <input
              className="clms-input"
              placeholder="e.g. Chess, Robotics, Reading (comma-separated)"
              value={interests}
              onChange={(e) => { setInterests(e.target.value); setDirty(true) }}
            />
            {interestChips.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
                {interestChips.map((chip) => (
                  <span key={chip} className="clms-badge clms-badge-neutral">{chip}</span>
                ))}
              </div>
            )}
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 6 }}>
            <button type="submit" className="clms-btn clms-btn-primary" disabled={!dirty || saveState.loading}>
              {saveState.loading && <span className="clms-spinner" />} Save changes
            </button>
          </div>
        </form>
      </Panel>

      <Panel title="Danger zone">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          <p className="clms-hint" style={{ margin: 0 }}>
            Permanently delete your account and profile. This cannot be undone.
          </p>
          <button className="clms-btn clms-btn-danger" onClick={() => setDeleteOpen(true)}>
            <i className="ti ti-trash" /> Delete account
          </button>
        </div>
      </Panel>

      <ConfirmDialog
        open={deleteOpen}
        title="Delete your account"
        message="This permanently deletes your profile and login — it cannot be undone. If you have books currently issued or pending fines, return/clear those first."
        confirmLabel="Delete account"
        tone="danger"
        loading={deleteState.loading}
        onConfirm={handleDeleteAccount}
        onCancel={() => setDeleteOpen(false)}
      />

      <AvatarPicker
        open={avatarOpen}
        onClose={() => setAvatarOpen(false)}
        currentPicture={studentProfile.profile_picture}
        name={studentProfile.student_name}
      />

      <ChangeUsernameModal
        open={usernameOpen}
        onClose={() => setUsernameOpen(false)}
        remaining={studentProfile.username_changes_remaining}
      />

      <AcademicInfoModal
        open={academicOpen}
        onClose={() => setAcademicOpen(false)}
        remaining={studentProfile.academic_changes_remaining}
        current={{ department: studentProfile.department, year: studentProfile.year, semester: studentProfile.semester }}
      />
    </div>
  )
}

function ChangeUsernameModal({ open, onClose, remaining }) {
  const toast = useToast()
  const { reloadStudentProfile } = useAuth()
  const [value, setValue] = useState('')
  const [error, setError] = useState('')
  const [run, state] = useMutation((username) => studentService.changeMyUsername(username))

  function handleClose() {
    setValue('')
    setError('')
    onClose()
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!looksLikeUsername(value)) {
      setError("Username may only contain letters, numbers, '.' and '_' — no spaces or other symbols.")
      return
    }
    try {
      await run(value)
      await reloadStudentProfile()
      toast.success('Username updated.')
      handleClose()
    } catch (err) {
      const message = err?.message || 'Could not change your username.'
      setError(message)
      toast.error(message)
    }
  }

  return (
    <Modal open={open} title="Change username" onClose={handleClose}>
      <form onSubmit={handleSubmit}>
        <p className="clms-hint" style={{ marginTop: -4 }}>{remaining} change{remaining === 1 ? '' : 's'} left this year.</p>
        <div className="clms-field">
          <label>New username</label>
          <input
            className="clms-input"
            placeholder="letters, numbers, '.' and '_' only"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            autoFocus
          />
        </div>
        {error && <p style={{ color: 'var(--danger)', fontSize: '0.8rem', margin: '-4px 0 10px' }}>{error}</p>}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 6 }}>
          <button type="button" className="clms-btn clms-btn-ghost" onClick={handleClose}>Cancel</button>
          <button type="submit" className="clms-btn clms-btn-primary" disabled={state.loading || !value}>
            {state.loading && <span className="clms-spinner" />} Save
          </button>
        </div>
      </form>
    </Modal>
  )
}

function AcademicInfoModal({ open, onClose, remaining, current }) {
  const toast = useToast()
  const { reloadStudentProfile } = useAuth()
  const [department, setDepartment] = useState(current.department || '')
  const [year, setYear] = useState(current.year || '')
  const [semester, setSemester] = useState(current.semester || '')
  const [error, setError] = useState('')
  const [run, state] = useMutation((payload) => studentService.updateMyAcademicInfo(payload))

  function handleClose() {
    setDepartment(current.department || '')
    setYear(current.year || '')
    setSemester(current.semester || '')
    setError('')
    onClose()
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    try {
      await run({ department, year, semester })
      await reloadStudentProfile()
      toast.success('Academic info updated.')
      onClose()
    } catch (err) {
      const message = err?.message || 'Could not update your academic info.'
      setError(message)
      toast.error(message)
    }
  }

  return (
    <Modal open={open} title="Edit branch, year & semester" onClose={handleClose}>
      <form onSubmit={handleSubmit}>
        <p className="clms-hint" style={{ marginTop: -4 }}>{remaining} change{remaining === 1 ? '' : 's'} left this year.</p>
        <div className="clms-field">
          <label>Branch / Department</label>
          <input
            className="clms-input"
            placeholder="e.g. Computer Science"
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            autoFocus
          />
        </div>
        <div className="clms-field-row">
          <div className="clms-field">
            <label>Year</label>
            <input
              className="clms-input"
              type="number"
              min="1"
              max="6"
              value={year}
              onChange={(e) => setYear(e.target.value)}
            />
          </div>
          <div className="clms-field">
            <label>Semester</label>
            <input
              className="clms-input"
              type="number"
              min="1"
              max="12"
              value={semester}
              onChange={(e) => setSemester(e.target.value)}
            />
          </div>
        </div>
        {error && <p style={{ color: 'var(--danger)', fontSize: '0.8rem', margin: '-4px 0 10px' }}>{error}</p>}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 6 }}>
          <button type="button" className="clms-btn clms-btn-ghost" onClick={handleClose}>Cancel</button>
          <button type="submit" className="clms-btn clms-btn-primary" disabled={state.loading}>
            {state.loading && <span className="clms-spinner" />} Save
          </button>
        </div>
      </form>
    </Modal>
  )
}
