import React from 'react';
import lmsImage from '../assets/Images/ss.jpg';
import './LMSPromo.css';

const LMSPromo = () => {
    return (
        <section className="lms-promo-section">
            <div className="container">
                <div className="lms-glass-box" data-aos="zoom-in">
                    
                    <div className="lms-glow-orb"></div>

                    <div className="lms-content">
                        <div className="lms-text">
                            <span className="eyebrow lms-eyebrow">Smart Learning</span>
                            <h2>RDICT <span>Student Portal</span> හඳුන්වාදීම</h2>
                            <p className="prose">
                                මඟහැරුණු පන්ති වල වීඩියෝ බලන්න, PDF Tutes Download කරගන්න සහ Online Exams ලියන්න දැන්ම RDICT Learning Management System එකට පිවිසෙන්න.
                            </p>
                            
                            <div className="lms-features">
                                <div className="lms-feature-item">
                                    <i className="fa-solid fa-video"></i>
                                    <span>Class Recordings</span>
                                </div>
                                <div className="lms-feature-item">
                                    <i className="fa-solid fa-file-pdf"></i>
                                    <span>Tutes Library</span>
                                </div>
                                <div className="lms-feature-item">
                                    <i className="fa-solid fa-list-check"></i>
                                    <span>Online Exams</span>
                                </div>
                            </div>

                            <button className="btn-primary lms-login-btn" onClick={() => alert("LMS යාවත්කාලීන වෙමින් පවතී!")}>
                                <i className="fa-solid fa-right-to-bracket"></i> Login to Portal
                            </button>
                        </div>

                        <div className="lms-visual">
                            <div className="lms-image-wrapper mac-window">
                                <div className="mac-header">
                                    <span className="mac-btn close"></span>
                                    <span className="mac-btn minimize"></span>
                                    <span className="mac-btn expand"></span>
                                </div>
                                {/* Place your LMS screenshot here */}
                                <img src={lmsImage} alt="LMS Dashboard Preview" className="lms-screenshot" />
                                
                                {/* Decorative elements around the image */}
                                <div className="lms-img-deco deco-1"></div>
                                <div className="lms-img-deco deco-2"></div>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </section>
    );
};

export default LMSPromo;
