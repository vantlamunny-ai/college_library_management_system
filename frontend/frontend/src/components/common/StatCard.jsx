import { useCountUp } from '../../hooks/useCountUp';
import './common.css';

/**
 * @param {{icon:string, label:string, value:number, sub?:string, tone?:'gold'|'danger'|'warning'|'info',
 *  prefix?:string, animate?:boolean, blocked?:boolean, blockedHint?:string}} props
 */
export function StatCard({ icon, label, value, sub, tone = 'gold', prefix = '', animate = true, blocked = false, blockedHint }) {
  const animated = useCountUp(animate && !blocked ? value : 0);
  const display = animate ? animated : value;

  return (
    <div className="clms-stat-card">
      <div className={`clms-stat-icon ${tone !== 'gold' ? `tone-${tone}` : ''}`}>
        <i className={`ti ${icon}`} />
      </div>
      <div>
        <div className="clms-stat-value">
          {blocked ? '—' : `${prefix}${Number(display).toLocaleString('en-IN')}`}
        </div>
        <div className="clms-stat-label">{label}</div>
        {blocked ? (
          <div className="clms-stat-sub" title={blockedHint}>
            <i className="ti ti-tool" style={{ fontSize: 11, marginRight: 3 }} />
            Pending backend endpoint
          </div>
        ) : (
          sub && <div className="clms-stat-sub">{sub}</div>
        )}
      </div>
    </div>
  );
}
