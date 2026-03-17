import { TrendingUp, CheckCircle2, Brain, Sparkles, MapPin, BarChart3, Star } from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, AreaChart, Area, Legend
} from 'recharts';
import Card from '../../components/common/Card';

const tpStyle = {
    contentStyle: {
        background: 'white', border: '1px solid var(--border)',
        borderRadius: 10, fontFamily: 'Nunito, sans-serif',
        fontSize: 12, boxShadow: '0 4px 16px rgba(0,0,0,0.08)'
    },
    cursor: { fill: 'rgba(255,140,105,0.05)' }
};

export default function AdminAnalytics({ requests = [], volunteers = [], adaptiveData }) {
    const serviceTypeData = {};
    requests.forEach(r => {
        const type = r.service_type || r.serviceType || 'Other';
        serviceTypeData[type] = (serviceTypeData[type] || 0) + 1;
    });
    const serviceChartData = Object.entries(serviceTypeData).map(([name, value]) => ({ name, value }));

    const locationData = {};
    volunteers.forEach(v => {
        if (v.location) locationData[v.location] = (locationData[v.location] || 0) + 1;
    });
    const locationChartData = Object.entries(locationData).map(([name, count]) => ({ name, count }));

    const avgRating = volunteers.length > 0
        ? (volunteers.reduce((a, v) => a + (v.rating || 0), 0) / volunteers.length).toFixed(1)
        : 0;

    const kpis = [
        { label: 'AI Success Rate',   value: `${Math.round((adaptiveData?.successRate || 0) * 100)}%`, icon: TrendingUp,    color: 'coral' },
        { label: 'Requests Closed',   value: adaptiveData?.totalOutcomes || 0,                          icon: CheckCircle2,  color: 'mint' },
        { label: 'Network Rating',    value: `${avgRating} ⭐`,                                          icon: Brain,         color: 'sky' },
        { label: 'Active Volunteers', value: volunteers.filter(v => v.availabilityStatus === 'AVAILABLE').length, icon: Star, color: 'amber' },
    ];

    const matchWeights = [
        { label: 'Availability', weight: 25, color: 'var(--coral)' },
        { label: 'Skill Match',  weight: 25, color: 'var(--mint)' },
        { label: 'Proximity',    weight: 20, color: 'var(--sky)' },
        { label: 'Reliability',  weight: 15, color: 'var(--amber)' },
        { label: 'Acceptance',   weight: 15, color: 'var(--peach)' },
    ];

    return (
        <div className="animate-fadeIn">
            <div className="page-header">
                <h1 className="page-title">Analytics 📊</h1>
                <p className="page-subtitle">Deep insights into system efficiency and AI matching accuracy.</p>
            </div>

            {/* KPIs */}
            <div className="grid-4" style={{ marginBottom: 32 }}>
                {kpis.map((k, i) => (
                    <div key={i} className="stat-card card-interactive">
                        <div className={`stat-icon-wrap ${k.color}`}>
                            <k.icon size={22} />
                        </div>
                        <div>
                            <div className="stat-value">{k.value}</div>
                            <div className="stat-label">{k.label}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Charts */}
            <div className="grid-2" style={{ marginBottom: 28 }}>
                <Card>
                    <div className="card-title" style={{ marginBottom: 24 }}>
                        <Sparkles size={15} style={{ color: 'var(--coral)' }} /> Service Demand
                    </div>
                    {serviceChartData.length > 0 ? (
                        <div style={{ height: 280 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={serviceChartData} layout="vertical">
                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                                    <XAxis type="number" hide />
                                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false}
                                        tick={{ fill: 'var(--text-muted)', fontSize: 11, fontFamily: 'Nunito' }} width={110} />
                                    <Tooltip {...tpStyle} />
                                    <Bar dataKey="value" fill="var(--coral)" radius={[0, 6, 6, 0]} barSize={22} label={{ position: 'right', fill: 'var(--text-muted)', fontSize: 11 }} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className="empty-state" style={{ padding: '40px 0' }}>
                            <div className="empty-icon">📊</div>
                            <p>No request data yet</p>
                        </div>
                    )}
                </Card>

                <Card>
                    <div className="card-title" style={{ marginBottom: 24 }}>
                        <MapPin size={15} style={{ color: 'var(--mint)' }} /> Volunteer Density by Location
                    </div>
                    {locationChartData.length > 0 ? (
                        <div style={{ height: 280 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={locationChartData}>
                                    <defs>
                                        <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%"  stopColor="var(--mint)"  stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="var(--mint)"  stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 11, fontFamily: 'Nunito' }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 11, fontFamily: 'Nunito' }} />
                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                                    <Tooltip {...tpStyle} />
                                    <Area type="monotone" dataKey="count" stroke="var(--mint)" strokeWidth={3} fillOpacity={1} fill="url(#areaGrad)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className="empty-state" style={{ padding: '40px 0' }}>
                            <div className="empty-icon">📍</div>
                            <p>No location data yet</p>
                        </div>
                    )}
                </Card>
            </div>

            {/* AI Weights */}
            <Card>
                <div className="card-title" style={{ marginBottom: 24 }}>
                    <BarChart3 size={15} style={{ color: 'var(--coral)' }} /> Matching Engine Weights
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16 }}>
                    {matchWeights.map(w => (
                        <div key={w.label} style={{ background: 'var(--bg-page)', borderRadius: 12, padding: '16px', border: '1px solid var(--border)' }}>
                            <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>{w.label}</div>
                            <div style={{ fontSize: 28, fontWeight: 900, color: w.color, marginBottom: 10 }}>{w.weight}%</div>
                            <div className="progress-bar-wrap">
                                <div className="progress-bar-fill" style={{ width: `${w.weight}%`, background: w.color }} />
                            </div>
                        </div>
                    ))}
                </div>
                <p style={{ marginTop: 20, fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', fontStyle: 'italic', borderTop: '1px solid var(--border)', paddingTop: 16 }}>
                    The AI engine continuously recalculates these weights based on real-world outcome feedback.
                </p>
            </Card>
        </div>
    );
}
