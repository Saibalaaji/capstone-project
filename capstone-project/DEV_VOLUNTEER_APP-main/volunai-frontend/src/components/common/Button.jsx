import { Loader2 } from 'lucide-react';

export default function Button({
    children,
    variant = 'primary',
    size = 'md',
    icon: Icon,
    iconRight,
    loading = false,
    disabled = false,
    type = 'button',
    onClick,
    className = '',
    ...props
}) {
    const variantClass = {
        primary: 'btn-primary',
        mint:    'btn-mint',
        outline: 'btn-outline',
        ghost:   'btn-ghost',
        danger:  'btn-danger',
    }[variant] || 'btn-primary';

    const sizeClass = { sm: 'btn-sm', md: '', lg: 'btn-lg', xl: 'btn-xl' }[size] || '';

    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled || loading}
            className={`btn ${variantClass} ${sizeClass} ${className}`}
            {...props}
        >
            {loading ? (
                <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} />
            ) : Icon ? (
                <Icon size={size === 'sm' ? 13 : size === 'lg' ? 18 : 15} />
            ) : null}
            {children}
            {iconRight && !loading && <iconRight size={14} style={{ marginLeft: 2 }} />}
        </button>
    );
}
