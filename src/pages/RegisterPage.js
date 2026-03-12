import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../services/dataService';
import { useAuth } from '../context/AuthContext';
import '../styles/AuthPage.css';

const RegisterPage = () => {
  const [form, setForm] = useState({
    fullName: '', email: '', phone: '', password: '', role: 'CUSTOMER',
    city: '', district: '', detailedAddress: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await authService.register(form);
      login(response.data);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card auth-card-wide">
        <div className="auth-header">
          <h2>Đăng ký</h2>
          <p>Tạo tài khoản mới</p>
        </div>
        {error && <div className="alert-error">{error}</div>}
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-row">
            <div className="form-group">
              <label>Họ và tên *</label>
              <input type="text" name="fullName" value={form.fullName} onChange={handleChange} required placeholder="Nguyễn Văn A" />
            </div>
            <div className="form-group">
              <label>Email *</label>
              <input type="email" name="email" value={form.email} onChange={handleChange} required placeholder="your@email.com" />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Số điện thoại</label>
              <input type="text" name="phone" value={form.phone} onChange={handleChange} placeholder="0901234567" />
            </div>
            <div className="form-group">
              <label>Mật khẩu *</label>
              <input type="password" name="password" value={form.password} onChange={handleChange} required placeholder="Tối thiểu 6 ký tự" />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Vai trò *</label>
              <select name="role" value={form.role} onChange={handleChange}>
                <option value="CUSTOMER">Khách hàng</option>
                <option value="OWNER">Chủ xe</option>
              </select>
            </div>
            <div className="form-group">
              <label>Thành phố</label>
              <input type="text" name="city" value={form.city} onChange={handleChange} placeholder="TP. Hồ Chí Minh" />
            </div>
          </div>
          <div className="form-group">
            <label>Địa chỉ chi tiết</label>
            <input type="text" name="detailedAddress" value={form.detailedAddress} onChange={handleChange} placeholder="Số nhà, đường..." />
          </div>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Đang xử lý...' : 'Đăng ký'}
          </button>
        </form>
        <p className="auth-footer">
          Đã có tài khoản? <Link to="/login">Đăng nhập</Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;
