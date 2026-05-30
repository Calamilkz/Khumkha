import React, { useState, useEffect } from 'react';
import './ConfirmModal.css'; // We can reuse the same modal overlay styling

function RenameModal({ isOpen, initialName, onConfirm, onCancel }) {
  const [name, setName] = useState('');

  useEffect(() => {
    if (isOpen) {
      setName(initialName || '');
    }
  }, [isOpen, initialName]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content glass-panel">
        <h3 className="modal-title">เปลี่ยนชื่อประวัติ</h3>
        <input 
          type="text" 
          className="rename-input" 
          value={name} 
          onChange={(e) => setName(e.target.value)} 
          autoFocus
        />
        <div className="modal-actions">
          <button className="btn-cancel" onClick={onCancel}>ยกเลิก</button>
          <button className="btn-confirm" onClick={() => onConfirm(name)}>บันทึก</button>
        </div>
      </div>
    </div>
  );
}

export default RenameModal;
