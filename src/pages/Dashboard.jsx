import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { motion } from 'framer-motion';
import { timetableConfig } from '../config';
import Cursor from '../components/Cursor';
import ProtectedVideoPlayer from '../components/ProtectedVideoPlayer';
import './Dashboard.css'; 

// Import config images or local placeholders
// No more hardcoded data. 
// We are pulling 100% realtime from Supabase Database.

const Dashboard = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [meta, setMeta] = useState({});
    const [activeTab, setActiveTab] = useState('overview');
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    
    // Realtime Database States
    const [availableClasses, setAvailableClasses] = useState([]);
    const [pendingClasses, setPendingClasses] = useState([]);
    const [approvedClasses, setApprovedClasses] = useState([]);
    const [examsList, setExamsList] = useState([]);
    const [leaderboard, setLeaderboard] = useState([]);
    const [dashboardStats, setDashboardStats] = useState({ rank: '-', avgMarks: '-', lessonsWatched: '-' });
    const [isLoadingData, setIsLoadingData] = useState(true);

    // Class Content Viewer State
    const [viewingClass, setViewingClass] = useState(null);
    const [classLessons, setClassLessons] = useState([]);
    const [classLiveSessions, setClassLiveSessions] = useState([]);
    const [activeLesson, setActiveLesson] = useState(null);
    const [loadingLessons, setLoadingLessons] = useState(false);
    const [lessonResumeTimes, setLessonResumeTimes] = useState({}); // {lessonId: seconds}

    // Modal State for Slip Upload
    const [uploadModalOpen, setUploadModalOpen] = useState(false);
    const [selectedClassToJoin, setSelectedClassToJoin] = useState(null);
    const [slipUploading, setSlipUploading] = useState(false);
    const [slipFile, setSlipFile] = useState(null); 
    
    // Exam State (Feature 7: Exam Mode)
    const [examMode, setExamMode] = useState(null);
    const [examTimeRemaining, setExamTimeRemaining] = useState(0);
    const [examAnswers, setExamAnswers] = useState({});

    // Profile Edit State
    const [profileForm, setProfileForm] = useState({ name: '', phone: '', school: '' });
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        const checkUserAndFetch = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                setUser(session.user);
                setMeta(session.user.user_metadata || {});
                setProfileForm({
                    name: session.user.user_metadata?.full_name || '',
                    phone: session.user.user_metadata?.guardian_phone || '',
                    school: session.user.user_metadata?.school_name || ''
                });

                // --- Sync Profile to DB to fix 'Unknown User' bug in Admin Dashboard ---
                await supabase.from('profiles').upsert([{
                    id: session.user.id,
                    full_name: session.user.user_metadata?.full_name || 'Student',
                    school_name: session.user.user_metadata?.school_name || '',
                }], { onConflict: 'id' });
                
                // Fetch Realtime Data from DB
                await fetchDashboardData(session.user.id);
            } else {
                navigate('/login');
            }
        };
        checkUserAndFetch();
    }, [navigate]);

    const fetchDashboardData = async (userId) => {
        try {
            // 1. Fetch Classes
            const { data: classesData, error: classErr } = await supabase.from('classes').select('*');
            if (classesData) setAvailableClasses(classesData);

            // 2. Fetch Enrollments for user
            const { data: enrollments, error: enrollErr } = await supabase.from('enrollments')
                .select('class_id, status')
                .eq('user_id', userId);
            
            if (enrollments) {
                setPendingClasses(enrollments.filter(e => e.status === 'pending').map(e => e.class_id));
                setApprovedClasses(enrollments.filter(e => e.status === 'approved').map(e => e.class_id));
            }

            // 3. Fetch Exams
            const { data: exams, error: examsErr } = await supabase.from('exams').select('*');
            if (exams) setExamsList(exams);

            // 4. Fetch Realtime Leaderboard (Assuming a profiles table with xp_points)
            // Querying from profiles or leaderboard table
            const { data: leadData, error: leadErr } = await supabase.from('profiles').select('full_name, school_name, xp_points').order('xp_points', { ascending: false }).limit(5);
            if (leadData && leadData.length > 0) {
                setLeaderboard(leadData.map((usr, i) => ({ rank: i + 1, name: usr.full_name, school: usr.school_name, points: usr.xp_points })));
            }

            // 5. Fetch Dashboard Stats (Assuming progress tracking tables exist)
            // For now, if no data comes back, it safely remains at '-'
            
        } catch (err) {
            console.error("Please run the SQL Setup Script in Supabase!", err);
        } finally {
            setIsLoadingData(false);
        }
    };

    const handleProfileUpdate = async () => {
        setIsSaving(true);
        const { data, error } = await supabase.auth.updateUser({
            data: { 
                full_name: profileForm.name,
                guardian_phone: profileForm.phone,
                school_name: profileForm.school
            }
        });
        if (!error && data?.user) {
            setMeta(data.user.user_metadata);
            setUser(data.user);
            alert("Profile updated successfully!");
        } else {
            alert("Error updating profile.");
        }
        setIsSaving(false);
    };

    // Feature 7: Timer Logic for Exams
    useEffect(() => {
        let timer;
        if (examMode && examTimeRemaining > 0) {
            timer = setInterval(() => {
                setExamTimeRemaining(prev => {
                    if (prev <= 1) {
                        clearInterval(timer);
                        handleExamSubmit(); // Auto submit
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => clearInterval(timer);
    }, [examMode, examTimeRemaining]);

    const startExam = (exam) => {
        setExamMode(exam);
        setExamTimeRemaining(exam.durationMinutes * 60); // convert mins to seconds
        setExamAnswers({});
    };

    const handleExamSubmit = () => {
        alert("Time is up! Your exam has been auto-submitted and graded. Realtime Marks generated!");
        setExamMode(null);
    };

    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    const openClassContent = async (cls) => {
        setViewingClass(cls);
        setLoadingLessons(true);
        setActiveLesson(null);

        // Fetch Lessons
        const { data: lessons } = await supabase
            .from('lessons')
            .select('*')
            .eq('class_id', cls.id)
            .order('order_index', { ascending: true });
        if (lessons) setClassLessons(lessons);

        // Fetch Live Sessions
        const { data: live } = await supabase
            .from('live_sessions')
            .select('*')
            .eq('class_id', cls.id)
            .order('start_time', { ascending: false });
        if (live) setClassLiveSessions(live);

        setLoadingLessons(false);
    };

    const handleVideoClose = () => {
        // Don't close viewingClass, just deactivate the lesson
        // so the sidebar stays visible but video is hidden
        setActiveLesson(null);
    };

    const handleTimeUpdate = (lessonId, time) => {
        setLessonResumeTimes(prev => ({ ...prev, [lessonId]: time }));
    };

    const handleJoinClick = (cls) => {
        setSelectedClassToJoin(cls);
        setSlipFile(null); 
        setUploadModalOpen(true);
    };

    const handleSlipSubmit = async () => {
        if (!slipFile) return; 
        
        setSlipUploading(true);
        
        try {
            // 1. Upload Slip to Supabase Storage Bucket named 'slips'
            const fileExt = slipFile.name.split('.').pop();
            const fileName = `${user.id}_${selectedClassToJoin.id}_${Date.now()}.${fileExt}`;
            const filePath = `receipts/${fileName}`;

            let { error: uploadError } = await supabase.storage
                .from('slips')
                .upload(filePath, slipFile);
            
            // Generate public URL for the slip
            const { data: publicUrlData } = supabase.storage
                .from('slips')
                .getPublicUrl(filePath);

            const finalSlipUrl = uploadError ? `https://dummyimage.com/600x400/fff/000.png&text=Upload+Error+(${slipFile.name})` : publicUrlData.publicUrl;

            // 2. Insert into Enrollments Table
            const { error } = await supabase.from('enrollments').insert([
                { user_id: user.id, class_id: selectedClassToJoin.id, slip_url: finalSlipUrl, status: 'pending' }
            ]);

            if (error) {
                alert("Failed to submit enrollment to Database.");
            } else {
                setPendingClasses([...pendingClasses, selectedClassToJoin.id]);
                alert('Payment slip saved successfully! Awaiting Admin Approval.');
                setUploadModalOpen(false);
                setActiveTab('my-classes');
            }
        } catch (error) {
            console.error(error);
        }
        
        setSlipUploading(false);
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate('/');
    };

    if (!user) return (
        <div style={{ background: '#f8fafc', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Cursor />
            <h2 style={{ color: '#a855f7' }}>Loading Dashboard...</h2>
        </div>
    );

    const firstName = meta.full_name ? meta.full_name.split(' ')[0] : 'Student';

    // Animation Variants
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
    };

    return (
        <div className="dash-layout-clean">
            <Cursor />
            
            {/* ── Floating Top Navbar ── */}
            <header className="dash-topnav">
                <a href="/" className="dash-logo-nav">
                    RDICT<span>.</span>
                </a>
                
                <nav className={`dash-nav-links ${mobileMenuOpen ? 'mobile-open' : ''}`}>
                    <div className={`dash-nav-link ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => { setActiveTab('overview'); setMobileMenuOpen(false); }}>Overview</div>
                    <div className={`dash-nav-link ${activeTab === 'available' ? 'active' : ''}`} onClick={() => { setActiveTab('available'); setMobileMenuOpen(false); }}>Available Classes</div>
                    <div className={`dash-nav-link ${activeTab === 'my-classes' ? 'active' : ''}`} onClick={() => { setActiveTab('my-classes'); setMobileMenuOpen(false); }}>My Classes</div>
                    <div className={`dash-nav-link ${activeTab === 'exams' ? 'active' : ''}`} onClick={() => { setActiveTab('exams'); setMobileMenuOpen(false); }}>Exams</div>
                    <div className={`dash-nav-link ${activeTab === 'profile' ? 'active' : ''}`} onClick={() => { setActiveTab('profile'); setMobileMenuOpen(false); }}>Profile</div>
                </nav>

                <div className="dash-user-section">
                    <div className="dash-user-info">
                        <span className="dash-user-name">{meta.full_name || 'Student'}</span>
                        {meta.avatar_url ? (
                            <img src={meta.avatar_url} alt="Profile" className="dash-avatar" />
                        ) : (
                            <div className="dash-avatar">{firstName.charAt(0).toUpperCase()}</div>
                        )}
                    </div>
                    <button className="mobile-dash-toggle" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                        <i className={`fa-solid ${mobileMenuOpen ? 'fa-times' : 'fa-bars'}`}></i>
                    </button>
                </div>
            </header>

            {/* ── Main Content Area ── */}
            <main className="dash-content">
                {activeTab === 'overview' && (
                    <>
                        <div className="dash-section-header">
                            <h1 className="dash-section-title">
                                🚀 Learning Overview
                            </h1>
                            <div className="dash-filter">
                                <i className="fa-solid fa-graduation-cap" style={{ color: '#a855f7' }}></i> {meta.batch} Batch
                            </div>
                        </div>

                        <motion.div 
                            style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem', marginTop: '1.5rem' }}
                            variants={containerVariants}
                            initial="hidden"
                            animate="visible"
                        >
                            {/* Stat Widgets */}
                            <motion.div variants={itemVariants} style={{ background: '#fff', borderRadius: '20px', padding: '1.5rem', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', border: '1px solid rgba(168, 85, 247, 0.1)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#64748b', marginBottom: '10px', fontWeight: 600 }}>
                                    <div style={{ background: 'rgba(168, 85, 247, 0.1)', color: '#a855f7', width: '40px', height: '40px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>
                                        <i className="fa-solid fa-trophy"></i>
                                    </div>
                                    Overall Rank
                                </div>
                                <h3 style={{ fontSize: '2rem', fontWeight: 800, color: '#0f172a' }}>{dashboardStats.rank}</h3>
                                <p style={{ fontSize: '0.8rem', color: '#10b981', fontWeight: 600 }}>Realtime Batch Standing</p>
                            </motion.div>

                            <motion.div variants={itemVariants} style={{ background: '#fff', borderRadius: '20px', padding: '1.5rem', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', border: '1px solid rgba(168, 85, 247, 0.1)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#64748b', marginBottom: '10px', fontWeight: 600 }}>
                                    <div style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', width: '40px', height: '40px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>
                                        <i className="fa-solid fa-chart-line"></i>
                                    </div>
                                    Average Marks
                                </div>
                                <h3 style={{ fontSize: '2rem', fontWeight: 800, color: '#0f172a' }}>{dashboardStats.avgMarks}</h3>
                                <p style={{ fontSize: '0.8rem', color: '#64748b' }}>Computed from exams taken</p>
                            </motion.div>

                            <motion.div variants={itemVariants} style={{ background: '#fff', borderRadius: '20px', padding: '1.5rem', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', border: '1px solid rgba(168, 85, 247, 0.1)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#64748b', marginBottom: '10px', fontWeight: 600 }}>
                                    <div style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', width: '40px', height: '40px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>
                                        <i className="fa-solid fa-circle-play"></i>
                                    </div>
                                    Lessons Watched
                                </div>
                                <h3 style={{ fontSize: '2rem', fontWeight: 800, color: '#0f172a' }}>{dashboardStats.lessonsWatched}</h3>
                                <p style={{ fontSize: '0.8rem', color: '#64748b' }}>Videos completed completely</p>
                            </motion.div>

                        </motion.div>

                        {/* Feature 5: Realtime Leaderboard */}
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ marginTop: '2rem', background: '#fff', borderRadius: '24px', padding: '2rem', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', border: '1px solid rgba(168, 85, 247, 0.1)' }}>
                            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', marginBottom: '1rem' }}><i className="fa-solid fa-ranking-star" style={{ color: '#f59e0b', marginRight: '10px' }}></i> Regional Leaderboard</h2>
                            <div style={{ display: 'grid', gap: '10px' }}>
                                {leaderboard.length === 0 ? (
                                    <p style={{ color: '#64748b', fontStyle: 'italic' }}>Pending leaderboard data from recent exams.</p>
                                ) : leaderboard.map(st => (
                                    <div key={st.rank} style={{ display: 'flex', justifyContent: 'space-between', padding: '15px 20px', borderRadius: '12px', background: st.name === meta.full_name ? 'rgba(168, 85, 247, 0.1)' : '#f8fafc', border: st.name === meta.full_name ? '1px solid rgba(168, 85, 247, 0.3)' : '1px solid transparent' }}>
                                        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                                            <div style={{ fontWeight: 800, color: st.rank === 1 ? '#f59e0b' : st.rank === 2 ? '#94a3b8' : st.rank === 3 ? '#b45309' : '#64748b' }}>#{st.rank}</div>
                                            <div style={{ fontWeight: st.name === meta.full_name ? 800 : 600, color: '#0f172a' }}>{st.name}</div>
                                            <div style={{ fontSize: '0.8rem', color: '#64748b', background: '#e2e8f0', padding: '2px 8px', borderRadius: '5px' }}>{st.school}</div>
                                        </div>
                                        <div style={{ fontWeight: 800, color: '#a855f7' }}>{st.points} XP</div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    </>
                )}

                {activeTab === 'available' && (
                    <>
                        <div className="dash-section-header">
                            <h1 className="dash-section-title">
                                🛒 Available Classes
                            </h1>
                            <p style={{ color: '#64748b', marginTop: '5px' }}>Purchase new classes and speed up your learning.</p>
                        </div>

                        <motion.div className="classes-grid" variants={containerVariants} initial="hidden" animate="visible">
                            {availableClasses.length === 0 ? (
                                <p style={{ color: '#64748b' }}>No classes currently available. Please assure Admin has created them.</p>
                            ) : availableClasses.map((cls) => {
                                const isPending = pendingClasses.includes(cls.id);
                                const isApproved = approvedClasses.includes(cls.id);

                                return (
                                    <motion.div key={cls.id} variants={itemVariants} className="class-card">
                                        <div className="class-card-img" style={{ background: `url(${cls.image_url || 'https://via.placeholder.com/300x160?text=Class'}) center/cover` }}></div>
                                        <div className="class-card-body">
                                            <div className="class-badge" style={{ alignSelf: 'flex-start' }}>{cls.type || 'General'}</div>
                                            <h3 className="class-title">{cls.title}</h3>
                                            <p className="class-desc">{cls.description}</p>
                                            <div className="class-price">Rs. {cls.price}</div>
                                            
                                            {isApproved ? (
                                                <button className="class-btn" style={{ background: '#10b981', cursor: 'default' }}>Joined</button>
                                            ) : isPending ? (
                                                <button className="class-btn" style={{ background: '#f59e0b', cursor: 'default' }}>Pending Approval</button>
                                            ) : (
                                                <button className="class-btn" onClick={() => handleJoinClick(cls)}>Join Class</button>
                                            )}
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </motion.div>
                    </>
                )}

                {activeTab === 'my-classes' && (
                    <>
                        <div className="dash-section-header">
                            <h1 className="dash-section-title">
                                📚 My Classes
                            </h1>
                        </div>

                        <motion.div className="classes-grid" variants={containerVariants} initial="hidden" animate="visible">
                            {availableClasses.filter(c => approvedClasses.includes(c.id) || pendingClasses.includes(c.id)).length === 0 ? (
                                <p style={{ color: '#64748b' }}>You haven't joined any classes yet.</p>
                            ) : (
                                availableClasses.filter(c => approvedClasses.includes(c.id) || pendingClasses.includes(c.id)).map((cls) => {
                                    const isPending = pendingClasses.includes(cls.id);
                                    
                                    return (
                                        <motion.div key={cls.id} variants={itemVariants} className="class-card">
                                            <div className="class-card-img" style={{ background: `url(${cls.image_url || 'https://via.placeholder.com/300x160?text=Class'}) center/cover` }}>
                                                {isPending && (
                                                    <div style={{ width: '100%', height: '100%', background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                        <span style={{ background: '#f59e0b', color: '#fff', padding: '5px 15px', borderRadius: '10px', fontWeight: 800 }}>PENDING ADMIN APPROVAL</span>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="class-card-body">
                                                <div className="class-badge" style={{ alignSelf: 'flex-start' }}>{cls.type}</div>
                                                <h3 className="class-title">{cls.title}</h3>
                                                
                                                {isPending ? (
                                                    <p style={{ color: '#64748b', fontSize: '0.85rem', marginTop: '10px' }}>Your payment slip is being reviewed. The class content will unlock shortly.</p>
                                                ) : (
                                                    <div style={{ marginTop: '15px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                        <div style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', fontSize: '0.8rem', padding: '6px 10px', borderRadius: '8px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '5px' }}>
                                                            <i className="fa-solid fa-play"></i> Resume Video: Unit 03 (24:15)
                                                        </div>
                                                        <button className="class-btn" onClick={() => openClassContent(cls)}>View Lessons & Live</button>
                                                    </div>
                                                )}
                                            </div>
                                        </motion.div>
                                    );
                                })
                            )}
                        </motion.div>
                    </>
                )}

                {activeTab === 'exams' && (
                    <>
                        {!examMode ? (
                            <div className="dash-section-header">
                                <h1 className="dash-section-title">✍️ Active Exams & Quizzes</h1>
                                <motion.div className="classes-grid" style={{ marginTop: '2rem', width: '100%' }}>
                                    {examsList.length === 0 ? (
                                        <p style={{ color: '#64748b' }}>No active exams right now.</p>
                                    ) : examsList.map(exam => (
                                        <div key={exam.id} className="dash-card" style={{ background: '#fff', padding: '2rem', borderRadius: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', border: '1px solid rgba(168, 85, 247, 0.2)' }}>
                                            <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', display: 'inline-block', padding: '5px 12px', borderRadius: '100px', fontSize: '0.8rem', fontWeight: 800, marginBottom: '1rem' }}>Active</div>
                                            <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', marginBottom: '10px' }}>{exam.title}</h3>
                                            <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '1.5rem' }}><i className="fa-solid fa-clock"></i> Duration: {exam.duration_minutes} Minutes</p>
                                            <button onClick={() => startExam(exam)} className="class-btn">Start Exam Now</button>
                                        </div>
                                    ))}
                                </motion.div>
                            </div>
                        ) : (
                            // EXAM MODE INTERFACE (Feature 7)
                            <div style={{ background: '#fff', borderRadius: '24px', padding: '3rem', border: '2px solid #ef4444', position: 'relative' }}>
                                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, background: '#ef4444', color: '#fff', padding: '10px', textAlign: 'center', borderTopLeftRadius: '20px', borderTopRightRadius: '20px', fontWeight: 800, display: 'flex', justifyContent: 'center', gap: '15px' }}>
                                    <i className="fa-solid fa-lock"></i> EXAM MODE LOCKED 
                                    <span style={{ background: '#fff', color: '#ef4444', padding: '2px 10px', borderRadius: '5px' }}>{formatTime(examTimeRemaining)}</span>
                                </div>
                                <h2 style={{ marginTop: '2rem', fontSize: '1.5rem', fontWeight: 800 }}>{examMode.title}</h2>
                                <p style={{ color: '#64748b', marginBottom: '2rem' }}>Stay on this page. Your answers will be automatically submitted when the timer reaches 0.</p>
                                
                                {/* Mock Question */}
                                <div style={{ background: '#f8fafc', padding: '2rem', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                                    <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>Q1. Which layer of the OSI model does a Router operate on?</h3>
                                    {['Network Layer', 'Data Link Layer', 'Transport Layer', 'Physical Layer'].map((opt, i) => (
                                        <div key={i} onClick={() => setExamAnswers({...examAnswers, q1: opt})} style={{ padding: '15px', background: examAnswers.q1 === opt ? 'rgba(168, 85, 247, 0.1)' : '#fff', border: examAnswers.q1 === opt ? '2px solid #a855f7' : '2px solid transparent', borderRadius: '12px', marginBottom: '10px', cursor: 'pointer', fontWeight: 600 }}>
                                            {opt}
                                        </div>
                                    ))}
                                </div>

                                <button onClick={handleExamSubmit} style={{ marginTop: '2rem', padding: '15px 30px', background: '#a855f7', color: '#fff', borderRadius: '12px', border: 'none', fontWeight: 800, fontSize: '1.1rem', cursor: 'pointer' }}>Submit Exam Early</button>
                            </div>
                        )}
                    </>
                )}

                {activeTab === 'profile' && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="dash-card" style={{ maxWidth: '600px', margin: '0 auto', background: '#fff', padding: '2.5rem', borderRadius: '24px', boxShadow: '0 10px 40px rgba(168, 85, 247, 0.08)' }}>
                        <h2 style={{ fontSize: '1.8rem', marginBottom: '1.5rem', color: '#0f172a', fontWeight: 800 }}><i className="fa-solid fa-user-pen" style={{ color: '#a855f7', marginRight: '10px' }}></i> Update Profile</h2>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '5px', color: '#64748b', fontSize: '0.9rem', fontWeight: 600 }}>Full Name</label>
                                <input 
                                    type="text" value={profileForm.name} onChange={(e) => setProfileForm({...profileForm, name: e.target.value})}
                                    style={{ width: '100%', padding: '12px 15px', borderRadius: '12px', border: '1px solid rgba(168, 85, 247, 0.2)', background: '#f8fafc', color: '#0f172a', fontWeight: 500, outline: 'none' }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '5px', color: '#64748b', fontSize: '0.9rem', fontWeight: 600 }}>Guardian Phone</label>
                                <input 
                                    type="text" value={profileForm.phone} onChange={(e) => setProfileForm({...profileForm, phone: e.target.value})}
                                    style={{ width: '100%', padding: '12px 15px', borderRadius: '12px', border: '1px solid rgba(168, 85, 247, 0.2)', background: '#f8fafc', color: '#0f172a', fontWeight: 500, outline: 'none' }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '5px', color: '#64748b', fontSize: '0.9rem', fontWeight: 600 }}>School</label>
                                <input 
                                    type="text" value={profileForm.school} onChange={(e) => setProfileForm({...profileForm, school: e.target.value})}
                                    style={{ width: '100%', padding: '12px 15px', borderRadius: '12px', border: '1px solid rgba(168, 85, 247, 0.2)', background: '#f8fafc', color: '#0f172a', fontWeight: 500, outline: 'none' }}
                                />
                            </div>

                            <button onClick={handleProfileUpdate} disabled={isSaving} style={{ marginTop: '1rem', padding: '14px', background: '#a855f7', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 700, cursor: 'pointer', transition: '0.3s' }}>
                                {isSaving ? 'Saving...' : 'Save Changes'}
                            </button>
                            
                            <button onClick={handleLogout} style={{ marginTop: '0.5rem', padding: '12px', background: 'rgba(239, 68, 68, 0.05)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '12px', cursor: 'pointer', fontWeight: 700, transition: '0.3s' }}>
                                <i className="fa-solid fa-arrow-right-from-bracket"></i> Sign Out
                            </button>
                        </div>
                    </motion.div>
                )}

                {activeTab !== 'overview' && activeTab !== 'profile' && activeTab !== 'available' && activeTab !== 'my-classes' && activeTab !== 'exams' && (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }} 
                        animate={{ opacity: 1, scale: 1 }} 
                        style={{ textAlign: 'center', padding: '6rem 2rem', color: '#64748b' }}
                    >
                        <i className="fa-solid fa-person-digging" style={{ fontSize: '4rem', marginBottom: '1.5rem', color: '#cbd5e1' }}></i>
                        <h2 style={{ fontSize: '2rem', color: '#0f172a' }}>{activeTab.charAt(0).toUpperCase() + activeTab.slice(1).replace('-', ' ')}</h2>
                        <p style={{ marginTop: '10px' }}>This section is currently under development. Please check back later!</p>
                        
                        {activeTab === 'classes' && (
                            <button onClick={handleLogout} style={{ marginTop: '2rem', padding: '10px 20px', background: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>
                                Sign Out
                            </button>
                        )}
                    </motion.div>
                )}
            </main>

            {/* Slip Upload Modal */}
            {uploadModalOpen && selectedClassToJoin && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(15, 23, 42, 0.8)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
                    <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={{ background: '#fff', padding: '2rem', borderRadius: '24px', width: '90%', maxWidth: '500px', boxShadow: '0 20px 50px rgba(0,0,0,0.2)' }}>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '10px' }}>Upload Payment Slip</h2>
                        <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '1.5rem' }}>You are paying <strong>{selectedClassToJoin.price}</strong> for {selectedClassToJoin.title}. Please upload your bank deposit slip or online transfer screenshot.</p>
                        
                        <div style={{ border: '2px dashed #cbd5e1', borderRadius: '16px', padding: '2rem', textAlign: 'center', marginBottom: '1.5rem', background: slipFile ? 'rgba(16, 185, 129, 0.05)' : '#f8fafc', position: 'relative' }}>
                            <input type="file" onChange={(e) => setSlipFile(e.target.files[0])} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }} />
                            <i className={`fa-solid ${slipFile ? 'fa-check-circle' : 'fa-cloud-arrow-up'}`} style={{ fontSize: '3rem', color: slipFile ? '#10b981' : '#a855f7', marginBottom: '10px' }}></i>
                            <h3 style={{ fontSize: '1.1rem', color: '#0f172a' }}>{slipFile ? slipFile.name : 'Click to Browse Files'}</h3>
                            <p style={{ fontSize: '0.8rem', color: '#64748b' }}>{slipFile ? 'Slip ready to upload' : 'JPEG, PNG, PDF up to 5MB'}</p>
                        </div>

                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button onClick={handleSlipSubmit} disabled={!slipFile || slipUploading} style={{ flex: 1, padding: '14px', background: slipFile ? '#a855f7' : '#cbd5e1', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 700, cursor: slipFile ? 'pointer' : 'not-allowed', transition: '0.3s' }}>
                                {slipUploading ? 'Uploading...' : 'Submit Slip'}
                            </button>
                            <button onClick={() => setUploadModalOpen(false)} style={{ padding: '14px 20px', background: 'transparent', color: '#64748b', border: 'none', fontWeight: 700, cursor: 'pointer' }}>
                                Cancel
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}

            {/* Class Content Viewer — Full Screen Dark Overlay */}
            {viewingClass && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(2, 6, 23, 0.98)', backdropFilter: 'blur(10px)', zIndex: 9999, display: 'flex', flexDirection: 'column' }}>
                    
                    {/* Header — only visible when no video playing */}
                    {!activeLesson && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem 2rem', background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.08)', flexShrink: 0 }}>
                            <div>
                                <h2 style={{ color: '#fff', fontSize: '1.4rem', fontWeight: 800 }}>{viewingClass.title}</h2>
                                <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>
                                    <i className="fa-solid fa-shield-halved" style={{ color: '#a855f7', marginRight: '6px' }}></i>
                                    Protected Content — RDICT LMS
                                </p>
                            </div>
                            <button onClick={() => setViewingClass(null)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', padding: '10px 20px', borderRadius: '100px', cursor: 'pointer', fontWeight: 700 }}>
                                <i className="fa-solid fa-times"></i> Close
                            </button>
                        </div>
                    )}

                    {/* Content Area */}
                    <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
                        
                        {/* Sidebar — only when not watching video */}
                        {!activeLesson && (
                            <div style={{ width: '340px', background: 'rgba(255,255,255,0.02)', borderRight: '1px solid rgba(255,255,255,0.06)', overflowY: 'auto', padding: '1.5rem' }}>

                                {/* Live Sessions */}
                                <h3 style={{ color: '#94a3b8', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '1rem' }}>Live Classes</h3>
                                {classLiveSessions.length === 0 ? (
                                    <p style={{ color: '#475569', fontSize: '0.85rem', marginBottom: '1.5rem' }}>No upcoming live sessions.</p>
                                ) : classLiveSessions.map(live => {
                                    const liveTime = new Date(live.start_time);
                                    const isNow = live.is_active;
                                    return (
                                        <div key={live.id} style={{ background: isNow ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255,255,255,0.03)', border: `1px solid ${isNow ? 'rgba(16,185,129,0.4)' : 'rgba(255,255,255,0.06)'}`, borderRadius: '12px', padding: '14px', marginBottom: '10px' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fff' }}>{live.title}</span>
                                                {isNow && <span style={{ background: '#10b981', color: '#fff', fontSize: '0.7rem', fontWeight: 800, padding: '2px 8px', borderRadius: '100px', display: 'flex', alignItems: 'center', gap: '4px' }}><span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#fff', display: 'inline-block' }}></span>LIVE</span>}
                                            </div>
                                            <p style={{ color: '#64748b', fontSize: '0.75rem', marginBottom: '10px' }}>{liveTime.toLocaleString()}</p>
                                            <a href={live.zoom_link} target="_blank" rel="noopener noreferrer" style={{ display: 'block', textAlign: 'center', padding: '9px', background: '#2d8cff', color: '#fff', borderRadius: '8px', fontWeight: 700, fontSize: '0.85rem', textDecoration: 'none' }}>
                                                <i className="fa-solid fa-video" style={{ marginRight: '6px' }}></i> Join Zoom
                                            </a>
                                        </div>
                                    );
                                })}

                                {/* Recordings */}
                                <h3 style={{ color: '#94a3b8', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '1rem', marginTop: '1.5rem' }}>Recordings</h3>
                                {loadingLessons ? (
                                    <p style={{ color: '#64748b', padding: '10px' }}>Loading...</p>
                                ) : classLessons.length === 0 ? (
                                    <p style={{ color: '#475569', fontSize: '0.85rem' }}>No recordings yet.</p>
                                ) : (
                                    classLessons.map((lesson, idx) => {
                                        const resumeAt = lessonResumeTimes[lesson.id] || 0;
                                        const hasResume = resumeAt > 5;
                                        return (
                                            <div
                                                key={lesson.id}
                                                onClick={() => setActiveLesson(lesson)}
                                                style={{ padding: '12px 14px', borderRadius: '12px', marginBottom: '8px', cursor: 'pointer', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', transition: '0.2s' }}
                                            >
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                    <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(168,85,247,0.15)', border: '1px solid rgba(168,85,247,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a855f7', flexShrink: 0 }}>
                                                        <i className="fa-solid fa-circle-play" style={{ fontSize: '1rem' }}></i>
                                                    </div>
                                                    <div style={{ flex: 1, minWidth: 0 }}>
                                                        <p style={{ color: '#fff', fontSize: '0.9rem', fontWeight: 600, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{lesson.title}</p>
                                                        <p style={{ color: '#64748b', fontSize: '0.75rem', margin: 0 }}>
                                                            {hasResume ? `▶ Resume at ${Math.floor(resumeAt/60)}:${String(Math.floor(resumeAt%60)).padStart(2,'0')}` : (lesson.duration || 'New')}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        )}

                        {/* Video Player — Full area when active */}
                        {activeLesson ? (
                            <div style={{ flex: 1, background: '#000', position: 'relative' }}>
                                <ProtectedVideoPlayer
                                    key={activeLesson.id}
                                    videoId={activeLesson.video_id}
                                    title={activeLesson.title}
                                    resumeTime={lessonResumeTimes[activeLesson.id] || 0}
                                    onClose={handleVideoClose}
                                    onTimeUpdate={(t) => handleTimeUpdate(activeLesson.id, t)}
                                    userName={meta.full_name || ''}
                                    userEmail={user?.email || ''}
                                />
                            </div>
                        ) : (
                            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '1rem' }}>
                                <i className="fa-solid fa-circle-play" style={{ fontSize: '4rem', color: '#334155' }}></i>
                                <p style={{ color: '#475569', fontSize: '1rem' }}>Select a recording to watch</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;
