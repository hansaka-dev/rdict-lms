import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';
import Cursor from '../components/Cursor';
import '../pages/Dashboard.css'; // Reuse student dashboard styles!

const AdminDashboard = () => {
    const navigate = useNavigate();
    const [adminUser, setAdminUser] = useState(null);
    const [meta, setMeta] = useState({});
    const [activeTab, setActiveTab] = useState('overview');
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    // Data States
    const [classes, setClasses] = useState([]);
    const [enrollments, setEnrollments] = useState([]);
    const [allProfiles, setAllProfiles] = useState([]);
    const [lessons, setLessons] = useState([]);
    const [liveSessions, setLiveSessions] = useState([]);
    const [exams, setExams] = useState([]);

    // Create Forms State
    const [newClass, setNewClass] = useState({ title: '', description: '', price: '', type: 'Theory', badge: '2026 A/L', image_url: '' });
    const [newLesson, setNewLesson] = useState({ class_id: '', title: '', video_id: '', duration: '', order_index: 1 });
    const [newLive, setNewLive] = useState({ class_id: '', title: '', zoom_link: '', start_time: '', is_active: true });
    const [newExam, setNewExam] = useState({ title: '', duration_minutes: 60 });

    const [isCreating, setIsCreating] = useState(false);
    
    // Custom UI States
    const [modal, setModal] = useState({ show: false, title: '', message: '', onConfirm: null, type: 'confirm' });
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

    const showToast = (message, type = 'success') => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
    };

    const confirmAction = (title, message, onConfirm) => {
        setModal({ show: true, title, message, onConfirm, type: 'confirm' });
    };

    const showAlert = (title, message) => {
        setModal({ show: true, title, message, onConfirm: null, type: 'alert' });
    };

    useEffect(() => {
        const checkUserAndFetch = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                setAdminUser(session.user);
                setMeta(session.user.user_metadata || {});
                fetchAdminData();
            } else {
                navigate('/login');
            }
        };
        checkUserAndFetch();
    }, [navigate]);

    const fetchAdminData = async () => {
        try {
            const { data: classesData } = await supabase.from('classes').select('*').order('created_at', { ascending: false });
            if (classesData) setClasses(classesData);

            const { data: enrollData } = await supabase.from('enrollments').select('*').order('created_at', { ascending: false });
            if (enrollData) setEnrollments(enrollData);

            const { data: profilesData } = await supabase.from('profiles').select('*').order('xp_points', { ascending: false });
            if (profilesData) setAllProfiles(profilesData);

            const { data: lesData } = await supabase.from('lessons').select('*').order('order_index', { ascending: true });
            if (lesData) setLessons(lesData);

            const { data: livData } = await supabase.from('live_sessions').select('*');
            if (livData) setLiveSessions(livData);

            const { data: exData } = await supabase.from('exams').select('*');
            if (exData) setExams(exData);
        } catch (err) {
            console.error("Fetch error:", err);
        }
    };

    // Generic Creator Function
    const handleCreateRecord = async (e, table, payload, resetStateFunc) => {
        e.preventDefault();
        setIsCreating(true);
        try {
            const { error } = await supabase.from(table).insert([payload]);
            if (error) throw error;
            showToast(`${table} created successfully!`, 'success');
            resetStateFunc();
            fetchAdminData();
        } catch (err) {
            console.error(err);
            showAlert('Operation Failed', err.message || `Failed to save to ${table}`);
        } finally {
            setIsCreating(false);
        }
    };

    const handleGenericDelete = async (table, id, text) => {
        confirmAction(
            `Delete ${text}?`, 
            `Are you sure you want to permanently remove this ${text.toLowerCase()}? This action cannot be undone.`,
            async () => {
                try {
                    // We use count: 'exact' to see if anything was actually deleted
                    const { error, count } = await supabase.from(table).delete({ count: 'exact' }).eq('id', id);
                    
                    if (error) throw error;

                    if (count === 0) {
                        showAlert('Not Deleted', `The request was successful, but 0 rows were affected. This usually means Supabase RLS policies are preventing you from deleting this record, or the ID is missing.`);
                    } else {
                        showToast(`${text} deleted successfully!`, 'success');
                        await fetchAdminData();
                    }
                } catch (err) {
                    console.error("Delete Error:", err);
                    showAlert('Delete Failed', err.message || `Could not delete this ${text}. Check for foreign key constraints.`);
                }
            }
        );
    };

    const handleEnrollmentAction = async (enrollmentId, newStatus) => {
        const title = newStatus === 'approved' ? 'Approve Enrollment?' : 'Reject Enrollment?';
        const msg = newStatus === 'approved' 
            ? 'This will grant the student access. Information: Payment slip will be auto-deleted to save storage.' 
            : 'Are you sure you want to reject and delete this enrollment request?';

        confirmAction(title, msg, async () => {
            try {
                const enr = enrollments.find(e => e.id === enrollmentId);
                if (enr && enr.slip_url && enr.slip_url.includes('/storage/v1/object/public/slips/')) {
                    const filePath = enr.slip_url.split('/storage/v1/object/public/slips/')[1];
                    if (filePath) {
                        try { await supabase.storage.from('slips').remove([decodeURIComponent(filePath)]); } catch (e) { }
                    }
                }

                if (newStatus === 'rejected') {
                    const { error } = await supabase.from('enrollments').delete().eq('id', enrollmentId);
                    if (error) throw error;
                } else {
                    const { error } = await supabase.from('enrollments').update({ status: newStatus, slip_url: null }).eq('id', enrollmentId);
                    if (error) throw error;
                }
                showToast(`Enrollment ${newStatus}!`, 'success');
                fetchAdminData();
            } catch (err) {
                console.error(err);
                showAlert('Action Failed', err.message || "Failed to update enrollment status.");
            }
        });
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate('/');
    };

    if (!adminUser) return (
        <div style={{ background: '#f8fafc', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Cursor />
            <h2 style={{ color: '#a855f7' }}>Verifying Master Admin...</h2>
        </div>
    );

    const pendingApprovals = enrollments.filter(e => e.status === 'pending').length;

    // Animation Configurations
    const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } };
    const itemVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } } };

    return (
        <div style={{ display: 'flex', height: '100vh', width: '100vw', background: '#f8fafc', overflow: 'hidden', fontFamily: "'Outfit', sans-serif" }}>
            <Cursor />
            
            {/* ── Vertical Sidebar ── */}
            <aside style={{ width: '280px', background: '#fff', borderRight: '1px solid rgba(168, 85, 247, 0.1)', display: 'flex', flexDirection: 'column', zIndex: 10 }}>
                {/* Logo Area */}
                <div style={{ padding: '2rem', borderBottom: '1px solid #f1f5f9' }}>
                    <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 900, color: '#0f172a' }}>
                        RDICT<span style={{ color: '#a855f7' }}>.</span>Admin
                    </h1>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>Command Center</p>
                </div>

                {/* Navigation Links */}
                <nav style={{ flex: 1, padding: '1.5rem 1rem', display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto' }}>
                    {[
                        { id: 'overview', icon: 'border-all', label: 'Overview' },
                        { id: 'classes', icon: 'graduation-cap', label: 'Classes', group: 'manage-classes' },
                        { id: 'content', icon: 'video', label: 'Lessons & Live' },
                        { id: 'exams', icon: 'pen-to-square', label: 'Exams' },
                        { id: 'students', icon: 'users', label: 'All Users' },
                        { id: 'approvals', icon: 'check-double', label: 'Payment Sweeps', badge: pendingApprovals }
                    ].map(item => (
                        <button 
                            key={item.id}
                            onClick={() => setActiveTab(item.group || item.id)}
                            style={{ 
                                display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 18px', 
                                background: activeTab === (item.group || item.id) ? '#a855f7' : 'transparent', 
                                color: activeTab === (item.group || item.id) ? '#fff' : '#64748b', 
                                border: 'none', borderRadius: '12px', cursor: 'pointer', 
                                fontSize: '1rem', fontWeight: 700, transition: 'all 0.2s', textAlign: 'left'
                            }}
                        >
                            <i className={`fa-solid fa-${item.icon}`} style={{ fontSize: '1.1rem', width: '20px', textAlign: 'center' }}></i>
                            <span style={{ flex: 1 }}>{item.label}</span>
                            {item.badge > 0 && (
                                <span style={{ background: activeTab === (item.group || item.id) ? '#fff' : '#ef4444', color: activeTab === (item.group || item.id) ? '#a855f7' : '#fff', padding: '2px 8px', borderRadius: '100px', fontSize: '0.75rem', fontWeight: 800 }}>
                                    {item.badge}
                                </span>
                            )}
                        </button>
                    ))}
                </nav>

                {/* User Info & Logout */}
                <div style={{ padding: '2rem 1.5rem', borderTop: '1px solid #f1f5f9' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1.5rem' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(168, 85, 247, 0.1)', color: '#a855f7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>
                            A
                        </div>
                        <div>
                            <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.9rem' }}>Master Admin</div>
                            <div style={{ color: '#10b981', fontSize: '0.75rem', fontWeight: 700 }}>● Online</div>
                        </div>
                    </div>
                    <button onClick={handleLogout} style={{ width: '100%', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: 'none', padding: '12px', borderRadius: '12px', cursor: 'pointer', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                        <i className="fa-solid fa-arrow-right-from-bracket"></i> Logout Session
                    </button>
                </div>
            </aside>

            {/* ── Main Content Area ── */}
            <main style={{ flex: 1, overflowY: 'auto', padding: '2rem 3rem', position: 'relative' }}>
                <div style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '4rem' }}>
                
                {/* ── 1. OVERVIEW ── */}
                {activeTab === 'overview' && (
                    <motion.div variants={containerVariants} initial="hidden" animate="visible">
                        <div className="dash-section-header">
                            <h1 className="dash-section-title">👑 Admin Control Center</h1>
                            <p style={{ color: '#64748b', marginTop: '5px' }}>Global statistics and system alerts.</p>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem', marginTop: '1.5rem' }}>
                            {[{t: 'Total Users', n: allProfiles.length, c: '#3b82f6', ic: 'users'},
                              {t: 'Active Classes', n: classes.length, c: '#a855f7', ic: 'graduation-cap'},
                              {t: 'Recorded Lessons', n: lessons.length, c: '#10b981', ic: 'video'},
                              {t: 'Pending Sweeps', n: pendingApprovals, c: '#ef4444', ic: 'clock-rotate-left'}
                             ].map((st, i) => (
                                <motion.div key={i} variants={itemVariants} style={{ background: '#fff', borderRadius: '20px', padding: '1.5rem', border: `1px solid rgba(0,0,0,0.05)`, boxShadow: '0 10px 30px rgba(0,0,0,0.02)' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#64748b', marginBottom: '10px', fontWeight: 600 }}>
                                        <div style={{ background: `${st.c}1A`, color: st.c, width: '40px', height: '40px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}><i className={`fa-solid fa-${st.ic}`}></i></div>
                                        {st.t}
                                    </div>
                                    <h3 style={{ fontSize: '2.5rem', fontWeight: 800, color: '#0f172a' }}>{st.n}</h3>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                )}

                {/* ── 2. CLASSES ── */}
                {activeTab === 'manage-classes' && (
                    <motion.div variants={containerVariants} initial="hidden" animate="visible">
                        <div className="dash-section-header"><h1 className="dash-section-title">📚 Managed Classes</h1></div>
                        <div style={{ background: '#fff', borderRadius: '24px', padding: '2.5rem', boxShadow: '0 10px 40px rgba(0,0,0,0.03)', marginBottom: '3rem', maxWidth: '800px' }}>
                            <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem', fontWeight: 800 }}><i className="fa-solid fa-plus-circle" style={{ color: '#a855f7', marginRight: '8px' }}></i> Create New Category</h2>
                            <form onSubmit={e => handleCreateRecord(e, 'classes', newClass, () => setNewClass({ title: '', description: '', price: '', type: 'Theory', badge: '2026 A/L', image_url: '' }))} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <input required type="text" value={newClass.title} onChange={e => setNewClass({...newClass, title: e.target.value})} placeholder="Title (e.g. 2026 ICT Theory)" style={{ gridColumn: '1 / -1', padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0' }} />
                                <textarea required rows="2" value={newClass.description} onChange={e => setNewClass({...newClass, description: e.target.value})} placeholder="Description" style={{ gridColumn: '1 / -1', padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0' }}></textarea>
                                <input required type="number" value={newClass.price} onChange={e => setNewClass({...newClass, price: e.target.value})} placeholder="Fee Amount (e.g. 2500)" style={{ padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0' }} />
                                <input required type="text" value={newClass.badge} onChange={e => setNewClass({...newClass, badge: e.target.value})} placeholder="Badge label" style={{ padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0' }} />
                                <select value={newClass.type} onChange={e => setNewClass({...newClass, type: e.target.value})} style={{ padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                                    <option value="Theory">Theory</option><option value="Revision">Revision</option><option value="Paper">Paper</option>
                                </select>
                                <input type="url" value={newClass.image_url} onChange={e => setNewClass({...newClass, image_url: e.target.value})} placeholder="Image URL (Optional)" style={{ padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0' }} />
                                <button type="submit" disabled={isCreating} style={{ gridColumn: '1 / -1', padding: '14px', background: '#a855f7', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 800 }}>Add Class Category</button>
                            </form>
                        </div>
                        <div className="classes-grid">
                            {classes.map(cls => (
                                <motion.div key={cls.id} variants={itemVariants} className="class-card">
                                    <div className="class-card-img" style={{ background: `url(${cls.image_url || 'https://via.placeholder.com/300x160'}) center/cover` }}></div>
                                    <div className="class-card-body">
                                        <h3 className="class-title">{cls.title}</h3>
                                        <p className="class-desc">{cls.description}</p>
                                        <button className="class-btn" onClick={() => handleGenericDelete('classes', cls.id, 'Class')} style={{ width: '100%', background: '#fee2e2', color: '#ef4444' }}>Delete Class</button>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                )}

                {/* ── 3. LESSONS & LIVE (1000% Content Integration) ── */}
                {activeTab === 'content' && (
                    <motion.div variants={containerVariants} initial="hidden" animate="visible" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '2rem' }}>
                        {/* COLUMN 1: RECORDINGS */}
                        <div style={{ background: '#fff', borderRadius: '24px', padding: '2rem', boxShadow: '0 10px 40px rgba(0,0,0,0.03)' }}>
                            <h2 style={{ fontSize: '1.4rem', marginBottom: '1.5rem', fontWeight: 800 }}><i className="fa-solid fa-video" style={{ color: '#10b981', marginRight: '8px' }}></i> Add Recording</h2>
                            <form onSubmit={e => handleCreateRecord(e, 'lessons', newLesson, () => setNewLesson({...newLesson, title: '', video_id: '', duration: '', order_index: lessons.length + 2}))} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <select required value={newLesson.class_id} onChange={e => setNewLesson({...newLesson, class_id: e.target.value})} style={{ padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                                    <option value="">-- Assign to Class --</option>
                                    {classes.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                                </select>
                                <input required type="text" value={newLesson.title} onChange={e => setNewLesson({...newLesson, title: e.target.value})} placeholder="Lesson Title (e.g. Unit 3 - Networking)" style={{ padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0' }} />
                                <input required type="text" value={newLesson.video_id} onChange={e => setNewLesson({...newLesson, video_id: e.target.value})} placeholder="YouTube Unlisted Video ID (e.g. dQw4w9WgXcQ)" style={{ padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0' }} />
                                <div style={{ display: 'flex', gap: '1rem' }}>
                                    <input type="text" value={newLesson.duration} onChange={e => setNewLesson({...newLesson, duration: e.target.value})} placeholder="Duration (e.g. 2h 15m)" style={{ flex: 1, padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0' }} />
                                    <input required type="number" value={newLesson.order_index} onChange={e => setNewLesson({...newLesson, order_index: parseInt(e.target.value)})} placeholder="Order" style={{ width: '80px', padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0' }} />
                                </div>
                                <button type="submit" disabled={isCreating} style={{ padding: '14px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 800 }}>Publish Recording</button>
                            </form>
                            
                            <h3 style={{ marginTop: '2rem', fontSize: '1.1rem', color: '#64748b' }}>Recent Recordings</h3>
                            <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {lessons.slice(-5).reverse().map(l => (
                                    <div key={l.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                        <span style={{ fontWeight: 600, color: '#0f172a' }}>{l.title}</span>
                                        <button onClick={() => handleGenericDelete('lessons', l.id, 'Lesson')} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}><i className="fa-solid fa-trash"></i></button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* COLUMN 2: LIVE ZOOM SESSIONS */}
                        <div style={{ background: '#fff', borderRadius: '24px', padding: '2rem', boxShadow: '0 10px 40px rgba(0,0,0,0.03)' }}>
                            <h2 style={{ fontSize: '1.4rem', marginBottom: '1.5rem', fontWeight: 800 }}><i className="fa-solid fa-tower-broadcast" style={{ color: '#3b82f6', marginRight: '8px' }}></i> Add Live Zoom</h2>
                            <form onSubmit={e => handleCreateRecord(e, 'live_sessions', newLive, () => setNewLive({...newLive, title: '', zoom_link: '', start_time: ''}))} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <select required value={newLive.class_id} onChange={e => setNewLive({...newLive, class_id: e.target.value})} style={{ padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                                    <option value="">-- Assign to Class --</option>
                                    {classes.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                                </select>
                                <input required type="text" value={newLive.title} onChange={e => setNewLive({...newLive, title: e.target.value})} placeholder="Session Title (e.g. Sunday Final Revision)" style={{ padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0' }} />
                                <input required type="text" value={newLive.zoom_link} onChange={e => setNewLive({...newLive, zoom_link: e.target.value})} placeholder="Zoom Meeting URL" style={{ padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0' }} />
                                <input required type="datetime-local" value={newLive.start_time} onChange={e => setNewLive({...newLive, start_time: e.target.value})} style={{ padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0' }} />
                                <button type="submit" disabled={isCreating} style={{ padding: '14px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 800 }}>Schedule Live Session</button>
                            </form>

                            <h3 style={{ marginTop: '2rem', fontSize: '1.1rem', color: '#64748b' }}>Active Zoom Links</h3>
                            <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {liveSessions.map(l => (
                                    <div key={l.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', background: '#eff6ff', borderRadius: '8px', borderLeft: '4px solid #3b82f6' }}>
                                        <span style={{ fontWeight: 600, color: '#0f172a' }}>{l.title}</span>
                                        <button onClick={() => handleGenericDelete('live_sessions', l.id, 'Live Session')} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}><i className="fa-solid fa-trash"></i></button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* ── 4. EXAMS ── */}
                {activeTab === 'exams' && (
                    <motion.div variants={containerVariants} initial="hidden" animate="visible" style={{ maxWidth: '600px' }}>
                        <div className="dash-section-header"><h1 className="dash-section-title">✍️ Manage Exams</h1></div>
                        <div style={{ background: '#fff', borderRadius: '24px', padding: '2.5rem', boxShadow: '0 10px 40px rgba(0,0,0,0.03)', marginBottom: '2rem' }}>
                            <form onSubmit={e => handleCreateRecord(e, 'exams', newExam, () => setNewExam({ title: '', duration_minutes: 60 }))} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <input required type="text" value={newExam.title} onChange={e => setNewExam({...newExam, title: e.target.value})} placeholder="Exam Title" style={{ padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0' }} />
                                <input required type="number" value={newExam.duration_minutes} onChange={e => setNewExam({...newExam, duration_minutes: parseInt(e.target.value)})} placeholder="Duration (Minutes)" style={{ padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0' }} />
                                <button type="submit" style={{ padding: '14px', background: '#f59e0b', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 800 }}>Create Exam</button>
                            </form>
                        </div>
                        {exams.map(ex => (
                            <div key={ex.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '1.5rem', background: '#fff', borderRadius: '16px', marginBottom: '10px', border: '1px solid #e2e8f0' }}>
                                <div><h3 style={{ margin: 0, color: '#0f172a' }}>{ex.title}</h3><p style={{ margin: 0, color: '#64748b', fontSize: '0.85rem' }}>{ex.duration_minutes} Mins</p></div>
                                <button onClick={() => handleGenericDelete('exams', ex.id, 'Exam')} style={{ background: '#fee2e2', border: 'none', padding: '10px 15px', color: '#ef4444', borderRadius: '10px', cursor: 'pointer' }}><i className="fa-solid fa-trash"></i></button>
                            </div>
                        ))}
                    </motion.div>
                )}

                {/* ── 5. ALL STUDENTS DB ── */}
                {activeTab === 'students' && (
                    <motion.div variants={containerVariants} initial="hidden" animate="visible">
                        <div className="dash-section-header">
                            <h1 className="dash-section-title">👥 All Registered Users</h1>
                            <p style={{ color: '#64748b', marginTop: '5px' }}>View profiles, grant Admin access, or ban accounts.</p>
                        </div>
                        <div style={{ background: '#fff', borderRadius: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', overflow: 'hidden' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                <thead style={{ background: '#f8fafc', color: '#64748b', fontSize: '0.85rem', textTransform: 'uppercase' }}>
                                    <tr>
                                        <th style={{ padding: '1.2rem', borderBottom: '2px solid rgba(168, 85, 247, 0.1)' }}>#</th>
                                        <th style={{ padding: '1.2rem', borderBottom: '2px solid rgba(168, 85, 247, 0.1)' }}>Full Name</th>
                                        <th style={{ padding: '1.2rem', borderBottom: '2px solid rgba(168, 85, 247, 0.1)' }}>School / Base</th>
                                        <th style={{ padding: '1.2rem', borderBottom: '2px solid rgba(168, 85, 247, 0.1)' }}>Points</th>
                                        <th style={{ padding: '1.2rem', borderBottom: '2px solid rgba(168, 85, 247, 0.1)' }}>Admin Powers</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {allProfiles.map((p, index) => (
                                        <tr key={p.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                                            <td style={{ padding: '1.2rem', color: '#94a3b8' }}>{index + 1}</td>
                                            <td style={{ padding: '1.2rem', fontWeight: 700, color: '#0f172a' }}>{p.full_name || 'NO NAME PROVIDED'}</td>
                                            <td style={{ padding: '1.2rem', color: '#64748b', fontSize: '0.9rem' }}>{p.school_name || '-'}</td>
                                            <td style={{ padding: '1.2rem', color: '#10b981', fontWeight: 800 }}>{p.xp_points || 0} XP</td>
                                            <td style={{ padding: '1.2rem' }}>
                                                <div style={{ display: 'flex', gap: '8px' }}>
                                                    <button onClick={() => showAlert('Manual Action Required', 'For security, Admin rights must be granted via the Supabase Dashboard manually (Auth -> Users -> Edit User Metadata). Set {"is_admin": true} there.')} style={{ background: '#3b82f6', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '0.8rem', cursor: 'pointer', fontWeight: 600 }}>Make Admin</button>
                                                    <button onClick={() => handleGenericDelete('profiles', p.id, 'User Profile')} style={{ background: '#fee2e2', color: '#ef4444', border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '0.8rem', cursor: 'pointer', fontWeight: 600 }}>Delete</button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </motion.div>
                )}

                {/* ── 6. APPROVALS ── */}
                {activeTab === 'approvals' && (
                    <motion.div variants={containerVariants} initial="hidden" animate="visible">
                        <div className="dash-section-header">
                            <h1 className="dash-section-title">💸 Payment Approvals</h1>
                            <p style={{ color: '#64748b' }}>Approve class enrollments and verify payment slips.</p>
                        </div>
                        <div style={{ background: '#fff', borderRadius: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', overflow: 'hidden' }}>
                            {enrollments.length === 0 ? <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>No enrollments found.</div> : (
                                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                    <thead style={{ background: '#f8fafc', color: '#64748b', fontSize: '0.85rem', textTransform: 'uppercase' }}>
                                        <tr>
                                            <th style={{ padding: '1.2rem' }}>Student</th>
                                            <th style={{ padding: '1.2rem' }}>Class Request</th>
                                            <th style={{ padding: '1.2rem' }}>Slip</th>
                                            <th style={{ padding: '1.2rem' }}>Status</th>
                                            <th style={{ padding: '1.2rem' }}>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {enrollments.map((enr) => {
                                            const student = allProfiles.find(p => p.id === enr.user_id);
                                            const cls = classes.find(c => c.id === enr.class_id);
                                            return (
                                                <tr key={enr.id} style={{ borderBottom: '1px solid #e2e8f0', background: enr.status === 'pending' ? 'rgba(245, 158, 11, 0.03)' : '#fff' }}>
                                                    <td style={{ padding: '1.2rem' }}>
                                                        <div style={{ fontWeight: 700, color: '#0f172a' }}>{student ? student.full_name : 'Unknown'}</div>
                                                        <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{student?.school_name || '-'}</div>
                                                    </td>
                                                    <td style={{ padding: '1.2rem' }}>
                                                        <div style={{ fontWeight: 600, color: '#a855f7' }}>{cls ? cls.title : 'Deleted Class'}</div>
                                                    </td>
                                                    <td style={{ padding: '1.2rem' }}>
                                                        {enr.slip_url ? (
                                                            <a href={enr.slip_url} target="_blank" rel="noreferrer" style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', padding: '6px 12px', borderRadius: '100px', fontSize: '0.85rem', fontWeight: 700, textDecoration: 'none' }}>View Slip</a>
                                                        ) : <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>Cleared</span>}
                                                    </td>
                                                    <td style={{ padding: '1.2rem' }}>
                                                        {enr.status === 'pending' ? <span style={{ background: '#fef3c7', color: '#d97706', padding: '4px 10px', borderRadius: '10px', fontSize: '0.8rem', fontWeight: 800 }}>PENDING</span> : <span style={{ background: '#d1fae5', color: '#059669', padding: '4px 10px', borderRadius: '10px', fontSize: '0.8rem', fontWeight: 800 }}>APPROVED</span>}
                                                    </td>
                                                    <td style={{ padding: '1.2rem' }}>
                                                        {enr.status === 'pending' ? (
                                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                                <button onClick={() => handleEnrollmentAction(enr.id, 'approved')} style={{ background: '#10b981', color: '#fff', border: 'none', padding: '8px 12px', borderRadius: '8px', cursor: 'pointer', fontWeight: 700 }}>Approve</button>
                                                                <button onClick={() => handleEnrollmentAction(enr.id, 'rejected')} style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '8px 12px', borderRadius: '8px', cursor: 'pointer', fontWeight: 700 }}>Reject</button>
                                                            </div>
                                                        ) : (
                                                            <button onClick={() => handleEnrollmentAction(enr.id, 'rejected')} style={{ background: '#fff', color: '#ef4444', border: '1px solid #ef4444', padding: '6px 10px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>Revoke</button>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </motion.div>
                )}
                </div>
            </main>

            {/* ── PREMIUM CUSTOM MODAL ── */}
            <AnimatePresence>
                {modal.show && (
                    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
                        <motion.div 
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setModal({ ...modal, show: false })}
                            style={{ position: 'absolute', inset: 0, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(8px)' }} 
                        />
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            style={{ position: 'relative', width: '100%', maxWidth: '400px', background: '#fff', borderRadius: '24px', padding: '2rem', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', overflow: 'hidden' }}
                        >
                            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '4px', background: modal.type === 'confirm' ? '#a855f7' : '#ef4444' }} />
                            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.5rem' }}>{modal.title}</h2>
                            <p style={{ color: '#64748b', lineHeight: 1.6, marginBottom: '2rem' }}>{modal.message}</p>
                            
                            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                                <button 
                                    onClick={() => setModal({ ...modal, show: false })}
                                    style={{ padding: '12px 20px', borderRadius: '12px', border: '1px solid #e2e8f0', background: 'none', color: '#64748b', fontWeight: 700, cursor: 'pointer' }}
                                >
                                    {modal.type === 'confirm' ? 'Cancel' : 'Close'}
                                </button>
                                {modal.type === 'confirm' && (
                                    <button 
                                        onClick={() => { modal.onConfirm(); setModal({ ...modal, show: false }); }}
                                        style={{ padding: '12px 24px', borderRadius: '12px', border: 'none', background: '#a855f7', color: '#fff', fontWeight: 700, cursor: 'pointer', boxShadow: '0 10px 15px -3px rgba(168, 85, 247, 0.3)' }}
                                    >
                                        Proceed
                                    </button>
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* ── PREMIUM TOAST ── */}
            <AnimatePresence>
                {toast.show && (
                    <motion.div 
                        initial={{ opacity: 0, y: 50, x: '-50%' }} animate={{ opacity: 1, y: 0, x: '-50%' }} exit={{ opacity: 0, y: 20, x: '-50%' }}
                        style={{ position: 'fixed', bottom: '40px', left: '50%', zIndex: 2000, background: '#0f172a', color: '#fff', padding: '12px 24px', borderRadius: '100px', display: 'flex', alignItems: 'center', gap: '10px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)', border: '1px solid rgba(168, 85, 247, 0.2)' }}
                    >
                        <i className={`fa-solid ${toast.type === 'success' ? 'fa-circle-check' : 'fa-circle-exclamation'}`} style={{ color: toast.type === 'success' ? '#10b981' : '#ef4444' }}></i>
                        <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{toast.message}</span>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AdminDashboard;

