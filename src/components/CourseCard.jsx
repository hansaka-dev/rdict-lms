import React from 'react';
import './CourseCard.css';

const CourseCard = ({ title, category, price, image }) => {
  return (
    <div className="course-card glass">
      <div className="course-image" style={{ backgroundImage: `url(${image})` }}>
        <span className="category">{category}</span>
      </div>
      <div className="course-info">
        <h3>{title}</h3>
        <div className="course-footer">
          <span className="price">{price}</span>
          <button className="btn-enroll">Enroll Now</button>
        </div>
      </div>
    </div>
  );
};

export default CourseCard;
