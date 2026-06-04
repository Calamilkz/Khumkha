import React from 'react';
import './ConfirmModal.css';

function AlertModal({ isOpen, title, message, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content glass-panel">
        <h3 className="modal-title">{title}</h3>
        <p className="modal-message">{message}</p>
        <div className="modal-actions">
          <button className="btn-confirm" onClick={onClose}>ตกลง</button>
        </div>
      </div>
    </div>
  );
}

export default AlertModal;
