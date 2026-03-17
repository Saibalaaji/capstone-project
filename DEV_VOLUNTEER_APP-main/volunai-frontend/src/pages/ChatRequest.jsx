import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Send, Bot, User, ArrowRight, Home, CheckCircle2, Sparkles, Brain, AlertTriangle, MapPin, Target } from 'lucide-react';
import { createRequest, interpretRequestAI } from '../services/api';

// ── Chat steps definition ──────────────────────────────────────────────
const STEPS = [
    {
        key: 'requesterName',
        question: "Hi! I'm CVAS 🤖 I'll help you request assistance. First, what is your **full name**?",
        placeholder: 'e.g. Jane Smith',
        validate: v => v.trim().length >= 2,
        error: 'Please enter your name (at least 2 characters).',
    },
    {
        key: 'requesterContact',
        question: "Great, **{name}**! What is the best phone number or email to reach you?",
        placeholder: 'e.g. 555-1234 or jane@email.com',
        validate: v => v.trim().length >= 5,
        error: 'Please enter a valid contact.',
    },
    {
        key: 'location',
        question: 'Which area do you need help in?',
        placeholder: 'e.g. Manhattan, Brooklyn, Queens…',
        type: 'select',
        options: ['Manhattan', 'Brooklyn', 'Queens', 'Bronx', 'Staten Island', 'New York', 'Los Angeles', 'Chicago', 'San Francisco'],
        validate: v => v.trim().length > 0,
        error: 'Please select a location.',
    },
    {
        key: 'serviceType',
        question: 'What type of service do you need?',
        placeholder: 'Choose a service type',
        type: 'select',
        options: ['Medical Assistance', 'Food Delivery', 'Transportation', 'Home Repair', 'Pet Care', 'Technical Support', 'Companionship', 'Childcare', 'Cleaning Services', 'Shopping Assistance'],
        validate: v => v.trim().length > 0,
        error: 'Please select a service type.',
    },
    {
        key: 'urgencyLevel',
        question: 'How urgent is this request?',
        placeholder: 'Choose urgency',
        type: 'select',
        options: ['LOW', 'MEDIUM', 'HIGH'],
        validate: v => ['LOW', 'MEDIUM', 'HIGH'].includes(v),
        error: 'Please select an urgency level.',
    },
    {
        key: 'description',
        question: 'Almost done! Please describe your situation in a little more detail. Our **AI** will read this to better understand your needs.',
        placeholder: 'e.g. Elderly person needs medication pickup urgently…',
        type: 'textarea',
        validate: v => v.trim().length >= 10,
        error: 'Please describe your situation (at least 10 characters).',
    },
];

// ── Helpers ───────────────────────────────────────────────────────────
function fillTemplate(text, data) {
    return text.replace('{name}', data.requesterName || 'there');
}

function urgencyColor(u) {
    return u === 'HIGH' ? '#ef4444' : u === 'LOW' ? '#22c55e' : '#f59e0b';
}

