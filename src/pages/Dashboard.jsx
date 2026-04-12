import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';
import Cursor from '../components/Cursor';
import ProtectedVideoPlayer from '../components/ProtectedVideoPlayer';
import './Dashboard.css';

// ICT Unit Thumbnails
import thumb1  from '../assets/Images/lessons thumb/1.png';
import thumb2  from '../assets/Images/lessons thumb/2.png';
import thumb3  from '../assets/Images/lessons thumb/3.png';
import thumb4  from '../assets/Images/lessons thumb/4.png';
import thumb5  from '../assets/Images/lessons thumb/5.png';
import thumb6  from '../assets/Images/lessons thumb/6.png';
import thumb7  from '../assets/Images/lessons thumb/7.png';
import thumb8  from '../assets/Images/lessons thumb/8.png';
import thumb9  from '../assets/Images/lessons thumb/9.png';
import thumb10 from '../assets/Images/lessons thumb/10.png';
import thumb11 from '../assets/Images/lessons thumb/11.png';
import thumb12 from '../assets/Images/lessons thumb/12.png';
import thumb13 from '../assets/Images/lessons thumb/13.png';

const UNIT_THUMBS = {
    1:thumb1, 2:thumb2, 3:thumb3, 4:thumb4, 5:thumb5, 6:thumb6, 7:thumb7,
    8:thumb8, 9:thumb9, 10:thumb10, 11:thumb11, 12:thumb12, 13:thumb13
};

const IMGBB_KEY = 'c0ac744b3989122820b4ce302fc16cc4'; // user's new Imgbb API key

