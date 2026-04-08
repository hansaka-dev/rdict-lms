import React from 'react';
import './WallOfFame.css';
import klImage from '../assets/Images/Results/kl.jpg';

const WallOfFame = () => {
    // Array of top students (Mock data for now)
    const topStudents = [
        { id: 1, name: 'Saman Kumara', school: 'Royal College', zscore: '3.1254', rank: 'Island 1st', image: klImage },
        { id: 2, name: 'Kamal Perera', school: 'Ananda College', zscore: '2.9845', rank: 'District 1st', image: klImage },
        { id: 3, name: 'Nimali Silva', school: 'Visakha Vidyalaya', zscore: '2.8450', rank: 'District 3rd', image: klImage },
        { id: 4, name: 'Kasun Rathnayake', school: 'Maliyadeva College', zscore: '2.7741', rank: 'District 5th', image: klImage },
        { id: 5, name: 'Amali Perera', school: 'Mahamaya Girls', zscore: '2.6800', rank: 'District 8th', image: klImage },
        { id: 6, name: 'Lahiru Kumara', school: 'Richmond College', zscore: '2.6500', rank: 'District 10th', image: klImage }
    ];

    return (
        <section className="wall-section">
            <div className="container">
                <div className="wall-header" data-aos="fade-up">
                    <p className="eyebrow"><span>Top Performers</span> 2024</p>
                    <h2 className="section-heading">විශිෂ්ටයින්ගේ <span>සමරුව</span></h2>
                    <p className="prose mx-auto">
                        ඉහළම ප්‍රතිඵල වාර්තා කළ RDICT හි විශිෂ්ඨතම දුවා දරුවන්.
                    </p>
                </div>
            </div>

            <div className="wall-slider-container">
                <div className="wall-track">
                    {/* Duplicate array for endless scrolling effect */}
                    {[...topStudents, ...topStudents].map((student, idx) => (
                        <div key={idx} className="wall-card">
                            <div className="wall-badge">{student.rank}</div>
                            <img src={student.image} alt={student.name} className="wall-img" />
                            <h3 className="wall-name">{student.name}</h3>
                            <p className="wall-school">{student.school}</p>
                            <div className="wall-zscore">
                                <span>Z-Score:</span>
                                <strong>{student.zscore}</strong>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default WallOfFame;
