import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/Navbar.css';

const Navbar = () => {
  const { user, isAuthenticated, logout, hasRole } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="navbar-main">
      <div className="navbar-container">
        <Link to="/" className="navbar-brand">
          <span className="brand-icon">🚗</span>
          <span className="brand-text">CarRental</span>
        </Link>

        <div className="navbar-links">
          <Link to="/" className="nav-link">Home</Link>

          {isAuthenticated() && hasRole('CUSTOMER') && (
            <Link to="/customer/dashboard" className="nav-link">My Bookings</Link>
          )}

          {isAuthenticated() && hasRole('OWNER') && (
            <>
              <Link to="/owner/dashboard" className="nav-link">Dashboard</Link>
            </>
          )}

          {isAuthenticated() && hasRole('ADMIN') && (
            <Link to="/admin/dashboard" className="nav-link">Admin</Link>
          )}
        </div>

        <div className="navbar-auth">
          {isAuthenticated() ? (
            <div className="user-menu">
              <span className="user-greeting">Hi, {user.fullName}</span>
              <span className="user-role-badge">{user.role}</span>
              <button onClick={handleLogout} className="btn-logout">Logout</button>
            </div>
          ) : (
            <div className="auth-buttons">
              <Link to="/login" className="btn-login">Login</Link>
              <Link to="/register" className="btn-register">Register</Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
