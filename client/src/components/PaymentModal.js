import React, { useState } from 'react';

const PaymentModal = ({ isOpen, onClose, onSubmit, member }) => {
  const [paymentData, setPaymentData] = useState({
    hasPaid: member?.hasPaid || false,
    amountPaid: member?.amountPaid || 0,
    paymentDate: member?.paymentDate ? new Date(member.paymentDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
  });

  const handleChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setPaymentData({
      ...paymentData,
      [e.target.name]: value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(paymentData);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Update Payment Status</h2>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>
              <input
                type="checkbox"
                name="hasPaid"
                checked={paymentData.hasPaid}
                onChange={handleChange}
                style={{ marginRight: '10px' }}
              />
              Mark as Paid
            </label>
          </div>

          {paymentData.hasPaid && (
            <>
              <div className="form-group">
                <label>Amount Paid (PHP) *</label>
                <input
                  type="number"
                  name="amountPaid"
                  className="form-control"
                  value={paymentData.amountPaid}
                  onChange={handleChange}
                  required
                  min="0"
                />
              </div>

              <div className="form-group">
                <label>Payment Date *</label>
                <input
                  type="date"
                  name="paymentDate"
                  className="form-control"
                  value={paymentData.paymentDate}
                  onChange={handleChange}
                  required
                />
              </div>
            </>
          )}

          <div className="flex-between mt-20">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-success">
              Update Payment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PaymentModal;