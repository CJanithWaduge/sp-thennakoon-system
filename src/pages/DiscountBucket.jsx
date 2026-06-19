import React, { useState } from 'react';
import { Plus, Minus, RotateCcw } from 'lucide-react';
import GaugeComponent from 'react-gauge-component';

function DiscountBucket({ discountBucket, onUpdate }) {
  const { maxValue, currentValue, history = [] } = discountBucket;
  const [editMax, setEditMax] = useState('');
  const [adjustAmount, setAdjustAmount] = useState('');
  const [editingMax, setEditingMax] = useState(false);

  const pct = maxValue > 0 ? Math.min(currentValue / maxValue, 1) : 0;

  const handleSaveMax = () => {
    const val = parseFloat(editMax);
    if (!isNaN(val) && val >= 0) {
      onUpdate(val, Math.min(currentValue, val), null);
    }
    setEditingMax(false);
    setEditMax('');
  };

  const handleAdd = () => {
    const amt = parseFloat(adjustAmount);
    if (isNaN(amt) || amt <= 0) return;
    const next = Math.min(currentValue + amt, maxValue);
    onUpdate(maxValue, next, { type: 'add', amount: amt, newValue: next });
    setAdjustAmount('');
  };

  const handleSubtract = () => {
    const amt = parseFloat(adjustAmount);
    if (isNaN(amt) || amt <= 0) return;
    const next = Math.max(currentValue - amt, 0);
    onUpdate(maxValue, next, { type: 'subtract', amount: -amt, newValue: next });
    setAdjustAmount('');
  };

  const handleReset = () => {
    onUpdate(maxValue, 0, { type: 'reset', amount: -currentValue, newValue: 0 });
  };

  return (
    <div className="inventory-container">
      <h1 style={{ marginBottom: '30px', fontSize: '28px', fontWeight: '600', textAlign: 'center' }}>Discount Bucket</h1>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', maxWidth: '900px', margin: '0 auto' }}>
        {/* Speedometer */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px' }}>
          <div style={{ width: '100%', maxWidth: '300px' }}>
            <GaugeComponent
              type="semicircle"
              value={currentValue}
              minValue={0}
              maxValue={maxValue || 1}
              marginInPercent={0.25}
              arc={{
                cornerRadius: 4,
                padding: 0.02,
                width: 0.3,
                subArcs: [
                  { limit: (maxValue || 1) * 0.5, color: '#22c55e' },
                  { limit: (maxValue || 1) * 0.8, color: '#eab308' },
                  { color: '#ef4444' }
                ]
              }}
              pointer={{
                type: 'needle',
                animationDuration: 800
              }}
              labels={{
                valueLabel: {
                  formatTextValue: () => `${(pct * 100).toFixed(1)}%`,
                  style: { fontSize: '28px', fontWeight: '800', fill: pct < 0.5 ? '#22c55e' : pct < 0.8 ? '#eab308' : '#ef4444' },
                  offsetY: 40
                },
                tickLabels: {
                  defaultTickValueConfig: { hide: true },
                  defaultTickLineConfig: { hide: true }
                }
              }}
            />
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-light)', marginTop: '4px' }}>
            Rs. {currentValue.toLocaleString()} / Rs. {maxValue.toLocaleString()}
          </div>
        </div>

        {/* Controls */}
        <div className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-main)' }}>Maximum Discount</label>
            <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
              {editingMax ? (
                <>
                  <input type="number" className="inventory-input" value={editMax}
                    onChange={e => setEditMax(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSaveMax()}
                    style={{ flex: 1 }} autoFocus />
                  <button className="add-btn" onClick={handleSaveMax}>Save</button>
                </>
              ) : (
                <>
                  <div style={{ flex: 1, padding: '8px 12px', background: 'var(--glass-bg)', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '16px', fontWeight: '700', color: 'var(--accent-color)' }}>
                    Rs. {maxValue.toLocaleString()}
                  </div>
                  <button className="add-btn" onClick={() => { setEditingMax(true); setEditMax(String(maxValue)); }}>Edit</button>
                </>
              )}
            </div>
          </div>

          <div>
            <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-main)' }}>Adjust Discount</label>
            <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
              <input type="number" className="inventory-input" placeholder="Amount"
                value={adjustAmount} onChange={e => setAdjustAmount(e.target.value)}
                style={{ flex: 1 }} />
              <button className="add-btn" onClick={handleAdd} style={{ background: '#107c10', minWidth: '60px', justifyContent: 'center' }}>
                <Plus size={18} />
              </button>
              <button className="add-btn" onClick={handleSubtract} style={{ background: '#c42b1c', minWidth: '60px', justifyContent: 'center' }}>
                <Minus size={18} />
              </button>
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-light)', marginTop: '4px' }}>
              Current: <strong>Rs. {currentValue.toLocaleString()}</strong> of Rs. {maxValue.toLocaleString()}
            </div>
          </div>

          <button className="add-btn" onClick={handleReset} style={{ background: '#6b7280', justifyContent: 'center', gap: '6px' }}>
            <RotateCcw size={16} /> Reset to Zero
          </button>
        </div>
      </div>

    </div>
  );
}

export default DiscountBucket;
