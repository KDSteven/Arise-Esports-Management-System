import React from 'react';
import './DeleteModal.css';

const DeleteModal = ({ isOpen, onClose, onConfirm, itemName, itemType = 'member' }) => {
  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal delete-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header" style={{ 
          background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%)',
          color: 'white'
        }}>
          <h2 style={{ color: 'white', margin: 0 }}>
            Confirm Deletion
          </h2>
          <button 
            className="close-btn" 
            onClick={onClose}
            style={{ color: 'white', background: 'transparent', border: 'none' }}
          >
            &times;
          </button>
        </div>
        
        <div className="modal-body">
          <p className="warning-text">
            Are you sure you want to delete this {itemType}?
          </p>
          
          {itemName && (
            <div className="delete-item-info">
              <strong>{itemName}</strong>
            </div>
          )}
          
          <p className="warning-subtext">
            This action cannot be undone.
          </p>
        </div>

        <div className="modal-footer">
          <button 
            type="button" 
            className="btn btn-secondary" 
            onClick={onClose}
          >
            Cancel
          </button>
          <button 
            type="button" 
            className="btn btn-danger" 
            onClick={handleConfirm}
          >
            Delete {itemType}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteModal;