import React, { useState } from 'react';
import { FileText, Plus, Landmark, Receipt, Scissors, Trash2 } from 'lucide-react';

const Statement = ({ statementEntries, onAddEntry, onDeleteEntry }) => {
  const [type, setType] = useState('receipt'); // receipt = Payment TO company
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');

  // Calculations based on Client's Excel Logic
  const netPurchase = statementEntries
    .filter(e => e.type === 'invoice')
    .reduce((sum, e) => sum + e.amount, 0);

  const netReceipts = statementEntries
    .filter(e => e.type === 'receipt')
    .reduce((sum, e) => sum + e.amount, 0);

  const totalDeductions = statementEntries
    .filter(e => e.type === 'deduction')
    .reduce((sum, e) => sum + e.amount, 0);

  // NET OUTSTANDING = NET PURCHASE - NET RECEIPTS - TOTAL DEDUCTIONS
  const netOutstanding = netPurchase - netReceipts - totalDeductions;

  const handleSubmit = (e) => {
    e.preventDefault();
    const amountValue = parseFloat(amount);
    if (!amount || isNaN(amountValue) || amountValue <= 0) {
      alert('Please enter a valid positive amount');
      return;
    }
    if (!description || !description.trim()) {
      alert('Please enter a description');
      return;
    }
    onAddEntry({ type, description, amount: amountValue });
    setAmount('');
    setDescription('');
  };

  return (
    <div className="inventory-container">
      <h1 style={{ marginBottom: '30px', fontSize: '28px', fontWeight: '600', textAlign: 'center' }}>Statement</h1>
      {/* 1. TOP SUMMARY CARDS */}
      <div className="dashboard-grid" style={{ marginBottom: '20px' }}>
        <div className="card sales-card red" style={{ gridColumn: 'span 2' }}>
          <div className="card-title">NET OUTSTANDING (To Company)</div>
          <div className="card-value">Rs. {netOutstanding.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
          <div className="card-sub">Total amount you still owe to the Supplier</div>
        </div>
        <div className="card sales-card blue">
          <div className="card-title">Net Purchase</div>
          <div className="card-value" style={{ fontSize: '1.2rem' }}>Rs. {netPurchase.toLocaleString()}</div>
        </div>
        <div className="card sales-card green">
          <div className="card-title">Net Receipts</div>
          <div className="card-value" style={{ fontSize: '1.2rem' }}>Rs. {netReceipts.toLocaleString()}</div>
        </div>
      </div>

      {/* 2. ENTRY FORM */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <div className="card-title"><Plus size={16} /> New Company Transaction</div>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexWrap: 'wrap', gap: '15px', alignItems: 'flex-end', marginTop: '10px' }}>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: '12px', color: 'var(--text-light)' }}>Entry Type</label>
            <select className="inventory-input" value={type} onChange={e => setType(e.target.value)}>
              <option value="invoice">Invoice (Items Received from Company)</option>
              <option value="receipt">Receipt (Payment Sent to Company)</option>
              <option value="deduction">Deduction (Returns/Discounts)</option>
            </select>
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: '12px', color: 'var(--text-light)' }}>Ref / Description</label>
            <input type="text" className="inventory-input" value={description} onChange={e => setDescription(e.target.value)} placeholder="e.g. Inv #96 or Chq #419" />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: '12px', color: 'var(--text-light)' }}>Amount (Rs.)</label>
            <input type="number" className="inventory-input" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" />
          </div>
          <button type="submit" className="add-btn" style={{ padding: '10px 25px' }}>Add to Ledger</button>
        </form>
      </div>

      {/* 3. THE LEDGER TABLE (Matching Excel Format) */}
      <div className="table-container card">
        <table className="inventory-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Invoices (Purchase)</th>
              <th>Receipts (Payments)</th>
              <th>Deductions (RD/SD)</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {statementEntries.map(entry => (
              <tr key={entry.id}>
                <td>{new Date(entry.date).toLocaleDateString()}</td>
                <td style={{ color: entry.type === 'invoice' ? 'inherit' : '#888' }}>
                  {entry.type === 'invoice' ? `Rs. ${entry.amount.toLocaleString()}` : '-'}
                  <div style={{ fontSize: '10px' }}>{entry.type === 'invoice' ? entry.description : ''}</div>
                </td>
                <td style={{ color: entry.type === 'receipt' ? '#107c10' : '#888' }}>
                  {entry.type === 'receipt' ? `Rs. ${entry.amount.toLocaleString()}` : '-'}
                  <div style={{ fontSize: '10px' }}>{entry.type === 'receipt' ? entry.description : ''}</div>
                </td>
                <td style={{ color: entry.type === 'deduction' ? '#c42b1c' : '#888' }}>
                  {entry.type === 'deduction' ? `Rs. ${entry.amount.toLocaleString()}` : '-'}
                  <div style={{ fontSize: '10px' }}>{entry.type === 'deduction' ? entry.description : ''}</div>
                </td>
                <td>
                  <button onClick={() => onDeleteEntry(entry.id)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                    <Trash2 size={14} color="#ff4d4d" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Statement;