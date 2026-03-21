import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { carService, bookingService, feedbackService } from '../services/dataService';
import { useAuth } from '../context/AuthContext';
import { toLocalISOString, getAbsoluteInterval } from '../utils/dateUtils';
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
  const [booking, setBooking] = useState({ 
    startDate: null, 
    endDate: null, 
    bookingType: 'DAY',
    // Specifically for Hourly:
    selectedDate: null, 
    startTime: '08:00',
    endTime: '18:00',
    // Specifically for Monthly:
    startMonth: null,
    endMonth: null
  });
  const [bookingError, setBookingError] = useState('');
  const [bookingSuccess, setBookingSuccess] = useState('');
  const [excludedIntervals, setExcludedIntervals] = useState([]);
  const [showSummary, setShowSummary] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadCarDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const loadCarDetails = async () => {
    try {
      setLoading(true);
      const [carRes, feedbackRes, schedulesRes, bookedRes] = await Promise.all([
        carService.getCarById(id),
        feedbackService.getFeedbacksByCarId(id),
        carService.getCarSchedules(id),
        carService.getCarBookedDates(id),
      ]);
      setCar(carRes.data);
      setFeedbacks(feedbackRes.data);

      // Build excluded date intervals from schedules (UNAVAILABLE) + existing bookings
      const intervals = [];
      const parseDate = (str) => {
        if (!str) return null;
        // Handle both ISO and simple date formats
        const d = new Date(str);
        if (!isNaN(d.getTime())) return d;
        return null;
      };

      if (schedulesRes.data) {
        schedulesRes.data
          .filter(s => s.status === 'UNAVAILABLE')
          .forEach(s => {
            const start = parseDate(s.startDate);
            const end = parseDate(s.endDate);
            if (start && end) intervals.push({ start, end });
          });
      }
      if (bookedRes.data) {
        bookedRes.data.forEach(b => {
          const start = parseDate(b.startDate);
          const end = parseDate(b.endDate);
          if (start && end) intervals.push({ start, end });
        });
      }
      setExcludedIntervals(intervals);
    } catch (error) {
      console.error('Error loading car details:', error);
    } finally {
      setLoading(false);
    }
  };

  // Step 7 (UC09): User clicks "Xác nhận đặt xe" -> show summary modal
  const handleShowSummary = (e) => {
    e.preventDefault();
    setBookingError('');
    setBookingSuccess('');

    if (!isAuthenticated()) {
      navigate('/login');
      return;
    }

    const interval = getAbsoluteInterval(booking);
    if (!interval) {
      setBookingError('Vui lòng chọn đầy đủ thời gian thuê');
      return;
    }

    const { start, end } = interval;
    if (end <= start) {
      setBookingError('Thời gian kết thúc phải sau thời gian bắt đầu');
      return;
    }

    const isOverlapping = excludedIntervals.some(inv => {
      return (start < inv.end && end > inv.start);
    });

    if (isOverlapping) {
      setBookingError('Khoảng thời gian bạn chọn trùng với lịch đã có người đặt hoặc xe bận.');
      return;
    }

    setShowSummary(true);
  };

  // Step 8-9 (UC09): User confirms in summary modal -> create booking -> redirect to payment
  const handleConfirmBooking = async () => {
    setSubmitting(true);
    setBookingError('');

    const interval = getAbsoluteInterval(booking);
    if (!interval) return;

    try {
      await bookingService.createBooking({
        carId: parseInt(id),
        startDate: toLocalISOString(interval.start),
        endDate: toLocalISOString(interval.end),
        bookingType: booking.bookingType,
      });
      setShowSummary(false);
      // Step 9: Redirect customer to payment process (Customer Dashboard)
      navigate('/customer/dashboard', { state: { message: 'Đặt xe thành công! Vui lòng thanh toán để hoàn tất đơn hàng.' } });
    } catch (err) {
      setShowSummary(false);
      setBookingError(err.response?.data?.message || 'Đặt xe thất bại');
    } finally {
      setSubmitting(false);
    }
  };

  // Alt Step 7 (UC09): Customer cancels -> discard booking summary, return to car detail
  const handleCancelSummary = () => {
    setShowSummary(false);
  };

  const calculateTotalPrice = () => {
    const interval = getAbsoluteInterval(booking);
    if (!interval || !car) return null;
    const { start, end } = interval;
    if (end <= start) return null;

    const diffMs = end - start;
    const diffHours = diffMs / (1000 * 60 * 60);
    const diffDays = Math.ceil(diffHours / 24);
    const diffMonths = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth()) + 1;

    let total = 0;
    if (booking.bookingType === 'HOUR') total = diffHours * (car.priceHour || 0);
    else if (booking.bookingType === 'DAY') total = diffDays * (car.priceDay || 0);
    else if (booking.bookingType === 'MONTH') total = diffMonths * (car.priceMonth || 0);

    return Math.round(total);
  };

  const getBookingTypeLabel = () => {
    if (booking.bookingType === 'HOUR') return 'Theo giờ';
    if (booking.bookingType === 'DAY') return 'Theo ngày';
    return 'Theo tháng';
  };

  const getUnitPrice = () => {
    if (booking.bookingType === 'HOUR') return car.priceHour;
    if (booking.bookingType === 'DAY') return car.priceDay;
    return car.priceMonth;
  };

  const totalPrice = calculateTotalPrice();
 
  const getFutureExcludedIntervals = () => {
    const now = new Date();
    return excludedIntervals
      .filter(interval => interval.end > now)
      .sort((a, b) => a.start - b.start);
  };

  const formatDateTime = (date) => {
    if (!date) return '';
    return date.toLocaleString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };
   
  const futureIntervals = getFutureExcludedIntervals();

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

          {/* Availability Schedule */}
          {futureIntervals.length > 0 && (
            <div className="car-availability-schedule">
              <h3>📅 Lịch bận của xe</h3>
              <div className="schedule-list">
                {futureIntervals.map((interval, index) => (
                  <div key={index} className="schedule-item">
                    <span className="schedule-time">
                      {formatDateTime(interval.start)} - {formatDateTime(interval.end)}
                    </span>
                    <span className="schedule-status-badge">Đã bận</span>
                  </div>
                ))}
              </div>
            </div>
          )}

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

            <form onSubmit={handleShowSummary} className="booking-form">
              <div className="dynamic-date-inputs">
                {/* 1. HOURLY UI */}
                {booking.bookingType === 'HOUR' && (
                  <div className="hourly-picker-container">
                    <div className="form-group">
                      <label>Chọn ngày thuê</label>
                      <DatePicker
                        selected={booking.selectedDate}
                        onChange={(date) => setBooking({ ...booking, selectedDate: date })}
                        dateFormat="dd/MM/yyyy"
                        minDate={new Date()}
                        placeholderText="Chọn ngày"
                        className="datepicker-input"
                        required
                      />
                    </div>
                    <div className="form-row" style={{ marginTop: '12px' }}>
                      <div className="form-group">
                        <label>Từ lúc</label>
                        <select 
                          value={booking.startTime} 
                          onChange={e => setBooking({ ...booking, startTime: e.target.value })}
                          className="datepicker-input"
                        >
                          {Array.from({ length: 24 }).map((_, h) => (
                            <React.Fragment key={h}>
                              <option value={`${h.toString().padStart(2, '0')}:00`}>{h.toString().padStart(2, '0')}:00</option>
                              <option value={`${h.toString().padStart(2, '0')}:30`}>{h.toString().padStart(2, '0')}:30</option>
                            </React.Fragment>
                          ))}
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Đến lúc</label>
                        <select 
                          value={booking.endTime} 
                          onChange={e => setBooking({ ...booking, endTime: e.target.value })}
                          className="datepicker-input"
                        >
                          {Array.from({ length: 24 }).map((_, h) => (
                            <React.Fragment key={h}>
                              <option value={`${h.toString().padStart(2, '0')}:00`}>{h.toString().padStart(2, '0')}:00</option>
                              <option value={`${h.toString().padStart(2, '0')}:30`}>{h.toString().padStart(2, '0')}:30</option>
                            </React.Fragment>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. DAILY UI */}
                {booking.bookingType === 'DAY' && (
                  <div className="daily-picker-container">
                    <div className="form-group">
                      <label>Chọn khoảng ngày (Từ ngày - Đến ngày)</label>
                      <DatePicker
                        selectsRange={true}
                        startDate={booking.startDate}
                        endDate={booking.endDate}
                        onChange={(update) => {
                          const [start, end] = update;
                          setBooking({ ...booking, startDate: start, endDate: end });
                        }}
                        minDate={new Date()}
                        dateFormat="dd/MM/yyyy"
                        placeholderText="Chọn khoảng ngày thuê"
                        className="datepicker-input"
                        required
                        isClearable={true}
                      />
                    </div>
                  </div>
                )}

                {/* 3. MONTHLY UI */}
                {booking.bookingType === 'MONTH' && (
                  <div className="monthly-picker-container">
                    <div className="form-row">
                      <div className="form-group">
                        <label>Từ tháng</label>
                        <DatePicker
                          selected={booking.startMonth}
                          onChange={(date) => setBooking({ ...booking, startMonth: date })}
                          dateFormat="MM/yyyy"
                          showMonthYearPicker
                          placeholderText="Từ tháng"
                          className="datepicker-input"
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label>Đến tháng</label>
                        <DatePicker
                          selected={booking.endMonth}
                          onChange={(date) => setBooking({ ...booking, endMonth: date })}
                          dateFormat="MM/yyyy"
                          showMonthYearPicker
                          minDate={booking.startMonth}
                          placeholderText="Đến tháng"
                          className="datepicker-input"
                          required
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {excludedIntervals.length > 0 && (
                <div style={{fontSize: '12px', color: '#ff6b6b', marginBottom: '10px'}}>
                  ⚠️ Các ngày tô đỏ/bị chặn là ngày xe không khả dụng hoặc đã có người đặt.
                </div>
              )}

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

              <button type="submit" className="btn-book" style={{cursor: 'pointer'}}>
                <span>{isAuthenticated() ? 'Xác nhận đặt xe' : 'Đăng nhập để đặt xe'}</span>
                {isAuthenticated() && <span style={{fontSize: '20px'}}>→</span>}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Booking Summary Modal (UC09 Step 6-7) */}
      {showSummary && (
        <div className="modal-overlay" onClick={handleCancelSummary}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{maxWidth: '500px'}}>
            <h3 style={{marginBottom: '20px', textAlign: 'center'}}>📋 Xác nhận đơn đặt xe</h3>
            
            <div style={{background: 'var(--bg-surface, #f8f9fa)', borderRadius: '12px', padding: '20px', marginBottom: '20px'}}>
              <div style={{display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px'}}>
                <img 
                  src={car.imageUrls?.[0] || 'https://via.placeholder.com/60x40?text=Car'} 
                  alt={car.name}
                  style={{width: '80px', height: '55px', objectFit: 'cover', borderRadius: '8px'}}
                />
                <div>
                  <div style={{fontWeight: 700, fontSize: '16px'}}>{car.name}</div>
                  <div style={{color: '#888', fontSize: '13px'}}>{car.brandName} • {car.licensePlate}</div>
                </div>
              </div>

              <div style={{display: 'grid', gap: '10px', fontSize: '14px'}}>
                <div style={{display: 'flex', justifyContent: 'space-between'}}>
                  <span style={{color: '#888'}}>Hình thức thuê</span>
                  <span style={{fontWeight: 600}}>{getBookingTypeLabel()}</span>
                </div>
                <div style={{display: 'flex', justifyContent: 'space-between'}}>
                  <span style={{color: '#888'}}>Ngày bắt đầu</span>
                  <span style={{fontWeight: 600}}>{getAbsoluteInterval(booking)?.start?.toLocaleString('vi-VN')}</span>
                </div>
                <div style={{display: 'flex', justifyContent: 'space-between'}}>
                  <span style={{color: '#888'}}>Ngày kết thúc</span>
                  <span style={{fontWeight: 600}}>{getAbsoluteInterval(booking)?.end?.toLocaleString('vi-VN')}</span>
                </div>
                <div style={{display: 'flex', justifyContent: 'space-between'}}>
                  <span style={{color: '#888'}}>Đơn giá</span>
                  <span style={{fontWeight: 600}}>{Number(getUnitPrice()).toLocaleString('vi-VN')}đ / {booking.bookingType === 'HOUR' ? 'giờ' : booking.bookingType === 'DAY' ? 'ngày' : 'tháng'}</span>
                </div>
                <hr style={{border: 'none', borderTop: '1px solid #e0e0e0', margin: '4px 0'}} />
                <div style={{display: 'flex', justifyContent: 'space-between'}}>
                  <span style={{fontWeight: 700, fontSize: '16px'}}>Tổng cộng</span>
                  <span style={{fontWeight: 700, fontSize: '18px', color: 'var(--primary, #4361ee)'}}>{totalPrice?.toLocaleString('vi-VN')}đ</span>
                </div>
              </div>
            </div>

            <p style={{fontSize: '13px', color: '#888', textAlign: 'center', marginBottom: '16px'}}>
              Sau khi xác nhận, bạn sẽ được chuyển đến trang thanh toán. Vui lòng thanh toán trong vòng 15 phút.
            </p>

            <div className="modal-actions" style={{display: 'flex', gap: '12px'}}>
              <button 
                type="button" 
                className="btn-secondary" 
                onClick={handleCancelSummary}
                style={{flex: 1}}
              >
                Hủy bỏ
              </button>
              <button 
                type="button" 
                className="btn-primary" 
                onClick={handleConfirmBooking}
                disabled={submitting}
                style={{flex: 1}}
              >
                {submitting ? 'Đang xử lý...' : '✅ Xác nhận đặt xe'}
              </button>
            </div>
          </div>
        </div>
      )}

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
