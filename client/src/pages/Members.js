import React, { useState, useEffect } from 'react';
import axios from 'axios';
import MemberModal from '../components/MemberModal';
import PaymentModal from '../components/PaymentModal';
import { exportToCSV, formatCurrency } from '../utils/helpers';

const API_URL = 'http://127.0.0.1:8080/api';

const Members = () => {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [filters, setFilters] = useState({
    academicYear: '',
    hasPaid: '',
    status: '',
    search: ''
  });
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchMembers();
  }, [filters]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchMembers = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.academicYear) params.append('academicYear', filters.academicYear);
      if (filters.hasPaid !== '') params.append('hasPaid', filters.hasPaid);
      if (filters.status) params.append('status', filters.status);
      if (filters.search) params.append('search', filters.search);

      const res = await axios.get(`${API_URL}/members?${params}`);
      setMembers(res.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching members:', error);
      setLoading(false);
    }
  };

  const handleAddMember = async (memberData) => {
    try {
      await axios.post(`${API_URL}/members`, memberData);
      setMessage({ type: 'success', text: 'Member added successfully!' });
      fetchMembers();
      setShowMemberModal(false);
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to add member' });
    }
  };

  const handleEditMember = async (memberData) => {
    try {
      await axios.put(`${API_URL}/members/${selectedMember._id}`, memberData);
      setMessage({ type: 'success', text: 'Member updated successfully!' });
      fetchMembers();
      setShowMemberModal(false);
      setSelectedMember(null);
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to update member' });
    }
  };

  const handleUpdatePayment = async (paymentData) => {
    try {
      await axios.put(`${API_URL}/members/${selectedMember._id}/payment`, paymentData);
      setMessage({ type: 'success', text: 'Payment updated successfully!' });
      fetchMembers();
      setShowPaymentModal(false);
      setSelectedMember(null);
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to update payment' });
    }
  };

  const handleDeleteMember = async (memberId) => {
    if (window.confirm('Are you sure you want to delete this member?')) {
      try {
        await axios.delete(`${API_URL}/members/${memberId}`);
        setMessage({ type: 'success', text: 'Member deleted successfully!' });
        fetchMembers();
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      } catch (error) {
        setMessage({ type: 'error', text: 'Failed to delete member' });
      }
    }
  };

  const handleDownloadList = () => {
    const csvData = members.map(member => ({
      'Student ID': member.studentId,
      'First Name': member.firstName,
      'Last Name': member.lastName,
      'Email': member.email,
      'Phone': member.phoneNumber,
      'Course': member.course,
      'Year Level': member.yearLevel,
      'Academic Year': member.academicYear,
      'Status': member.status,
      'Has Paid': member.hasPaid ? 'Yes' : 'No',
      'Amount Paid': member.amountPaid || 0,
      'Payment Date': member.paymentDate ? new Date(member.paymentDate).toLocaleDateString() : '',
      'Remarks': member.remarks || ''
    }));

    exportToCSV(csvData, `members_${new Date().toISOString().split('T')[0]}.csv`);
  };

  if (loading) {
    return <div className="loading">Loading members...</div>;
  }

  return (
    <div className="container">
      <div className="card">
        <div className="flex-between mb-20">
          <h2>Members Management</h2>
          <div className="flex-center" style={{ gap: '10px' }}>
            <button className="btn btn-secondary" onClick={handleDownloadList}>
              Download List
            </button>
            <button className="btn btn-primary" onClick={() => setShowMemberModal(true)}>
              Add New Member
            </button>
          </div>
        </div>

        {message.text && (
          <div className={`alert alert-${message.type}`}>
            {message.text}
          </div>
        )}

        <div className="filters">
          <div className="filter-group">
            <label>Academic Year</label>
            <input
              type="text"
              placeholder="e.g., 2024-2025"
              value={filters.academicYear}
              onChange={(e) => setFilters({ ...filters, academicYear: e.target.value })}
            />
          </div>

          <div className="filter-group">
            <label>Payment Status</label>
            <select
              value={filters.hasPaid}
              onChange={(e) => setFilters({ ...filters, hasPaid: e.target.value })}
            >
              <option value="">All</option>
              <option value="true">Paid</option>
              <option value="false">Unpaid</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Member Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            >
              <option value="">All</option>
              <option value="Pending">Pending</option>
              <option value="Official Member">Official Member</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Search</label>
            <input
              type="text"
              placeholder="Search by name, ID, email..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            />
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="table">
            <thead>
              <tr>
                <th>Student ID</th>
                <th>Name</th>
                <th>Course</th>
                <th>Year Level</th>
                <th>Status</th>
                <th>Payment</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {members.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '40px' }}>
                    No members found
                  </td>
                </tr>
              ) : (
                members.map((member) => (
                  <tr key={member._id}>
                    <td>{member.studentId}</td>
                    <td>{member.firstName} {member.lastName}</td>
                    <td>{member.course}</td>
                    <td>{member.yearLevel}</td>
                    <td>
                      <span className={`badge badge-${
                        member.status === 'Official Member' ? 'success' :
                        member.status === 'Pending' ? 'warning' : 'danger'
                      }`}>
                        {member.status}
                      </span>
                    </td>
                    <td>
                      <span className={`badge badge-${member.hasPaid ? 'success' : 'danger'}`}>
                        {member.hasPaid ? 'Paid' : 'Unpaid'}
                      </span>
                    </td>
                    <td>
                      <div className="actions">
                        <button
                          className="btn btn-sm btn-secondary"
                          onClick={() => {
                            setSelectedMember(member);
                            setShowDetailsModal(true);
                          }}
                        >
                          View
                        </button>
                        <button
                          className="btn btn-sm btn-primary"
                          onClick={() => {
                            setSelectedMember(member);
                            setShowMemberModal(true);
                          }}
                        >
                          Edit
                        </button>
                        <button
                          className="btn btn-sm btn-success"
                          onClick={() => {
                            setSelectedMember(member);
                            setShowPaymentModal(true);
                          }}
                        >
                          Payment
                        </button>
                        <button
                          className="btn btn-sm btn-danger"
                          onClick={() => handleDeleteMember(member._id)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Member Modal for Add/Edit */}
      {showMemberModal && (
        <MemberModal
          member={selectedMember}
          onClose={() => {
            setShowMemberModal(false);
            setSelectedMember(null);
          }}
          onSubmit={selectedMember ? handleEditMember : handleAddMember}
        />
      )}

      {/* Payment Modal */}
      {showPaymentModal && selectedMember && (
        <PaymentModal
          member={selectedMember}
          onClose={() => {
            setShowPaymentModal(false);
            setSelectedMember(null);
          }}
          onSubmit={handleUpdatePayment}
        />
      )}

      {/* Details Modal */}
      {showDetailsModal && selectedMember && (
        <div className="modal-overlay" onClick={() => setShowDetailsModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Member Details</h2>
              <button className="close-btn" onClick={() => setShowDetailsModal(false)}>
                ×
              </button>
            </div>
            <div className="member-details">
              <div className="detail-row">
                <strong>Student ID:</strong>
                <span>{selectedMember.studentId}</span>
              </div>
              <div className="detail-row">
                <strong>Full Name:</strong>
                <span>{selectedMember.firstName} {selectedMember.lastName}</span>
              </div>
              <div className="detail-row">
                <strong>Email:</strong>
                <span>{selectedMember.email}</span>
              </div>
              <div className="detail-row">
                <strong>Phone Number:</strong>
                <span>{selectedMember.phoneNumber}</span>
              </div>
              <div className="detail-row">
                <strong>Course:</strong>
                <span>{selectedMember.course}</span>
              </div>
              <div className="detail-row">
                <strong>Year Level:</strong>
                <span>{selectedMember.yearLevel}</span>
              </div>
              <div className="detail-row">
                <strong>Academic Year:</strong>
                <span>{selectedMember.academicYear}</span>
              </div>
              <div className="detail-row">
                <strong>Status:</strong>
                <span className={`badge badge-${
                  selectedMember.status === 'Official Member' ? 'success' :
                  selectedMember.status === 'Pending' ? 'warning' : 'danger'
                }`}>
                  {selectedMember.status}
                </span>
              </div>
              <div className="detail-row">
                <strong>Payment Status:</strong>
                <span className={`badge badge-${selectedMember.hasPaid ? 'success' : 'danger'}`}>
                  {selectedMember.hasPaid ? 'Paid' : 'Unpaid'}
                </span>
              </div>
              {selectedMember.hasPaid && (
                <>
                  <div className="detail-row">
                    <strong>Amount Paid:</strong>
                    <span>{formatCurrency(selectedMember.amountPaid)}</span>
                  </div>
                  <div className="detail-row">
                    <strong>Payment Date:</strong>
                    <span>{new Date(selectedMember.paymentDate).toLocaleDateString()}</span>
                  </div>
                </>
              )}
              {selectedMember.remarks && (
                <div className="detail-row">
                  <strong>Remarks:</strong>
                  <span>{selectedMember.remarks}</span>
                </div>
              )}
              <div className="detail-row">
                <strong>Registration Date:</strong>
                <span>{new Date(selectedMember.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Members;