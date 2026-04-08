import React from 'react';

const Teacher = () => {
  return (
    <section id="teacher" style={{
      position: 'relative',
      padding: '6rem 0',
      overflow: 'hidden',
      background: 'transparent',
    }}>
      {/* Background glow */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0,
        background: 'radial-gradient(ellipse 60% 50% at 70% 50%, rgba(168, 85, 247, 0.12), transparent 70%)',
      }} />

      <div className="container" style={{ position: 'relative', zIndex: 1, maxWidth: '1100px' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1.4fr)',
          gap: 'clamp(2rem, 5vw, 5rem)',
          alignItems: 'center',
        }} className="teacher-grid">

          {/* LEFT: Image column */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>
            <div style={{
              position: 'relative',
              width: '100%',
              maxWidth: '340px',
              borderRadius: '24px',
              overflow: 'hidden',
              background: 'rgba(168,85,247,0.08)',
              border: '1px solid rgba(168,85,247,0.2)',
              boxShadow: '0 20px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05)',
            }}>
              <img
                src="/src/assets/Images/Sir.jpg"
                alt="Ranishan Dissanayake"
                style={{ display: 'block', width: '100%', aspectRatio: '4/5', objectFit: 'cover' }}
              />
              {/* Gradient fade at bottom */}
              <div style={{
                position: 'absolute', bottom: 0, left: 0, right: 0, height: '100px',
                background: 'linear-gradient(to top, rgba(6,3,10,0.9), transparent)',
              }} />
              <span style={{
                position: 'absolute', left: '1rem', bottom: '1rem', right: '1rem',
                padding: '0.5rem 1rem',
                fontSize: '0.72rem', fontWeight: 700, color: '#fff',
                background: 'rgba(168,85,247,0.3)',
                backdropFilter: 'blur(8px)',
                borderRadius: '999px', textAlign: 'center',
                border: '1px solid rgba(168,85,247,0.4)',
                letterSpacing: '1px', textTransform: 'uppercase',
              }}>
                Lead Educator · ICT
              </span>
            </div>

            {/* Mini stats row */}
            <div style={{ display: 'flex', gap: '0.75rem', width: '100%', maxWidth: '340px' }}>
              {[
                { label: 'Grades', value: '12 & 13' },
                { label: 'Focus', value: 'Theory + Paper' },
                { label: 'Lang', value: 'Bilingual' },
              ].map((stat) => (
                <div key={stat.label} style={{
                  flex: 1, padding: '0.75rem 0.5rem', textAlign: 'center',
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.07)',
                  borderRadius: '12px',
                }}>
                  <strong style={{ display: 'block', fontSize: '0.85rem', color: '#fff', fontFamily: 'Outfit', lineHeight: 1.2 }}>{stat.value}</strong>
                  <span style={{ fontSize: '0.62rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{stat.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT: Content column */}
          <div>
            <p className="eyebrow"><span>RDICT</span> Your Teacher</p>
            <h2 className="section-heading" style={{ marginBottom: '0.5rem' }}>
              Ranishan <span>Dissanayake</span>
            </h2>
            <p style={{ color: 'var(--primary)', fontWeight: 600, marginBottom: '1.25rem', fontSize: '0.95rem' }}>
              A/L ICT Specialist · Grade 12 &amp; 13 · High-end Results Focus
            </p>
            <p className="prose" style={{ marginBottom: '1rem' }}>
              Leading the ICT A/L arena with a deep focus on Python logic, Database normalization, and full 400-mark paper coverage.
            </p>
            <p className="prose sinhala" style={{ fontFamily: "'Gemunu Libre', 'Abhaya Libre', sans-serif", marginBottom: '1.75rem' }}>
              උසස් පෙළ විෂය නිර්දේශයේ ඇති සංකීර්ණ කොටස් සරලව මෙන්ම විභාග ප්‍රශ්න පත්‍ර රටාවන්ට අනුකූලව ඉගැන්වීම සිදු කෙරේ.
            </p>

            {/* Feature checklist */}
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '2rem' }}>
              {[
                'Classrooms & guided practice',
                'RDICT booklet & notes',
                'Parents kept in the loop',
              ].map((item) => (
                <li key={item} style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', color: '#cbd5e1', fontSize: '0.95rem' }}>
                  <i className="fa-solid fa-circle-check" style={{ color: 'var(--primary)', fontSize: '1.1rem', flexShrink: 0 }}></i>
                  {item}
                </li>
              ))}
            </ul>

            <a href="#recent-post" className="btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
              <i className="fa-regular fa-calendar-check"></i> View Timetable
            </a>
          </div>
        </div>
      </div>

      {/* Responsive styles injected */}
      <style>{`
        @media (max-width: 768px) {
          .teacher-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </section>
  );
};

export default Teacher;
