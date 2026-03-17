import { PlusCircle, ClipboardList, Zap, MapPin, Phone, User } from 'lucide-react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';

const SERVICE_TYPES = [
    'Food Delivery', 'Medical Assistance', 'Transportation', 'Elder Care',
    'Home Repair', 'Pet Care', 'Technical Support', 'Tutoring',
    'Counseling', 'Community Outreach', 'Shopping Assistance', 'Other'
];

const URGENCY_LEVELS = [
    { value: 'LOW',    emoji: '🟢', label: 'Low',    desc: 'Anytime this week',   border: '#B0DCC0', bg: '#F0FAF4', text: '#2E7A50' },
    { value: 'MEDIUM', emoji: '🟡', label: 'Medium', desc: 'Within 24 hours',     border: '#FFE080', bg: '#FFFBE8', text: '#996600' },
    { value: 'HIGH',   emoji: '🔴', label: 'High',   desc: 'As soon as possible', border: '#FFCECE', bg: '#FFF0F0', text: '#C05050' },
];

export default function CommunityNewRequest({ form, setForm, submitting, submitted, onSubmit, onViewRequests }) {
    const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

    return (
        <div className="animate-fadeIn">
            <div className="page-header">
                <h1 className="page-title">Request Assistance 🌻</h1>
                <p className="page-subtitle">Fill in the details below and we'll connect you with the right volunteer.</p>
            </div>

            {submitted && (
                <div style={{
                    background: '#F0FAF4', border: '1.5px solid #B0DCC0',
                    borderRadius: 14, padding: '20px 24px', marginBottom: 28,
                    display: 'flex', alignItems: 'flex-start', gap: 16,
                }}>
                    <div style={{ fontSize: 40 }}>🎉</div>
                    <div>
                        <h3 style={{ fontSize: 16, fontWeight: 800, color: '#2E7A50', marginBottom: 6 }}>Request Submitted!</h3>
                        <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 12 }}>
                            Your request for <strong>{submitted.service_type}</strong> is being reviewed. Our AI is finding the best volunteer for you!
                        </p>
                        <div style={{ display: 'flex', gap: 8 }}>
                            <Button variant="mint" size="sm" onClick={onViewRequests} icon={ClipboardList}>View My Requests</Button>
                            <Button variant="ghost" size="sm">Submit Another</Button>
                        </div>
                    </div>
                </div>
            )}

            <form onSubmit={onSubmit}>
                <div className="grid-2" style={{ marginBottom: 20 }}>
                    <Card>
                        <div className="card-title"><User size={14} style={{ color: 'var(--coral)' }} /> Your Information</div>
                        {[
                            { name: 'requesterName',    label: 'Full Name',                placeholder: 'e.g. Jane Smith', type: 'text',  required: true },
                            { name: 'requesterContact', label: 'Contact / Email',          placeholder: '+1-555-0100 or email@example.com', type: 'text', required: true },
                            { name: 'location',         label: 'Your Location',            placeholder: 'e.g. Downtown, Mumbai', type: 'text', required: true },
                        ].map(f => (
                            <div key={f.name} className="form-group">
                                <label className="form-label">{f.label} {f.required && <span className="required">*</span>}</label>
                                <input name={f.name} type={f.type} value={form[f.name] || ''} onChange={handleChange} placeholder={f.placeholder} required={f.required} className="form-input" />
                            </div>
                        ))}
                    </Card>

                    <Card>
                        <div className="card-title"><Zap size={14} style={{ color: 'var(--coral)' }} /> Request Details</div>
                        <div className="form-group">
                            <label className="form-label">Service Type <span className="required">*</span></label>
                            <select name="serviceType" value={form.serviceType || ''} onChange={handleChange} required className="form-input">
                                <option value="">— Select a service —</option>
                                {SERVICE_TYPES.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Urgency Level</label>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginTop: 4 }}>
                                {URGENCY_LEVELS.map(u => (
                                    <button
                                        type="button"
                                        key={u.value}
                                        onClick={() => setForm(f => ({ ...f, urgencyLevel: u.value }))}
                                        style={{
                                            padding: '10px 6px', borderRadius: 10, textAlign: 'center', cursor: 'pointer',
                                            border: `2px solid ${form.urgencyLevel === u.value ? u.border : 'var(--border)'}`,
                                            background: form.urgencyLevel === u.value ? u.bg : 'white',
                                            color: form.urgencyLevel === u.value ? u.text : 'var(--text-muted)',
                                            fontWeight: form.urgencyLevel === u.value ? 800 : 500,
                                            transition: 'all 0.15s', fontFamily: 'var(--font-body)',
                                        }}
                                    >
                                        <div style={{ fontSize: 22, marginBottom: 4 }}>{u.emoji}</div>
                                        <div style={{ fontSize: 12 }}>{u.label}</div>
                                        <div style={{ fontSize: 10, marginTop: 2, opacity: 0.8 }}>{u.desc}</div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </Card>
                </div>

                <Card>
                    <div className="card-title"><ClipboardList size={14} style={{ color: 'var(--coral)' }} /> Describe Your Situation</div>
                    <div className="form-group">
                        <textarea
                            name="description" value={form.description || ''} onChange={handleChange}
                            className="form-input" rows={5}
                            placeholder="Describe what kind of help you need, any special requirements, time preferences… The more detail you share, the better we can help you."
                        />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <Button type="submit" variant="primary" size="lg" loading={submitting} icon={Zap}>Submit Request</Button>
                    </div>
                </Card>

                {/* Feature pills */}
                <div className="grid-3" style={{ marginTop: 20 }}>
                    {[
                        { emoji: '🤖', title: 'AI Matching', desc: 'Instantly matched to the right volunteer' },
                        { emoji: '⚡', title: 'Fast Response', desc: 'Volunteers respond within minutes' },
                        { emoji: '🔒', title: 'Trusted & Safe', desc: 'All volunteers are verified and rated' },
                    ].map((c, i) => (
                        <div key={i} style={{ background: 'white', border: '1px solid var(--border-card)', borderRadius: 14, padding: '16px 20px', textAlign: 'center', boxShadow: 'var(--shadow-xs)' }}>
                            <div style={{ fontSize: 32, marginBottom: 8 }}>{c.emoji}</div>
                            <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 4 }}>{c.title}</div>
                            <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>{c.desc}</div>
                        </div>
                    ))}
                </div>
            </form>
        </div>
    );
}
