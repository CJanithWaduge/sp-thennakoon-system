import React, { useState } from 'react';
import { Truck, Warehouse, Trash2, Search, Plus, AlertTriangle, Pencil, Check, X, Calendar } from 'lucide-react';
import { calculateTotalAssets, formatCurrency } from '../utils/calculations';

const Inventory = ({ items, setItems, addItem, updateItem, deleteItemFromDb, searchTerm }) => {
  const [inputValues, setInputValues] = useState({});
  const [newItemName, setNewItemName] = useState('');
  const [addingItem, setAddingItem] = useState(false);
  const [localSearchTerm, setLocalSearchTerm] = useState(searchTerm || '');
  const [editingItemId, setEditingItemId] = useState(null);
  const [editingItemName, setEditingItemName] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  // Default threshold for low stock (could be moved to Settings later)
  const LOW_STOCK_THRESHOLD = 10;

  const filteredItems = items.filter(item =>
    item.name.toLowerCase().includes((localSearchTerm || '').toLowerCase())
  );

  // Enable compact mode when inventory exceeds 20 items
  const isCompactMode = items.length > 20;

  const addItemHandler = async () => {
    if (newItemName.trim() === '' || addingItem) return;
    setAddingItem(true);
    const newItemData = {
      createdAt: new Date(selectedDate).toISOString(),
      name: newItemName.trim(),
      whQty: 0,
      lorryQty: 0,
      buyingPrice: 0,
      sellingPrice: 0
    };
    // addItem saves to Firestore and returns the item with its real Firebase ID
    await addItem(newItemData);
    setNewItemName('');
    setAddingItem(false);
  };

  const handleInputChange = (id, field, value) => {
    setInputValues({
      ...inputValues,
      [`${id}-${field}`]: value
    });
  };

  const handleAddWarehouse = (id) => {
    const qty = parseInt(inputValues[`${id}-qty`] || 0);
    const billValue = parseFloat(inputValues[`${id}-bill`] || 0);

    if (qty <= 0) return;

    const item = items.find(i => i.id === id);
    if (!item) return;

    // Calculate new buying price based on weighted average
    const currentWhQty = item.whQty || 0;
    const currentTotalValue = currentWhQty * (item.buyingPrice || 0);
    const newTotalValue = currentTotalValue + billValue;
    const newWhQty = currentWhQty + qty;
    const newUnitPrice = newWhQty > 0 ? newTotalValue / newWhQty : 0;

    setItems(items.map(i => {
      if (i.id === id) {
        return { ...i, whQty: newWhQty, buyingPrice: newUnitPrice };
      }
      return i;
    }));

    // Persist to Firestore immediately
    updateItem(id, { whQty: newWhQty, buyingPrice: newUnitPrice });

    handleInputChange(id, 'qty', '');
    handleInputChange(id, 'bill', '');
  };

  const handleLoadLorry = (id) => {
    const amount = parseInt(inputValues[`${id}-load`] || 0);
    const item = items.find(i => i.id === id);

    if (amount <= 0 || (item.whQty || 0) < amount) {
      alert("Insufficient Warehouse stock!");
      return;
    }

    const itemName = item?.name || 'Unknown Item';

    const newWhQty = (item.whQty || 0) - amount;
    const newLorryQty = (item.lorryQty || 0) + amount;

    setItems(items.map(item =>
      item.id === id ? {
        ...item,
        whQty: newWhQty,
        lorryQty: newLorryQty
      } : item
    ));

    // Persist to Firestore immediately
    updateItem(id, { whQty: newWhQty, lorryQty: newLorryQty });

    handleInputChange(id, 'load', '');
  };

  const deleteItem = async (id) => {
    if (window.confirm("Delete this item?")) {
      setItems(items.filter(item => item.id !== id));
      // Persist deletion to Firestore immediately
      await deleteItemFromDb(id);
    }
  };

  const handleStartEditItemName = (id, currentName) => {
    setEditingItemId(id);
    setEditingItemName(currentName);
  };

  const handleSaveItemName = (id) => {
    if (editingItemName.trim()) {
      setItems(items.map(item =>
        item.id === id ? { ...item, name: editingItemName.trim() } : item
      ));
      // Persist rename to Firestore immediately
      updateItem(id, { name: editingItemName.trim() });
    }
    setEditingItemId(null);
    setEditingItemName('');
  };

  const handleCancelEditItemName = () => {
    setEditingItemId(null);
    setEditingItemName('');
  };

  return (
    <div className="inventory-container">
      <h1 style={{ marginBottom: '30px', fontSize: '28px', fontWeight: '600', textAlign: 'center' }}>Inventory Control</h1>

      {/* Date Selection Header */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: '10px',
          background: 'var(--glass-bg)', padding: '8px 15px', borderRadius: '8px',
          border: '1px solid var(--border-color)'
        }}>
          <Calendar size={16} style={{ color: 'var(--text-date)' }} />
          <span style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-date)' }}>Transaction Date:</span>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="inventory-input"
            style={{ border: 'none', background: 'transparent', color: 'var(--text-main)', fontSize: '14px' }}
          />
        </div>
      </div>

      <div className="pill-header">
        <div className="search-section">
          <Search size={18} />
          <input
            type="text"
            placeholder="Search Inventory..."
            value={localSearchTerm}
            onChange={(e) => setLocalSearchTerm(e.target.value)}
          />
        </div>

        <input
          type="text"
          className="new-item-input"
          placeholder="New Item Name"
          value={newItemName}
          onChange={(e) => setNewItemName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addItemHandler()}
        />

        <button className="add-btn" onClick={addItemHandler} disabled={addingItem}>
          <Plus size={16} /> {addingItem ? 'Adding...' : 'Add Item'}
        </button>
      </div>

      <div className="table-container card">
        <table className={`inventory-table ${isCompactMode ? 'compact' : ''}`}>
          <thead>
            <tr>
              <th>Item Name</th>
              <th>Wh. Qty</th>
              <th>Lorry Qty</th>
              <th>Total QTY</th>
              <th>Total Value (Rs.)</th>
              <th style={{ textAlign: 'center' }}>Restock (Bill)</th>
              <th style={{ textAlign: 'center' }}>Load Lorry</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filteredItems.map(item => {
              const whQty = item.whQty || 0;
              const lorryQty = item.lorryQty || 0;
              const totalQty = whQty + lorryQty;
              const totalValue = totalQty * (item.buyingPrice || 0);
              const isLowStock = totalQty < LOW_STOCK_THRESHOLD;

              return (
                <tr key={item.id}>
                  <td className="item-name">
                    {editingItemId === item.id ? (
                      <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                        <input
                          type="text"
                          className="inventory-input"
                          value={editingItemName}
                          onChange={(e) => setEditingItemName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveItemName(item.id);
                            if (e.key === 'Escape') handleCancelEditItemName();
                          }}
                          autoFocus
                          style={{ minWidth: '120px', padding: '4px 8px', fontSize: '14px' }}
                        />
                        <button
                          className="joined-icon-btn"
                          onClick={() => handleSaveItemName(item.id)}
                          title="Save"
                          style={{ background: '#107c10' }}
                        >
                          <Check size={14} />
                        </button>
                        <button
                          className="delete-icon-btn"
                          onClick={handleCancelEditItemName}
                          title="Cancel"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span>{item.name}</span>
                        <button
                          className="delete-icon-btn"
                          onClick={() => handleStartEditItemName(item.id, item.name)}
                          title="Rename item"
                          style={{ opacity: 0.7 }}
                        >
                          <Pencil size={14} />
                        </button>
                        {isLowStock && <AlertTriangle size={12} style={{ color: '#c42b1c' }} />}
                      </div>
                    )}
                  </td>
                  <td>{whQty}</td>
                  <td>{lorryQty}</td>

                  {/* Total QTY Column with Conditional Styling */}
                  <td className="total-qty-cell" style={{ color: isLowStock ? '#c42b1c' : 'inherit' }}>
                    {totalQty}
                  </td>

                  <td className="item-total-value">
                    Rs. {totalValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>

                  <td>
                    <div className="joined-input-group">
                      <input
                        type="number"
                        placeholder="Qty"
                        className="joined-input"
                        value={inputValues[`${item.id}-qty`] || ''}
                        onChange={(e) => handleInputChange(item.id, 'qty', e.target.value)}
                      />
                      <input
                        type="number"
                        placeholder="Total Rs."
                        className="joined-input"
                        value={inputValues[`${item.id}-bill`] || ''}
                        onChange={(e) => handleInputChange(item.id, 'bill', e.target.value)}
                      />
                      <button className="joined-icon-btn" onClick={() => handleAddWarehouse(item.id)}>
                        <Warehouse size={14} />
                      </button>
                    </div>
                  </td>

                  <td>
                    <div className="joined-input-group">
                      <input
                        type="number"
                        placeholder="Qty"
                        className="joined-input"
                        value={inputValues[`${item.id}-load`] || ''}
                        onChange={(e) => handleInputChange(item.id, 'load', e.target.value)}
                      />
                      <button className="joined-icon-btn" onClick={() => handleLoadLorry(item.id)}>
                        <Truck size={14} />
                      </button>
                    </div>
                  </td>

                  <td>
                    <button className="delete-icon-btn" onClick={() => deleteItem(item.id)}>
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              );
            })}
            {/* Grand Total Row */}
            <tr style={{ background: 'var(--glass-bg)', fontWeight: 'bold', borderTop: '2px solid var(--border-color)' }}>
              <td className="item-name" style={{ fontWeight: 700 }}>Grand Total</td>
              <td style={{ textAlign: 'right' }}>
                {filteredItems.reduce((sum, item) => sum + (item.whQty || 0), 0)}
              </td>
              <td style={{ textAlign: 'right' }}>
                {filteredItems.reduce((sum, item) => sum + (item.lorryQty || 0), 0)}
              </td>
              <td style={{ textAlign: 'right', color: 'var(--accent-color)' }}>
                {filteredItems.reduce((sum, item) => sum + (item.whQty || 0) + (item.lorryQty || 0), 0)}
              </td>
              <td className="item-total-value" style={{ color: 'var(--accent-color)', fontSize: '15px' }}>
                Rs. {formatCurrency(calculateTotalAssets(filteredItems))}
              </td>
              <td></td>
              <td></td>
              <td></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Inventory;