import { useState, useCallback, useEffect } from 'react';
import ItemCard from './components/ItemCard';
import Sidebar from './components/Sidebar';
import ConfirmModal from './components/ConfirmModal';
import RenameModal from './components/RenameModal';
import ExplanIcon from './components/Icon/Explan.png';
import { db } from './firebase';
import { collection, addDoc, getDocs, query, deleteDoc, doc, updateDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import './App.css';

let nextId = 0;
function createId() {
  return `item-${Date.now()}-${++nextId}`;
}

function createItem(index) {
  return {
    id: createId(),
    title: `สินค้าที่ ${index + 1}`,
    grams: '',
    price: '',
    customized: false,
  };
}

function App() {
  const [userId, setUserId] = useState(null);
  const [items, setItems] = useState(() => [createItem(0), createItem(1)]);
  const [results, setResults] = useState({});
  const [winnerId, setWinnerId] = useState(null);
  const [showError, setShowError] = useState(false);
  
  // Sidebar & Modals state
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [histories, setHistories] = useState([]);
  
  const [historyToDelete, setHistoryToDelete] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  
  const [historyToRename, setHistoryToRename] = useState(null);
  const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);

  // Track the current active history document ID
  const [currentHistoryId, setCurrentHistoryId] = useState(null);

  // Authentication
  useEffect(() => {
    let id = localStorage.getItem('khumkha_user_id');
    if (!id) {
      id = crypto.randomUUID ? crypto.randomUUID() : `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('khumkha_user_id', id);
    }
    setUserId(id);
  }, []);

  // Fetch histories
  const fetchHistories = useCallback(async () => {
    if (!userId) return;
    try {
      const q = query(collection(db, 'histories', userId, 'Data'));
      const querySnapshot = await getDocs(q);
      let fetchedHistories = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Client-side sort: Pinned first, then by date
      fetchedHistories.sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        
        const timeA = a.isPinned ? (a.pinnedAt?.toMillis?.() || 0) : (a.createdAt?.toMillis?.() || 0);
        const timeB = b.isPinned ? (b.pinnedAt?.toMillis?.() || 0) : (b.createdAt?.toMillis?.() || 0);
        return timeB - timeA; // Descending
      });
      
      setHistories(fetchedHistories);
    } catch (error) {
      console.error("Error fetching histories: ", error);
    }
  }, [userId]);

  useEffect(() => {
    fetchHistories();
  }, [fetchHistories]);

  const resetResults = useCallback(() => {
    setResults({});
    setWinnerId(null);
    setShowError(false);
  }, []);

  const handleAddItem = useCallback(() => {
    setItems((prev) => {
      const newItem = createItem(prev.length);
      return [...prev, newItem];
    });
    resetResults();
  }, [resetResults]);

  const handleRemoveItem = useCallback((id) => {
    setItems((prev) => {
      if (prev.length <= 2) return prev;
      const filtered = prev.filter((item) => item.id !== id);
      return filtered.map((item, index) => {
        if (!item.customized) {
          return { ...item, title: `สินค้าที่ ${index + 1}` };
        }
        return item;
      });
    });
    resetResults();
  }, [resetResults]);

  const handleChangeItem = useCallback((id, field, value) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      )
    );
  }, []);

  // Save history to Firebase automatically
  const autoSaveHistory = async (currentItems) => {
    if (!userId) return;
    
    // Generate name based on first and second item
    const namePart1 = currentItems[0]?.title || 'สินค้า 1';
    const namePart2 = currentItems[1]?.title || 'สินค้า 2';
    const historyName = `${namePart1} ${namePart2}`;

    try {
      // Create or update the user document to store the UID field
      await setDoc(doc(db, 'histories', userId), { UID: userId }, { merge: true });

      const itemsData = currentItems.map(item => ({
        title: item.title,
        grams: parseFloat(item.grams),
        price: parseFloat(item.price),
        customized: item.customized
      }));

      if (currentHistoryId) {
        // Update existing history document (do not overwrite 'name' so user renames are kept)
        await updateDoc(doc(db, 'histories', userId, 'Data', currentHistoryId), {
          items: itemsData,
          updatedAt: serverTimestamp()
        });
      } else {
        // Create new history document
        const historyData = {
          name: historyName,
          items: itemsData,
          createdAt: serverTimestamp(),
          isPinned: false
        };
        const docRef = await addDoc(collection(db, 'histories', userId, 'Data'), historyData);
        setCurrentHistoryId(docRef.id); // Save ID for future updates in this session
      }
      
      fetchHistories(); // Refresh list silently
    } catch (error) {
      console.error("Error auto-saving history: ", error);
    }
  };

  const handleCompare = useCallback(
    (e, itemsToCompare = items) => {
      if (e) e.preventDefault();
      resetResults();

      let isValid = true;
      const newResults = {};
      let maxValue = -Infinity;
      let maxId = null;

      for (const item of itemsToCompare) {
        const grams = parseFloat(item.grams);
        const price = parseFloat(item.price);

        if (isNaN(grams) || isNaN(price) || grams <= 0 || price <= 0) {
          isValid = false;
          break;
        }

        const value = grams / price;
        newResults[item.id] = value;

        if (value > maxValue) {
          maxValue = value;
          maxId = item.id;
        }
      }

      if (!isValid) {
        setShowError(true);
        return;
      }

      setResults(newResults);
      setWinnerId(maxId);

      // Trigger auto-save on manual compare event
      if (e) {
        autoSaveHistory(itemsToCompare);
      }
    },
    [items, resetResults, autoSaveHistory]
  );

  // History Interactions
  const onLoadHistory = (history) => {
    // Regenerate unique IDs for the items so they play nice with React keys,
    // while keeping the data.
    const newItems = history.items.map(item => ({
      id: createId(),
      title: item.title,
      grams: item.grams,
      price: item.price,
      customized: item.customized ?? true
    }));
    
    setItems(newItems);
    setCurrentHistoryId(history.id); // Set active history ID
    setIsSidebarOpen(false);
    
    // Calculate results immediately after loading
    handleCompare(null, newItems);
  };

  const openDeleteModal = (history) => {
    setHistoryToDelete(history);
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteHistory = async () => {
    if (!historyToDelete) return;
    try {
      await deleteDoc(doc(db, 'histories', userId, 'Data', historyToDelete.id));
      if (currentHistoryId === historyToDelete.id) {
        setCurrentHistoryId(null); // Clear active ID if we deleted the current one
      }
      setIsDeleteModalOpen(false);
      setHistoryToDelete(null);
      fetchHistories();
    } catch (error) {
      console.error("Error deleting history: ", error);
      alert('เกิดข้อผิดพลาดในการลบ');
    }
  };

  const openRenameModal = (history) => {
    setHistoryToRename(history);
    setIsRenameModalOpen(true);
  };

  const confirmRenameHistory = async (newName) => {
    if (!newName || !historyToRename || newName === historyToRename.name) {
      setIsRenameModalOpen(false);
      setHistoryToRename(null);
      return;
    }

    try {
      await updateDoc(doc(db, 'histories', userId, 'Data', historyToRename.id), {
        name: newName
      });
      setIsRenameModalOpen(false);
      setHistoryToRename(null);
      fetchHistories();
    } catch (error) {
      console.error("Error renaming history: ", error);
      alert('เกิดข้อผิดพลาดในการแก้ไขชื่อ');
    }
  };

  const togglePinHistory = async (history) => {
    try {
      await updateDoc(doc(db, 'histories', userId, 'Data', history.id), {
        isPinned: !history.isPinned,
        pinnedAt: !history.isPinned ? serverTimestamp() : null
      });
      fetchHistories();
    } catch (error) {
      console.error("Error toggling pin: ", error);
    }
  };

  // Sidebar Actions
  const handleNewCalc = () => {
    setItems([createItem(0), createItem(1)]);
    resetResults();
    setCurrentHistoryId(null); // Clear active ID for a fresh session
    setIsSidebarOpen(false);
  };

  return (
    <div className="container">
      {/* Menu Button */}
      {!isSidebarOpen && (
        <button 
          className="menu-btn glass-panel" 
          onClick={() => setIsSidebarOpen(true)}
          title="เปิดเมนู"
        >
          <img src={ExplanIcon} alt="Menu" style={{ width: '28px', height: '28px', objectFit: 'contain' }} />
        </button>
      )}

      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
        onNewCalc={handleNewCalc}
        histories={histories}
        onDeleteHistory={openDeleteModal}
        onRenameHistory={openRenameModal}
        onTogglePin={togglePinHistory}
        onLoadHistory={onLoadHistory}
        userId={userId}
      />

      <ConfirmModal 
        isOpen={isDeleteModalOpen}
        title="ยืนยันการลบประวัติ"
        message={`คุณต้องการลบ "${historyToDelete?.name}" ใช่หรือไม่?`}
        onConfirm={confirmDeleteHistory}
        onCancel={() => {
          setIsDeleteModalOpen(false);
          setHistoryToDelete(null);
        }}
      />

      <RenameModal
        isOpen={isRenameModalOpen}
        initialName={historyToRename?.name || ''}
        onConfirm={confirmRenameHistory}
        onCancel={() => {
          setIsRenameModalOpen(false);
          setHistoryToRename(null);
        }}
      />

      <h1>KhumKha</h1>
      <p className="subtitle">
        เปรียบเทียบราคาสินค้าหาความคุ้มค่าที่สุด (ยิ่งได้ปริมาณต่อราคามาก ยิ่งคุ้ม!)
      </p>

      <form id="compareForm" onSubmit={(e) => handleCompare(e)}>
        <div className="glass-panel">
          <div className="items-grid">
            {items.map((item, index) => (
              <ItemCard
                key={item.id}
                item={item}
                index={index}
                isWinner={item.id === winnerId}
                result={results[item.id] ?? null}
                canRemove={index >= 2}
                onRemove={handleRemoveItem}
                onChange={handleChangeItem}
              />
            ))}
          </div>
        </div>

        <div className="actions">
          <button type="button" className="btn-add" onClick={handleAddItem}>
            + เพิ่มสินค้า
          </button>
          <button type="submit" className="btn-compare">
            เปรียบเทียบความคุ้มค่า
          </button>
        </div>

        <p className={`error-message${showError ? ' visible' : ''}`}>
          กรุณากรอกข้อมูลปริมาณและราคาให้ครบทุกช่อง และต้องมากกว่า 0
        </p>
      </form>
    </div>
  );
}

export default App;
