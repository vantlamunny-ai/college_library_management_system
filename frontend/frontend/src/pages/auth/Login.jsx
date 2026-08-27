import { useEffect, useState } from 'react'

import { useLocation, useNavigate } from 'react-router-dom'

import logo from '../../assets/nri-logo-white.png'

import bookshelf from '../../assets/bookshelf-green.png'

import { useAuth } from '../../hooks/useAuth'

import * as authService from '../../services/authService'

import { Modal } from '../../components/common/Modal'

import { looksLikeUsername } from '../../utils/validation'

import './Login.css'

const ROLE_HOME = {
  Student: '/student/dashboard',
  Admin: '/admin/dashboard',
  Librarian: '/librarian/dashboard',
}

const SIGNUP_ROLES = ['Student', 'Librarian', 'Admin']

export default function Login() {
  const [showCurtain, setShowCurtain] = useState(true)

  useEffect(() => {
    const t = setTimeout(() => setShowCurtain(false), 1100)
    return () => clearTimeout(t)
  }, [])

  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [remember, setRemember] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [forgotOpen, setForgotOpen] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotStatus, setForgotStatus] = useState({
    loading: false,
    message: '',
    error: '',
    resetLink: '',
  })

  const [signupOpen, setSignupOpen] = useState(false)
  const [signupRole, setSignupRole] = useState('Student')

  const [signup, setSignup] = useState({
    fullName: '',
    username: '',
    rollNumber: '',
    email: '',
    password: '',
    department: '',
    year: '',
    semester: '',
    interests: '',
  })

  const [signupStatus, setSignupStatus] = useState({
    loading: false,
    message: '',
    error: '',
  })

  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!identifier || !password) {
      setError('Please enter your credentials and password.')
      return
    }

    setLoading(true)

    try {
      const user = await login(identifier, password)

      const redirectTo =
        location.state?.from?.pathname ||
        ROLE_HOME[user.role] ||
        '/'

      navigate(redirectTo, { replace: true })
    } catch (err) {
      setError(err?.message || 'Invalid credentials.')
    } finally {
      setLoading(false)
    }
  }

  const handleForgotSubmit = async (e) => {
    e.preventDefault()

    if (!forgotEmail) return

    setForgotStatus({
      loading: true,
      message: '',
      error: '',
      resetLink: '',
    })

    try {
      const res = await authService.forgotPassword(forgotEmail)
      const { emailSent, resetLink } = res.data

      setForgotStatus({
        loading: false,
        message: emailSent
          ? 'If that email is registered, a password reset link has been sent.'
          : "Email delivery isn't configured on this server yet, so here's your reset link directly:",
        error: '',
        resetLink: emailSent ? '' : resetLink,
      })
    } catch (err) {
      setForgotStatus({
        loading: false,
        message: '',
        error: err?.message || 'Could not process that request.',
        resetLink: '',
      })
    }
  }

  function resetSignup() {
    setSignupRole('Student')

    setSignup({
      fullName: '',
      username: '',
      rollNumber: '',
      email: '',
      password: '',
      department: '',
      year: '',
      semester: '',
      interests: '',
    })

    setSignupStatus({
      loading: false,
      message: '',
      error: '',
    })
  }

  const handleSignupSubmit = async (e) => {
    e.preventDefault()

    let payload

    if (signupRole === 'Student') {
      if (
        !signup.fullName ||
        !signup.username ||
        !signup.rollNumber ||
        !signup.email ||
        !signup.password
      ) {
        setSignupStatus({
          loading: false,
          message: '',
          error: 'Please fill in all fields.',
        })
        return
      }

      if (!looksLikeUsername(signup.username)) {
        setSignupStatus({
          loading: false,
          message: '',
          error:
            "Username may only contain letters, numbers, '.' and '_' — no spaces or other symbols.",
        })
        return
      }

      payload = {
        username: signup.username,
        email: signup.email,
        password: signup.password,
        role: 'Student',
        status: 'Active',
        roll_number: signup.rollNumber,
        student_name: signup.fullName,
        department: signup.department || undefined,
        year: signup.year || undefined,
        semester: signup.semester || undefined,
        interests: signup.interests || undefined,
      }
    } else {
      if (!signup.email || !signup.password) {
        setSignupStatus({
          loading: false,
          message: '',
          error: 'Please fill in all fields.',
        })
        return
      }

      payload = {
        email: signup.email,
        password: signup.password,
        role: signupRole,
        status: 'Active',
      }
    }

    setSignupStatus({
      loading: true,
      message: '',
      error: '',
    })

    try {
      const res = await authService.register(payload)

      setSignupStatus({
        loading: false,
        message:
          signupRole === 'Student'
            ? 'Account created — you can sign in now.'
            : `${signupRole} account created — you can sign in now with your email and password.`,
        error: '',
      })

      setIdentifier(
        signupRole === 'Student'
          ? signup.username
          : res.data.email
      )

      setPassword('')
    } catch (err) {
      setSignupStatus({
        loading: false,
        message: '',
        error:
          err?.message || 'Could not create this account.',
      })
    }
  }

  return (
    <div className="lg-page" data-theme="forest">
      {showCurtain && (
        <>
          <div
            className="lg-curtain lg-curtain-left"
            aria-hidden="true"
          />
          <div
            className="lg-curtain lg-curtain-right"
            aria-hidden="true"
          />
        </>
      )}

      <div className="lg-glow lg-glow-1" aria-hidden="true" />
      <div className="lg-glow lg-glow-2" aria-hidden="true" />

      <div
        className="lg-art"
        style={{ backgroundImage: `url(${bookshelf})` }}
        aria-hidden="true"
      />

      <div className="lg-art-fade" aria-hidden="true" />

      <header className="lg-topbar">
        <div className="lg-brand">
          <span className="lg-logo-wrap">
            <img
              src={logo}
              alt="NRI University"
              className="lg-logo"
            />
          </span>

          <div className="lg-brand-text">
            <span className="lg-brand-title">
              Library
            </span>

            <span className="lg-brand-sub">
              Access Portal
            </span>
          </div>
        </div>
      </header>

      <main className="lg-content">
        <div className="lg-form-col clms-stagger">
          <span className="lg-badge">
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M12 2l2.4 7.2H22l-6 4.6 2.3 7.2L12 16.4 5.7 21l2.3-7.2-6-4.6h7.6z" />
            </svg>
            Member access · NRI Central Library
          </span>

          <h1 className="lg-heading">
            Welcome back,
            <br />
            <span className="lg-heading-shine">
              reader.
            </span>
          </h1>

          <p className="lg-subtext">
            Sign in with your library account to renew
            titles, hold reservations and enter the digital
            archive.
          </p>

          <form
            className="lg-form"
            onSubmit={handleSubmit}
            noValidate
          >
            <div className="lg-field">
              <label htmlFor="identifier">
                Roll No / Username / Email
              </label>

              <div className="lg-input-wrap">
                <input
                  id="identifier"
                  type="text"
                  autoComplete="username"
                  placeholder="Enter roll number, username, or email"
                  value={identifier}
                  onChange={(e) =>
                    setIdentifier(e.target.value)
                  }
                />
              </div>
            </div>

            <div className="lg-field">
              <label htmlFor="password">
                Password
              </label>

              <div className="lg-input-wrap">
                <input
                  id="password"
                  type={
                    showPassword ? 'text' : 'password'
                  }
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) =>
                    setPassword(e.target.value)
                  }
                />

                <button
                  type="button"
                  className="lg-eye"
                  onClick={() =>
                    setShowPassword((v) => !v)
                  }
                  aria-label={
                    showPassword
                      ? 'Hide password'
                      : 'Show password'
                  }
                >
                  <svg
                    width="17"
                    height="17"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8Z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="lg-row">
              <label className="lg-remember">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) =>
                    setRemember(e.target.checked)
                  }
                />

                <span>Remember this device</span>
              </label>

              <button
                type="button"
                className="lg-link"
                onClick={() => setForgotOpen(true)}
              >
                Forgot password?
              </button>
            </div>

            {error && (
              <p className="lg-error" role="alert">
                {error}
              </p>
            )}

            <button
              type="submit"
              className="lg-submit clms-shine"
              disabled={loading}
            >
              {loading ? (
                'Signing in…'
              ) : (
                <>
                  Sign in{' '}
                  <span className="lg-arrow">
                    →
                  </span>
                </>
              )}
            </button>
          </form>

          <p className="lg-signup">
            New to the library?{' '}
            <a
              href="#create-account"
              onClick={(e) => {
                e.preventDefault()
                setSignupOpen(true)
              }}
            >
              Create an account
            </a>
          </p>
        </div>

        <div className="lg-quote-col">
          <blockquote className="lg-quote">
            “A room without books is like a body without a
            soul.”
          </blockquote>

          <cite className="lg-cite">
            — Marcus Tullius Cicero
          </cite>
        </div>
      </main>

      <Modal
        open={forgotOpen}
        title="Reset your password"
        onClose={() => setForgotOpen(false)}
      >
        <form onSubmit={handleForgotSubmit}>
          <div
            className="lg-field"
            style={{ marginBottom: 14 }}
          >
            <label htmlFor="forgot-email">
              Email
            </label>

            <div className="lg-input-wrap">
              <input
                id="forgot-email"
                type="email"
                placeholder="Enter your account email"
                value={forgotEmail}
                onChange={(e) =>
                  setForgotEmail(e.target.value)
                }
              />
            </div>
          </div>

          {forgotStatus.message && (
            <p
              style={{
                color: 'var(--lg-gold)',
                fontSize: '0.82rem',
              }}
            >
              {forgotStatus.message}
            </p>
          )}

          {forgotStatus.resetLink && (
            <p
              style={{
                fontSize: '0.8rem',
                wordBreak: 'break-all',
                marginTop: -8,
              }}
            >
              <a
                href={forgotStatus.resetLink}
                style={{
                  color: 'var(--lg-cream)',
                  textDecoration: 'underline',
                }}
              >
                {forgotStatus.resetLink}
              </a>
            </p>
          )}

          {forgotStatus.error && (
            <p className="lg-error" role="alert">
              {forgotStatus.error}
            </p>
          )}

          <button
            type="submit"
            className="lg-submit"
            disabled={forgotStatus.loading}
          >
            {forgotStatus.loading
              ? 'Sending…'
              : 'Send reset link'}
          </button>
        </form>
      </Modal>

      <Modal
        open={signupOpen}
        title="Create your account"
        onClose={() => {
          setSignupOpen(false)
          resetSignup()
        }}
      >
        {signupStatus.message ? (
          <div>
            <p
              style={{
                color: 'var(--lg-gold)',
                fontSize: '0.86rem',
                lineHeight: 1.5,
              }}
            >
              {signupStatus.message}
            </p>

            <button
              type="button"
              className="lg-submit"
              onClick={() => {
                setSignupOpen(false)
                resetSignup()
              }}
            >
              Done
            </button>
          </div>
        ) : (
          <>
            <div
              className="lg-field"
              style={{ marginBottom: 14 }}
            >
              <label htmlFor="signup-role">
                Choose account type
              </label>

              <div
                className="lg-role-select"
                id="signup-role"
                role="radiogroup"
                aria-label="Account type"
              >
                {SIGNUP_ROLES.map((r) => (
                  <button
                    key={r}
                    type="button"
                    role="radio"
                    aria-checked={signupRole === r}
                    className={`lg-role-btn ${
                      signupRole === r ? 'active' : ''
                    }`}
                    onClick={() => setSignupRole(r)}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleSignupSubmit}>
              {signupRole === 'Student' ? (
                <>
                  <p
                    style={{
                      margin: '0 0 14px',
                      fontSize: '0.8rem',
                      color: 'var(--lg-muted)',
                      lineHeight: 1.5,
                    }}
                  >
                    Creates a Student account linked to
                    your roll number.
                  </p>

                  <div
                    className="lg-field"
                    style={{ marginBottom: 14 }}
                  >
                    <label htmlFor="signup-fullname">
                      Full name
                    </label>

                    <div className="lg-input-wrap">
                      <input
                        id="signup-fullname"
                        type="text"
                        placeholder="Enter your full name"
                        value={signup.fullName}
                        onChange={(e) =>
                          setSignup((s) => ({
                            ...s,
                            fullName: e.target.value,
                          }))
                        }
                      />
                    </div>
                  </div>

                  <div
                    className="lg-field"
                    style={{ marginBottom: 14 }}
                  >
                    <label htmlFor="signup-username">
                      Username
                    </label>

                    <div className="lg-input-wrap">
                      <input
                        id="signup-username"
                        type="text"
                        placeholder="letters, numbers, '.' and '_' only"
                        value={signup.username}
                        onChange={(e) =>
                          setSignup((s) => ({
                            ...s,
                            username: e.target.value,
                          }))
                        }
                      />
                    </div>
                  </div>

                  <div
                    className="lg-field"
                    style={{ marginBottom: 14 }}
                  >
                    <label htmlFor="signup-roll">
                      Roll number
                    </label>

                    <div className="lg-input-wrap">
                      <input
                        id="signup-roll"
                        type="text"
                        placeholder="e.g. 25KN1A05CB"
                        value={signup.rollNumber}
                        onChange={(e) =>
                          setSignup((s) => ({
                            ...s,
                            rollNumber: e.target.value,
                          }))
                        }
                      />
                    </div>
                  </div>

                  <div
                    className="lg-field"
                    style={{ marginBottom: 14 }}
                  >
                    <label htmlFor="signup-department">
                      Branch / Department
                    </label>

                    <div className="lg-input-wrap">
                      <input
                        id="signup-department"
                        type="text"
                        placeholder="e.g. Computer Science"
                        value={signup.department}
                        onChange={(e) =>
                          setSignup((s) => ({
                            ...s,
                            department: e.target.value,
                          }))
                        }
                      />
                    </div>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      gap: 12,
                      marginBottom: 14,
                    }}
                  >
                    <div
                      className="lg-field"
                      style={{ flex: 1 }}
                    >
                      <label htmlFor="signup-year">
                        Year
                      </label>

                      <div className="lg-input-wrap">
                        <input
                          id="signup-year"
                          type="number"
                          min="1"
                          max="6"
                          placeholder="e.g. 2"
                          value={signup.year}
                          onChange={(e) =>
                            setSignup((s) => ({
                              ...s,
                              year: e.target.value,
                            }))
                          }
                        />
                      </div>
                    </div>

                    <div
                      className="lg-field"
                      style={{ flex: 1 }}
                    >
                      <label htmlFor="signup-semester">
                        Semester
                      </label>

                      <div className="lg-input-wrap">
                        <input
                          id="signup-semester"
                          type="number"
                          min="1"
                          max="12"
                          placeholder="e.g. 3"
                          value={signup.semester}
                          onChange={(e) =>
                            setSignup((s) => ({
                              ...s,
                              semester: e.target.value,
                            }))
                          }
                        />
                      </div>
                    </div>
                  </div>

                  <div
                    className="lg-field"
                    style={{ marginBottom: 14 }}
                  >
                    <label htmlFor="signup-interests">
                      Interests
                    </label>

                    <div className="lg-input-wrap">
                      <input
                        id="signup-interests"
                        type="text"
                        placeholder="e.g. Chess, Robotics, Reading"
                        value={signup.interests}
                        onChange={(e) =>
                          setSignup((s) => ({
                            ...s,
                            interests: e.target.value,
                          }))
                        }
                      />
                    </div>
                  </div>
                </>
              ) : (
                <p
                  style={{
                    margin: '0 0 14px',
                    fontSize: '0.8rem',
                    color: 'var(--lg-muted)',
                    lineHeight: 1.5,
                  }}
                >
                  Creates{' '}
                  {signupRole === 'Admin' ? 'an' : 'a'}{' '}
                  {signupRole} account with full{' '}
                  {signupRole.toLowerCase()} access — just
                  an email and password.
                </p>
              )}

              <div
                className="lg-field"
                style={{ marginBottom: 14 }}
              >
                <label htmlFor="signup-email">
                  Email
                </label>

                <div className="lg-input-wrap">
                  <input
                    id="signup-email"
                    type="email"
                    placeholder="Enter your email"
                    value={signup.email}
                    onChange={(e) =>
                      setSignup((s) => ({
                        ...s,
                        email: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>

              <div
                className="lg-field"
                style={{ marginBottom: 14 }}
              >
                <label htmlFor="signup-password">
                  Password
                </label>

                <div className="lg-input-wrap">
                  <input
                    id="signup-password"
                    type="password"
                    placeholder="Choose a password"
                    autoComplete="new-password"
                    value={signup.password}
                    onChange={(e) =>
                      setSignup((s) => ({
                        ...s,
                        password: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>

              {signupStatus.error && (
                <p className="lg-error" role="alert">
                  {signupStatus.error}
                </p>
              )}

              <button
                type="submit"
                className="lg-submit"
                disabled={signupStatus.loading}
              >
                {signupStatus.loading
                  ? 'Creating account…'
                  : 'Create account'}
              </button>
            </form>
          </>
        )}
      </Modal>
    </div>
  )
}