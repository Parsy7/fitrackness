export function FormGroup({ label, error, children }) {
  return (
    <div className="form-group">
      {label && <label className="form-label">{label}</label>}
      {children}
      {error && <span className="form-error">{error}</span>}
    </div>
  )
}

export function Input({ className = '', ...props }) {
  return <input className={`input ${className}`} {...props} />
}

export function Textarea({ className = '', ...props }) {
  return <textarea className={`input ${className}`} {...props} />
}

export function Select({ children, className = '', ...props }) {
  return (
    <select className={`select ${className}`} {...props}>
      {children}
    </select>
  )
}
