import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faStar } from '@fortawesome/free-solid-svg-icons';
import './CSS/Rating.css';

const Rating = ({ totalStars = 5, onRate }) => {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);

  const handleClick = (rate) => {
    setRating(rate);
    if (onRate) {
      onRate(rate);
    }
  };

  const handleMouseOver = (rate) => {
    setHoverRating(rate);
  };

  const handleMouseOut = () => {
    setHoverRating(0);
  };

  return (
    <div className="rating-container">
      {[...Array(totalStars)].map((star, index) => {
        const starValue = index + 1;
        return (
          <FontAwesomeIcon
            key={index}
            icon={faStar}
            className={starValue <= (hoverRating || rating) ? 'star filled' : 'star'}
            onClick={() => handleClick(starValue)}
            onMouseOver={() => handleMouseOver(starValue)}
            onMouseOut={handleMouseOut}
          />
        );
      })}
    </div>
  );
};

export default Rating;
