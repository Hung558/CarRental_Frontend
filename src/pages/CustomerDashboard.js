import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { bookingService, paymentService, feedbackService } from '../services/dataService';
import { toLocalISOString, getAbsoluteInterval } from '../utils/dateUtils';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import '../styles/Dashboard.css';

const CustomerDashboard = () => {
  const location = useLocation();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [feedbackForm, setFeedbackForm] = useState({ bookingId: null, rating: 5, comment: '' });
  const [showFeedback, setShowFeedback] = useState(false);
  const [extendForm, setExtendForm] = useState({ 
    bookingId: null, 
    bookingType: 'DAY',
    selectedDate: null, 
    startTime: '08:00',
    endTime: '18:00',
    startMonth: null,
    endMonth: null,
    currentEndDate: null
  });
  const [showExtend, setShowExtend] = useState(false);
  const [message, setMessage] = useState(location.state?.message || '');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filterDate, setFilterDate] = useState('');

  const statusMap = {
    PENDING_PAYMENT: 'Pending Payment',
    PENDING: 'Pending ',
    CONFIRMED: 'Confirmed',
    IN_PROGRESS: 'On Progress',
    COMPLETED: 'Completed',
    CANCELLED: 'Cancelled',
    REJECTED: 'Rejected'
  };

  useEffect(() => { loadBookings(); }, []);

  const loadBookings = async () => {
    try {
      setLoading(true);
      const res = await bookingService.getMyBookings();
      setBookings(res.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleCancel = async (id) => {
    const booking = bookings.find(b => b.bookingId === id);
    const needsRefund = booking && (booking.status === 'PENDING' || booking.status === 'CONFIRMED');

    if (!window.confirm('Bạn có chắc muốn hủy đơn này?')) return;
    try {
      await bookingService.cancelBooking(id);
      if (needsRefund) {
        setMessage('Hủy đơn thành công. Chúng tôi sẽ liên hệ bạn sớm nhất để hoàn tiền');
      } else {
        setMessage('Hủy đơn thành công');
      }
      loadBookings();
    } catch (err) { setMessage(err.response?.data?.message || 'Lỗi hủy đơn'); }
  };

  const handlePayment = async (bookingId) => {
    console.log("Handle payment clicked for ID:", bookingId);
    try {
      const res = await paymentService.getVNPayUrl(bookingId);
      console.log("VNPay URL response:", res.data);
      if (res.data.url) {
        window.location.href = res.data.url;
      } else {
        setMessage('Không nhận được liên kết thanh toán từ máy chủ');
      }
    } catch (err) {
      console.error("Payment error:", err);
      setMessage(err.response?.data?.message || 'Lỗi khởi tạo thanh toán');
    }
  };

  const handleFeedback = async (e) => {
    e.preventDefault();
    try {
      await feedbackService.createFeedback(feedbackForm);
      setMessage('Gửi đánh giá thành công!');
      setShowFeedback(false);
      setFeedbackForm({ bookingId: null, rating: 5, comment: '' });
      loadBookings();
    } catch (err) { setMessage(err.response?.data?.message || 'Lỗi gửi đánh giá'); }
  };

  const handleExtend = async (e) => {
    e.preventDefault();
    const interval = getAbsoluteInterval(extendForm);
    if (!interval) {
      setMessage('Vui lòng chọn thời gian hợp lệ');
      return;
    }

    if (interval.end <= extendForm.currentEndDate) {
      setMessage('Thời gian kết thúc mới phải sau thời gian cũ');
      return;
    }

    try {
      await bookingService.extendBooking(extendForm.bookingId, { newEndDate: toLocalISOString(interval.end) });
      setMessage('Gia hạn thành công!');
      setShowExtend(false);
      loadBookings();
    } catch (err) { setMessage(err.response?.data?.message || 'Lỗi gia hạn'); }
  };

  const getStatusClass = (status) => {
    const map = { PENDING_PAYMENT: 'status-pending_payment', PENDING: 'status-pending', CONFIRMED: 'status-confirmed', IN_PROGRESS: 'status-in_progress', COMPLETED: 'status-completed', CANCELLED: 'status-cancelled' };
    return map[status] || '';
  };

  if (loading) return <div className="loading-spinner"><div className="spinner"></div></div>;

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <h1>📋 Đơn đặt xe của tôi</h1>
      </div>
      {message && <div className="alert-info">{message}</div>}

      {bookings.length === 0 ? (
        <div className="empty-state"><span className="empty-icon">📭</span><p>Bạn chưa có đơn đặt xe nào</p></div>
      ) : (
        <>
          {/* Filter Bar (UC10 Step 3) */}
          <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <label style={{ fontSize: '13px', fontWeight: 600, whiteSpace: 'nowrap' }}>Trạng thái:</label>
              <select
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value)}
                style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border, #ddd)', fontSize: '13px' }}
              >
                <option value="ALL">Tất cả</option>
                <option value="PENDING">Chờ chủ duyệt</option>
                <option value="CONFIRMED">Đã duyệt</option>
                <option value="IN_PROGRESS">Đang dùng</option>
                <option value="COMPLETED">Hoàn thành</option>
                <option value="CANCELLED">Đã hủy</option>
                <option value="REJECTED">Từ chối</option>
              </select>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <label style={{ fontSize: '13px', fontWeight: 600, whiteSpace: 'nowrap' }}>Ngày thuê:</label>
              <input
                type="date"
                value={filterDate}
                onChange={e => setFilterDate(e.target.value)}
                style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border, #ddd)', fontSize: '13px' }}
              />
              {filterDate && (
                <button
                  type="button"
                  onClick={() => setFilterDate('')}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px', color: '#888' }}
                >✕</button>
              )}
            </div>
            <span style={{ fontSize: '12px', color: '#888' }}>
              Hiển thị {bookings.filter(b => {
                const matchStatus = filterStatus === 'ALL' || b.status === filterStatus;
                const matchDate = !filterDate || (
                  new Date(b.startDate).toISOString().slice(0, 10) <= filterDate &&
                  new Date(b.endDate).toISOString().slice(0, 10) >= filterDate
                );
                return matchStatus && matchDate;
              }).length} / {bookings.length} đơn
            </span>
          </div>
          <div className="bookings-table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>#</th><th>Xe</th><th>Biển số</th><th>Ngày bắt đầu</th><th>Ngày kết thúc</th>
                  <th>Tổng tiền</th><th>Trạng thái</th><th>Thanh toán</th><th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {bookings.filter(b => {
                  const matchStatus = filterStatus === 'ALL' || b.status === filterStatus;
                  const matchDate = !filterDate || (
                    new Date(b.startDate).toISOString().slice(0, 10) <= filterDate &&
                    new Date(b.endDate).toISOString().slice(0, 10) >= filterDate
                  );
                  return matchStatus && matchDate;
                }).map((b, i) => (
                  <tr key={b.bookingId}>
                    <td>{i + 1}</td>
                    <td><strong>{b.carName}</strong><br /><small>{b.brandName}</small></td>
                    <td>{b.licensePlate}</td>
                    <td>{new Date(b.startDate).toLocaleString('vi-VN')}</td>
                    <td>{new Date(b.endDate).toLocaleString('vi-VN')}</td>
                    <td className="price-cell">{Number(b.totalPrice).toLocaleString('vi-VN')}đ</td>
                    <td>
                      <span className={`status-badge ${getStatusClass(b.status)}`}>{statusMap[b.status] || b.status}</span>
                      {b.status === 'CANCELLED' && b.paymentStatus === 'COMPLETED' && (
                        <div style={{ fontSize: '10px', color: 'var(--danger)', marginTop: '4px', maxWidth: '120px', lineHeight: '1.2', fontWeight: 'bold' }}>
                          Chúng tôi sẽ liên hệ bạn sớm nhất để hoàn tiền
                        </div>
                      )}
                    </td>
                    <td><span className={`status-badge ${b.paymentStatus === 'COMPLETED' ? 'status-completed' : 'status-pending'}`}>{b.paymentStatus}</span></td>
                    <td className="actions-cell">
                      {b.status === 'PENDING_PAYMENT' && (
                        <button className="btn-sm btn-success" style={{ cursor: 'pointer', zIndex: 10 }} onClick={() => handlePayment(b.bookingId)}>Thanh toán</button>
                      )}
                      {['PENDING_PAYMENT', 'CONFIRMED', 'IN_PROGRESS'].includes(b.status?.trim().toUpperCase()) && (
                        <button className="btn-sm btn-primary" style={{ cursor: 'pointer', zIndex: 10 }} onClick={() => { 
                          const currentEndDate = new Date(b.endDate);
                          setExtendForm({ 
                            bookingId: b.bookingId, 
                            bookingType: b.bookingType || 'DAY',
                            selectedDate: currentEndDate,
                            startDate: new Date(b.startDate), // needed for interval calc if DAY
                            endDate: currentEndDate,
                            startTime: `${currentEndDate.getHours().toString().padStart(2, '0')}:00`,
                            endTime: `${Math.min(23, currentEndDate.getHours() + 2).toString().padStart(2, '0')}:00`,
                            startMonth: new Date(currentEndDate.getFullYear(), currentEndDate.getMonth(), 1),
                            endMonth: currentEndDate,
                            currentEndDate: currentEndDate
                          }); 
                          setShowExtend(true); 
                        }}>Gia hạn</button>
                      )}
                      {['PENDING_PAYMENT', 'PENDING', 'CONFIRMED'].includes(b.status?.trim().toUpperCase()) && (
                        <button className="btn-sm btn-danger" style={{ cursor: 'pointer', zIndex: 10 }} onClick={() => handleCancel(b.bookingId)}>Hủy</button>
                      )}
                      {b.status === 'COMPLETED' && b.paymentStatus !== 'NOT_PAID' && !b.hasFeedback && (
                        <button className="btn-sm btn-primary" onClick={() => { setFeedbackForm({ ...feedbackForm, bookingId: b.bookingId }); setShowFeedback(true); }}>Đánh giá</button>
                      )}
                      {b.status === 'COMPLETED' && b.hasFeedback && (
                        <span className="status-badge status-completed" style={{ background: '#6c757d' }}>Đã đánh giá</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Feedback Modal */}
      {showFeedback && (
        <div className="modal-overlay" onClick={() => setShowFeedback(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Đánh giá chuyến đi</h3>
            <form onSubmit={handleFeedback}>
              <div className="form-group">
                <label>Số sao</label>
                <div className="star-rating">
                  {[1, 2, 3, 4, 5].map(star => (
                    <span key={star} className={`star ${star <= feedbackForm.rating ? 'active' : ''}`}
                      onClick={() => setFeedbackForm({ ...feedbackForm, rating: star })}>★</span>
                  ))}
                </div>
              </div>
              <div className="form-group">
                <label>Nhận xét</label>
                <textarea value={feedbackForm.comment} onChange={(e) => setFeedbackForm({ ...feedbackForm, comment: e.target.value })}
                  placeholder="Chia sẻ trải nghiệm của bạn..." rows="4"></textarea>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowFeedback(false)}>Hủy</button>
                <button type="submit" className="btn-primary">Gửi đánh giá</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Extend Booking Modal */}
      {showExtend && (
        <div className="modal-overlay" onClick={() => setShowExtend(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Gia hạn lịch thuê</h3>
            
            {/* Booking Type Tabs (matching CarDetailPage) */}
            <div className="booking-type-tabs" style={{marginBottom: '16px'}}>
              <button 
                type="button"
                className={`type-tab ${extendForm.bookingType === 'HOUR' ? 'active' : ''}`}
                onClick={() => setExtendForm({ ...extendForm, bookingType: 'HOUR' })}
              >Theo giờ</button>
              <button 
                type="button"
                className={`type-tab ${extendForm.bookingType === 'DAY' ? 'active' : ''}`}
                onClick={() => setExtendForm({ ...extendForm, bookingType: 'DAY' })}
              >Theo ngày</button>
              <button 
                type="button"
                className={`type-tab ${extendForm.bookingType === 'MONTH' ? 'active' : ''}`}
                onClick={() => setExtendForm({ ...extendForm, bookingType: 'MONTH' })}
              >Theo tháng</button>
            </div>

            <form onSubmit={handleExtend}>
              <div className="dynamic-date-inputs">
                {/* 1. HOURLY UI */}
                {extendForm.bookingType === 'HOUR' && (
                  <div className="hourly-picker-container">
                    <div className="form-group">
                      <label>Chọn ngày gia hạn</label>
                      <DatePicker
                        selected={extendForm.selectedDate}
                        onChange={(date) => setExtendForm({ ...extendForm, selectedDate: date })}
                        minDate={extendForm.currentEndDate}
                        dateFormat="dd/MM/yyyy"
                        className="datepicker-input"
                        required
                      />
                    </div>
                    <div className="form-row" style={{display: 'flex', gap: '10px', marginTop: '10px'}}>
                      <div className="form-group" style={{flex: 1}}>
                        <label>Đến lúc</label>
                        <select 
                          value={extendForm.endTime} 
                          onChange={e => setExtendForm({ ...extendForm, endTime: e.target.value })}
                          className="datepicker-input"
                          style={{width: '100%', padding: '8px', borderRadius: '4px', background: '#1a1d2e', color: '#fff', border: '1px solid #2a2d42'}}
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
                {extendForm.bookingType === 'DAY' && (
                  <div className="daily-picker-container">
                    <div className="form-group">
                      <label>Chọn ngày kết thúc mới</label>
                      <DatePicker
                        selected={extendForm.endDate}
                        onChange={(date) => setExtendForm({ ...extendForm, endDate: date })}
                        minDate={extendForm.currentEndDate}
                        dateFormat="dd/MM/yyyy"
                        placeholderText="Chọn ngày kết thúc"
                        className="datepicker-input"
                        required
                        style={{width: '100%'}}
                      />
                    </div>
                  </div>
                )}

                {/* 3. MONTHLY UI */}
                {extendForm.bookingType === 'MONTH' && (
                  <div className="monthly-picker-container">
                    <div className="form-group">
                      <label>Đến tháng</label>
                      <DatePicker
                        selected={extendForm.endMonth}
                        onChange={(date) => setExtendForm({ ...extendForm, endMonth: date })}
                        dateFormat="MM/yyyy"
                        showMonthYearPicker
                        minDate={extendForm.currentEndDate}
                        placeholderText="Đến tháng"
                        className="datepicker-input"
                        required
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="modal-actions" style={{marginTop: '20px'}}>
                <button type="button" className="btn-secondary" onClick={() => setShowExtend(false)}>Hủy</button>
                <button type="submit" className="btn-primary">Xác nhận gia hạn</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerDashboard;
