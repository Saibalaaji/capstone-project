import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, Heart, CheckCircle2 } from 'lucide-react';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import Input from '../../components/common/Input';

export default function PasswordResetPage() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        
        // Simulate API call
        setTimeout(() => {
            setLoading(false);
            setSubmitted(true);
        }, 1500);
    };

    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 relative overflow-hidden">
            {/* Ambient Background */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-600/10 blur-[120px] rounded-full pointer-events-none" />

            <div className="relative w-full max-w-lg">
                <div className="text-center mb-10">
                    <Link to="/" className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-indigo-600 text-white mb-6 shadow-2xl shadow-indigo-500/20 transform -rotate-6">
                        <Heart className="w-10 h-10" fill="currentColor" />
                    </Link>
                    <h1 className="text-3xl font-black text-white tracking-tight mb-2 italic">Reset Password</h1>
                    <p className="text-slate-400 font-medium">We'll send you a link to get back into your account</p>
                </div>

                <Card padding="loose" className="border-white/5">
                    {!submitted ? (
                        <form onSubmit={handleSubmit} className="space-y-6 animate-fadeIn">
                            <Input
                                label="Email Address"
                                type="email"
                                id="email"
                                placeholder="your@email.com"
                                icon={Mail}
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                required
                            />

                            <Button 
                                type="submit" 
                                variant="primary" 
                                size="lg" 
                                className="w-full" 
                                loading={loading}
                            >
                                Send Reset Link
                            </Button>
                        </form>
                    ) : (
                        <div className="text-center py-4 animate-scaleIn">
                            <div className="w-20 h-20 bg-emerald-500/10 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-6 border border-emerald-500/20">
                                <CheckCircle2 size={40} />
                            </div>
                            <h2 className="text-2xl font-bold text-white mb-3">Check your email</h2>
                            <p className="text-slate-400 font-medium mb-8">
                                We've sent a password reset link to <span className="text-slate-200 font-bold">{email}</span>
                            </p>
                            <Button variant="glass" className="w-full" onClick={() => setSubmitted(false)}>
                                Resend Email
                            </Button>
                        </div>
                    )}

                    <div className="mt-10 text-center pt-8 border-t border-white/5">
                        <Link to="/login" className="inline-flex items-center gap-2 text-slate-400 hover:text-white font-bold transition-all group">
                            <ArrowLeft size={18} className="transition-transform group-hover:-translate-x-1" />
                            Back to Sign In
                        </Link>
                    </div>
                </Card>
            </div>
        </div>
    );
}
