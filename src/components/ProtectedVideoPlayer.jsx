import React, { useEffect, useRef, useState, useCallback } from 'react';

/**
 * ProtectedVideoPlayer - Maximum Security YouTube Embed
 * ─────────────────────────────────────────────────
 * ✅ No YouTube branding / logo visible
 * ✅ No "Watch on YouTube" link
 * ✅ Auto-Fullscreen on open
 * ✅ Auto-hides when user exits fullscreen (calls onClose)
 * ✅ Resumes from last position when reopened
 * ✅ Right-click disabled
 * ✅ PrintScreen warning
 * ✅ Custom play/pause/seek controls (no YouTube UI)
 */

/**
 * Accepts any YouTube URL format and returns the bare video ID.
 * Handles:
 *  - https://www.youtube.com/watch?v=VIDEO_ID
 *  - https://youtu.be/VIDEO_ID
 *  - https://www.youtube.com/embed/VIDEO_ID
 *  - https://youtube.com/shorts/VIDEO_ID
 *  - A bare VIDEO_ID string (returned as-is if it's 11 chars)
 */
const parseYouTubeId = (input) => {
    if (!input) return '';
    const trim = input.trim();
    // Already a bare ID (YouTube IDs are 11 chars, no slashes/dots)
    if (/^[a-zA-Z0-9_-]{11}$/.test(trim)) return trim;
    // Try matching URL patterns
    const patterns = [
        /[?&]v=([a-zA-Z0-9_-]{11})/,           // ?v=ID
        /youtu\.be\/([a-zA-Z0-9_-]{11})/,       // youtu.be/ID
        /\/embed\/([a-zA-Z0-9_-]{11})/,         // /embed/ID
        /\/shorts\/([a-zA-Z0-9_-]{11})/,        // /shorts/ID
        /\/v\/([a-zA-Z0-9_-]{11})/,             // /v/ID
    ];
    for (const pattern of patterns) {
        const match = trim.match(pattern);
        if (match) return match[1];
    }
    return trim; // Fallback: return as-is
};

