export default function Badge({ children, variant = 'pending', className = '' }) {
    const cls = {
        high:      'badge-high',
        urgent:    'badge-urgent',
        HIGH:      'badge-high',
        medium:    'badge-medium',
        MEDIUM:    'badge-medium',
        low:       'badge-low',
        LOW:       'badge-low',
        pending:   'badge-pending',
        PENDING:   'badge-pending',
        assigned:  'badge-assigned',
        ASSIGNED:  'badge-assigned',
        completed: 'badge-completed',
        COMPLETED: 'badge-completed',
        success:   'badge-success',
        available: 'badge-available',
        AVAILABLE: 'badge-available',
        busy:      'badge-busy',
        BUSY:      'badge-busy',
        inactive:  'badge-inactive',
        INACTIVE:  'badge-inactive',
        info:      'badge-assigned',
        error:     'badge-high',
        outline:   '',
    }[variant] || 'badge-pending';

    return (
        <span className={`badge ${cls} ${className}`}>{children}</span>
    );
}
