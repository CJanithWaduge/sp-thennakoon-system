import React, { useState, useMemo } from 'react';
import { RefreshCcw, AlertTriangle, Calendar } from 'lucide-react';
import { calculateTotalAssets, formatCurrency } from '../utils/calculations';
import { ConfirmationDialog } from '../components/ConfirmationDialog';

const Dashboard = ({ items = [], salesHistory = [], statementEntries = [], expenses = [] }) => {
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [timeRangeMode, setTimeRangeMode] = useState(() => {
    const saved = localStorage.getItem('samindu_dashboard_time_range_mode');
    return saved || 'exact-date'; // 'year-only', 'year-range', 'exact-date'
  });
  const [selectedYear, setSelectedYear] = useState(() => {
    const saved = localStorage.getItem('samindu_dashboard_selected_year');
    return saved ? parseInt(saved) : new Date().getFullYear();
  });
  const [startYear, setStartYear] = useState(() => {
    const saved = localStorage.getItem('samindu_dashboard_start_year');
    return saved ? parseInt(saved) : new Date().getFullYear();
  });
  const [endYear, setEndYear] = useState(() => {
    const saved = localStorage.getItem('samindu_dashboard_end_year');
    return saved ? parseInt(saved) : new Date().getFullYear();
  });
  // const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]); // Unused
  const [startDate, setStartDate] = useState(() => {
    const saved = localStorage.getItem('samindu_dashboard_start_date');
    return saved || new Date().toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => {
    const saved = localStorage.getItem('samindu_dashboard_end_date');
    return saved || new Date().toISOString().split('T')[0];
  });

  const getMonthYearString = () => {
    const now = new Date();
    const months = ['January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'];
    return {
      month: months[now.getMonth()],
      year: now.getFullYear()
    };
  };

  const archiveMonthlyData = (cardName, value) => {
    const { month, year } = getMonthYearString();
    const existingHistory = JSON.parse(localStorage.getItem('monthly_history') || '[]');

    const newEntry = {
      cardName,
      month,
      year,
      value,
      timestamp: new Date().toISOString()
    };

    existingHistory.push(newEntry);
    localStorage.setItem('monthly_history', JSON.stringify(existingHistory));
  };

  const handleCardReset = (cardName, currentValue) => {
    setConfirmAction({
      cardName,
      currentValue,
      message: `Reset ${cardName} to Rs. 0.00? The current value of Rs. ${formatCurrency(currentValue)} will be archived, and new values will accumulate from zero.`,
      confirmText: 'Reset to Zero'
    });
    setShowConfirmDialog(true);
  };

  const confirmReset = () => {
    if (confirmAction) {
      archiveMonthlyData(confirmAction.cardName, confirmAction.currentValue);

      // If the card archived is Expenses, clear the stored monthly expenses list
      if (confirmAction.cardName === 'Total Expenses') {
        // Note: Expenses clearing is handled in parent component via onReset or similar
        // For now, we'll keep localStorage clear for compatibility
        localStorage.setItem('expenses', JSON.stringify([]));
      }

      // Toggle the card to display zero values
      toggleCardZero(confirmAction.cardName);

      alert(`✅ ${confirmAction.cardName} has been reset to zero. New values will accumulate from now.`);
    }
    setShowConfirmDialog(false);
    setConfirmAction(null);
  };

  // Allow temporarily zeroing displayed values per-card (demo mode) without modifying underlying data
  const [zeroedCards, setZeroedCards] = React.useState(() => {
    const saved = JSON.parse(localStorage.getItem('display_zero_cards') || '[]');
    return new Set(Array.isArray(saved) ? saved : []);
  });

  const toggleCardZero = (cardName) => {
    setZeroedCards(prev => {
      const next = new Set(prev);
      if (next.has(cardName)) next.delete(cardName);
      else next.add(cardName);
      localStorage.setItem('display_zero_cards', JSON.stringify(Array.from(next)));
      return next;
    });
  };

  // Memoized filtering by selected time range for sales analysis
  const filteredSalesForDate = useMemo(() => {
    return salesHistory.filter(s => {
      try {
        const saleDate = new Date(s.date || s.createdAt);
        if (isNaN(saleDate.getTime())) return false;
        
        // Format to local YYYY-MM-DD for reliable comparison
        const saleDateStr = `${saleDate.getFullYear()}-${String(saleDate.getMonth() + 1).padStart(2, '0')}-${String(saleDate.getDate()).padStart(2, '0')}`;

        if (timeRangeMode === 'year-only') {
          return saleYear === selectedYear;
        } else if (timeRangeMode === 'year-range') {
          const minYear = Math.min(startYear, endYear);
          const maxYear = Math.max(startYear, endYear);
          return saleYear >= minYear && saleYear <= maxYear;
        } else {
          // exact-date mode - compare local date strings to avoid timezone issues
          return saleDateStr >= startDate && saleDateStr <= endDate;
        }
      } catch {
        return false;
      }
    });
  }, [salesHistory, timeRangeMode, selectedYear, startYear, endYear, startDate, endDate]);

  // Total Asset Value = Grand Total of Total Value (Rs.)
  // Always calculate based on current inventory items
  const totalAssetValue = useMemo(() => {
    return calculateTotalAssets(items);
  }, [items]);

  const totalStockQuantity = useMemo(() => {
    return items.reduce((acc, item) => {
      const warehouseQty = item.warehouseQty || item.whQty || 0;
      const lorryQty = item.lorryQty || 0;
      return acc + warehouseQty + lorryQty;
    }, 0);
  }, [items]);

  // Filter expenses by selected time range
  const filteredExpenses = useMemo(() => {
    return expenses.filter(e => {
      try {
        const expenseDate = typeof e.date === 'string' ? new Date(e.date) : new Date(e.createdAt);
        const expenseYear = expenseDate.getFullYear();
        const expenseDateStr = expenseDate.toISOString().split('T')[0];

        if (timeRangeMode === 'year-only') {
          return expenseYear === selectedYear;
        } else if (timeRangeMode === 'year-range') {
          const minYear = Math.min(startYear, endYear);
          const maxYear = Math.max(startYear, endYear);
          return expenseYear >= minYear && expenseYear <= maxYear;
        } else {
          return expenseDateStr >= startDate && expenseDateStr <= endDate;
        }
      } catch {
        return false;
      }
    });
  }, [expenses, timeRangeMode, selectedYear, startYear, endYear, startDate, endDate]);

  // Filter statement entries by selected time range
  const filteredStatementEntries = useMemo(() => {
    return statementEntries.filter(e => {
      try {
        const entryDate = typeof e.date === 'string' ? new Date(e.date) : new Date(e.createdAt);
        const entryYear = entryDate.getFullYear();
        const entryDateStr = entryDate.toISOString().split('T')[0];

        if (timeRangeMode === 'year-only') {
          return entryYear === selectedYear;
        } else if (timeRangeMode === 'year-range') {
          const minYear = Math.min(startYear, endYear);
          const maxYear = Math.max(startYear, endYear);
          return entryYear >= minYear && entryYear <= maxYear;
        } else {
          return entryDateStr >= startDate && entryDateStr <= endDate;
        }
      } catch {
        return false;
      }
    });
  }, [statementEntries, timeRangeMode, selectedYear, startYear, endYear, startDate, endDate]);

  // Memoized sales calculations based on filter
  const salesMetrics = useMemo(() => {
    const cashValue = filteredSalesForDate.filter(s => !s.isCredit).reduce((sum, s) => sum + s.totalBill, 0);
    const creditValue = filteredSalesForDate.filter(s => s.isCredit).reduce((sum, s) => sum + s.totalBill, 0);

    return {
      todaysCashValue: cashValue,
      todaysCreditValue: creditValue,
      todaysSalesTotal: cashValue + creditValue,
      profitOnHand: cashValue * 0.08,
      profitOnCredit: creditValue * 0.08,
      totalProfit: (cashValue * 0.08) + (creditValue * 0.08)
    };
  }, [filteredSalesForDate]);

  const { todaysCashValue, todaysCreditValue, todaysSalesTotal, profitOnHand, profitOnCredit, totalProfit } = salesMetrics;

  // Total Expenses (Rs.) - filtered by time range
  const totalExpenses = useMemo(() => {
    return filteredExpenses.reduce((sum, e) => sum + (parseFloat(e.amount || e.value) || 0), 0);
  }, [filteredExpenses]);

  // Total Credit Value - filtered by time range
  const totalCreditValue = useMemo(() => {
    return filteredSalesForDate
      .filter(s => s.isCredit === true)
      .reduce((sum, s) => sum + (s.totalBill - (s.paidAmount || 0)), 0);
  }, [filteredSalesForDate]);

  // Net Outstanding - filtered by time range
  const ledgerOutstanding = useMemo(() => {
    const netPurchase = filteredStatementEntries
      .filter(e => e.type === 'invoice')
      .reduce((sum, e) => sum + e.amount, 0);

    const netReceipts = filteredStatementEntries
      .filter(e => e.type === 'receipt')
      .reduce((sum, e) => sum + e.amount, 0);

    const totalDeductions = filteredStatementEntries
      .filter(e => e.type === 'deduction')
      .reduce((sum, e) => sum + e.amount, 0);

    return netPurchase - netReceipts - totalDeductions;
  }, [filteredStatementEntries]);

  return (
    <div className="dashboard-container">
      <h1 style={{ marginBottom: '30px', fontSize: '28px', fontWeight: '600', textAlign: 'center' }}>Dashboard</h1>

      {/* Time Range Filter for Sales Analysis */}
      <div style={{ marginBottom: '25px', background: 'var(--sidebar-bg)', padding: '15px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
        <label className="bill-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
          <Calendar size={14} /> Analyze Sales by Time Range
        </label>

        {/* Mode Selection */}
        <div style={{ display: 'flex', gap: '25px', marginBottom: '15px', flexWrap: 'wrap' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '13px' }}>
            <input
              type="radio"
              name="timeRange"
              value="exact-date"
              checked={timeRangeMode === 'exact-date'}
              onChange={(e) => {
                const newMode = e.target.value;
                setTimeRangeMode(newMode);
                localStorage.setItem('samindu_dashboard_time_range_mode', newMode);
              }}
            />
            Exact Date Period
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '13px' }}>
            <input
              type="radio"
              name="timeRange"
              value="year-only"
              checked={timeRangeMode === 'year-only'}
              onChange={(e) => {
                const newMode = e.target.value;
                setTimeRangeMode(newMode);
                localStorage.setItem('samindu_dashboard_time_range_mode', newMode);
              }}
            />
            Year Only
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '13px' }}>
            <input
              type="radio"
              name="timeRange"
              value="year-range"
              checked={timeRangeMode === 'year-range'}
              onChange={(e) => {
                const newMode = e.target.value;
                setTimeRangeMode(newMode);
                localStorage.setItem('samindu_dashboard_time_range_mode', newMode);
              }}
            />
            Year Range
          </label>
        </div>

        {/* Dynamic Input Fields */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '12px' }}>
          {timeRangeMode === 'exact-date' && (
            <>
              <div>
                <label className="bill-label" style={{ fontSize: '12px', marginBottom: '6px', display: 'block' }}>Start Date</label>
                <input
                  type="date"
                  className="inventory-input"
                  value={startDate}
                  onChange={(e) => {
                    const newDate = e.target.value;
                    setStartDate(newDate);
                    localStorage.setItem('samindu_dashboard_start_date', newDate);
                  }}
                  style={{ fontSize: '13px', width: '100%', boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label className="bill-label" style={{ fontSize: '12px', marginBottom: '6px', display: 'block' }}>End Date</label>
                <input
                  type="date"
                  className="inventory-input"
                  value={endDate}
                  onChange={(e) => {
                    const newDate = e.target.value;
                    setEndDate(newDate);
                    localStorage.setItem('samindu_dashboard_end_date', newDate);
                  }}
                  style={{ fontSize: '13px', width: '100%', boxSizing: 'border-box' }}
                />
              </div>
            </>
          )}

          {timeRangeMode === 'year-only' && (
            <div>
              <label className="bill-label" style={{ fontSize: '12px', marginBottom: '6px', display: 'block' }}>Select Year</label>
                <select
                  className="inventory-input"
                  value={selectedYear}
                  onChange={(e) => {
                    const newYear = parseInt(e.target.value);
                    setSelectedYear(newYear);
                    localStorage.setItem('samindu_dashboard_selected_year', newYear.toString());
                  }}
                  style={{ fontSize: '13px', width: '100%', boxSizing: 'border-box' }}
                >
                {[...Array(20)].map((_, i) => {
                  const year = new Date().getFullYear() - 10 + i;
                  return <option key={year} value={year}>{year}</option>;
                })}
              </select>
            </div>
          )}

          {timeRangeMode === 'year-range' && (
            <>
              <div>
                <label className="bill-label" style={{ fontSize: '12px', marginBottom: '6px', display: 'block' }}>Start Year</label>
                <select
                  className="inventory-input"
                  value={startYear}
                  onChange={(e) => {
                    const newYear = parseInt(e.target.value);
                    setStartYear(newYear);
                    localStorage.setItem('samindu_dashboard_start_year', newYear.toString());
                  }}
                  style={{ fontSize: '13px', width: '100%', boxSizing: 'border-box' }}
                >
                  {[...Array(20)].map((_, i) => {
                    const year = new Date().getFullYear() - 10 + i;
                    return <option key={year} value={year}>{year}</option>;
                  })}
                </select>
              </div>
              <div>
                <label className="bill-label" style={{ fontSize: '12px', marginBottom: '6px', display: 'block' }}>End Year</label>
                <select
                  className="inventory-input"
                  value={endYear}
                  onChange={(e) => {
                    const newYear = parseInt(e.target.value);
                    setEndYear(newYear);
                    localStorage.setItem('samindu_dashboard_end_year', newYear.toString());
                  }}
                  style={{ fontSize: '13px', width: '100%', boxSizing: 'border-box' }}
                >
                  {[...Array(20)].map((_, i) => {
                    const year = new Date().getFullYear() - 10 + i;
                    return <option key={year} value={year}>{year}</option>;
                  })}
                </select>
              </div>
            </>
          )}
        </div>

        {/* Summary Info */}
        <div style={{ fontSize: '12px', color: 'var(--text-light)', background: 'rgba(120,120,120,0.05)', padding: '8px 12px', borderRadius: '4px' }}>
          📊 {filteredSalesForDate.length} sale(s) | Cash: Rs. {formatCurrency(todaysCashValue)} | Credit: Rs. {formatCurrency(todaysCreditValue)}
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="card sales-card blue relative">
          <button
            className="card-restore-btn"
            onClick={() => handleCardReset('Total Asset Value', totalAssetValue)}
            title="Reset to zero"
          >
            ↺ Reset
          </button>
          <div className="card-content">
            <div className="card-title">Total Asset Value</div>
            <div className="card-value">Rs. {zeroedCards.has('Total Asset Value') ? formatCurrency(0) : formatCurrency(totalAssetValue)}</div>
            <div className="card-sub">{zeroedCards.has('Total Asset Value') ? 0 : totalStockQuantity} Total Units in System</div>
          </div>
        </div>

        <div className="card sales-card green relative">
          <button
            className="card-restore-btn"
            onClick={() => handleCardReset('Total Profit', totalProfit)}
            title="Reset to zero"
          >
            ↺ Reset
          </button>
          <div className="card-content">
            <div className="card-title">Total Profit</div>
            <div className="card-value">Rs. {zeroedCards.has('Total Profit') ? formatCurrency(0) : formatCurrency(totalProfit)}</div>
            <div className="card-sub">Profit on Hand (Rs. {zeroedCards.has('Total Profit') ? formatCurrency(0) : formatCurrency(profitOnHand)}) + Profit on Credit (Rs. {zeroedCards.has('Total Profit') ? formatCurrency(0) : formatCurrency(profitOnCredit)})</div>
          </div>
        </div>

        <div className="card sales-card orange relative">
          <button
            className="card-restore-btn"
            onClick={() => handleCardReset('Total Expenses', totalExpenses)}
            title="Reset to zero"
          >
            ↺ Reset
          </button>
          <div className="card-content">
            <div className="card-title">Total Expenses (Rs.)</div>
            <div className="card-value">Rs. {zeroedCards.has('Total Expenses') ? formatCurrency(0) : formatCurrency(totalExpenses)}</div>
            <div className="card-sub">{zeroedCards.has('Total Expenses') ? 0 : expenses.length} Recent Expense Entries</div>
          </div>
        </div>

        <div className="card sales-card red relative">
          <button
            className="card-restore-btn"
            onClick={() => handleCardReset('Total Credit Value', totalCreditValue)}
            title="Reset to zero"
          >
            ↺ Reset
          </button>
          <div className="card-content">
            <div className="card-title">Total Credit Value</div>
            <div className="card-value">Rs. {zeroedCards.has('Total Credit Value') ? formatCurrency(0) : formatCurrency(totalCreditValue)}</div>
            <div className="card-sub">Pending from {zeroedCards.has('Total Credit Value') ? 0 : salesHistory.filter(s => s.isCredit && (s.totalBill - (s.paidAmount || 0)) > 0).length} Credit Shops</div>
          </div>
        </div>

        <div className="card sales-card yellow relative">
          <button
            className="card-restore-btn"
            onClick={() => handleCardReset("Today's Sales", todaysSalesTotal)}
            title="Reset to zero"
          >
            ↺ Reset
          </button>
          <div className="card-content">
            <div className="card-title">Today's Sales</div>
            <div className="card-value">Rs. {zeroedCards.has("Today's Sales") ? formatCurrency(0) : formatCurrency(todaysSalesTotal)}</div>
            <div className="card-sub">Cash (Rs. {zeroedCards.has("Today's Sales") ? formatCurrency(0) : formatCurrency(todaysCashValue)}) + Credit (Rs. {zeroedCards.has("Today's Sales") ? formatCurrency(0) : formatCurrency(todaysCreditValue)})</div>
          </div>
        </div>

        <div className="card sales-card purple relative">
          <button
            className="card-restore-btn"
            onClick={() => handleCardReset('Net Outstanding', ledgerOutstanding)}
            title="Reset to zero"
          >
            ↺ Reset
          </button>
          <div className="card-content">
            <div className="card-title">Net Outstanding</div>
            <div className="card-value">Rs. {zeroedCards.has('Net Outstanding') ? formatCurrency(0) : formatCurrency(ledgerOutstanding)}</div>
            <div className="card-sub">To Company - Purchases - Receipts - Deductions</div>
          </div>
        </div>
      </div>

      {showConfirmDialog && (
        <ConfirmationDialog
          title="Confirm Action"
          message={confirmAction?.message || 'Are you sure?'}
          onConfirm={confirmReset}
          onCancel={() => {
            setShowConfirmDialog(false);
            setConfirmAction(null);
          }}
          confirmText={confirmAction?.confirmText || 'Confirm'}
          cancelText="Cancel"
        />
      )}
    </div>
  );
};

export default Dashboard;