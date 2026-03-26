import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Send, Bot, User, ArrowRight, Home, CircleCheck, Sparkles, Brain, AlertTriangle, MapPin, Target } from 'lucide-react';
import { createRequest, interpretRequestAI } from '../services/api';
import LocationPickerMap from '../components/common/LocationPickerMap';

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
        question: 'Which area do you need help in? (Tap the map to drop a pin)',
        type: 'map',
        validate: v => typeof v === 'object' && v && v.address,
        error: 'Please drop a pin on the map to select your location.',
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
        const isMap = step.type === 'map';
        const value = isMap ? inputValue : (typeof inputValue === 'string' ? inputValue.trim() : '');

        if (!step.validate(value)) {
            setError(step.error);
            return;
        }
        
        setError('');
        pushUser(isMap ? value.address : value);
        
        const updatedData = { ...data, [step.key]: value };
        setData(updatedData);
        setInputValue(isMap ? null : '');

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
                location: data.location?.address || data.location,
                lat: data.location?.lat,
                lng: data.location?.lng,
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
        <div className="chat-app-wrapper">
            <div className="chat-glass-container">
                {/* ── Header ── */}
                <div className="chat-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                        <div className="avatar-bot glowing">🤖</div>
                        <div>
                            <div style={{ fontWeight: 800, fontSize: 18, color: '#fff', letterSpacing: '-0.5px' }}>CVAS AI Assistant</div>
                            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', fontWeight: 500 }}>Intelligent Request Engine</div>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: 16 }}>
                        <Link to="/" className="nav-link">
                            <Home size={16} /> Home
                        </Link>
                        <Link to="/admin" className="nav-link admin-link">
                            Dashboard <ArrowRight size={14} />
                        </Link>
                    </div>
                </div>

                {/* ── Progress bar ── */}
                <div style={{ height: 4, background: 'rgba(255,255,255,0.1)' }}>
                    <div style={{ height: '100%', background: 'linear-gradient(90deg, #00FF87, #60EFFF)', width: `${Math.min((currentStep / STEPS.length) * 100, 100)}%`, transition: 'width 0.6s cubic-bezier(0.4, 0, 0.2, 1)', boxShadow: '0 0 10px rgba(96, 239, 255, 0.5)' }} />
                </div>

                {/* ── Chat messages ── */}
                <div className="chat-messages" ref={bottomRef}>
                    {messages.map((msg, i) => (
                        <div key={i} className={`msg-row ${msg.from === 'user' ? 'msg-user' : 'msg-bot'}`}>
                            
                            <div className={`msg-avatar ${msg.from === 'user' ? 'avatar-user' : 'avatar-bot'}`}>
                                {msg.from === 'bot' ? <Bot size={20} color="#fff" /> : <User size={20} color="#fff" />}
                            </div>

                            <div className="msg-content-wrapper">
                                <div className={`msg-bubble ${msg.from === 'user' ? 'bubble-user' : 'bubble-bot'}`}>
                                    {msg.text.split(/\*\*(.+?)\*\*/g).map((part, j) =>
                                        j % 2 === 1 ? <strong key={j} style={{ color: msg.from === 'bot' ? '#60EFFF' : '#fff', fontWeight: 800 }}>{part}</strong> : part
                                    )}
                                </div>

                                {/* Summary card before final submit */}
                                {msg.summary && !submitted && (
                                    <div className="summary-card">
                                        <div className="summary-header">
                                            <Sparkles size={16} /> Request Summary
                                        </div>
                                        <div className="summary-grid">
                                            {[
                                                ['👤 Name', msg.summary.requesterName],
                                                ['📞 Contact', msg.summary.requesterContact],
                                                ['📍 Location', msg.summary.location?.address || msg.summary.location],
                                                ['🔧 Service', msg.summary.serviceType],
                                                ['⚡ Urgency', msg.summary.urgencyLevel],
                                            ].map(([label, value]) => (
                                                <div key={label} className="summary-item">
                                                    <div className="summary-label">{label}</div>
                                                    <div className="summary-val" style={{ color: label.includes('Urgency') ? urgencyColor(value) : '#1e293b' }}>
                                                        {value}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="summary-desc-box">
                                            <div className="summary-label">📝 Description</div>
                                            <div className="summary-desc-text">{msg.summary.description}</div>
                                        </div>
                                        {msg.nlp && (
                                            <div className="ai-chips">
                                                <Brain size={14} />
                                                <span className="ai-chip">AI: {msg.nlp.serviceType || msg.nlp.service_type}</span>
                                                <span className="ai-chip">Urgency: {msg.nlp.urgencyLevel || msg.nlp.urgency_level}</span>
                                                <span className="ai-chip">Conf: {msg.nlp.confidence || 'N/A'}</span>
                                            </div>
                                        )}
                                        <button onClick={handleSubmit} disabled={submitting} className={`submit-btn ${submitting ? 'loading' : ''}`}>
                                            {submitting ? <><Brain size={18} className="spin" /> Submitting Request…</> : <><CircleCheck size={18} /> Confirm & Submit</>}
                                        </button>
                                    </div>
                                )}

                                {/* Success card */}
                                {submitted && msg.text.startsWith('✅') && createdRequest && (
                                    <div className="success-card">
                                        <div className="success-icon-wrap"><CircleCheck size={48} /></div>
                                        <div className="success-title">Request #{createdRequest.id} Submitted!</div>
                                        <div className="success-sub">Our community admins correspond to volunteers locally. You will be matched shortly.</div>
                                        <div className="success-actions">
                                            <Link to="/admin" className="btn-primary">View in Dashboard</Link>
                                            <Link to="/" className="btn-secondary">Back to Home</Link>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}

                    {/* Typing indicator */}
                    {validating && (
                        <div className="msg-row msg-bot">
                            <div className="msg-avatar avatar-bot"><Bot size={20} color="#fff" /></div>
                            <div className="typing-indicator animate-breathing">
                                <Brain size={16} color="#fb923c" />
                                <span>AI is analyzing your request...</span>
                            </div>
                        </div>
                    )}
                    <div style={{ float:"left", clear: "both" }} />
                </div>

                {/* ── Input area ── */}
                {!isDone && !validating && (
                    <div className="chat-input-area">
                        {error && (
                            <div className="input-error" style={{ animation: 'shake 0.4s' }}>
                                <AlertTriangle size={14} /> {error}
                            </div>
                        )}
                        <div className="input-wrapper">
                            {step?.type === 'select' ? (
                                <select value={inputValue || ''} onChange={e => setInputValue(e.target.value)} ref={inputRef} className="premium-input">
                                    <option value="" disabled>— {step.placeholder} —</option>
                                    {step.options.map(o => <option key={o} value={o}>{o}</option>)}
                                </select>
                            ) : step?.type === 'map' ? (
                                <LocationPickerMap
                                    value={{ lat: inputValue?.lat, lng: inputValue?.lng, address: inputValue?.address }}
                                    onChange={loc => setInputValue(loc)}
                                    height={200}
                                />
                            ) : step?.type === 'textarea' ? (
                                <textarea value={inputValue || ''} onChange={e => setInputValue(e.target.value)} onKeyDown={handleKey} ref={inputRef} rows={3} placeholder={step.placeholder} className="premium-input premium-textarea" />
                            ) : (
                                <input value={inputValue || ''} onChange={e => setInputValue(e.target.value)} onKeyDown={handleKey} ref={inputRef} placeholder={step?.placeholder} className="premium-input" />
                            )}
                            <button onClick={handleSend} className="send-btn" style={{ alignSelf: step?.type === 'map' ? 'flex-end' : 'stretch' }}>
                                <Send size={18} />
                                <span>{step?.type === 'select' || step?.type === 'map' ? 'Select' : 'Send'}</span>
                            </button>
                        </div>
                        <div className="step-indicator">
                            Step {currentStep + 1} of {STEPS.length} • Press Enter to send
                        </div>
                    </div>
                )}
            </div>

            <style>{`
            /* Animations */
            @keyframes fadeInUp { from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: translateY(0); } }
            @keyframes spin { 100% { transform:rotate(360deg); } }
            @keyframes shake { 0%, 100% {transform: translateX(0);} 25% {transform: translateX(-5px);} 75% {transform: translateX(5px);} }
            
            /* Container */
            .chat-app-wrapper {
                min-height: 100vh;
                background-color: #f1f5f9;
                background-image: radial-gradient(#e2e8f0 1px, transparent 1px);
                background-size: 20px 20px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-family: 'Inter', sans-serif;
                padding: 20px;
                box-sizing: border-box;
            }
            .chat-glass-container {
                width: 100%;
                max-width: 850px;
                height: 90vh;
                background: #ffffff;
                border: 1px solid #e2e8f0;
                border-radius: 28px;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
                display: flex;
                flex-direction: column;
                overflow: hidden;
                position: relative;
            }

            /* Header */
            .chat-header {
                padding: 20px 30px;
                border-bottom: 1px solid #e2e8f0;
                display: flex;
                align-items: center;
                justify-content: space-between;
                background: rgba(255, 255, 255, 0.6);
                z-index: 10;
            }
            .chat-header .avatar-bot {
                box-shadow: 0 0 15px rgba(251, 146, 60, 0.35); 
            }
            .chat-header-title { fontWeight: 800; fontSize: 18px; color: #1e293b; letterSpacing: '-0.5px'; }
            .chat-header-sub { fontSize: 13px; color: #64748b; fontWeight: 500; }
            
            .nav-link {
                display: flex;
                align-items: center;
                gap: 8px;
                color: #64748b;
                text-decoration: none;
                font-size: 14px;
                font-weight: 500;
                transition: all 0.2s;
                padding: 8px 12px;
                border-radius: 8px;
            }
            .nav-link:hover { background: #f1f5f9; color: #1e293b; }
            .admin-link { color: #f97316; font-weight: 600; background: #fff7ed; }
            .admin-link:hover { background: #ffedd5; color: #f97316; }

            /* Messages Area */
            .chat-messages {
                flex: 1;
                overflow-y: auto;
                padding: 30px;
                display: flex;
                flex-direction: column;
                gap: 24px;
            }
            .chat-messages::-webkit-scrollbar { width: 6px; }
            .chat-messages::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
            
            .msg-row { display: flex; gap: 16px; animation: fadeInUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; max-width: 85%; }
            .msg-user { align-self: flex-end; flex-direction: row-reverse; }
            .msg-bot { align-self: flex-start; }
            
            .msg-avatar { width: 42px; height: 42px; border-radius: 14px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; box-shadow: 0 4px 12px rgba(15,23,42,0.05); }
            .avatar-bot { background: linear-gradient(135deg, #fdba74, #fb923c); }
            .avatar-user { background: linear-gradient(135deg, #ffedd5, #fed7aa); color: #c2410c; }

            .msg-content-wrapper { display: flex; flex-direction: column; gap: 12px; }
            
            .msg-bubble {
                padding: 14px 20px;
                font-size: 15px;
                line-height: 1.6;
                box-shadow: 0 4px 15px rgba(15,23,42,0.04);
            }
            .bubble-bot {
                background: #ffffff;
                border: 1px solid #e2e8f0;
                color: #475569;
                border-radius: 4px 20px 20px 20px;
            }
            .bubble-user {
                background: #fff4ed;
                border: 1px solid #ffedd5;
                color: #7c2d12;
                border-radius: 20px 4px 20px 20px;
            }

            /* Summary Card */
            .summary-card {
                background: #ffffff;
                border: 1px solid #e2e8f0;
                border-radius: 20px;
                padding: 20px;
                box-shadow: 0 4px 15px rgba(15,23,42,0.04);
            }
            .summary-header {
                font-size: 14px;
                font-weight: 800;
                color: #f97316;
                margin-bottom: 16px;
                display: flex;
                align-items: center;
                gap: 8px;
            }
            .summary-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 12px 20px;
            }
            .summary-label { color: #64748b; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; font-weight: 700; }
            .summary-val { color: #1e293b; font-size: 14px; font-weight: 600; }
            .summary-desc-box { margin-top: 16px; padding-top: 16px; border-top: 1px solid #f1f5f9; }
            .summary-desc-text { color: #475569; font-size: 14px; line-height: 1.5; }
            
            .ai-chips { display: flex; gap: 8px; margin-top: 16px; flex-wrap: wrap; background: #fff7ed; padding: 10px 14px; border-radius: 12px; border: 1px solid #ffedd5; color: #f97316; align-items: center; }
            .ai-chip { font-size: 12px; font-weight: 600; background: #ffedd5; padding: 4px 8px; border-radius: 6px; }

            .submit-btn {
                margin-top: 24px;
                width: 100%;
                padding: 14px;
                background: #fb923c;
                border: none;
                border-radius: 14px;
                color: #ffffff;
                font-weight: 800;
                font-size: 15px;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 10px;
                transition: transform 0.2s, box-shadow 0.2s, background 0.2s;
                box-shadow: 0 4px 12px rgba(251, 146, 60, 0.25);
            }
            .submit-btn:hover { background: #f97316; transform: translateY(-2px); box-shadow: 0 8px 16px rgba(251, 146, 60, 0.35); }
            .submit-btn.loading { opacity: 0.8; pointer-events: none; }
            .spin { animation: spin 1s linear infinite; }

            /* Success Card */
            .success-card {
                background: #ecfdf5;
                border: 1px solid #6ee7b7;
                border-radius: 20px;
                padding: 30px;
                text-align: center;
            }
            .success-icon-wrap { color: #10b981; margin-bottom: 16px; display: flex; justify-content: center; }
            .success-title { color: #065f46; font-size: 20px; font-weight: 800; margin-bottom: 10px; }
            .success-sub { color: #047857; font-size: 14px; margin-bottom: 24px; line-height: 1.5; }
            .success-actions { display: flex; gap: 12px; justify-content: center; }
            .btn-primary { background: #10b981; color: #fff; text-decoration: none; padding: 10px 20px; border-radius: 10px; font-weight: 600; font-size: 14px; transition: 0.2s; box-shadow: 0 2px 8px rgba(16, 185, 129, 0.2); }
            .btn-primary:hover { background: #059669; }
            .btn-secondary { background: #ffffff; color: #1e293b; border: 1px solid #cbd5e1; text-decoration: none; padding: 10px 20px; border-radius: 10px; font-weight: 600; font-size: 14px; transition: 0.2s; }
            .btn-secondary:hover { background: #f8fafc; }

            /* Typing */
            .typing-indicator {
                background: #ffffff;
                border: 1px solid #e2e8f0;
                border-radius: 4px 20px 20px 20px;
                padding: 14px 20px;
                display: flex;
                align-items: center;
                gap: 12px;
                color: #64748b;
                font-size: 14px;
                font-weight: 500;
                box-shadow: 0 4px 15px rgba(15,23,42,0.04);
            }

            /* Input Area */
            .chat-input-area {
                padding: 24px 30px;
                background: rgba(255, 255, 255, 0.9);
                border-top: 1px solid #e2e8f0;
                z-index: 10;
            }
            .input-error { margin-bottom: 12px; color: #ef4444; font-size: 13px; display: flex; alignItems: center; gap: 6px; font-weight: 500; }
            .input-wrapper { display: flex; gap: 12px; align-items: flex-end; }
            
            .premium-input {
                flex: 1;
                background: #ffffff;
                border: 1.5px solid #cbd5e1;
                border-radius: 16px;
                padding: 16px 20px;
                color: #1e293b;
                font-size: 15px;
                outline: none;
                transition: border-color 0.2s, box-shadow 0.2s;
                font-family: 'Inter', sans-serif;
            }
            .premium-input:focus { border-color: #fb923c; box-shadow: 0 0 0 3px rgba(251, 146, 60, 0.1); }
            .premium-input::placeholder { color: #94a3b8; }
            .premium-textarea { resize: none; line-height: 1.5; }
            
            select.premium-input option { background: #ffffff; color: #1e293b; }

            .send-btn {
                padding: 0 24px;
                height: 54px;
                background: #fb923c;
                border: none;
                border-radius: 16px;
                color: #ffffff;
                font-weight: 700;
                font-size: 15px;
                cursor: pointer;
                display: flex;
                align-items: center;
                gap: 8px;
                transition: transform 0.2s, box-shadow 0.2s, background 0.2s;
                flex-shrink: 0;
            }
            .send-btn:hover { background: #f97316; transform: translateY(-2px); box-shadow: 0 4px 12px rgba(251, 146, 60, 0.2); }
            
            .step-indicator { margin-top: 12px; text-align: center; color: #94a3b8; font-size: 12px; font-weight: 500; letter-spacing: 0.5px; }
            `}</style>
        </div>
    );
}