// ── Main component ────────────────────────────────────────────────────
export default function ChatRequest() {
    const [messages, setMessages] = useState([]);
    const [currentStep, setCurrentStep] = useState(0);
    const [inputValue, setInputValue] = useState('');
    const [data, setData] = useState({});
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [createdRequest, setCreatedRequest] = useState(null);
    const [nlpResult, setNlpResult] = useState(null);
    const [validating, setValidating] = useState(false);
    const bottomRef = useRef(null);
    const inputRef = useRef(null);

    // ── Init: show first bot message ───────────────────────────────────
    useEffect(() => {
        setTimeout(() => {
            pushBot(fillTemplate(STEPS[0].question, {}));
        }, 400);
    }, []);

    // ── Auto-scroll ───────────────────────────────────────────────────
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, validating]);

    // ── Focus input ───────────────────────────────────────────────────
    useEffect(() => {
        inputRef.current?.focus();
    }, [currentStep]);

    function pushBot(text, extra = {}) {
        setMessages(m => [...m, { from: 'bot', text, ...extra }]);
    }
    function pushUser(text) {
        setMessages(m => [...m, { from: 'user', text }]);
    }

    // ── Handle user answer ────────────────────────────────────────────
    async function handleSend() {
        const step = STEPS[currentStep];
        const value = inputValue.trim();

        if (!step.validate(value)) {
            setError(step.error);
            return;
        }
        setError('');
        pushUser(value);
        const updatedData = { ...data, [step.key]: value };
        setData(updatedData);
        setInputValue('');

        // After description: call NLP API
        if (step.key === 'description') {
            setValidating(true);
            try {
                const res = await interpretRequestAI(value);
                const nlp = res.data;
                setNlpResult(nlp);
                // API returns camelCase: serviceType, urgencyLevel, confidence (string label)
                const svcType = nlp.serviceType || nlp.service_type || updatedData.serviceType;
                const urgency = nlp.urgencyLevel || nlp.urgency_level || 'MEDIUM';
                const conf = nlp.confidence || 'N/A';
                setTimeout(() => {
                    setValidating(false);
                    pushBot(
                        `🤖 AI Analysis complete! I detected: **${svcType}** service, urgency **${urgency}**, confidence **${conf}**. ` +
                        `Here's a summary of your request — confirm to submit!`,
                        { summary: updatedData, nlp }
                    );
                    setCurrentStep(STEPS.length); // done
                }, 1200);
            } catch {
                setValidating(false);
                pushBot("Got it! Let me prepare your request for submission...");
                setCurrentStep(STEPS.length);
            }
            return;
        }

        // Proceed to next step
        const nextStep = currentStep + 1;
        setCurrentStep(nextStep);
        setTimeout(() => {
            pushBot(fillTemplate(STEPS[nextStep].question, updatedData));
        }, 500);
    }

    function handleKey(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    }

    // ── Final submit ──────────────────────────────────────────────────
    async function handleSubmit() {
        setSubmitting(true);
        try {
            const payload = {
                requesterName: data.requesterName,
                requesterContact: data.requesterContact,
                location: data.location,
                serviceType: data.serviceType,
                urgencyLevel: data.urgencyLevel,
                description: data.description,
            };
            console.log('Submitting payload:', payload);
            const res = await createRequest(payload);
            console.log('Response:', res.data);
            setCreatedRequest(res.data.request || res.data);
            setSubmitted(true);
            pushBot(`✅ Your request has been submitted! Request ID: **#${(res.data.request || res.data).id}**. An admin will review and assign a volunteer shortly.`);
        } catch (err) {
            console.error('Submit error:', err);
            pushBot('❌ Failed to submit: ' + (err.response?.data?.error || err.response?.data || err.message));
        }
        setSubmitting(false);
    }

    const step = STEPS[currentStep];
    const isDone = currentStep >= STEPS.length;

    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg-primary, #0f172a)', display: 'flex', flexDirection: 'column', fontFamily: 'var(--font-sans, Inter, sans-serif)' }}>

            {/* ── Header ── */}
            <div style={{ padding: '16px 24px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', backdropFilter: 'blur(12px)', background: 'rgba(15,23,42,0.8)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 12, background: 'linear-gradient(135deg,#7c3aed,#4f46e5)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>🤖</div>
                    <div>
                        <div style={{ fontWeight: 700, fontSize: 17, color: '#f1f5f9' }}>CVAS Chat</div>
                        <div style={{ fontSize: 12, color: '#64748b' }}>AI-powered request assistant</div>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                    <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#64748b', textDecoration: 'none', fontSize: 13 }}>
                        <Home size={15} /> Home
                    </Link>
                    <Link to="/admin" style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#a78bfa', textDecoration: 'none', fontSize: 13, fontWeight: 600 }}>
                        Admin Dashboard <ArrowRight size={13} />
                    </Link>
                </div>
            </div>

            {/* ── Progress bar ── */}
            <div style={{ height: 3, background: 'rgba(255,255,255,0.06)' }}>
                <div style={{ height: '100%', background: 'linear-gradient(90deg,#7c3aed,#06b6d4)', width: `${Math.min((currentStep / STEPS.length) * 100, 100)}%`, transition: 'width 0.4s ease' }} />
            </div>

            {/* ── Chat messages ── */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '24px 24px 0', maxWidth: 760, width: '100%', margin: '0 auto', boxSizing: 'border-box' }}>
                {messages.map((msg, i) => (
                    <div key={i} style={{ display: 'flex', gap: 12, marginBottom: 20, flexDirection: msg.from === 'user' ? 'row-reverse' : 'row', animation: 'fadeInUp 0.3s ease' }}>

                        {/* Avatar */}
                        <div style={{ width: 36, height: 36, borderRadius: 12, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: msg.from === 'bot' ? 'linear-gradient(135deg,#7c3aed,#4f46e5)' : 'linear-gradient(135deg,#0891b2,#0e7490)' }}>
                            {msg.from === 'bot' ? <Bot size={18} color="#fff" /> : <User size={18} color="#fff" />}
                        </div>

                        {/* Bubble */}
                        <div style={{ maxWidth: '75%' }}>
                            <div style={{
                                background: msg.from === 'bot' ? 'rgba(30,41,59,0.9)' : 'rgba(124,58,237,0.25)',
                                border: `1px solid ${msg.from === 'bot' ? 'rgba(255,255,255,0.08)' : 'rgba(124,58,237,0.4)'}`,
                                borderRadius: msg.from === 'bot' ? '4px 16px 16px 16px' : '16px 4px 16px 16px',
                                padding: '12px 16px', color: '#e2e8f0', fontSize: 14, lineHeight: 1.6,
                            }}>
                                {/* Render text with **bold** support */}
                                {msg.text.split(/\*\*(.+?)\*\*/g).map((part, j) =>
                                    j % 2 === 1 ? <strong key={j} style={{ color: '#a78bfa' }}>{part}</strong> : part
                                )}
                            </div>

                            {/* Summary card before final submit */}
                            {msg.summary && !submitted && (
                                <div style={{ marginTop: 12, background: 'rgba(15,23,42,0.95)', border: '1px solid rgba(124,58,237,0.3)', borderRadius: 14, padding: 16 }}>
                                    <div style={{ fontSize: 13, fontWeight: 700, color: '#a78bfa', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                                        <Sparkles size={14} /> Request Summary
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 16px', fontSize: 13 }}>
                                        {[
                                            ['👤 Name', msg.summary.requesterName],
                                            ['📞 Contact', msg.summary.requesterContact],
                                            ['📍 Location', msg.summary.location],
                                            ['🔧 Service', msg.summary.serviceType],
                                            ['⚡ Urgency', msg.summary.urgencyLevel],
                                        ].map(([label, value]) => (
                                            <div key={label}>
                                                <div style={{ color: '#64748b', fontSize: 11 }}>{label}</div>
                                                <div style={{ color: '#f1f5f9', fontWeight: 600 }}>
                                                    {label.includes('Urgency') ? (
                                                        <span style={{ color: urgencyColor(value) }}>{value}</span>
                                                    ) : value}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <div style={{ marginTop: 10, borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 10 }}>
                                        <div style={{ color: '#64748b', fontSize: 11 }}>📝 Description</div>
                                        <div style={{ color: '#cbd5e1', fontSize: 13, marginTop: 3 }}>{msg.summary.description}</div>
                                    </div>
                                    {msg.nlp && (
                                        <div style={{ marginTop: 10, background: 'rgba(124,58,237,0.1)', borderRadius: 8, padding: '8px 12px', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                            <Brain size={13} color="#a78bfa" />
                                            <span style={{ fontSize: 12, color: '#a78bfa' }}>AI: {msg.nlp.serviceType || msg.nlp.service_type}</span>
                                            <span style={{ fontSize: 12, color: '#94a3b8' }}>· Urgency: {msg.nlp.urgencyLevel || msg.nlp.urgency_level}</span>
                                            <span style={{ fontSize: 12, color: '#94a3b8' }}>· Confidence: {msg.nlp.confidence || 'N/A'}</span>
                                        </div>
                                    )}
                                    <button onClick={handleSubmit} disabled={submitting}
                                        style={{ marginTop: 14, width: '100%', padding: '12px 0', background: 'linear-gradient(135deg,#7c3aed,#4f46e5)', border: 'none', borderRadius: 10, color: '#fff', fontWeight: 700, fontSize: 15, cursor: submitting ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: submitting ? 0.7 : 1 }}>
                                        {submitting ? <><Brain size={16} style={{ animation: 'spin 1s linear infinite' }} /> Submitting…</> : <><CheckCircle2 size={16} /> Confirm & Submit Request</>}
                                    </button>
                                </div>
                            )}

                            {/* Success card */}
                            {submitted && msg.text.startsWith('✅') && createdRequest && (
                                <div style={{ marginTop: 12, background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 14, padding: 16, textAlign: 'center' }}>
                                    <CheckCircle2 size={40} color="#10b981" style={{ marginBottom: 8 }} />
                                    <div style={{ fontWeight: 700, fontSize: 17, color: '#10b981' }}>Request #{createdRequest.id} Submitted!</div>
                                    <div style={{ color: '#94a3b8', fontSize: 13, margin: '8px 0 14px' }}>An admin will review and match a volunteer shortly.</div>
                                    <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                                        <Link to="/admin" style={{ padding: '10px 20px', background: 'rgba(124,58,237,0.8)', borderRadius: 8, color: '#fff', textDecoration: 'none', fontSize: 13, fontWeight: 600 }}>
                                            View in Admin Dashboard
                                        </Link>
                                        <Link to="/" style={{ padding: '10px 20px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#94a3b8', textDecoration: 'none', fontSize: 13 }}>
                                            Go Home
                                        </Link>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                ))}

                {/* Typing indicator */}
                {validating && (
                    <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
                        <div style={{ width: 36, height: 36, borderRadius: 12, background: 'linear-gradient(135deg,#7c3aed,#4f46e5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Bot size={18} color="#fff" />
                        </div>
                        <div style={{ background: 'rgba(30,41,59,0.9)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '4px 16px 16px 16px', padding: '14px 18px', display: 'flex', gap: 6, alignItems: 'center' }}>
                            <Brain size={14} color="#a78bfa" style={{ animation: 'spin 1.5s linear infinite' }} />
                            <span style={{ color: '#64748b', fontSize: 13 }}>Analyzing with AI…</span>
                            {[0, 1, 2].map(n => (
                                <div key={n} style={{ width: 6, height: 6, borderRadius: '50%', background: '#a78bfa', animation: `bounce 1s ${n * 0.2}s infinite` }} />
                            ))}
                        </div>
                    </div>
                )}
                <div ref={bottomRef} />
            </div>

            {/* ── Input area ── */}
            {!isDone && !validating && (
                <div style={{ padding: 20, maxWidth: 760, width: '100%', margin: '0 auto', boxSizing: 'border-box' }}>
                    {error && (
                        <div style={{ marginBottom: 8, color: '#f87171', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
                            <AlertTriangle size={13} /> {error}
                        </div>
                    )}
                    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
                        {/* Select or textarea input */}
                        {step?.type === 'select' ? (
                            <select value={inputValue} onChange={e => setInputValue(e.target.value)} ref={inputRef}
                                style={{ flex: 1, padding: '13px 16px', background: 'rgba(30,41,59,0.9)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12, color: '#f1f5f9', fontSize: 14, outline: 'none' }}>
                                <option value="">— {step.placeholder} —</option>
                                {step.options.map(o => <option key={o} value={o}>{o}</option>)}
                            </select>
                        ) : step?.type === 'textarea' ? (
                            <textarea value={inputValue} onChange={e => setInputValue(e.target.value)} onKeyDown={handleKey} ref={inputRef}
                                rows={3} placeholder={step.placeholder}
                                style={{ flex: 1, padding: '13px 16px', background: 'rgba(30,41,59,0.9)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12, color: '#f1f5f9', fontSize: 14, resize: 'none', outline: 'none', fontFamily: 'inherit', lineHeight: 1.5 }} />
                        ) : (
                            <input value={inputValue} onChange={e => setInputValue(e.target.value)} onKeyDown={handleKey} ref={inputRef}
                                placeholder={step?.placeholder}
                                style={{ flex: 1, padding: '13px 16px', background: 'rgba(30,41,59,0.9)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12, color: '#f1f5f9', fontSize: 14, outline: 'none' }} />
                        )}
                        <button onClick={handleSend}
                            style={{ padding: '13px 20px', background: 'linear-gradient(135deg,#7c3aed,#4f46e5)', border: 'none', borderRadius: 12, color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600, fontSize: 14, flexShrink: 0 }}>
                            <Send size={16} />
                            {step?.type === 'select' ? 'Select' : 'Send'}
                        </button>
                    </div>
                    <div style={{ marginTop: 8, fontSize: 11, color: '#334155', textAlign: 'center' }}>
                        Step {currentStep + 1} of {STEPS.length} · Press Enter to send
                    </div>
                </div>
            )}

            <style>{`
        @keyframes fadeInUp { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
        @keyframes spin { from { transform:rotate(0deg); } to { transform:rotate(360deg); } }
        @keyframes bounce { 0%,100% { transform:translateY(0); } 50% { transform:translateY(-4px); } }
        select option { background: #1e293b; }
      `}</style>
        </div>
    );
}
