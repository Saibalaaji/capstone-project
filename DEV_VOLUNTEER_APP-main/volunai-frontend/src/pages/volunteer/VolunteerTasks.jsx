import { Bell, Briefcase, CheckCircle2, MapPin, XCircle, Clock } from 'lucide-react';
import TaskCard from '../../components/common/TaskCard';
import Card from '../../components/common/Card';

export default function VolunteerTasks({ tasks, onAccept, onDecline, onComplete, completedCount }) {
    const pending  = tasks.filter(n => !n.is_assigned_to_me);
    const assigned = tasks.filter(n => n.is_assigned_to_me);

    return (
        <div className="animate-fadeIn">
            <div className="page-header">
                <h1 className="page-title">My Tasks 🌿</h1>
                <p className="page-subtitle">Your active assignments and incoming opportunities.</p>
            </div>

            {/* Stats */}
            <div className="grid-3" style={{ marginBottom: 28 }}>
                {[
                    { label: 'Pending Requests', value: pending.length,   color: 'sky',   emoji: '📥' },
                    { label: 'Assigned to Me',   value: assigned.length,  color: 'coral', emoji: '✍️' },
                    { label: 'Total Completed',  value: completedCount,   color: 'mint',  emoji: '✅' },
                ].map((s, i) => (
                    <div key={i} className="stat-card">
                        <div className={`stat-icon-wrap ${s.color}`} style={{ fontSize: 24 }}>{s.emoji}</div>
                        <div>
                            <div className="stat-value">{s.value}</div>
                            <div className="stat-label">{s.label}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Task list */}
            {tasks.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-icon">📭</div>
                    <h3>No Active Tasks</h3>
                    <p>You'll be notified when new requests match your skills or when an admin assigns you.</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {tasks.map((task, i) => (
                        <TaskCard
                            key={task.id || i}
                            task={task}
                            onAccept={onAccept}
                            onDecline={onDecline}
                            onComplete={onComplete}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
