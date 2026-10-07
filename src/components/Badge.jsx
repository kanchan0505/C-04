export default function Badge({ variant = 'info', children }) {
  const base = 'badge';
  const variantClass = {
    success: 'badge-success',
    warning: 'badge-warning',
    danger: 'badge-danger',
    info: 'badge-info',
  };

  return (
    <span className={`${base} ${variantClass[variant] || variantClass.info}`}>
      {children}
    </span>
  );
}
