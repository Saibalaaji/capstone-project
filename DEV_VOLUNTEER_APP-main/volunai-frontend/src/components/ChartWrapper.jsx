import { Suspense, lazy } from 'react';

// Dynamically import recharts ONLY when this wrapper mounts
const LazyRecharts = lazy(() => import('../components/LazyCharts').then(module => {
    // React.lazy needs a default export, so we create a simple wrapper component
    // that accepts which chart type to render as a prop
    return {
        default: ({ renderChart }) => {
            return renderChart(module);
        }
    }
}));

export default function ChartWrapper({ children, height = 220 }) {
    return (
        <div style={{ height, width: '100%' }}>
            <Suspense fallback={<div className="skeleton" style={{ height: '100%', borderRadius: 8 }} />}>
                <LazyRecharts renderChart={children} />
            </Suspense>
        </div>
    );
}

// ── Usage inside AdminDashboard.jsx ──
/* 
import ChartWrapper from '../components/ChartWrapper';

// Later in JSX:
<ChartWrapper height={220}>
    {(Recharts) => (
        <Recharts.ResponsiveContainer width="100%" height="100%">
            <Recharts.PieChart>
                <Recharts.Pie data={statusData} cx="50%" cy="50%" outerRadius={80} dataKey="value">
                    <Recharts.Cell fill="#8b5cf6" />
                </Recharts.Pie>
                <Recharts.Tooltip />
            </Recharts.PieChart>
        </Recharts.ResponsiveContainer>
    )}
</ChartWrapper>
*/
