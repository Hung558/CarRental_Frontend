import React, { useState, useEffect } from 'react';
import { adminService } from '../services/dataService';
import '../styles/Dashboard.css';

const AdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => { loadUsers(); }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const res = await adminService.getAllUsers();
      if (Array.isArray(res.data)) {
        setUsers(res.data);
      } else {
        console.error('Expected array of users but got:', res.data);
        setUsers([]);
        setMessage('Dữ liệu người dùng không hợp lệ');
      }
    } catch (err) {
      console.error('Error loading users:', err);
      setMessage(err.response?.data?.message || 'Không thể tải danh sách người dùng');
    }
    finally { setLoading(false); }
  };

  const handleStatusChange = async (userId, status) => {
    try {
      await adminService.updateUserStatus(userId, status);
      setMessage(`Cập nhật trạng thái thành ${status}`);
      loadUsers();
    } catch (err) { setMessage(err.response?.data?.message || 'Lỗi'); }
  };

  if (loading) return <div className="loading-spinner"><div className="spinner"></div></div>;

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <h1>⚙️ Admin Dashboard</h1>
      </div>

      <div className="stats-grid">
        <div className="stat-card stat-total"><div className="stat-value">{users.length}</div><div className="stat-label">Tổng người dùng</div></div>
        <div className="stat-card stat-done"><div className="stat-value">{Array.isArray(users) ? users.filter(u => u.role === 'CUSTOMER').length : 0}</div><div className="stat-label">Khách hàng</div></div>
        <div className="stat-card stat-revenue"><div className="stat-value">{Array.isArray(users) ? users.filter(u => u.role === 'OWNER').length : 0}</div><div className="stat-label">Chủ xe</div></div>
        <div className="stat-card stat-wait"><div className="stat-value">{Array.isArray(users) ? users.filter(u => u.role === 'ADMIN').length : 0}</div><div className="stat-label">Admin</div></div>
      </div>

      {message && <div className="alert-info">{message}</div>}

      <div className="bookings-table-wrapper">
        <table className="data-table">
          <thead><tr><th>ID</th><th>Tên</th><th>Email</th><th>SĐT</th><th>Vai trò</th><th>Thành phố</th><th>Trạng thái</th><th>Thao tác</th></tr></thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id}>
                <td>{u.id}</td>
                <td><strong>{u.fullName}</strong></td>
                <td>{u.email}</td>
                <td>{u.phone || 'N/A'}</td>
                <td><span className={`role-badge role-${u.role?.toLowerCase()}`}>{u.role}</span></td>
                <td>{u.city || 'N/A'}</td>
                <td><span className={`status-badge ${u.status === 'ACTIVE' ? 'status-confirmed' : 'status-cancelled'}`}>{u.status}</span></td>
                <td className="actions-cell">
                  {u.status === 'ACTIVE' ? (
                    <button className="btn-sm btn-danger" onClick={() => handleStatusChange(u.id, 'BANNED')}>Ban</button>
                  ) : (
                    <button className="btn-sm btn-success" onClick={() => handleStatusChange(u.id, 'ACTIVE')}>Activate</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminDashboard;
