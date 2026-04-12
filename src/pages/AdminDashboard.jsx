import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';
import Cursor from '../components/Cursor';
import '../pages/Dashboard.css';

// ── ICT Unit 1-13 Thumbnails (local assets) ──
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

const UNIT_THUMBS = { 1:thumb1, 2:thumb2, 3:thumb3, 4:thumb4, 5:thumb5, 6:thumb6, 7:thumb7, 8:thumb8, 9:thumb9, 10:thumb10, 11:thumb11, 12:thumb12, 13:thumb13 };

const ICT_UNITS = [
    { no: 1,  name: 'Unit 1 – Information Representation' },
    { no: 2,  name: 'Unit 2 – Computer Organization' },
    { no: 3,  name: 'Unit 3 – Networking' },
    { no: 4,  name: 'Unit 4 – Internet & Web' },
    { no: 5,  name: 'Unit 5 – Database' },
    { no: 6,  name: 'Unit 6 – System Analysis' },
    { no: 7,  name: 'Unit 7 – Programming' },
    { no: 8,  name: 'Unit 8 – Software Engineering' },
    { no: 9,  name: 'Unit 9 – Logic Gates' },
    { no: 10, name: 'Unit 10 – Computer Ethics' },
    { no: 11, name: 'Unit 11 – Multimedia' },
    { no: 12, name: 'Unit 12 – Artificial Intelligence' },
    { no: 13, name: 'Unit 13 – Social Impact' },
];

const CLASS_TYPES = ['Theory', 'Revision', 'Theory + Revision', 'Paper'];
const BATCHES     = ['2026', '2027', '2028'];
const MONTHS      = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const IMGBB_KEY   = 'c0ac744b3989122820b4ce302fc16cc4'; // ← your new Imgbb API key

