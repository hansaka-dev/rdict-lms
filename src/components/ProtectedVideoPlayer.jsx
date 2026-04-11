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

    // ── Load YouTube IFrame API ──────────────────────────────────────────
    useEffect(() => {
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
                    autoplay: 1,
                    controls: 0,          // Hide ALL YouTube controls
                    modestbranding: 1,    // Suppress YouTube logo
                    rel: 0,              // No related videos
                    showinfo: 0,         // No title bar
                    iv_load_policy: 3,   // No annotations
                    fs: 0,               // Disable YT native fullscreen button (we handle it)
                    disablekb: 1,        // Disable YT keyboard shortcuts
                    start: Math.floor(resumeTime),
                    enablejsapi: 1,
                    origin: window.location.origin,
                },
                events: {
                    onReady: (e) => {
                        setPlayerReady(true);
                        setDuration(e.target.getDuration());
                        e.target.playVideo();
                        setIsPlaying(true);
                        // Request fullscreen immediately
                        requestFS();
                        startTicker(e.target);
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

    // ── PrintScreen Warning ──────────────────────────────────────────────
    useEffect(() => {
        const handleKey = (e) => {
            if (e.key === 'PrintScreen') {
                setWarned(true);
                setTimeout(() => setWarned(false), 5000);
            }
        };
        window.addEventListener('keyup', handleKey);
        return () => window.removeEventListener('keyup', handleKey);
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
        if (!playerRef.current) return;
        if (isPlaying) { playerRef.current.pauseVideo(); }
        else { playerRef.current.playVideo(); }
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

    return (
        <div
            ref={containerRef}
            onContextMenu={(e) => e.preventDefault()}
            style={{
                position: 'relative',
                width: '100%',
                height: '100%',
                background: '#000',
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
                style={{ flex: 1, position: 'relative' }}
                onContextMenu={(e) => e.preventDefault()}
            >
                <div id={playerDivId.current} style={{ width: '100%', height: '100%' }} />

                {/* Anti-inspect overlay */}
                <div
                    onContextMenu={(e) => e.preventDefault()}
                    style={{
                        position: 'absolute', inset: 0, zIndex: 5,
                        background: 'transparent',
                        pointerEvents: 'none',
                    }}
                />

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

                    {/* Shield badge */}
                    <span style={{ color: '#a855f7', fontSize: '0.8rem' }}>
                        <i className="fa-solid fa-shield-halved" style={{ marginRight: '4px' }}></i> Protected
                    </span>
                </div>
            </div>
        </div>
    );
};

export default ProtectedVideoPlayer;