const Dashboard = () => {
    const navigate = useNavigate();
    const [user, setUser]     = useState(null);
    const [meta, setMeta]     = useState({});
    const [activeTab, setActiveTab] = useState('overview');
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    // Data
    const [allClasses,       setAllClasses]       = useState([]);  // All main classes from DB
    const [allSessions,      setAllSessions]       = useState([]);  // All class_sessions from DB
    const [enrollments,      setEnrollments]       = useState([]);  // User's enrollments
    const [leaderboard,      setLeaderboard]       = useState([]);
    const [recRequests,      setRecRequests]       = useState([]);  // User's recording requests
    const [isLoading,        setIsLoading]         = useState(true);

    // Class Viewer
    const [viewingClass,     setViewingClass]      = useState(null);
    const [activeSession,    setActiveSession]     = useState(null); // session with video/zoom
    const [selectedSession,  setSelectedSession]   = useState(null); // session detail modal
    const [sessionResumeTimes, setSessionResumeTimes] = useState({});

    // Slip Upload
    const [uploadModalOpen,  setUploadModalOpen]   = useState(false);
    const [selectedClass,    setSelectedClass]     = useState(null);
    const [slipFile,         setSlipFile]          = useState(null);
    const [slipUploading,    setSlipUploading]     = useState(false);

    // Profile
    const [profileForm, setProfileForm] = useState({ name:'', phone:'', school:'' });
    const [isSaving, setIsSaving]       = useState(false);
    const [photoFile,  setPhotoFile]    = useState(null);
    const [photoPreview, setPhotoPreview] = useState(null);
    const [photoUploading, setPhotoUploading] = useState(false);

    // Modal & Toast
    const [modal, setModal] = useState({ show:false, title:'', message:'', onConfirm:null, type:'confirm' });
    const [toast, setToast] = useState({ show:false, message:'', type:'success' });

    // Papers & Marks
    const [papers,     setPapers]     = useState([]);
    const [myMarks,    setMyMarks]    = useState([]);  // paper_marks for this student

    const showToast = (msg, type='success') => {
        setToast({ show:true, message:msg, type });
        setTimeout(() => setToast({ show:false, message:'', type:'success' }), 3500);
    };
    const showAlert   = (title, msg) => setModal({ show:true, title, message:msg, onConfirm:null, type:'alert' });
    const confirmAction = (title, msg, fn) => setModal({ show:true, title, message:msg, onConfirm:fn, type:'confirm' });

    // ── Auth + Fetch ──
    useEffect(() => {
        supabase.auth.getSession().then(async ({ data: { session } }) => {
            if (!session) { navigate('/login'); return; }
            const u = session.user;
            setUser(u);
            const m = u.user_metadata || {};
            setMeta(m);
            setProfileForm({ name: m.full_name || '', phone: m.guardian_phone || '', school: m.school_name || '' });

            // Sync profile to DB (batch column included!)
            await supabase.from('profiles').upsert([{
                id:           u.id,
                full_name:    m.full_name    || 'Student',
                school_name:  m.school_name  || '',
                batch:        m.batch        || '',
                student_type: m.student_type || 'online',
            }], { onConflict: 'id' });

            await fetchData(u.id);
        });
    }, [navigate]);

    const fetchData = async (userId) => {
        setIsLoading(true);
        try {
            const [cls, ses, enr, lead, req] = await Promise.all([
                supabase.from('classes').select('*').order('created_at', { ascending: false }),
                supabase.from('class_sessions').select('*').order('session_date', { ascending: true }),
                supabase.from('enrollments').select('*').eq('user_id', userId),
                supabase.from('profiles').select('full_name, school_name, xp_points').order('xp_points', { ascending: false }).limit(10),
                supabase.from('recording_requests').select('session_id, status').eq('user_id', userId),
            ]);
            if (cls.data)  setAllClasses(cls.data);
            if (ses.data)  setAllSessions(ses.data);
            if (enr.data)  setEnrollments(enr.data);
            if (lead.data) setLeaderboard(lead.data);
            if (req.data)  setRecRequests(req.data);

            // Papers
            const [pap, pm] = await Promise.all([
                supabase.from('papers').select('*').order('created_at', { ascending: false }),
                supabase.from('paper_marks').select('*').eq('student_id', userId),
            ]);
            if (pap.data) setPapers(pap.data);
            if (pm.data)  setMyMarks(pm.data);

            // Fetch resume progress
            const { data: prog } = await supabase.from('lesson_progress').select('lesson_id, resume_time').eq('user_id', userId);
            if (prog) {
                const map = {};
                prog.forEach(p => { map[p.lesson_id] = p.resume_time; });
                setSessionResumeTimes(map);
            }
        } catch (err) {
            console.error('Fetch error:', err);
        } finally {
            setIsLoading(false);
        }
    };

    // ── Fullscreen Video Security Logic ──
    useEffect(() => {
        const handleFsChange = () => {
            if (!document.fullscreenElement && !document.webkitFullscreenElement) {
                // If user exits fullscreen (e.g. presses Esc), immediately destroy the video player
                setActiveSession(null);
            }
        };
        document.addEventListener('fullscreenchange', handleFsChange);
        document.addEventListener('webkitfullscreenchange', handleFsChange);
        return () => {
            document.removeEventListener('fullscreenchange', handleFsChange);
            document.removeEventListener('webkitfullscreenchange', handleFsChange);
        };
    }, []);

    const handleWatchRecording = async (sess) => {
        try {
            if (document.documentElement.requestFullscreen) {
                await document.documentElement.requestFullscreen();
            } else if (document.documentElement.webkitRequestFullscreen) {
                await document.documentElement.webkitRequestFullscreen();
            }
        } catch (err) {
            console.warn("Fullscreen request blocked, falling back to full-window.", err);
        }
        // ONLY mount the player after fullscreen is requested
        setActiveSession(sess);
    };

    // ── Helpers ──
    const progressTimer = useRef(null);
    const handleTimeUpdate = (sessionId, time) => {
        setSessionResumeTimes(prev => ({ ...prev, [sessionId]: time }));
        if (progressTimer.current) clearTimeout(progressTimer.current);
        progressTimer.current = setTimeout(async () => {
            if (user && time > 10) {
                await supabase.from('lesson_progress').upsert([{
                    user_id:   user.id,
                    lesson_id: sessionId,  // reuse lesson_progress table with session_id as key
                    resume_time: Math.floor(time),
                    updated_at: new Date().toISOString()
                }], { onConflict: 'user_id,lesson_id' });
            }
        }, 15000);
    };

    // Check if class is free
    const isFreeClass = (cls) => !cls.price || Number(cls.price) === 0;

    // Check if student has valid access to a class right now
    const hasActiveAccess = (classId) => {
        const cls = allClasses.find(c => c.id === classId);
        if (cls && isFreeClass(cls)) return true; // Free class = always accessible
        const enr = enrollments.find(e => e.class_id === classId && e.status === 'approved');
        if (!enr) return false;
        if (!enr.expiry_date) return true;
        return new Date(enr.expiry_date) > new Date();
    };

    const isPending = (classId) => enrollments.some(e => e.class_id === classId && e.status === 'pending');
    const isExpired = (classId) => {
        const enr = enrollments.find(e => e.class_id === classId && e.status === 'approved');
        if (!enr || !enr.expiry_date) return false;
        return new Date(enr.expiry_date) <= new Date();
    };

    const isPhysical = () => (meta.student_type || 'online') === 'physical';

    // Has student requested a specific recording?
    const hasRequested = (sessionId) => recRequests.some(r => r.session_id === sessionId);
    const isRecordingApproved = (sessionId) => recRequests.some(r => r.session_id === sessionId && r.status === 'approved');

    // Check if a session's content is accessible
    const canWatchSession = (session) => {
        if (!hasActiveAccess(session.main_class_id)) return false;
        if (!isPhysical()) return true; // Online student with access = watch all
        // Physical student: only approved recording requests
        return isRecordingApproved(session.id);
    };

    const handleRequestRecording = async (session) => {
        if (hasRequested(session.id)) {
            showAlert('Already Requested', 'You have already sent a request for this recording. Please wait for Admin approval.');
            return;
        }
        const { error } = await supabase.from('recording_requests').insert([{
            user_id:    user.id,
            session_id: session.id,
            status:     'pending'
        }]);
        if (error) showAlert('Request Failed', error.message);
        else {
            showToast('Recording requested! Admin will review shortly. 📩', 'success');
            fetchData(user.id);
        }
    };

    // Slip Upload
    const handleJoinClick = async (cls) => {
        if (isFreeClass(cls)) {
            setSlipUploading(true);
            const { error } = await supabase.from('enrollments').insert([{
                user_id:      user.id,
                class_id:     cls.id,
                slip_url:     'FREE',
                status:       'approved',
                expiry_date:  null // lifetime
            }]);
            if (error) showAlert('Error', error.message);
            else { showToast('Joined successfully! It is a free class 🚀', 'success'); fetchData(user.id); }
            setSlipUploading(false);
            return;
        }
        setSelectedClass(cls);
        setSlipFile(null);
        setUploadModalOpen(true);
    };

    const handleSlipSubmit = async () => {
        if (!slipFile) return;
        setSlipUploading(true);
        try {
            const ext  = slipFile.name.split('.').pop();
            const path = `receipts/${user.id}_${selectedClass.id}_${Date.now()}.${ext}`;
            const { error: upError } = await supabase.storage.from('slips').upload(path, slipFile);
            
            if (upError) {
                showAlert('Upload Error', 'Could not upload the payment slip. Please check if the "slips" bucket is Public and exists in Supabase Storage.');
                setSlipUploading(false);
                return;
            }

            const { data: pub } = supabase.storage.from('slips').getPublicUrl(path);
            const publicUrl = pub?.publicUrl;

            if (!publicUrl) {
                showAlert('Error', 'Could not generate slip URL. Please try again.');
                setSlipUploading(false);
                return;
            }

            const { error } = await supabase.from('enrollments').insert([{
                user_id:  user.id,
                class_id: selectedClass.id,
                slip_url: publicUrl,
                status:   'pending'
            }]);
            if (error) showAlert('Failed', error.message);
            else {
                setUploadModalOpen(false);
                showToast('Slip submitted! Awaiting Admin approval. 🎉', 'success');
                fetchData(user.id);
            }
        } catch (err) { showAlert('Upload Error', err.message); }
        setSlipUploading(false);
    };

    // Profile Update (with optional Imgbb photo)
    const handleProfileUpdate = async () => {
        setIsSaving(true);
        let avatarUrl = meta.avatar_url || '';

        // Upload photo to Imgbb if selected
        if (photoFile) {
            setPhotoUploading(true);
            try {
                const form = new FormData();
                form.append('image', photoFile);
                const res  = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_KEY}`, { method:'POST', body:form });
                const json = await res.json();
                if (json.success) avatarUrl = json.data.url;
                else throw new Error(json.error?.message || 'Imgbb upload failed');
            } catch (e) { console.error('Photo upload failed:', e.message); }
            setPhotoUploading(false);
        }

        const { data, error } = await supabase.auth.updateUser({
            data: { full_name: profileForm.name, guardian_phone: profileForm.phone, school_name: profileForm.school, avatar_url: avatarUrl }
        });
        if (!error && data?.user) {
            setMeta(data.user.user_metadata);
            setPhotoFile(null); setPhotoPreview(null);
            showToast('Profile updated! ✅', 'success');
        } else showAlert('Failed', error?.message || 'Try again.');
        setIsSaving(false);
    };

    const handleLogout = async () => { await supabase.auth.signOut(); navigate('/'); };

    if (!user) return (
        <div style={{ background:'#0f172a', height:'100vh', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <Cursor /><h2 style={{ color:'#a855f7' }}>Loading Dashboard...</h2>
        </div>
    );

    // Compute derived lists
    const studentBatch = meta.batch || '2026';
    const filteredClasses = allClasses.filter(cls => {
        if (!cls.badge) return false;
        const targetBatches = cls.badge.split(',').map(b=>b.trim()).filter(Boolean);
        return targetBatches.includes(studentBatch);
    });
    const approvedClassIds = enrollments.filter(e => e.status === 'approved').map(e => e.class_id);
    // Free classes always appear in My Classes
    const myClasses = allClasses.filter(c => approvedClassIds.includes(c.id) || isFreeClass(c)).filter(cls => {
        if (!cls.badge) return false;
        const targetBatches = cls.badge.split(',').map(b=>b.trim()).filter(Boolean);
        return targetBatches.includes(studentBatch);
    });
    const firstName = (meta.full_name || 'Student').split(' ')[0];

    // Animation
    const cv = { hidden:{ opacity:0 }, visible:{ opacity:1, transition:{ staggerChildren:0.08 } } };
    const iv = { hidden:{ opacity:0, y:16 }, visible:{ opacity:1, y:0, transition:{ type:'spring', stiffness:300, damping:24 } } };

    const NAV = [
        { id:'overview',   label:'Overview',           icon:'border-all' },
        { id:'available',  label:'Available Classes',  icon:'graduation-cap' },
        { id:'my-classes', label:'My Classes',         icon:'book-open' },
        { id:'papers',     label:'My Papers',          icon:'file-pen' },
        { id:'leaderboard',label:'Leaderboard',        icon:'trophy' },
        { id:'profile',    label:'Profile',            icon:'user' },
    ];

    const inp = { padding:'12px 14px', borderRadius:'12px', border:'1.5px solid #e2e8f0', fontFamily:'inherit', fontSize:'0.95rem', outline:'none', width:'100%', boxSizing:'border-box', background:'#f8fafc' };
    const btn = (bg, c='#fff') => ({ padding:'12px 20px', borderRadius:'12px', border:'none', background:bg, color:c, fontWeight:800, cursor:'pointer', fontFamily:'inherit', fontSize:'0.9rem' });

    return (
        <div className="dash-layout-clean">
            <Cursor />

            {/* ── Top Navbar ── */}
            <header className="dash-topnav">
                <a href="/" className="dash-logo-nav">RDICT<span>.</span></a>
                <nav className={`dash-nav-links ${mobileMenuOpen ? 'mobile-open' : ''}`}>
                    {NAV.map(n => (
                        <div key={n.id}
                            className={`dash-nav-link ${activeTab === n.id ? 'active' : ''}`}
                            onClick={() => { setActiveTab(n.id); setViewingClass(null); setActiveSession(null); setMobileMenuOpen(false); }}>
                            {n.label}
                        </div>
                    ))}
                </nav>
                <div className="dash-user-section">
                    <div className="dash-user-info">
                        <span className="dash-user-name">{meta.full_name || 'Student'}</span>
                        {meta.avatar_url ? (
                            <img src={meta.avatar_url} alt="Profile" className="dash-avatar" style={{ width:'38px', height:'38px', borderRadius:'10px', objectFit:'cover' }} />
                        ) : (
                            <div className="dash-avatar">{firstName.charAt(0).toUpperCase()}</div>
                        )}
                    </div>
                    <button className="mobile-dash-toggle" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                        <i className={`fa-solid ${mobileMenuOpen ? 'fa-times' : 'fa-bars'}`} />
                    </button>
                </div>
            </header>

            {/* ── Main Content ── */}
            <main className="dash-content">

                {/* ══ OVERVIEW ══ */}
                {activeTab === 'overview' && (
                    <motion.div variants={cv} initial="hidden" animate="visible">
                        <div className="dash-section-header">
                            <h1 className="dash-section-title">🚀 Welcome back, {firstName}!</h1>
                            <div className="dash-filter">
                                <i className="fa-solid fa-graduation-cap" style={{ color:'#a855f7' }} /> {studentBatch || '?'} Batch
                                {isPhysical() && <span style={{ marginLeft:'8px', background:'rgba(16,185,129,0.1)', color:'#10b981', padding:'2px 8px', borderRadius:'8px', fontSize:'0.75rem', fontWeight:700 }}>Physical</span>}
                            </div>
                        </div>
                        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(220px,1fr))', gap:'1.5rem', marginTop:'1.5rem' }}>
                            {[
                                { label:'My Classes',    value: myClasses.length,                 color:'#a855f7', icon:'book-open' },
                                { label:'Total Sessions', value: allSessions.filter(s => approvedClassIds.includes(s.main_class_id)).length, color:'#3b82f6', icon:'calendar-days' },
                                { label:'Pending Approvals', value: enrollments.filter(e => e.status === 'pending').length, color:'#f59e0b', icon:'clock' },
                                { label:'Leaderboard Rank', value: leaderboard.findIndex(l => l.full_name === meta.full_name) + 1 || '—', color:'#10b981', icon:'trophy' },
                            ].map((st, i) => (
                                <motion.div key={i} variants={iv} style={{ background:'#fff', borderRadius:'20px', padding:'1.5rem', border:'1px solid rgba(168,85,247,0.08)', boxShadow:'0 4px 20px rgba(0,0,0,0.03)' }}>
                                    <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'10px' }}>
                                        <div style={{ background:`${st.color}1A`, color:st.color, width:'40px', height:'40px', borderRadius:'10px', display:'flex', alignItems:'center', justifyContent:'center' }}>
                                            <i className={`fa-solid fa-${st.icon}`} />
                                        </div>
                                        <span style={{ color:'#64748b', fontWeight:600, fontSize:'0.9rem' }}>{st.label}</span>
                                    </div>
                                    <h2 style={{ fontSize:'2.2rem', fontWeight:900, color:'#0f172a', margin:0 }}>{st.value}</h2>
                                </motion.div>
                            ))}
                        </div>

                        {/* Quick Actions */}
                        <div style={{ marginTop:'2rem', background:'#fff', borderRadius:'20px', padding:'1.5rem', border:'1px solid #f1f5f9' }}>
                            <h3 style={{ fontWeight:800, color:'#0f172a', marginBottom:'1rem' }}>Quick Actions</h3>
                            <div style={{ display:'flex', gap:'12px', flexWrap:'wrap' }}>
                                <button onClick={() => setActiveTab('available')} style={{ ...btn('linear-gradient(135deg,#a855f7,#7c3aed)') }}>Browse Classes</button>
                                <button onClick={() => setActiveTab('my-classes')} style={{ ...btn('#f8fafc', '#64748b') }}>My Classes</button>
                                <button onClick={() => setActiveTab('papers')} style={{ ...btn('#f8fafc', '#64748b') }}>My Papers 📝</button>
                                <button onClick={() => setActiveTab('leaderboard')} style={{ ...btn('#f8fafc', '#64748b') }}>Leaderboard 🏆</button>
                            </div>
                        </div>

                        {/* Latest Paper Marks */}
                        {papers.length > 0 && (
                            <div style={{ marginTop:'2rem', background:'#fff', borderRadius:'20px', padding:'1.5rem', border:'1px solid #f1f5f9' }}>
                                <h3 style={{ fontWeight:800, color:'#0f172a', marginBottom:'1.2rem', display:'flex', alignItems:'center', gap:'8px' }}>
                                    <i className="fa-solid fa-file-pen" style={{ color:'#a855f7' }} /> Latest Revision Paper Marks
                                </h3>
                                <div style={{ display:'flex', gap:'12px', flexWrap:'wrap' }}>
                                    {papers.slice(0,3).map(paper => {
                                        const mark = myMarks.find(m => m.paper_id === paper.id);
                                        return (
                                            <div key={paper.id} style={{ background:'rgba(168,85,247,0.04)', borderRadius:'16px', padding:'1rem 1.5rem', border:'1px solid rgba(168,85,247,0.1)', minWidth:'160px', flex:'1' }}>
                                                <div style={{ fontSize:'0.75rem', fontWeight:700, color:'#94a3b8', textTransform:'uppercase', marginBottom:'6px' }}>{paper.title}</div>
                                                <div style={{ fontSize:'2rem', fontWeight:900, color: mark ? (mark.is_absent ? '#ef4444' : '#a855f7') : '#cbd5e1' }}>
                                                    {mark ? (mark.is_absent ? 'AB' : mark.marks ?? '—') : '—'}
                                                </div>
                                                {mark && !mark.is_absent && <div style={{ fontSize:'0.75rem', color:'#64748b', marginTop:'2px' }}>marks scored</div>}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </motion.div>
                )}

                {/* ══ AVAILABLE CLASSES ══ */}
                {activeTab === 'available' && (
                    <motion.div variants={cv} initial="hidden" animate="visible">
                        <div className="dash-section-header">
                            <h1 className="dash-section-title">📚 Available Classes</h1>
                            <p style={{ color:'#64748b', marginTop:'4px' }}>Showing classes for <strong>{studentBatch}</strong> batch</p>
                        </div>
                        {isLoading ? (
                            <p style={{ color:'#64748b', marginTop:'2rem' }}>Loading...</p>
                        ) : filteredClasses.length === 0 ? (
                            <div style={{ textAlign:'center', padding:'4rem', color:'#94a3b8' }}>
                                <i className="fa-solid fa-graduation-cap" style={{ fontSize:'3rem', marginBottom:'1rem', display:'block' }} />
                                No classes available for your batch yet.
                            </div>
                        ) : (
                            <div className="classes-grid" style={{ marginTop:'1.5rem' }}>
                                {filteredClasses.map(cls => {
                                    const access  = hasActiveAccess(cls.id);
                                    const pending = isPending(cls.id);
                                    const expired = isExpired(cls.id);
                                    const classSessions = allSessions.filter(s => s.main_class_id === cls.id);

                                    return (
                                        <motion.div key={cls.id} variants={iv} className="class-card" style={{ position:'relative', overflow:'hidden' }}>
                                            <div className="class-card-img" style={{ background: cls.image_url ? `url(${cls.image_url}) center/cover` : 'linear-gradient(135deg,#a855f7,#3b82f6)', height:'140px', position:'relative' }}>
                                                <span style={{ position:'absolute', top:'10px', left:'10px', background:'rgba(0,0,0,0.55)', color:'#fff', fontSize:'0.7rem', fontWeight:800, padding:'3px 10px', borderRadius:'100px' }}>
                                                    {cls.badge} • {cls.type}
                                                </span>
                                                {access && <span style={{ position:'absolute', top:'10px', right:'10px', background:'#10b981', color:'#fff', fontSize:'0.7rem', fontWeight:800, padding:'3px 10px', borderRadius:'100px' }}>✅ Active</span>}
                                                {expired && <span style={{ position:'absolute', top:'10px', right:'10px', background:'#ef4444', color:'#fff', fontSize:'0.7rem', fontWeight:800, padding:'3px 10px', borderRadius:'100px' }}>⏰ Expired</span>}
                                                {pending && <span style={{ position:'absolute', top:'10px', right:'10px', background:'#f59e0b', color:'#fff', fontSize:'0.7rem', fontWeight:800, padding:'3px 10px', borderRadius:'100px' }}>⏳ Pending</span>}
                                            </div>
                                            <div className="class-card-body">
                                                <h3 className="class-title">{cls.title}</h3>
                                                <p className="class-desc" style={{ fontSize:'0.83rem', color:'#64748b' }}>{cls.description}</p>
                                                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'12px' }}>
                                                    <span style={{ fontWeight:800, color: isFreeClass(cls) ? '#10b981' : '#a855f7', fontSize:'0.95rem' }}>
                                                        {isFreeClass(cls) ? '🆓 FREE' : `Rs. ${cls.price}/month`}
                                                    </span>
                                                    <span style={{ fontSize:'0.78rem', color:'#94a3b8' }}>{classSessions.length} sessions</span>
                                                </div>
                                                {access || isFreeClass(cls) ? (
                                                    <button onClick={() => { setViewingClass(cls); setActiveTab('my-classes'); }} style={{ ...btn(isFreeClass(cls) && !access ? 'linear-gradient(135deg,#10b981,#059669)' : '#0f172a'), width:'100%' }}>
                                                        <i className={`fa-solid ${isFreeClass(cls) && !access ? 'fa-unlock' : 'fa-play'}`} style={{ marginRight:'8px' }} />
                                                        {isFreeClass(cls) && !access ? 'Access Free Class' : 'View Sessions'}
                                                    </button>
                                                ) : pending ? (
                                                    <button disabled style={{ ...btn('#94a3b8'), width:'100%' }}>⏳ Awaiting Approval</button>
                                                ) : (
                                                    <button onClick={() => { setSelectedClass(cls); setUploadModalOpen(true); }} style={{ ...btn('linear-gradient(135deg,#a855f7,#7c3aed)'), width:'100%' }}>
                                                        <i className="fa-solid fa-cart-shopping" style={{ marginRight:'8px' }} /> Enroll — Rs. {cls.price}
                                                    </button>
                                                )}
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        )}
                    </motion.div>
                )}

                {/* ══ MY CLASSES ══ */}
                {activeTab === 'my-classes' && (
                    <motion.div variants={cv} initial="hidden" animate="visible">
                        {!viewingClass ? (
                            <>
                                <div className="dash-section-header">
                                    <h1 className="dash-section-title">📖 My Classes</h1>
                                    <p style={{ color:'#64748b', marginTop:'4px' }}>{myClasses.length} enrolled</p>
                                </div>
                                {myClasses.length === 0 ? (
                                    <div style={{ textAlign:'center', padding:'4rem', color:'#94a3b8' }}>
                                        <i className="fa-solid fa-book-open" style={{ fontSize:'3rem', marginBottom:'1rem', display:'block' }} />
                                        You haven't enrolled in any classes yet.<br />
                                        <button onClick={() => setActiveTab('available')} style={{ ...btn('linear-gradient(135deg,#a855f7,#7c3aed)'), marginTop:'1rem' }}>Browse Classes</button>
                                    </div>
                                ) : (
                                    <div className="classes-grid" style={{ marginTop:'1.5rem' }}>
                                        {myClasses.map(cls => {
                                            const enr = enrollments.find(e => e.class_id === cls.id && e.status === 'approved');
                                            const expired = enr?.expiry_date && new Date(enr.expiry_date) <= new Date();
                                            const cls_sessions = allSessions.filter(s => s.main_class_id === cls.id);
                                            return (
                                                <motion.div key={cls.id} variants={iv} className="class-card" style={{ cursor:'pointer', opacity: expired ? 0.6 : 1 }} onClick={() => !expired && setViewingClass(cls)}>
                                                    <div className="class-card-img" style={{ background: cls.image_url ? `url(${cls.image_url}) center/cover` : 'linear-gradient(135deg,#a855f7,#3b82f6)', height:'140px', position:'relative' }}>
                                                        {expired
                                                            ? <span style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.6)', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:800, fontSize:'0.9rem' }}>⏰ Access Expired — Renew</span>
                                                            : <span style={{ position:'absolute', top:'10px', right:'10px', background:'#10b981', color:'#fff', fontSize:'0.7rem', fontWeight:800, padding:'3px 10px', borderRadius:'100px' }}>✅ Active</span>}
                                                    </div>
                                                    <div className="class-card-body">
                                                        <h3 className="class-title">{cls.title}</h3>
                                                        <p style={{ fontSize:'0.82rem', color:'#64748b', margin:'0 0 8px' }}>{cls_sessions.length} sessions</p>
                                                        {enr?.expiry_date && (
                                                            <p style={{ fontSize:'0.78rem', color: expired ? '#ef4444' : '#10b981', fontWeight:700, margin:0 }}>
                                                                {expired ? '⏰ Expired' : `⏳ Until ${new Date(enr.expiry_date).toLocaleDateString()}`}
                                                            </p>
                                                        )}
                                                    </div>
                                                </motion.div>
                                            );
                                        })}
                                    </div>
                                )}
                            </>
                        ) : (
                            // ── SESSIONS GRID (Instead of sidebar/player layout) ──
                            <div>
                                <div style={{ display:'flex', alignItems:'center', gap:'15px', marginBottom:'2rem' }}>
                                    <button onClick={() => setViewingClass(null)} style={{ ...btn('#f1f5f9'), color:'#0f172a' }}>
                                        <i className="fa-solid fa-arrow-left" /> Back
                                    </button>
                                    <div>
                                        <h2 style={{ margin:0, color:'#0f172a', fontWeight:800 }}>{viewingClass.title}</h2>
                                        <p style={{ margin:0, color:'#64748b', fontSize:'0.85rem' }}>Select a session below</p>
                                    </div>
                                </div>
                                
                                {allSessions.filter(s => s.main_class_id === viewingClass.id).length === 0 ? (
                                    <div style={{ textAlign:'center', padding:'3rem', color:'#94a3b8' }}>
                                        <i className="fa-solid fa-calendar-xmark" style={{ fontSize:'3rem', marginBottom:'1rem', display:'block' }} />
                                        No sessions have been added to this class yet.
                                    </div>
                                ) : (
                                    <div className="classes-grid">
                                        {allSessions.filter(s => s.main_class_id === viewingClass.id).map(sess => {
                                            const hasVideo = !!sess.video_id;
                                            const hasZoom = !!sess.zoom_link;
                                            const canWatch = canWatchSession(sess);
                                            const thumb = sess.unit_no ? UNIT_THUMBS[sess.unit_no] : null;
                                            const resumeAt = sessionResumeTimes[sess.id] || 0;
                                            const requested = hasRequested(sess.id);
                                            const approved = isRecordingApproved(sess.id);

                                            return (
                                                <motion.div key={sess.id} variants={iv} className="class-card">
                                                    <div className="class-card-img" style={{ background: thumb ? `url(${thumb}) center/cover` : 'linear-gradient(135deg,#a855f7,#3b82f6)', height:'160px', position:'relative' }}>
                                                        <span style={{ position:'absolute', top:'10px', right:'10px', background:'rgba(0,0,0,0.7)', color:'#fff', padding:'4px 12px', borderRadius:'100px', fontSize:'0.7rem', fontWeight:800 }}>
                                                            {hasVideo ? '🎬 Recorded' : hasZoom ? '🎥 Live' : '📅 Upcoming'}
                                                        </span>
                                                        {resumeAt > 5 && canWatch && hasVideo && (
                                                            <span style={{ position:'absolute', bottom:'10px', left:'10px', background:'rgba(168,85,247,0.9)', color:'#fff', padding:'4px 12px', borderRadius:'6px', fontSize:'0.7rem', fontWeight:800 }}>
                                                                ▶ Resume at {Math.floor(resumeAt/60)}:{String(Math.floor(resumeAt%60)).padStart(2,'0')}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="class-card-body" style={{ padding:'1.5rem', display:'flex', flexDirection:'column' }}>
                                                        <h3 className="class-title" style={{ fontSize:'1.1rem', marginBottom:'0.5rem' }}>{sess.title}</h3>
                                                        {sess.session_date && <p style={{ color:'#64748b', fontSize:'0.85rem', marginBottom:'1rem', fontWeight:600 }}>📅 {sess.session_date}</p>}
                                                        {sess.description && <p style={{ color:'#94a3b8', fontSize:'0.82rem', lineHeight:1.5, marginBottom:'1rem' }}>{sess.description}</p>}

                                                        <div style={{ marginTop:'auto', display:'flex', flexDirection:'column', gap:'10px' }}>
                                                            {/* PDF Download */}
                                                            {sess.pdf_url && (() => {
                                                                const getDirectDownloadLink = (url) => {
                                                                    if (!url) return '';
                                                                    const match = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
                                                                    if (match && match[1]) {
                                                                        return `https://drive.google.com/uc?export=download&id=${match[1]}`;
                                                                    }
                                                                    return url;
                                                                };
                                                                return (
                                                                    <a href={getDirectDownloadLink(sess.pdf_url)} target="_blank" rel="noopener noreferrer"
                                                                        style={{ ...btn('rgba(245,158,11,0.1)', '#d97706'), width:'100%', textDecoration:'none', display:'flex', alignItems:'center', justifyContent:'center', gap:'8px', border:'1.5px solid rgba(245,158,11,0.2)' }}>
                                                                        <i className="fa-solid fa-file-pdf" /> Download Materials
                                                                    </a>
                                                                );
                                                            })()}

                                                            {/* Zoom Link - Only show if NO video is uploaded */}
                                                            {hasZoom && !hasVideo && (
                                                                <a 
                                                                    href={sess.zoom_link} 
                                                                    target="_blank" rel="noopener noreferrer"
                                                                    style={{ ...btn('#3b82f6'), width:'100%', textDecoration:'none', display:'flex', alignItems:'center', justifyContent:'center', gap:'8px' }}
                                                                >
                                                                    <i className="fa-solid fa-video" /> Join Live Class
                                                                </a>
                                                            )}

                                                            {/* YouTube Video Link */}
                                                            {hasVideo && (
                                                                <button 
                                                                    onClick={() => handleWatchRecording(sess)}
                                                                    disabled={!canWatch}
                                                                    style={{ ...btn(canWatch ? 'linear-gradient(135deg,#ef4444,#dc2626)' : '#cbd5e1'), width:'100%', display:'flex', alignItems:'center', justifyContent:'center', gap:'8px' }}
                                                                >
                                                                    <i className="fa-brands fa-youtube" style={{ fontSize:'1.1rem' }} /> 
                                                                    {canWatch ? 'Watch Recording' : 'Recording Locked'}
                                                                </button>
                                                            )}

                                                            {/* Request Recording Button (For Physical Students) */}
                                                            {isPhysical() && hasVideo && !canWatch && (
                                                                <button 
                                                                    onClick={() => handleRequestRecording(sess)} 
                                                                    style={{ width:'100%', padding:'10px', borderRadius:'12px', border:'2px solid rgba(168,85,247,0.3)', background:'transparent', color: requested ? '#64748b' : '#a855f7', fontSize:'0.85rem', fontWeight:800, cursor: requested ? 'default' : 'pointer', fontFamily:'inherit' }}
                                                                >
                                                                    {approved ? '✅ Approved' : requested ? '⏳ Requested...' : '📩 Request Recording'}
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        )}
                    </motion.div>
                )}
                {/* ══ MY PAPERS ══ */}
                {activeTab === 'papers' && (
                    <motion.div variants={cv} initial="hidden" animate="visible">
                        <div className="dash-section-header">
                            <h1 className="dash-section-title">📝 My Papers & Marks</h1>
                            <p style={{ color:'#64748b', marginTop:'4px' }}>Your revision paper results — all in one place.</p>
                        </div>

                        {papers.length === 0 ? (
                            <div style={{ textAlign:'center', padding:'4rem', color:'#94a3b8', background:'#fff', borderRadius:'20px', marginTop:'1.5rem' }}>
                                <i className="fa-solid fa-file-pen" style={{ fontSize:'3rem', marginBottom:'1rem', display:'block' }} />
                                No papers have been created yet. Check back after your next revision class!
                            </div>
                        ) : (
                            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(240px,1fr))', gap:'1.5rem', marginTop:'1.5rem' }}>
                                {papers.map((paper, idx) => {
                                    const mark = myMarks.find(m => m.paper_id === paper.id);
                                    const isAB = mark?.is_absent;
                                    const score = mark?.marks;
                                    return (
                                        <motion.div key={paper.id} variants={iv}
                                            style={{ background:'#fff', borderRadius:'20px', padding:'1.5rem', border:`1.5px solid ${isAB ? 'rgba(239,68,68,0.2)' : mark ? 'rgba(168,85,247,0.15)' : '#f1f5f9'}`, boxShadow:'0 4px 20px rgba(0,0,0,0.03)' }}>
                                            <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'1.2rem' }}>
                                                <div style={{ background: isAB ? 'rgba(239,68,68,0.1)' : mark ? 'rgba(168,85,247,0.1)' : '#f8fafc', color: isAB ? '#ef4444' : mark ? '#a855f7' : '#94a3b8', width:'40px', height:'40px', borderRadius:'12px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.1rem' }}>
                                                    <i className={`fa-solid ${isAB ? 'fa-user-slash' : mark ? 'fa-check' : 'fa-hourglass-half'}`} />
                                                </div>
                                                <div>
                                                    <div style={{ fontWeight:800, color:'#0f172a', fontSize:'0.95rem' }}>{paper.title}</div>
                                                    <div style={{ color:'#94a3b8', fontSize:'0.75rem' }}>{new Date(paper.created_at).toLocaleDateString()}</div>
                                                </div>
                                                <div style={{ marginLeft:'auto', fontSize:'0.72rem', fontWeight:700, padding:'3px 10px', borderRadius:'8px', background: isAB ? 'rgba(239,68,68,0.08)' : mark ? 'rgba(16,185,129,0.08)' : 'rgba(100,116,139,0.08)', color: isAB ? '#ef4444' : mark ? '#10b981' : '#94a3b8' }}>
                                                    {isAB ? 'ABSENT' : mark ? 'MARKED' : 'PENDING'}
                                                </div>
                                            </div>
                                            <div style={{ textAlign:'center', padding:'1.2rem 0', borderTop:'1px solid #f1f5f9' }}>
                                                <div style={{ fontSize:'3rem', fontWeight:900, color: isAB ? '#ef4444' : mark ? '#a855f7' : '#e2e8f0', lineHeight:1 }}>
                                                    {isAB ? 'AB' : score !== null && score !== undefined ? score : '—'}
                                                </div>
                                                <div style={{ color:'#94a3b8', fontSize:'0.8rem', marginTop:'6px' }}>
                                                    {isAB ? 'Absent' : mark ? 'marks scored' : 'Not marked yet'}
                                                </div>
                                            </div>
                                            {idx > 0 && (() => {
                                                const prevMark = myMarks.find(m => m.paper_id === papers[idx-1].id);
                                                if (!prevMark || !mark || isAB || prevMark.is_absent) return null;
                                                const diff = (score ?? 0) - (prevMark.marks ?? 0);
                                                return (
                                                    <div style={{ marginTop:'0.8rem', display:'flex', alignItems:'center', justifyContent:'center', gap:'6px', fontSize:'0.8rem', fontWeight:700, color: diff >= 0 ? '#10b981' : '#ef4444' }}>
                                                        <i className={`fa-solid fa-arrow-${diff >= 0 ? 'up' : 'down'}`} />
                                                        {Math.abs(diff)} pts from previous paper
                                                    </div>
                                                );
                                            })()}
                                        </motion.div>
                                    );
                                })}
                            </div>
                        )}
                    </motion.div>
                )}

                {/* ══ LEADERBOARD ══ */}
                {activeTab === 'leaderboard' && (
                    <motion.div variants={cv} initial="hidden" animate="visible">
                        <div className="dash-section-header">
                            <h1 className="dash-section-title">🏆 Leaderboard</h1>
                        </div>
                        <div style={{ background:'#fff', borderRadius:'24px', overflow:'hidden', boxShadow:'0 4px 20px rgba(0,0,0,0.03)', border:'1px solid #f1f5f9', marginTop:'1.5rem' }}>
                            <table style={{ width:'100%', borderCollapse:'collapse' }}>
                                <thead style={{ background:'linear-gradient(135deg,#a855f7,#7c3aed)', color:'#fff', fontSize:'0.85rem', textTransform:'uppercase' }}>
                                    <tr>
                                        {['Rank','Name','School','XP Points'].map(h => (
                                            <th key={h} style={{ padding:'1rem 1.2rem', textAlign:'left', fontWeight:800 }}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {leaderboard.map((p, i) => (
                                        <motion.tr key={i} variants={iv} style={{ borderBottom:'1px solid #f8fafc', background: p.full_name === meta.full_name ? 'rgba(168,85,247,0.04)' : '#fff' }}>
                                            <td style={{ padding:'1rem 1.2rem', fontWeight:900, color: i === 0 ? '#f59e0b' : i === 1 ? '#94a3b8' : i === 2 ? '#cd7c2f' : '#64748b', fontSize:'1.1rem' }}>
                                                {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i+1}`}
                                            </td>
                                            <td style={{ padding:'1rem 1.2rem', fontWeight:700, color:'#0f172a' }}>
                                                {p.full_name} {p.full_name === meta.full_name && <span style={{ background:'rgba(168,85,247,0.1)', color:'#a855f7', fontSize:'0.72rem', padding:'2px 8px', borderRadius:'6px', marginLeft:'6px' }}>You</span>}
                                            </td>
                                            <td style={{ padding:'1rem 1.2rem', color:'#64748b', fontSize:'0.88rem' }}>{p.school_name || '—'}</td>
                                            <td style={{ padding:'1rem 1.2rem', fontWeight:800, color:'#10b981', fontSize:'1.1rem' }}>{p.xp_points || 0} XP</td>
                                        </motion.tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </motion.div>
                )}

                {/* ══ PROFILE ══ */}
                {activeTab === 'profile' && (
                    <motion.div variants={cv} initial="hidden" animate="visible" style={{ maxWidth:'700px' }}>
                        <div className="dash-section-header">
                            <h1 className="dash-section-title">👤 My Profile</h1>
                        </div>
                        <div style={{ background:'#fff', borderRadius:'24px', padding:'2rem', boxShadow:'0 4px 20px rgba(0,0,0,0.03)', border:'1px solid #f1f5f9', marginTop:'1.5rem' }}>
                            <div style={{ display:'flex', alignItems:'center', gap:'1.5rem', marginBottom:'2rem', paddingBottom:'2rem', borderBottom:'1px solid #e2e8f0' }}>
                                {/* Avatar Read-only */}
                                {meta.avatar_url ? (
                                    <img src={meta.avatar_url} alt="avatar" style={{ width:'80px', height:'80px', borderRadius:'20px', objectFit:'cover', border:'3px solid rgba(168,85,247,0.3)' }} />
                                ) : (
                                    <div style={{ width:'80px', height:'80px', borderRadius:'20px', background:'linear-gradient(135deg,#a855f7,#7c3aed)', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontSize:'2rem', fontWeight:900 }}>
                                        {firstName.charAt(0).toUpperCase()}
                                    </div>
                                )}
                                <div>
                                    <div style={{ fontWeight:800, color:'#0f172a', fontSize:'1.4rem' }}>{meta.full_name || 'Student'}</div>
                                    <div style={{ color:'#64748b', fontSize:'0.9rem', marginBottom:'6px' }}>{user.email}</div>
                                    <div style={{ display:'flex', gap:'8px' }}>
                                        <span style={{ background:'rgba(168,85,247,0.1)', color:'#a855f7', padding:'4px 12px', borderRadius:'8px', fontSize:'0.75rem', fontWeight:700 }}>{meta.batch || '2026'} Batch</span>
                                        <span style={{ background: isPhysical() ? 'rgba(16,185,129,0.1)' : 'rgba(59,130,246,0.1)', color: isPhysical() ? '#10b981' : '#3b82f6', padding:'4px 12px', borderRadius:'8px', fontSize:'0.75rem', fontWeight:700 }}>{meta.student_type || 'Online'} Student</span>
                                    </div>
                                </div>
                            </div>
                            
                            <h3 style={{ fontSize:'1rem', fontWeight:800, color:'#0f172a', marginBottom:'1.5rem', display:'flex', alignItems:'center', gap:'8px' }}>
                                <i className="fa-solid fa-address-card" style={{ color:'#a855f7' }} /> Personal Information
                            </h3>

                            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(250px, 1fr))', gap:'1.5rem', marginBottom:'2rem' }}>
                                {[
                                    { label:'Full Name', value: meta.full_name, icon:'fa-user' },
                                    { label:'NIC Number', value: meta.nic, icon:'fa-id-card' },
                                    { label:'Gender', value: meta.gender, icon:'fa-venus-mars' },
                                    { label:'School Name', value: meta.school_name, icon:'fa-school' },
                                    { label:'District', value: meta.district, icon:'fa-map-location-dot' },
                                    { label:'Province', value: meta.province, icon:'fa-map' },
                                    { label:'Guardian Phone', value: meta.guardian_phone, icon:'fa-phone' },
                                    { label:'Class Type', value: meta.class_type, icon:'fa-chalkboard' },
                                ].map((item, i) => (
                                    <div key={i} style={{ background:'rgba(241,245,249,0.5)', padding:'12px 16px', borderRadius:'12px', border:'1px solid #e2e8f0' }}>
                                        <span style={{ display:'block', fontSize:'0.75rem', fontWeight:700, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:'4px' }}>
                                            <i className={`${item.isBrand ? 'fa-brands' : 'fa-solid'} ${item.icon}`} style={{ marginRight:'6px' }} /> {item.label}
                                        </span>
                                        <span style={{ display:'block', fontSize:'0.95rem', fontWeight:600, color:'#0f172a' }}>
                                            {item.value || 'Not provided'}
                                        </span>
                                    </div>
                                ))}
                            </div>
                            
                            <p style={{ fontSize:'0.8rem', color:'#94a3b8', textAlign:'center', marginTop:'1rem', marginBottom:'1.5rem' }}>
                                To update your profile information, please contact the administrator.
                            </p>

                            <button onClick={handleLogout} style={{ ...btn('rgba(239,68,68,0.08)', '#ef4444'), width: '100%', padding: '12px' }}>
                                <i className="fa-solid fa-arrow-right-from-bracket" style={{ marginRight:'8px' }} /> Logout
                            </button>
                        </div>
                    </motion.div>
                )}
                {/* ── Beautiful Footer ── */}
                <footer style={{ width:'100%', padding:'3rem 2rem 2rem', marginTop:'auto', background:'linear-gradient(to bottom, transparent, rgba(15,23,42,0.02))', borderTop:'1px solid rgba(15,23,42,0.05)' }}>
                    <div style={{ maxWidth:'1200px', margin:'0 auto', display:'flex', flexDirection:'column', alignItems:'center', gap:'1.5rem' }}>
                        <div style={{ display:'flex', alignItems:'center', gap:'10px', fontSize:'1.5rem', fontWeight:900, color:'#0f172a', letterSpacing:'-0.5px' }}>
                            <div style={{ background:'linear-gradient(135deg,#a855f7,#7c3aed)', width:'32px', height:'32px', borderRadius:'10px', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontSize:'1rem' }}>
                                <i className="fa-solid fa-graduation-cap" />
                            </div>
                            RDICT<span style={{ color:'#a855f7' }}>.</span>
                        </div>
                        <p style={{ color:'#64748b', fontSize:'0.9rem', maxWidth:'400px', textAlign:'center', lineHeight:1.6, margin:0 }}>
                            Empowering the next generation of technologists. Learn, grow, and build the future with premium computer science education.
                        </p>
                        <div style={{ display:'flex', gap:'20px', marginTop:'0.5rem' }}>
                            {['fa-facebook', 'fa-youtube', 'fa-whatsapp', 'fa-instagram'].map(icon => (
                                <a key={icon} href="#" style={{ color:'#94a3b8', fontSize:'1.2rem', transition:'0.3s', textDecoration:'none' }} onMouseOver={e=>e.target.style.color='#a855f7'} onMouseOut={e=>e.target.style.color='#94a3b8'}>
                                    <i className={`fa-brands ${icon}`} />
                                </a>
                            ))}
                        </div>
                        <div style={{ width:'100%', height:'1px', background:'linear-gradient(90deg, transparent, rgba(15,23,42,0.1), transparent)', margin:'1rem 0' }} />
                        <div style={{ display:'flex', flexWrap:'wrap', justifyContent:'center', gap:'20px', color:'#94a3b8', fontSize:'0.8rem', fontWeight:600 }}>
                            <span>&copy; {new Date().getFullYear()} RDICT LMS. All rights reserved.</span>
                            <span style={{ opacity:0.5 }}>•</span>
                            <span style={{ color:'#0f172a' }}>Developed by Hansaka Franando</span>
                        </div>
                    </div>
                </footer>
            </main>

            {/* ── Session Detail Modal ── */}
            <AnimatePresence>
                {selectedSession && (() => {
                    const sess = selectedSession;
                    const hasVideo = !!sess.video_id;
                    const hasZoom = !!sess.zoom_link;
                    const canWatch = canWatchSession(sess);
                    const requested = hasRequested(sess.id);
                    const approved = isRecordingApproved(sess.id);
                    const thumb = sess.unit_no ? UNIT_THUMBS[sess.unit_no] : null;
                    return (
                        <div style={{ position:'fixed', inset:0, zIndex:950, display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem' }}>
                            <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
                                onClick={() => setSelectedSession(null)}
                                style={{ position:'absolute', inset:0, background:'rgba(15,23,42,0.6)', backdropFilter:'blur(12px)' }} />
                            <motion.div initial={{ opacity:0, scale:0.92, y:24 }} animate={{ opacity:1, scale:1, y:0 }} exit={{ opacity:0, scale:0.92, y:24 }}
                                style={{ position:'relative', width:'100%', maxWidth:'520px', background:'#fff', borderRadius:'28px', overflow:'hidden', boxShadow:'0 30px 80px rgba(0,0,0,0.2)' }}>
                                {/* Thumbnail Banner */}
                                <div style={{ height:'200px', background: thumb ? `url(${thumb}) center/cover` : 'linear-gradient(135deg,#a855f7,#3b82f6)', position:'relative' }}>
                                    <div style={{ position:'absolute', inset:0, background:'linear-gradient(to bottom, transparent 40%, rgba(0,0,0,0.7))' }} />
                                    <button onClick={() => setSelectedSession(null)} style={{ position:'absolute', top:'14px', right:'14px', background:'rgba(255,255,255,0.2)', border:'none', borderRadius:'50%', width:'36px', height:'36px', cursor:'pointer', color:'#fff', fontSize:'1rem', backdropFilter:'blur(6px)' }}>
                                        <i className="fa-solid fa-xmark" />
                                    </button>
                                    <div style={{ position:'absolute', bottom:'16px', left:'20px', right:'20px' }}>
                                        <div style={{ display:'flex', gap:'6px', marginBottom:'6px', flexWrap:'wrap' }}>
                                            <span style={{ background: hasVideo ? '#ef4444' : hasZoom ? '#3b82f6' : '#64748b', color:'#fff', padding:'3px 10px', borderRadius:'6px', fontSize:'0.68rem', fontWeight:800 }}>
                                                {hasVideo ? '🎬 Recorded' : hasZoom ? '🎥 Live Class' : '📅 Upcoming'}
                                            </span>
                                            {sess.pdf_url && <span style={{ background:'#f59e0b', color:'#fff', padding:'3px 10px', borderRadius:'6px', fontSize:'0.68rem', fontWeight:800 }}>📄 PDF Materials</span>}
                                        </div>
                                        <h2 style={{ color:'#fff', fontWeight:900, fontSize:'1.2rem', margin:0, textShadow:'0 2px 8px rgba(0,0,0,0.3)' }}>{sess.title}</h2>
                                    </div>
                                </div>

                                {/* Content */}
                                <div style={{ padding:'1.5rem', display:'flex', flexDirection:'column', gap:'12px' }}>
                                    {sess.session_date && (
                                        <div style={{ display:'flex', alignItems:'center', gap:'8px', color:'#64748b', fontSize:'0.88rem', fontWeight:600 }}>
                                            <i className="fa-solid fa-calendar-days" style={{ color:'#a855f7' }} /> {sess.session_date}
                                            {sess.unit_no && <span style={{ marginLeft:'8px', background:'rgba(168,85,247,0.1)', color:'#a855f7', padding:'2px 8px', borderRadius:'6px', fontSize:'0.78rem', fontWeight:800 }}>Unit {sess.unit_no}</span>}
                                        </div>
                                    )}
                                    {sess.description && <p style={{ color:'#475569', fontSize:'0.9rem', lineHeight:1.6, margin:0 }}>{sess.description}</p>}

                                    {/* PDF Download */}
                                    {sess.pdf_url && (
                                        <a href={sess.pdf_url} target="_blank" rel="noopener noreferrer"
                                            style={{ display:'flex', alignItems:'center', gap:'10px', padding:'14px 18px', background:'rgba(245,158,11,0.08)', borderRadius:'14px', border:'1.5px solid rgba(245,158,11,0.25)', textDecoration:'none', color:'#d97706', fontWeight:700, fontSize:'0.95rem' }}>
                                            <i className="fa-solid fa-file-pdf" style={{ fontSize:'1.2rem' }} />
                                            <div>
                                                <div>Download Class Materials</div>
                                                <div style={{ fontSize:'0.75rem', color:'#92400e', fontWeight:500 }}>PDF — Tap to open / download</div>
                                            </div>
                                            <i className="fa-solid fa-arrow-down" style={{ marginLeft:'auto' }} />
                                        </a>
                                    )}

                                    {/* Action Buttons */}
                                    <div style={{ display:'flex', flexDirection:'column', gap:'10px', marginTop:'4px' }}>
                                        {hasZoom && !hasVideo && (
                                            <a href={sess.zoom_link} target="_blank" rel="noopener noreferrer"
                                                style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'10px', padding:'14px', background:'linear-gradient(135deg,#3b82f6,#1d4ed8)', color:'#fff', borderRadius:'14px', textDecoration:'none', fontWeight:800, fontSize:'1rem' }}>
                                                <i className="fa-solid fa-video" /> Join Live Class on Zoom
                                            </a>
                                        )}
                                        {hasVideo && (
                                            <button onClick={() => { setSelectedSession(null); handleWatchRecording(sess); }}
                                                disabled={!canWatch}
                                                style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'10px', padding:'14px', background: canWatch ? 'linear-gradient(135deg,#ef4444,#dc2626)' : '#e2e8f0', color: canWatch ? '#fff' : '#94a3b8', borderRadius:'14px', border:'none', fontWeight:800, fontSize:'1rem', cursor: canWatch ? 'pointer' : 'default', fontFamily:'inherit' }}>
                                                <i className="fa-brands fa-youtube" style={{ fontSize:'1.2rem' }} />
                                                {canWatch ? 'Watch Recording' : '🔒 Recording Locked'}
                                            </button>
                                        )}
                                        {isPhysical() && hasVideo && !canWatch && (
                                            <button onClick={() => { handleRequestRecording(sess); setSelectedSession(null); }}
                                                style={{ padding:'12px', borderRadius:'14px', border:'2px solid rgba(168,85,247,0.3)', background:'transparent', color: requested ? '#64748b' : '#a855f7', fontSize:'0.9rem', fontWeight:800, cursor: requested ? 'default' : 'pointer', fontFamily:'inherit' }}>
                                                {approved ? '✅ Recording Approved' : requested ? '⏳ Request Pending...' : '📩 Request Recording Access'}
                                            </button>
                                        )}
                                        {!hasVideo && !hasZoom && (
                                            <div style={{ textAlign:'center', padding:'1rem', color:'#94a3b8', fontSize:'0.88rem' }}>
                                                <i className="fa-solid fa-hourglass-half" style={{ marginRight:'6px' }} />This session hasn't started yet.
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    );
                })()}
            </AnimatePresence>

            {/* ── Slip Upload Modal ── */}
            <AnimatePresence>
                {uploadModalOpen && selectedClass && (
                    <div style={{ position:'fixed', inset:0, zIndex:900, display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem' }}>
                        <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
                            onClick={() => setUploadModalOpen(false)}
                            style={{ position:'absolute', inset:0, background:'rgba(15,23,42,0.5)', backdropFilter:'blur(10px)' }} />
                        <motion.div initial={{ opacity:0, scale:0.9, y:20 }} animate={{ opacity:1, scale:1, y:0 }} exit={{ opacity:0, scale:0.9, y:20 }}
                            style={{ position:'relative', width:'100%', maxWidth:'460px', background:'#fff', borderRadius:'24px', padding:'2rem', overflow:'hidden' }}>
                            <div style={{ position:'absolute', top:0, left:0, width:'100%', height:'4px', background:'linear-gradient(90deg,#a855f7,#3b82f6)' }} />
                            <h2 style={{ fontWeight:800, color:'#0f172a', marginBottom:'0.3rem' }}>Enroll: {selectedClass.title}</h2>
                            <p style={{ color:'#64748b', marginBottom:'1.5rem', fontSize:'0.9rem' }}>Upload your payment receipt. Admin will review and unlock your access.</p>
                            <div style={{ background:'rgba(168,85,247,0.05)', border:'1px dashed rgba(168,85,247,0.3)', borderRadius:'16px', padding:'2rem', textAlign:'center', marginBottom:'1.5rem', cursor:'pointer' }}
                                onClick={() => document.getElementById('slip-input').click()}>
                                <input id="slip-input" type="file" accept="image/*,.pdf" style={{ display:'none' }} onChange={e => setSlipFile(e.target.files[0])} />
                                {slipFile ? (
                                    <div><i className="fa-solid fa-check-circle" style={{ color:'#10b981', fontSize:'2rem' }} /><p style={{ color:'#10b981', fontWeight:700, marginTop:'8px' }}>{slipFile.name}</p></div>
                                ) : (
                                    <div><i className="fa-solid fa-cloud-arrow-up" style={{ color:'#a855f7', fontSize:'2rem' }} /><p style={{ color:'#64748b', marginTop:'8px' }}>Click to browse slip / receipt</p></div>
                                )}
                            </div>
                            <p style={{ fontSize:'0.8rem', color:'#f59e0b', marginBottom:'1.5rem', fontWeight:600 }}>
                                💳 Fee: <strong>Rs. {selectedClass.price}/month</strong>
                            </p>
                            <div style={{ display:'flex', gap:'10px' }}>
                                <button onClick={() => setUploadModalOpen(false)} style={{ ...btn('#f8fafc', '#64748b'), flex:1 }}>Cancel</button>
                                <button onClick={handleSlipSubmit} disabled={!slipFile || slipUploading} style={{ ...btn(slipFile && !slipUploading ? 'linear-gradient(135deg,#a855f7,#7c3aed)' : '#94a3b8'), flex:1 }}>
                                    {slipUploading ? 'Submitting...' : 'Submit Slip'}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {modal.show && (
                    <div style={{ position:'fixed', inset:0, zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem' }}>
                        <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
                            onClick={() => setModal({ ...modal, show:false })}
                            style={{ position:'absolute', inset:0, background:'rgba(15,23,42,0.4)', backdropFilter:'blur(8px)' }} />
                        <motion.div initial={{ opacity:0, scale:0.9, y:20 }} animate={{ opacity:1, scale:1, y:0 }} exit={{ opacity:0, scale:0.9, y:20 }}
                            style={{ position:'relative', width:'100%', maxWidth:'420px', background:'#fff', borderRadius:'24px', padding:'2rem', boxShadow:'0 25px 50px rgba(0,0,0,0.2)', overflow:'hidden' }}>
                            <div style={{ position:'absolute', top:0, left:0, width:'100%', height:'4px', background: modal.type === 'confirm' ? '#a855f7' : '#ef4444' }} />
                            <h2 style={{ fontWeight:800, color:'#0f172a', marginBottom:'0.5rem' }}>{modal.title}</h2>
                            <p style={{ color:'#64748b', lineHeight:1.6, marginBottom:'2rem' }}>{modal.message}</p>
                            <div style={{ display:'flex', gap:'12px', justifyContent:'flex-end' }}>
                                <button onClick={() => setModal({ ...modal, show:false })} style={{ padding:'10px 20px', borderRadius:'12px', border:'1.5px solid #e2e8f0', background:'none', color:'#64748b', fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
                                    {modal.type === 'confirm' ? 'Cancel' : 'Close'}
                                </button>
                                {modal.type === 'confirm' && (
                                    <button onClick={() => { modal.onConfirm(); setModal({ ...modal, show:false }); }}
                                        style={{ padding:'10px 24px', borderRadius:'12px', border:'none', background:'#a855f7', color:'#fff', fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
                                        Proceed
                                    </button>
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* ── Premium Toast ── */}
            <AnimatePresence>
                {toast.show && (
                    <motion.div initial={{ opacity:0, y:50, x:'-50%' }} animate={{ opacity:1, y:0, x:'-50%' }} exit={{ opacity:0, y:20, x:'-50%' }}
                        style={{ position:'fixed', bottom:'40px', left:'50%', zIndex:2000, background:'#0f172a', color:'#fff', padding:'12px 24px', borderRadius:'100px', display:'flex', alignItems:'center', gap:'10px', boxShadow:'0 20px 25px rgba(0,0,0,0.2)', border:'1px solid rgba(168,85,247,0.2)', whiteSpace:'nowrap', fontFamily:'inherit' }}>
                        <i className={`fa-solid ${toast.type === 'success' ? 'fa-circle-check' : 'fa-circle-exclamation'}`} style={{ color: toast.type === 'success' ? '#10b981' : '#ef4444' }} />
                        <span style={{ fontWeight:600, fontSize:'0.9rem' }}>{toast.message}</span>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── SECURITY FULLSCREEN VIDEO PLAYER ── */}
            {activeSession && activeSession.video_id && (
                <div style={{ position:'fixed', inset:0, zIndex:999999, background:'#000' }}>
                    <ProtectedVideoPlayer
                        key={activeSession.id}
                        videoId={activeSession.video_id}
                        title={activeSession.title}
                        resumeTime={sessionResumeTimes[activeSession.id] || 0}
                        onClose={() => {
                            if (document.exitFullscreen) document.exitFullscreen().catch(()=>{});
                            else if (document.webkitExitFullscreen) document.webkitExitFullscreen().catch(()=>{});
                            setActiveSession(null);
                        }}
                        onTimeUpdate={(t) => handleTimeUpdate(activeSession.id, t)}
                        userName={meta.full_name || ''}
                        userEmail={user?.email || ''}
                    />
                </div>
            )}

        </div>
    );
};

export default Dashboard;
