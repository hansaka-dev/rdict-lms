import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { globalToggles } from '../config';

const PremiumFeatures = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const isHome = location.pathname === '/';
    const isComments = location.pathname === '/comments';

    // Chatbot state
    const [chatOpen, setChatOpen] = useState(false);
    const [messages, setMessages] = useState([
        { from: 'bot', text: 'හෙලෝ! 👋 RDICT A/L ICT ගැන ඕනෑම ප්‍රශ්නයක් අහන්න!' }
    ]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);

    const mockReplies = [
        'RDICT හිදී A/L ICT subject ගැන expert guidance ලබාගත හැක.',
        'Online class සහ physical class දෙකම available. Timetable checkout කරන්න!',
        'Sir Ranishan Dissanayake ගේ teaching método unique — ගොඩක් students success ගිහිල්ලා.',
        'Batch registration සඳහා WhatsApp group join කරන්න.',
        'Python, Database normalization, past papers — ඔක්කෝටම cover කරනවා!',
        'Free YouTube masterclasses checkout කරන්න. ⬆️ Free Courses section.',
    ];

    const sendMessage = () => {
        if (!input.trim()) return;
        const userMsg = input.trim();
        setMessages(prev => [...prev, { from: 'user', text: userMsg }]);
        setInput('');
        setIsTyping(true);
        setTimeout(() => {
            const reply = mockReplies[Math.floor(Math.random() * mockReplies.length)];
            setMessages(prev => [...prev, { from: 'bot', text: reply }]);
            setIsTyping(false);
        }, 1200);
    };

    useEffect(() => {
        if (!globalToggles.particles) return;

        const canvas = document.getElementById('cursor-canvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        let particlesArray = [];
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        const mouse = { x: null, y: null };

        class Particle {
            constructor() {
                this.x = mouse.x;
                this.y = mouse.y;
                this.size = Math.random() * 5 + 1;
                this.speedX = Math.random() * 3 - 1.5;
                this.speedY = Math.random() * 3 - 1.5;
                this.color = `hsla(${Math.random() * 60 + 260}, 100%, 70%, 0.8)`;
            }
            update() {
                this.x += this.speedX;
                this.y += this.speedY;
                if (this.size > 0.2) this.size -= 0.1;
            }
            draw() {
                ctx.fillStyle = this.color;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        const handleMouseMove = (e) => {
            mouse.x = e.x; mouse.y = e.y;
            for (let i = 0; i < 2; i++) particlesArray.push(new Particle());
        };
        window.addEventListener('mousemove', handleMouseMove);

        function handleParticles() {
            for (let i = 0; i < particlesArray.length; i++) {
                particlesArray[i].update();
                particlesArray[i].draw();
                if (particlesArray[i].size <= 0.2) { particlesArray.splice(i, 1); i--; }
            }
        }

        function animate() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            handleParticles();
            requestAnimationFrame(animate);
        }
        animate();

        const handleResize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
        window.addEventListener('resize', handleResize);

        const magneticEls = document.querySelectorAll('.btn-primary, .btn-secondary, .social-btn');
        const onMove = (e) => {
            const btn = e.currentTarget;
            const rect = btn.getBoundingClientRect();
            const x = e.clientX - rect.left - rect.width / 2;
            const y = e.clientY - rect.top - rect.height / 2;
            btn.style.transform = `translate(${x * 0.3}px, ${y * 0.3}px)`;
        };
        const onLeave = (e) => { e.currentTarget.style.transform = 'translate(0,0)'; };
        magneticEls.forEach(b => { b.addEventListener('mousemove', onMove); b.addEventListener('mouseleave', onLeave); });

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('resize', handleResize);
            magneticEls.forEach(b => { b.removeEventListener('mousemove', onMove); b.removeEventListener('mouseleave', onLeave); });
        };
    }, []);

    const fabStyle = {
        position: 'fixed', bottom: '30px', right: '30px', zIndex: 10000,
        width: '60px', height: '60px', borderRadius: '50%',
        background: 'linear-gradient(135deg, #a855f7, #6d28d9)',
        border: 'none', color: '#fff', fontSize: '1.5rem', cursor: 'pointer',
        boxShadow: '0 10px 30px rgba(168,85,247,0.5)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'transform 0.3s, box-shadow 0.3s',
    };

    return (
        <>
            {globalToggles.particles && (
                <canvas id="cursor-canvas" style={{ position: 'fixed', top: 0, left: 0, pointerEvents: 'none', zIndex: 9998 }} />
            )}

            {/* ── Home: AI Chatbot ── */}
            {isHome && (
                <>
                    {/* FAB */}
                    <button
                        onClick={() => setChatOpen(o => !o)}
                        style={fabStyle}
                        onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.1)'; e.currentTarget.style.boxShadow = '0 15px 40px rgba(168,85,247,0.7)'; }}
                        onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 10px 30px rgba(168,85,247,0.5)'; }}
                        title="RDICT AI Chat"
                    >
                        <i className={`fa-solid ${chatOpen ? 'fa-xmark' : 'fa-robot'}`}></i>
                    </button>

                    {/* Chat Window */}
                    {chatOpen && (
                        <div style={{
                            position: 'fixed', bottom: '105px', right: '25px', zIndex: 10000,
                            width: '340px', maxWidth: 'calc(100vw - 40px)',
                            background: 'rgba(10, 6, 16, 0.97)',
                            border: '1px solid rgba(168,85,247,0.3)',
                            borderRadius: '20px',
                            boxShadow: '0 20px 60px rgba(0,0,0,0.6), 0 0 40px rgba(168,85,247,0.1)',
                            backdropFilter: 'blur(20px)',
                            overflow: 'hidden',
                            fontFamily: "'Outfit', sans-serif",
                            animation: 'chatSlideIn 0.3s cubic-bezier(0.23,1,0.32,1)',
                        }}>
                            <style>{`
                                @keyframes chatSlideIn { from { opacity:0; transform:translateY(20px) scale(0.95); } to { opacity:1; transform:translateY(0) scale(1); } }
                                .chat-scroll::-webkit-scrollbar { width: 4px; }
                                .chat-scroll::-webkit-scrollbar-track { background: transparent; }
                                .chat-scroll::-webkit-scrollbar-thumb { background: rgba(168,85,247,0.3); border-radius:4px; }
                                .chat-input-field { background:transparent; border:none; outline:none; color:#fff; font-size:0.9rem; flex:1; font-family:'Outfit',sans-serif; }
                                .chat-input-field::placeholder { color:#64748b; }
                                .chat-send-btn { background:linear-gradient(135deg,#a855f7,#6d28d9); border:none; width:36px; height:36px; border-radius:50%; display:flex; align-items:center; justify-content:center; cursor:pointer; color:#fff; font-size:0.85rem; transition:0.2s; }
                                .chat-send-btn:hover { transform:scale(1.1); }
                            `}</style>

                            {/* Header */}
                            <div style={{ padding: '16px 18px', background: 'linear-gradient(135deg, rgba(168,85,247,0.2), rgba(109,40,217,0.15))', borderBottom: '1px solid rgba(168,85,247,0.15)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'linear-gradient(135deg,#a855f7,#6d28d9)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', flexShrink: 0 }}>
                                    <i className="fa-solid fa-robot"></i>
                                </div>
                                <div>
                                    <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#fff' }}>RDICT AI Bot</div>
                                    <div style={{ fontSize: '0.72rem', color: '#22c55e', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22c55e', display: 'inline-block', animation: 'pulse 1.5s infinite' }}></span>
                                        Online · ICT A/L Assistant
                                    </div>
                                </div>
                            </div>

                            {/* Messages */}
                            <div className="chat-scroll" style={{ height: '260px', overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {messages.map((msg, i) => (
                                    <div key={i} style={{ display: 'flex', justifyContent: msg.from === 'user' ? 'flex-end' : 'flex-start' }}>
                                        <div style={{
                                            maxWidth: '80%', padding: '10px 14px', borderRadius: msg.from === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                                            background: msg.from === 'user' ? 'linear-gradient(135deg,#a855f7,#6d28d9)' : 'rgba(255,255,255,0.06)',
                                            border: msg.from === 'bot' ? '1px solid rgba(255,255,255,0.08)' : 'none',
                                            color: '#fff', fontSize: '0.85rem', lineHeight: 1.5,
                                            fontFamily: "'Noto Sans Sinhala','Outfit',sans-serif",
                                        }}>
                                            {msg.text}
                                        </div>
                                    </div>
                                ))}
                                {isTyping && (
                                    <div style={{ display: 'flex' }}>
                                        <div style={{ padding: '10px 14px', borderRadius: '18px 18px 18px 4px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', gap: '4px', alignItems: 'center' }}>
                                            {[0, 1, 2].map(d => (
                                                <span key={d} style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#a855f7', display: 'inline-block', animation: `bounce 1s ${d * 0.2}s infinite` }}></span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Input */}
                            <div style={{ padding: '12px 16px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', gap: '10px', alignItems: 'center', background: 'rgba(255,255,255,0.02)' }}>
                                <input
                                    className="chat-input-field"
                                    placeholder="Type a message..."
                                    value={input}
                                    onChange={e => setInput(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && sendMessage()}
                                />
                                <button className="chat-send-btn" onClick={sendMessage}>
                                    <i className="fa-solid fa-paper-plane"></i>
                                </button>
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* ── Comments page: Add Comment button ── */}
            {isComments && (
                <a
                    href="/comments#add"
                    style={{ ...fabStyle, textDecoration: 'none', fontSize: '1.3rem' }}
                    title="Write Your Comment"
                    onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.1)'; e.currentTarget.style.boxShadow = '0 15px 40px rgba(168,85,247,0.7)'; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 10px 30px rgba(168,85,247,0.5)'; }}
                >
                    <i className="fa-solid fa-comment-dots"></i>
                </a>
            )}
        </>
    );
};

export default PremiumFeatures;
