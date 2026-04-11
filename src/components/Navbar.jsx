import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import './Navbar.css';

const Navbar = () => {
    const navigate = useNavigate();
    const [isScrolled, setIsScrolled] = useState(false);
    const [activeSection, setActiveSection] = useState('home');
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    // Auth context
    const [user, setUser] = useState(null);
    const [role, setRole] = useState('student');

    useEffect(() => {
        const fetchUser = async () => {
            const { data } = await supabase.auth.getSession();
            if (data?.session?.user) {
                setUser(data.session.user);
                setRole(data.session.user.user_metadata?.role || 'student');
            }
        };
        fetchUser();
    }, []);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 40);
        };

        // Active section detection using IntersectionObserver
        const sections = ['home', 'recent-post', 'free-courses', 'teacher', 'reviews', 'gallery', 'batch-links'];
        const observerOptions = {
            root: null,
            rootMargin: '-30% 0px -60% 0px',
            threshold: 0
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    setActiveSection(entry.target.id);
                }
            });
        }, observerOptions);

        sections.forEach(id => {
            const el = document.getElementById(id);
            if (el) observer.observe(el);
        });

        window.addEventListener('scroll', handleScroll);
        return () => {
            window.removeEventListener('scroll', handleScroll);
            observer.disconnect();
        };
    }, []);

    const handleSmoothScroll = (e, targetId) => {
        e.preventDefault();
        setMobileMenuOpen(false); // Close mobile menu on click
        
        if (targetId === 'login') {
            if (user) {
                navigate(role === 'admin' ? '/admin' : '/dashboard');
            } else {
                navigate('/login');
            }
            setMobileMenuOpen(false);
            return;
        }

        const element = document.getElementById(targetId);
        if (element) {
            const y = element.getBoundingClientRect().top + window.scrollY - 80;
            window.scrollTo({ top: y, behavior: 'smooth' });
        }
    };

    const navLinksList = [
        { name: 'Home', href: '#home', id: 'home' },
        { name: 'Time Table', href: '#recent-post', id: 'recent-post' },
        { name: 'Classes', href: '#batch-links', id: 'batch-links' },
        { name: 'Teacher', href: '#teacher', id: 'teacher' },
        { name: 'Comments', href: '#reviews', id: 'reviews' },
        { name: 'Gallery', href: '#gallery', id: 'gallery' },
    ];

    return (
        <nav className={`navbar ${isScrolled ? 'nav--scrolled' : ''}`}>
            <div className="nav-container">
                <a href="#home" className="logo" onClick={(e) => handleSmoothScroll(e, 'home')}>
                    RDICT<span>.</span>
                </a>
                
                <ul className={`nav-links ${mobileMenuOpen ? 'open' : ''}`}>
                    {navLinksList.map((link) => (
                        <li key={link.id}>
                            <a 
                                href={link.href} 
                                className={activeSection === link.id ? 'active' : ''}
                                onClick={(e) => handleSmoothScroll(e, link.id)}
                            >
                                {link.name}
                            </a>
                        </li>
                    ))}
                    
                    {/* Mobile Only Login Button inside menu */}
                    <div className="nav-cta-mobile">
                        <button className="btn-primary" onClick={(e) => handleSmoothScroll(e, 'login')}>
                            {user ? 'Go to Dashboard' : 'Login'}
                        </button>
                    </div>
                </ul>

                <div className="nav-right">
                    <div className="nav-cta">
                        {user ? (
                            <div 
                                style={{ 
                                    width: '40px', height: '40px', borderRadius: '50%',
                                    border: '2px solid #a855f7', padding: '2px', transition: '0.3s',
                                    background: user.user_metadata?.avatar_url ? `url(${user.user_metadata.avatar_url}) center/cover` : 'linear-gradient(135deg, #a855f7, #6366f1)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700
                                }}
                            >
                                {!user.user_metadata?.avatar_url && (user.user_metadata?.full_name ? user.user_metadata.full_name.charAt(0).toUpperCase() : 'S')}
                            </div>
                        ) : (
                            <button className="btn-primary" onClick={(e) => handleSmoothScroll(e, 'login')}>Login</button>
                        )}
                    </div>
                    
                    {/* Hamburger Icon */}
                    <button 
                        className={`hamburger ${mobileMenuOpen ? 'active' : ''}`} 
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        aria-label="Toggle menu"
                    >
                        <span></span>
                        <span></span>
                        <span></span>
                    </button>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
