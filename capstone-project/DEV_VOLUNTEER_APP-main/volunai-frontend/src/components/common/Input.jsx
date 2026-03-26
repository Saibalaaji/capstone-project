export default function Input({
    label,
    icon: Icon,
    required = false,
    hint,
    error,
    className = '',
    ...props
}) {
    return (
        <div className="form-group">
            {label && (
                <label className="form-label">
                    {Icon && <Icon size={13} />}
                    {label}
                    {required && <span className="required">*</span>}
                </label>
            )}
            <div className="input-wrapper" style={{ position: 'relative' }}>
                {Icon && !label && (
                    <span className="input-icon" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }}>
                        <Icon size={15} />
                    </span>
                )}
                <input
                    className={`form-input ${Icon && !label ? 'with-icon' : ''} ${error ? 'border-rose-400' : ''} ${className}`}
                    {...props}
                />
            </div>
            {hint && !error && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{hint}</div>}
            {error && <div style={{ fontSize: 12, color: '#C05050', marginTop: 2 }}>{error}</div>}
        </div>
    );
}
