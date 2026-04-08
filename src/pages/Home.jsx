import React, { useEffect, useState, useRef } from 'react';
import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import Timetable from '../components/Timetable';
import FreeCourses from '../components/FreeCourses';
import Teacher from '../components/Teacher';
import Reviews from '../components/Reviews';
import Impact from '../components/Impact';
import Gallery from '../components/Gallery';
import FAQ from '../components/FAQ';
import Footer from '../components/Footer';
import Preloader from '../components/Preloader';
import Cursor from '../components/Cursor';
import LMSPromo from '../components/LMSPromo';
import BatchLinks from '../components/BatchLinks';
import WallOfFame from '../components/WallOfFame';
import bgmAudio from '../assets/Images/bgm.mp3';
import { globalToggles } from '../config';
import './Home.css';

import Lenis from 'lenis';

const Home = () => {
    const [loaded, setLoaded] = useState(false);
    const audioRef = useRef(null);

    useEffect(() => {
        // Advanced Auto-Play Trigger for Cinematic Experience
        const startAudio = () => {
            if (globalToggles.music && audioRef.current && audioRef.current.paused) {
                audioRef.current.play().catch(e => console.log('Audio autoplay blocked by browser policy until further interaction:', e));
            }
            // Remove listeners once audio has successfully triggered
            document.removeEventListener('click', startAudio);
            document.removeEventListener('scroll', startAudio);
            document.removeEventListener('keydown', startAudio);
        };

        if (globalToggles.music) {
            document.addEventListener('click', startAudio);
            document.addEventListener('scroll', startAudio);
            document.addEventListener('keydown', startAudio);
        }

        return () => {
            document.removeEventListener('click', startAudio);
            document.removeEventListener('scroll', startAudio);
            document.removeEventListener('keydown', startAudio);
        };
    }, []);

    useEffect(() => {
        if (!loaded) return;

        // Initialize Lenis Smooth Scroll
        const lenis = new Lenis({
            duration: 1.2,
            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
            touchMultiplier: 2,
            infinite: false,
        });

        function raf(time) {
            lenis.raf(time);
            requestAnimationFrame(raf);
        }
        requestAnimationFrame(raf);

        return () => {
            lenis.destroy();
        };
    }, [loaded]);

    return (
        <>
            <Cursor />
            {/* ── Preloader ── */}
            <Preloader onDone={() => setLoaded(true)} />

            <div className={`home-page ${loaded ? 'is-loaded' : ''}`}>
                {/* ── Layered background ── */}
                <div className="bg-scene" aria-hidden="true">
                    <div className="bg-mesh-3d"></div>
                    <span className="bg-orb bg-orb--1"></span>
                    <span className="bg-orb bg-orb--2"></span>
                    <span className="bg-orb bg-orb--3"></span>
                </div>
                <div className="bg-glow" aria-hidden="true"></div>
                <div className="bg-stars" aria-hidden="true"></div>
                
                <div className="bg-circuit" aria-hidden="true">
                    {[10, 30, 50, 70, 90].map((left, i) => (
                        <div 
                            key={i} 
                            className="pulse-line" 
                            style={{ left: `${left}%`, animationDelay: `${i * 1.5}s` }}
                        ></div>
                    ))}
                </div>

                <Navbar />

                <main id="main-content">
                    {/* Background Music Engine */}
                    {globalToggles.music && <audio ref={audioRef} src={bgmAudio} loop />}

                    <Hero />
                    <Timetable />
                    <BatchLinks />
                    <LMSPromo />
                    <FreeCourses />
                    <Teacher />
                    <WallOfFame />
                    <Reviews />
                    <Impact />
                    <Gallery />
                    <FAQ />
                </main>

                {/* Floating chat button */}
                <div className="floating-chat-btn" style={{
                    position: 'fixed', bottom: '2rem', right: '2rem',
                    width: '60px', height: '60px', borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    zIndex: 900, cursor: 'pointer',
                    background: 'var(--primary)', color: '#fff',
                    boxShadow: '0 10px 30px rgba(168, 85, 247, 0.5)',
                    transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
                }}>
                    <i className="fa-solid fa-comment-dots" style={{ fontSize: '1.4rem' }}></i>
                </div>

                <Footer />
            </div>
        </>
    );
};

export default Home;
