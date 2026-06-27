export function Button({ variant = 'primary', size, full, children, className = '', ...props }) {
  const cls = [
    'btn',
    `btn-${variant}`,
    size  ? `btn--${size}` : '',
    full  ? 'btn--full'    : '',
    className,
  ].filter(Boolean).join(' ')

  return <button className={cls} {...props}>{children}</button>
}
