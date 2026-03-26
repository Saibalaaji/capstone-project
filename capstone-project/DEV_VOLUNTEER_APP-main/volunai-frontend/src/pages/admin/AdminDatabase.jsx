import { useState, useEffect } from 'react';
import { Database, Edit2, Check, X, Server, Trash2, Plus } from 'lucide-react';
import { getDatabaseTable, updateDatabaseRecord, createDatabaseRecord, deleteDatabaseRecord } from '../../services/api';

const TABLES = [
    { id: 'users', label: 'Users Table' },
    { id: 'volunteers', label: 'Volunteers Table' },
    { id: 'requests', label: 'Assistance Requests Table' },
    { id: 'assignments', label: 'Assignments Table' },
];

export default function AdminDatabase() {
    const [activeTable, setActiveTable] = useState('users');
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [editing, setEditing] = useState(null); // format: { rowId, colKey, value }
    const [isCreating, setIsCreating] = useState(false);
    const [newRowData, setNewRowData] = useState({});
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const loadTable = async (table) => {
        setLoading(true);
        setError('');
        setSuccess('');
        try {
            const res = await getDatabaseTable(table);
            setData(res.data);
            setEditing(null);
            setIsCreating(false);
            setNewRowData({});
        } catch (err) {
            setError(err.response?.data?.error || err.message);
        }
        setLoading(false);
    };

    useEffect(() => {
        loadTable(activeTable);
    }, [activeTable]);

    const handleSave = async (rowId, colKey) => {
        if (!editing) return;
        
        const originalData = [...data];
        
        let formattedValue = editing.value;
        // Basic type inference to prevent sending literal strings to boolean/float columns if JSON parses clean
        if (formattedValue === 'true') formattedValue = true;
        if (formattedValue === 'false') formattedValue = false;
        if (!isNaN(formattedValue) && formattedValue !== '') formattedValue = Number(formattedValue);

        const updatedRow = { ...data.find(r => r.id === rowId), [colKey]: formattedValue };
        setData(data.map(r => r.id === rowId ? updatedRow : r));
        setEditing(null);

        try {
            await updateDatabaseRecord(activeTable, rowId, { [colKey]: formattedValue });
            setSuccess(`Updated Record #${rowId} successfully.`);
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError('Failed to update: ' + (err.response?.data?.error || err.message));
            setData(originalData); // Revert
            setTimeout(() => setError(''), 4000);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm(`Are you sure you want to permanently delete Record #${id}?`)) return;
        try {
            await deleteDatabaseRecord(activeTable, id);
            setData(data.filter(r => r.id !== id));
            setSuccess(`Deleted Record #${id} successfully.`);
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError('Failed to delete: ' + (err.response?.data?.error || err.message));
            setTimeout(() => setError(''), 4000);
        }
    };

    const handleCreateSave = async () => {
        try {
            const payload = {};
            for (const key in newRowData) {
                let val = newRowData[key];
                if (val === 'true') val = true;
                if (val === 'false') val = false;
                if (!isNaN(val) && val !== '') val = Number(val);
                payload[key] = val;
            }

            const res = await createDatabaseRecord(activeTable, payload);
            setData([...data, res.data.record]);
            setIsCreating(false);
            setNewRowData({});
            setSuccess('New record created successfully.');
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError('Failed to create: ' + (err.response?.data?.error || err.message));
            setTimeout(() => setError(''), 4000);
        }
    };

    if (loading && data.length === 0) return <div className="p-8 text-center text-slate-500"><Server className="animate-pulse mx-auto mb-4" /> Loading Database Table...</div>;

    const columns = data.length > 0 ? Object.keys(data[0]).filter(k => k !== 'id') : [];

    return (
        <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto', fontFamily: 'Inter, sans-serif' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
                <div>
                    <h1 style={{ fontSize: '24px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px', color: '#1e293b' }}>
                        <Database color="#4f46e5" /> CVAS Database Explorer
                    </h1>
                    <p style={{ color: '#64748b', marginTop: '4px', fontSize: '14px' }}>Directly inspect and intelligently rewrite structural rows.</p>
                </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
                <button onClick={() => { setIsCreating(true); setNewRowData({}); }} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 16px', borderRadius: '10px', fontWeight: '600', fontSize: '14px', cursor: 'pointer', border: 'none', background: '#10b981', color: '#fff', transition: 'all 0.2s', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)' }}>
                    <Plus size={16} /> New Record
                </button>
                <div style={{ width: '1px', background: '#e2e8f0', margin: '0 4px' }} />
                {TABLES.map(t => (
                    <button 
                        key={t.id}
                        onClick={() => setActiveTable(t.id)}
                        style={{
                            padding: '10px 16px',
                            borderRadius: '10px',
                            fontWeight: '600',
                            fontSize: '14px',
                            cursor: 'pointer',
                            border: activeTable === t.id ? 'none' : '1px solid #e2e8f0',
                            background: activeTable === t.id ? '#4f46e5' : '#fff',
                            color: activeTable === t.id ? '#fff' : '#475569',
                            boxShadow: activeTable === t.id ? '0 4px 12px rgba(79, 70, 229, 0.2)' : 'none',
                            transition: 'all 0.2s'
                        }}
                    >
                        {t.label}
                    </button>
                ))}
            </div>

            {error && <div style={{ background: '#fef2f2', color: '#b91c1c', padding: '12px 16px', borderRadius: '8px', marginBottom: '20px', fontSize: '14px', fontWeight: '500', border: '1px solid #fee2e2' }}>{error}</div>}
            {success && <div style={{ background: '#f0fdf4', color: '#15803d', padding: '12px 16px', borderRadius: '8px', marginBottom: '20px', fontSize: '14px', fontWeight: '500', border: '1px solid #dcfce7' }}>{success}</div>}

            <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ minWidth: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                                <th style={{ padding: '16px', fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', width: '60px' }}>ID</th>
                                {columns.map(col => (
                                    <th key={col} style={{ padding: '16px', fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>{col}</th>
                                ))}
                                <th style={{ padding: '16px', fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'right' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isCreating && (
                                <tr style={{ background: '#f0fdf4', borderBottom: '1px solid #bbf7d0' }}>
                                    <td style={{ padding: '16px', fontSize: '13px', fontWeight: '800', color: '#16a34a' }}>NEW</td>
                                    {columns.map(col => (
                                        <td key={col} style={{ padding: '10px 16px' }}>
                                            <input 
                                                style={{ width: '100%', padding: '6px 8px', border: '1px solid #86efac', borderRadius: '6px', fontSize: '13px', outline: 'none' }}
                                                placeholder={col}
                                                value={newRowData[col] || ''}
                                                onChange={e => setNewRowData({ ...newRowData, [col]: e.target.value })}
                                            />
                                        </td>
                                    ))}
                                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'flex-end' }}>
                                            <button onClick={handleCreateSave} style={{ background: '#16a34a', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', transition: '0.2s' }}>Save</button>
                                            <button onClick={() => setIsCreating(false)} style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', transition: '0.2s' }}>Cancel</button>
                                        </div>
                                    </td>
                                </tr>
                            )}
                            {data.length === 0 && !isCreating ? (
                                <tr><td colSpan={columns.length + 1} style={{ padding: '32px', textAlign: 'center', color: '#94a3b8' }}>No records found in this table.</td></tr>
                            ) : data.map((row, i) => (
                                <tr key={row.id} style={{ borderBottom: i === data.length - 1 ? 'none' : '1px solid #f1f5f9', background: '#fff', transition: 'background 0.2s' }} onMouseOver={e => e.currentTarget.style.background='#f8fafc'} onMouseOut={e => e.currentTarget.style.background='#fff'}>
                                    <td style={{ padding: '16px', fontSize: '13px', fontWeight: '600', color: '#94a3b8' }}>#{row.id}</td>
                                    {columns.map(col => {
                                        const isEditing = editing?.rowId === row.id && editing?.colKey === col;
                                        const val = row[col];
                                        const strVal = val === null ? 'null' : typeof val === 'object' ? JSON.stringify(val) : String(val);

                                        return (
                                            <td key={col} style={{ padding: '16px', fontSize: '13px', color: '#334155', maxWidth: '250px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} onDoubleClick={() => setEditing({ rowId: row.id, colKey: col, value: val === null ? '' : strVal })}>
                                                {isEditing ? (
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                        <input 
                                                            autoFocus
                                                            style={{ width: '100%', padding: '6px 8px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '13px', outline: 'none' }}
                                                            value={editing.value}
                                                            onChange={e => setEditing({ ...editing, value: e.target.value })}
                                                            onKeyDown={e => e.key === 'Enter' && handleSave(row.id, col)}
                                                        />
                                                        <button onClick={() => handleSave(row.id, col)} style={{ background: 'none', border: 'none', color: '#16a34a', cursor: 'pointer', padding: '2px' }}><Check size={16}/></button>
                                                        <button onClick={() => setEditing(null)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '2px' }}><X size={16}/></button>
                                                    </div>
                                                ) : (
                                                    <span style={{ cursor: 'pointer', padding: '2px 4px', margin: '-2px -4px', borderRadius: '4px' }} title="Double click to edit inline">{strVal}</span>
                                                )}
                                            </td>
                                        );
                                    })}
                                    <td style={{ padding: '16px', textAlign: 'right' }}>
                                        <button onClick={() => handleDelete(row.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px', opacity: 0.8, transition: '0.2s' }} title="Permanently Delete Record" onMouseOver={e=>e.currentTarget.style.opacity=1} onMouseOut={e=>e.currentTarget.style.opacity=0.8}>
                                            <Trash2 size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            <div style={{ marginTop: '16px', fontSize: '12px', color: '#94a3b8', textAlign: 'center' }}>💡 Double-click any cell to magically update the live database value inline.</div>
        </div>
    );
}
