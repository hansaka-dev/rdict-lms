import React from 'react';
import './Impact.css';

const Impact = () => {
    const stats = [
        { id: 1, title: 'සාර්ථක සිසුන්', value: '10,000+', suffix: '', icon: 'fa-user-graduate', delay: 0 },
        { id: 2, title: 'වසරකට A සාමාර්ථ', value: '500', suffix: '+', icon: 'fa-trophy', delay: 100 },
        { id: 3, title: 'දිස්ත්‍රික් ප්‍රථම ස්ථාන', value: '25', suffix: '+', icon: 'fa-medal', delay: 200 },
        { id: 4, title: 'නවීන අධ්‍යාපන ක්‍රම', value: '100', suffix: '%', icon: 'fa-laptop-code', delay: 300 }
    ];

    return (
        <section className="impact-section">
            <div className="impact-glow-bg"></div>
            <div className="container">
                <div className="impact-header" data-aos="fade-up">
                    <p className="eyebrow"><span>RDICT Impact</span> ප්‍රතිඵල</p>
                    <h2 className="section-heading">විශිෂ්ටත්වයේ <span>සංඛ්‍යාලේඛන</span></h2>
                    <p className="prose mx-auto">
                        වසර ගණනාවක අත්දැකීම් සමගින් ලංකාවේ වැඩිම ප්‍රතිඵල හිමිකරගත් තොරතුරු තාක්ෂණ පන්තිය.
                    </p>
                </div>

                <div className="impact-grid">
                    {stats.map((stat) => (
                        <div key={stat.id} className="impact-card" data-aos="zoom-in" data-aos-delay={stat.delay}>
                            <div className="impact-icon-wrapper">
                                <i className={`fa-solid ${stat.icon}`}></i>
                            </div>
                            <div className="impact-content">
                                <h3 className="impact-value">
                                    <span className="counter-up">{stat.value}</span>
                                    <span className="impact-suffix">{stat.suffix}</span>
                                </h3>
                                <p className="impact-title sinhala-body">{stat.title}</p>
                            </div>
                            
                            {/* Decorative Lines */}
                            <div className="impact-deco-line top"></div>
                            <div className="impact-deco-line bottom"></div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default Impact;
