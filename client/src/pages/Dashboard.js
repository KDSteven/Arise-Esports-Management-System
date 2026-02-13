import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import Stats from '../components/Stats';

const API_URL = 'http://127.0.0.1:8080/api';

const Dashboard = () => {
  const [stats, setStats] = useState({});
  const [academicYear, setAcademicYear] = useState('2024-2025');
  const [loading, setLoading] = useState(true);
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

useEffect(() => {
  fetchStats();
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [academicYear]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/members/stats/summary?academicYear=${academicYear}`);
      setStats(res.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching stats:', error);
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="card">
        <div className="flex-between">
          <h1>Dashboard</h1>
          <button 
            className="btn btn-primary"
            onClick={() => navigate('/members')}
          >
            View All Members
          </button>
        </div>

        <div className="form-group" style={{ marginTop: '20px', maxWidth: '300px' }}>
          <label>Academic Year</label>
          <select
            className="form-control"
            value={academicYear}
            onChange={(e) => setAcademicYear(e.target.value)}
          >
            <option value="2024-2025">2024-2025</option>
            <option value="2023-2024">2023-2024</option>
            <option value="2022-2023">2022-2023</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="loading">Loading statistics...</div>
      ) : (
        <Stats stats={stats} />
      )}

      <div className="card">
        <h2>Welcome, {user?.name}!</h2>
        <p>You are logged in as: <strong>{user?.role}</strong></p>
        <p style={{ marginTop: '20px', color: '#666' }}>
          Use this system to track organization members, manage payments, and download member lists.
        </p>
      </div>
    </div>
  );
};

export default Dashboard;