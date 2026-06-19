import React, { useState } from 'react';
import { FileText, Plus, Landmark, Receipt, Scissors, Trash2, Search, X, Package } from 'lucide-react';

const Statement = ({ items = [], statementEntries, onAddEntry, onDeleteEntry }) => {
  const [type, setType] = useState('receipt');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [invoiceItems, setInvoiceItems] = useState([]);
  const [itemSearch, setItemSearch] = useState('');
  const [itemQty, setItemQty] = useState(1);

  const netPurchase = statementEntries
    .filter(e => e.type === 'invoice')
    .reduce((sum, e) => sum + e.amount, 0);

  const netReceipts = statementEntries
    .filter(e => e.type === 'receipt')
    .reduce((sum, e) => sum + e.amount, 0);

  const totalDeductions = statementEntries
    .filter(e => e.type === 'deduction')
    .reduce((sum, e) => sum + e.amount, 0);

  const netOutstanding = netPurchase - netReceipts - totalDeductions;

  const filteredItems = items.filter(i =>
    i.name.toLowerCase().includes(itemSearch.toLowerCase())
  );

  const addItemToInvoice = (item) => {
    const existing = invoiceItems.find(i => i.id === item.id);
    if (existing) {
      setInvoiceItems(invoiceItems.map(i =>
        i.id === item.id ? { ...i, qty: i.qty + itemQty } : i
      ));
    } else {
      setInvoiceItems([...invoiceItems, { id: item.id, name: item.name, qty: itemQty, price: item.buyingPrice || 0 }]);
    }
    setItemSearch('');
    setItemQty(1);
  };

  const removeInvoiceItem = (id) => {
    setInvoiceItems(invoiceItems.filter(i => i.id !== id));
  };

  const invoiceTotal = invoiceItems.reduce((sum, i) => sum + i.qty * i.price, 0);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (type === 'invoice') {
      if (invoiceItems.length === 0) {
        alert('Please add at least one item to the invoice.');
        return;
      }
      const desc = invoiceItems.map(i => `${i.name} x${i.qty}`).join(', ');
      onAddEntry({ type, description: desc, amount: invoiceTotal });
      setInvoiceItems([]);
    } else {
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
    }
  };

  return (
    <div className="inventory-container">
      <h1 style={{ marginBottom: '30px', fontSize: '28px', fontWeight: '600', textAlign: 'center' }}>Statement</h1>
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

      <div className="card" style={{ marginBottom: '20px' }}>
        <div className="card-title"><Plus size={16} /> New Company Transaction</div>

        {type === 'invoice' && invoiceItems.length > 0 && (
          <div style={{ marginBottom: '12px', padding: '10px', background: 'var(--glass-bg)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>Invoice Items</div>
            {invoiceItems.map(i => (
              <div key={i.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', padding: '3px 0' }}>
                <span>{i.name} x{i.qty} @ Rs.{i.price}</span>
                <span style={{ fontWeight: '500' }}>Rs. {(i.qty * i.price).toLocaleString()}</span>
                <button onClick={() => removeInvoiceItem(i.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px' }}>
                  <X size={14} color="#ff4d4d" />
                </button>
              </div>
            ))}
            <div style={{ borderTop: '1px solid var(--border-color)', marginTop: '6px', paddingTop: '6px', textAlign: 'right', fontWeight: '700', fontSize: '14px' }}>
              Total: Rs. {invoiceTotal.toLocaleString()}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexWrap: 'wrap', gap: '15px', alignItems: 'flex-end', marginTop: '10px' }}>
          <div style={{ flex: 1, minWidth: '180px' }}>
            <label style={{ fontSize: '12px', color: 'var(--text-light)' }}>Entry Type</label>
            <select className="inventory-input" value={type} onChange={e => { setType(e.target.value); setInvoiceItems([]); }}>
              <option value="invoice">Invoice (Items Received from Company)</option>
              <option value="receipt">Receipt (Payment Sent to Company)</option>
              <option value="deduction">Deduction (Returns/Discounts)</option>
            </select>
          </div>

          {type === 'invoice' ? (
            <>
              <div style={{ flex: 2, minWidth: '250px' }}>
                <label style={{ fontSize: '12px', color: 'var(--text-light)' }}>Add Items from Inventory</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <div style={{ position: 'relative', flex: 1 }}>
                    <input
                      type="text" className="inventory-input"
                      placeholder="Search inventory items..."
                      value={itemSearch}
                      onChange={e => setItemSearch(e.target.value)}
                      style={{ paddingLeft: '32px' }}
                    />
                    <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }} />
                    {itemSearch && filteredItems.length > 0 && (
                      <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'var(--sidebar-bg)', border: '1px solid var(--border-color)', borderRadius: '0 0 8px 8px', zIndex: 100, maxHeight: '180px', overflowY: 'auto' }}>
                        {filteredItems.map(item => (
                          <div key={item.id}
                            onClick={() => addItemToInvoice(item)}
                            style={{ padding: '8px 12px', cursor: 'pointer', fontSize: '13px', display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)' }}
                          >
                            <span>{item.name}</span>
                            <span style={{ color: 'var(--text-light)' }}>Rs.{item.buyingPrice || 0} / buying</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <input
                    type="number" className="inventory-input"
                    placeholder="Qty" min="1"
                    value={itemQty}
                    onChange={e => setItemQty(Math.max(1, parseInt(e.target.value) || 1))}
                    style={{ width: '70px' }}
                  />
                </div>
              </div>
              <div style={{ flex: 1, minWidth: '120px' }}>
                <label style={{ fontSize: '12px', color: 'var(--text-light)' }}>&nbsp;</label>
                <button type="submit" className="add-btn" style={{ padding: '10px 25px', width: '100%' }}>
                  <Package size={16} /> Record Invoice
                </button>
              </div>
            </>
          ) : (
            <>
              <div style={{ flex: 1, minWidth: '150px' }}>
                <label style={{ fontSize: '12px', color: 'var(--text-light)' }}>Ref / Description</label>
                <input type="text" className="inventory-input" value={description} onChange={e => setDescription(e.target.value)} placeholder={type === 'receipt' ? 'e.g. Chq #419' : 'e.g. Return note'} />
              </div>
              <div style={{ flex: 1, minWidth: '120px' }}>
                <label style={{ fontSize: '12px', color: 'var(--text-light)' }}>Amount (Rs.)</label>
                <input type="number" className="inventory-input" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" />
              </div>
              <button type="submit" className="add-btn" style={{ padding: '10px 25px' }}>
                {type === 'receipt' ? <Landmark size={16} /> : <Scissors size={16} />} Add to Ledger
              </button>
            </>
          )}
        </form>
      </div>

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