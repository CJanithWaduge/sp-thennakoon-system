import React, { useState } from 'react';
import { Calendar, Download, History as HistoryIcon, Package, ShoppingCart, Users, Landmark } from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatDateTime } from '../utils/calculations';

const History = ({ items, salesHistory, statementEntries }) => {
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [activeCategory, setActiveCategory] = useState('All');

  // Filter data based on selected month
  // Filter data based on selected month (YYYY-MM) using local dates
  const filteredSales = salesHistory.filter(s => {
    const d = new Date(s.date || s.createdAt);
    if (isNaN(d.getTime())) return false;
    const mStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    return mStr === selectedMonth;
  });

  const filteredStatements = statementEntries.filter(e => {
    const d = new Date(e.date || e.createdAt);
    if (isNaN(d.getTime())) return false;
    const mStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    return mStr === selectedMonth;
  });

  const filteredCredits = filteredSales.filter(s => s.isCredit);
  
  // Filter for inventory transactions (restock and load lorry)
  const inventoryTransactions = filteredStatements.filter(e => e.type === 'restock' || e.type === 'load_lorry');
  
  // Combine and sort all transactions by date (newest first) - commented out as not used
  // const allTransactions = useMemo(() => {
  //   const combined = [
  //     ...filteredSales.map(s => ({ ...s, transactionType: s.isCredit ? 'credit_sale' : 'cash_sale' })),
  //     ...inventoryTransactions,
  //     ...filteredStatements.filter(e => e.type === 'creditor_payment' || (e.type !== 'restock' && e.type !== 'load_lorry' && e.type !== 'creditor_payment'))
  //   ];
  //   return combined.sort((a, b) => new Date(b.date) - new Date(a.date));
  // }, [filteredSales, inventoryTransactions, filteredStatements]);

  const generatePDF = () => {
    try {
      const doc = new jsPDF();
      const monthLabel = new Date(selectedMonth).toLocaleString('default', { month: 'long', year: 'numeric' });
      
      doc.setFontSize(20);
      doc.text(`Monthly Business Report: ${monthLabel}`, 14, 22);
      
      // Helper function to safely get Y position for next table
      let currentY = 40;
      const getNextY = () => {
        // Check if lastAutoTable exists and has finalY
        if (doc.lastAutoTable && typeof doc.lastAutoTable.finalY === 'number') {
          return doc.lastAutoTable.finalY + 15;
        }
        return currentY;
      };

      // --- SECTION 1: SALES ---
      doc.setFontSize(14);
      doc.text("1. Sales History", 14, getNextY());
      autoTable(doc, {
        startY: getNextY() + 5,
        head: [['Date', 'Shop Name', 'Type', 'Amount']],
        body: filteredSales.map(s => [
          new Date(s.date).toLocaleDateString(), 
          s.shopName, 
          s.isCredit ? 'Credit' : 'Cash', 
          `Rs. ${s.totalBill.toLocaleString()}`
        ]),
      });
      currentY = getNextY();

      // --- SECTION 2: CREDIT SALES ---
      doc.text("2. Credit Sales", 14, getNextY());
      const creditSalesData = filteredSales.filter(s => s.isCredit).map(s => [
        new Date(s.date).toLocaleDateString(),
        s.shopName,
        'Credit Sale',
        `Rs. ${s.totalBill.toLocaleString()}`
      ]);
      autoTable(doc, {
        startY: getNextY() + 5,
        head: [['Date', 'Shop Name', 'Type', 'Amount']],
        body: creditSalesData.length > 0 ? creditSalesData : [['', 'No credit sales', '', '']],
      });
      currentY = getNextY();

      // --- SECTION 3: CREDITOR COLLECTIONS (PAYMENTS) ---
      doc.text("3. Creditor Collections", 14, getNextY());
      const creditorPayments = [];
      filteredSales.forEach(s => s.paymentHistory?.forEach(p => {
        const d = new Date(p.date);
        const mStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        if (mStr === selectedMonth) {
          creditorPayments.push([new Date(p.date).toLocaleDateString(), s.shopName, `Rs. ${p.amount.toLocaleString()}`]);
        }
      }));
      autoTable(doc, {
        startY: getNextY() + 5,
        head: [['Date', 'Shop Name', 'Amount']],
        body: creditorPayments.length > 0 ? creditorPayments : [['-', 'No payments recorded', '-']],
      });
      currentY = getNextY();

      // --- SECTION 4: COMPANY STATEMENT ---
      doc.text("4. Company Statement", 14, getNextY());
      autoTable(doc, {
        startY: getNextY() + 5,
        head: [['Date', 'Description', 'Type', 'Amount']],
        body: filteredStatements.map(e => [
          new Date(e.date).toLocaleDateString(), 
          e.description, 
          e.type.toUpperCase(), 
          `Rs. ${e.amount.toLocaleString()}`
        ]),
      });
      currentY = getNextY();

      // --- SECTION 5: INVENTORY ---
      doc.addPage();
      doc.text("5. Inventory Snapshot", 14, 22);
      autoTable(doc, {
        startY: 30,
        head: [['Item Name', 'Warehouse', 'Lorry', 'Price']],
        body: items.map(i => [i.name, i.warehouseQty, i.lorryQty, `Rs. ${i.price}`]),
      });

      doc.save(`Samindu_History_${selectedMonth}.pdf`);
    } catch (err) {
      console.error("PDF Error:", err);
      alert("Error generating PDF: " + err.message);
    }
  };

  const categories = [
    { id: 'All', icon: <HistoryIcon size={14} /> },
    { id: 'Inventory', icon: <Package size={14} /> },
    { id: 'Sales', icon: <ShoppingCart size={14} /> },
    { id: 'Creditors', icon: <Users size={14} /> },
    { id: 'Statement', icon: <Landmark size={14} /> }
  ];

  return (
    <div className="inventory-container">
      <h1 style={{ marginBottom: '30px', fontSize: '28px', fontWeight: '600', textAlign: 'center' }}>History</h1>
      <div className="inventory-header card" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Calendar size={18} />
          <input type="month" className="inventory-input" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} />
        </div>
        <button className="add-btn" onClick={generatePDF} style={{ background: '#107c10' }}>
          <Download size={18} /> Export Full Report
        </button>
      </div>

      {/* Categories Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', overflowX: 'auto', padding: '4px' }}>
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '20px', border: 'none',
              cursor: 'pointer', background: activeCategory === cat.id ? 'var(--accent-color)' : 'var(--glass-bg)',
              color: activeCategory === cat.id ? 'white' : 'var(--text-main)', transition: '0.2s'
            }}
          >
            {cat.icon} {cat.id}
          </button>
        ))}
      </div>

      <div className="table-container card">
        <table className="inventory-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Category</th>
              <th>Details</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            {(activeCategory === 'All' || activeCategory === 'Inventory') && inventoryTransactions.map(transaction => (
              <tr key={transaction.id}>
                <td>{formatDateTime(transaction.date)}</td>
                <td><span className={`badge-${transaction.type === 'restock' ? 'inventory' : 'inventory'}`}>INVENTORY</span></td>
                <td>{transaction.details}</td>
                <td>{transaction.type === 'restock' ? `Rs. ${(transaction.amount || 0).toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : transaction.amount || '-'}</td>
              </tr>
            ))}
            {(activeCategory === 'All' || activeCategory === 'Sales') && filteredSales.filter(s => !s.isCredit).map(sale => (
              <tr key={sale.id}>
                <td>{formatDateTime(sale.date)}</td>
                <td><span className="badge-sale">SALES</span></td>
                <td>{sale.shopName} - Cash Sale</td>
                <td>Rs. {(sale.totalBill || 0).toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
              </tr>
            ))}
            {(activeCategory === 'All' || activeCategory === 'Creditors') && filteredCredits.map(credit => (
              <tr key={credit.id}>
                <td>{formatDateTime(credit.date)}</td>
                <td><span className="badge-creditors">CREDITORS</span></td>
                <td>{credit.shopName} - Credit Sale</td>
                <td>Rs. {(credit.totalBill || 0).toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
              </tr>
            ))}
            {(activeCategory === 'All' || activeCategory === 'Creditors') && filteredStatements.filter(e => e.type === 'creditor_payment').map(payment => (
              <tr key={payment.id}>
                <td>{formatDateTime(payment.date)}</td>
                <td><span className="badge-payment">PAYMENT</span></td>
                <td>{payment.details || 'Payment received'}</td>
                <td style={{ color: '#107c10', fontWeight: 'bold' }}>Rs. {(payment.amount || 0).toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
              </tr>
            ))}
            {(activeCategory === 'All' || activeCategory === 'Statement') && filteredStatements.filter(e => e.type !== 'restock' && e.type !== 'load_lorry' && e.type !== 'creditor_payment').map(e => (
              <tr key={e.id}>
                <td>{formatDateTime(e.date)}</td>
                <td><span className="badge-statement">COMPANY</span></td>
                <td>{e.description || 'Statement entry'}</td>
                <td>Rs. {(e.amount || 0).toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default History;