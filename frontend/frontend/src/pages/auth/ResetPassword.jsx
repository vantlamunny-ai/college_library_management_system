import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import logo from '../../assets/nri-logo-white.png'
import bookshelf from '../../assets/bookshelf-green.png'
import * as authService from '../../services/authService'
import './Login.css'

export default function ResetPassword() {
  const { token } = useParams()
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!password || password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)
    try {
      await authService.resetPassword(token, password)
      setDone(true)
    } catch (err) {
      setError(err?.message || 'Could not reset your password. The link may have expired.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="lg-page" data-theme="forest">
      <div className="lg-art" style={{ backgroundImage: `url(${bookshelf})` }} aria-hidden="true" />
      <div className="lg-art-fade" aria-hidden="true" />

      <header className="lg-topbar">
        <div className="lg-brand">
          <img src={logo} alt="NRI University" className="lg-logo" />
          <div className="lg-brand-text">
            <span className="lg-brand-title">Library</span>
            <span className="lg-brand-sub">Access Portal</span>
          </div>
        </div>
      </header>

      <main className="lg-content">
        <div className="lg-form-col">
          <h1 className="lg-heading">
            {done ? 'Password updated.' : 'Set a new password.'}
          </h1>

          {done ? (
            <>
              <p className="lg-subtext">
                Your password has been reset. You can sign in with it now.
              </p>
              <button type="button" className="lg-submit" onClick={() => navigate('/login', { replace: true })}>
                Go to sign in <span className="lg-arrow">&rarr;</span>
              </button>
            </>
          ) : (
            <>
              <p className="lg-subtext">
                Choose a new password for your account.
              </p>

              <form className="lg-form" onSubmit={handleSubmit} noValidate>
                <div className="lg-field">
                  <label htmlFor="new-password">New password</label>
                  <div className="lg-input-wrap">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="4" y="10" width="16" height="10" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></svg>
                    <input
                      id="new-password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      placeholder="At least 8 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      className="lg-eye"
                      onClick={() => setShowPassword((v) => !v)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8Z" /><circle cx="12" cy="12" r="3" /></svg>
                    </button>
                  </div>
                </div>

                <div className="lg-field">
                  <label htmlFor="confirm-password">Confirm password</label>
                  <div className="lg-input-wrap">
                    <input
                      id="confirm-password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      placeholder="Re-enter your new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                  </div>
                </div>

                {error && <p className="lg-error" role="alert">{error}</p>}

                <button type="submit" className="lg-submit" disabled={loading}>
                  {loading ? 'Saving…' : (<>Set new password <span className="lg-arrow">&rarr;</span></>)}
                </button>
              </form>
            </>
          )}
        </div>

        <div className="lg-quote-col">
          <blockquote className="lg-quote">
            &ldquo;A room without books is like a body without a soul.&rdquo;
          </blockquote>
          <cite className="lg-cite">&mdash; Marcus Tullius Cicero</cite>
        </div>
      </main>
    </div>
  )
}
