import { useRef, useEffect } from 'react';

function ItemCard({ item, index, isWinner, result, canRemove, onRemove, onChange }) {
  const cardRef = useRef(null);

  // Scroll winner into view
  useEffect(() => {
    if (isWinner && cardRef.current) {
      setTimeout(() => {
        cardRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    }
  }, [isWinner]);

  const handleTitleChange = (e) => {
    onChange(item.id, 'title', e.target.value);
    if (e.target.value.trim() !== '') {
      onChange(item.id, 'customized', true);
    }
  };

  const handleTitleBlur = (e) => {
    if (e.target.value.trim() === '') {
      onChange(item.id, 'customized', false);
      onChange(item.id, 'title', `สินค้าที่ ${index + 1}`);
    }
  };

  return (
    <div
      ref={cardRef}
      className={`item-card${isWinner ? ' winner' : ''}`}
    >
      <div className="winner-badge">🏆 คุ้มที่สุด!</div>
      <div className="item-header">
        <input
          type="text"
          className="item-title-input"
          value={item.title}
          onChange={handleTitleChange}
          onBlur={handleTitleBlur}
        />
        {canRemove && (
          <button
            type="button"
            className="remove-btn"
            title="ลบสินค้านี้"
            onClick={() => onRemove(item.id)}
          >
            ×
          </button>
        )}
      </div>
      <div className="input-group">
        <label htmlFor={`grams-${item.id}`}>ปริมาณ (เช่น กรัม, มล.)</label>
        <input
          type="number"
          step="any"
          min="0.00001"
          id={`grams-${item.id}`}
          placeholder="ระบุปริมาณ(กรัม/มล.)"
          value={item.grams}
          onChange={(e) => onChange(item.id, 'grams', e.target.value)}
          required
        />
      </div>
      <div className="input-group">
        <label htmlFor={`price-${item.id}`}>ราคา</label>
        <input
          type="number"
          step="any"
          min="0.00001"
          id={`price-${item.id}`}
          placeholder="ระบุราคา"
          value={item.price}
          onChange={(e) => onChange(item.id, 'price', e.target.value)}
          required
        />
      </div>
      <div className="result-text">
        {result != null && `ได้ ${result.toFixed(4)} หน่วย / ราคา`}
      </div>
    </div>
  );
}

export default ItemCard;
