import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { siteStats as defaultStats, contactConfig as defaultContact, socialConfig as defaultSocial, globalToggles as defaultToggles, timetableConfig as defaultTimetable } from '../config';

const AdminPanel = () => {
    const [password, setPassword] = useState('');
    const [auth, setAuth] = useState(false);
    const navigate = useNavigate();

    const localOverrides = JSON.parse(localStorage.getItem('rdict-admin-config')) || {};
    
    // Stats
    const initialStats = localOverrides.siteStats || defaultStats;
    const [students, setStudents] = useState(initialStats.hero.students.target);
    const [passRate, setPassRate] = useState(initialStats.hero.passRate.target);
    const [experience, setExperience] = useState(initialStats.hero.experience.target);

    // Contact
    const initialContact = localOverrides.contactConfig || defaultContact;
    const [hotline, setHotline] = useState(initialContact.hotline);
    const [email, setEmail] = useState(initialContact.email);

    // Socials
    const initialSocial = localOverrides.socialConfig || defaultSocial;
    const [socials, setSocials] = useState(initialSocial);

    // Toggles
    const initialToggles = localOverrides.globalToggles || defaultToggles;
    const [toggles, setToggles] = useState(initialToggles);

    // Timetable
    const initialTimetable = localOverrides.timetableConfig || defaultTimetable;
    const [batches, setBatches] = useState(initialTimetable.batches);

    const handleLogin = (e) => {
        e.preventDefault();
        if (password === '2589') setAuth(true); else alert('Incorrect PIN');
    };

    const handleToggle = (key) => setToggles(prev => ({ ...prev, [key]: !prev[key] }));
    const handleSocialChange = (e, platform) => setSocials(prev => ({ ...prev, [platform]: e.target.value }));

    // Timetable Handlers
    const updateBatchField = (batchIndex, field, value) => {
        const newBatches = [...batches];
        newBatches[batchIndex][field] = value;
        setBatches(newBatches);
    };

    const updateScheduleField = (batchIndex, scheduleIndex, field, value) => {
        const newBatches = [...batches];
        newBatches[batchIndex].schedules[scheduleIndex][field] = value;
        setBatches(newBatches);
    };

    const addSchedule = (batchIndex) => {
        const newBatches = [...batches];
        newBatches[batchIndex].schedules.push({ institute: 'online', day: 'Monday', time: '08:00 AM - 10:00 AM', type: 'Theory' });
        setBatches(newBatches);
    };

    const removeSchedule = (batchIndex, scheduleIndex) => {
        const newBatches = [...batches];
        newBatches[batchIndex].schedules.splice(scheduleIndex, 1);
        setBatches(newBatches);
    };

    const saveSettings = () => {
        const newConfig = {
            ...localOverrides,
            siteStats: { hero: { students: { target: parseInt(students), suffix: "+" }, passRate: { target: parseInt(passRate), suffix: "%" }, experience: { target: parseInt(experience), suffix: "+" } } },
            contactConfig: { hotline, email },
            socialConfig: socials,
            globalToggles: toggles,
            timetableConfig: { ...initialTimetable, batches }
        };
        localStorage.setItem('rdict-admin-config', JSON.stringify(newConfig));
        alert('All settings successfully mapped locally! Timetable updated.');
        window.location.replace('/');
    };

    const clearSettings = () => {
        if(window.confirm('Are you sure you want to revert to hardcoded config.js?')) {
            localStorage.removeItem('rdict-admin-config');
            window.location.reload();
        }
    };

    const InputDesign = { width: '100%', padding: '10px 15px', borderRadius: '8px', background: '#0a0610', border: '1px solid rgba(168,85,247,0.3)', color: '#fff', fontSize: '0.9rem', outline: 'none' };
    const SectionDesign = { background: 'rgba(255, 255, 255, 0.05)', padding: '2rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' };

    if (!auth) {
        return (
            <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0610' }}>
                <form onSubmit={handleLogin} style={{ background: 'rgba(255,255,255,0.05)', padding: '3rem', borderRadius: '24px', border: '1px solid rgba(168,85,247,0.3)', textAlign: 'center', backdropFilter: 'blur(10px)' }}>
                    <div style={{ width: '60px', height: '60px', background: 'var(--primary)', borderRadius: '50%', margin: '0 auto 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>
                        <i className="fa-solid fa-lock" style={{color:'#fff'}}></i>
                    </div>
                    <h2 style={{ color: '#fff', marginBottom: '1.5rem', fontFamily: 'Outfit' }}>Control Center</h2>
                    <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="PIN" style={{ ...InputDesign, textAlign: 'center', letterSpacing: '4px', fontSize: '1.2rem', marginBottom: '20px' }} />
                    <button type="submit" className="btn-primary" style={{ width: '100%' }}>Authenticate</button>
                </form>
            </div>
        );
    }

    return (
        <div style={{ minHeight: '100vh', background: '#0a0610', color: '#fff', padding: '4rem 2rem' }}>
            <div className="container" style={{ maxWidth: '1000px', margin: '0 auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem', paddingBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                    <h1 style={{fontFamily: 'Outfit', fontSize: '2rem'}}>RDICT <span style={{color:'var(--primary)'}}>Dashboard</span></h1>
                    <div>
                        <button onClick={saveSettings} className="btn-primary" style={{ padding: '8px 24px', marginRight: '10px' }}><i className="fa-solid fa-check"></i> Save Details</button>
                        <button onClick={() => navigate('/')} style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '20px', cursor: 'pointer' }}>Exit</button>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', marginBottom: '2rem' }}>
                    
                    {/* STATS */}
                    <div style={SectionDesign}>
                        <h3 style={{ marginBottom: '1.5rem', color: '#d8b4fe' }}><i className="fa-solid fa-chart-line"></i> Homepage Stats</h3>
                        <div style={{marginBottom: '1rem'}}><label style={{display:'block', marginBottom:'5px', fontSize:'0.8rem', color:'#94a3b8'}}>Students</label><input type="number" value={students} onChange={e => setStudents(e.target.value)} style={InputDesign} /></div>
                        <div style={{marginBottom: '1rem'}}><label style={{display:'block', marginBottom:'5px', fontSize:'0.8rem', color:'#94a3b8'}}>Pass Rate (%)</label><input type="number" value={passRate} onChange={e => setPassRate(e.target.value)} style={InputDesign} /></div>
                        <div><label style={{display:'block', marginBottom:'5px', fontSize:'0.8rem', color:'#94a3b8'}}>Years Experience</label><input type="number" value={experience} onChange={e => setExperience(e.target.value)} style={InputDesign} /></div>
                    </div>

                    {/* CONTACTS & SOCIALS */}
                    <div style={SectionDesign}>
                        <h3 style={{ marginBottom: '1.5rem', color: '#d8b4fe' }}><i className="fa-solid fa-address-book"></i> Contacts & Links</h3>
                        <div style={{marginBottom: '1rem'}}><label style={{display:'block', marginBottom:'5px', fontSize:'0.8rem', color:'#94a3b8'}}>Hotline Number</label><input type="text" value={hotline} onChange={e => setHotline(e.target.value)} style={InputDesign} /></div>
                        <div style={{marginBottom: '1.5rem'}}><label style={{display:'block', marginBottom:'5px', fontSize:'0.8rem', color:'#94a3b8'}}>Email Address</label><input type="text" value={email} onChange={e => setEmail(e.target.value)} style={InputDesign} /></div>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                            <div><label style={{display:'block', marginBottom:'5px', fontSize:'0.8rem', color:'#94a3b8'}}><i className="fa-brands fa-whatsapp"></i> WhatsApp</label><input type="text" value={socials.whatsapp} onChange={e => handleSocialChange(e, 'whatsapp')} style={InputDesign} /></div>
                            <div><label style={{display:'block', marginBottom:'5px', fontSize:'0.8rem', color:'#94a3b8'}}><i className="fa-brands fa-youtube"></i> YouTube</label><input type="text" value={socials.youtube} onChange={e => handleSocialChange(e, 'youtube')} style={InputDesign} /></div>
                            <div><label style={{display:'block', marginBottom:'5px', fontSize:'0.8rem', color:'#94a3b8'}}><i className="fa-brands fa-facebook"></i> Facebook</label><input type="text" value={socials.facebook} onChange={e => handleSocialChange(e, 'facebook')} style={InputDesign} /></div>
                            <div><label style={{display:'block', marginBottom:'5px', fontSize:'0.8rem', color:'#94a3b8'}}><i className="fa-brands fa-tiktok"></i> TikTok</label><input type="text" value={socials.tiktok} onChange={e => handleSocialChange(e, 'tiktok')} style={InputDesign} /></div>
                        </div>
                    </div>

                    {/* GLOBAL FEATURES */}
                    <div style={SectionDesign}>
                        <h3 style={{ marginBottom: '1.5rem', color: '#d8b4fe' }}><i className="fa-solid fa-toggle-on"></i> Extravaganza Modules</h3>
                        {Object.keys(toggles).map((key) => (
                            <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', padding: '10px 15px', background: 'rgba(0,0,0,0.4)', borderRadius: '8px' }}>
                                <span style={{ textTransform: 'capitalize', color: '#e2e8f0', fontSize: '0.9rem' }}>{key} Module</span>
                                <div onClick={() => handleToggle(key)} style={{ width: '44px', height: '24px', background: toggles[key] ? 'var(--primary)' : '#475569', borderRadius: '15px', position: 'relative', cursor: 'pointer', transition: 'background 0.3s' }}>
                                    <div style={{ width: '20px', height: '20px', background: '#fff', borderRadius: '50%', position: 'absolute', top: '2px', left: toggles[key] ? '22px' : '2px', transition: 'left 0.3s' }}></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* TIMETABLE EDITOR */}
                <div style={{ ...SectionDesign, background: 'rgba(168, 85, 247, 0.05)', borderColor: 'rgba(168, 85, 247, 0.2)' }}>
                    <h3 style={{ marginBottom: '1.5rem', color: '#d8b4fe', display: 'flex', justifyContent: 'space-between' }}>
                        <span><i className="fa-solid fa-calendar-alt"></i> Timetable Editor (Live JSON Map)</span>
                    </h3>
                    
                    {batches.map((batch, bIndex) => (
                        <div key={bIndex} style={{ marginBottom: '2rem', padding: '1.5rem', background: 'rgba(0,0,0,0.5)', borderRadius: '12px' }}>
                            <div style={{ display: 'flex', gap: '10px', marginBottom: '1.5rem' }}>
                                <input type="text" value={batch.title} onChange={e => updateBatchField(bIndex, 'title', e.target.value)} style={{ ...InputDesign, flex: 2, fontSize: '1.1rem', fontWeight: 'bold' }} placeholder="Batch Title (e.g. 2026 Paper Class)" />
                                <input type="text" value={batch.emoji} onChange={e => updateBatchField(bIndex, 'emoji', e.target.value)} style={{ ...InputDesign, flex: 0.5, textAlign: 'center' }} placeholder="Emoji" />
                            </div>
                            <input type="text" value={batch.description} onChange={e => updateBatchField(bIndex, 'description', e.target.value)} style={{ ...InputDesign, marginBottom: '1.5rem' }} placeholder="Batch Tagline" />

                            <h4 style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '1px' }}>Schedules</h4>
                            {batch.schedules.map((sched, sIndex) => (
                                <div key={sIndex} style={{ display: 'grid', gridTemplateColumns: 'minmax(100px, 1fr) 1fr 2fr 1fr auto', gap: '10px', marginBottom: '10px', alignItems: 'center' }}>
                                    <select value={sched.institute} onChange={e => updateScheduleField(bIndex, sIndex, 'institute', e.target.value)} style={InputDesign}>
                                        <option value="online">Online</option>
                                        <option value="kegalle">Kegalle</option>
                                        <option value="ratnapura">Ratnapura</option>
                                        <option value="gampaha">Gampaha</option>
                                    </select>
                                    <select value={sched.day} onChange={e => updateScheduleField(bIndex, sIndex, 'day', e.target.value)} style={InputDesign}>
                                        <option value="Monday">Monday</option><option value="Tuesday">Tuesday</option><option value="Wednesday">Wednesday</option>
                                        <option value="Thursday">Thursday</option><option value="Friday">Friday</option><option value="Saturday">Saturday</option><option value="Sunday">Sunday</option>
                                    </select>
                                    <input type="text" value={sched.time} onChange={e => updateScheduleField(bIndex, sIndex, 'time', e.target.value)} style={InputDesign} placeholder="Time (e.g. 08:30 AM - 12:00 PM)" />
                                    <input type="text" value={sched.type || ''} onChange={e => updateScheduleField(bIndex, sIndex, 'type', e.target.value)} style={InputDesign} placeholder="Type (Paper/Theory)" />
                                    <button onClick={() => removeSchedule(bIndex, sIndex)} style={{ background: '#ff5f56', color: '#fff', border: 'none', borderRadius: '8px', padding: '10px', cursor: 'pointer' }}><i className="fa-solid fa-trash"></i></button>
                                </div>
                            ))}
                            <button onClick={() => addSchedule(bIndex)} style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px dashed rgba(255,255,255,0.3)', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', marginTop: '10px', width: '100%' }}>+ Add Schedule Class</button>
                        </div>
                    ))}
                </div>

                <div style={{ textAlign: 'center', marginTop: '2rem' }}>
                    <button onClick={clearSettings} className="btn-secondary" style={{ borderColor: '#ff5f56', color: '#ff5f56' }}><i className="fa-solid fa-triangle-exclamation"></i> Hard Reset Entire Database</button>
                </div>
            </div>
        </div>
    );
};

export default AdminPanel;
