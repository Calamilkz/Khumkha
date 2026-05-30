import React, { useState, useEffect, useRef } from 'react';
import './Sidebar.css';
import ReCalculateIcon from './Icon/reCalculate.png';
import SearchIcon from './Icon/Search.png';
import AboutIcon from './Icon/About.png';

function Sidebar({ isOpen, onClose, onNewCalc, histories, onDeleteHistory, onRenameHistory, onTogglePin, onLoadHistory, userId }) {
  const [activeMenuId, setActiveMenuId] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const menuRef = useRef(null);

  // Close floating menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setActiveMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Reset search when sidebar closes
  useEffect(() => {
    if (!isOpen) {
      setIsSearching(false);
      setSearchQuery('');
      setActiveMenuId(null);
    }
  }, [isOpen]);

  const toggleMenu = (e, id) => {
    e.stopPropagation();
    setActiveMenuId(prev => prev === id ? null : id);
  };

  const handleMenuAction = (e, action, history) => {
    e.stopPropagation();
    setActiveMenuId(null);
    action(history);
  };

  const toggleSearch = () => {
    if (isSearching) {
      setIsSearching(false);
      setSearchQuery('');
    } else {
      setIsSearching(true);
    }
  };

  // Filter histories based on search query
  const filteredHistories = histories.filter(h => 
    h.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <div className={`sidebar-overlay ${isOpen ? 'open' : ''}`} onClick={onClose}></div>
      
      <div className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-group">
          <button className="sidebar-btn" onClick={onNewCalc}>
            <img src={ReCalculateIcon} alt="New Calc" className="btn-icon" /> คำนวณใหม่
          </button>
          
          <div className="search-container">
            <button className="sidebar-btn" onClick={toggleSearch}>
              <img src={SearchIcon} alt="Search" className="btn-icon" /> ค้นหา
            </button>
            <div className={`search-input-wrapper ${isSearching ? 'open' : ''}`}>
              <input 
                type="text" 
                placeholder="พิมพ์ชื่อประวัติ..."
                className="search-input"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus={isSearching}
              />
              <button className="search-clear-btn" onClick={toggleSearch}>✕</button>
            </div>
          </div>
        </div>

        <div className="sidebar-history-group">
          <h3 className="history-header">ประวัติ</h3>
          <div className="history-list">
            {filteredHistories.length === 0 ? (
              <div className="no-history">ไม่พบประวัติ</div>
            ) : (
              filteredHistories.map(history => (
                <div 
                  key={history.id} 
                  className="history-item"
                  onClick={() => onLoadHistory(history)}
                >
                  <div className="history-info">
                    <span className="history-name">{history.name}</span>
                    <span className="history-date">
                      {history.createdAt ? new Date(history.createdAt.toDate ? history.createdAt.toDate() : history.createdAt).toLocaleDateString('th-TH') : ''}
                    </span>
                  </div>
                  
                  <div className="history-options">
                    {history.isPinned && <span className="pin-indicator">📌</span>}
                    <button 
                      className="icon-btn" 
                      onClick={(e) => toggleMenu(e, history.id)}
                    >
                      <img src={AboutIcon} alt="Options" className="option-icon" />
                    </button>
                    
                    {/* Floating Menu */}
                    {activeMenuId === history.id && (
                      <div className="floating-menu glass-panel" ref={menuRef}>
                        <button onClick={(e) => handleMenuAction(e, onTogglePin, history)}>
                          {history.isPinned ? "เลิกปักหมุด" : "ปักหมุด"}
                        </button>
                        <button onClick={(e) => handleMenuAction(e, onRenameHistory, history)}>
                          เปลี่ยนชื่อ
                        </button>
                        <button className="danger" onClick={(e) => handleMenuAction(e, onDeleteHistory, history)}>
                          ลบ
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {userId && (
          <div className="sidebar-footer">
            <span className="user-id-text">รหัสผู้ใช้: {userId}</span>
          </div>
        )}
      </div>
    </>
  );
}

export default Sidebar;
