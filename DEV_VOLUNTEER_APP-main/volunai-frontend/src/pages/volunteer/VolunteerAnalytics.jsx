import { TrendingUp, Star, CheckCircle2, Shield, Award } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import Card from '../../components/common/Card';

export default function VolunteerAnalytics({ volunteer, taskHistory, stats }) {
    if (!volunteer) return null;

    const pieData = [
        { name: 'Completed', value: stats.completed || 1, color: '#52C788' },
        { name: 'Active',    value: stats.active,          color: '#FF8C69' },
        { name: 'Pending',   value: stats.pending,         color: '#7CB9E8' },
    ].filter(d => d.value > 0);

    const serviceBreakdown = {};
    taskHistory.forEach(t => {
        const key = (t.service_type || t.serviceType || 'Other').split(' ')[0];
        serviceBreakdown[key] = (serviceBreakdown[key] || 0) + 1;
    });
    const barData = Object.entries(serviceBreakdown).map(([name, count]) => ({ name, count }));

    const tpStyle = {
        contentStyle: { background: 'white', border: '1px solid var(--border)', borderRadius: 10, fontFamily: 'Nunito, sans-serif', fontSize: 13, boxShadow: '0 4px 16px rgba(0,0,0,0.08)' },
    };

    return (
        <div className="animate-fadeIn">
            <div className="page-header">
                <h1 className="page-title">My Analytics 📊</h1>
                <p className="page-subtitle">Your volunteer performance and contribution metrics.</p>
            </div>

            {/* KPIs */}
            <div className="grid-4" style={{ marginBottom: 28 }}>
                {[
                    { label: 'Avg Rating',    value: `${(volunteer.rating || 0).toFixed(1)} ⭐`, color: 'amber' },
                    { label: 'Accept Rate',   value: `${Math.round((volunteer.acceptanceRate || 0) * 100)}%`, color: 'mint' },
                    { label: 'Reliability',   value: `${Math.round((volunteer.reliabilityScore || 0) * 100)}%`, color: 'sky' },
                    { label: 'Total Impact',  value: volunteer.completedTasks || 0,              color: 'coral' },
                ].map((s, i) => (
                    <div key={i} className="stat-card" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 8 }}>
                        <div className={`stat-icon-wrap ${s.color}`}>
                            {i === 0 ? <Star size={22} /> : i === 1 ? <CheckCircle2 size={22} /> : i === 2 ? <Shield size={22} /> : <Award size={22} />}
                        </div>
                        <div>
                            <div className="stat-value" style={{ fontSize: 22 }}>{s.value}</div>
                            <div className="stat-label">{s.label}</div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid-2">
                <Card>
                    <div className="card-title" style={{ marginBottom: 20 }}>Task Distribution</div>
                    <div style={{ height: 260 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={pieData} cx="50%" cy="50%" innerRadius={65} outerRadius={95} dataKey="value" paddingAngle={6} stroke="none">
                                    {pieData.map((e, i) => <Cell key={i} fill={e.color} />)}
                                </Pie>
                                <Tooltip {...tpStyle} />
                                <Legend iconType="circle" />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </Card>

                <Card>
                    <div className="card-title" style={{ marginBottom: 20 }}>By Service Type</div>
                    {barData.length > 0 ? (
                        <div style={{ height: 260 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={barData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#F0E8E0" vertical={false} />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 11, fontFamily: 'Nunito' }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 11, fontFamily: 'Nunito' }} />
                                    <Tooltip {...tpStyle} />
                                    <Bar dataKey="count" fill="var(--coral)" radius={[6, 6, 0, 0]} barSize={36} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className="empty-state" style={{ paddingTop: 40 }}>
                            <p>Complete tasks to see your specialization data.</p>
                        </div>
                    )}
                </Card>
            </div>
        </div>
    );
}
