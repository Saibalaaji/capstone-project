import { useState, useEffect, useCallback } from 'react';
import {
    Brain, Zap, CheckCircle2, RefreshCw,
    MapPin, Target, Award, AlertTriangle, ChevronDown, Send, Users
} from 'lucide-react';
import { getRequests, getVolunteers, assignVolunteer } from '../../services/api';
import { rankVolunteers } from '../../services/aiEngine';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';

/* ── Score breakdown bar ── */
function ScoreBar({ label, score, color }) {
    const pct = Math.round(score * 100);
    return (
        <div style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</span>
                <span style={{ fontSize: 12, fontWeight: 900, color }}>{pct}%</span>
            </div>
            <div className="progress-bar-wrap">
                <div className="progress-bar-fill" style={{ width: `${pct}%`, background: color }} />
            </div>
        </div>
    );
}

/* ── Single volunteer match card ── */
function MatchCard({ match, rank, onAssign, assigning }) {
    const [expanded, setExpanded] = useState(false);
    const v     = match.volunteer;
    const score = Math.round(match.totalScore * 100);
    const bd    = match.breakdown;
    const scoreColor = score >= 70 ? 'var(--mint-dark)' : score >= 40 ? 'var(--amber)' : 'var(--rose)';

    return (
        <div style={{
            border: `1.5px solid ${rank === 1 ? 'var(--coral-light)' : 'var(--border)'}`,
            borderRadius: 14, overflow: 'hidden', marginBottom: 12,
            background: rank === 1 ? '#FFF8F5' : 'white',
            transition: 'box-shadow 0.2s',
        }}
            onMouseEnter={e => e.currentTarget.style.boxShadow = 'var(--shadow-md)'}
            onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
        >
            {rank === 1 && (
                <div style={{ background: 'linear-gradient(90deg, var(--coral), var(--peach))', padding: '4px 14px', fontSize: 11, fontWeight: 900, color: 'white', textAlign: 'right' }}>
                    🏆 Top AI Match
                </div>
            )}
            <div style={{ padding: '16px 20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
                    <div className="avatar avatar-md" style={{ background: `hsl(${rank * 55 + 10}deg 65% 70%)` }}>
                        {v.name?.[0]}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary)' }}>#{rank} {v.name}</div>
                        <div style={{ display: 'flex', gap: 12, fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                            <span><MapPin size={10} style={{ verticalAlign: 'middle' }} /> {v.location}</span>
                            <span>⭐ {v.rating || 0} Rating</span>
                        </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 26, fontWeight: 900, color: scoreColor, lineHeight: 1 }}>{score}%</div>
                        <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 700 }}>Match Score</div>
                    </div>
                    <Button variant={rank === 1 ? 'primary' : 'outline'} size="sm" icon={Send}
                        onClick={() => onAssign(v.id, v.name)}
                        loading={assigning === v.id}
                        style={{ whiteSpace: 'nowrap' }}>
                        Assign
                    </Button>
                </div>

                {/* Score bar */}
                <div className="progress-bar-wrap" style={{ marginBottom: 10 }}>
                    <div className="progress-bar-fill" style={{ width: `${score}%`, background: scoreColor }} />
                </div>

                {/* Expand breakdown */}
                <button
                    type="button"
                    onClick={() => setExpanded(!expanded)}
                    style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        fontSize: 12, fontWeight: 700, color: 'var(--text-muted)',
                        display: 'flex', alignItems: 'center', gap: 4, padding: '4px 0',
                        transition: 'color 0.15s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.color = 'var(--coral-dark)'}
                    onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
                >
                    <ChevronDown size={13} style={{ transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                    {expanded ? 'Hide breakdown' : 'Show AI breakdown'}
                </button>

                {expanded && bd && (
                    <div style={{ marginTop: 14, padding: '14px 16px', background: 'var(--bg-page)', borderRadius: 10, border: '1px solid var(--border)' }}>
                        <div className="grid-2" style={{ gap: 16 }}>
                            <ScoreBar label="Skill Relevance"       score={bd.skillMatch?.score   || 0} color="var(--coral)" />
                            <ScoreBar label="Availability"          score={bd.availability?.score  || 0} color="var(--mint)" />
                            <ScoreBar label="Proximity"             score={bd.proximity?.score     || 0} color="var(--sky)" />
                            <ScoreBar label="Historical Reliability" score={bd.reliability?.score  || 0} color="var(--amber)" />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

/* ── Main AdminMatching page ── */
export default function AdminMatching() {
    const [pendingRequests, setPendingRequests] = useState([]);
    const [volunteers,      setVolunteers]      = useState([]);
    const [loading,         setLoading]         = useState(false);
    const [expandedReq,     setExpandedReq]     = useState(null);
    const [rankings,        setRankings]        = useState({});
    const [assigning,       setAssigning]       = useState(null);
    const [toast,           setToast]           = useState(null);

    function showToast(msg, type = 'info') {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 4000);
    }

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const [rRes, vRes] = await Promise.all([getRequests(), getVolunteers()]);
            const pending = rRes.data.filter(r => r.status === 'PENDING');
            setPendingRequests(pending);
            setVolunteers(vRes.data);

            const newRankings = {};
            pending.forEach(req => {
                const reqForEngine = {
                    location: req.location,
                    serviceType: req.service_type,
                    urgencyLevel: req.urgency_level,
                };
                const vForEngine = vRes.data.map(v => ({
                    ...v,
                    serviceType: v.serviceType || v.service_type || [],
                    availableDays: v.availableDays || v.available_days || [],
                    rating: v.rating || 0,
                    active: v.active !== false,
                    location: v.location || '',
                }));
                newRankings[req.id] = rankVolunteers(vForEngine, reqForEngine);
            });
            setRankings(newRankings);
        } catch {
            showToast('Failed to load data', 'error');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { loadData(); }, [loadData]);

    const handleAssign = async (requestId, volunteerId, volunteerName) => {
        setAssigning(volunteerId);
        try {
            await assignVolunteer(requestId, volunteerId);
            setPendingRequests(rs => rs.filter(r => r.id !== requestId));
            if (expandedReq === requestId) setExpandedReq(null);
            showToast(`✅ ${volunteerName} assigned successfully!`, 'success');
        } catch {
            showToast('Assignment failed', 'error');
        } finally {
            setAssigning(null);
        }
    };

    const avgConfidence = pendingRequests.length > 0
        ? Math.round((Object.values(rankings).reduce((s, r) => s + (r[0]?.totalScore || 0), 0) / pendingRequests.length) * 100) + '%'
        : '—';

    const WEIGHTS = [
        { label: 'Skill Match',  pct: 25, color: 'var(--coral)' },
        { label: 'Availability', pct: 25, color: 'var(--mint)' },
        { label: 'Proximity',    pct: 20, color: 'var(--sky)' },
        { label: 'Reliability',  pct: 15, color: 'var(--amber)' },
        { label: 'Acceptance',   pct: 15, color: 'var(--peach)' },
    ];

    return (
        <div className="animate-fadeIn">
            {/* Header */}
            <div className="page-header" style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                <div>
                    <h1 className="page-title">AI Matching Engine 🤖</h1>
                    <p className="page-subtitle">Multi-factor intelligent scoring for pending community requests.</p>
                </div>
                <Button variant="outline" icon={RefreshCw} onClick={loadData} loading={loading}>Recalculate</Button>
            </div>

            {/* KPI strip */}
            <div className="grid-3" style={{ marginBottom: 24 }}>
                {[
                    { icon: Target,       label: 'Pending Requests',    value: pendingRequests.length,                              color: 'coral' },
                    { icon: Users,        label: 'Available Volunteers', value: volunteers.filter(v => v.active !== false).length,   color: 'mint'  },
                    { icon: Zap,          label: 'Avg Match Confidence', value: avgConfidence,                                       color: 'amber' },
                ].map((s, i) => (
                    <div key={i} className="stat-card card-interactive">
                        <div className={`stat-icon-wrap ${s.color}`}><s.icon size={22} /></div>
                        <div>
                            <div className="stat-value">{s.value}</div>
                            <div className="stat-label">{s.label}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* AI weights info bar */}
            <Card style={{ marginBottom: 24 }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20, alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Brain size={15} style={{ color: 'var(--coral)' }} />
                        <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-primary)' }}>Scoring Weights:</span>
                    </div>
                    {WEIGHTS.map(w => (
                        <div key={w.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <div style={{ width: 10, height: 10, borderRadius: '50%', background: w.color, flexShrink: 0 }} />
                            <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>{w.label}</span>
                            <span style={{ fontSize: 12, fontWeight: 900, color: 'var(--text-primary)' }}>{w.pct}%</span>
                        </div>
                    ))}
                </div>
            </Card>

            {/* Request list */}
            {loading ? (
                <div style={{ textAlign: 'center', padding: '60px 0' }}>
                    <div style={{ fontSize: 48, marginBottom: 12 }}>🤖</div>
                    <div className="progress-bar-wrap" style={{ maxWidth: 300, margin: '0 auto' }}>
                        <div className="progress-bar-fill indeterminate" />
                    </div>
                    <p style={{ marginTop: 12, color: 'var(--text-muted)', fontWeight: 700, fontSize: 14 }}>Analyzing constraints…</p>
                </div>
            ) : pendingRequests.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-icon">🎉</div>
                    <h3>All Clear!</h3>
                    <p>All community requests have been matched and assigned.</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {pendingRequests.map(req => {
                        const ranked   = rankings[req.id] || [];
                        const topScore = Math.round((ranked[0]?.totalScore || 0) * 100);
                        const isOpen   = expandedReq === req.id;

                        return (
                            <Card key={req.id} style={{ padding: 0, overflow: 'hidden' }}>
                                {/* Accordion header */}
                                <div
                                    onClick={() => setExpandedReq(isOpen ? null : req.id)}
                                    style={{
                                        padding: '18px 24px', cursor: 'pointer',
                                        display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap',
                                        background: isOpen ? 'var(--bg-hover)' : 'white',
                                        borderBottom: isOpen ? '1px solid var(--border)' : 'none',
                                        transition: 'background 0.15s',
                                    }}
                                >
                                    <div style={{ flex: 1, minWidth: 200 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                                            <span style={{ fontSize: 12, fontWeight: 900, color: 'var(--coral-dark)', background: 'var(--bg-active)', padding: '2px 8px', borderRadius: 99 }}>
                                                #{req.id}
                                            </span>
                                            <span style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary)' }}>{req.service_type}</span>
                                            <Badge variant={req.urgency_level === 'HIGH' ? 'HIGH' : req.urgency_level === 'MEDIUM' ? 'MEDIUM' : 'LOW'}>
                                                {req.urgency_level}
                                            </Badge>
                                        </div>
                                        <div style={{ display: 'flex', gap: 14, fontSize: 12, color: 'var(--text-muted)' }}>
                                            <span>📍 {req.location}</span>
                                            <span>👤 {req.requester_name}</span>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                                        <div style={{ textAlign: 'right' }}>
                                            <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700 }}>{ranked.length} candidates</div>
                                            <div style={{ fontSize: 18, fontWeight: 900, color: topScore >= 70 ? 'var(--mint-dark)' : 'var(--amber)' }}>
                                                Best: {topScore}%
                                            </div>
                                        </div>
                                        <ChevronDown size={18} style={{
                                            color: 'var(--text-muted)',
                                            transform: isOpen ? 'rotate(180deg)' : 'none',
                                            transition: 'transform 0.2s',
                                        }} />
                                    </div>
                                </div>

                                {/* Accordion body */}
                                {isOpen && (
                                    <div style={{ padding: '24px', background: 'var(--bg-page)' }} className="animate-fadeIn">
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
                                            <Award size={15} style={{ color: 'var(--coral)' }} />
                                            <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                                                AI-Ranked Candidates (Top 5)
                                            </span>
                                        </div>
                                        {ranked.length === 0 ? (
                                            <div className="empty-state" style={{ padding: '24px 0' }}>
                                                <div className="empty-icon">😔</div>
                                                <p>No viable volunteers matched this request.</p>
                                            </div>
                                        ) : (
                                            ranked.slice(0, 5).map((match, idx) => (
                                                <MatchCard
                                                    key={match.volunteer.id}
                                                    match={match}
                                                    rank={idx + 1}
                                                    assigning={assigning}
                                                    onAssign={(vid, vname) => handleAssign(req.id, vid, vname)}
                                                />
                                            ))
                                        )}
                                    </div>
                                )}
                            </Card>
                        );
                    })}
                </div>
            )}

            {/* Warm toast */}
            {toast && (
                <div className="toast-container">
                    <div className={`toast ${toast.type}`}>
                        {toast.type === 'success' ? '✅' : toast.type === 'error' ? '⚠️' : 'ℹ️'} {toast.msg}
                    </div>
                </div>
            )}
        </div>
    );
}
