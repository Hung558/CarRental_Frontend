import React, { useState, useEffect } from 'react';
import { carService } from '../services/dataService';
import SearchBar from '../components/SearchBar';
import CarCard from '../components/CarCard';
import '../styles/HomePage.css';

const HomePage = () => {
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCars();
  }, []);

  const loadCars = async () => {
    try {
      setLoading(true);
      const response = await carService.getAllCars();
      setCars(response.data);
    } catch (error) {
      console.error('Error loading cars:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (searchParams) => {
    try {
      setLoading(true);
      const response = await carService.searchCars(searchParams);
      setCars(response.data);
    } catch (error) {
      console.error('Error searching cars:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="home-page">
      <section className="hero-section">
        <div className="hero-overlay">
          <h1 className="hero-title">Thuê xe dễ dàng, <br />di chuyển tự do</h1>
          <p className="hero-subtitle">Hàng trăm mẫu xe chất lượng cao với giá tốt nhất</p>
          <SearchBar onSearch={handleSearch} />
        </div>
      </section>

      <section className="cars-section">
        <h2 className="section-title">Xe nổi bật</h2>
        {loading ? (
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>Đang tải...</p>
          </div>
        ) : cars.length > 0 ? (
          <div className="cars-grid">
            {cars.map((car) => (
              <CarCard key={car.carId} car={car} />
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <span className="empty-icon">🚗</span>
            <p>Không tìm thấy xe phù hợp</p>
          </div>
        )}
      </section>
    </div>
  );
};

export default HomePage;
