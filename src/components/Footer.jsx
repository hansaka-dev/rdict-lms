import React from 'react';
import './Footer.css';
import { contactConfig, socialConfig } from '../config';

const Footer = () => {
  return (
    <footer className="site-footer">
      {/* Dynamic Font Injection for Signature */}
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Great+Vibes&display=swap');
        `}
      </style>

      {/* Massive Glowing Orb for Premium Feel */}
      <div className="footer-glow-top"></div>
      <div className="footer-glow-bottom"></div>

      <div className="container">
        
        <div className="footer-grid">
          <div className="footer-brand">
            <a href="#home" className="logo">
              RDICT<span>.</span>
            </a>
            <p className="footer-tagline">
              Modern ICT education for Grade 12 & 13 students. Theory, practicals, and past papers — all in one place.
            </p>
            <div className="footer-social">
                <a href={socialConfig.facebook} className="social-btn"><i className="fa-brands fa-facebook-f"></i></a>
                <a href={socialConfig.whatsapp} className="social-btn"><i className="fa-brands fa-whatsapp"></i></a>
                <a href={socialConfig.youtube} className="social-btn"><i className="fa-brands fa-youtube"></i></a>
                <a href={socialConfig.tiktok} className="social-btn"><i className="fa-brands fa-tiktok"></i></a>
            </div>
          </div>
          
          <div className="footer-links-group">
            <h4 className="footer-nav-title">Explore</h4>
            <ul className="footer-nav-list">
              <li><a href="#home">Home</a></li>
              <li><button onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})} style={{background:'none', border:'none', cursor:'pointer', color:'inherit', fontSize:'inherit', padding:0}}>Top of Page</button></li>
              <li><a href="#teacher">About Teacher</a></li>
              <li><a href="#reviews">Testimonials</a></li>
              <li><a href="#gallery">Classroom Gallery</a></li>
            </ul>
          </div>

          <div className="footer-links-group">
            <h4 className="footer-nav-title">Student Portal</h4>
            <ul className="footer-nav-list">
              <li><a href="#login" onClick={(e) => { e.preventDefault(); alert("LMS Portal is loading...");}}>LMS Login</a></li>
              <li><a href="#batch-links">Join WhatsApp</a></li>
              <li><a href="#free-courses">Free Tutes</a></li>
              <li><a href="#timetable">Time Table</a></li>
            </ul>
          </div>

          <div className="footer-contact">
            <h4 className="footer-nav-title">Get in Touch</h4>
            <ul className="contact-list">
                <li>
                    <i className="fa-solid fa-phone"></i>
                    <div>
                        <strong>Hotline</strong>
                        <span>{contactConfig.hotline}</span>
                    </div>
                </li>
                <li>
                    <i className="fa-solid fa-envelope"></i>
                    <div>
                        <strong>Email Support</strong>
                        <span>{contactConfig.email}</span>
                    </div>
                </li>
            </ul>
          </div>
        </div>
        
        <div className="footer-bottom">
          <div className="footer-copyright">
              &copy; {new Date().getFullYear()} RDICT &middot; Ranishan Dissanayake. All Rights Reserved.
          </div>
          
          <div className="footer-signature-wrap">
              <span className="developed-text">Architected & Developed with <i className="fa-solid fa-heart" style={{color: '#ff5f56', margin: '0 4px', fontSize: '12px'}}></i> by</span>
              <span className="dev-signature">Hansaka Fernando</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
