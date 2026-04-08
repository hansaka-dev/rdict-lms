import React, { useState, useEffect, useRef } from 'react';
import { siteStats } from '../config';
import './Hero.css';

// 1. මෙන්න මේ විදිහට Images ටික ගමන් මල්ලට (Project එකට) Import කරගන්න ඕනේ.
// (ඔයාගේ Components ෆෝල්ඩර් එක තියෙන තැන අනුව '../assets' කියන එක වෙනස් වෙන්න පුළුවන්)
import robotImg from '../assets/Images/Robot.png';
import normalImg from '../assets/Images/Normal.png';

const PHRASES = [
    'Discussing all past papers of that lesson at the end of each lesson',
    'The ability to meet and discuss anything with the teacher personally',
    'Approach all students and provide individual guidance.',
    'A set of beautiful and clear tutes, lesson by lesson.',
    'Checking all students papers letter by letter for correctness'
];

const Hero = () => {
    const [isGlitch, setIsGlitch] = useState(false);
    const [twText, setTwText] = useState('');
    const twRef = useRef({ phraseIdx: 0, charIdx: 0, deleting: false });

    useEffect(() => {
        let timeout;
        const tick = () => {
            const { phraseIdx, charIdx, deleting } = twRef.current;
            const phrase = PHRASES[phraseIdx];

            if (!deleting) {
                const next = charIdx + 1;
                setTwText(phrase.slice(0, next));
                twRef.current.charIdx = next;
                if (next === phrase.length) {
                    twRef.current.deleting = true;
                    timeout = setTimeout(tick, 1800);
                } else {
                    timeout = setTimeout(tick, 55);
                }
            } else {
                const next = charIdx - 1;
                setTwText(phrase.slice(0, next));
                twRef.current.charIdx = next;
                if (next === 0) {
                    twRef.current.deleting = false;
                    twRef.current.phraseIdx = (phraseIdx + 1) % PHRASES.length;
                    timeout = setTimeout(tick, 400);
                } else {
                    timeout = setTimeout(tick, 28);
                }
            }
        };
        timeout = setTimeout(tick, 1200);
        return () => clearTimeout(timeout);
    }, []);

    useEffect(() => {
        const interval = setInterval(() => {
            setIsGlitch(true);
            setTimeout(() => setIsGlitch(false), 150);
        }, 3400);
        return () => clearInterval(interval);
    }, []);

    const handleSmoothScroll = (e, targetId) => {
        e.preventDefault();
        const element = document.getElementById(targetId);
        if (element) {
            const y = element.getBoundingClientRect().top + window.scrollY - 80;
            window.scrollTo({ top: y, behavior: 'smooth' });
        }
    };

    // 2. දැන් කලින් Import කරපු Variables දෙක මේ විදිහට පාවිච්චි කරන්න
    const teacherImgSrc = isGlitch ? robotImg : normalImg;

    return (
        <section id="home" className={`hero ${isGlitch ? 'hero--glitch' : ''}`}>
            <div className="hero-3d">
                <div className="hero-container">
                    <div className="hero-content">
                        <div className="hero-eyebrow">
                            <span className="hero-eyebrow-dot"></span>
                            Ranishan Dissanayake ICT
                        </div>
                        <h1 className="reveal-text hero-title">
                            ICT කියන්නේ යකෙක් කලු නැති <span className="text-neon">ළා දම්</span> පාට.
                        </h1>
                        <p className="hero-typewriter">
                            <span className="tw-text">{twText}</span>
                            <span className="tw-cursor">|</span>
                        </p>
                        <p className="hero-lead">
                            හරිම කරුණු, දැනෙන්න ඉගෙන ගන්න.<br />
                            Advanced Level Information Technology for Grade 12 &amp; 13 students.
                        </p>
                        <div className="hero-btns">
                            <a href="#free-courses" className="btn-primary" onClick={(e) => handleSmoothScroll(e, 'free-courses')}>Explore Tutorials</a>
                            <a href="#teacher" className="btn-secondary" onClick={(e) => handleSmoothScroll(e, 'teacher')}>Meet the Teacher</a>
                        </div>
                        <div className="hero-stats-row">
                            <div className="hero-stat">
                                <strong>{siteStats.hero.students.target}{siteStats.hero.students.suffix}</strong>
                                <span>Students Taught</span>
                            </div>
                            <div className="hero-stat-divider"></div>
                            <div className="hero-stat">
                                <strong>{siteStats.hero.passRate.target}{siteStats.hero.passRate.suffix}</strong>
                                <span>Exam Pass Rate</span>
                            </div>
                            <div className="hero-stat-divider"></div>
                            <div className="hero-stat">
                                <strong>{siteStats.hero.experience.target}{siteStats.hero.experience.suffix}</strong>
                                <span>Years Experience</span>
                            </div>
                        </div>
                        <div className="hero-scroll-hint">
                            <div className="hero-scroll-arrow">
                                <i className="fa-solid fa-chevron-down"></i>
                            </div>
                        </div>
                    </div>

                    <div className="hero-image-wrapper">
                        <div className="hero-image-group">
                            <div className="image-orbit">
                                <div className="orbit-ball"></div>
                            </div>
                            <img src={teacherImgSrc} className={`teacher-img ${isGlitch ? 'glitch-active' : ''}`} alt="Ranishan" />
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Hero;