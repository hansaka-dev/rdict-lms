import React from 'react';
import './Gallery.css';

// Import images for production build stability
import img1 from '../assets/Images/Gallery/2150888241.jpg';
import img2 from '../assets/Images/Gallery/2149940874.jpg';
import img3 from '../assets/Images/Gallery/2151043793.jpg';
import img4 from '../assets/Images/Gallery/2151098172.jpg';
import img5 from '../assets/Images/Gallery/WhatsApp Image 2026-02-03 at 6.11.55 PM.jpeg';

const Gallery = () => {
    const galleryImages = [
        {
            src: img1,
            title: 'Modern Infrastructure',
            desc: 'State-of-the-art tech classrooms'
        },
        {
            src: img2,
            title: 'Dedicated Community',
            desc: 'Students fully engaged in ICT logic'
        },
        {
            src: img3,
            title: 'Interactive Theory',
            desc: 'Deep and clear explanations'
        },
        {
            src: img4,
            title: '100% Practical',
            desc: 'Hands-on coding experience'
        },
        {
            src: img5,
            title: 'Award Ceremony',
            desc: 'Celebrating outstanding student results'
        }
    ];

    return (
        <section id="gallery" className="section-gallery">
            <div className="container">
                <div className="gallery-head">
                    <p className="eyebrow"><span>Environment</span> Our Classes</p>
                    <h2 className="section-heading">Classroom <span>Gallery</span></h2>
                    <p className="prose">Explore the modern infrastructure, smart classrooms, and the vibrant student community at RDICT.</p>
                </div>
                <div className="flex-gallery-container">
                    {galleryImages.map((img, index) => (
                        <div key={index} className="flex-card">
                            <img src={img.src} alt={img.title} loading="lazy" />
                            <div className="flex-card-content">
                                <div className="flex-card-title">{img.title}</div>
                                <div className="flex-card-desc">{img.desc}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default Gallery;
