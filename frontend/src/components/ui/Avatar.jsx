import './Avatar.css'

// SVG avatares por defecto según sexo
const AvatarMale = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="40" cy="40" r="40" fill="var(--color-bg-elevated)" />
    {/* Cabeza */}
    <circle cx="40" cy="28" r="13" fill="var(--color-primary)" />
    {/* Cuerpo */}
    <path d="M18 72c0-12.15 9.85-22 22-22s22 9.85 22 22" fill="var(--color-primary)" />
  </svg>
)

const AvatarFemale = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="40" cy="40" r="40" fill="var(--color-bg-elevated)" />
    {/* Cabeza */}
    <circle cx="40" cy="28" r="13" fill="var(--color-primary-light)" />
    {/* Pelo */}
    <path d="M27 26c0-7.18 5.82-13 13-13s13 5.82 13 13c0 2-.44 3.9-1.22 5.6C50 28 47 26 40 26s-10 2-11.78 5.6A12.95 12.95 0 0127 26z" fill="var(--color-primary)" />
    {/* Cuerpo con falda */}
    <path d="M26 72c0-8 4-14 8-17l6 10 6-10c4 3 8 9 8 17H26z" fill="var(--color-primary-light)" />
  </svg>
)

const AvatarUndisclosed = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="40" cy="40" r="40" fill="var(--color-bg-elevated)" />
    {/* Cabeza */}
    <circle cx="40" cy="28" r="13" fill="var(--color-text-muted)" />
    {/* Cuerpo */}
    <path d="M18 72c0-12.15 9.85-22 22-22s22 9.85 22 22" fill="var(--color-text-muted)" />
  </svg>
)

export function Avatar({ src, sex, size = 80, onClick, editable = false }) {
  const baseUrl = import.meta.env.VITE_API_URL?.replace(/\/api$/, '') || ''

  const DefaultAvatar = () => {
    if (sex === 'female') return <AvatarFemale size={size} />
    if (sex === 'male')   return <AvatarMale size={size} />
    return <AvatarUndisclosed size={size} />
  }

  return (
    <div
      className={`avatar ${editable ? 'avatar--editable' : ''}`}
      style={{ width: size, height: size }}
      onClick={onClick}
    >
      {src
        ? <img src={`${baseUrl}/uploads/${src}`} alt="Avatar" style={{ width: size, height: size }} />
        : <DefaultAvatar />
      }
      {editable && (
        <div className="avatar-overlay">
          <span className="caption" style={{ color: 'var(--color-text)' }}>Cambiar</span>
        </div>
      )}
    </div>
  )
}
