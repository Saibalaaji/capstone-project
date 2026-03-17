import { useState } from 'react';
import { PlusCircle, Brain, Target, MapPin, Zap, Sparkles, CheckCircle2 } from 'lucide-react';
import { createRequest, assignVolunteer } from '../../services/api';
import { interpretRequest, rankVolunteers, recordOutcome } from '../../services/aiEngine';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';

const SERVICE_TYPES = ['Food Delivery','Medical Assistance','Home Repair','Transportation','Elder Care','Pet Care','Tutoring','Other'];
const LOCATIONS     = ['New York','Los Angeles','Chicago','San Francisco','Houston','Phoenix'];
const URGENCY_LEVELS = [
    { value: 'LOW',    emoji: '🟢', label: 'Low',   bg: '#F0FAF4', border: '#B0DCC0', color: '#2E7A50' },
    { value: 'MEDIUM', emoji: '🟡', label: 'Medium', bg: '#FFF8E8', border: '#FFE080', color: '#996600' },
    { value: 'HIGH',   emoji: '🔴', label: 'High',  bg: '#FFF0F0', border: '#FFCECE', color: '#C05050' },
];

export default function AdminCreateRequest({ volunteers = [], onCreated, showToast }) {
    const [form, setForm] = useState({
        requesterName: '', requesterContact: '', location: '',
        serviceType: '', description: '', urgencyLevel: 'MEDIUM'
    });
    const [nlpResult,      setNlpResult]      = useState(null);
    const [aiRanking,      setAiRanking]      = useState([]);
    const [showRanking,    setShowRanking]    = useState(false);
    const [createdRequest, setCreatedRequest] = useState(null);
    const [loading,        setLoading]        = useState(false);
    const [assigning,      setAssigning]      = useState(null);

    const handleDescriptionChange = (e) => {
        const desc = e.target.value;
        setForm(f => ({ ...f, description: desc }));
        if (desc.length > 15) {
            const result = interpretRequest(desc);
            setNlpResult(result);
            if (result.service_type && !form.serviceType) setForm(f => ({ ...f, serviceType: result.service_type }));
            if (result.urgency_level)                     setForm(f => ({ ...f, urgencyLevel: result.urgency_level }));
            if (result.location && !form.location)        setForm(f => ({ ...f, location: result.location }));
        } else {
            setNlpResult(null);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await createRequest({
                ...form,
                requester_name: form.requesterName,
                requester_contact: form.requesterContact,
                service_type: form.serviceType,
                urgency_level: form.urgencyLevel
            });
            const newRequest = res.data.request;
            setCreatedRequest(newRequest);
            const ranked = rankVolunteers(volunteers, newRequest);
            setAiRanking(ranked);
            setShowRanking(true);
            showToast('Request created! Analyzing best volunteer matches…', 'success');
            onCreated();
        } catch {
            showToast('Failed to submit request', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleAssign = async (requestId, volunteerId, name) => {
        setAssigning(volunteerId);
        try {
            await assignVolunteer(requestId, volunteerId);
            recordOutcome(volunteerId, requestId, 'completed');
            showToast(`✅ ${name} has been assigned!`, 'success');
            setForm({ requesterName:'', requesterContact:'', location:'', serviceType:'', description:'', urgencyLevel:'MEDIUM' });
            setNlpResult(null); setCreatedRequest(null); setShowRanking(false);
            onCreated();
        } catch {
            showToast('Assignment failed', 'error');
        } finally {
            setAssigning(null);
        }
    };

    return (
        <div className="animate-fadeIn">
            <div className="page-header">
                <h1 className="page-title">New Request ✍️</h1>
                <p className="page-subtitle">Create a community request and let AI find the best volunteer match.</p>
            </div>

            <div className="grid-2" style={{ alignItems: 'start' }}>
                {/* ── Form ── */}
                <form onSubmit={handleSubmit}>
                    <Card style={{ marginBottom: 20 }}>
                        <div className="card-title"><PlusCircle size={14} style={{ color: 'var(--coral)' }} /> Requester Info</div>
                        <div className="grid-2" style={{ gap: 16 }}>
                            <div className="form-group">
                                <label className="form-label">Full Name <span className="required">*</span></label>
                                <input className="form-input" placeholder="e.g. Jane Smith" value={form.requesterName}
                                    onChange={e => setForm(f => ({ ...f, requesterName: e.target.value }))} required />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Contact / Email <span className="required">*</span></label>
                                <input className="form-input" placeholder="+1-555-0100 or email" value={form.requesterContact}
                                    onChange={e => setForm(f => ({ ...f, requesterContact: e.target.value }))} required />
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Describe the Need <span className="required">*</span></label>
                            <textarea className="form-input" rows={4} value={form.description}
                                onChange={handleDescriptionChange} required
                                placeholder="Describe what the community member needs — our AI will auto-detect the service type, urgency, and location…" />
                        </div>

                        {/* NLP badge */}
                        {nlpResult && (
                            <div style={{ background: '#F0FAF4', border: '1.5px solid #B0DCC0', borderRadius: 12, padding: '14px 18px', marginBottom: 20 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                                    <Brain size={15} style={{ color: 'var(--mint-dark)' }} />
                                    <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--mint-dark)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                                        AI Inference — {Math.round(nlpResult.confidence * 100)}% confidence
                                    </span>
                                </div>
                                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                    {nlpResult.service_type && <Badge variant="completed">🎯 {nlpResult.service_type}</Badge>}
                                    {nlpResult.urgency_level && <Badge variant={nlpResult.urgency_level}>{nlpResult.urgency_level}</Badge>}
                                    {nlpResult.location && <Badge variant="info">📍 {nlpResult.location}</Badge>}
                                </div>
                            </div>
                        )}
                    </Card>

                    <Card style={{ marginBottom: 20 }}>
                        <div className="card-title"><Zap size={14} style={{ color: 'var(--coral)' }} /> Service Details</div>
                        <div className="grid-2" style={{ gap: 16 }}>
                            <div className="form-group">
                                <label className="form-label">Location <span className="required">*</span></label>
                                <select className="form-input" value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} required>
                                    <option value="">— Select location —</option>
                                    {LOCATIONS.map(l => <option key={l}>{l}</option>)}
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Service Type <span className="required">*</span></label>
                                <select className="form-input" value={form.serviceType} onChange={e => setForm(f => ({ ...f, serviceType: e.target.value }))} required>
                                    <option value="">— Select type —</option>
                                    {SERVICE_TYPES.map(s => <option key={s}>{s}</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Urgency Level</label>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
                                {URGENCY_LEVELS.map(u => (
                                    <button type="button" key={u.value}
                                        onClick={() => setForm(f => ({ ...f, urgencyLevel: u.value }))}
                                        style={{
                                            padding: '12px 8px', borderRadius: 10, textAlign: 'center', cursor: 'pointer',
                                            border: `2px solid ${form.urgencyLevel === u.value ? u.border : 'var(--border)'}`,
                                            background: form.urgencyLevel === u.value ? u.bg : 'white',
                                            color: form.urgencyLevel === u.value ? u.color : 'var(--text-muted)',
                                            fontWeight: form.urgencyLevel === u.value ? 800 : 600,
                                            fontFamily: 'var(--font-body)', transition: 'all 0.15s',
                                        }}>
                                        <div style={{ fontSize: 22, marginBottom: 4 }}>{u.emoji}</div>
                                        <div style={{ fontSize: 12 }}>{u.label}</div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {loading && <div className="progress-bar-wrap" style={{ marginBottom: 12 }}><div className="progress-bar-fill indeterminate" /></div>}
                        <Button type="submit" variant="primary" size="lg" loading={loading} icon={Sparkles} style={{ width: '100%', justifyContent: 'center' }}>
                            Create & Analyze Matches
                        </Button>
                    </Card>
                </form>

                {/* ── AI Ranking Panel ── */}
                <div>
                    <Card>
                        <div className="card-title" style={{ marginBottom: 20 }}>
                            <Target size={14} style={{ color: 'var(--coral)' }} /> AI Volunteer Recommendations
                        </div>
                        {!showRanking ? (
                            <div className="empty-state" style={{ padding: '48px 0' }}>
                                <div className="empty-icon">🤖</div>
                                <h3>Awaiting Request</h3>
                                <p>Fill in the form and submit to see AI-ranked volunteer matches here.</p>
                            </div>
                        ) : aiRanking.length === 0 ? (
                            <div className="empty-state" style={{ padding: '32px 0' }}>
                                <div className="empty-icon">😔</div>
                                <h3>No matches found</h3>
                                <p>No available volunteers match this request right now.</p>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                                {aiRanking.slice(0, 5).map((match, idx) => {
                                    const score = Math.round(match.totalScore * 100);
                                    return (
                                        <div key={match.volunteer.id} style={{
                                            border: `1.5px solid ${idx === 0 ? 'var(--coral-light)' : 'var(--border)'}`,
                                            borderRadius: 14, padding: '16px 18px',
                                            background: idx === 0 ? '#FFF8F5' : 'white',
                                            transition: 'all 0.2s',
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                                                {idx === 0 && (
                                                    <div style={{ position: 'absolute', marginTop: -30, marginLeft: -4 }}>
                                                    </div>
                                                )}
                                                <div className="avatar avatar-sm" style={{ background: `hsl(${idx * 50 + 10}deg 65% 72%)` }}>
                                                    {match.volunteer.name?.[0]}
                                                </div>
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                        <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)' }}>{match.volunteer.name}</span>
                                                        {idx === 0 && <span style={{ fontSize: 10, background: 'var(--coral)', color: 'white', borderRadius: 99, padding: '1px 8px', fontWeight: 800 }}>Best Match</span>}
                                                    </div>
                                                    <div style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', gap: 10 }}>
                                                        <span>⭐ {match.volunteer.rating || 0}</span>
                                                        <span>📍 {match.volunteer.location}</span>
                                                    </div>
                                                </div>
                                                <div style={{ textAlign: 'right' }}>
                                                    <div style={{ fontSize: 20, fontWeight: 900, color: score >= 70 ? 'var(--mint-dark)' : score >= 40 ? 'var(--amber)' : 'var(--text-muted)' }}>{score}%</div>
                                                    <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 700 }}>Match Score</div>
                                                </div>
                                            </div>

                                            {/* Score bar */}
                                            <div className="progress-bar-wrap" style={{ marginBottom: 12 }}>
                                                <div className="progress-bar-fill" style={{
                                                    width: `${score}%`,
                                                    background: score >= 70 ? 'var(--mint)' : score >= 40 ? 'var(--amber)' : 'var(--coral-light)',
                                                }} />
                                            </div>

                                            <Button variant={idx === 0 ? 'primary' : 'outline'} size="sm"
                                                onClick={() => handleAssign(createdRequest.id, match.volunteer.id, match.volunteer.name)}
                                                loading={assigning === match.volunteer.id}
                                                icon={CheckCircle2}
                                                style={{ width: '100%', justifyContent: 'center' }}>
                                                Assign {match.volunteer.name.split(' ')[0]}
                                            </Button>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </Card>
                </div>
            </div>
        </div>
    );
}
