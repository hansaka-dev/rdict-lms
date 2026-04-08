import React from 'react';
import './BatchLinks.css';

const BatchLinks = () => {
    const batches = [
        { year: "2024", type: "Revision & Theory", icon: "fa-rocket", link: "https://chat.whatsapp.com/dummy1", desc: "අවසානය වෙනතෙක් අඛණ්ඩව." },
        { year: "2025", type: "Theory Only", icon: "fa-bolt", link: "https://chat.whatsapp.com/dummy2", desc: "නව විෂය නිර්දේශය මුල සිට." },
        { year: "2026", type: "Theory Starting", icon: "fa-star", link: "https://chat.whatsapp.com/dummy3", desc: "මූලික සංකල්ප තහවුරු කෙරේ." },
        { year: "2027", type: "Foundation", icon: "fa-seedling", link: "https://chat.whatsapp.com/dummy4", desc: "පරිගණක විද්‍යාවේ අත්පොත් තැබීම." },
    ];

    return (
        <section id="batch-links" className="batch-section">
            <div className="container">
                <div className="text-center" style={{ marginBottom: "4rem" }}>
                    <p className="eyebrow" style={{ display: "block", textAlign: "center" }}><span>Join Community</span> WhatsApp Groups</p>
                    <h2 className="section-heading" style={{ textAlign: "center", display: "block" }}>ඔබගේ <span>Batch</span> එකට සම්බන්ධ වන්න</h2>
                    <p className="prose mx-auto" style={{ textAlign: "center" }}>
                        පන්ති වේලාවන්, නිබන්ධන සහ නවතම තොරතුරු ඉක්මනින් ලබාගැනීමට ඔබගේ වසරට අදාළ WhatsApp සමූහයට දැන්ම සම්බන්ධ වන්න.
                    </p>
                </div>

                <div className="batch-grid">
                    {batches.map((b, index) => (
                        <div key={index} className="batch-card" data-aos="fade-up" data-aos-delay={index * 100}>
                            <div className="b-icon-wrap">
                                <i className={`fa-solid ${b.icon}`}></i>
                            </div>
                            <h3>{b.year} A/L</h3>
                            <span className="b-type">{b.type}</span>
                            <p className="sinhala-body b-desc">{b.desc}</p>
                            
                            <a href={b.link} target="_blank" rel="noopener noreferrer" className="b-join-btn">
                                <i className="fa-brands fa-whatsapp"></i> Join WhatsApp
                            </a>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default BatchLinks;
