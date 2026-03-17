import { Clock, MapPin, Search } from 'lucide-react';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';

export default function VolunteerHistory({ history }) {
    return (
        <div className="animate-fadeIn">
            <div className="page-header">
                <h1 className="page-title">Task History 📖</h1>
                <p className="page-subtitle">Your completed assignments and contribution record.</p>
            </div>

            <Card padding={false}>
                {history.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-icon">📋</div>
                        <h3>No History Yet</h3>
                        <p>Complete your first task to start building your contribution record here.</p>
                    </div>
                ) : (
                    <table className="warm-table">
                        <thead>
                            <tr>
                                <th>Service</th>
                                <th>Requested By</th>
                                <th>Location</th>
                                <th>Urgency</th>
                                <th style={{ textAlign: 'right' }}>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {history.map((t, i) => (
                                <tr key={t.id || i}>
                                    <td>
                                        <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{t.service_type || t.serviceType}</div>
                                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>#{t.id?.toString().slice(-4)}</div>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <div className="avatar avatar-sm" style={{ background: `hsl(${i * 50}deg 60% 70%)` }}>
                                                {(t.requester_name || t.requesterName)?.[0]}
                                            </div>
                                            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>
                                                {t.requester_name || t.requesterName}
                                            </span>
                                        </div>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, color: 'var(--text-muted)' }}>
                                            <MapPin size={12} style={{ color: 'var(--coral)' }} /> {t.location}
                                        </div>
                                    </td>
                                    <td><Badge variant={t.urgency_level}>{t.urgency_level}</Badge></td>
                                    <td style={{ textAlign: 'right' }}>
                                        <Badge variant="completed">{t.status}</Badge>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </Card>
        </div>
    );
}
