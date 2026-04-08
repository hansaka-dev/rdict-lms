import React, { useState } from 'react';
import './FAQ.css';

const FAQ = () => {
    const [openIndex, setOpenIndex] = useState(0);

    const faqData = [
        {
            icon: "fa-graduation-cap",
            q: "Which grades does RDICT cover?",
            a: "RDICT classes are designed for Grade 12 and Grade 13 students preparing for the Sri Lankan Advanced Level (A/L) ICT examinations."
        },
        {
            icon: "fa-language",
            q: "Are classes in Sinhala or English?",
            a: "Classes are taught in a bilingual format — Sinhala and English — so every student can follow comfortably regardless of their medium."
        },
        {
            icon: "fa-book",
            q: "What does the RDICT booklet include?",
            a: "The RDICT booklet features 80+ pages of full syllabus notes, past paper Q&A, diagrams, exam tips and shortcuts — all in print-ready format."
        },
        {
            icon: "fa-user-plus",
            q: "How do I enroll?",
            a: "Contact us via the Enroll section or WhatsApp. You'll be added to the next batch and receive your RDICT booklet before the first class."
        },
        {
            icon: "fa-laptop",
            q: "Are online classes available?",
            a: "Currently classes are in-person for the best learning experience. Recorded resources and supplementary materials are shared via WhatsApp with enrolled students."
        },
        {
            icon: "fa-users",
            q: "Will parents be updated on progress?",
            a: "Absolutely. Parents are regularly updated on their child's progress, attendance, and exam readiness. Open communication is a key part of the RDICT approach."
        }
    ];

    const toggleFAQ = (index) => {
        setOpenIndex(openIndex === index ? -1 : index);
    };

    return (
        <section id="faq" className="section-faq">
            <div className="faq-bg" aria-hidden="true"></div>
            <div className="container">
                <div className="faq-layout">
                    {/* Left Panel */}
                    <div className="faq-left-panel">
                        <p className="eyebrow"><span>Support</span> FAQ</p>
                        <h2 className="section-heading">Got <span>Questions?</span></h2>
                        <p className="prose">Everything parents and students commonly ask before joining RDICT — answered clearly.</p>
                        <div className="faq-deco-q" aria-hidden="true">?</div>
                        <ul className="faq-feature-list">
                            <li><i className="fa-solid fa-circle-check"></i> Bilingual — Sinhala & English</li>
                            <li><i className="fa-solid fa-circle-check"></i> 100% Practical Python Coding</li>
                            <li><i className="fa-solid fa-circle-check"></i> 80+ Page Tutorial Booklet</li>
                            <li><i className="fa-solid fa-circle-check"></i> 4 Locations Island-wide</li>
                        </ul>
                        <a href="#enroll" className="btn-primary magnetic" style={{ marginTop: '0.5rem' }}>Enroll Now &rarr;</a>
                    </div>

                    {/* Right Panel: Accordion */}
                    <div className="faq-right-panel">
                        <div className="faq-list faq-premium">
                            {faqData.map((item, index) => (
                                <div 
                                    key={index} 
                                    className={`faq-item-premium ${openIndex === index ? 'is-open' : ''}`}
                                >
                                    <button 
                                        className="faq-trigger-premium" 
                                        onClick={() => toggleFAQ(index)}
                                        aria-expanded={openIndex === index}
                                    >
                                        <div className="faq-q-icon">
                                            <i className={`fa-solid ${item.icon}`}></i>
                                        </div>
                                        <span>{item.q}</span>
                                        <div className="faq-chevron">
                                            <i className="fa-solid fa-chevron-down"></i>
                                        </div>
                                    </button>
                                    <div className="faq-body-premium" style={{ 
                                        display: openIndex === index ? 'block' : 'none' 
                                    }}>
                                        <p>{item.a}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default FAQ;
