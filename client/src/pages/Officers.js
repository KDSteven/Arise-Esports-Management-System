import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUserPlus, faEdit, faKey, faTrash, faUserCheck, faUserXmark } from '@fortawesome/free-solid-svg-icons';

const API_URL = 'http://127.0.0.1:8080/api';

const Officers = () => {
  const [officers, setOfficers] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [selectedOfficer, setSelectedOfficer] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'Treasurer'
  });
  const [newPassword, setNewPassword] = useState('');

  useEffect(() => {
    fetchOfficers();
    fetchStats();
  }, []);

  const fetchOfficers = async () => {
    try {
      const res = await axios.get(`${API_URL}/officers`);
      setOfficers(res.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching officers:', error);
      setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to fetch officers' });
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await axios.get(`${API_URL}/officers/stats`);
      setStats(res.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (selectedOfficer) {
        // Update officer
        await axios.put(`${API_URL}/officers/${selectedOfficer._id}`, {
          name: formData.name,
          email: formData.email,
          role: formData.role
        });
        setMessage({ type: 'success', text: 'Officer updated successfully!' });
      } else {
        // Create new officer
        await axios.post(`${API_URL}/officers`, formData);
        setMessage({ type: 'success', text: 'Officer created successfully!' });
      }
      
      fetchOfficers();
      fetchStats();
      setShowModal(false);
      resetForm();
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Operation failed' });
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    
    try {
      await axios.put(`${API_URL}/officers/${selectedOfficer._id}/password`, {
        password: newPassword
      });
      setMessage({ type: 'success', text: 'Password reset successfully!' });
      setShowPasswordModal(false);
      setNewPassword('');
      setSelectedOfficer(null);
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to reset password' });
    }
  };

  const handleToggleActive = async (officer) => {
    try {
      await axios.put(`${API_URL}/officers/${officer._id}`, {
        isActive: !officer.isActive
      });
      setMessage({ 
        type: 'success', 
        text: `Officer ${!officer.isActive ? 'activated' : 'deactivated'} successfully!` 
      });
      fetchOfficers();
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update officer status' });
    }
  };

  const handleDelete = async (officerId) => {
    if (window.confirm('Are you sure you want to delete this officer account?')) {
      try {
        await axios.delete(`${API_URL}/officers/${officerId}`);
        setMessage({ type: 'success', text: 'Officer deleted successfully!' });
        fetchOfficers();
        fetchStats();
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      } catch (error) {
        setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to delete officer' });
      }
    }
  };

  const openEditModal = (officer) => {
    setSelectedOfficer(officer);
    setFormData({
      name: officer.name,
      email: officer.email,
      password: '',
      role: officer.role
    });
    setShowModal(true);
  };

  const openPasswordModal = (officer) => {
    setSelectedOfficer(officer);
    setNewPassword('');
    setShowPasswordModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      password: '',
      role: 'Treasurer'
    });
    setSelectedOfficer(null);
  };

  if (loading) {
    return <div className="loading">Loading officers...</div>;
  }

  return (
    <div className="container">
      {/* Statistics Cards */}
      {stats && (
        <div className="stats-grid">
          <div className="stat-card">
            <h3>Total Officers</h3>
            <p>{stats.totalOfficers}</p>
          </div>
          <div className="stat-card">
            <h3>Active Officers</h3>
            <p>{stats.activeOfficers}</p>
          </div>
          <div className="stat-card">
            <h3>Inactive Officers</h3>
            <p>{stats.inactiveOfficers}</p>
          </div>
        </div>
      )}

      {/* Main Card */}
      <div className="card">
        <div className="flex-between mb-20">
          <h2>Officers Management</h2>
          <button 
            className="btn btn-primary" 
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
          >
            <FontAwesomeIcon icon={faUserPlus} /> Add Officer
          </button>
        </div>

        {message.text && (
          <div className={`alert alert-${message.type}`}>
            {message.text}
          </div>
        )}

        {/* Officers Table */}
        <div style={{ overflowX: 'auto' }}>
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {officers.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '40px' }}>
                    No officers found
                  </td>
                </tr>
              ) : (
                officers.map((officer) => (
                  <tr key={officer._id}>
                    <td>{officer.name}</td>
                    <td>{officer.email}</td>
                    <td>
                      <span className={`badge ${
                        officer.role === 'Admin' ? 'badge-danger' : 'badge-success'
                      }`}>
                        {officer.role}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${
                        officer.isActive ? 'badge-success' : 'badge-warning'
                      }`}>
                        {officer.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>{new Date(officer.createdAt).toLocaleDateString()}</td>
                    <td>
                      {officer.role !== 'Admin' && (
                        <div className="actions">
                          <button
                            className="btn btn-sm btn-primary"
                            onClick={() => openEditModal(officer)}
                            title="Edit Officer"
                          >
                            <FontAwesomeIcon icon={faEdit} />
                          </button>
                          <button
                            className="btn btn-sm btn-secondary"
                            onClick={() => openPasswordModal(officer)}
                            title="Reset Password"
                          >
                            <FontAwesomeIcon icon={faKey} />
                          </button>
                          <button
                            className={`btn btn-sm ${officer.isActive ? 'btn-warning' : 'btn-success'}`}
                            onClick={() => handleToggleActive(officer)}
                            title={officer.isActive ? 'Deactivate' : 'Activate'}
                          >
                            <FontAwesomeIcon icon={officer.isActive ? faUserXmark : faUserCheck} />
                          </button>
                          <button
                            className="btn btn-sm btn-danger"
                            onClick={() => handleDelete(officer._id)}
                            title="Delete Officer"
                          >
                            <FontAwesomeIcon icon={faTrash} />
                          </button>
                        </div>
                      )}
                      {officer.role === 'Admin' && (
                        <span style={{ color: '#999', fontSize: '12px' }}>Protected</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Officer Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{selectedOfficer ? 'Edit Officer' : 'Add New Officer'}</h2>
              <button className="close-btn" onClick={() => setShowModal(false)}>×</button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Name *</label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Email *</label>
                <input
                  type="email"
                  className="form-control"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>

              {!selectedOfficer && (
                <div className="form-group">
                  <label>Password *</label>
                  <input
                    type="password"
                    className="form-control"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                    minLength="6"
                  />
                  <small style={{ color: '#666' }}>Minimum 6 characters</small>
                </div>
              )}

              <div className="form-group">
                <label>Role *</label>
                <select
                  className="form-control"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  required
                >
                  <option value="Treasurer">Treasurer</option>
                  <option value="Secretary">Secretary</option>
                  <option value="Auditor">Auditor</option>
                  <option value="President">President</option>
                </select>
              </div>

              <div className="flex-center" style={{ gap: '10px', marginTop: '20px' }}>
                <button type="submit" className="btn btn-primary">
                  {selectedOfficer ? 'Update Officer' : 'Create Officer'}
                </button>
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {showPasswordModal && (
        <div className="modal-overlay" onClick={() => setShowPasswordModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Reset Password</h2>
              <button className="close-btn" onClick={() => setShowPasswordModal(false)}>×</button>
            </div>
            
            <p style={{ marginBottom: '20px', color: '#666' }}>
              Reset password for: <strong>{selectedOfficer?.name}</strong>
            </p>

            <form onSubmit={handleResetPassword}>
              <div className="form-group">
                <label>New Password *</label>
                <input
                  type="password"
                  className="form-control"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength="6"
                  placeholder="Enter new password"
                />
                <small style={{ color: '#666' }}>Minimum 6 characters</small>
              </div>

              <div className="flex-center" style={{ gap: '10px', marginTop: '20px' }}>
                <button type="submit" className="btn btn-primary">
                  Reset Password
                </button>
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => setShowPasswordModal(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Officers;