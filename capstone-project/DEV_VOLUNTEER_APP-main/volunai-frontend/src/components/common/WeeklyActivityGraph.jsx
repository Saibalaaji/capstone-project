import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function WeeklyActivityGraph({ data }) {
    // Default fallback data if empty
    const chartData = data && data.length > 0 ? data : [
        { name: 'Mon', requests: 12 },
        { name: 'Tue', requests: 19 },
        { name: 'Wed', requests: 15 },
        { name: 'Thu', requests: 28 },
        { name: 'Fri', requests: 24 },
        { name: 'Sat', requests: 35 },
        { name: 'Sun', requests: 20 },
    ];

    return (
        <div className="card" style={{ padding: '20px 24px' }}>
            <h3 style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 20 }}>
                Weekly Activity Trends
            </h3>
            
            <div style={{ height: 260, width: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorRequests" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#FFAB8E" stopOpacity={0.4} />
                                <stop offset="95%" stopColor="#FFCBB5" stopOpacity={0.0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis 
                            dataKey="name" 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fontSize: 12, fill: '#94a3b8' }} 
                            dy={10}
                        />
                        <YAxis 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fontSize: 12, fill: '#94a3b8' }} 
                        />
                        <Tooltip 
                            contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', fontWeight: 600, color: '#1e293b' }}
                            itemStyle={{ color: '#FF8C69' }}
                        />
                        <Area 
                            type="monotone" 
                            dataKey="requests" 
                            stroke="#FF8C69" 
                            strokeWidth={3}
                            fillOpacity={1} 
                            fill="url(#colorRequests)" 
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
