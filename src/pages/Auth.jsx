import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import Cursor from '../components/Cursor';
import { motion, AnimatePresence } from 'framer-motion';
import { timetableConfig } from '../config';
import './Auth.css';

// 1. පින්තූරය රඳවා ගන්නවා
import dumImg from '../assets/Images/dum.png';

const STEPS = ['exam-year', 'credentials', 'personal', 'more-info', 'academic', 'address', 'final', 'otp'];

// ── Defined OUTSIDE Auth to prevent remount on every keystroke ──
const InputBox = ({ icon, type = 'text', id, placeholder, value, onChange, maxLength, min, max }) => (
    <div className={`auth-ibox ${icon ? 'has-icon' : ''}`}>
        {icon && <i className={`fa-solid ${icon}`}></i>}
        <input
            type={type} id={id} placeholder={placeholder}
            value={value} onChange={e => onChange(e.target.value)}
            maxLength={maxLength}
            min={min} max={max}
            autoComplete="off"
        />
    </div>
);

const PasswordBox = ({ value, onChange, placeholder = "••••••••", showStrength = false }) => {
    const [show, setShow] = useState(false);
    
    // Checks
    const hasLength = value.length >= 6;
    const hasUpper = /[A-Z]/.test(value);
    const hasNumber = /[0-9]/.test(value);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(value);

    return (
        <div style={{ width: '100%' }}>
            <div className="auth-ibox" style={{ position: 'relative', width: '100%' }}>
                <i className="fa-solid fa-lock" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', zIndex: 2, color: '#64748b' }}></i>
                <input 
                    type={show ? "text" : "password"} 
                    placeholder={placeholder} 
                    value={value} 
                    onChange={e => onChange(e.target.value)} 
                    style={{ paddingLeft: '42px', paddingRight: '45px', width: '100%', boxSizing: 'border-box' }}
                />
                <i 
                    className={`fa-solid ${show ? 'fa-eye-slash' : 'fa-eye'}`}
                    onClick={() => setShow(!show)} 
                    style={{ position: 'absolute', right: '15px', left: 'auto', pointerEvents: 'auto', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', cursor: 'pointer', zIndex: 10, padding: '5px' }}
                    title={show ? "Hide Password" : "Show Password"}
                ></i>
            </div>
            
            {showStrength && (
                <div style={{ marginTop: '12px', fontSize: '0.8rem', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ color: hasLength ? '#22c55e' : '#64748b', display: 'flex', alignItems: 'center', gap: '6px', transition: '0.3s' }}>
                        <i className={`fa-solid ${hasLength ? 'fa-circle-check' : 'fa-circle-xmark'}`}></i> අවම අකුරු 6ක්
                    </div>
                    <div style={{ color: hasUpper ? '#22c55e' : '#64748b', display: 'flex', alignItems: 'center', gap: '6px', transition: '0.3s' }}>
                        <i className={`fa-solid ${hasUpper ? 'fa-circle-check' : 'fa-circle-xmark'}`}></i> Capital අකුරක් 
                    </div>
                    <div style={{ color: hasNumber ? '#22c55e' : '#64748b', display: 'flex', alignItems: 'center', gap: '6px', transition: '0.3s' }}>
                        <i className={`fa-solid ${hasNumber ? 'fa-circle-check' : 'fa-circle-xmark'}`}></i> ඉලක්කමක් 
                    </div>
                    <div style={{ color: hasSpecial ? '#22c55e' : '#64748b', display: 'flex', alignItems: 'center', gap: '6px', transition: '0.3s' }}>
                        <i className={`fa-solid ${hasSpecial ? 'fa-circle-check' : 'fa-circle-xmark'}`}></i> විශේෂ සංකේතයක් (!@#)
                    </div>
                </div>
            )}
        </div>
    );
};

const SelectBox = ({ icon, id, value, onChange, children }) => (
    <div className={`auth-ibox ${icon ? 'has-icon' : ''}`}>
        {icon && <i className={`fa-solid ${icon}`}></i>}
        <select id={id} value={value} onChange={e => onChange(e.target.value)}>
            {children}
        </select>
    </div>
);

// Get Dynamic Batches from Config
const BATCH_OPTIONS = timetableConfig.batches.map(b => ({
    id: b.id,
    label: b.ttt || b.title || `Batch ${b.id}`,
    emoji: b.emoji || '🎓'
}));

const DISTRICTS = [
    'Ampara', 'Anuradhapura', 'Badulla', 'Batticaloa', 'Colombo', 'Galle', 'Gampaha', 'Hambantota', 'Jaffna', 
    'Kalutara', 'Kandy', 'Kegalle', 'Kilinochchi', 'Kurunegala', 'Mannar', 'Matale', 'Matara', 'Moneragala', 
    'Mullaitivu', 'Nuwara Eliya', 'Polonnaruwa', 'Puttalam', 'Ratnapura', 'Trincomalee', 'Vavuniya'
];

const PROVINCES = ['Western', 'Central', 'Southern', 'North Western', 'Sabaragamuwa', 'North Central', 'Uva', 'Eastern', 'Northern'];

const Auth = () => {
    const navigate = useNavigate();
    const [mode, setMode] = useState('login'); // 'login' | 'register'
    const [step, setStep] = useState(0);
    const [toast, setToast] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    const [form, setForm] = useState({
        batch: '', email: '', password: '', 
        otp: '', // Flexible OTP length string
        name: '', nic: '', dob: '', gender: '', guardianPhone: '',
        studentType: '', classType: '', shy: '', district: '',
        schoolName: '', addressLine1: '', addressLine2: '', province: '',
        avatar_url: '', // Profile Photo
        // Login fields
        loginEmail: '', loginPassword: '',
    });

    const [isUploadingImage, setIsUploadingImage] = useState(false);

    const otpRefs = [useRef(), useRef(), useRef(), useRef(), useRef(), useRef()];

    // Date constraints for DOB
    const today = new Date();
    const minDate = new Date(today.getFullYear() - 30, today.getMonth(), today.getDate()).toISOString().split('T')[0];
    const maxDate = new Date(today.getFullYear() - 15, today.getMonth(), today.getDate()).toISOString().split('T')[0];

    const showToast = (msg, type = 'error') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 4000);
    };

    const updateField = (key, val) => setForm(f => ({ ...f, [key]: val }));

    // Step validation
    const validate = () => {
        const s = STEPS[step];
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (s === 'exam-year' && !form.batch) { showToast('කරුණාකර Exam Year තෝරන්න.'); return false; }
        if (s === 'credentials') {
            if (!emailRegex.test(form.email)) { showToast('නිවැරදි Email ලිපිනයක් ඇතුළත් කරන්න.'); return false; }
            if (form.password.length < 6 || !/[A-Z]/.test(form.password) || !/[0-9]/.test(form.password) || !/[!@#$%^&*(),.?":{}|<>]/.test(form.password)) { 
                showToast('Password එක දුර්වලයි! කොළ පාටින් පෙන්වන අවශ්‍යතා සියල්ල සපුරන්න.'); 
                return false; 
            }
        }
        if (s === 'otp' && form.otp.length < 4) { showToast('කරුණාකර නිවැරදි OTP අංකය ඇතුළත් කරන්න.'); return false; }
        if (s === 'personal' && (!form.name.trim() || !form.nic.trim())) { showToast('නම සහ ජාතික හැඳුනුම්පත් අංකය අනිවාර්යයි.'); return false; }
        if (s === 'more-info' && (!form.dob || !form.gender || form.guardianPhone.length < 10)) { showToast('සියලු * ක්ෂේත්‍ර නිවැරදිව පිරවිය යුතුයි.'); return false; }
        if (s === 'academic' && (!form.studentType || !form.classType || !form.shy || !form.schoolName.trim())) { showToast('අධ්‍යයන විස්තර සහ පාසල අනිවාර්යයි.'); return false; }
        if (s === 'address' && (!form.addressLine1.trim() || !form.province)) { showToast('ලිපිනය සහ පළාත අනිවාර්යයි.'); return false; }
        if (s === 'final' && !form.district) { showToast('දිස්ත්‍රික්කය තෝරන්න.'); return false; }
        return true;
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Validation
        if (file.size > 5 * 1024 * 1024) {
            showToast('ඡායාරූපය 5MB ට වඩා කුඩා විය යුතුය.');
            return;
        }

        setIsUploadingImage(true);
        try {
            const formData = new FormData();
            formData.append('image', file);
            
            // ImgBB API Key provided by user
            const url = `https://api.imgbb.com/1/upload?key=d74f574e073a204f1546dd5d9cb692e4`;
            
            const res = await fetch(url, { method: 'POST', body: formData });
            const data = await res.json();
            
            if (data.success) {
                updateField('avatar_url', data.data.url);
                showToast('Profile photo uploaded!', 'success');
            } else {
                showToast('ඡායාරූපය Upload කිරීම අසාර්ථකයි.');
            }
        } catch (err) {
            showToast('Network error during upload.');
        }
        setIsUploadingImage(false);
    };

    const handleForgotPassword = async () => {
        if (!form.loginEmail) {
            showToast("මුරපදය Reset කිරීමට පළමුව ඔබගේ Email ලිපිනය ඉහළින් ඇතුළත් කරන්න.", "error");
            return;
        }
        setIsLoading(true);
        const { error } = await supabase.auth.resetPasswordForEmail(form.loginEmail);
        if (error) {
            showToast(error.message);
        } else {
            showToast("Password reset link සබැඳිය ඔබගේ Email ලිපිනයට යවන ලදී!", "success");
        }
        setIsLoading(false);
    }

    const next = async () => {
        if (!validate()) return;
        
        // ── FINAL STEP: CALL SIGNUP FIRST ──
        if (STEPS[step] === 'final') { 
            setIsLoading(true);
            try {
                // Register user in Supabase
                const { data, error } = await supabase.auth.signUp({
                    email: form.email,
                    password: form.password,
                    options: {
                        data: {
                            full_name: form.name,
                            nic: form.nic,
                            batch: form.batch,
                            dob: form.dob,
                            gender: form.gender,
                            guardian_phone: form.guardianPhone,
                            student_type: form.studentType,
                            class_type: form.classType,
                            shy: form.shy,
                            district: form.district,
                            school_name: form.schoolName,
                            address_line1: form.addressLine1,
                            address_line2: form.addressLine2,
                            province: form.province,
                            avatar_url: form.avatar_url,
                            role: 'student'
                        }
                    }
                });

                if (error) {
                    if (error.status === 422 || error.message.toLowerCase().includes("already registered")) {
                        showToast("This email is already in use! Please Sign In.");
                        setMode('login');
                    } else {
                        showToast(error.message);
                    }
                } else {
                    // Check if auto-logged in (happens if Email Confirmations are Off in Supabase)
                    if (data.session) {
                        showToast('ලියාපදිංචිය සාර්ථකයි! 🎉', 'success');
                        // Return to Landing Page as requested!
                        setTimeout(() => navigate('/'), 2000);
                    } else {
                        // Email confirm is On, move to OTP Verify step!
                        showToast(`6-digit OTP code sent to ${form.email}`, 'success');
                        setStep(s => s + 1);
                    }
                }
            } catch (err) {
                showToast("Network Error.");
            }
            setIsLoading(false);
            return; 
        }

        // ── OTP VERIFICATION STEP ──
        if (STEPS[step] === 'otp') {
            setIsLoading(true);
            const { data, error } = await supabase.auth.verifyOtp({
                email: form.email,
                token: form.otp,
                type: 'signup' // specify signup token verification
            });
            
            if (error) {
                showToast("Invalid OTP code. Please try again.");
            } else {
                showToast('OTP Verified! ලියාපදිංචිය සාර්ථකයි! 🎉', 'success');
                // Return to Landing Page after OTP verification
                setTimeout(() => navigate('/'), 2000);
            }
            setIsLoading(false);
            return;
        }

        setStep(s => s + 1);
    };

    const back = () => { if (step > 0) setStep(s => s - 1); };

    const handleLogin = async () => {
        if (!form.loginEmail.trim() || !form.loginPassword.trim()) {
            showToast('කරුණාකර Email සහ Password ලබාදෙන්න.');
            return;
        }

        setIsLoading(true);
        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email: form.loginEmail,
                password: form.loginPassword,
            });

            if (error) {
                showToast(error.message.includes('Invalid login') ? "වැරදි Email හෝ Password එකකි." : error.message);
            } else {
                showToast('Login successful! Redirecting...', 'success');
                // Redirect back to landing page
                setTimeout(() => navigate('/'), 1500);
            }
        } catch (err) {
            showToast('Login Error.');
        }
        setIsLoading(false);
    };

    // Calculate progress (excluding OTP step which is an overlay step)
    const totalSteps = 7;
    const prog = Math.min(step, totalSteps - 1);

    return (
        <div className="auth-root">
            <Cursor />
            {/* Toast */}
            <AnimatePresence>
                {toast && (
                    <motion.div 
                        initial={{ opacity: 0, y: -20, x: '-50%' }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                        className={`auth-toast auth-toast--${toast.type}`}
                        style={{ position: 'fixed', top: '20px', left: '50%', transform: 'translateX(-50%)', zIndex: 9999 }}
                    >
                        <i className={`fa-solid ${toast.type === 'success' ? 'fa-circle-check' : 'fa-circle-exclamation'}`}></i>
                        <span>{toast.msg}</span>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Sidebar ── */}
            <div className="auth-sidebar">
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
                <button onClick={() => navigate('/')} className="auth-home-btn" title="Back to Home">
                    <i className="fa-solid fa-house"></i>
                </button>

                <div className="auth-mode-toggle">
                    <button className={mode === 'login' ? 'active' : ''} onClick={() => setMode('login')}>Sign In</button>
                    <button className={mode === 'register' ? 'active' : ''} onClick={() => setMode('register')}>Register</button>
                </div>

                <AnimatePresence mode="wait">
                {/* ══ LOGIN FORM ══ */}
                {mode === 'login' && (
                    <motion.div 
                        key="login"
                        initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.3 }}
                        className="auth-panel"
                    >
                        <div className="auth-step-head">
                            <h2>Welcome Back 👋</h2>
                            <p>Please enter your email and password to sign in.</p>
                        </div>
                        <div className="auth-fields-col">
                            <div className="auth-fgroup">
                                <label>Email Address</label>
                                <InputBox icon="fa-envelope" type="email" placeholder="student@rdict.lk" value={form.loginEmail} onChange={v => updateField('loginEmail', v)} />
                            </div>
                            <div className="auth-fgroup">
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                    <label style={{ marginBottom: 0 }}>Password</label>
                                    <a href="#!" onClick={(e) => { e.preventDefault(); handleForgotPassword(); }} style={{ color: '#a855f7', fontSize: '0.85rem', textDecoration: 'none' }}>Forgot Password?</a>
                                </div>
                                <PasswordBox value={form.loginPassword} onChange={v => updateField('loginPassword', v)} />
                            </div>
                            <button className="auth-btn-primary" onClick={handleLogin} disabled={isLoading}>
                                {isLoading ? "Processing..." : <>Sign In <i className="fa-solid fa-arrow-right"></i></>}
                            </button>
                            <p className="auth-switch-text">Don't have an account? <button onClick={() => setMode('register')}>Register Now</button></p>
                        </div>
                    </motion.div>
                )}

                {/* ══ REGISTER WIZARD ══ */}
                {mode === 'register' && (
                    <motion.div 
                        key="register"
                        initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}
                        className="auth-panel"
                    >
                        {STEPS[step] !== 'otp' && (
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
                        )}

                        {/* STEP 1 — Exam Year */}
                        {STEPS[step] === 'exam-year' && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="auth-step-frame">
                                <div className="auth-step-head">
                                    <h2>Exam Year තෝරන්න *</h2>
                                    <p>ඔබ A/L විභාගයට පෙනී සිටින වසර.</p>
                                </div>
                                <div className="auth-batch-grid">
                                    {BATCH_OPTIONS.map(b => (
                                        <div key={b.id} className={`auth-batch-card ${form.batch === b.id ? 'selected' : ''}`} onClick={() => updateField('batch', b.id)}>
                                            <motion.div 
                                                animate={{ y: [0, -8, 0], scale: form.batch === b.id ? [1, 1.1, 1] : 1 }} 
                                                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                                                style={{ fontSize: '2.4rem', filter: 'drop-shadow(0 0 10px rgba(168,85,247,0.3))' }}
                                            >
                                                {b.emoji}
                                            </motion.div>
                                            <span style={{ fontWeight: 700, fontSize: '0.95rem', color: '#fff' }}>{b.label}</span>
                                        </div>
                                    ))}
                                </div>
                                <div className="auth-step-footer">
                                    <button className="auth-btn-primary" onClick={next}>Next <i className="fa-solid fa-arrow-right"></i></button>
                                </div>
                            </motion.div>
                        )}

                        {/* STEP 2 — Credentials */}
                        {STEPS[step] === 'credentials' && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="auth-step-frame">
                                <div className="auth-step-head">
                                    <h2>ගිණුම් විස්තර</h2>
                                    <p>ඔබගේ Email ලිපිනය සහ නව මුරපදයක් ලබාදෙන්න.</p>
                                </div>
                                <div className="auth-fields-col">
                                    <div className="auth-fgroup">
                                        <label className="req">Email Address</label>
                                        <InputBox icon="fa-envelope" type="email" placeholder="you@gmail.com" value={form.email} onChange={v => updateField('email', v)} />
                                    </div>
                                    <div className="auth-fgroup">
                                        <label className="req">Create Strong Password</label>
                                        <PasswordBox placeholder="Create a strong password" value={form.password} onChange={v => updateField('password', v)} showStrength={true} />
                                    </div>
                                </div>
                                <div className="auth-step-footer">
                                    <button className="auth-btn-ghost" onClick={back}>Back</button>
                                    <button className="auth-btn-primary" onClick={next}>Next <i className="fa-solid fa-arrow-right"></i></button>
                                </div>
                            </motion.div>
                        )}

                        {/* STEP 3 — Personal Info */}
                        {STEPS[step] === 'personal' && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="auth-step-frame">
                                <div className="auth-step-head">
                                    <h2>පෞද්ගලික තොරතුරු</h2>
                                    <p>ඔබේ නිවැරදි විස්තර සහ ඡායාරූපයක් ලබා දෙන්න.</p>
                                </div>
                                <div className="auth-fields-col">
                                    {/* Profile Photo Upload */}
                                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
                                        <label style={{ position: 'relative', cursor: 'pointer', display: 'block' }}>
                                            <div style={{
                                                width: '100px', height: '100px', borderRadius: '50%',
                                                background: form.avatar_url ? `url(${form.avatar_url}) center/cover` : 'rgba(168, 85, 247, 0.1)',
                                                border: '2px dashed #a855f7', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                overflow: 'hidden', transition: '0.3s'
                                            }}>
                                                {!form.avatar_url && !isUploadingImage && <i className="fa-solid fa-camera" style={{ fontSize: '2rem', color: '#a855f7' }}></i>}
                                                {isUploadingImage && <i className="fa-solid fa-circle-notch fa-spin" style={{ fontSize: '2rem', color: '#a855f7' }}></i>}
                                            </div>
                                            <div style={{ position: 'absolute', bottom: 0, right: 0, background: '#a855f7', color: '#fff', width: '30px', height: '30px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', border: '2px solid #000' }}>
                                                <i className="fa-solid fa-plus"></i>
                                            </div>
                                            <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageUpload} disabled={isUploadingImage} />
                                        </label>
                                    </div>
                                    
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
                                    <button className="auth-btn-primary" onClick={next} disabled={isUploadingImage}>Next <i className="fa-solid fa-arrow-right"></i></button>
                                </div>
                            </motion.div>
                        )}

                        {/* STEP 4 — More Info */}
                        {STEPS[step] === 'more-info' && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="auth-step-frame">
                                <div className="auth-step-head">
                                    <h2>අතිරේක තොරතුරු</h2>
                                </div>
                                <div className="auth-fields-col">
                                    <div className="auth-grid-2">
                                        <div className="auth-fgroup">
                                            <label className="req">උපන් දිනය</label>
                                            <div className="auth-ibox">
                                                <input type="date" value={form.dob} min={minDate} max={maxDate} 
                                                onChange={e => updateField('dob', e.target.value)} />
                                            </div>
                                        </div>
                                        <div className="auth-fgroup">
                                            <label className="req">Gender (ස්ත්‍රී / පුරුෂ)</label>
                                            <SelectBox value={form.gender} onChange={v => updateField('gender', v)}>
                                                <option value="">— Select —</option>
                                                <option>Male</option>
                                                <option>Female</option>
                                            </SelectBox>
                                        </div>
                                    </div>
                                    <div className="auth-fgroup">
                                        <label className="req">මව්පිය / භාරකරුගේ දුරකථන අංකය</label>
                                        <InputBox icon="fa-phone" placeholder="07X XXX XXXX" maxLength={10} 
                                            value={form.guardianPhone} onChange={v => updateField('guardianPhone', v.replace(/\D/g, ''))} />
                                    </div>
                                </div>
                                <div className="auth-step-footer">
                                    <button className="auth-btn-ghost" onClick={back}>Back</button>
                                    <button className="auth-btn-primary" onClick={next}>Next <i className="fa-solid fa-arrow-right"></i></button>
                                </div>
                            </motion.div>
                        )}

                        {/* STEP 5 — Academic */}
                        {STEPS[step] === 'academic' && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="auth-step-frame">
                                <div className="auth-step-head">
                                    <h2>අධ්‍යයන විස්තර</h2>
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
                                    <div className="auth-fgroup">
                                        <label className="req">
                                            {form.studentType === 'private' ? 'සා.පෙළ හැදෑරූ පාසල (O/L School)' : 'දැනට ඉගෙනුම ලබන පාසල (School Name)'}
                                        </label>
                                        <InputBox icon="fa-school" placeholder="Enter school name" value={form.schoolName} onChange={v => updateField('schoolName', v)} />
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
                                            <label className="req">වාරය (Shy)</label>
                                            <SelectBox value={form.shy} onChange={v => updateField('shy', v)}>
                                                <option value="">— තෝරන්න —</option>
                                                <option>1st Shy</option>
                                                <option>2nd Shy</option>
                                                <option>3rd Shy</option>
                                            </SelectBox>
                                        </div>
                                    </div>
                                </div>
                                <div className="auth-step-footer">
                                    <button className="auth-btn-ghost" onClick={back}>Back</button>
                                    <button className="auth-btn-primary" onClick={next}>Next <i className="fa-solid fa-arrow-right"></i></button>
                                </div>
                            </motion.div>
                        )}

                        {/* STEP 6 — Address */}
                        {STEPS[step] === 'address' && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="auth-step-frame">
                                <div className="auth-step-head">
                                    <h2>ලිපිනය (Address) 🏠</h2>
                                    <p style={{ color: '#d8b4fe', background: 'rgba(168, 85, 247, 0.1)', padding: '10px', borderRadius: '8px', border: '1px solid rgba(168, 85, 247, 0.2)' }}>
                                        <i className="fa-solid fa-truck-fast" style={{ marginRight: '8px' }}></i>
                                        නිවැරදි ලිපිනය ටියුට්ස් ගෙදරටම ගෙන්වා ගැනීමට අත්‍යවශ්‍ය වේ.
                                    </p>
                                </div>
                                <div className="auth-fields-col">
                                    <div className="auth-fgroup">
                                        <label className="req">Address Line 1</label>
                                        <InputBox icon="fa-map-marker-alt" placeholder="House No, Street name" value={form.addressLine1} onChange={v => updateField('addressLine1', v)} />
                                    </div>
                                    <div className="auth-fgroup">
                                        <label className="req">Address Line 2 (City / Area)</label>
                                        <InputBox icon="fa-map-pin" placeholder="City or Area name" value={form.addressLine2} onChange={v => updateField('addressLine2', v)} />
                                    </div>
                                    <div className="auth-fgroup">
                                        <label className="req">පළාත (Province)</label>
                                        <SelectBox icon="fa-map" value={form.province} onChange={v => updateField('province', v)}>
                                            <option value="">— Select Province —</option>
                                            {PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
                                        </SelectBox>
                                    </div>
                                </div>
                                <div className="auth-step-footer">
                                    <button className="auth-btn-ghost" onClick={back}>Back</button>
                                    <button className="auth-btn-primary" onClick={next}>Next <i className="fa-solid fa-arrow-right"></i></button>
                                </div>
                            </motion.div>
                        )}

                        {/* STEP 7 — Final / Submit */}
                        {STEPS[step] === 'final' && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="auth-step-frame">
                                <div className="auth-step-head">
                                    <h2>අවසාන පියවර 🏁</h2>
                                    <p>අවසන් කිරීමට දිස්ත්‍රික්කය තෝරන්න.</p>
                                </div>
                                <div className="auth-fields-col">
                                    <div className="auth-fgroup">
                                        <label className="req">දිස්ත්‍රික්කය (District)</label>
                                        <SelectBox icon="fa-location-dot" value={form.district} onChange={v => updateField('district', v)}>
                                            <option value="">— තෝරන්න —</option>
                                            {DISTRICTS.map(d => <option key={d}>{d}</option>)}
                                        </SelectBox>
                                    </div>
                                    
                                    <div style={{ marginTop: '20px', padding: '15px', background: 'rgba(168, 85, 247, 0.1)', borderRadius: '12px', border: '1px solid rgba(168, 85, 247, 0.3)' }}>
                                        <p style={{ color: '#d8b4fe', fontSize: '0.85rem', margin: 0 }}>
                                            <i className="fa-solid fa-circle-info" style={{ marginRight: '8px' }}></i>
                                            මීලඟ පියවරේදී ඔබගේ Email ලිපිනයට **ලිපිනය තහවුරු කිරීමේ OTP කේතයක්** ලැබෙනු ඇත.
                                        </p>
                                    </div>
                                </div>
                                <div className="auth-step-footer">
                                    <button className="auth-btn-ghost" onClick={back} disabled={isLoading}>Back</button>
                                    <button className="auth-btn-primary" onClick={next} disabled={isLoading}>
                                        {isLoading ? "Sending OTP..." : <>Finish Setup <i className="fa-solid fa-paper-plane"></i></>}
                                    </button>
                                </div>
                            </motion.div>
                        )}

                        {/* STEP 8 — OTP VERIFICATION */}
                        {STEPS[step] === 'otp' && (
                            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="auth-step-frame">
                                <div className="auth-step-head" style={{ textAlign: 'center' }}>
                                    <h2>Check your Email 📩</h2>
                                    <p>ඔබගේ <span style={{ color: '#a855f7', fontWeight: 700 }}>{form.email}</span> වෙත OTP කේතයක් යවා ඇත.</p>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'center', margin: '2rem 0' }}>
                                    <input
                                        type="text"
                                        maxLength={10}
                                        placeholder="••••••"
                                        value={form.otp}
                                        onChange={e => updateField('otp', e.target.value.replace(/\D/g, ''))}
                                        style={{
                                            width: '100%',
                                            maxWidth: '320px',
                                            height: '70px',
                                            background: 'rgba(255,255,255,0.05)',
                                            border: '1px solid #a855f7',
                                            borderRadius: '16px',
                                            textAlign: 'center',
                                            fontSize: '2.5rem',
                                            fontWeight: '800',
                                            color: '#fff',
                                            letterSpacing: '0.4em',
                                            paddingLeft: '0.4em', // Centers correctly with letter spacing
                                            outline: 'none',
                                            boxShadow: '0 0 20px rgba(168,85,247,0.15)'
                                        }}
                                    />
                                </div>
                                <div className="auth-step-footer">
                                    <button className="auth-btn-primary" onClick={next} disabled={isLoading} style={{ width: '100%' }}>
                                        {isLoading ? "Verifying..." : <>Verify &amp; Enter LMS <i className="fa-solid fa-shield-check"></i></>}
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </motion.div>
                )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default Auth;