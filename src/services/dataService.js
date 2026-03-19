import api from './api';

export const authService = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
};

export const carService = {
  searchCars: (params) => api.get('/cars/search', { params }),
  getAllCars: () => api.get('/cars'),
  getCarById: (id) => api.get(`/cars/${id}`),
  createCar: (data) => api.post('/cars', data),
  updateCar: (id, data) => api.put(`/cars/${id}`, data),
  deleteCar: (id) => api.delete(`/cars/${id}`),
};

export const bookingService = {
  createBooking: (data) => api.post('/bookings', data),
  getMyBookings: () => api.get('/bookings/my'),
  cancelBooking: (id) => api.put(`/bookings/${id}/cancel`),
  confirmBooking: (id) => api.put(`/bookings/${id}/confirm`),
  completeBooking: (id) => api.put(`/bookings/${id}/complete`),
  extendBooking: (id, data) => api.patch(`/bookings/${id}/extend`, data),
  rejectBooking: (id) => api.patch(`/bookings/${id}/reject`),
  createOfflineBooking: (data) => api.post('/bookings/offline', data),
};

export const feedbackService = {
  createFeedback: (data) => api.post('/feedbacks', data),
  getFeedbacksByCarId: (carId) => api.get(`/feedbacks/car/${carId}`),
};

export const paymentService = {
  processPayment: (data) => api.post('/payments', data),
  getPaymentByBookingId: (bookingId) => api.get(`/payments/booking/${bookingId}`),
};

export const ownerService = {
  getMyCars: () => api.get('/owner/cars'),
  getMyBookings: () => api.get('/owner/bookings'),
  getRevenue: () => api.get('/owner/revenue'),
  addSchedule: (carId, data) => api.post(`/owner/cars/${carId}/schedules`, data),
  getSchedules: (carId) => api.get(`/owner/cars/${carId}/schedules`),
  deleteSchedule: (scheduleId) => api.delete(`/owner/schedules/${scheduleId}`),
};

export const brandService = {
  getAllBrands: () => api.get('/brands'),
};

export const categoryService = {
  getAllCategories: () => api.get('/categories'),
};

export const adminService = {
  getAllUsers: () => api.get('/admin/users'),
  updateUserStatus: (id, status) => api.put(`/admin/users/${id}/status?status=${status}`),
};
