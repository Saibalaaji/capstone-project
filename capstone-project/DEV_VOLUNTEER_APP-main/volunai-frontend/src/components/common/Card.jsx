export default function Card({ children, className = '', hover = true, padding = true, style }) {
    return (
        <div
            className={`card ${!hover ? '' : ''} ${className}`}
            style={{ padding: padding ? undefined : 0, ...style }}
        >
            {children}
        </div>
    );
}
