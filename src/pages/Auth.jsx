import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './Auth.css';

// 1. පින්තූරය මෙතනින් Import කරගන්නවා
import dumImg from '../assets/Images/dum.png';

const STEPS = ['exam-year', 'auth-choice', 'auth-input', 'otp', 'otp-success', 'personal', 'more-info', 'academic', 'final'];

// ── Defined OUTSIDE Auth to prevent remount on every keystroke ──
const InputBox = ({ icon, type = 'text', id, placeholder, value, onChange, maxLength }) => (
    <div className={`auth-ibox ${icon ? 'has-icon' : ''}`}>
        {icon && <i className={`fa-solid ${icon}`}></i>}
        <input
            type={type} id={id} placeholder={placeholder}
            value={value} onChange={e => onChange(e.target.value)}
            maxLength={maxLength}
            autoComplete="off"
        />
    </div>
);

const SelectBox = ({ icon, id, value, onChange, children }) => (
    <div className={`auth-ibox ${icon ? 'has-icon' : ''}`}>
        {icon && <i className={`fa-solid ${icon}`}></i>}
        <select id={id} value={value} onChange={e => onChange(e.target.value)}>
            {children}
        </select>
    </div>
);

const Auth = () => {
    const navigate = useNavigate();
    const [mode, setMode] = useState('login'); // 'login' | 'register'
    const [step, setStep] = useState(0);
    const [toast, setToast] = useState(null);
    const [authMethod, setAuthMethod] = useState('gmail');

    // Form state
    const [form, setForm] = useState({
        batch: '',
        authVal: '',
        otp: ['', '', '', ''],
        name: '', nic: '',
        dob: '', gender: '', religion: '', parentName: '',
        studentType: '', classType: '', term: '',
        district: '', password: '',
        // Login fields
        loginEmail: '', loginPassword: '',
    });

    const otpRefs = [useRef(), useRef(), useRef(), useRef()];

    const showToast = (msg, type = 'error') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3500);
    };

    const updateField = (key, val) => setForm(f => ({ ...f, [key]: val }));

    // Step validation
    const validate = () => {
        const s = STEPS[step];
        if (s === 'exam-year' && !form.batch) { showToast('Exam Year තෝරන්න.'); return false; }
        if (s === 'auth-input' && !form.authVal.trim()) { showToast('ඔබේ ' + (authMethod === 'gmail' ? 'Gmail' : 'දුරකථන') + ' ලිපිනය ඇතුළත් කරන්න.'); return false; }
        if (s === 'otp' && form.otp.join('').length < 4) { showToast('OTP digits 4ම ඇතුළත් කරන්න.'); return false; }
        if (s === 'personal' && (!form.name.trim() || !form.nic.trim())) { showToast('නම සහ NIC අනිවාර්යයි.'); return false; }
        if (s === 'more-info' && (!form.dob || !form.gender || !form.religion || !form.parentName.trim())) { showToast('සියලු * ක්ෂේත්‍ර පිරවිය යුතුයි.'); return false; }
        if (s === 'academic' && (!form.studentType || !form.classType || !form.term)) { showToast('සියලු * ක්ෂේත්‍ර පිරවිය යුතුයි.'); return false; }
        if (s === 'final' && (!form.district || !form.password)) { showToast('දිස්ත්‍රික්කය සහ Password අනිවාර්යයි.'); return false; }
        return true;
    };

    const next = () => {
        if (!validate()) return;
        if (STEPS[step] === 'otp') {
            if (form.otp.join('') !== '1234') { showToast('වැරදි OTP. හදිසි කේතය: 1234'); return; }
            setStep(s => s + 1);
            setTimeout(() => setStep(s => s + 1), 2000); // skip success screen
            return;
        }
        if (STEPS[step] === 'final') { finish(); return; }
        setStep(s => s + 1);
    };

    const back = () => { if (step > 0) setStep(s => s - 1); };

    const finish = () => {
        showToast('ලියාපදිංචිය සාර්ථකයි! 🎉', 'success');
        setTimeout(() => navigate('/'), 2500);
    };

    const handleLogin = () => {
        if (!form.loginEmail.trim() || !form.loginPassword.trim()) {
            showToast('Email සහ Password දෙකම ඇතුළත් කරන්න.');
            return;
        }
        showToast('Mock login successful! (Backend needed for real auth)', 'success');
        setTimeout(() => navigate('/'), 2000);
    };

    const progressStep = () => {
        const realSteps = ['exam-year', 'personal', 'more-info', 'academic', 'final'];
        const realIdx = realSteps.indexOf(STEPS[step]);
        return realIdx >= 0 ? realIdx : (STEPS[step] === 'auth-choice' || STEPS[step] === 'auth-input' || STEPS[step] === 'otp' || STEPS[step] === 'otp-success' ? 1 : 0);
    };

    const totalSteps = 5;
    const prog = progressStep();

    const BATCH_OPTIONS = [
        { id: '2026', label: '2026 A/L', icon: 'fa-trophy', color: '#f59e0b' },
        { id: '2027', label: '2027 A/L', icon: 'fa-fire', color: '#f97316' },
        { id: '2028', label: '2028 A/L', icon: 'fa-heart', color: '#a855f7' },
    ];

    return (
        <div className="auth-root">
            {/* Toast */}
            {toast && (
                <div className={`auth-toast auth-toast--${toast.type}`}>
                    <i className={`fa-solid ${toast.type === 'success' ? 'fa-circle-check' : 'fa-circle-exclamation'}`}></i>
                    <span>{toast.msg}</span>
                </div>
            )}

            {/* ── Sidebar ── */}
            <div className="auth-sidebar">
                {/* 2. අර Import කරපු පින්තූරය (dumImg) මෙතනට යොදනවා */}
                <img src={dumImg} alt="Ranishan" className="auth-sidebar-img" />
                <div className="auth-sidebar-overlay"></div>
                <div className="auth-sidebar-content">
                    <div className="auth-sidebar-logo">RDICT<span>.</span></div>
                    <h2>RDICT <span>LMS</span></h2>
                    <p>Sri Lanka's leading ICT A/L platform. Follow the steps to get started.</p>
                </div>
            </div>

            {/* ── Main Content ── */}
            <div className="auth-content">
                {/* Home link */}
                <button onClick={() => navigate('/')} className="auth-home-btn" title="Back to Home">
                    <i className="fa-solid fa-house"></i>
                </button>

                {/* Mode toggle (Login / Register) */}
                <div className="auth-mode-toggle">
                    <button className={mode === 'login' ? 'active' : ''} onClick={() => setMode('login')}>Sign In</button>
                    <button className={mode === 'register' ? 'active' : ''} onClick={() => setMode('register')}>Register</button>
                </div>

                {/* ══ LOGIN FORM ══ */}
                {mode === 'login' && (
                    <div className="auth-panel">
                        <div className="auth-step-head">
                            <h2>ආයුබෝවන් 👋</h2>
                            <p>ඔබේ Email සහ Password ලබා දෙන්න.</p>
                        </div>
                        <div className="auth-fields-col">
                            <div className="auth-fgroup">
                                <label>Email ලිපිනය</label>
                                <InputBox icon="fa-envelope" type="email" placeholder="you@gmail.com" value={form.loginEmail} onChange={v => updateField('loginEmail', v)} />
                            </div>
                            <div className="auth-fgroup">
                                <label>Password</label>
                                <InputBox icon="fa-lock" type="password" placeholder="••••••••" value={form.loginPassword} onChange={v => updateField('loginPassword', v)} />
                            </div>
                            <button className="auth-btn-primary" onClick={handleLogin}>
                                Sign In <i className="fa-solid fa-arrow-right"></i>
                            </button>
                            <p className="auth-switch-text">Account නැද්ද? <button onClick={() => setMode('register')}>Register Now</button></p>
                        </div>
                    </div>
                )}

                {/* ══ REGISTER WIZARD ══ */}
                {mode === 'register' && (
                    <div className="auth-panel">
                        {/* Progress Bar */}
                        <div className="auth-progress">
                            <div className="auth-progress-track">
                                <div className="auth-progress-fill" style={{ width: `${(prog / (totalSteps - 1)) * 100}%` }}></div>
                            </div>
                            <div className="auth-dots">
                                {Array.from({ length: totalSteps }).map((_, i) => (
                                    <div key={i} className={`auth-dot ${i < prog ? 'done' : ''} ${i === prog ? 'active' : ''}`}>{i + 1}</div>
                                ))}
                            </div>
                        </div>

                        {/* STEP 0 — Exam Year */}
                        {STEPS[step] === 'exam-year' && (
                            <div className="auth-step-frame">
                                <div className="auth-step-head">
                                    <h2>Exam Year තෝරන්න *</h2>
                                    <p>ඔබ A/L විභාගයට පෙනී සිටින වසර.</p>
                                </div>
                                <div className="auth-batch-grid">
                                    {BATCH_OPTIONS.map(b => (
                                        <div key={b.id} className={`auth-batch-card ${form.batch === b.id ? 'selected' : ''}`} onClick={() => updateField('batch', b.id)}>
                                            <i className={`fa-solid ${b.icon}`} style={{ color: b.color }}></i>
                                            <span>{b.label}</span>
                                        </div>
                                    ))}
                                </div>
                                <div className="auth-step-footer">
                                    <button className="auth-btn-primary" onClick={next}>Next <i className="fa-solid fa-arrow-right"></i></button>
                                </div>
                            </div>
                        )}

                        {/* STEP 1 — Auth Choice */}
                        {STEPS[step] === 'auth-choice' && (
                            <div className="auth-step-frame">
                                <div className="auth-step-head">
                                    <h2>සම්බන්ධ වන ආකාරය</h2>
                                    <p>ලියාපදිංචිය සඳහා ආකාරයක් තෝරා ගන්න.</p>
                                </div>
                                <div className="auth-choice-list">
                                    {[
                                        { method: 'gmail', icon: 'fa-envelope', title: 'Gmail මගින්', sub: 'ලබාදෙන Gmail ලිපිනයට OTP කේතයක් ලැබෙනු ඇත.' },
                                        { method: 'phone', icon: 'fa-phone', title: 'දුරකථනය මගින්', sub: 'ලබාදෙන දුරකථන අංකයට SMS OTP ලැබෙනු ඇත.' },
                                    ].map(opt => (
                                        <div key={opt.method} className="auth-choice-card" onClick={() => { setAuthMethod(opt.method); setStep(s => s + 1); }}>
                                            <div className="auth-choice-icon"><i className={`fa-solid ${opt.icon}`}></i></div>
                                            <div>
                                                <div className="auth-choice-title">{opt.title}</div>
                                                <div className="auth-choice-sub">{opt.sub}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="auth-step-footer">
                                    <button className="auth-btn-ghost" onClick={back}>Back</button>
                                </div>
                            </div>
                        )}

                        {/* STEP 2 — Auth Input */}
                        {STEPS[step] === 'auth-input' && (
                            <div className="auth-step-frame">
                                <div className="auth-step-head">
                                    <h2>{authMethod === 'gmail' ? 'Gmail ලිපිනය' : 'දුරකථන අංකය'}</h2>
                                    <p>OTP කේතය ලබා ගැනීමට ඔබේ {authMethod === 'gmail' ? 'Gmail' : 'දුරකථන'} ලිපිනය ඇතුළත් කරන්න.</p>
                                </div>
                                <div className="auth-fields-col">
                                    <div className="auth-fgroup">
                                        <label>{authMethod === 'gmail' ? 'Gmail Address' : 'Phone Number'}</label>
                                        <InputBox
                                            icon={authMethod === 'gmail' ? 'fa-envelope' : 'fa-phone'}
                                            type={authMethod === 'gmail' ? 'email' : 'tel'}
                                            placeholder={authMethod === 'gmail' ? 'you@gmail.com' : '07XXXXXXXX'}
                                            value={form.authVal}
                                            onChange={v => updateField('authVal', v)}
                                        />
                                    </div>
                                </div>
                                <div className="auth-step-footer">
                                    <button className="auth-btn-ghost" onClick={back}>Back</button>
                                    <button className="auth-btn-primary" onClick={next}>Get OTP <i className="fa-solid fa-paper-plane"></i></button>
                                </div>
                            </div>
                        )}

                        {/* STEP 3 — OTP */}
                        {STEPS[step] === 'otp' && (
                            <div className="auth-step-frame">
                                <div className="auth-step-head">
                                    <h2>OTP තහවුරු කරන්න</h2>
                                    <p>ඔබේ <span style={{ color: 'var(--primary)', fontWeight: 700 }}>{form.authVal}</span> වෙත කේතය යවා ඇත. (Test code: 1234)</p>
                                </div>
                                <div className="auth-otp-row">
                                    {form.otp.map((digit, i) => (
                                        <input
                                            key={i} ref={otpRefs[i]}
                                            type="text" maxLength={1} className="auth-otp-box"
                                            value={digit}
                                            onChange={e => {
                                                const val = e.target.value.replace(/\D/, '');
                                                const newOtp = [...form.otp];
                                                newOtp[i] = val;
                                                updateField('otp', newOtp);
                                                if (val && i < 3) otpRefs[i + 1].current?.focus();
                                            }}
                                            onKeyDown={e => { if (e.key === 'Backspace' && !digit && i > 0) otpRefs[i - 1].current?.focus(); }}
                                        />
                                    ))}
                                </div>
                                <div className="auth-step-footer">
                                    <button className="auth-btn-ghost" onClick={back}>Back</button>
                                    <button className="auth-btn-primary" onClick={next}>Verify <i className="fa-solid fa-shield-check"></i></button>
                                </div>
                            </div>
                        )}

                        {/* STEP 4 — OTP Success */}
                        {STEPS[step] === 'otp-success' && (
                            <div className="auth-step-frame auth-success-frame">
                                <div className="auth-success-mark"><i className="fa-solid fa-check"></i></div>
                                <h2>Verified Successfully!</h2>
                                <p>දැන් ඔබේ පෞද්ගලික විස්තර සම්පූර්ණ කරන්න...</p>
                            </div>
                        )}

                        {/* STEP 5 — Personal Info */}
                        {STEPS[step] === 'personal' && (
                            <div className="auth-step-frame">
                                <div className="auth-step-head">
                                    <h2>පෞද්ගලික තොරතුරු</h2>
                                    <p>ඔබේ නිවැරදි විස්තර ලබා දෙන්න.</p>
                                </div>
                                <div className="auth-fields-col">
                                    <div className="auth-fgroup">
                                        <label className="req">සම්පූර්ණ නම (Full Name)</label>
                                        <InputBox icon="fa-user" placeholder="Full name in English" value={form.name} onChange={v => updateField('name', v)} />
                                    </div>
                                    <div className="auth-fgroup">
                                        <label className="req">NIC අංකය</label>
                                        <InputBox icon="fa-id-card" placeholder="200212345678 or 200212345V" value={form.nic} onChange={v => updateField('nic', v)} />
                                    </div>
                                </div>
                                <div className="auth-step-footer">
                                    <button className="auth-btn-ghost" onClick={back}>Back</button>
                                    <button className="auth-btn-primary" onClick={next}>Next <i className="fa-solid fa-arrow-right"></i></button>
                                </div>
                            </div>
                        )}

                        {/* STEP 6 — More Info */}
                        {STEPS[step] === 'more-info' && (
                            <div className="auth-step-frame">
                                <div className="auth-step-head">
                                    <h2>තවත් විස්තර</h2>
                                    <p>අනිවාර්ය * ක්ෂේත්‍ර සම්පූර්ණ කරන්න.</p>
                                </div>
                                <div className="auth-fields-col">
                                    <div className="auth-grid-2">
                                        <div className="auth-fgroup">
                                            <label className="req">උපන් දිනය</label>
                                            <div className="auth-ibox"><input type="date" value={form.dob} onChange={e => updateField('dob', e.target.value)} /></div>
                                        </div>
                                        <div className="auth-fgroup">
                                            <label className="req">ලිංගිකත්වය</label>
                                            <SelectBox value={form.gender} onChange={v => updateField('gender', v)}>
                                                <option value="">— තෝරන්න —</option>
                                                <option>Male</option>
                                                <option>Female</option>
                                            </SelectBox>
                                        </div>
                                    </div>
                                    <div className="auth-fgroup">
                                        <label className="req">ආගම (Religion)</label>
                                        <SelectBox icon="fa-star-and-crescent" value={form.religion} onChange={v => updateField('religion', v)}>
                                            <option value="">— තෝරන්න —</option>
                                            <option>Buddhist</option>
                                            <option>Christian</option>
                                            <option>Hindu</option>
                                            <option>Islam</option>
                                        </SelectBox>
                                    </div>
                                    <div className="auth-fgroup">
                                        <label className="req">මාපියන්ගේ නම</label>
                                        <InputBox icon="fa-users" placeholder="Guardian's full name" value={form.parentName} onChange={v => updateField('parentName', v)} />
                                    </div>
                                </div>
                                <div className="auth-step-footer">
                                    <button className="auth-btn-ghost" onClick={back}>Back</button>
                                    <button className="auth-btn-primary" onClick={next}>Next <i className="fa-solid fa-arrow-right"></i></button>
                                </div>
                            </div>
                        )}

                        {/* STEP 7 — Academic */}
                        {STEPS[step] === 'academic' && (
                            <div className="auth-step-frame">
                                <div className="auth-step-head">
                                    <h2>අධ්‍යයන විස්තර</h2>
                                    <p>ඔබේ පන්ති විස්තර ලබා දෙන්න.</p>
                                </div>
                                <div className="auth-fields-col">
                                    <div className="auth-fgroup">
                                        <label className="req">අයදුම්කරු වර්ගය</label>
                                        <SelectBox icon="fa-user-graduate" value={form.studentType} onChange={v => updateField('studentType', v)}>
                                            <option value="">— තෝරන්න —</option>
                                            <option value="school">පාසල් අයදුම්කරු</option>
                                            <option value="private">පෞද්ගලික අයදුම්කරු</option>
                                        </SelectBox>
                                    </div>
                                    <div className="auth-grid-2">
                                        <div className="auth-fgroup">
                                            <label className="req">පන්තිය (Class)</label>
                                            <SelectBox value={form.classType} onChange={v => updateField('classType', v)}>
                                                <option value="">— තෝරන්න —</option>
                                                <option>Online Class</option>
                                                <option>Gampaha (Susipvan)</option>
                                                <option>Kegalle (Science Center)</option>
                                                <option>Ratnapura (Nenik)</option>
                                            </SelectBox>
                                        </div>
                                        <div className="auth-fgroup">
                                            <label className="req">වාරය (Term)</label>
                                            <SelectBox value={form.term} onChange={v => updateField('term', v)}>
                                                <option value="">— තෝරන්න —</option>
                                                <option>1st Term</option>
                                                <option>2nd Term</option>
                                                <option>3rd Term</option>
                                            </SelectBox>
                                        </div>
                                    </div>
                                </div>
                                <div className="auth-step-footer">
                                    <button className="auth-btn-ghost" onClick={back}>Back</button>
                                    <button className="auth-btn-primary" onClick={next}>Next <i className="fa-solid fa-arrow-right"></i></button>
                                </div>
                            </div>
                        )}

                        {/* STEP 8 — Final */}
                        {STEPS[step] === 'final' && (
                            <div className="auth-step-frame">
                                <div className="auth-step-head">
                                    <h2>අවසාන පියවර 🏁</h2>
                                    <p>Password සහ දිස්ත්‍රික්කය ඇතුළත් කරන්න.</p>
                                </div>
                                <div className="auth-fields-col">
                                    <div className="auth-fgroup">
                                        <label className="req">දිස්ත්‍රික්කය</label>
                                        <SelectBox icon="fa-location-dot" value={form.district} onChange={v => updateField('district', v)}>
                                            <option value="">— තෝරන්න —</option>
                                            <option>Kegalle</option><option>Ratnapura</option><option>Gampaha</option>
                                            <option>Colombo</option><option>Kandy</option><option>Other</option>
                                        </SelectBox>
                                    </div>
                                    <div className="auth-fgroup">
                                        <label className="req">Password</label>
                                        <InputBox icon="fa-lock" type="password" placeholder="Create a strong password" value={form.password} onChange={v => updateField('password', v)} />
                                    </div>
                                    <p style={{ color: '#64748b', fontSize: '0.78rem' }}>
                                        ලියාපදිංචි වීමෙන් ඔබ RDICT Terms &amp; Conditions සමඟ එකඟ වේ.
                                    </p>
                                </div>
                                <div className="auth-step-footer">
                                    <button className="auth-btn-ghost" onClick={back}>Back</button>
                                    <button className="auth-btn-primary" onClick={next}>Register <i className="fa-solid fa-check"></i></button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Auth;