import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { paymentService } from '../services/dataService';
import '../styles/Dashboard.css';

const PaymentResult = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [status, setStatus] = useState('processing'); 
  const [message, setMessage] = useState('Đang xác thực giao dịch...');

  const hasVerified = React.useRef(false);

  useEffect(() => {
    const verifyPayment = async () => {
      if (hasVerified.current) return;
      hasVerified.current = true;

      const query = new URLSearchParams(location.search);
      const vnp_TxnRef = query.get('vnp_TxnRef');
      const responseCode = query.get('vnp_ResponseCode');
      const transactionId = query.get('vnp_TransactionNo');

      console.log('VNPay Return:', { vnp_TxnRef, responseCode, transactionId });

      if (responseCode === '00') {
        try {
          const bookingId = vnp_TxnRef?.split('_')[0];
          console.log('Verifying payment for booking:', bookingId);
          await paymentService.verifyVNPay({ bookingId, transactionId });
          console.log('Payment verification success');
          setStatus('success');
          setMessage('Thanh toán thành công! Đơn hàng của bạn đang chờ chủ xe duyệt.');
        } catch (err) {
          console.error('Verify error:', err);
          setStatus('error');
          setMessage('Cập nhật hệ thống thất bại. Đừng lo, giao dịch của bạn đã được ghi nhận.');
        }
      } else {
        setStatus('error');
        setMessage('Giao dịch không thành công hoặc đã bị hủy.');
      }
    };

    verifyPayment();
  }, [location.search]);

  return (
    <div className="dashboard-page" style={{textAlign: 'center', paddingTop: '100px'}}>
      <div className="modal-content" style={{maxWidth: '400px', margin: '0 auto', padding: '40px'}}>
        {status === 'processing' && <div className="spinner" style={{margin: '0 auto 20px'}}></div>}
        {status === 'success' && <div style={{fontSize: '50px', marginBottom: '20px'}}>✅</div>}
        {status === 'error' && <div style={{fontSize: '50px', marginBottom: '20px'}}>❌</div>}
        
        <h2 style={{marginBottom: '15px'}}>
          {status === 'processing' ? 'Vui lòng đợi...' : status === 'success' ? 'Thành công' : 'Thất bại'}
        </h2>
        <p style={{color: '#666', marginBottom: '30px'}}>{message}</p>
        
        <button className="btn-primary" style={{width: '100%'}} onClick={() => navigate('/customer/dashboard')}>
          Quay lại Dashboard
        </button>
      </div>
    </div>
  );
};

export default PaymentResult;
