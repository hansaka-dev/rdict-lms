import React, { useState } from 'react';
import { timetableConfig } from '../config';
import './Timetable.css';
import { useNavigate } from 'react-router-dom';

import img2026 from '../assets/Images/2026.png';
import img2027 from '../assets/Images/2027.png';
import img2028 from '../assets/Images/2028.png';

// Image map keyed by batch id1
const batchImages = {
  'batch-2028': img2028,
  'batch-2027': img2027,
  'batch-2026': img2026,
};

// Fallback: pick image by index order
const indexImages = [img2028, img2027, img2026];

const Timetable = () => {
  const [activeInstitute, setActiveInstitute] = useState(timetableConfig.defaultInstitute || 'Online');
  const navigate = useNavigate();

  return (
    <section id="recent-post" className="t-section">
      <div className="container" style={{ maxWidth: '1200px' }}>
        <div className="t-header" data-aos="fade-up">
          <h2 className="section-heading" style={{ fontSize: '2.5rem', marginBottom: '1.5rem', color: '#fff' }}>
            RDICT <span style={{ color: 'var(--primary)' }}>Time Table</span>
          </h2>
        </div>

        {/* Compact Institute Tabs */}
        <div className="t-tabs-wrapper" data-aos="fade-up" data-aos-delay="100">
          <div className="t-tabs-container">
            {timetableConfig.institutes.map((inst) => (
              <button
                key={inst.id}
                onClick={() => setActiveInstitute(inst.id)}
                className={`t-tab-btn ${activeInstitute === inst.id ? 'active' : ''}`}
              >
                {inst.name}
                {activeInstitute === inst.id && <div className="t-tab-indicator"></div>}
              </button>
            ))}
          </div>
        </div>

        {/* Schedule Grid */}
        <div className="t-grid">
          {timetableConfig.batches.map((batch, index) => {
            const batchSchedules = batch.schedules.filter(
              s => s.institute.toLowerCase() === activeInstitute.toLowerCase()
            );
            if (batchSchedules.length === 0) return null;

            // Pick image: try by id, fallback by index
            const cardImage = batchImages[batch.id] || indexImages[index] || img2026;
            const borderColors = ['#a855f7', '#06b6d4', '#f59e0b'];

            return (
              <div key={batch.id} className="t-card" data-aos="fade-up" data-aos-delay={index * 100}>
                <div className="t-card-inner">
                  {/* Top Image */}
                  <div className="t-card-image-wrapper">
                    <img src={cardImage} alt={batch.title} className="t-card-image" />
                    <div className="t-card-image-fade"></div>
                  </div>

                  <div className="t-card-content">
                    <div className="t-batch-badge">
                      <h3>{batch.title} <span className="anim-emoji">{batch.emoji}</span></h3>
                    </div>

                    <p className="t-desc">{batch.description}</p>

                    <div className="t-schedules">
                      {batchSchedules.map((s, idx) => {
                        const color = borderColors[idx % borderColors.length];
                        return (
                          <div key={idx} className="t-schedule-item" style={{ borderLeftColor: color }}>
                            <div className="t-day-badge" style={{ color, borderColor: color }}>
                              {s.day.toUpperCase().slice(0, 3)}
                            </div>
                            <div className="t-schedule-details">
                              <h4 className="t-time">{s.time}</h4>
                              <p className="t-meta">
                                Zoom Class · {activeInstitute}
                                {s.type && <span className="t-type-tag"> · {s.type}</span>}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="t-card-footer">
                      <a href={`tel:${timetableConfig.contactPhone || ''}`} className="t-action-btn primary-btn">
                        <i className="fa-solid fa-phone"></i> ඇමතුමක්
                      </a>
                      <a href={timetableConfig.whatsappLink || '#'} target="_blank" rel="noopener noreferrer" className="t-action-btn whatsapp-btn">
                        <i className="fa-brands fa-whatsapp"></i>
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Timetable;
