import { MapPin, Clock, AlertCircle, CheckCircle2 } from 'lucide-react';
import Badge from './Badge';
import Button from './Button';

export default function TaskCard({ task, onAccept, onDecline, onComplete, showActions = true }) {
    if (!task) return null;
    const urgency = (task.urgency_level || task.urgencyLevel || 'LOW').toUpperCase();
    const urgencyClass = { HIGH: 'urgency-high', MEDIUM: 'urgency-medium', LOW: 'urgency-low' }[urgency] || 'urgency-low';
    const service = task.service_type || task.serviceType || 'Service Request';
    const requester = task.requester_name || task.requesterName || '—';
    const status = task.status || 'PENDING';

    return (
        <div className={`task-card ${urgencyClass} animate-fadeIn`}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
                <div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 4 }}>
                        {service}
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>
                        Requested by <strong>{requester}</strong>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    <Badge variant={urgency}>{urgency}</Badge>
                    <Badge variant={status}>{status}</Badge>
                    {task.is_assigned_to_me && (
                        <Badge variant="assigned">Assigned to you</Badge>
                    )}
                </div>
            </div>

            {task.description && (
                <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 14, lineHeight: 1.6, fontStyle: 'italic' }}>
                    "{task.description}"
                </p>
            )}

            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 12, color: 'var(--text-muted)', marginBottom: showActions ? 16 : 0, fontWeight: 600 }}>
                {task.location && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <MapPin size={13} style={{ color: 'var(--coral)' }} /> {task.location}
                    </span>
                )}
                {task.estimated_time && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <Clock size={13} style={{ color: 'var(--mint)' }} /> {task.estimated_time}
                    </span>
                )}
            </div>

            {showActions && (
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {task.is_assigned_to_me && status === 'ASSIGNED' ? (
                        <Button variant="mint" size="sm" onClick={() => onComplete?.(task.id)} icon={CheckCircle2}>
                            Mark Complete
                        </Button>
                    ) : task.can_accept ? (
                        <>
                            <Button variant="mint" size="sm" onClick={() => onAccept?.(task.id)} icon={CheckCircle2}>
                                Accept
                            </Button>
                            <Button variant="danger" size="sm" onClick={() => onDecline?.(task.id)}>
                                Decline
                            </Button>
                        </>
                    ) : (
                        <span style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic' }}>
                            {status === 'ASSIGNED' ? 'Assigned to another volunteer' : status}
                        </span>
                    )}
                </div>
            )}
        </div>
    );
}
