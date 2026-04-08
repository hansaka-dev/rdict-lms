import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { globalToggles } from '../config';

const PremiumFeatures = () => {
    const navigate = useNavigate();
    const location = useLocation();

    // Only show comments button on the landing page (not on /comments itself)
    const showCommentsBtn = location.pathname === '/';

    useEffect(() => {
        // --- 1. LIQUID / PARTICLE CURSOR TRAIL ---
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

        const handleMouseMove = (event) => {
            mouse.x = event.x;
            mouse.y = event.y;
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
            window.requestAnimationFrame(animate);
        }
        animate();

        const handleResize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        window.addEventListener('resize', handleResize);

        // --- 2. MAGNETIC BUTTONS ---
        const magneticElements = document.querySelectorAll('.btn-primary, .btn-secondary, .social-btn');
        const handleMagneticMove = (e) => {
            const btn = e.currentTarget;
            const rect = btn.getBoundingClientRect();
            const x = e.clientX - rect.left - rect.width / 2;
            const y = e.clientY - rect.top - rect.height / 2;
            btn.style.transform = `translate(${x * 0.3}px, ${y * 0.3}px)`;
        };
        const handleMagneticLeave = (e) => { e.currentTarget.style.transform = 'translate(0px, 0px)'; };

        magneticElements.forEach(btn => {
            btn.addEventListener('mousemove', handleMagneticMove);
            btn.addEventListener('mouseleave', handleMagneticLeave);
        });

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('resize', handleResize);
            magneticElements.forEach(btn => {
                btn.removeEventListener('mousemove', handleMagneticMove);
                btn.removeEventListener('mouseleave', handleMagneticLeave);
            });
        };
    }, []);

    return (
        <>
            {globalToggles.particles && (
                <canvas
                    id="cursor-canvas"
                    style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', pointerEvents: 'none', zIndex: 9999 }}
                />
            )}

            {/* Floating Comments Button — only on Home page */}
            {showCommentsBtn && (
                <button
                    onClick={() => navigate('/comments')}
                    title="Write Your Comment"
                    style={{
                        position: 'fixed',
                        bottom: '30px',
                        right: '30px',
                        zIndex: 10000,
                        width: '60px',
                        height: '60px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #a855f7, #6d28d9)',
                        border: 'none',
                        color: '#fff',
                        fontSize: '1.5rem',
                        cursor: 'pointer',
                        boxShadow: '0 10px 30px rgba(168,85,247,0.5)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'transform 0.3s, box-shadow 0.3s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.1)'; e.currentTarget.style.boxShadow = '0 15px 40px rgba(168,85,247,0.7)'; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 10px 30px rgba(168,85,247,0.5)'; }}
                >
                    <i className="fa-solid fa-comment-dots"></i>
                </button>
            )}
        </>
    );
};

export default PremiumFeatures;
