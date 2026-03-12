import React, { useState, useEffect } from 'react';
import { bookingService, paymentService, feedbackService } from '../services/dataService';
import '../styles/Dashboard.css';

const CustomerDashboard = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [feedbackForm, setFeedbackForm] = useState({ bookingId: null, rating: 5, comment: '' });
  const [showFeedback, setShowFeedback] = useState(false);
  const [message, setMessage] = useState('');

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
    if (!window.confirm('Bạn có chắc muốn hủy đơn này?')) return;
    try {
      await bookingService.cancelBooking(id);
      setMessage('Hủy đơn thành công');
      loadBookings();
    } catch (err) { setMessage(err.response?.data?.message || 'Lỗi hủy đơn'); }
  };

  const handlePayment = async (bookingId) => {
    try {
      await paymentService.processPayment({ bookingId, paymentMethod: 'BANK_TRANSFER' });
      setMessage('Thanh toán thành công!');
      loadBookings();
    } catch (err) { setMessage(err.response?.data?.message || 'Lỗi thanh toán'); }
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

  const getStatusClass = (status) => {
    const map = { PENDING: 'status-pending', CONFIRMED: 'status-confirmed', COMPLETED: 'status-completed', CANCELLED: 'status-cancelled' };
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
        <div className="bookings-table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>#</th><th>Xe</th><th>Biển số</th><th>Ngày bắt đầu</th><th>Ngày kết thúc</th>
                <th>Tổng tiền</th><th>Trạng thái</th><th>Thanh toán</th><th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((b, i) => (
                <tr key={b.bookingId}>
                  <td>{i + 1}</td>
                  <td><strong>{b.carName}</strong><br/><small>{b.brandName}</small></td>
                  <td>{b.licensePlate}</td>
                  <td>{new Date(b.startDate).toLocaleString('vi-VN')}</td>
                  <td>{new Date(b.endDate).toLocaleString('vi-VN')}</td>
                  <td className="price-cell">{Number(b.totalPrice).toLocaleString('vi-VN')}đ</td>
                  <td><span className={`status-badge ${getStatusClass(b.status)}`}>{b.status}</span></td>
                  <td><span className={`status-badge ${b.paymentStatus === 'COMPLETED' ? 'status-completed' : 'status-pending'}`}>{b.paymentStatus}</span></td>
                  <td className="actions-cell">
                    {b.status === 'PENDING' && (
                      <>
                        <button className="btn-sm btn-success" onClick={() => handlePayment(b.bookingId)}>Thanh toán</button>
                        <button className="btn-sm btn-danger" onClick={() => handleCancel(b.bookingId)}>Hủy</button>
                      </>
                    )}
                    {b.status === 'CONFIRMED' && (
                      <button className="btn-sm btn-danger" onClick={() => handleCancel(b.bookingId)}>Hủy</button>
                    )}
                    {b.status === 'COMPLETED' && b.paymentStatus !== 'NOT_PAID' && (
                      <button className="btn-sm btn-primary" onClick={() => { setFeedbackForm({...feedbackForm, bookingId: b.bookingId}); setShowFeedback(true); }}>Đánh giá</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
                  {[1,2,3,4,5].map(star => (
                    <span key={star} className={`star ${star <= feedbackForm.rating ? 'active' : ''}`}
                          onClick={() => setFeedbackForm({...feedbackForm, rating: star})}>★</span>
                  ))}
                </div>
              </div>
              <div className="form-group">
                <label>Nhận xét</label>
                <textarea value={feedbackForm.comment} onChange={(e) => setFeedbackForm({...feedbackForm, comment: e.target.value})}
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
    </div>
  );
};

export default CustomerDashboard;
