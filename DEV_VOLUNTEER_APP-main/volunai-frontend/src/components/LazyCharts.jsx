/**
 * LazyCharts.jsx
 *
 * Re-exports every Recharts symbol used across the app through a single
 * module boundary.  Because App.jsx imports dashboards with React.lazy(),
 * Rollup will place this entire file (+ recharts) in the "charts" chunk
 * defined in vite.config.js.
 *
 * Usage inside a dashboard:
 *   const { BarChart, Bar, … } = await import('../components/LazyCharts');
 *   // or inside a lazy sub-component
 */
export {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    Radar,
    AreaChart,
    Area,
    LineChart,
    Line,
} from 'recharts';
