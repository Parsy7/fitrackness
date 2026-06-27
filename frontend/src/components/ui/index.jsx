export function Card({ variant, children, className = '', onClick, ...props }) {
  const cls = ['card', variant ? `card--${variant}` : '', className].filter(Boolean).join(' ')
  return <div className={cls} onClick={onClick} style={onClick ? { cursor: 'pointer' } : {}} {...props}>{children}</div>
}

export function Pill({ variant = 'muted', children, className = '' }) {
  return <span className={`pill pill-${variant} ${className}`}>{children}</span>
}

export function Spinner({ size = 24 }) {
  return <div className="spinner" style={{ width: size, height: size }} />
}

export function LoadingPage() {
  return <div className="loading-page"><Spinner size={32} /></div>
}

export function EmptyState({ icon, title, description, action }) {
  return (
    <div className="empty-state">
      {icon && <div>{icon}</div>}
      <div className="col" style={{ alignItems: 'center' }}>
        <p className="subtitle">{title}</p>
        {description && <p className="caption">{description}</p>}
      </div>
      {action}
    </div>
  )
}

export function Alert({ type = 'error', children }) {
  return <div className={`alert alert-${type}`}>{children}</div>
}

export function Divider() {
  return <div className="divider" />
}

export function StatBox({ value, label }) {
  return (
    <div className="stat-box">
      <span className="stat-value">{value}</span>
      <span className="stat-label">{label}</span>
    </div>
  )
}
