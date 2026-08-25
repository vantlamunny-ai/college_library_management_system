import { useNavigate } from 'react-router-dom'
import './StatusPage.css'

/** Shared shell for 403/404 — themed to match the rest of the app. */
export function StatusPage({ code, title, message }) {
  const navigate = useNavigate()
  return (
    <div className="status-page">
      <div className="status-card">
        <div className="status-code">{code}</div>
        <h1>{title}</h1>
        <p>{message}</p>
        <button className="clms-btn clms-btn-primary" onClick={() => navigate('/')}>
          <i className="ti ti-home" /> Back to home
        </button>
      </div>
    </div>
  )
}