const AdminDashboard = () => {
    const navigate = useNavigate();
    const [adminUser, setAdminUser]   = useState(null);
    const [activeTab, setActiveTab]   = useState('overview');

    // ── Data ──
    const [classes,      setClasses]      = useState([]);
    const [sessions,     setSessions]     = useState([]);
    const [enrollments,  setEnrollments]  = useState([]);
    const [allProfiles,  setAllProfiles]  = useState([]);
    const [recRequests,  setRecRequests]  = useState([]);
    const [viewingStudent, setViewingStudent] = useState(null);

    // ── Papers & Marks ──
    const [papers,       setPapers]       = useState([]);
    const [paperMarks,   setPaperMarks]   = useState([]);
    const [newPaperTitle, setNewPaperTitle] = useState('');
    const [activePaper,  setActivePaper]  = useState(null); // paper being marked
    const [markInputs,   setMarkInputs]   = useState({});   // { studentId: marks|'AB' }

    // ── Main Class Form ──
    const [newClass, setNewClass] = useState({ title:'', description:'', type:'Theory', batch:'', price:'' });
    const [thumbFile, setThumbFile] = useState(null);
    const [thumbPreview, setThumbPreview] = useState(null);
    const [classUploading, setClassUploading] = useState(false);

    // ── Session Form ──
    const [newSession, setNewSession] = useState({ main_class_id:'', title:'', description:'', unit_no:'', session_date:'', video_id:'', zoom_link:'', pdf_url:'' });
    const [pdfFile, setPdfFile] = useState(null);
    const [sessionViewClass, setSessionViewClass] = useState(null);
    const [editingSession, setEditingSession] = useState(null); // { ...sessionObj } being edited
    const [isEditing, setIsEditing] = useState(false);

    // ── Approval Form ──
    const [approvalMonth, setApprovalMonth] = useState({});   // { [enrollId]: monthString }

    // ── UI ──
    const [modal, setModal] = useState({ show:false, title:'', message:'', onConfirm:null, type:'confirm' });
    const [toast, setToast] = useState({ show:false, message:'', type:'success' });
    const [isCreating, setIsCreating] = useState(false);

    // ── Helpers ──
    const showToast = (message, type='success') => {
        setToast({ show:true, message, type });
        setTimeout(() => setToast({ show:false, message:'', type:'success' }), 3500);
    };
    const confirmAction = (title, message, onConfirm) =>
        setModal({ show:true, title, message, onConfirm, type:'confirm' });
    const showAlert = (title, message) =>
        setModal({ show:true, title, message, onConfirm:null, type:'alert' });

    // ── Auth Check ──
    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session) { setAdminUser(session.user); fetchAll(); }
            else navigate('/login');
        });
    }, [navigate]);

    // ── Fetch All Data ──
    const fetchAll = async () => {
        const [cls, enr, prf, ses, req] = await Promise.all([
            supabase.from('classes').select('*').order('created_at', { ascending:false }),
            supabase.from('enrollments').select('*').order('created_at', { ascending:false }),
            supabase.from('profiles').select('*').order('created_at', { ascending:false }),
            supabase.from('class_sessions').select('*').order('session_date', { ascending:true }),
            supabase.from('recording_requests').select('*').order('created_at', { ascending:false }),
        ]);
        if (cls.data)  setClasses(cls.data);
        if (enr.data)  setEnrollments(enr.data);
        if (prf.data)  setAllProfiles(prf.data);
        if (ses.data)  setSessions(ses.data);
        if (req.data)  setRecRequests(req.data);

        // Papers & Marks
        const [pap, pm] = await Promise.all([
            supabase.from('papers').select('*').order('created_at', { ascending: false }),
            supabase.from('paper_marks').select('*'),
        ]);
        if (pap.data) setPapers(pap.data);
        if (pm.data)  setPaperMarks(pm.data);
    };

    // ── Imgbb Upload ──
    const uploadToImgbb = async (file) => {
        const form = new FormData();
        form.append('image', file);
        const res  = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_KEY}`, { method:'POST', body:form });
        const json = await res.json();
        if (!json.success) throw new Error(json.error?.message || 'Imgbb upload failed');
        return json.data.url;
    };

    // ── Handle Class Create ──
    const handleCreateClass = async (e) => {
        e.preventDefault();
        setClassUploading(true);
        try {
            let imageUrl = '';
            if (thumbFile) imageUrl = await uploadToImgbb(thumbFile);
            const payload = {
                title: newClass.title,
                description: newClass.description,
                type: newClass.type,
                badge: newClass.batch,
                price: parseFloat(newClass.price),
                image_url: imageUrl,
            };
            const { error } = await supabase.from('classes').insert([payload]);
            if (error) throw error;
            showToast('Class created successfully! 🎉', 'success');
            setNewClass({ title:'', description:'', type:'Theory', batch:'2026', price:'' });
            setThumbFile(null); setThumbPreview(null);
            fetchAll();
        } catch (err) {
            showAlert('Upload Failed', err.message);
        } finally {
            setClassUploading(false);
        }
    };

    // ── Handle Session Create / Edit ──
    const handleSessionSubmit = async (e) => {
        e.preventDefault();
        const obj = isEditing ? editingSession : newSession;
        if (!obj.title.trim()) {
            showToast('Title is required', 'error');
            return;
        }

        setIsCreating(true);
        let finalPdfUrl = obj.pdf_url;

        if (pdfFile) {
            try {
                // IMPORTANT: Replace this URL with your Google Apps Script Web App URL
                const GAS_URL = "https://script.google.com/macros/s/AKfycbzlWYEt6v616czzpwbEo_4S7EZ24WZIvcVTNmLIVBMUR4uJ0P_ue54SHgEfD7LT-btR/exec"; 
                if (GAS_URL === "YOUR_APPS_SCRIPT_WEB_APP_URL_HERE") {
                    showAlert('Setup Required', 'Please deploy the Google Apps Script and enter the URL in AdminDashboard.jsx first!');
                    setIsCreating(false);
                    return;
                }

                const base64Data = await new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.readAsDataURL(pdfFile);
                    reader.onload = () => resolve(reader.result.split(',')[1]);
                    reader.onerror = error => reject(error);
                });

                const res = await fetch(GAS_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'text/plain' }, // Bypass Preflight
                    body: JSON.stringify({
                        filename: pdfFile.name,
                        mimeType: pdfFile.type,
                        file: base64Data
                    })
                });

                const data = await res.json();
                if (data.status === 'success') {
                    // Google Drive returns the ID, we save the direct download link!
                    finalPdfUrl = `https://drive.google.com/uc?export=download&id=${data.fileId}`;
                } else {
                    throw new Error(data.message || 'Upload failed');
                }
            } catch (err) {
                showAlert('Upload Error', 'Google Drive Upload Failed: ' + err.message);
                setIsCreating(false);
                return;
            }
        }

        try {
            const unitNo = parseInt(obj.unit_no) || null;
            const payload = {
                title: obj.title,
                description: obj.description,
                unit_no: unitNo,
                session_date: obj.session_date || null,
                video_id: obj.video_id || null,
                zoom_link: obj.zoom_link || null,
                pdf_url: finalPdfUrl || null
            };

            if (isEditing) {
                const { error } = await supabase.from('class_sessions').update(payload).eq('id', obj.id);
                if (error) throw error;
                showToast('Session saved! ✅', 'success');
                setIsEditing(false);
                setEditingSession(null);
            } else {
                payload.main_class_id = obj.main_class_id;
                const { error } = await supabase.from('class_sessions').insert([payload]);
                if (error) throw error;
                showToast('Session created! ✅', 'success');
                setNewSession({ main_class_id: '', title:'', description:'', unit_no:'', session_date:'', video_id:'', zoom_link:'', pdf_url:'' });
            }
            setPdfFile(null);
            fetchAll();
        } catch (err) {
            showAlert('Failed', err.message);
        } finally {
            setIsCreating(false);
        }
    };

    const handleDelete = (table, id, label) => {
        confirmAction(`Delete ${label}?`, `This will permanently remove this ${label.toLowerCase()}. Are you sure?`, async () => {
            const { error } = await supabase.from(table).delete().eq('id', id);
            if (error) showAlert('Delete Failed', error.message);
            else { showToast(`${label} deleted.`, 'success'); fetchAll(); }
        });
    };

    const handleApprove = (enr) => {
        const month = approvalMonth[enr.id];
        if (!month) { showAlert('Select Month', 'Please select the month this student paid for.'); return; }

        const now = new Date();
        const monthIdx = MONTHS.indexOf(month);
        const year = now.getFullYear();
        const endOfMonth = new Date(year, monthIdx + 1, 0);
        endOfMonth.setDate(endOfMonth.getDate() + 14);

        confirmAction('Approve Enrollment?',
            `Student will get access for ${month} + 2-week grace until ${endOfMonth.toDateString()}. Payment slip will be cleared.`,
            async () => {
                try {
                    if (enr.slip_url && enr.slip_url.includes('/storage/v1/object/public/slips/')) {
                        const fp = enr.slip_url.split('/storage/v1/object/public/slips/')[1];
                        if (fp) await supabase.storage.from('slips').remove([decodeURIComponent(fp)]);
                    }
                    const { error } = await supabase.from('enrollments').update({
                        status:      'approved',
                        slip_url:    '',
                        paid_month:  month,
                        expiry_date: endOfMonth.toISOString(),
                    }).eq('id', enr.id);
                    if (error) throw error;
                    showToast(`Approved for ${month}! ✅`, 'success');
                    fetchAll();
                } catch (err) { showAlert('Failed', err.message); }
            }
        );
    };

    const handleReject = (enrId) => {
        confirmAction('Reject & Delete?', 'This will remove the enrollment request entirely.', async () => {
            const enr = enrollments.find(e => e.id === enrId);
            if (enr?.slip_url?.includes('/storage/v1/object/public/slips/')) {
                const fp = enr.slip_url.split('/storage/v1/object/public/slips/')[1];
                if (fp) await supabase.storage.from('slips').remove([decodeURIComponent(fp)]);
            }
            const { error } = await supabase.from('enrollments').delete().eq('id', enrId);
            if (error) showAlert('Failed', error.message);
            else { showToast('Enrollment rejected.', 'success'); fetchAll(); }
        });
    };

    const handleApproveRecording = async (reqId) => {
        const { error } = await supabase.from('recording_requests').update({ status:'approved' }).eq('id', reqId);
        if (error) showAlert('Failed', error.message);
        else { showToast('Recording unlocked for student! ✅', 'success'); fetchAll(); }
    };

    const handleLogout = async () => { await supabase.auth.signOut(); navigate('/'); };

    if (!adminUser) return (
        <div style={{ background:'#0f172a', height:'100vh', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <Cursor />
            <h2 style={{ color:'#a855f7' }}>Verifying Admin...</h2>
        </div>
    );

    const pending = enrollments.filter(e => e.status === 'pending').length;
    const pendingRec = recRequests.filter(r => r.status === 'pending').length;

    const NAV = [
        { id:'overview',  icon:'border-all',      label:'Overview' },
        { id:'classes',   icon:'graduation-cap',  label:'Classes' },
        { id:'sessions',  icon:'calendar-days',   label:'Sessions' },
        { id:'students',  icon:'users',            label:'All Users' },
        { id:'papers',    icon:'file-pen',         label:'Papers & Marks' },
        { id:'approvals', icon:'check-double',    label:'Payment Sweeps', badge: pending },
        { id:'recordings',icon:'film',             label:'Recording Requests', badge: pendingRec },
    ];

    const cv = { hidden:{ opacity:0 }, visible:{ opacity:1, transition:{ staggerChildren:0.08 } } };
    const iv = { hidden:{ opacity:0, y:16 }, visible:{ opacity:1, y:0, transition:{ type:'spring', stiffness:300, damping:24 } } };

    const inp = { padding:'12px 14px', borderRadius:'12px', border:'1.5px solid #e2e8f0', fontFamily:'inherit', fontSize:'0.95rem', outline:'none', width:'100%', boxSizing:'border-box', background:'#f8fafc' };
    const btn = (bg, c='#fff') => ({ padding:'13px 20px', borderRadius:'12px', border:'none', background:bg, color:c, fontWeight:800, cursor:'pointer', fontFamily:'inherit', fontSize:'0.95rem' });

    return (
        <div style={{ display:'flex', height:'100vh', width:'100vw', background:'#f8fafc', overflow:'hidden', fontFamily:"'Outfit', sans-serif" }}>
            <Cursor />

            <aside style={{ width:'270px', background:'#fff', borderRight:'1px solid #f1f5f9', display:'flex', flexDirection:'column', zIndex:10, flexShrink:0 }}>
                <div style={{ padding:'1.8rem 1.5rem', borderBottom:'1px solid #f1f5f9' }}>
                    <h1 style={{ margin:0, fontSize:'1.4rem', fontWeight:900, color:'#0f172a' }}>RDICT<span style={{ color:'#a855f7' }}>.</span>Admin</h1>
                    <p style={{ margin:0, fontSize:'0.78rem', color:'#64748b', fontWeight:600, marginTop:'2px' }}>Command Center</p>
                </div>

                <nav style={{ flex:1, padding:'1.2rem 0.8rem', display:'flex', flexDirection:'column', gap:'4px', overflowY:'auto' }}>
                    {NAV.map(item => {
                        const active = activeTab === item.id;
                        return (
                            <button key={item.id} onClick={() => setActiveTab(item.id)} style={{
                                display:'flex', alignItems:'center', gap:'12px', padding:'13px 16px',
                                background: active ? 'linear-gradient(135deg, #a855f7, #7c3aed)' : 'transparent',
                                color: active ? '#fff' : '#64748b',
                                border:'none', borderRadius:'12px', cursor:'pointer',
                                fontSize:'0.95rem', fontWeight:700, transition:'all 0.2s', textAlign:'left',
                                boxShadow: active ? '0 4px 15px rgba(168,85,247,0.3)' : 'none'
                            }}>
                                <i className={`fa-solid fa-${item.icon}`} style={{ fontSize:'1rem', width:'18px', textAlign:'center' }} />
                                <span style={{ flex:1 }}>{item.label}</span>
                                {item.badge > 0 && (
                                    <span style={{ background: active ? 'rgba(255,255,255,0.25)' : '#ef4444', color:'#fff', padding:'2px 8px', borderRadius:'100px', fontSize:'0.72rem', fontWeight:800 }}>
                                        {item.badge}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </nav>

                <div style={{ padding:'1.5rem 1.2rem', borderTop:'1px solid #f1f5f9' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:'12px', marginBottom:'1rem' }}>
                        <div style={{ width:'38px', height:'38px', borderRadius:'10px', background:'rgba(168,85,247,0.12)', color:'#a855f7', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, fontSize:'1.1rem' }}>A</div>
                        <div>
                            <div style={{ fontWeight:800, color:'#0f172a', fontSize:'0.88rem' }}>Master Admin</div>
                            <div style={{ color:'#10b981', fontSize:'0.72rem', fontWeight:700 }}>● Online</div>
                        </div>
                    </div>
                    <button onClick={handleLogout} style={{ ...btn('rgba(239,68,68,0.1)', '#ef4444'), width:'100%', display:'flex', alignItems:'center', justifyContent:'center', gap:'8px' }}>
                        <i className="fa-solid fa-arrow-right-from-bracket" /> Logout
                    </button>
                </div>
            </aside>

            <main style={{ flex:1, overflowY:'auto', padding:'2rem 2.5rem' }}>
                <div style={{ maxWidth:'1100px', margin:'0 auto', paddingBottom:'4rem' }}>

                    {/* ══ 1. OVERVIEW ══ */}
                    {activeTab === 'overview' && (
                        <motion.div variants={cv} initial="hidden" animate="visible">
                            <h1 style={{ fontSize:'1.8rem', fontWeight:900, color:'#0f172a', marginBottom:'0.3rem' }}>👑 Admin Control Center</h1>
                            <p style={{ color:'#64748b', marginBottom:'2rem' }}>Live system overview</p>
                            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px,1fr))', gap:'1.5rem' }}>
                                {[
                                    { label:'Total Students', value:allProfiles.length,    color:'#3b82f6', icon:'users' },
                                    { label:'Main Classes',   value:classes.length,         color:'#a855f7', icon:'graduation-cap' },
                                    { label:'Sessions',       value:sessions.length,        color:'#10b981', icon:'calendar-days' },
                                    { label:'Pending Sweeps', value:pending,                color:'#f59e0b', icon:'clock-rotate-left' },
                                    { label:'Rec. Requests',  value:pendingRec,             color:'#ef4444', icon:'film' },
                                ].map((st, i) => (
                                    <motion.div key={i} variants={iv} style={{ background:'#fff', borderRadius:'20px', padding:'1.5rem', border:'1px solid #f1f5f9', boxShadow:'0 4px 20px rgba(0,0,0,0.03)' }}>
                                        <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'10px' }}>
                                            <div style={{ background:`${st.color}1A`, color:st.color, width:'38px', height:'38px', borderRadius:'10px', display:'flex', alignItems:'center', justifyContent:'center' }}>
                                                <i className={`fa-solid fa-${st.icon}`} />
                                            </div>
                                            <span style={{ color:'#64748b', fontWeight:600, fontSize:'0.9rem' }}>{st.label}</span>
                                        </div>
                                        <h2 style={{ fontSize:'2.2rem', fontWeight:900, color:'#0f172a', margin:0 }}>{st.value}</h2>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {/* ══ 2. CLASSES ══ */}
                    {activeTab === 'classes' && (
                        <motion.div variants={cv} initial="hidden" animate="visible">
                            <h1 style={{ fontSize:'1.8rem', fontWeight:900, color:'#0f172a', marginBottom:'0.3rem' }}>📚 Main Classes</h1>
                            <p style={{ color:'#64748b', marginBottom:'2rem' }}>Create and manage top-level class categories.</p>

                            <div style={{ background:'#fff', borderRadius:'24px', padding:'2rem', boxShadow:'0 4px 30px rgba(0,0,0,0.04)', marginBottom:'2.5rem', border:'1px solid #f1f5f9' }}>
                                <h2 style={{ fontWeight:800, fontSize:'1.1rem', color:'#0f172a', marginBottom:'1.5rem' }}>
                                    <i className="fa-solid fa-plus-circle" style={{ color:'#a855f7', marginRight:'8px' }} />
                                    Create New Main Class
                                </h2>
                                <form onSubmit={handleCreateClass} style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem' }}>
                                    <input required style={{ ...inp, gridColumn:'1/-1' }} placeholder="Class Title (e.g. 2026 ICT Theory)" value={newClass.title} onChange={e => setNewClass({...newClass, title:e.target.value})} />
                                    <textarea rows="2" style={{ ...inp, gridColumn:'1/-1', resize:'vertical' }} placeholder="Short description..." value={newClass.description} onChange={e => setNewClass({...newClass, description:e.target.value})} />

                                    <div style={{ display:'flex', flexDirection:'column', gap:'6px' }}>
                                        <label style={{ fontSize:'0.8rem', fontWeight:700, color:'#64748b' }}>Class Type</label>
                                        <select style={inp} value={newClass.type} onChange={e => setNewClass({...newClass, type:e.target.value})}>
                                            {CLASS_TYPES.map(t => <option key={t}>{t}</option>)}
                                        </select>
                                    </div>

                                    <div style={{ display:'flex', flexDirection:'column', gap:'6px' }}>
                                        <label style={{ fontSize:'0.8rem', fontWeight:700, color:'#64748b' }}>Exam Batches (Visible to)</label>
                                        <div style={{ display:'flex', gap:'12px', flexWrap:'wrap', padding:'10px 14px', borderRadius:'12px', border:'1.5px solid #e2e8f0', background:'#f8fafc' }}>
                                            {BATCHES.map(b => {
                                                const currentBatches = (newClass.batch || '').split(',').map(x=>x.trim()).filter(Boolean);
                                                const isChecked = currentBatches.includes(b);
                                                return (
                                                    <label key={b} style={{ display:'flex', alignItems:'center', gap:'6px', cursor:'pointer', fontSize:'0.9rem', color:'#0f172a', fontWeight:600 }}>
                                                        <input type="checkbox" checked={isChecked} onChange={(e) => {
                                                            let updated = [...currentBatches];
                                                            if (e.target.checked) updated.push(b);
                                                            else updated = updated.filter(x => x !== b);
                                                            setNewClass({...newClass, batch: updated.join(',')});
                                                        }} /> {b}
                                                    </label>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    <input required type="number" style={inp} placeholder="Monthly Fee (LKR)" value={newClass.price} onChange={e => setNewClass({...newClass, price:e.target.value})} />

                                    <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
                                        <label style={{ fontSize:'0.8rem', fontWeight:700, color:'#64748b' }}>Thumbnail Image</label>
                                        <label style={{ border:'2px dashed #e2e8f0', borderRadius:'12px', padding:'14px', textAlign:'center', cursor:'pointer', background:'#fafafa', color:'#64748b', fontWeight:600, fontSize:'0.85rem' }}>
                                            {thumbPreview ? '✅ Image Selected' : '📂 Browse & Upload'}
                                            <input type="file" accept="image/*" style={{ display:'none' }} onChange={e => {
                                                const f = e.target.files[0]; if (!f) return;
                                                setThumbFile(f);
                                                setThumbPreview(URL.createObjectURL(f));
                                            }} />
                                        </label>
                                        {thumbPreview && <img src={thumbPreview} alt="preview" style={{ width:'100%', height:'80px', objectFit:'cover', borderRadius:'10px' }} />}
                                    </div>

                                    <button type="submit" disabled={classUploading} style={{ ...btn(classUploading ? '#94a3b8' : 'linear-gradient(135deg,#a855f7,#7c3aed)'), gridColumn:'1/-1' }}>
                                        {classUploading ? '⏳ Uploading...' : '🚀 Create Main Class'}
                                    </button>
                                </form>
                            </div>

                            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(280px,1fr))', gap:'1.5rem' }}>
                                {classes.map(cls => (
                                    <motion.div key={cls.id} variants={iv} style={{ background:'#fff', borderRadius:'20px', overflow:'hidden', boxShadow:'0 4px 20px rgba(0,0,0,0.04)', border:'1px solid #f1f5f9' }}>
                                        <div style={{ height:'130px', background: cls.image_url ? `url(${cls.image_url}) center/cover` : 'linear-gradient(135deg,#a855f7,#3b82f6)', position:'relative' }}>
                                            <span style={{ position:'absolute', top:'10px', left:'10px', background:'rgba(0,0,0,0.5)', color:'#fff', fontSize:'0.72rem', fontWeight:800, padding:'3px 10px', borderRadius:'100px' }}>{cls.badge} • {cls.type}</span>
                                        </div>
                                        <div style={{ padding:'1.2rem' }}>
                                            <h3 style={{ fontWeight:800, color:'#0f172a', margin:'0 0 4px' }}>{cls.title}</h3>
                                            <p style={{ color:'#64748b', fontSize:'0.85rem', margin:'0 0 12px' }}>{cls.description}</p>
                                            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                                                <span style={{ fontWeight:800, color:'#a855f7' }}>Rs. {cls.price}/mo</span>
                                                <button onClick={() => confirmAction('Delete Class?', 'This removes everything inside it.', async () => { await supabase.from('classes').delete().eq('id', cls.id); fetchAll(); })} style={{ ...btn('#fee2e2','#ef4444'), padding:'8px 12px' }}><i className="fa-solid fa-trash" /></button>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {/* ══ 3. SESSIONS ══ */}
                    {activeTab === 'sessions' && (
                        <motion.div variants={cv} initial="hidden" animate="visible">
                            <h1 style={{ fontSize:'1.8rem', fontWeight:900, color:'#0f172a', marginBottom:'0.3rem' }}>📅 Class Sessions</h1>
                            <p style={{ color:'#64748b', marginBottom:'2rem' }}>Add individual sessions (with live / recording) inside a main class.</p>

                            <div style={{ background:'#fff', borderRadius:'24px', padding:'2rem', boxShadow:'0 4px 30px rgba(0,0,0,0.04)', marginBottom:'2.5rem', border:'1px solid #f1f5f9' }}>
                                <h2 style={{ fontWeight:800, fontSize:'1.1rem', color:'#0f172a', marginBottom:'1.5rem' }}>
                                    <i className="fa-solid fa-calendar-plus" style={{ color:'#10b981', marginRight:'8px' }} />
                                    Add New Session
                                </h2>
                                <form onSubmit={handleSessionSubmit} style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem' }}>
                                    <div style={{ gridColumn:'1/-1', display:'flex', flexDirection:'column', gap:'6px' }}>
                                        <label style={{ fontSize:'0.8rem', fontWeight:700, color:'#64748b' }}>Assign to Main Class</label>
                                        <select required style={inp} value={newSession.main_class_id} onChange={e => setNewSession({...newSession, main_class_id:e.target.value})}>
                                            <option value="">-- Select Main Class --</option>
                                            {classes.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                                        </select>
                                    </div>

                                    <div style={{ display:'flex', flexDirection:'column', gap:'6px' }}>
                                        <label style={{ fontSize:'0.8rem', fontWeight:700, color:'#64748b' }}>ICT Unit (1–13)</label>
                                        <select style={inp} value={newSession.unit_no} onChange={e => setNewSession({...newSession, unit_no:e.target.value})}>
                                            <option value="">-- No Unit / General --</option>
                                            {ICT_UNITS.map(u => <option key={u.no} value={u.no}>{u.name}</option>)}
                                        </select>
                                    </div>

                                    <div style={{ display:'flex', flexDirection:'column', gap:'6px' }}>
                                        <label style={{ fontSize:'0.8rem', fontWeight:700, color:'#64748b' }}>Session Date</label>
                                        <input type="date" style={inp} value={newSession.session_date} onChange={e => setNewSession({...newSession, session_date:e.target.value})} />
                                    </div>

                                    <input required style={{ ...inp, gridColumn:'1/-1' }} placeholder="Session Title (e.g. Week 3 – Networking Theory)" value={newSession.title} onChange={e => setNewSession({...newSession, title:e.target.value})} />

                                    <textarea rows="2" style={{ ...inp, gridColumn:'1/-1', resize:'vertical' }} placeholder="Description (optional)" value={newSession.description} onChange={e => setNewSession({...newSession, description:e.target.value})} />

                                    <div style={{ display:'flex', flexDirection:'column', gap:'6px' }}>
                                        <label style={{ fontSize:'0.8rem', fontWeight:700, color:'#64748b' }}>YouTube Recording ID</label>
                                        <input style={inp} placeholder="e.g. dQw4w9WgXcQ" value={newSession.video_id} onChange={e => setNewSession({...newSession, video_id:e.target.value})} />
                                    </div>

                                    <div style={{ display:'flex', flexDirection:'column', gap:'6px' }}>
                                        <label style={{ fontSize:'0.8rem', fontWeight:700, color:'#64748b' }}>Live Zoom Link (Optional)</label>
                                        <input type="url" style={inp} placeholder="https://zoom.us/j/..." value={newSession.zoom_link} onChange={e => setNewSession({...newSession, zoom_link:e.target.value})} />
                                    </div>

                                    <div style={{ display:'flex', flexDirection:'column', gap:'6px', gridColumn: '1 / -1' }}>
                                        <label style={{ fontSize:'0.8rem', fontWeight:700, color:'#64748b' }}>Upload Updated Materials (To Google Drive)</label>
                                        <div style={{ display:'flex', gap:'10px' }}>
                                            <label style={{ ...btn('#f1f5f9', '#0f172a'), flexShrink:0, display:'flex', alignItems:'center', gap:'8px', cursor:'pointer' }}>
                                                {pdfFile ? <><i className="fa-solid fa-check" style={{ color:'#10b981' }}/> Selected</> : <><i className="fa-solid fa-upload"/> Browse File</>}
                                                <input type="file" style={{ display:'none' }} onChange={e => { if (e.target.files[0]) setPdfFile(e.target.files[0]); }} />
                                            </label>
                                            <input style={{ ...inp, width:'100%' }} placeholder="Or override with custom external link" value={newSession.pdf_url} onChange={e => setNewSession({...newSession, pdf_url:e.target.value})} />
                                        </div>
                                    </div>

                                    <button type="submit" disabled={isCreating} style={{ ...btn(isCreating ? '#94a3b8' : '#10b981'), gridColumn:'1/-1' }}>
                                        {isCreating ? '⏳ Saving...' : '✅ Add Session'}
                                    </button>
                                </form>
                            </div>

                            {classes.map(cls => {
                                const cls_sessions = sessions.filter(s => s.main_class_id === cls.id);
                                const expanded = sessionViewClass === cls.id;
                                return (
                                    <motion.div key={cls.id} variants={iv} style={{ background:'#fff', borderRadius:'20px', marginBottom:'1rem', border:'1px solid #f1f5f9', overflow:'hidden' }}>
                                        <button onClick={() => setSessionViewClass(expanded ? null : cls.id)} style={{ width:'100%', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'1.2rem 1.5rem', background:'none', border:'none', cursor:'pointer', fontFamily:'inherit' }}>
                                            <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
                                                {cls.image_url && <img src={cls.image_url} alt="" style={{ width:'40px', height:'40px', borderRadius:'8px', objectFit:'cover' }} />}
                                                <div style={{ textAlign:'left' }}>
                                                    <div style={{ fontWeight:800, color:'#0f172a' }}>{cls.title}</div>
                                                    <div style={{ fontSize:'0.8rem', color:'#64748b' }}>{cls_sessions.length} sessions • {cls.badge} • {cls.type}</div>
                                                </div>
                                            </div>
                                            <i className={`fa-solid fa-chevron-${expanded ? 'up' : 'down'}`} style={{ color:'#94a3b8' }} />
                                        </button>
                                        <AnimatePresence>
                                            {expanded && (
                                                <motion.div initial={{ height:0, opacity:0 }} animate={{ height:'auto', opacity:1 }} exit={{ height:0, opacity:0 }} style={{ overflow:'hidden' }}>
                                                    <div style={{ padding:'0 1.5rem 1.5rem', display:'flex', flexDirection:'column', gap:'8px' }}>
                                                        {cls_sessions.length === 0 && <p style={{ color:'#94a3b8', fontSize:'0.85rem' }}>No sessions yet. Add from the form above.</p>}
                                                        {cls_sessions.map(s => (
                                                            <div key={s.id} style={{ display:'flex', alignItems:'center', gap:'12px', padding:'10px 12px', background:'#f8fafc', borderRadius:'12px', border:'1px solid #e2e8f0' }}>
                                                                {s.unit_no && <img src={UNIT_THUMBS[s.unit_no]} alt="" style={{ width:'48px', height:'32px', objectFit:'cover', borderRadius:'6px', flexShrink:0 }} />}
                                                                <div style={{ flex:1 }}>
                                                                    <div style={{ fontWeight:700, color:'#0f172a', fontSize:'0.9rem' }}>{s.title}</div>
                                                                    <div style={{ fontSize:'0.75rem', color:'#64748b', display:'flex', gap:'6px', flexWrap:'wrap' }}>
                                                                        {s.session_date && <span>📅 {s.session_date}</span>}
                                                                        {s.video_id ? <span style={{ color:'#10b981' }}>🎬 Recording ✓</span> : <span style={{ color:'#f59e0b' }}>🎬 No Recording Yet</span>}
                                                                        {s.zoom_link && <span style={{ color:'#3b82f6' }}>🎥 Live ✓</span>}
                                                                    </div>
                                                                </div>
                                                                <div style={{ display:'flex', gap:'6px' }}>
                                                                    <button onClick={() => setEditingSession({ ...s })} style={{ background:'rgba(59,130,246,0.1)', color:'#3b82f6', border:'none', padding:'6px 10px', borderRadius:'8px', cursor:'pointer', fontSize:'0.8rem', fontWeight:700 }}>
                                                                        <i className="fa-solid fa-pen" />
                                                                    </button>
                                                                    <button onClick={() => handleDelete('class_sessions', s.id, 'Session')} style={{ background:'#fee2e2', color:'#ef4444', border:'none', padding:'6px 10px', borderRadius:'8px', cursor:'pointer' }}>
                                                                        <i className="fa-solid fa-trash" />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </motion.div>
                                );
                            })}
                        </motion.div>
                    )}

                    {/* ══ 4. ALL STUDENTS ══ */}
                    {activeTab === 'students' && (
                        <motion.div variants={cv} initial="hidden" animate="visible">
                            <h1 style={{ fontSize:'1.8rem', fontWeight:900, color:'#0f172a', marginBottom:'0.3rem' }}>👥 All Registered Students</h1>
                            <p style={{ color:'#64748b', marginBottom:'2rem' }}>{allProfiles.length} total accounts</p>
                            <div style={{ background:'#fff', borderRadius:'24px', boxShadow:'0 4px 20px rgba(0,0,0,0.03)', overflow:'hidden', border:'1px solid #f1f5f9' }}>
                                <table style={{ width:'100%', borderCollapse:'collapse', textAlign:'left' }}>
                                    <thead style={{ background:'#f8fafc', color:'#64748b', fontSize:'0.8rem', textTransform:'uppercase', letterSpacing:'0.05em' }}>
                                        <tr>
                                            {['#','Name','School','Batch','Type','XP','Actions'].map(h => (
                                                <th key={h} style={{ padding:'1rem 1.2rem', borderBottom:'2px solid #f1f5f9', fontWeight:700 }}>{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {allProfiles.map((p, i) => (
                                            <tr key={p.id} style={{ borderBottom:'1px solid #f8fafc', cursor: 'pointer', transition: 'background 0.2s' }} onMouseOver={e => e.currentTarget.style.background = '#f8fafc'} onMouseOut={e => e.currentTarget.style.background = 'transparent'} onClick={() => setViewingStudent(p)}>
                                                <td style={{ padding:'1rem 1.2rem', color:'#94a3b8', fontWeight:600 }}>{i+1}</td>
                                                <td style={{ padding:'1rem 1.2rem', fontWeight:700, color:'#0f172a' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                        {p.avatar_url ? (
                                                            <img src={p.avatar_url} alt="avatar" style={{ width:'30px', height:'30px', borderRadius:'8px', objectFit:'cover' }} />
                                                        ) : (
                                                            <div style={{ width:'30px', height:'30px', borderRadius:'8px', background:'linear-gradient(135deg,#a855f7,#7c3aed)', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.8rem', fontWeight:800 }}>
                                                                {p.full_name ? p.full_name.charAt(0).toUpperCase() : 'S'}
                                                            </div>
                                                        )}
                                                        {p.full_name || '—'}
                                                    </div>
                                                </td>
                                                <td style={{ padding:'1rem 1.2rem', color:'#64748b', fontSize:'0.88rem' }}>{p.school_name || '—'}</td>
                                                <td style={{ padding:'1rem 1.2rem' }}><span style={{ background:'rgba(168,85,247,0.1)', color:'#a855f7', padding:'3px 10px', borderRadius:'8px', fontSize:'0.8rem', fontWeight:800 }}>{p.batch || '—'}</span></td>
                                                <td style={{ padding:'1rem 1.2rem' }}><span style={{ background: p.student_type === 'physical' ? 'rgba(16,185,129,0.1)' : 'rgba(59,130,246,0.1)', color: p.student_type === 'physical' ? '#10b981' : '#3b82f6', padding:'3px 10px', borderRadius:'8px', fontSize:'0.8rem', fontWeight:700 }}>{p.student_type || 'online'}</span></td>
                                                <td style={{ padding:'1rem 1.2rem', color:'#10b981', fontWeight:800 }}>{p.xp_points || 0}</td>
                                                <td style={{ padding:'1rem 1.2rem' }} onClick={e => e.stopPropagation()}>
                                                    <button onClick={() => setViewingStudent(p)} style={{ background:'#f1f5f9', color:'#0f172a', border:'none', padding:'6px 12px', borderRadius:'8px', cursor:'pointer', fontSize:'0.8rem', fontWeight:700, marginRight: '8px' }}>
                                                        View
                                                    </button>
                                                    <button onClick={() => handleDelete('profiles', p.id, 'User Profile')} style={{ background:'#fee2e2', color:'#ef4444', border:'none', padding:'6px 12px', borderRadius:'8px', cursor:'pointer', fontSize:'0.8rem', fontWeight:700 }}>
                                                        <i className="fa-solid fa-trash" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </motion.div>
                    )}

                    {/* ══ 5. PAYMENT SWEEPS / APPROVALS ══ */}
                    {activeTab === 'approvals' && (
                        <motion.div variants={cv} initial="hidden" animate="visible">
                            <h1 style={{ fontSize:'1.8rem', fontWeight:900, color:'#0f172a', marginBottom:'0.3rem' }}>💸 Payment Sweeps</h1>
                            <p style={{ color:'#64748b', marginBottom:'2rem' }}>Review slips, select the paid month, and approve access.</p>
                            <div style={{ background:'#fff', borderRadius:'24px', boxShadow:'0 4px 20px rgba(0,0,0,0.03)', overflow:'hidden', border:'1px solid #f1f5f9' }}>
                                {enrollments.length === 0
                                    ? <div style={{ padding:'3rem', textAlign:'center', color:'#64748b' }}>No enrollments found.</div>
                                    : (
                                        <table style={{ width:'100%', borderCollapse:'collapse', textAlign:'left' }}>
                                            <thead style={{ background:'#f8fafc', color:'#64748b', fontSize:'0.8rem', textTransform:'uppercase' }}>
                                                <tr>
                                                    {['Student','Class','Slip','Paid Month','Status','Actions'].map(h => (
                                                        <th key={h} style={{ padding:'1rem 1.2rem', borderBottom:'2px solid #f1f5f9', fontWeight:700 }}>{h}</th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {enrollments.map((enr) => {
                                                    const student = allProfiles.find(p => p.id === enr.user_id);
                                                    const cls     = classes.find(c => c.id === enr.class_id);
                                                    return (
                                                        <tr key={enr.id} style={{ borderBottom:'1px solid #f8fafc', background: enr.status === 'pending' ? 'rgba(245,158,11,0.02)' : '#fff' }}>
                                                            <td style={{ padding:'1rem 1.2rem' }}>
                                                                <div style={{ fontWeight:700, color:'#0f172a' }}>
                                                                    {student?.full_name || `User: ${enr.user_id.substring(0,8)}...`}
                                                                </div>
                                                                <div style={{ fontSize:'0.78rem', color:'#64748b' }}>
                                                                    {student?.school_name || (student ? 'No School info' : 'Loading Profile...')}
                                                                </div>
                                                            </td>
                                                            <td style={{ padding:'1rem 1.2rem', fontWeight:600, color:'#a855f7', fontSize:'0.9rem' }}>{cls?.title || 'Deleted'}</td>
                                                            <td style={{ padding:'1rem 1.2rem' }}>
                                                                {enr.slip_url
                                                                    ? <a href={enr.slip_url} target="_blank" rel="noreferrer" style={{ background:'rgba(59,130,246,0.1)', color:'#3b82f6', padding:'5px 12px', borderRadius:'100px', fontSize:'0.82rem', fontWeight:700, textDecoration:'none' }}>View Slip</a>
                                                                    : <span style={{ color:'#94a3b8', fontSize:'0.8rem' }}>Cleared</span>}
                                                            </td>
                                                            <td style={{ padding:'1rem 1.2rem' }}>
                                                                {enr.status === 'pending' ? (
                                                                    <select style={{ ...inp, width:'130px', padding:'6px 10px', fontSize:'0.82rem' }}
                                                                        value={approvalMonth[enr.id] || ''}
                                                                        onChange={e => setApprovalMonth({ ...approvalMonth, [enr.id]: e.target.value })}>
                                                                        <option value="">-- Month --</option>
                                                                        {MONTHS.map(m => <option key={m}>{m}</option>)}
                                                                    </select>
                                                                ) : (
                                                                    <span style={{ color:'#64748b', fontSize:'0.85rem' }}>{enr.paid_month || '—'}</span>
                                                                )}
                                                            </td>
                                                            <td style={{ padding:'1rem 1.2rem' }}>
                                                                {enr.status === 'pending'
                                                                    ? <span style={{ background:'#fef3c7', color:'#d97706', padding:'4px 10px', borderRadius:'10px', fontSize:'0.78rem', fontWeight:800 }}>PENDING</span>
                                                                    : <span style={{ background:'#d1fae5', color:'#059669', padding:'4px 10px', borderRadius:'10px', fontSize:'0.78rem', fontWeight:800 }}>APPROVED</span>}
                                                            </td>
                                                            <td style={{ padding:'1rem 1.2rem' }}>
                                                                {enr.status === 'pending' ? (
                                                                    <div style={{ display:'flex', gap:'6px' }}>
                                                                        <button onClick={() => handleApprove(enr)} style={{ ...btn('#10b981'), padding:'7px 12px', fontSize:'0.82rem' }}>Approve</button>
                                                                        <button onClick={() => handleReject(enr.id)} style={{ ...btn('#ef4444'), padding:'7px 12px', fontSize:'0.82rem' }}>Reject</button>
                                                                    </div>
                                                                ) : (
                                                                    <button onClick={() => handleReject(enr.id)} style={{ background:'#fff', color:'#ef4444', border:'1px solid #ef4444', padding:'6px 10px', borderRadius:'8px', cursor:'pointer', fontSize:'0.8rem', fontWeight:600, fontFamily:'inherit' }}>Revoke</button>
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

                    {/* ══ 6. RECORDING REQUESTS (Physical Students) ══ */}
                    {activeTab === 'recordings' && (
                        <motion.div variants={cv} initial="hidden" animate="visible">
                            <h1 style={{ fontSize:'1.8rem', fontWeight:900, color:'#0f172a', marginBottom:'0.3rem' }}>🎬 Recording Requests</h1>
                            <p style={{ color:'#64748b', marginBottom:'2rem' }}>Physical class students requesting access to specific recordings.</p>
                            <div style={{ background:'#fff', borderRadius:'24px', boxShadow:'0 4px 20px rgba(0,0,0,0.03)', overflow:'hidden', border:'1px solid #f1f5f9' }}>
                                {recRequests.length === 0
                                    ? <div style={{ padding:'3rem', textAlign:'center', color:'#64748b' }}>No recording requests yet.</div>
                                    : (
                                        <table style={{ width:'100%', borderCollapse:'collapse', textAlign:'left' }}>
                                            <thead style={{ background:'#f8fafc', color:'#64748b', fontSize:'0.8rem', textTransform:'uppercase' }}>
                                                <tr>
                                                    {['Student','Session','Requested','Status','Action'].map(h => (
                                                        <th key={h} style={{ padding:'1rem 1.2rem', borderBottom:'2px solid #f1f5f9', fontWeight:700 }}>{h}</th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {recRequests.map(req => {
                                                    const student = allProfiles.find(p => p.id === req.user_id);
                                                    const sess    = sessions.find(s => s.id === req.session_id);
                                                    return (
                                                        <tr key={req.id} style={{ borderBottom:'1px solid #f8fafc' }}>
                                                            <td style={{ padding:'1rem 1.2rem', fontWeight:700, color:'#0f172a' }}>{student?.full_name || 'Unknown'}</td>
                                                            <td style={{ padding:'1rem 1.2rem', color:'#64748b', fontSize:'0.9rem' }}>
                                                                {sess ? (
                                                                    <div>
                                                                        <div style={{ fontWeight:600, color:'#0f172a' }}>{sess.title}</div>
                                                                        <div style={{ fontSize:'0.78rem' }}>{sess.session_date}</div>
                                                                    </div>
                                                                ) : 'Deleted Session'}
                                                            </td>
                                                            <td style={{ padding:'1rem 1.2rem', color:'#64748b', fontSize:'0.8rem' }}>{new Date(req.created_at).toLocaleDateString()}</td>
                                                            <td style={{ padding:'1rem 1.2rem' }}>
                                                                {req.status === 'pending'
                                                                    ? <span style={{ background:'#fef3c7', color:'#d97706', padding:'4px 10px', borderRadius:'10px', fontSize:'0.78rem', fontWeight:800 }}>PENDING</span>
                                                                    : <span style={{ background:'#d1fae5', color:'#059669', padding:'4px 10px', borderRadius:'10px', fontSize:'0.78rem', fontWeight:800 }}>APPROVED</span>}
                                                            </td>
                                                            <td style={{ padding:'1rem 1.2rem' }}>
                                                                {req.status === 'pending' ? (
                                                                    <div style={{ display:'flex', gap:'6px' }}>
                                                                        <button onClick={() => handleApproveRecording(req.id)} style={{ ...btn('#10b981'), padding:'7px 12px', fontSize:'0.82rem' }}>Approve</button>
                                                                        <button onClick={() => handleDelete('recording_requests', req.id, 'Request')} style={{ ...btn('#ef4444'), padding:'7px 12px', fontSize:'0.82rem' }}>Reject</button>
                                                                    </div>
                                                                ) : (
                                                                    <span style={{ color:'#10b981', fontWeight:700, fontSize:'0.85rem' }}>✅ Unlocked</span>
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

                {/* ── Papers & Marks Tab ── */}
                {activeTab === 'papers' && (
                    <motion.div variants={cv} initial="hidden" animate="visible">
                        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'2rem', flexWrap:'wrap', gap:'1rem' }}>
                            <div>
                                <h1 style={{ fontSize:'1.8rem', fontWeight:900, color:'#0f172a', marginBottom:'0.3rem' }}>📝 Papers & Marks</h1>
                                <p style={{ color:'#64748b' }}>Create revision papers and record student marks.</p>
                            </div>
                            <button onClick={async () => {
                                if (!newPaperTitle.trim()) return showToast('Enter a paper title first.', 'error');
                                const { error } = await supabase.from('papers').insert([{ title: newPaperTitle.trim() }]);
                                if (error) return showAlert('Error', error.message);
                                setNewPaperTitle('');
                                showToast('Paper created! ✅', 'success');
                                fetchAll();
                            }} style={{ ...btn('linear-gradient(135deg,#a855f7,#7c3aed)'), display:'flex', alignItems:'center', gap:'8px' }}>
                                <i className="fa-solid fa-plus" /> New Paper
                            </button>
                        </div>

                        <div style={{ background:'#fff', borderRadius:'20px', padding:'1.5rem', border:'1px solid #f1f5f9', marginBottom:'2rem', display:'flex', gap:'12px' }}>
                            <input style={{ ...inp, flex:1 }} placeholder="e.g. Paper 01 - ICT Theory Revision" value={newPaperTitle} onChange={e => setNewPaperTitle(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && document.getElementById('create-paper-btn').click()} />
                            <button id="create-paper-btn" onClick={async () => {
                                if (!newPaperTitle.trim()) return showToast('Enter a paper title first.', 'error');
                                const { error } = await supabase.from('papers').insert([{ title: newPaperTitle.trim() }]);
                                if (error) return showAlert('Error', error.message);
                                setNewPaperTitle('');
                                showToast('Paper created! ✅', 'success');
                                fetchAll();
                            }} style={{ ...btn('linear-gradient(135deg,#a855f7,#7c3aed)') }}>
                                <i className="fa-solid fa-plus" />
                            </button>
                        </div>

                        {papers.length === 0 ? (
                            <div style={{ textAlign:'center', padding:'3rem', color:'#94a3b8', background:'#fff', borderRadius:'20px' }}>
                                <i className="fa-solid fa-file-pen" style={{ fontSize:'2.5rem', marginBottom:'1rem', display:'block' }} />
                                No papers yet. Create one above.
                            </div>
                        ) : activePaper ? (
                            <div>
                                <div style={{ display:'flex', alignItems:'center', gap:'12px', marginBottom:'2rem' }}>
                                    <button onClick={() => { setActivePaper(null); setMarkInputs({}); }} style={{ ...btn('#f1f5f9'), color:'#0f172a' }}>
                                        <i className="fa-solid fa-arrow-left" /> Back
                                    </button>
                                    <h2 style={{ margin:0, fontWeight:900, color:'#0f172a' }}>{activePaper.title}</h2>
                                    <button onClick={async () => {
                                        const rows = allProfiles.map(p => ({
                                            paper_id:   activePaper.id,
                                            student_id: p.id,
                                            marks:      markInputs[p.id] === 'AB' ? null : (markInputs[p.id] ? parseInt(markInputs[p.id]) : null),
                                            is_absent:  markInputs[p.id] === 'AB',
                                        })).filter(r => r.marks !== null || r.is_absent);
                                        if (rows.length === 0) return showToast('No marks entered.', 'error');
                                        const { error } = await supabase.from('paper_marks').upsert(rows, { onConflict: 'paper_id,student_id' });
                                        if (error) return showAlert('Save Failed', error.message);
                                        showToast('Marks saved! ✅', 'success');
                                        fetchAll();
                                    }} style={{ ...btn('linear-gradient(135deg,#10b981,#059669)'), marginLeft:'auto', display:'flex', alignItems:'center', gap:'8px' }}>
                                        <i className="fa-solid fa-floppy-disk" /> Save All Marks
                                    </button>
                                    <button onClick={async () => {
                                        const { jsPDF } = await import('jspdf');
                                        const doc = new jsPDF();
                                        
                                        // Calculate Stats
                                        let totalAbsent = 0;
                                        let totalMarks = 0;
                                        let countMarks = 0;

                                        allProfiles.forEach(p => {
                                            const markInput = markInputs[p.id];
                                            const existing = paperMarks.find(m => m.paper_id === activePaper.id && m.student_id === p.id);
                                            let val = markInput ?? (existing ? (existing.is_absent ? 'AB' : existing.marks) : undefined);
                                            
                                            if (val === 'AB') {
                                                totalAbsent++;
                                            } else if (val !== '' && val !== undefined && val !== null && !isNaN(val)) {
                                                totalMarks += parseInt(val);
                                                countMarks++;
                                            }
                                        });

                                        const avgScore = countMarks > 0 ? (totalMarks / countMarks).toFixed(1) : 0;
                                        const totalStudents = allProfiles.length;
                                        const totalPresent = totalStudents - totalAbsent;

                                        const brandPrimary = [168, 85, 247];  // #a855f7
                                        const brandDark = [15, 23, 42];       // #0f172a
                                        const textMuted = [100, 116, 139];    // #64748b

                                        const drawHeaderAndWatermark = (document) => {
                                            // Top Accent Line
                                            document.setFillColor(...brandPrimary);
                                            document.rect(14, 10, 182, 3, 'F');
                                            
                                            // Header Content
                                            document.setTextColor(...brandDark);
                                            document.setFontSize(22);
                                            document.setFont('helvetica', 'bold');
                                            document.text('RDICT.', 14, 23);
                                            
                                            document.setTextColor(...textMuted);
                                            document.setFontSize(9);
                                            document.setFont('helvetica', 'bold');
                                            document.text('COMPUTER SCIENCE EDUCATION', 14, 29);
                                            
                                            // Right side text
                                            document.setTextColor(...brandDark);
                                            document.setFontSize(12);
                                            document.setFont('helvetica', 'bold');
                                            document.text('PERFORMANCE REPORT', 196, 23, null, null, 'right');
                                            
                                            document.setTextColor(...textMuted);
                                            document.setFontSize(8);
                                            document.setFont('helvetica', 'normal');
                                            document.text(`Generated: ${new Date().toLocaleDateString()}`, 196, 29, null, null, 'right');

                                            // Subtle Watermark
                                            document.setTextColor(248, 250, 252); 
                                            document.setFontSize(80);
                                            document.setFont('helvetica', 'bold');
                                            document.text('RDICT', 105, 130, null, 45, 'center');
                                            document.text('RDICT', 105, 230, null, 45, 'center');
                                        };

                                        const drawTableHeader = (document, yPos) => {
                                            document.setFillColor(...brandDark);
                                            document.roundedRect(14, yPos, 182, 10, 2, 2, 'F');
                                            
                                            document.setTextColor(255, 255, 255);
                                            document.setFontSize(7);
                                            document.setFont('helvetica', 'bold');
                                            // Alignments
                                            document.text('#', 18, yPos + 6.5);
                                            document.text('STUDENT NAME', 30, yPos + 6.5);
                                            document.text('PREVIOUS', 125, yPos + 6.5, null, null, 'center');
                                            document.text('CURRENT', 150, yPos + 6.5, null, null, 'center');
                                            document.text('STATUS', 182, yPos + 6.5, null, null, 'center');
                                        };

                                        drawHeaderAndWatermark(doc);

                                        let y = 38;
                                        
                                        // Summary Banner Background
                                        doc.setFillColor(248, 250, 252);
                                        doc.roundedRect(14, y, 182, 22, 3, 3, 'F');

                                        // Box 1: Average
                                        doc.setFillColor(...brandPrimary);
                                        doc.roundedRect(18, y + 4, 35, 14, 2, 2, 'F');
                                        doc.setTextColor(255, 255, 255);
                                        doc.setFontSize(13);
                                        doc.setFont('helvetica', 'bold');
                                        doc.text(`${avgScore}%`, 35.5, y + 10, null, null, 'center');
                                        doc.setFontSize(5);
                                        doc.text('CLASS AVERAGE', 35.5, y + 14, null, null, 'center');

                                        // Other stats
                                        const drawStatBox = (x, val, label) => {
                                            doc.setDrawColor(226, 232, 240); // #e2e8f0
                                            doc.setFillColor(255, 255, 255);
                                            doc.roundedRect(x, y + 4, 26, 14, 2, 2, 'FD');
                                            
                                            doc.setTextColor(...brandDark);
                                            doc.setFontSize(11);
                                            doc.setFont('helvetica', 'bold');
                                            doc.text(String(val), x + 13, y + 10, null, null, 'center');
                                            
                                            doc.setTextColor(...textMuted);
                                            doc.setFontSize(5);
                                            doc.setFont('helvetica', 'bold');
                                            doc.text(label.toUpperCase(), x + 13, y + 14, null, null, 'center');
                                        };

                                        drawStatBox(57, totalStudents, 'Total Std.');
                                        drawStatBox(87, totalPresent, 'Present');
                                        drawStatBox(117, totalAbsent, 'Absent');

                                        // Display Paper detail
                                        doc.setTextColor(...textMuted);
                                        doc.setFontSize(6);
                                        doc.setFont('helvetica', 'normal');
                                        doc.text('PAPER TITLE', 170, y + 9, null, null, 'center');
                                        doc.setTextColor(...brandDark);
                                        doc.setFontSize(8);
                                        doc.setFont('helvetica', 'bold');
                                        const shortTitle = (activePaper.title || '').substring(0, 30);
                                        doc.text(shortTitle, 170, y + 14, null, null, 'center');

                                        y += 28;

                                        drawTableHeader(doc, y);
                                        y += 12;

                                        allProfiles.forEach((p, i) => {
                                            const prevPaper = papers.filter(pp => pp.id !== activePaper.id)
                                                .sort((a,b) => new Date(b.created_at) - new Date(a.created_at))[0];
                                            const prevMark = prevPaper ? paperMarks.find(m => m.paper_id === prevPaper.id && m.student_id === p.id) : null;
                                            const thisMark = paperMarks.find(m => m.paper_id === activePaper.id && m.student_id === p.id);
                                            
                                            if (y > 275) { 
                                                doc.addPage();
                                                drawHeaderAndWatermark(doc);
                                                y = 42;
                                                drawTableHeader(doc, y);
                                                y += 12;
                                            }
                                            
                                            if (i % 2 === 0) {
                                                doc.setFillColor(248, 250, 252);
                                                doc.roundedRect(14, y - 2, 182, 8, 2, 2, 'F');
                                            }

                                            doc.setDrawColor(241, 245, 249);
                                            doc.setLineWidth(0.2);
                                            doc.line(14, y+6, 196, y+6);

                                            doc.setTextColor(148, 163, 184); // #94a3b8
                                            doc.setFontSize(7);
                                            doc.setFont('helvetica', 'bold');
                                            doc.text(String(i+1).padStart(2, '0'), 18, y + 3.5);
                                            
                                            doc.setTextColor(...brandDark);
                                            doc.setFontSize(8);
                                            doc.setFont('helvetica', 'bold');
                                            doc.text((p.full_name || 'Unknown Student').substring(0, 45), 30, y + 3.5);

                                            const prevVal = prevMark ? (prevMark.is_absent ? 'AB' : String(prevMark.marks ?? '-')) : '-';
                                            const thisVal = thisMark ? (thisMark.is_absent ? 'AB' : String(thisMark.marks ?? '-')) : markInputs[p.id] || '-';

                                            doc.setFontSize(8);
                                            // Prev Mark
                                            if (prevVal === 'AB') {
                                                doc.setTextColor(239, 68, 68);
                                            } else {
                                                doc.setTextColor(100, 116, 139);
                                                doc.setFont('helvetica', 'normal');
                                            }
                                            doc.text(prevVal, 125, y + 3.5, null, null, 'center');

                                            // Current Mark
                                            doc.setFont('helvetica', 'bold');
                                            if (thisVal === 'AB') {
                                                doc.setTextColor(239, 68, 68);
                                            } else {
                                                doc.setTextColor(...brandPrimary);
                                            }
                                            doc.text(String(thisVal), 150, y + 3.5, null, null, 'center');

                                            // Status Badge
                                            if (thisVal === 'AB') {
                                                doc.setFillColor(254, 226, 226); // #fee2e2
                                                doc.roundedRect(172, y - 0.5, 20, 5, 2, 2, 'F');
                                                doc.setTextColor(239, 68, 68);
                                                doc.setFontSize(5);
                                                doc.text('ABSENT', 182, y + 2.8, null, null, 'center');
                                            } else {
                                                doc.setFillColor(209, 250, 229); // #d1fae5
                                                doc.roundedRect(172, y - 0.5, 20, 5, 2, 2, 'F');
                                                doc.setTextColor(5, 150, 105); // #059669
                                                doc.setFontSize(5);
                                                doc.text('PRESENT', 182, y + 2.8, null, null, 'center');
                                            }

                                            y += 8;
                                        });
                                        
                                        // Final small footer pagination
                                        const pageCount = doc.internal.getNumberOfPages();
                                        for(let i = 1; i <= pageCount; i++) {
                                            doc.setPage(i);
                                            doc.setTextColor(150, 150, 150);
                                            doc.setFontSize(7);
                                            doc.setFont('helvetica', 'normal');
                                            doc.text(`RDICT Performance Report • Page ${i} of ${pageCount}`, 105, 292, null, null, 'center');
                                        }

                                        doc.save(`RDICT_${activePaper.title}_Report.pdf`);
                                    }} style={{ ...btn('linear-gradient(135deg,#3b82f6,#1d4ed8)'), display:'flex', alignItems:'center', gap:'8px' }}>
                                        <i className="fa-solid fa-file-pdf" /> Download PDF
                                    </button>
                                </div>

                                <div style={{ background:'#fff', borderRadius:'20px', overflow:'hidden', border:'1px solid #f1f5f9' }}>
                                    <table style={{ width:'100%', borderCollapse:'collapse' }}>
                                        <thead style={{ background:'#f8fafc' }}>
                                            <tr>
                                                {['#','Student Name','Previous Paper','Marks (or type AB)'].map(h => (
                                                    <th key={h} style={{ padding:'1rem 1.2rem', textAlign:'left', fontSize:'0.8rem', fontWeight:800, color:'#64748b', textTransform:'uppercase', borderBottom:'2px solid #f1f5f9' }}>{h}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {allProfiles.map((p, i) => {
                                                const prevPaper = papers.filter(pp => pp.id !== activePaper.id)
                                                    .sort((a,b) => new Date(b.created_at) - new Date(a.created_at))[0];
                                                const prevMark = prevPaper ? paperMarks.find(m => m.paper_id === prevPaper.id && m.student_id === p.id) : null;
                                                const existing = paperMarks.find(m => m.paper_id === activePaper.id && m.student_id === p.id);
                                                const currentVal = markInputs[p.id] ?? (existing ? (existing.is_absent ? 'AB' : String(existing.marks ?? '')) : '');
                                                return (
                                                    <tr key={p.id} style={{ borderBottom:'1px solid #f8fafc' }}>
                                                        <td style={{ padding:'0.9rem 1.2rem', color:'#94a3b8', fontWeight:600 }}>{i+1}</td>
                                                        <td style={{ padding:'0.9rem 1.2rem', fontWeight:700, color:'#0f172a' }}>
                                                            <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                                                                <div style={{ width:'28px', height:'28px', borderRadius:'8px', background:'linear-gradient(135deg,#a855f7,#7c3aed)', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.75rem', fontWeight:800, flexShrink:0 }}>
                                                                    {p.full_name?.charAt(0) || 'S'}
                                                                </div>
                                                                <div>
                                                                    <div style={{ fontSize:'0.9rem' }}>{p.full_name || '—'}</div>
                                                                    <div style={{ fontSize:'0.75rem', color:'#94a3b8' }}>{p.school_name || ''}</div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td style={{ padding:'0.9rem 1.2rem' }}>
                                                            {prevMark ? (
                                                                <span style={{ background: prevMark.is_absent ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)', color: prevMark.is_absent ? '#ef4444' : '#10b981', padding:'4px 12px', borderRadius:'8px', fontWeight:800, fontSize:'0.85rem' }}>
                                                                    {prevMark.is_absent ? 'AB' : prevMark.marks}
                                                                </span>
                                                            ) : <span style={{ color:'#cbd5e1' }}>—</span>}
                                                        </td>
                                                        <td style={{ padding:'0.9rem 1.2rem' }}>
                                                            <input
                                                                style={{ padding:'8px 12px', borderRadius:'10px', border:`1.5px solid ${currentVal === 'AB' ? '#ef4444' : currentVal ? '#10b981' : '#e2e8f0'}`, fontFamily:'inherit', fontSize:'0.9rem', fontWeight:700, width:'100px', textAlign:'center', background:'#f8fafc', color: currentVal === 'AB' ? '#ef4444' : '#0f172a' }}
                                                                placeholder="e.g. 85"
                                                                value={currentVal}
                                                                onChange={e => setMarkInputs(prev => ({ ...prev, [p.id]: e.target.value.toUpperCase() }))}
                                                            />
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        ) : (
                            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(280px,1fr))', gap:'1.5rem' }}>
                                {papers.map(paper => {
                                    const marked = paperMarks.filter(m => m.paper_id === paper.id).length;
                                    return (
                                        <motion.div key={paper.id} variants={iv}
                                            style={{ background:'#fff', borderRadius:'20px', padding:'1.5rem', border:'1px solid #f1f5f9', cursor:'pointer', transition:'all 0.2s' }}
                                            whileHover={{ y:-4, boxShadow:'0 12px 25px rgba(168,85,247,0.1)' }}
                                            onClick={() => { setActivePaper(paper); setMarkInputs({}); }}>
                                            <div style={{ display:'flex', alignItems:'center', gap:'12px', marginBottom:'1rem' }}>
                                                <div style={{ background:'linear-gradient(135deg,#a855f7,#7c3aed)', padding:'10px', borderRadius:'12px', color:'#fff', fontSize:'1.2rem' }}>
                                                    <i className="fa-solid fa-file-pen" />
                                                </div>
                                                <div style={{ flex:1 }}>
                                                    <div style={{ fontWeight:800, color:'#0f172a', fontSize:'1rem' }}>{paper.title}</div>
                                                    <div style={{ color:'#94a3b8', fontSize:'0.78rem' }}>{new Date(paper.created_at).toLocaleDateString()}</div>
                                                </div>
                                            </div>
                                            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                                                <span style={{ background:'rgba(168,85,247,0.1)', color:'#a855f7', padding:'4px 12px', borderRadius:'8px', fontSize:'0.8rem', fontWeight:800 }}>
                                                    {marked} / {allProfiles.length} marked
                                                </span>
                                                <div style={{ display:'flex', gap:'8px' }}>
                                                    <button onClick={e => { e.stopPropagation(); confirmAction('Delete Paper?', `This will also delete all marks for "${paper.title}".`, async () => { await supabase.from('papers').delete().eq('id', paper.id); fetchAll(); }); }} style={{ background:'#fee2e2', color:'#ef4444', border:'none', padding:'6px 12px', borderRadius:'8px', cursor:'pointer', fontWeight:700, fontSize:'0.8rem' }}>
                                                        <i className="fa-solid fa-trash" />
                                                    </button>
                                                </div>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        )}
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
            {/* ── Premium Modal ── */}
            <AnimatePresence>
                {modal.show && (
                    <div style={{ position:'fixed', inset:0, zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem' }}>
                        <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
                            onClick={() => setModal({ ...modal, show:false })}
                            style={{ position:'absolute', inset:0, background:'rgba(15,23,42,0.4)', backdropFilter:'blur(8px)' }} />
                        <motion.div initial={{ opacity:0, scale:0.9, y:20 }} animate={{ opacity:1, scale:1, y:0 }} exit={{ opacity:0, scale:0.9, y:20 }}
                            style={{ position:'relative', width:'100%', maxWidth:'420px', background:'#fff', borderRadius:'24px', padding:'2rem', boxShadow:'0 25px 50px -12px rgba(0,0,0,0.25)', overflow:'hidden' }}>
                            <div style={{ position:'absolute', top:0, left:0, width:'100%', height:'4px', background: modal.type === 'confirm' ? '#a855f7' : '#ef4444' }} />
                            <h2 style={{ fontSize:'1.4rem', fontWeight:800, color:'#0f172a', marginBottom:'0.5rem' }}>{modal.title}</h2>
                            <p style={{ color:'#64748b', lineHeight:1.6, marginBottom:'2rem' }}>{modal.message}</p>
                            <div style={{ display:'flex', gap:'12px', justifyContent:'flex-end' }}>
                                <button onClick={() => setModal({ ...modal, show:false })} style={{ padding:'10px 20px', borderRadius:'12px', border:'1px solid #e2e8f0', background:'none', color:'#64748b', fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
                                    {modal.type === 'confirm' ? 'Cancel' : 'Close'}
                                </button>
                                {modal.type === 'confirm' && (
                                    <button onClick={() => { modal.onConfirm(); setModal({ ...modal, show:false }); }} style={{ padding:'10px 24px', borderRadius:'12px', border:'none', background:'#a855f7', color:'#fff', fontWeight:700, cursor:'pointer', fontFamily:'inherit', boxShadow:'0 10px 15px -3px rgba(168,85,247,0.3)' }}>
                                        Proceed
                                    </button>
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* ── Edit Session Modal ── */}
            <AnimatePresence>
                {editingSession && (
                    <div style={{ position:'fixed', inset:0, zIndex:1100, display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem' }}>
                        <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
                            onClick={() => setEditingSession(null)}
                            style={{ position:'absolute', inset:0, background:'rgba(15,23,42,0.5)', backdropFilter:'blur(10px)' }} />
                        <motion.div initial={{ opacity:0, scale:0.9, y:20 }} animate={{ opacity:1, scale:1, y:0 }} exit={{ opacity:0, scale:0.9, y:20 }}
                            style={{ position:'relative', width:'100%', maxWidth:'520px', background:'#fff', borderRadius:'24px', padding:'2rem', boxShadow:'0 25px 50px rgba(0,0,0,0.2)', overflow:'hidden', maxHeight:'90vh', overflowY:'auto' }}>
                            <div style={{ position:'absolute', top:0, left:0, width:'100%', height:'4px', background:'linear-gradient(90deg,#3b82f6,#a855f7)' }} />
                            <h2 style={{ fontWeight:800, color:'#0f172a', marginBottom:'0.3rem', fontSize:'1.3rem' }}>
                                <i className="fa-solid fa-pen" style={{ color:'#3b82f6', marginRight:'8px' }} />
                                Edit Session
                            </h2>
                            <p style={{ color:'#64748b', fontSize:'0.85rem', marginBottom:'1.5rem' }}>Update recording ID, Zoom link, or any session details.</p>

                            <div style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
                                <div style={{ display:'flex', flexDirection:'column', gap:'6px' }}>
                                    <label style={{ fontSize:'0.78rem', fontWeight:700, color:'#64748b' }}>Session Title</label>
                                    <input style={inp} value={editingSession.title} onChange={e => setEditingSession({ ...editingSession, title: e.target.value })} />
                                </div>
                                <div style={{ display:'flex', flexDirection:'column', gap:'6px' }}>
                                    <label style={{ fontSize:'0.78rem', fontWeight:700, color:'#64748b' }}>Description</label>
                                    <textarea rows="2" style={{ ...inp, resize:'vertical' }} value={editingSession.description || ''} onChange={e => setEditingSession({ ...editingSession, description: e.target.value })} />
                                </div>
                                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem' }}>
                                    <div style={{ display:'flex', flexDirection:'column', gap:'6px' }}>
                                        <label style={{ fontSize:'0.78rem', fontWeight:700, color:'#64748b' }}>ICT Unit</label>
                                        <select style={inp} value={editingSession.unit_no || ''} onChange={e => setEditingSession({ ...editingSession, unit_no: e.target.value })}>
                                            <option value="">-- No Unit --</option>
                                            {ICT_UNITS.map(u => <option key={u.no} value={u.no}>{u.name}</option>)}
                                        </select>
                                    </div>
                                    <div style={{ display:'flex', flexDirection:'column', gap:'6px' }}>
                                        <label style={{ fontSize:'0.78rem', fontWeight:700, color:'#64748b' }}>Session Date</label>
                                        <input type="date" style={inp} value={editingSession.session_date || ''} onChange={e => setEditingSession({ ...editingSession, session_date: e.target.value })} />
                                    </div>
                                </div>

                                {/* Recording ID — most important for post-live update */}
                                <div style={{ background:'rgba(16,185,129,0.05)', border:'1.5px solid rgba(16,185,129,0.2)', borderRadius:'14px', padding:'1rem' }}>
                                    <label style={{ fontSize:'0.78rem', fontWeight:800, color:'#10b981', display:'block', marginBottom:'6px' }}>
                                        🎬 YouTube Recording ID {!editingSession.video_id && <span style={{ background:'#fef3c7', color:'#d97706', padding:'2px 8px', borderRadius:'6px', marginLeft:'6px' }}>Not Added Yet</span>}
                                    </label>
                                    <input style={inp} placeholder="e.g. dQw4w9WgXcQ (paste after live class ends)" value={editingSession.video_id || ''} onChange={e => setEditingSession({ ...editingSession, video_id: e.target.value })} />
                                </div>

                                <div style={{ display:'flex', flexDirection:'column', gap:'6px' }}>
                                    <label style={{ fontSize:'0.78rem', fontWeight:700, color:'#64748b' }}>🎥 Zoom Live Link</label>
                                    <input type="url" style={inp} placeholder="https://zoom.us/j/..." value={editingSession.zoom_link || ''} onChange={e => setEditingSession({ ...editingSession, zoom_link: e.target.value })} />
                                </div>

                                <div style={{ display:'flex', gap:'10px', marginTop:'0.5rem' }}>
                                    <button onClick={() => setEditingSession(null)} style={{ flex:1, padding:'12px', borderRadius:'12px', border:'1.5px solid #e2e8f0', background:'none', color:'#64748b', fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
                                        Cancel
                                    </button>
                                    <button disabled={isEditing} onClick={async () => {
                                        setIsEditing(true);
                                        try {
                                            const { error } = await supabase.from('class_sessions').update({
                                                title:        editingSession.title,
                                                description:  editingSession.description,
                                                unit_no:      editingSession.unit_no ? parseInt(editingSession.unit_no) : null,
                                                session_date: editingSession.session_date || null,
                                                video_id:     editingSession.video_id  || null,
                                                zoom_link:    editingSession.zoom_link  || null,
                                            }).eq('id', editingSession.id);
                                            if (error) throw error;
                                            showToast('Session updated! ✅', 'success');
                                            setEditingSession(null);
                                            fetchAll();
                                        } catch (err) {
                                            showAlert('Update Failed', err.message);
                                        } finally {
                                            setIsEditing(false);
                                        }
                                    }} style={{ flex:1, padding:'12px', borderRadius:'12px', border:'none', background: isEditing ? '#94a3b8' : 'linear-gradient(135deg,#3b82f6,#a855f7)', color:'#fff', fontWeight:800, cursor: isEditing ? 'default' : 'pointer', fontFamily:'inherit' }}>
                                        {isEditing ? '⏳ Saving...' : '💾 Save Changes'}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* ── Student Profile Modal ── */}
            <AnimatePresence>
                {viewingStudent && (
                    <div style={{ position:'fixed', inset:0, zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:'20px' }}>
                        <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
                            onClick={() => setViewingStudent(null)}
                            style={{ position:'absolute', inset:0, background:'rgba(15,23,42,0.4)', backdropFilter:'blur(8px)' }} />
                        
                        <motion.div initial={{ opacity:0, scale:0.9, y:20 }} animate={{ opacity:1, scale:1, y:0 }} exit={{ opacity:0, scale:0.9, y:20 }}
                            style={{ position:'relative', width:'100%', maxWidth:'650px', background:'#fff', borderRadius:'24px', padding:'2.5rem', boxShadow:'0 25px 50px rgba(0,0,0,0.2)', overflow:'hidden', maxHeight:'90vh', overflowY:'auto' }}>
                            <div style={{ position:'absolute', top:0, left:0, width:'100%', height:'5px', background:'linear-gradient(135deg,#a855f7,#7c3aed)' }} />
                            
                            <button onClick={() => setViewingStudent(null)} style={{ position:'absolute', top:'20px', right:'20px', background:'none', border:'none', fontSize:'1.2rem', color:'#94a3b8', cursor:'pointer', transition: 'color 0.2s' }} onMouseOver={e=>e.currentTarget.style.color='#ef4444'} onMouseOut={e=>e.currentTarget.style.color='#94a3b8'}>
                                <i className="fa-solid fa-xmark" />
                            </button>

                            <div style={{ display:'flex', alignItems:'center', gap:'1.5rem', marginBottom:'2rem', borderBottom:'1px solid #f1f5f9', paddingBottom:'2rem' }}>
                                {viewingStudent.avatar_url ? (
                                    <img src={viewingStudent.avatar_url} alt="avatar" style={{ width:'80px', height:'80px', borderRadius:'20px', objectFit:'cover', border:'3px solid rgba(168,85,247,0.2)' }} />
                                ) : (
                                    <div style={{ width:'80px', height:'80px', borderRadius:'20px', background:'linear-gradient(135deg,#a855f7,#7c3aed)', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontSize:'2rem', fontWeight:900 }}>
                                        {viewingStudent.full_name ? viewingStudent.full_name.charAt(0).toUpperCase() : 'S'}
                                    </div>
                                )}
                                <div>
                                    <h2 style={{ margin:0, fontWeight:900, color:'#0f172a', fontSize:'1.5rem' }}>{viewingStudent.full_name}</h2>
                                    <p style={{ margin:'4px 0 8px 0', color:'#64748b', fontSize:'0.9rem' }}>{viewingStudent.school_name || 'No school provided'}</p>
                                    <div style={{ display:'flex', gap:'8px' }}>
                                        <span style={{ background:'rgba(168,85,247,0.1)', color:'#a855f7', padding:'4px 12px', borderRadius:'8px', fontSize:'0.75rem', fontWeight:800 }}>Batch {viewingStudent.batch || '—'}</span>
                                        <span style={{ background: viewingStudent.student_type === 'physical' ? 'rgba(16,185,129,0.1)' : 'rgba(59,130,246,0.1)', color: viewingStudent.student_type === 'physical' ? '#10b981' : '#3b82f6', padding:'4px 12px', borderRadius:'8px', fontSize:'0.75rem', fontWeight:800 }}>{viewingStudent.student_type || 'Online'} Student</span>
                                    </div>
                                </div>
                            </div>

                            <div style={{ display:'grid', gridTemplateColumns:'repeat(2, 1fr)', gap:'1.5rem', marginBottom:'2.5rem' }}>
                                {[
                                    { label:'NIC Number', value: viewingStudent.nic, icon:'fa-id-card' },
                                    { label:'Gender', value: viewingStudent.gender, icon:'fa-venus-mars' },
                                    { label:'Guardian Phone', value: viewingStudent.guardian_phone, icon:'fa-phone' },
                                    { label:'School Name', value: viewingStudent.school_name, icon:'fa-school' },
                                    { label:'District', value: viewingStudent.district, icon:'fa-map-location-dot' },
                                    { label:'Province', value: viewingStudent.province, icon:'fa-map' },
                                    { label:'Class Type', value: viewingStudent.class_type, icon:'fa-chalkboard' },
                                    { label:'Total XP Points', value: viewingStudent.xp_points ?? 0, icon:'fa-star', highlight:true },
                                ].map((item, i) => (
                                    <div key={i} style={{ background:'rgba(241,245,249,0.5)', padding:'12px 16px', borderRadius:'12px', border: item.highlight ? '1px solid rgba(168,85,247,0.3)' : '1px solid #e2e8f0' }}>
                                        <span style={{ display:'block', fontSize:'0.75rem', fontWeight:700, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:'4px' }}>
                                            <i className={`${item.brand ? 'fa-brands' : 'fa-solid'} ${item.icon}`} style={{ marginRight:'6px', color: item.highlight ? '#a855f7' : 'inherit' }} /> {item.label}
                                        </span>
                                        <span style={{ display:'block', fontSize:'0.95rem', fontWeight:item.highlight ? 800 : 600, color: item.highlight ? '#a855f7' : '#0f172a' }}>
                                            {item.value || 'N/A'}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            <div style={{ borderTop:'1px solid #f1f5f9', paddingTop:'2rem' }}>
                                <h3 style={{ fontSize:'1.05rem', fontWeight:800, color:'#0f172a', marginBottom:'1.2rem', display:'flex', alignItems:'center', gap:'8px' }}><i className="fa-solid fa-bolt" style={{ color:'#f59e0b' }} /> Admin Actions</h3>
                                <div style={{ display:'flex', gap:'12px' }}>
                                    <button onClick={() => { setViewingStudent(null); handleDelete('profiles', viewingStudent.id, 'User Profile'); }} style={{ padding:'12px 20px', borderRadius:'12px', border:'none', background:'#fee2e2', color:'#ef4444', fontWeight:800, cursor:'pointer', display:'flex', alignItems:'center', gap:'8px', flex:1, justifyContent:'center', transition:'all 0.2s', boxShadow:'0 4px 10px rgba(239,68,68,0.15)' }}>
                                        <i className="fa-solid fa-user-xmark" /> Delete Student
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* ── Global Confirm Modal ── */}
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
                        style={{ position:'fixed', bottom:'40px', left:'50%', zIndex:2000, background:'#0f172a', color:'#fff', padding:'12px 24px', borderRadius:'100px', display:'flex', alignItems:'center', gap:'10px', boxShadow:'0 20px 25px -5px rgba(0,0,0,0.2)', border:'1px solid rgba(168,85,247,0.2)', whiteSpace:'nowrap', fontFamily:'inherit' }}>
                        <i className={`fa-solid ${toast.type === 'success' ? 'fa-circle-check' : 'fa-circle-exclamation'}`} style={{ color: toast.type === 'success' ? '#10b981' : '#ef4444' }} />
                        <span style={{ fontWeight:600, fontSize:'0.9rem' }}>{toast.message}</span>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AdminDashboard;