const ProtectedVideoPlayer = ({ videoId: rawVideoId, title = "Lesson", resumeTime = 0, onClose, onTimeUpdate, userName = '', userEmail = '' }) => {
    const videoId = parseYouTubeId(rawVideoId); // Always extract clean ID
    const containerRef = useRef(null);
    const playerRef = useRef(null);      // YT.Player instance
    const playerDivId = useRef(`yt-player-${Math.random().toString(36).substr(2, 9)}`);
    const timeRef = useRef(resumeTime);  // Track current time for resume
    const tickerRef = useRef(null);

    const [playerReady, setPlayerReady] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [duration, setDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState(resumeTime);
    const [warned, setWarned] = useState(false);
    const [watermarkPos, setWatermarkPos] = useState({ top: '20%', left: '10%' });
    const [hasStarted, setHasStarted] = useState(false);

    // ── Load YouTube IFrame API ──────────────────────────────────────────
    useEffect(() => {
        const isValidYTId = /^[a-zA-Z0-9_-]{11}$/.test(videoId);
        if (!isValidYTId) return; // Do not load API if the video ID is completely invalid

        const loadAPI = () => {
            if (window.YT && window.YT.Player) {
                initPlayer();
                return;
            }
            const tag = document.createElement('script');
            tag.src = 'https://www.youtube.com/iframe_api';
            document.head.appendChild(tag);
            window.onYouTubeIframeAPIReady = initPlayer;
        };

        const initPlayer = () => {
            playerRef.current = new window.YT.Player(playerDivId.current, {
                videoId,
                playerVars: {
                    autoplay: 0,
                    controls: 0,          // Hide ALL YouTube controls
                    modestbranding: 1,    // Suppress YouTube logo
                    rel: 0,              // No related videos
                    showinfo: 0,         // No title bar
                    iv_load_policy: 3,   // No annotations
                    fs: 0,               // Disable YT native fullscreen button
                    disablekb: 1,        // Disable YT keyboard shortcuts
                    start: Math.floor(resumeTime),
                    enablejsapi: 1,
                    origin: window.location.origin,
                },
                events: {
                    onReady: (e) => {
                        setPlayerReady(true);
                        setDuration(e.target.getDuration());
                        // Removed auto playVideo and requestFS due to strict browser autoplay policies
                        // The user will click the play button to start the video.
                    },
                    onStateChange: (e) => {
                        setIsPlaying(e.data === window.YT.PlayerState.PLAYING);
                        if (e.data === window.YT.PlayerState.PLAYING) {
                            startTicker(e.target);
                        } else {
                            stopTicker();
                        }
                    },
                }
            });
        };

        loadAPI();

        return () => {
            stopTicker();
            if (playerRef.current && playerRef.current.destroy) {
                playerRef.current.destroy();
            }
        };
    }, [videoId]);

    // ── Fullscreen API ───────────────────────────────────────────────────
    const requestFS = () => {
        const el = containerRef.current;
        if (!el) return;
        if (el.requestFullscreen) el.requestFullscreen();
        else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
    };

    // When user presses Escape / exits fullscreen → close viewer & save time
    useEffect(() => {
        const onFSChange = () => {
            const isFS = !!(document.fullscreenElement || document.webkitFullscreenElement);
            if (!isFS) {
                // Save current time for resume
                if (playerRef.current && playerRef.current.getCurrentTime) {
                    const t = playerRef.current.getCurrentTime();
                    timeRef.current = t;
                    if (onTimeUpdate) onTimeUpdate(t);
                }
                stopTicker();
                if (onClose) onClose();
            }
        };
        document.addEventListener('fullscreenchange', onFSChange);
        document.addEventListener('webkitfullscreenchange', onFSChange);
        return () => {
            document.removeEventListener('fullscreenchange', onFSChange);
            document.removeEventListener('webkitfullscreenchange', onFSChange);
        };
    }, [onClose, onTimeUpdate]);

    // ── Time Ticker (progress bar updates) ──────────────────────────────
    const startTicker = useCallback((player) => {
        stopTicker();
        tickerRef.current = setInterval(() => {
            if (player && player.getCurrentTime) {
                const t = player.getCurrentTime();
                setCurrentTime(t);
                timeRef.current = t;
                if (onTimeUpdate) onTimeUpdate(t);
            }
        }, 500);
    }, [onTimeUpdate]);

    const stopTicker = () => {
        if (tickerRef.current) clearInterval(tickerRef.current);
    };

    // ── DevTools & PrintScreen Security Blocking ──────────────────────────
    useEffect(() => {
        const handleKeyDown = (e) => {
            // Block F12, Ctrl+Shift+I, Ctrl+Shift+C, Ctrl+Shift+J, Ctrl+U
            if (
                e.key === 'F12' ||
                (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'i')) ||
                (e.ctrlKey && e.shiftKey && (e.key === 'C' || e.key === 'c')) ||
                (e.ctrlKey && e.shiftKey && (e.key === 'J' || e.key === 'j')) ||
                (e.ctrlKey && (e.key === 'U' || e.key === 'u'))
            ) {
                e.preventDefault();
                setWarned(true);
                setTimeout(() => setWarned(false), 5000);
            }
        };

        const handleKeyUp = (e) => {
            if (e.key === 'PrintScreen') {
                setWarned(true);
                setTimeout(() => setWarned(false), 5000);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, []);

    // ── Floating Watermark — moves every 8s as anti-screen-record deterrent ──
    useEffect(() => {
        const randomPos = () => ({
            top: `${5 + Math.random() * 75}%`,
            left: `${5 + Math.random() * 65}%`,
        });
        setWatermarkPos(randomPos());
        const interval = setInterval(() => setWatermarkPos(randomPos()), 8000);
        return () => clearInterval(interval);
    }, []);

    // ── Custom Controls ──────────────────────────────────────────────────
    const togglePlay = () => {
        if (!playerRef.current || !playerRef.current.getPlayerState) return;
        const state = playerRef.current.getPlayerState();
        if (state === window.YT.PlayerState.PLAYING) { 
            playerRef.current.pauseVideo(); 
        } else { 
            playerRef.current.playVideo(); 
        }
    };

    const seek = (e) => {
        if (!playerRef.current || !duration) return;
        const bar = e.currentTarget;
        const rect = bar.getBoundingClientRect();
        const ratio = (e.clientX - rect.left) / rect.width;
        const seekTo = ratio * duration;
        playerRef.current.seekTo(seekTo, true);
        setCurrentTime(seekTo);
    };

    const fmtTime = (s) => {
        s = Math.floor(s || 0);
        const m = Math.floor(s / 60);
        const sec = s % 60;
        return `${m}:${sec < 10 ? '0' : ''}${sec}`;
    };

    const progress = duration ? (currentTime / duration) * 100 : 0;

    const isValidYTId = /^[a-zA-Z0-9_-]{11}$/.test(videoId);

    if (!isValidYTId) {
        return (
            <div style={{
                position: 'relative', width: '100%', height: '100%', background: '#0a0a0a', 
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#94a3b8'
            }}>
                <i className="fa-solid fa-video-slash" style={{ fontSize: '4rem', marginBottom: '15px', color: '#334155' }}></i>
                <h3 style={{ margin: 0, color: '#f1f5f9', fontWeight: 600 }}>Invalid Video Link</h3>
                <p style={{ marginTop: '8px', fontSize: '0.9rem' }}>The video ID or URL provided for this lesson is invalid.</p>
            </div>
        );
    }

    return (
        <div
            ref={containerRef}
            onContextMenu={(e) => e.preventDefault()}
            style={{
                position: 'relative',
                width: '100%',
                height: '100%',
                background: '#0a0a0a',
                userSelect: 'none',
                WebkitUserSelect: 'none',
                display: 'flex',
                flexDirection: 'column',
            }}
        >
            {/* PrintScreen Warning */}
            {warned && (
                <div style={{
                    position: 'absolute', top: 0, left: 0, right: 0, zIndex: 9999,
                    background: '#ef4444', color: '#fff', padding: '12px',
                    textAlign: 'center', fontWeight: 700, fontSize: '1rem'
                }}>
                    ⚠️ Screen capture detected. This content is protected under RDICT LMS.
                </div>
            )}

            {/* YouTube IFrame (invisible controls) */}
            <div
                style={{ flex: 1, position: 'relative', overflow: 'hidden' }}
                onContextMenu={(e) => e.preventDefault()}
            >
                <div id={playerDivId.current} style={{ width: '100%', height: '100%' }} />

                {/* ── Custom Thumbnail Overlay (Hides YouTube UI) ── */}
                {!hasStarted && (
                    <div
                        onClick={() => {
                            setHasStarted(true);
                            if (playerRef.current && playerRef.current.playVideo) {
                                playerRef.current.playVideo();
                            }
                        }}
                        style={{
                            position: 'absolute', inset: 0, zIndex: 50,
                            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                            background: '#000'
                        }}
                    >
                        <img 
                            src={`https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`} 
                            onError={(e) => { e.target.onerror = null; e.target.src = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`; }}
                            style={{ position: 'absolute', width: '100%', height: '100%', objectFit: 'cover', opacity: 0.8 }}
                            alt="Thumbnail"
                        />
                        <div style={{ position: 'relative', zIndex: 51, width: '80px', height: '80px', background: 'rgba(168, 85, 247, 0.9)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 20px rgba(168,85,247,0.5)' }}>
                            <i className="fa-solid fa-play" style={{ color: '#fff', fontSize: '2.5rem', marginLeft: '8px' }}></i>
                        </div>
                    </div>
                )}

                {/* Anti-inspect overlay */}
                <div
                    onContextMenu={(e) => e.preventDefault()}
                    style={{
                        position: 'absolute', inset: 0, zIndex: 5,
                        background: 'transparent',
                        pointerEvents: 'none',
                    }}
                />

                {/* ── Top/Bottom Masks to Destroy YouTube Forced Branding (Title/Logos) ── */}
                {!isPlaying && hasStarted && (
                    <>
                        {/* Top Mask - Hides Video Title and Channel Avatar */}
                        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '90px', background: '#0a0a0a', zIndex: 14, pointerEvents: 'none' }} />
                        
                        {/* Bottom Mask - Hides 'Watch on YouTube' and YouTube Watermarks */}
                        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '70px', background: '#0a0a0a', zIndex: 14, pointerEvents: 'none' }} />
                    </>
                )}

                {/* ── Floating Identity Watermark ── */}
                {(userName || userEmail) && (
                    <div
                        style={{
                            position: 'absolute',
                            top: watermarkPos.top,
                            left: watermarkPos.left,
                            zIndex: 15,
                            pointerEvents: 'none',
                            opacity: 0.18,
                            transition: 'top 2s ease, left 2s ease',
                            userSelect: 'none',
                            WebkitUserSelect: 'none',
                        }}
                    >
                        <div style={{
                            background: 'rgba(255,255,255,0.08)',
                            border: '1px solid rgba(255,255,255,0.15)',
                            borderRadius: '8px',
                            padding: '8px 14px',
                            backdropFilter: 'blur(4px)',
                        }}>
                            <p style={{ color: '#fff', fontSize: '0.9rem', fontWeight: 700, margin: 0 }}>{userName}</p>
                            <p style={{ color: '#cbd5e1', fontSize: '0.75rem', margin: 0 }}>{userEmail}</p>
                            <p style={{ color: '#94a3b8', fontSize: '0.65rem', margin: 0 }}>RDICT LMS — Protected</p>
                        </div>
                    </div>
                )}

                {/* Center Click to Play/Pause */}
                <div
                    onClick={togglePlay}
                    style={{
                        position: 'absolute', inset: 0, zIndex: 10,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer',
                        background: 'transparent',
                    }}
                />
            </div>

            {/* ── Custom Control Bar ── */}
            <div style={{
                background: 'linear-gradient(to top, rgba(0,0,0,0.9), transparent)',
                padding: '15px 20px 10px 20px',
                position: 'absolute',
                bottom: 0, left: 0, right: 0,
                zIndex: 20,
            }}>
                {/* Progress Bar */}
                <div
                    onClick={seek}
                    style={{
                        width: '100%', height: '4px',
                        background: 'rgba(255,255,255,0.2)',
                        borderRadius: '4px', cursor: 'pointer',
                        marginBottom: '10px', position: 'relative'
                    }}
                >
                    <div style={{
                        width: `${progress}%`, height: '100%',
                        background: '#a855f7', borderRadius: '4px',
                        transition: 'width 0.3s linear'
                    }} />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    {/* Play/Pause */}
                    <button
                        onClick={togglePlay}
                        style={{ background: 'none', border: 'none', color: '#fff', fontSize: '1.3rem', cursor: 'pointer' }}
                    >
                        <i className={`fa-solid ${isPlaying ? 'fa-pause' : 'fa-play'}`}></i>
                    </button>

                    {/* Time */}
                    <span style={{ color: '#cbd5e1', fontSize: '0.85rem', fontFamily: 'monospace' }}>
                        {fmtTime(currentTime)} / {fmtTime(duration)}
                    </span>

                    <div style={{ flex: 1 }} />

                    {/* Title */}
                    <span style={{ color: '#94a3b8', fontSize: '0.8rem', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{title}</span>

                    <button
                        onClick={requestFS}
                        style={{ background: 'none', border: 'none', color: '#fff', fontSize: '1.1rem', cursor: 'pointer', marginLeft: '10px' }}
                        title="Full Screen"
                    >
                        <i className="fa-solid fa-expand"></i>
                    </button>

                    {/* Shield badge */}
                    <span style={{ color: '#a855f7', fontSize: '0.8rem', marginLeft: '15px' }}>
                        <i className="fa-solid fa-shield-halved" style={{ marginRight: '4px' }}></i> Protected
                    </span>
                </div>
            </div>
        </div>
    );
};

export default ProtectedVideoPlayer;
