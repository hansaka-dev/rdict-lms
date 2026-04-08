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
                    <audio ref={audioRef} src={bgmAudio} loop style={{ display: 'none' }} />

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

                <Footer />
            </div>
        </>
    );
};

export default Home;
