import React, { useState } from 'react';
import { youtubeVideos } from '../config';

const FreeCourses = () => {
  const [playingVideoId, setPlayingVideoId] = useState(null);

  return (
    <section id="free-courses" style={{ padding: '6rem 0' }}>
      <div className="container">
        <div className="section-title" style={{ textAlign: 'center', maxWidth: '700px', margin: '0 auto 3.5rem auto' }}>
          <p className="eyebrow"><span>Free Learning</span> YouTube</p>
          <h2 className="section-heading">Free <span>Masterclasses</span></h2>
          <p className="prose">Catch up on recent seminars, revision sessions, and mind map discussions natively rendered via high performance HTML & CSS custom thumbnails.</p>
        </div>
        
        <div className="video-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
          {youtubeVideos.map((video) => (
            <div key={video.id} style={{ borderRadius: '16px', overflow: 'hidden', background: '#000', border: '1px solid rgba(168,85,247,0.3)', boxShadow: '0 10px 30px rgba(0,0,0,0.5)', transition: 'transform 0.3s' }} className="fc-item">
              {playingVideoId === video.id ? (
                <iframe
                  width="100%"
                  height="100%"
                  style={{ aspectRatio: '16/9', display: 'block', border: 'none' }}
                  src={`https://www.youtube.com/embed/${video.id}?autoplay=1`}
                  title="YouTube video player"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              ) : (
                <div onClick={() => setPlayingVideoId(video.id)} style={{ display: 'block', position: 'relative', cursor: 'pointer', aspectRatio: '16/9' }}>
                  <img src={video.thumbnail} alt="Video Thumbnail" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0, 0, 0, 0)', transition: 'background 0.3s' }}>
                      <div style={{ width: '64px', height: '64px', background: 'var(--primary)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 20px rgba(168, 85, 247, 0.6)' }}>
                          <i className="fa-solid fa-play" style={{ color: '#fff', fontSize: '1.5rem', marginLeft: '4px' }}></i>
                      </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
        
        <div style={{ textAlign: 'center', marginTop: '4rem' }}>
          <a href="https://www.youtube.com/@Ranishandissanayake" target="_blank" rel="noopener noreferrer" className="btn-primary magnetic">
             <i className="fa-brands fa-youtube" style={{ marginRight: '10px' }}></i> Visit YouTube Channel
          </a>
        </div>
      </div>
    </section>
  );
};

export default FreeCourses;
