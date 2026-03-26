import { useState } from 'react';
import { Star, X } from 'lucide-react';
import Button from './Button';

export default function RatingModal({ volunteerName, onSubmit, onClose }) {
    const [rating, setRating] = useState(0);
    const [hover, setHover] = useState(0);
    const [comment, setComment] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        if (rating === 0) return;
        setLoading(true);
        try {
            await onSubmit({ rating, comment });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.4)',
            backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1000, padding: 20
        }}>
            <div className="animate-scaleIn" style={{
                background: 'white',
                borderRadius: 'var(--radius-xl)',
                width: '100%', maxWidth: 420,
                boxShadow: '0 24px 60px rgba(0,0,0,0.15)',
                overflow: 'hidden'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid var(--border)' }}>
                    <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>Rate Volunteer</h3>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                        <X size={20} />
                    </button>
                </div>
                
                <div style={{ padding: '24px' }}>
                    <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 20, textAlign: 'center' }}>
                        How was your experience with <strong>{volunteerName || 'the volunteer'}</strong>?
                    </p>

                    <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 24 }}>
                        {[...Array(5)].map((_, index) => {
                            const val = index + 1;
                            return (
                                <button
                                    key={val}
                                    type="button"
                                    onClick={() => setRating(val)}
                                    onMouseEnter={() => setHover(val)}
                                    onMouseLeave={() => setHover(rating)}
                                    style={{
                                        background: 'none', border: 'none', cursor: 'pointer',
                                        padding: 0, transition: 'transform 0.1s'
                                    }}
                                    className="hover-scale"
                                >
                                    <Star 
                                        size={40} 
                                        color={val <= (hover || rating) ? '#FFD700' : 'var(--border)'} 
                                        fill={val <= (hover || rating) ? '#FFD700' : 'transparent'} 
                                    />
                                </button>
                            );
                        })}
                    </div>

                    <div className="form-group" style={{ marginBottom: 24 }}>
                        <label className="form-label">Feedback (Optional)</label>
                        <textarea 
                            className="form-input" 
                            rows={3}
                            placeholder="Share a few words about their help..."
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                        />
                    </div>

                    <Button 
                        variant="primary" 
                        size="lg" 
                        style={{ width: '100%', justifyContent: 'center' }}
                        disabled={rating === 0 || loading}
                        loading={loading}
                        onClick={handleSubmit}
                    >
                        Submit Rating
                    </Button>
                </div>
            </div>
            <style jsx>{`
                .hover-scale:hover { transform: scale(1.1); }
            `}</style>
        </div>
    );
}
