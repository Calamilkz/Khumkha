import React from 'react';
import './ConfirmModal.css';

function ConfirmModal({ isOpen, title, message, onConfirm, onCancel }) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content glass-panel">
        <h3 className="modal-title">{title}</h3>
        <p className="modal-message">{message}</p>
        <div className="modal-actions">
          <button className="btn-cancel" onClick={onCancel}>ยกเลิก</button>
          <button className="btn-confirm danger" onClick={onConfirm}>ลบประวัติ</button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmModal;
