import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Cursor from '../components/Cursor';
import './Comments.css';

const Comments = () => {
    const [comments, setComments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [likedMemos, setLikedMemos] = useState(JSON.parse(localStorage.getItem("likedMemos") || "{}"));
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [scrolled, setScrolled] = useState(false);

    const [formData, setFormData] = useState({
        name: '', email: '', batch: '', institute: '', comment: ''
    });
    const [photo, setPhoto] = useState(null);

    const IMGBB_API_KEY = "a695c84da8aa81bf1c07de995a7a90ac";

    // Handle Navbar scroll effect
    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 50);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const fetchAllComments = async () => {
        try {
            const projectId = "lunch-6ca9f";
            const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents:runQuery`;
            const queryBody = {
                structuredQuery: {
                    from: [{ collectionId: "reviews" }],
                    orderBy: [{ field: { fieldPath: "timestamp" }, direction: "DESCENDING" }]
                }
            };
            const response = await fetch(url, { method: 'POST', body: JSON.stringify(queryBody) });
            const data = await response.json();
            if (data && Array.isArray(data)) {
                const formatted = data
                    .filter(item => item.document)
                    .map(item => {
                        const fields = item.document.fields;
                        return {
                            id: item.document.name.split('/').pop(),
                            name: fields.name?.stringValue || "Anonymous",
                            batch: fields.batch?.stringValue || "",
                            institute: fields.institute?.stringValue || "",
                            text: fields.text?.stringValue || fields.comment?.stringValue || "",
                            photoURL: fields.photoURL?.stringValue || null,
                            likes: parseInt(fields.likes?.integerValue || "0"),
                            timestamp: fields.timestamp?.timestampValue || null
                        };
                    })
                    .filter(c => c.text !== "");
                setComments(formatted);
            }
        } catch (error) { console.error(error); } finally { setLoading(false); }
    };

    useEffect(() => {
        fetchAllComments();
        const interval = setInterval(fetchAllComments, 10000);
        return () => clearInterval(interval);
    }, []);

    const handleLike = async (docId) => {
        if (likedMemos[docId]) return;
        const newLikes = { ...likedMemos, [docId]: true };
        setLikedMemos(newLikes);
        localStorage.setItem("likedMemos", JSON.stringify(newLikes));
        setComments(prev => prev.map(c => c.id === docId ? { ...c, likes: c.likes + 1 } : c));
        try {
            const projectId = "lunch-6ca9f";
            const currentItem = comments.find(c => c.id === docId);
            const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/reviews/${docId}?updateMask.fieldPaths=likes`;
            await fetch(url, { method: 'PATCH', body: JSON.stringify({ fields: { likes: { integerValue: (currentItem.likes + 1).toString() } } }) });
        } catch (e) { console.error(e); }
    };

    const handleInputChange = (e) => {
        const { id, value } = e.target;
        const key = id.replace('user-', '');
        setFormData(prev => ({ ...prev, [key]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            let photoURL = null;
            if (photo) {
                const imgFormData = new FormData();
                imgFormData.append("image", photo);
                const imgRes = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, { method: "POST", body: imgFormData });
                const imgData = await imgRes.json();
                if (imgData.success) photoURL = imgData.data.url;
            }
            const projectId = "lunch-6ca9f";
            const docId = formData.email.trim().toLowerCase().replace(/[^a-z0-9]/g, '_');
            const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/reviews/${docId}`;
            const docData = {
                fields: {
                    name: { stringValue: formData.name }, email: { stringValue: formData.email }, batch: { stringValue: formData.batch },
                    institute: { stringValue: formData.institute }, text: { stringValue: formData.comment }, photoURL: photoURL ? { stringValue: photoURL } : { nullValue: null },
                    likes: { integerValue: "0" }, timestamp: { timestampValue: new Date().toISOString() }
                }
            };
            const res = await fetch(url, { method: 'PATCH', body: JSON.stringify(docData) });
            if (res.ok) {
                setFormData({ name: '', email: '', batch: '', institute: '', comment: '' });
                setPhoto(null);
                setIsModalOpen(false);
                fetchAllComments();
                alert("අදහස් පළ කිරීම සාර්ථකයි!");
            }
        } catch (error) { alert("දෝෂයකි: " + error.message); } finally { setIsSubmitting(false); }
    };

    return (
        <div className="premium-comments-page">
            <Cursor />
            {/* Background Elements */}
            <div className="c-bg-glow"></div>
            <div className="c-bg-stars"></div>
            <div className="c-bg-mesh"></div>

            {/* Persistent Navbar */}
            <nav className={`c-nav ${scrolled ? 'c-nav-scrolled' : ''}`}>
                <div className="c-nav-container">
                    <Link to="/" className="c-logo">RDICT<span>.</span></Link>
                    <Link to="/" className="c-btn-back">
                        <i className="fa-solid fa-arrow-left"></i> <span>ආපසු</span>
                    </Link>
                </div>
            </nav>

            <main className="c-main-container">
                <header className="c-header">
                    <div className="c-header-badge">Student Voices</div>
                    <h1 className="sinhala-title">සිසු <span>අදහස්</span> එකතුව</h1>
                    <p className="sinhala-body">RDICT අධ්‍යාපනික අත්දැකීම ලබාගත් සිසුන්ගේ සැබෑ අදහස් මෙහිදී කියවන්න.</p>
                </header>

                {loading ? (
                    <div className="c-loader-wrapper"><div className="c-spinner"></div></div>
                ) : (
                    <div className="c-masonry-grid">
                        {comments.length === 0 && (
                            <div className="c-no-data sinhala-body">තවමත් අදහස් එකතු කර නොමැත.</div>
                        )}
                        {comments.map((c) => (
                            <div key={c.id} className="c-card">
                                <i className="fa-solid fa-quote-right c-quote-icon"></i>
                                
                                <div className="c-card-top">
                                    <div className="c-avatar-wrap">
                                        {c.photoURL ? (
                                            <img src={c.photoURL} alt={c.name} />
                                        ) : (
                                            <div className="c-avatar-fallback">{c.name.charAt(0).toUpperCase()}</div>
                                        )}
                                    </div>
                                    <div className="c-meta">
                                        <h3 className="c-name">{c.name}</h3>
                                        <div className="c-tags">
                                            <span className="c-tag green">{c.batch}</span>
                                            <span className="c-tag purple">{c.institute}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="c-card-body">
                                    <p className="sinhala-body">{c.text}</p>
                                </div>

                                <div className="c-card-footer">
                                    <span className="c-date">
                                        {c.timestamp ? new Date(c.timestamp).toLocaleDateString("en-US", { month: 'short', day: 'numeric', year: 'numeric' }) : ""}
                                    </span>
                                    <button 
                                        className={`c-like-btn ${likedMemos[c.id] ? 'active' : ''}`} 
                                        onClick={() => handleLike(c.id)}
                                    >
                                        <i className={`fa-${likedMemos[c.id] ? 'solid' : 'regular'} fa-heart`}></i>
                                        {c.likes}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>

            {/* Floating Action Button */}
            <button className="c-fab" onClick={() => setIsModalOpen(true)} title="අදහස පළ කරන්න">
                <i className="fa-solid fa-pen"></i>
                <span className="sinhala-body">අදහසක් එක් කරන්න</span>
            </button>

            {/* Ultimate Modal */}
            {isModalOpen && (
                <div className="c-modal-overlay" onClick={() => setIsModalOpen(false)}>
                    <div className="c-modal-box scale-up" onClick={e => e.stopPropagation()}>
                        <button className="c-modal-close" onClick={() => setIsModalOpen(false)}>
                            <i className="fa-solid fa-xmark"></i>
                        </button>
                        
                        <div className="c-modal-header">
                            <h2 className="sinhala-title">ඔබේ අදහස පළ කරන්න</h2>
                            <p className="sinhala-body">ඔබගේ වටිනා අදහස RDICT වෙනුවෙන් ලබා දෙන්න.</p>
                        </div>

                        <form onSubmit={handleSubmit} className="c-form">
                            <div className="c-form-group">
                                <label className="sinhala-body">නම (Name)</label>
                                <input type="text" id="user-name" placeholder="ඔබේ නම" required onChange={handleInputChange} value={formData.name} />
                            </div>
                            <div className="c-form-group">
                                <label className="sinhala-body">විද්‍යුත් තැපෑල (Email)</label>
                                <input type="email" id="user-email" placeholder="email@example.com" required onChange={handleInputChange} value={formData.email} />
                            </div>
                            
                            <div className="c-form-group c-file-group">
                                <label className="sinhala-body">ඡායාරූපය (Photo)</label>
                                <div className="c-file-upload">
                                    <input type="file" id="user-photo" onChange={e => setPhoto(e.target.files[0])} accept="image/*" />
                                    <div className="c-file-inner">
                                        <i className="fa-solid fa-cloud-arrow-up"></i>
                                        <span className="sinhala-body">{photo ? photo.name : 'Click to select photo (Optional)'}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="c-form-row">
                                <div className="c-form-group">
                                    <label className="sinhala-body">වසර (Batch)</label>
                                    <select id="user-batch" required onChange={handleInputChange} value={formData.batch}>
                                        <option value="" disabled>තෝරන්න</option>
                                        <option value="2024 A/L">2024 A/L</option>
                                        <option value="2025 A/L">2025 A/L</option>
                                        <option value="2026 A/L">2026 A/L</option>
                                        <option value="2027 A/L">2027 A/L</option>
                                        <option value="Previous">පැරණි ශිෂ්‍ය</option>
                                    </select>
                                </div>
                                <div className="c-form-group">
                                    <label className="sinhala-body">ආයතනය (Inst.)</label>
                                    <select id="user-institute" required onChange={handleInputChange} value={formData.institute}>
                                        <option value="" disabled>තෝරන්න</option>
                                        <option value="Online">Online</option>
                                        <option value="Science Center Kegalle">Science Center</option>
                                        <option value="Nenik Ratnapura">Nenik</option>
                                        <option value="Indeepa Gampaha">Indeepa</option>
                                    </select>
                                </div>
                            </div>
                            
                            <div className="c-form-group">
                                <label className="sinhala-body">අදහස (Comment)</label>
                                <textarea id="user-comment" placeholder="අදහස ලියන්න..." required onChange={handleInputChange} value={formData.comment}></textarea>
                            </div>

                            <button type="submit" className="c-btn-submit sinhala-title" disabled={isSubmitting}>
                                {isSubmitting ? (
                                    <><i className="fa-solid fa-circle-notch fa-spin"></i> සකසමින්...</>
                                ) : (
                                    <><i className="fa-solid fa-paper-plane"></i> පළ කරන්න</>
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Comments;
