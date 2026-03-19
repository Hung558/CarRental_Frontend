import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { bookingService, paymentService, feedbackService } from '../services/dataService';
import '../styles/Dashboard.css';

const CustomerDashboard = () => {
  const location = useLocation();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [feedbackForm, setFeedbackForm] = useState({ bookingId: null, rating: 5, comment: '' });
  const [showFeedback, setShowFeedback] = useState(false);
  const [extendForm, setExtendForm] = useState({ bookingId: null, newEndDate: '' });
  const [showExtend, setShowExtend] = useState(false);
  const [message, setMessage] = useState(location.state?.message || '');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filterDate, setFilterDate] = useState('');

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
    try {
      await bookingService.extendBooking(extendForm.bookingId, { newEndDate: extendForm.newEndDate });
      setMessage('Gia hạn thành công!');
      setShowExtend(false);
      setExtendForm({ bookingId: null, newEndDate: '' });
      loadBookings();
    } catch (err) { setMessage(err.response?.data?.message || 'Lỗi gia hạn'); }
  };

  const getStatusClass = (status) => {
    const map = { PENDING_PAYMENT: 'status-pending_payment', CONFIRMED: 'status-confirmed', IN_PROGRESS: 'status-in_progress', COMPLETED: 'status-completed', CANCELLED: 'status-cancelled' };
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
          <div style={{display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap', alignItems: 'center'}}>
            <div style={{display: 'flex', alignItems: 'center', gap: '6px'}}>
              <label style={{fontSize: '13px', fontWeight: 600, whiteSpace: 'nowrap'}}>Trạng thái:</label>
              <select 
                value={filterStatus} 
                onChange={e => setFilterStatus(e.target.value)}
                style={{padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border, #ddd)', fontSize: '13px'}}
              >
                <option value="ALL">Tất cả</option>
                <option value="PENDING_PAYMENT">Chờ thanh toán</option>
                <option value="CONFIRMED">Đã duyệt</option>
                <option value="IN_PROGRESS">Đang dùng</option>
                <option value="COMPLETED">Hoàn thành</option>
                <option value="CANCELLED">Đã hủy</option>
                <option value="REJECTED">Từ chối</option>
              </select>
            </div>
            <div style={{display: 'flex', alignItems: 'center', gap: '6px'}}>
              <label style={{fontSize: '13px', fontWeight: 600, whiteSpace: 'nowrap'}}>Ngày thuê:</label>
              <input 
                type="date" 
                value={filterDate} 
                onChange={e => setFilterDate(e.target.value)}
                style={{padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border, #ddd)', fontSize: '13px'}}
              />
              {filterDate && (
                <button 
                  type="button" 
                  onClick={() => setFilterDate('')} 
                  style={{background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px', color: '#888'}}
                >✕</button>
              )}
            </div>
            <span style={{fontSize: '12px', color: '#888'}}>
              Hiển thị {bookings.filter(b => {
                const matchStatus = filterStatus === 'ALL' || b.status === filterStatus;
                const matchDate = !filterDate || (
                  new Date(b.startDate).toISOString().slice(0,10) <= filterDate && 
                  new Date(b.endDate).toISOString().slice(0,10) >= filterDate
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
                  new Date(b.startDate).toISOString().slice(0,10) <= filterDate && 
                  new Date(b.endDate).toISOString().slice(0,10) >= filterDate
                );
                return matchStatus && matchDate;
              }).map((b, i) => (
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
                    {((b.status?.trim().toUpperCase() === 'PENDING_PAYMENT') || 
                      (b.status?.trim().toUpperCase() === 'CONFIRMED' && b.paymentStatus?.trim().toUpperCase() === 'NOT_PAID')) && (
                      <button className="btn-sm btn-success" style={{cursor: 'pointer', zIndex: 10}} onClick={() => handlePayment(b.bookingId)}>Thanh toán</button>
                    )}
                    {['PENDING_PAYMENT', 'CONFIRMED', 'IN_PROGRESS'].includes(b.status?.trim().toUpperCase()) && (
                      <button className="btn-sm btn-primary" style={{cursor: 'pointer', zIndex: 10}} onClick={() => { setExtendForm({ bookingId: b.bookingId, newEndDate: '' }); setShowExtend(true); }}>Gia hạn</button>
                    )}
                    {['PENDING_PAYMENT', 'CONFIRMED'].includes(b.status?.trim().toUpperCase()) && (
                      <button className="btn-sm btn-danger" style={{cursor: 'pointer', zIndex: 10}} onClick={() => handleCancel(b.bookingId)}>Hủy</button>
                    )}
                    {b.status === 'COMPLETED' && b.paymentStatus !== 'NOT_PAID' && !b.hasFeedback && (
                      <button className="btn-sm btn-primary" onClick={() => { setFeedbackForm({...feedbackForm, bookingId: b.bookingId}); setShowFeedback(true); }}>Đánh giá</button>
                    )}
                    {b.status === 'COMPLETED' && b.hasFeedback && (
                      <span className="status-badge status-completed" style={{background: '#6c757d'}}>Đã đánh giá</span>
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

      {/* Extend Booking Modal */}
      {showExtend && (
        <div className="modal-overlay" onClick={() => setShowExtend(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Gia hạn lịch thuê</h3>
            <form onSubmit={handleExtend}>
              <div className="form-group">
                <label>Ngày kết thúc mới</label>
                <input type="datetime-local" required
                       value={extendForm.newEndDate}
                       onChange={(e) => setExtendForm({...extendForm, newEndDate: e.target.value})} />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowExtend(false)}>Hủy</button>
                <button type="submit" className="btn-primary">Xác nhận</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerDashboard;
