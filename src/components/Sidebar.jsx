import React, { useState, useEffect, useRef } from 'react';
import './Sidebar.css';
import ReCalculateIcon from './Icon/reCalculate.png';
import SearchIcon from './Icon/Search.png';
import AboutIcon from './Icon/About.png';
import CopyIcon from './Icon/copy.png';
import SwapIcon from './Icon/swap.png';
import CheckIcon from './Icon/check.png';
import CloseIcon from './Icon/close.png';

function Sidebar({ 
  isOpen, onClose, onNewCalc, histories, onDeleteHistory, onRenameHistory, onTogglePin, onLoadHistory, 
  userId, isInAppBrowser, allAccounts, onGenerateNewAccount, onSwitchAccount, onAddExistingAccount, onDeleteAccountPrompt
}) {
  const [activeMenuId, setActiveMenuId] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const menuRef = useRef(null);

  // Switcher states
  const [isSwitcherOpen, setIsSwitcherOpen] = useState(false);
  const [isEnteringId, setIsEnteringId] = useState(false);
  const [newAccountId, setNewAccountId] = useState('');
  const [historyInputId, setHistoryInputId] = useState('');
  const switcherRef = useRef(null);
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(userId);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  // Close floating menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setActiveMenuId(null);
      }
      if (switcherRef.current && !switcherRef.current.contains(event.target)) {
        setIsSwitcherOpen(false);
        setIsEnteringId(false);
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
      setIsSwitcherOpen(false);
      setIsEnteringId(false);
      setHistoryInputId('');
      setNewAccountId('');
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
            {!userId ? (
              isInAppBrowser ? (
                <div className="history-warning-box">
                  <p>หากไม่อยากสูญเสียประวัติ ให้เปิดด้วยเบราว์เซอร์เริ่มต้นของเครื่อง หรือกรอก ID ของคุณเพื่อซิงค์ข้อมูล</p>
                  <div className="history-input-group mt-2">
                    <input 
                      type="text" 
                      placeholder="วาง ID ของคุณที่นี่..." 
                      value={historyInputId}
                      onChange={(e) => setHistoryInputId(e.target.value)}
                    />
                    <button onClick={async () => {
                      if(historyInputId) {
                        const success = await onAddExistingAccount(historyInputId);
                        if(success) setHistoryInputId('');
                      }
                    }}>ซิงค์ข้อมูล</button>
                  </div>
                </div>
              ) : (
                <div className="history-warning-box">
                  <p>หากไม่อยากสูญเสียประวัติ คุณสามารถสมัคร ID ใหม่ หรือกรอก ID ของคุณที่คัดลอกมาเพื่อใช้งาน</p>
                  <button className="btn-create-id" onClick={onGenerateNewAccount}>สมัคร ID ใหม่</button>
                  <div className="history-input-group mt-2">
                    <input 
                      type="text" 
                      placeholder="วาง ID ของคุณที่นี่..." 
                      value={historyInputId}
                      onChange={(e) => setHistoryInputId(e.target.value)}
                    />
                    <button onClick={async () => {
                      if(historyInputId) {
                        const success = await onAddExistingAccount(historyInputId);
                        if(success) setHistoryInputId('');
                      }
                    }}>ตกลง</button>
                  </div>
                </div>
              )
            ) : filteredHistories.length === 0 ? (
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

        <div className="sidebar-footer">
          {userId ? (
            <div className="account-switcher">
              <span className="user-id-text">ID ปัจจุบันของคุณ: {userId}</span>
              <div className="account-actions">
                <button className="icon-btn copy-btn-wrapper" title="คัดลอก ID" onClick={handleCopy}>
                  <img src={CopyIcon} alt="Copy" className={`option-icon copy-icon ${isCopied ? 'hidden' : ''}`} />
                  <img src={CheckIcon} alt="Copied" className={`option-icon check-icon ${isCopied ? 'visible' : ''}`} />
                </button>
                <div className="switcher-wrapper" ref={switcherRef}>
                  <button className="icon-btn" title="สลับบัญชี" onClick={() => setIsSwitcherOpen(!isSwitcherOpen)}>
                    <img src={SwapIcon} alt="Swap" className="option-icon" />
                  </button>
                  {isSwitcherOpen && (
                    <div className="floating-menu switcher-menu glass-panel">
                      <div className="accounts-list">
                        {allAccounts.map(accId => (
                          <div className="account-item-wrapper" key={accId}>
                            <button className={`account-select-btn ${accId === userId ? 'active' : ''}`} onClick={() => {
                              onSwitchAccount(accId);
                              setIsSwitcherOpen(false);
                              setIsEnteringId(false);
                            }}>
                              {accId === userId ? `✓ ${accId}` : accId}
                            </button>
                            <button className="icon-btn delete-acc-btn" title="ลบ" onClick={(e) => {
                              e.stopPropagation();
                              onDeleteAccountPrompt(accId);
                            }}>
                              <img src={CloseIcon} alt="Delete" className="option-icon" style={{width: '10px', height: '10px'}} />
                            </button>
                          </div>
                        ))}
                      </div>
                      <div className="menu-divider"></div>
                      <button onClick={() => {
                        onGenerateNewAccount();
                        setIsSwitcherOpen(false);
                        setIsEnteringId(false);
                      }}>
                        สมัคร ID ใหม่
                      </button>
                      <button onClick={() => setIsEnteringId(!isEnteringId)}>
                        กรอก ID อื่น
                      </button>
                      
                      {isEnteringId && (
                        <div className="enter-id-slide">
                          <input 
                            type="text" 
                            placeholder="วาง ID ที่นี่..."
                            value={newAccountId}
                            onChange={(e) => setNewAccountId(e.target.value)}
                          />
                          <button className="btn-confirm-id" onClick={async () => {
                            if(newAccountId) {
                              const success = await onAddExistingAccount(newAccountId);
                              if (success) {
                                setNewAccountId('');
                                setIsSwitcherOpen(false);
                                setIsEnteringId(false);
                              }
                            }
                          }}>ตกลง</button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <span className="user-id-text">ยังไม่มี ID</span>
          )}
        </div>
      </div>
    </>
  );
}

export default Sidebar;
