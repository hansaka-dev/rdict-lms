import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import './Cursor.css';

const Cursor = () => {
    const cursorRef = useRef(null);
    const followerRef = useRef(null);
    const glowRef = useRef(null);

    useEffect(() => {
        const cursor = cursorRef.current;
        const follower = followerRef.current;
        const glow = glowRef.current;

        if (!cursor || !follower || !glow) return;

        const onMouseMove = (e) => {
            gsap.to(cursor, { x: e.clientX, y: e.clientY, duration: 0.1 });
            gsap.to(follower, { x: e.clientX, y: e.clientY, duration: 0.3 });
            
            glow.animate({
                left: `${e.clientX}px`,
                top: `${e.clientY}px`
            }, { duration: 500, fill: "forwards" });
        };

        const onMouseEnter = () => {
            gsap.to(cursor, { scale: 2, borderColor: '#FFFFFF', duration: 0.3 });
            gsap.to(follower, { scale: 0.5, backgroundColor: '#FFFFFF', duration: 0.3 });
        };

        const onMouseLeave = () => {
            gsap.to(cursor, { scale: 1, borderColor: '#A855F7', duration: 0.3 });
            gsap.to(follower, { scale: 1, backgroundColor: '#A855F7', duration: 0.3 });
        };

        document.addEventListener('mousemove', onMouseMove);

        const addHoverEvents = () => {
            const hoverItems = document.querySelectorAll('a, button, .feature-card, .stat-card, .logo, .hero-stat, .nav-links a');
            hoverItems.forEach((item) => {
                item.addEventListener('mouseenter', onMouseEnter);
                item.addEventListener('mouseleave', onMouseLeave);
            });
        };

        addHoverEvents();

        // Re-add on mutation in case components load later
        const observer = new MutationObserver(() => {
            addHoverEvents();
        });
        observer.observe(document.body, { childList: true, subtree: true });

        return () => {
            document.removeEventListener('mousemove', onMouseMove);
            observer.disconnect();
            const hoverItems = document.querySelectorAll('a, button, .feature-card, .stat-card, .logo, .hero-stat, .nav-links a');
            hoverItems.forEach((item) => {
                item.removeEventListener('mouseenter', onMouseEnter);
                item.removeEventListener('mouseleave', onMouseLeave);
            });
        };
    }, []);

    return (
        <>
            <div ref={glowRef} className="glow-cursor"></div>
            <div ref={cursorRef} className="cursor"></div>
            <div ref={followerRef} className="cursor-follower"></div>
        </>
    );
};

export default Cursor;
