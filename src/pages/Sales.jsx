import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Plus, Trash2, CheckCircle, Wallet, Clock, Percent, RotateCcw, Pencil } from 'lucide-react';
import { ConfirmationDialog } from '../components/ConfirmationDialog';

const Sales = ({ items, onConfirmSale, salesHistory, routes = [], onAddRoute, onResetDailySales }) => {
  const [shopName, setShopName] = useState('');
  const [selectedRoute, setSelectedRoute] = useState(() => {
    const saved = localStorage.getItem('samindu_sales_selected_route');
    return saved || (routes[0] || '');
  });
  const [newRouteName, setNewRouteName] = useState('');
  const [isCredit, setIsCredit] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const searchInputRef = useRef(null);
  const [suggestStyle, setSuggestStyle] = useState({});
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [editingItemIndex, setEditingItemIndex] = useState(null);
  const [editingItemName, setEditingItemName] = useState('');
  const [selectedDate, setSelectedDate] = useState(() => {
    const saved = localStorage.getItem('samindu_sales_selected_date');
    return saved || new Date().toISOString().split('T')[0];
  });

  // Professional Bill States
  const [qty, setQty] = useState('');
  const [freeQty, setFreeQty] = useState('0');
  const [unitPrice, setUnitPrice] = useState('');
  const [disPercent, setDisPercent] = useState('0');

  const [basket, setBasket] = useState([]);

  useEffect(() => {
    if (!selectedRoute && routes.length > 0) {
      setSelectedRoute(routes[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routes]);

  const filteredItems = useMemo(() => items.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  ), [items, searchTerm]);

  // Position suggestion box correctly below the search input
  useEffect(() => {
    const updatePos = () => {
      const el = searchInputRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const newStyle = {
        position: 'absolute',
        top: `${rect.height}px`,
        left: '0',
        width: `${rect.width}px`,
        zIndex: 30000,
        backgroundColor: 'var(--sidebar-bg)',
        color: 'var(--text-main)',
        border: '1px solid var(--border-color)',
        borderRadius: '0 0 12px 12px',
        boxShadow: '0 10px 30px rgba(0,0,0,0.35)',
        maxHeight: '250px',
        overflowY: 'auto'
      };

      setSuggestStyle(prev => {
        // only update if position/size values changed to avoid render loop
        if (prev.top !== newStyle.top || prev.left !== newStyle.left || prev.width !== newStyle.width) {
          return newStyle;
        }
        return prev;
      });
    };

    if (searchTerm && filteredItems.length > 0) updatePos();

    window.addEventListener('resize', updatePos);
    window.addEventListener('scroll', updatePos, true);
    return () => {
      window.removeEventListener('resize', updatePos);
      window.removeEventListener('scroll', updatePos, true);
    };
  }, [searchTerm, filteredItems.length]);

  // --- BILL CALCULATIONS ---
  const grossValue = (parseFloat(qty) || 0) * (parseFloat(unitPrice) || 0);
  const disVal = grossValue * ((parseFloat(disPercent) || 0) / 100);
  const netLineValue = grossValue - disVal;

  const handleAddRoute = () => {
    if (!newRouteName.trim()) return;
    onAddRoute(newRouteName.trim());
    setSelectedRoute(newRouteName.trim());
    setNewRouteName('');
  };

  // Filter sales for today only (for display)
  const today = new Date().toLocaleDateString();
  const todaysSales = salesHistory.filter(s => new Date(s.date).toLocaleDateString() === today);

  const totalCashValue = todaysSales.filter(s => !s.isCredit).reduce((sum, s) => sum + s.totalBill, 0);
  const totalCreditValue = todaysSales.filter(s => s.isCredit).reduce((sum, s) => sum + s.totalBill, 0);

  const profitOnHand = totalCashValue * 0.08;
  const profitOnCredit = totalCreditValue * 0.08;


  const addToBasket = () => {
    if (!qty || qty <= 0 || !unitPrice || !searchTerm) return;
    const item = items.find(i => i.name === searchTerm);

    const totalPhysicalQty = parseInt(qty) + parseInt(freeQty || 0);
    if (item && totalPhysicalQty > item.lorryQty) {
      alert(`Insufficient stock! Only ${item.lorryQty} available in lorry.`);
      return;
    }

    setBasket([...basket, {
      id: item ? item.id : Date.now(),
      name: searchTerm,
      qty: parseInt(qty),
      freeQty: parseInt(freeQty || 0),
      price: parseFloat(unitPrice),
      grossValue: grossValue,
      disPercent: parseFloat(disPercent || 0),
      disVal: disVal,
      subtotal: netLineValue
    }]);

    setSearchTerm(''); setQty(''); setFreeQty('0'); setUnitPrice(''); setDisPercent('0');
  };

  const handleFinalConfirm = () => {
    if (isCredit && !shopName.trim()) {
      alert("Shop Name is mandatory for Credit sales!");
      return;
    }
    if (!selectedRoute) {
      alert("Please select a route!");
      return;
    }
    if (basket.length === 0) return;

    onConfirmSale(shopName || 'Cash Sale', basket, isCredit, selectedRoute, selectedDate);
    setBasket([]); setShopName(''); setIsCredit(false);
  };

  const handleResetDailySalesConfirm = () => {
    setShowResetConfirm(false);
    if (onResetDailySales) {
      onResetDailySales();
    }
  };

  const handleStartEditItemName = (index, currentName) => {
    setEditingItemIndex(index);
    setEditingItemName(currentName);
  };

  const handleSaveItemName = (index) => {
    if (editingItemName.trim()) {
      const updatedBasket = [...basket];
      updatedBasket[index] = { ...updatedBasket[index], name: editingItemName.trim() };
      setBasket(updatedBasket);
    }
    setEditingItemIndex(null);
    setEditingItemName('');
  };

  const handleCancelEditItemName = () => {
    setEditingItemIndex(null);
    setEditingItemName('');
  };

  return (
    <div className="inventory-container">
      <h1 style={{ marginBottom: '30px', fontSize: '28px', fontWeight: '600', textAlign: 'center' }}>Daily Sales</h1>
      {/* 1. PROFIT SUMMARY CARDS */}
      <div className="dashboard-grid" style={{ marginBottom: '20px' }}>
        <div className="card sales-card green">
          <div className="bill-label"><Wallet size={12} /> Cash Collected Today</div>
          <div className="total-net-amount" style={{ fontSize: '24px' }}>Rs. {totalCashValue.toLocaleString()}</div>
        </div>
        <div className="card sales-card blue">
          <div className="bill-label"><Percent size={12} /> Profit on Hand (8%)</div>
          <div className="total-net-amount" style={{ fontSize: '24px' }}>Rs. {profitOnHand.toLocaleString()}</div>
        </div>
        <div className="card sales-card purple">
          <div className="bill-label"><Clock size={12} /> Profit on Credit (8%)</div>
          <div className="total-net-amount" style={{ fontSize: '24px' }}>Rs. {profitOnCredit.toLocaleString()}</div>
        </div>
        {todaysSales.length > 0 && (
          <button
            className="card sales-card"
            style={{ background: '#d32f2f', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: 'white', border: 'none', padding: '10px' }}
            onClick={() => setShowResetConfirm(true)}
            title="Reset today's daily sales and card values"
          >
            <RotateCcw size={16} />
            <span style={{ fontSize: '14px', fontWeight: '500' }}>Reset Daily Sales</span>
          </button>
        )}
      </div>

      {showResetConfirm && (
        <ConfirmationDialog
          title="Reset Daily Sales?"
          message={`This will delete all ${todaysSales.length} sale(s) from today and restore inventory. This action cannot be undone.`}
          confirmText="Reset"
          cancelText="Cancel"
          isDangerous={true}
          onConfirm={handleResetDailySalesConfirm}
          onCancel={() => setShowResetConfirm(false)}
        />
      )}

      {/* 2. ROUTE & SHOP INFO */}
      <div className="card" style={{ marginBottom: '15px', padding: '15px' }}>
        <div className="bill-header-grid">
          <div className="input-group">
            <label className="bill-label">Date</label>
            <input
              type="date"
              className="inventory-input"
              value={selectedDate}
              onChange={(e) => {
                const newDate = e.target.value;
                setSelectedDate(newDate);
                localStorage.setItem('samindu_sales_selected_date', newDate);
              }}
            />
          </div>
          <div className="input-group">
            <label className="bill-label">Manage Routes</label>
            <div style={{ display: 'flex', gap: '5px' }}>
              <input
                type="text" className="inventory-input"
                placeholder="New..." value={newRouteName}
                onChange={(e) => setNewRouteName(e.target.value)}
              />
              <button className="add-btn" style={{ padding: '0 10px' }} onClick={handleAddRoute}><Plus size={16} /></button>
            </div>
          </div>
          <div className="input-group">
            <label className="bill-label">Select Route</label>
            <select className="inventory-input" value={selectedRoute} onChange={(e) => {
                const newRoute = e.target.value;
                setSelectedRoute(newRoute);
                localStorage.setItem('samindu_sales_selected_route', newRoute);
              }}>
              {routes.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div className="input-group">
            <label className="bill-label">Shop Name</label>
            <input
              type="text" className="inventory-input"
              value={shopName} onChange={(e) => setShopName(e.target.value)}
              placeholder="Enter shop name..."
            />
          </div>
          <div className="input-group" style={{ justifyContent: 'center' }}>
            <label className="credit-toggle">
              <input type="checkbox" checked={isCredit} onChange={(e) => setIsCredit(e.target.checked)} />
              <span>CREDIT SALE</span>
            </label>
          </div>
        </div>
      </div>

      {/* 3. PROFESSIONAL BILL ENTRY FORM */}
      <div className="card allow-overflow" style={{ marginBottom: '20px', background: 'var(--sidebar-bg)', position: 'relative', zIndex: 10 }}>
        <div className="bill-line-grid">
          <div className="input-group" style={{ position: 'relative' }}>
            <label className="bill-label">Item / Search</label>
            <input
              ref={searchInputRef}
              type="text" className="inventory-input"
              value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search items..."
            />
            {searchTerm && filteredItems.length > 0 && (
              <div className="suggestion-box" style={suggestStyle}>
                {filteredItems.map(item => (
                  <div key={item.id} className="suggestion-item" onClick={() => { setSearchTerm(item.name); setUnitPrice((item.price || 0).toString()); }}>
                    <span className="item-name">{item.name}</span>
                    <span className="stock-tag">Lorry: {item.lorryQty}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="input-group"><label className="bill-label">QTY</label><input type="number" className="inventory-input" value={qty} onChange={(e) => setQty(e.target.value)} /></div>
          <div className="input-group"><label className="bill-label">Free</label><input type="number" className="inventory-input" value={freeQty} onChange={(e) => setFreeQty(e.target.value)} /></div>
          <div className="input-group"><label className="bill-label">Rate</label><input type="number" className="inventory-input" value={unitPrice} onChange={(e) => setUnitPrice(e.target.value)} /></div>
          <div className="input-group"><label className="bill-label">Dis%</label><input type="number" className="inventory-input" value={disPercent} onChange={(e) => setDisPercent(e.target.value)} /></div>

          <div className="input-group">
            <label className="bill-label">Dis.Val</label>
            <div className="read-only-box">Rs. {disVal.toFixed(2)}</div>
          </div>

          <div className="input-group">
            <label className="bill-label">Net Value</label>
            <div className="read-only-box highlight">Rs. {netLineValue.toLocaleString()}</div>
          </div>

          <button className="add-btn" onClick={addToBasket} style={{ height: '38px' }}><Plus size={20} /> Add</button>
        </div>
      </div>

      {/* 4. BILL BASKET */}
      <div className="table-container card">
        <table className="inventory-table">
          <thead>
            <tr>
              <th style={{ textAlign: 'left' }}>Item</th>
              <th>Qty + Free</th>
              <th>Rate</th>
              <th>Gross Value</th>
              <th>Dis %</th>
              <th>Net Value</th>
              <th style={{ width: '50px' }}></th>
            </tr>
          </thead>
          <tbody>
            {basket.map((item, i) => (
              <tr key={i}>
                <td className="item-name" style={{ textAlign: 'left' }}>
                  {editingItemIndex === i ? (
                    <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                      <input
                        type="text"
                        className="inventory-input"
                        value={editingItemName}
                        onChange={(e) => setEditingItemName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveItemName(i);
                          if (e.key === 'Escape') handleCancelEditItemName();
                        }}
                        autoFocus
                        style={{ minWidth: '150px', padding: '4px 8px', fontSize: '14px' }}
                      />
                      <button
                        className="add-btn"
                        onClick={() => handleSaveItemName(i)}
                        style={{ padding: '4px 8px', minWidth: 'auto', height: '28px', fontSize: '12px' }}
                      >
                        Save
                      </button>
                      <button
                        className="delete-icon-btn"
                        onClick={handleCancelEditItemName}
                        style={{ padding: '4px 8px' }}
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%' }}>
                      <span style={{ flex: 1 }}>{item.name}</span>
                      <button
                        className="delete-icon-btn"
                        onClick={() => handleStartEditItemName(i, item.name)}
                        title="Rename item"
                        style={{ opacity: 0.7 }}
                      >
                        <Pencil size={16} />
                      </button>
                    </div>
                  )}
                </td>
                <td>{item.qty} + <span style={{ color: 'var(--accent-color)' }}>{item.freeQty}</span></td>
                <td>{item.price.toLocaleString()}</td>
                <td>{item.grossValue.toLocaleString()}</td>
                <td>{item.disPercent}%</td>
                <td className="item-total-value">Rs. {item.subtotal.toLocaleString()}</td>
                <td><button className="delete-icon-btn" onClick={() => setBasket(basket.filter((_, idx) => idx !== i))}><Trash2 size={16} /></button></td>
              </tr>
            ))}
            {basket.length === 0 && (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-light)' }}>
                  Your basket is empty. Search for an item to begin.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {basket.length > 0 && (
          <div className="net-value-footer">
            <div style={{ textAlign: 'left' }}>
              <span className="bill-label">Total Items: {basket.length}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '30px' }}>
              <div style={{ textAlign: 'right' }}>
                <div className="bill-label">Grand Total Net Value</div>
                <div className="total-net-amount" style={{ color: isCredit ? '#5c2d91' : '#107c10' }}>
                  Rs. {basket.reduce((sum, item) => sum + item.subtotal, 0).toLocaleString()}
                </div>
              </div>
              <button className="add-btn" style={{ background: isCredit ? '#5c2d91' : '#107c10', minWidth: '220px', height: '50px' }} onClick={handleFinalConfirm}>
                <CheckCircle size={20} style={{ marginRight: '8px' }} /> Confirm {isCredit ? 'Credit' : 'Cash'} Sale
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Sales;