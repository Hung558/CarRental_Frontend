import React, { useState, useEffect } from 'react';
import { ownerService, carService, brandService, categoryService, bookingService } from '../services/dataService';
import '../styles/Dashboard.css';

const OwnerDashboard = () => {
  const [activeTab, setActiveTab] = useState('cars');
  const [cars, setCars] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [revenue, setRevenue] = useState({});
  const [brands, setBrands] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCar, setEditingCar] = useState(null);
  const [message, setMessage] = useState('');
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [carForm, setCarForm] = useState({
    name: '', brandId: '', categoryId: '', color: '', year: '', licensePlate: '',
    description: '', locationCity: '', locationDistrict: '', priceHour: '', priceDay: '', priceMonth: '', imageUrls: []
  });
  
  const [offlineForm, setOfflineForm] = useState({
    carId: '', customerName: '', customerPhone: '', startDate: '', endDate: ''
  });
  const [showSchedule, setShowSchedule] = useState(false);
  const [currentCarSchedules, setCurrentCarSchedules] = useState([]);
  const [scheduleForm, setScheduleForm] = useState({ startDate: '', endDate: '' });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Helper function to handle individual service calls safely
      const safeCall = async (serviceMethod, defaultValue = []) => {
        try {
          const res = await serviceMethod();
          return res.data;
        } catch (err) {
          console.error(`Error fetching data:`, err);
          return defaultValue;
        }
      };

      const [carsData, bookingsData, revenueData, brandsData, catsData] = await Promise.all([
        safeCall(() => ownerService.getMyCars()),
        safeCall(() => ownerService.getMyBookings()),
        safeCall(() => ownerService.getRevenue(), {}),
        safeCall(() => brandService.getAllBrands()),
        safeCall(() => categoryService.getAllCategories())
      ]);

      setCars(carsData);
      setBookings(bookingsData);
      setRevenue(revenueData);
      setBrands(brandsData);
      setCategories(catsData);
    } catch (err) {
      console.error('Critical error in loadData:', err);
      setMessage('Có lỗi xảy ra khi tải dữ liệu. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  const handleCarSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = { ...carForm, brandId: parseInt(carForm.brandId), categoryId: parseInt(carForm.categoryId),
        year: carForm.year ? parseInt(carForm.year) : null,
        priceHour: carForm.priceHour ? parseFloat(carForm.priceHour) : null,
        priceDay: carForm.priceDay ? parseFloat(carForm.priceDay) : null,
        priceMonth: carForm.priceMonth ? parseFloat(carForm.priceMonth) : null,
      };
      if (editingCar) {
        await carService.updateCar(editingCar.carId, data);
        setMessage('Cập nhật xe thành công!');
      } else {
        await carService.createCar(data);
        setMessage('Thêm xe thành công!');
      }
      setShowForm(false);
      setEditingCar(null);
      resetForm();
      loadData();
    } catch (err) { setMessage(err.response?.data?.message || 'Lỗi xử lý'); }
  };

  const handleEdit = (car) => {
    setEditingCar(car);
    setCarForm({
      name: car.name, brandId: car.brandId, categoryId: car.categoryId, color: car.color || '',
      year: car.year || '', licensePlate: car.licensePlate, description: car.description || '',
      locationCity: car.locationCity || '', locationDistrict: car.locationDistrict || '',
      priceHour: car.priceHour || '', priceDay: car.priceDay || '', priceMonth: car.priceMonth || '', imageUrls: car.imageUrls || []
    });
    setShowForm(true);
  };

  const handleDelete = async (carId) => {
    if (!window.confirm('Xóa xe này?')) return;
    try {
      await carService.deleteCar(carId);
      setMessage('Xóa xe thành công');
      loadData();
    } catch (err) { setMessage(err.response?.data?.message || 'Lỗi xóa xe'); }
  };

  const handleConfirm = async (bookingId) => {
    try {
      await bookingService.confirmBooking(bookingId);
      setMessage('Xác nhận đơn thành công');
      loadData();
    } catch (err) { setMessage(err.response?.data?.message || 'Lỗi'); }
  };

  const handleComplete = async (bookingId) => {
    try {
      await bookingService.completeBooking(bookingId);
      setMessage('Hoàn thành đơn thành công');
      loadData();
    } catch (err) { setMessage(err.response?.data?.message || 'Lỗi'); }
  };

  const handleReject = async (bookingId) => {
    if (!window.confirm('Từ chối đơn này?')) return;
    try {
      await bookingService.rejectBooking(bookingId);
      setMessage('Từ chối đơn thành công');
      loadData();
    } catch (err) { setMessage(err.response?.data?.message || 'Lỗi'); }
  };

  const handleOfflineSubmit = async (e) => {
    e.preventDefault();
    try {
      await bookingService.createOfflineBooking(offlineForm);
      setMessage('Tạo đơn Offline thành công!');
      setOfflineForm({ carId: '', customerName: '', customerPhone: '', startDate: '', endDate: '' });
      setActiveTab('bookings');
      loadData();
    } catch(err) { setMessage(err.response?.data?.message || 'Lỗi tạo đơn'); }
  }

  const handleManageSchedule = async (car) => {
    setEditingCar(car);
    try {
      const res = await ownerService.getSchedules(car.carId);
      setCurrentCarSchedules(res.data);
      setShowSchedule(true);
    } catch(err) { setMessage('Lỗi tải lịch'); }
  }

  const handleAddSchedule = async (e) => {
    e.preventDefault();
    try {
      await ownerService.addSchedule(editingCar.carId, scheduleForm);
      setMessage('Thêm lịch thành công');
      setScheduleForm({startDate: '', endDate: ''});
      const res = await ownerService.getSchedules(editingCar.carId);
      setCurrentCarSchedules(res.data);
    } catch(err) { setMessage(err.response?.data?.message || 'Lỗi'); }
  }

  const handleDeleteSchedule = async (id) => {
    try {
      await ownerService.deleteSchedule(id);
      setMessage('Xóa lịch thành công');
      const res = await ownerService.getSchedules(editingCar.carId);
      setCurrentCarSchedules(res.data);
    } catch(err) { setMessage(err.response?.data?.message || 'Lỗi'); }
  }

  const resetForm = () => {
    setCarForm({ name: '', brandId: '', categoryId: '', color: '', year: '', licensePlate: '',
      description: '', locationCity: '', locationDistrict: '', priceHour: '', priceDay: '', priceMonth: '', imageUrls: [] });
    setImageUrlInput('');
  };

  const handleAddImageUrl = () => {
    if (!imageUrlInput.trim()) return;
    setCarForm({
      ...carForm,
      imageUrls: [...carForm.imageUrls, imageUrlInput.trim()]
    });
    setImageUrlInput('');
  };

  const handleRemoveImageUrl = (index) => {
    const newUrls = [...carForm.imageUrls];
    newUrls.splice(index, 1);
    setCarForm({ ...carForm, imageUrls: newUrls });
  };

  if (loading) return <div className="loading-spinner"><div className="spinner"></div></div>;

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <h1>🏠 Dashboard Chủ xe</h1>
      </div>

      {/* Revenue Cards */}
      <div className="stats-grid">
        <div className="stat-card stat-revenue"><div className="stat-value">{Number(revenue.totalRevenue || 0).toLocaleString('vi-VN')}đ</div><div className="stat-label">Tổng doanh thu</div></div>
        <div className="stat-card stat-total"><div className="stat-value">{revenue.totalBookings || 0}</div><div className="stat-label">Tổng đơn</div></div>
        <div className="stat-card stat-done"><div className="stat-value">{revenue.completedBookings || 0}</div><div className="stat-label">Hoàn thành</div></div>
        <div className="stat-card stat-wait"><div className="stat-value">{revenue.pendingBookings || 0}</div><div className="stat-label">Đang chờ</div></div>
      </div>

      {message && <div className="alert-info">{message}</div>}

      {/* Tabs */}
      <div className="tab-nav">
        <button className={activeTab === 'cars' ? 'tab-active' : ''} onClick={() => setActiveTab('cars')}>🚗 Xe của tôi ({cars.length})</button>
        <button className={activeTab === 'bookings' ? 'tab-active' : ''} onClick={() => setActiveTab('bookings')}>📋 Đơn đặt ({bookings.length})</button>
        <button className={activeTab === 'offline' ? 'tab-active' : ''} onClick={() => setActiveTab('offline')}>📝 Tạo đơn Offline</button>
      </div>

      {/* Cars Tab */}
      {activeTab === 'cars' && (
        <div className="tab-content">
          <div className="tab-actions">
            <button className="btn-primary" onClick={() => { setShowForm(true); setEditingCar(null); resetForm(); }}>+ Thêm xe</button>
          </div>
          <div className="bookings-table-wrapper">
            <table className="data-table">
              <thead><tr><th>Tên</th><th>Hãng</th><th>Biển số</th><th>Thành phố</th><th>Giá/ngày</th><th>Trạng thái</th><th>Thao tác</th></tr></thead>
              <tbody>
                {cars.map(car => (
                  <tr key={car.carId}>
                    <td><strong>{car.name}</strong></td>
                    <td>{car.brandName}</td>
                    <td>{car.licensePlate}</td>
                    <td>{car.locationCity}</td>
                    <td>{car.priceDay ? `${Number(car.priceDay).toLocaleString('vi-VN')}đ` : 'N/A'}</td>
                    <td><span className="status-badge status-confirmed">{car.status}</span></td>
                    <td className="actions-cell">
                      <button className="btn-sm btn-primary" onClick={() => handleEdit(car)}>Sửa</button>
                      <button className="btn-sm btn-secondary" onClick={() => handleManageSchedule(car)}>Lịch</button>
                      <button className="btn-sm btn-danger" onClick={() => handleDelete(car.carId)}>Xóa</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Bookings Tab */}
      {activeTab === 'bookings' && (
        <div className="tab-content">
          <div className="bookings-table-wrapper">
            <table className="data-table">
              <thead><tr><th>#</th><th>Khách</th><th>Xe</th><th>Ngày thuê</th><th>Tổng tiền</th><th>Trạng thái</th><th>Thao tác</th></tr></thead>
              <tbody>
                {bookings.map((b, i) => (
                  <tr key={b.bookingId}>
                    <td>{i + 1}</td>
                    <td>{b.customerName}</td>
                    <td>{b.carName}</td>
                    <td>{new Date(b.startDate).toLocaleDateString('vi-VN')} - {new Date(b.endDate).toLocaleDateString('vi-VN')}</td>
                    <td className="price-cell">{Number(b.totalPrice).toLocaleString('vi-VN')}đ</td>
                    <td><span className={`status-badge status-${b.status.toLowerCase()}`}>{b.status}</span></td>
                    <td className="actions-cell">
                      {b.status === 'PENDING' && (
                        <>
                          <button className="btn-sm btn-success" onClick={() => handleConfirm(b.bookingId)}>Xác nhận</button>
                          <button className="btn-sm btn-danger" onClick={() => handleReject(b.bookingId)}>Từ chối</button>
                        </>
                      )}
                      {b.status === 'CONFIRMED' && <button className="btn-sm btn-primary" onClick={() => handleComplete(b.bookingId)}>Hoàn thành</button>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Offline Tab */}
      {activeTab === 'offline' && (
        <div className="tab-content">
          <form className="form-offline" onSubmit={handleOfflineSubmit} style={{maxWidth: '500px', margin: '0 auto', background: '#f9f9f9', padding: '20px', borderRadius: '8px'}}>
            <h3 style={{marginBottom: '15px'}}>Tạo Đơn Offline</h3>
            <div className="form-group">
              <label>Chọn xe</label>
              <select required value={offlineForm.carId} onChange={e => setOfflineForm({...offlineForm, carId: e.target.value})}>
                <option value="">-- Chọn xe --</option>
                {cars.map(c => <option key={c.carId} value={c.carId}>{c.name} - {c.licensePlate}</option>)}
              </select>
            </div>
            <div className="form-group"><label>Tên khách hàng</label><input required value={offlineForm.customerName} onChange={e => setOfflineForm({...offlineForm, customerName: e.target.value})} /></div>
            <div className="form-group"><label>Số điện thoại</label><input required value={offlineForm.customerPhone} onChange={e => setOfflineForm({...offlineForm, customerPhone: e.target.value})} /></div>
            <div className="form-group"><label>Ngày bắt đầu</label><input type="datetime-local" required value={offlineForm.startDate} onChange={e => setOfflineForm({...offlineForm, startDate: e.target.value})} /></div>
            <div className="form-group"><label>Ngày kết thúc</label><input type="datetime-local" required value={offlineForm.endDate} onChange={e => setOfflineForm({...offlineForm, endDate: e.target.value})} /></div>
            <button className="btn-primary" style={{width: '100%', marginTop: '10px'}} type="submit">Tạo Đơn (Thanh Toán Tiền Mặt)</button>
          </form>
        </div>
      )}

      {/* Add/Edit Car Modal */}
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal-content modal-lg" onClick={e => e.stopPropagation()}>
            <h3>{editingCar ? 'Sửa xe' : 'Thêm xe mới'}</h3>
            <form onSubmit={handleCarSubmit}>
              <div className="form-row">
                <div className="form-group"><label>Tên xe *</label><input value={carForm.name} onChange={e => setCarForm({...carForm, name: e.target.value})} required /></div>
                <div className="form-group"><label>Biển số *</label><input value={carForm.licensePlate} onChange={e => setCarForm({...carForm, licensePlate: e.target.value})} required /></div>
              </div>
              <div className="form-row">
                <div className="form-group"><label>Hãng xe *</label>
                  <select value={carForm.brandId} onChange={e => setCarForm({...carForm, brandId: e.target.value})} required>
                    <option value="">Chọn hãng</option>
                    {brands.map(b => <option key={b.brandId} value={b.brandId}>{b.name}</option>)}
                  </select>
                </div>
                <div className="form-group"><label>Loại xe *</label>
                  <select value={carForm.categoryId} onChange={e => setCarForm({...carForm, categoryId: e.target.value})} required>
                    <option value="">Chọn loại</option>
                    {categories.map(c => <option key={c.categoryId} value={c.categoryId}>{c.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group"><label>Màu</label><input value={carForm.color} onChange={e => setCarForm({...carForm, color: e.target.value})} /></div>
                <div className="form-group"><label>Năm SX</label><input type="number" value={carForm.year} onChange={e => setCarForm({...carForm, year: e.target.value})} /></div>
              </div>
              <div className="form-row">
                <div className="form-group"><label>Thành phố</label><input value={carForm.locationCity} onChange={e => setCarForm({...carForm, locationCity: e.target.value})} /></div>
                <div className="form-group"><label>Quận/Huyện</label><input value={carForm.locationDistrict} onChange={e => setCarForm({...carForm, locationDistrict: e.target.value})} /></div>
              </div>
              <div className="form-group"><label>Mô tả</label><textarea value={carForm.description} onChange={e => setCarForm({...carForm, description: e.target.value})} rows="3"></textarea></div>
              <div className="form-row">
                <div className="form-group"><label>Giá/giờ</label><input type="number" value={carForm.priceHour} onChange={e => setCarForm({...carForm, priceHour: e.target.value})} /></div>
                <div className="form-group"><label>Giá/ngày</label><input type="number" value={carForm.priceDay} onChange={e => setCarForm({...carForm, priceDay: e.target.value})} /></div>
                <div className="form-group"><label>Giá/tháng</label><input type="number" value={carForm.priceMonth} onChange={e => setCarForm({...carForm, priceMonth: e.target.value})} /></div>
              </div>

              <div className="form-group image-management">
                <label>Ảnh xe (URL)</label>
                <div className="image-input-row">
                  <input 
                    placeholder="Dán link ảnh tại đây..." 
                    value={imageUrlInput} 
                    onChange={e => setImageUrlInput(e.target.value)}
                  />
                  <button type="button" className="btn-sm btn-primary" onClick={handleAddImageUrl}>+ Thêm</button>
                </div>
                {carForm.imageUrls.length > 0 && (
                  <div className="image-preview-grid">
                    {carForm.imageUrls.map((url, index) => (
                      <div key={index} className="preview-item">
                        <img src={url} alt="Car preview" onError={(e) => e.target.src = 'https://via.placeholder.com/150?text=Invalid+URL'} />
                        <button type="button" className="remove-btn" onClick={() => handleRemoveImageUrl(index)}>&times;</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>Hủy</button>
                <button type="submit" className="btn-primary">{editingCar ? 'Cập nhật' : 'Thêm xe'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manage Schedule Modal */}
      {showSchedule && (
        <div className="modal-overlay" onClick={() => setShowSchedule(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3>Quản lý lịch (Các ngày bận)</h3>
            <p style={{marginBottom: '15px', color: '#666', fontSize: '14px'}}>Xe <strong>{editingCar?.name}</strong> - Biển số: {editingCar?.licensePlate}</p>
            <form onSubmit={handleAddSchedule} style={{display: 'flex', gap: '10px', marginBottom: '15px'}}>
              <input type="datetime-local" required value={scheduleForm.startDate} onChange={e=>setScheduleForm({...scheduleForm, startDate: e.target.value})} />
              <input type="datetime-local" required value={scheduleForm.endDate} onChange={e=>setScheduleForm({...scheduleForm, endDate: e.target.value})} />
              <button className="btn-primary" type="submit">Khoá lịch</button>
            </form>
            <div style={{maxHeight:'250px', overflowY:'auto'}}>
              <table className="data-table">
                <thead><tr><th>Từ ngày</th><th>Đến ngày</th><th>Thao tác</th></tr></thead>
                <tbody>
                  {currentCarSchedules.length === 0 && <tr><td colSpan="3" style={{textAlign:'center'}}>Chưa có lịch bị khóa</td></tr>}
                  {currentCarSchedules.map(s => (
                    <tr key={s.scheduleId}>
                      <td>{new Date(s.startDate).toLocaleString('vi-VN')}</td>
                      <td>{new Date(s.endDate).toLocaleString('vi-VN')}</td>
                      <td><button className="btn-sm btn-danger" onClick={() => handleDeleteSchedule(s.scheduleId)}>Xóa</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="modal-actions" style={{marginTop: '20px'}}>
              <button type="button" className="btn-secondary" onClick={() => setShowSchedule(false)}>Đóng</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OwnerDashboard;
