import React, { useEffect, useState } from 'react';
import './Preloader.css';

const Preloader = ({ onDone }) => {
    const [progress, setProgress] = useState(0);
    const [hidden, setHidden] = useState(false);

    useEffect(() => {
        let current = 0;
        const interval = setInterval(() => {
            current = Math.min(current + Math.random() * 18, 90);
            setProgress(current);
        }, 120);

        const onLoad = () => {
            clearInterval(interval);
            setProgress(100);
            setTimeout(() => {
                setHidden(true);
                onDone && onDone();
            }, 600);
        };

        if (document.readyState === 'complete') {
            onLoad();
        } else {
            window.addEventListener('load', onLoad);
        }

        return () => {
            clearInterval(interval);
            window.removeEventListener('load', onLoad);
        };
    }, [onDone]);

    if (hidden) return null;

    return (
        <div className={`preloader ${progress === 100 ? 'done' : ''}`} aria-hidden="true">
            <div className="preloader-inner">
                <div className="preloader-logo">RDICT<span>.</span></div>
                <p className="preloader-sub">Advanced Level ICT &middot; Grade 12 &amp; 13</p>
                <div className="preloader-bar">
                    <div className="preloader-fill" style={{ width: `${progress}%` }}></div>
                </div>
            </div>
        </div>
    );
};

export default Preloader;
