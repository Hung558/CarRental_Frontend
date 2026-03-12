import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { carService, bookingService, feedbackService } from '../services/dataService';
import { useAuth } from '../context/AuthContext';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import '../styles/CarDetailPage.css';

const CarDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [car, setCar] = useState(null);
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState({ startDate: null, endDate: null, bookingType: 'DAY' });
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

    if (booking.endDate <= booking.startDate) {
      setBookingError('Ngày kết thúc phải sau ngày bắt đầu');
      return;
    }

    try {
      await bookingService.createBooking({
        carId: parseInt(id),
        startDate: booking.startDate.toISOString(),
        endDate: booking.endDate.toISOString(),
        bookingType: booking.bookingType,
      });
      setBookingSuccess('Đặt xe thành công! Vui lòng thanh toán trong 30 phút.');
      setBooking({ startDate: null, endDate: null, bookingType: 'DAY' });
    } catch (err) {
      setBookingError(err.response?.data?.message || 'Đặt xe thất bại');
    }
  };

  const calculateTotalPrice = () => {
    if (!booking.startDate || !booking.endDate || !car) return null;
    const start = booking.startDate;
    const end = booking.endDate;
    if (end <= start) return null;

    const diffMs = end - start;
    const diffHours = diffMs / (1000 * 60 * 60);
    const diffDays = diffHours / 24;
    const diffMonths = diffDays / 30;

    let total = 0;
    if (booking.bookingType === 'HOUR') total = diffHours * (car.priceHour || 0);
    else if (booking.bookingType === 'DAY') total = diffDays * (car.priceDay || 0);
    else if (booking.bookingType === 'MONTH') total = diffMonths * (car.priceMonth || 0);

    return Math.round(total);
  };

  const totalPrice = calculateTotalPrice();

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
          {car.imageUrls?.length > 0 && (
            <div className="image-thumbnails">
              {car.imageUrls.map((url, i) => (
                <img key={i} src={url} alt={`${car.name} ${i + 1}`} />
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

          {/* Booking Card */}
          <div className="booking-section">
            <h3>✨ Đặt xe ngay</h3>
            <div className="booking-type-tabs">
              <button 
                type="button"
                className={`type-tab ${booking.bookingType === 'HOUR' ? 'active' : ''}`}
                onClick={() => setBooking({...booking, bookingType: 'HOUR'})}
              >
                🕒 Theo giờ
              </button>
              <button 
                type="button"
                className={`type-tab ${booking.bookingType === 'DAY' ? 'active' : ''}`}
                onClick={() => setBooking({...booking, bookingType: 'DAY'})}
              >
                ☀️ Theo ngày
              </button>
              <button 
                type="button"
                className={`type-tab ${booking.bookingType === 'MONTH' ? 'active' : ''}`}
                onClick={() => setBooking({...booking, bookingType: 'MONTH'})}
              >
                📅 Theo tháng
              </button>
            </div>

            {bookingError && <div className="alert-error" style={{marginBottom: '15px'}}>{bookingError}</div>}
            {bookingSuccess && <div className="alert-success" style={{marginBottom: '15px'}}>{bookingSuccess}</div>}

            <form onSubmit={handleBooking} className="booking-form">
              <div className="date-inputs">
                <div className="form-group">
                  <label>Ngày bắt đầu</label>
                  <DatePicker 
                    selected={booking.startDate}
                    onChange={(date) => setBooking({...booking, startDate: date})}
                    showTimeSelect
                    dateFormat="dd/MM/yyyy HH:mm"
                    placeholderText="Chọn ngày bắt đầu"
                    className="datepicker-input"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Ngày kết thúc</label>
                  <DatePicker 
                    selected={booking.endDate}
                    onChange={(date) => setBooking({...booking, endDate: date})}
                    showTimeSelect
                    dateFormat="dd/MM/yyyy HH:mm"
                    minDate={booking.startDate}
                    placeholderText="Chọn ngày kết thúc"
                    className="datepicker-input"
                    required
                  />
                </div>
              </div>

              {totalPrice > 0 && (
                <div className="booking-total-estimate">
                  <div className="estimate-row">
                    <span className="estimate-label">Đơn giá</span>
                    <span className="estimate-value">
                      {booking.bookingType === 'HOUR' ? Number(car.priceHour).toLocaleString('vi-VN') : 
                       booking.bookingType === 'DAY' ? Number(car.priceDay).toLocaleString('vi-VN') : 
                       Number(car.priceMonth).toLocaleString('vi-VN')}đ / {
                         booking.bookingType === 'HOUR' ? 'giờ' : 
                         booking.bookingType === 'DAY' ? 'ngày' : 'tháng'
                       }
                    </span>
                  </div>
                  <div className="estimate-row total-row">
                    <span className="total-label">Tổng cộng tạm tính</span>
                    <span className="total-value">{totalPrice.toLocaleString('vi-VN')}đ</span>
                  </div>
                </div>
              )}

              <button type="submit" className="btn-book">
                <span>{isAuthenticated() ? 'Xác nhận đặt xe' : 'Đăng nhập để đặt xe'}</span>
                {isAuthenticated() && <span style={{fontSize: '20px'}}>→</span>}
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
