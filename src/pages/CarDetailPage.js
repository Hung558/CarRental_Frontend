import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { carService, bookingService, feedbackService } from '../services/dataService';
import { useAuth } from '../context/AuthContext';
import '../styles/CarDetailPage.css';

const CarDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [car, setCar] = useState(null);
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState({ startDate: '', endDate: '', bookingType: 'DAY' });
  const [bookingError, setBookingError] = useState('');
  const [bookingSuccess, setBookingSuccess] = useState('');

  useEffect(() => {
    loadCarDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const loadCarDetails = async () => {
    try {
      setLoading(true);
      const [carRes, feedbackRes] = await Promise.all([
        carService.getCarById(id),
        feedbackService.getFeedbacksByCarId(id),
      ]);
      setCar(carRes.data);
      setFeedbacks(feedbackRes.data);
    } catch (error) {
      console.error('Error loading car details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBooking = async (e) => {
    e.preventDefault();
    setBookingError('');
    setBookingSuccess('');

    if (!isAuthenticated()) {
      navigate('/login');
      return;
    }

    if (!booking.startDate || !booking.endDate) {
      setBookingError('Vui lòng chọn ngày bắt đầu và kết thúc');
      return;
    }

    if (new Date(booking.endDate) <= new Date(booking.startDate)) {
      setBookingError('Ngày kết thúc phải sau ngày bắt đầu');
      return;
    }

    try {
      await bookingService.createBooking({
        carId: parseInt(id),
        startDate: booking.startDate,
        endDate: booking.endDate,
        bookingType: booking.bookingType,
      });
      setBookingSuccess('Đặt xe thành công! Vui lòng thanh toán trong 30 phút.');
      setBooking({ startDate: '', endDate: '', bookingType: 'DAY' });
    } catch (err) {
      setBookingError(err.response?.data?.message || 'Đặt xe thất bại');
    }
  };

  if (loading) return <div className="loading-spinner"><div className="spinner"></div></div>;
  if (!car) return <div className="error-state">Không tìm thấy xe</div>;

  return (
    <div className="car-detail-page">
      <div className="car-detail-grid">
        {/* Left: Images */}
        <div className="car-images-section">
          <div className="main-image">
            <img
              src={car.imageUrls?.[0] || 'https://via.placeholder.com/800x500?text=No+Image'}
              alt={car.name}
            />
          </div>
          {car.imageUrls?.length > 1 && (
            <div className="image-thumbnails">
              {car.imageUrls.slice(1).map((url, i) => (
                <img key={i} src={url} alt={`${car.name} ${i + 2}`} />
              ))}
            </div>
          )}
        </div>

        {/* Right: Details */}
        <div className="car-info-section">
          <div className="car-detail-header">
            <h1>{car.name}</h1>
            <span className="detail-badge">{car.status}</span>
          </div>

          <div className="car-meta">
            <span className="meta-item">🏷️ {car.brandName}</span>
            <span className="meta-item">📂 {car.categoryName}</span>
            <span className="meta-item">📍 {car.locationCity}, {car.locationDistrict}</span>
            <span className="meta-item">📅 {car.year}</span>
            <span className="meta-item">🎨 {car.color}</span>
            <span className="meta-item">🔖 {car.licensePlate}</span>
          </div>

          <div className="car-description">
            <h3>Mô tả</h3>
            <p>{car.description || 'Chưa có mô tả'}</p>
          </div>

          <div className="car-pricing">
            <h3>Bảng giá</h3>
            <div className="price-grid">
              {car.priceHour && <div className="price-item"><span className="price-label">Theo giờ</span><span className="price-val">{Number(car.priceHour).toLocaleString('vi-VN')}đ</span></div>}
              {car.priceDay && <div className="price-item"><span className="price-label">Theo ngày</span><span className="price-val">{Number(car.priceDay).toLocaleString('vi-VN')}đ</span></div>}
              {car.priceMonth && <div className="price-item"><span className="price-label">Theo tháng</span><span className="price-val">{Number(car.priceMonth).toLocaleString('vi-VN')}đ</span></div>}
            </div>
          </div>

          {/* Booking Form */}
          <div className="booking-section">
            <h3>🚗 Đặt xe ngay</h3>
            {bookingError && <div className="alert-error">{bookingError}</div>}
            {bookingSuccess && <div className="alert-success">{bookingSuccess}</div>}
            <form onSubmit={handleBooking} className="booking-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Loại thuê</label>
                  <select value={booking.bookingType} onChange={(e) => setBooking({...booking, bookingType: e.target.value})}>
                    <option value="HOUR">Theo giờ</option>
                    <option value="DAY">Theo ngày</option>
                    <option value="MONTH">Theo tháng</option>
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Ngày bắt đầu</label>
                  <input type="datetime-local" value={booking.startDate} onChange={(e) => setBooking({...booking, startDate: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label>Ngày kết thúc</label>
                  <input type="datetime-local" value={booking.endDate} onChange={(e) => setBooking({...booking, endDate: e.target.value})} min={booking.startDate} required />
                </div>
              </div>
              <button type="submit" className="btn-book">
                {isAuthenticated() ? 'Đặt xe' : 'Đăng nhập để đặt xe'}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Feedbacks */}
      <section className="feedbacks-section">
        <h2>Đánh giá ({feedbacks.length})</h2>
        <div className="car-rating-summary">
          {'★'.repeat(Math.round(car.averageRating || 0))}
          {'☆'.repeat(5 - Math.round(car.averageRating || 0))}
          <span> ({car.averageRating?.toFixed(1) || '0.0'})</span>
        </div>
        {feedbacks.length > 0 ? (
          <div className="feedbacks-list">
            {feedbacks.map((fb) => (
              <div key={fb.feedbackId} className="feedback-card">
                <div className="feedback-header">
                  <span className="feedback-user">{fb.customerName}</span>
                  <span className="feedback-rating">{'★'.repeat(fb.rating)}{'☆'.repeat(5 - fb.rating)}</span>
                </div>
                <p className="feedback-comment">{fb.comment}</p>
                <span className="feedback-date">{new Date(fb.createdAt).toLocaleDateString('vi-VN')}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="no-feedback">Chưa có đánh giá nào</p>
        )}
      </section>
    </div>
  );
};

export default CarDetailPage;
