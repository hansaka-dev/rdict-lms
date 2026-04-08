import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import './Reviews.css';

const Reviews = () => {
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchReviews = async () => {
            try {
                // Firebase Firestore REST API URL
                const projectId = "lunch-6ca9f";
                const collectionName = "reviews";
                // We use structured query to get ordered results by timestamp desc
                const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents:runQuery`;

                const queryBody = {
                    structuredQuery: {
                        from: [{ collectionId: collectionName }],
                        orderBy: [{ field: { fieldPath: "timestamp" }, direction: "DESCENDING" }],
                        limit: 30
                    }
                };

                const response = await fetch(url, {
                    method: 'POST',
                    body: JSON.stringify(queryBody)
                });

                const data = await response.json();

                if (data && Array.isArray(data)) {
                    // Firestore REST API returns an array of objects with 'document' field
                    const formattedReviews = data
                        .filter(item => item.document) // Filter out empty results
                        .map(item => {
                            const fields = item.document.fields;
                            return {
                                name: fields.name?.stringValue || "Anonymous",
                                batch: fields.batch?.stringValue || "RDICT Student",
                                text: fields.text?.stringValue || fields.comment?.stringValue || "",
                                stars: parseInt(fields.rating?.integerValue || "5"),
                                initials: (fields.name?.stringValue || "A").charAt(0).toUpperCase()
                            };
                        })
                        .filter(rev => rev.text !== ""); // Only show reviews with text

                    setReviews(formattedReviews);
                }
            } catch (error) {
                console.error("Error fetching reviews from Firebase:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchReviews();
    }, []);

    // To create infinite marquee, we duplicate the array (if we have enough items)
    const displayReviews = reviews.length > 0 ? [...reviews, ...reviews] : [];

    return (
        <section id="reviews" className="section-reviews">
            <div className="container">
                <div className="reviews-head">
                    <p className="eyebrow mx-auto text-center" style={{ display: 'block', textAlign: 'center' }}>
                        <span>Student Voices</span> Reviews
                    </p>
                    <h2 className="section-heading" style={{ textAlign: 'center', display: 'block' }}>
                        Student <span>Testimonials</span>
                    </h2>
                    <p className="prose mx-auto" style={{ textAlign: 'center' }}>
                        See what our previous and current A/L students have to say about the RDICT experience.
                    </p>
                </div>

                <div className="reviews-marquee">
                    <div className="reviews-track">
                        {loading ? (
                            <p style={{ textAlign: 'center', width: '100vw', color: '#a09eb5' }}>Loading comments...</p>
                        ) : displayReviews.length > 0 ? (
                            displayReviews.map((review, index) => (
                                <div key={index} className="review-card glass-card">
                                    <div className="review-stars">
                                        {[...Array(review.stars)].map((_, i) => (
                                            <i key={i} className="fa-solid fa-star"></i>
                                        ))}
                                    </div>
                                    <p className="review-text">"{review.text}"</p>
                                    <div className="review-author">
                                        <div className="author-avatar">{review.initials}</div>
                                        <div className="author-info">
                                            <strong>{review.name}</strong>
                                            <span>{review.batch}</span>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div style={{ textAlign: 'center', width: '100vw', color: '#a09eb5', padding: '2rem 0' }}>
                                No comments yet. Be the first to share your experience!
                            </div>
                        )}
                    </div>
                </div>

                <div className="reviews-actions">
                    <Link to="/comments" className="btn-primary magnetic">
                        <i className="fa-solid fa-pen-to-square"></i> Add Your Comment
                    </Link>
                    <Link to="/comments" className="btn-secondary magnetic">
                        <i className="fa-solid fa-list-ul"></i> View All
                    </Link>
                </div>
            </div>
        </section>
    );
};

export default Reviews;
