import React, { useState } from 'react';
import '../styles/SearchBar.css';

const SearchBar = ({ onSearch }) => {
  const [city, setCity] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    onSearch({ city, startDate, endDate });
  };

  return (
    <form className="search-bar" onSubmit={handleSearch}>
      <div className="search-field">
        <label>Thành phố</label>
        <input
          type="text"
          placeholder="Nhập thành phố..."
          value={city}
          onChange={(e) => setCity(e.target.value)}
        />
      </div>
      <div className="search-field">
        <label>Ngày bắt đầu</label>
        <input
          type="datetime-local"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
        />
      </div>
      <div className="search-field">
        <label>Ngày kết thúc</label>
        <input
          type="datetime-local"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          min={startDate}
        />
      </div>
      <button type="submit" className="btn-search">
        🔍 Tìm xe
      </button>
    </form>
  );
};

export default SearchBar;
