import React from 'react';

const Methodology = () => {
  return (
    <section id="methodology" className="section-methodology" style={{ padding: '6rem 0', position: 'relative' }}>
      <div className="container">
        <div className="section-title" style={{ textAlign: 'center', marginBottom: '4rem' }}>
          <p className="eyebrow"><span>RDICT Advantage</span> Why Us?</p>
          <h2 className="section-heading">Specialization of <span>RDICT Classes</span></h2>
        </div>
        <div className="features-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
          <div className="feature-card glass-card" style={{ padding: '2.5rem', borderRadius: 'var(--radius-lg)' }}>
            <div className="icon" style={{ fontSize: '2.5rem', color: 'var(--primary)', marginBottom: '1.5rem' }}><i className="fa-solid fa-laptop-code"></i></div>
            <h3 style={{ marginBottom: '1rem' }}>100% Practical Python</h3>
            <p className="prose">Theory පමණක් නොව, හැම ළමයෙකුටම පරිගණක භාවිතයෙන් ප්‍රායෝගිකව කේත ලිවීමට (Coding) අවස්ථාව හිමිවේ.</p>
          </div>
          <div className="feature-card glass-card" style={{ padding: '2.5rem', borderRadius: 'var(--radius-lg)' }}>
            <div className="icon" style={{ fontSize: '2.5rem', color: 'var(--primary)', marginBottom: '1.5rem' }}><i className="fa-solid fa-chart-line"></i></div>
            <h3 style={{ marginBottom: '1rem' }}>AI & Past Paper Analysis</h3>
            <p className="prose">පසුගිය විභාග ප්‍රශ්න පත්‍ර රටාවන් (Patterns) විශ්ලේෂණය කරමින් නිවැරදි ඉලක්ක ගත ඉගැන්වීමක් සිදුකෙරේ.</p>
          </div>
          <div className="feature-card glass-card" style={{ padding: '2.5rem', borderRadius: 'var(--radius-lg)' }}>
            <div className="icon" style={{ fontSize: '2.5rem', color: 'var(--primary)', marginBottom: '1.5rem' }}><i className="fa-solid fa-users-viewfinder"></i></div>
            <h3 style={{ marginBottom: '1rem' }}>Individual Attention</h3>
            <p className="prose">ස්මාර්ට් පන්ති කාමර (Smart Classrooms) තුළින් සෑම සිසුවෙකුටම තනි තනිව අවධානය යොමුකරමින් ඉගැන්වීම් සිදුකරයි.</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Methodology;
