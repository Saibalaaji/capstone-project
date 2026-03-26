import { User, Edit2, Save, X, Phone, Mail, MapPin, Briefcase, Calendar, Star, Shield } from 'lucide-react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';

const SKILLS = [
    'Food Delivery', 'Medical Assistance', 'Transportation', 'Elder Care',
    'Home Repair', 'Pet Care', 'Technical Support', 'Tutoring',
    'Counseling', 'Community Outreach', 'Childcare', 'Shopping Assistance'
];
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function VolunteerProfile({
    volunteer, isEditing, setIsEditing,
    editForm, setEditForm, editSkills, setEditSkills,
    editDays, setEditDays, onSave, saving
}) {
    const toggleSkill = s => setEditSkills(p => p.includes(s) ? p.filter(x => x !== s) : [...p, s]);
    const toggleDay   = d => setEditDays(p => p.includes(d) ? p.filter(x => x !== d) : [...p, d]);
    if (!volunteer) return null;

    return (
        <div className="animate-fadeIn">
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                <div>
                    <h1 className="page-title">My Profile 🌱</h1>
                    <p className="page-subtitle">Manage your volunteer identity and availability.</p>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                    {isEditing ? (
                        <>
                            <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)} icon={X}>Cancel</Button>
                            <Button variant="primary" size="sm" onClick={onSave} loading={saving} icon={Save}>Save Changes</Button>
                        </>
                    ) : (
                        <Button variant="outline" size="sm" onClick={() => setIsEditing(true)} icon={Edit2}>Edit Profile</Button>
                    )}
                </div>
            </div>

            <div className="grid-2" style={{ alignItems: 'start' }}>
                {/* Left — identity */}
                <Card>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, textAlign: 'center', marginBottom: 24 }}>
                        <div className="avatar avatar-xl">
                            {volunteer.name?.[0]?.toUpperCase()}
                        </div>
                        <div>
                            <h3 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 6 }}>{volunteer.name}</h3>
                            <Badge variant={volunteer.availabilityStatus}>{volunteer.availabilityStatus}</Badge>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 20 }}>
                        {[
                            { label: 'Rating',      value: `${(volunteer.rating || 0).toFixed(1)} ⭐`, },
                            { label: 'Completed',   value: volunteer.completedTasks || 0, },
                            { label: 'Accept Rate', value: `${Math.round((volunteer.acceptanceRate || 0) * 100)}%`, },
                            { label: 'Reliability', value: `${Math.round((volunteer.reliabilityScore || 0) * 100)}%`, },
                        ].map(s => (
                            <div key={s.label} style={{ background: 'var(--bg-page)', borderRadius: 10, padding: '12px', textAlign: 'center', border: '1px solid var(--border-card)' }}>
                                <div style={{ fontSize: 18, fontWeight: 900, color: 'var(--text-primary)' }}>{s.value}</div>
                                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 2 }}>{s.label}</div>
                            </div>
                        ))}
                    </div>

                    {[
                        { label: 'Email',    value: volunteer.email,    icon: Mail },
                        { label: 'Phone',    value: volunteer.phone,    icon: Phone },
                        { label: 'Location', value: volunteer.location, icon: MapPin },
                    ].map(f => f.value && (
                        <div key={f.label} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderTop: '1px solid var(--border-card)', fontSize: 13, color: 'var(--text-secondary)' }}>
                            <f.icon size={14} style={{ color: 'var(--coral)', flexShrink: 0 }} />
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.value}</span>
                        </div>
                    ))}
                </Card>

                {/* Right — edit form / skills */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                    <Card>
                        <div className="card-title"><User size={14} style={{ color: 'var(--coral)' }} /> Personal Details</div>
                        <div className="grid-2" style={{ gap: 14 }}>
                            {[
                                { label: 'Full Name', field: 'name', type: 'text' },
                                { label: 'Email', field: 'email', type: 'email' },
                                { label: 'Phone', field: 'phone', type: 'text' },
                                { label: 'Location', field: 'location', type: 'text' },
                            ].map(f => (
                                <div key={f.field} className="form-group">
                                    <label className="form-label">{f.label}</label>
                                    {isEditing ? (
                                        <input type={f.type} className="form-input" value={editForm[f.field] || ''} onChange={e => setEditForm(p => ({ ...p, [f.field]: e.target.value }))} />
                                    ) : (
                                        <div style={{ fontSize: 14, color: 'var(--text-primary)', padding: '10px 0', borderBottom: '1px solid var(--border-card)', fontWeight: 500 }}>
                                            {volunteer[f.field] || <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Not set</span>}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </Card>

                    <Card>
                        <div className="card-title"><Briefcase size={14} style={{ color: 'var(--coral)' }} /> Skills</div>
                        <div className="chip-group">
                            {isEditing
                                ? SKILLS.map(s => <span key={s} className={`chip ${editSkills.includes(s) ? 'active' : ''}`} onClick={() => toggleSkill(s)}>{s}</span>)
                                : (volunteer.serviceType || []).length > 0
                                    ? (volunteer.serviceType || []).map(s => <span key={s} className="chip active">{s}</span>)
                                    : <span style={{ fontSize: 13, color: 'var(--text-muted)', fontStyle: 'italic' }}>No skills added yet</span>
                            }
                        </div>
                    </Card>

                    <Card>
                        <div className="card-title"><Calendar size={14} style={{ color: 'var(--mint)' }} /> Available Days</div>
                        <div className="chip-group">
                            {isEditing
                                ? DAYS.map(d => <span key={d} className={`chip ${editDays.includes(d) ? 'active' : ''}`} onClick={() => toggleDay(d)}>{d.slice(0,3)}</span>)
                                : (volunteer.availableDays || []).length > 0
                                    ? (volunteer.availableDays || []).map(d => <span key={d} className="chip active">{d.slice(0,3)}</span>)
                                    : <span style={{ fontSize: 13, color: 'var(--text-muted)', fontStyle: 'italic' }}>No days set yet</span>
                            }
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}
