import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/CarCard.css';

const CarCard = ({ car }) => {
  const imageUrl = car.imageUrls && car.imageUrls.length > 0
    ? car.imageUrls[0]
    : 'https://via.placeholder.com/400x250?text=No+Image';

  return (
    <div className="car-card">
      <div className="car-card-image">
        <img src={imageUrl} alt={car.name} />
        <span className="car-status-badge" data-status={car.status}>
          {car.status}
        </span>
      </div>
      <div className="car-card-body">
        <div className="car-card-header">
          <h3 className="car-name">{car.name}</h3>
          <span className="car-brand">{car.brandName}</span>
        </div>
        <div className="car-info-row">
          <span className="car-info-item">
            <span className="info-icon">📍</span>
            {car.locationCity || 'N/A'}
          </span>
          <span className="car-info-item">
            <span className="info-icon">📅</span>
            {car.year || 'N/A'}
          </span>
          <span className="car-info-item">
            <span className="info-icon">🎨</span>
            {car.color || 'N/A'}
          </span>
        </div>
        <div className="car-rating">
          {'★'.repeat(Math.round(car.averageRating || 0))}
          {'☆'.repeat(5 - Math.round(car.averageRating || 0))}
          <span className="rating-count">({car.totalFeedbacks || 0})</span>
        </div>
        <div className="car-card-footer">
          <div className="car-price">
            {car.priceDay ? (
              <><span className="price-value">{Number(car.priceDay).toLocaleString('vi-VN')}đ</span><span className="price-unit">/ngày</span></>
            ) : (
              <span className="price-value">Liên hệ</span>
            )}
          </div>
          <Link to={`/cars/${car.carId}`} className="btn-detail">
            Chi tiết →
          </Link>
        </div>
      </div>
    </div>
  );
};

export default CarCard;
