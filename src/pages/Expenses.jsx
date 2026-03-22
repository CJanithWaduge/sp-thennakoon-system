import React, { useState } from 'react';
import { RotateCcw, Calendar } from 'lucide-react';
import { ConfirmationDialog } from '../components/ConfirmationDialog';
import '../styles/Expenses.css';

const Expenses = ({ expenses, onAddExpense, onDeleteExpense, onResetDailyExpenses }) => {
  const [description, setDescription] = useState('');
  const [value, setValue] = useState('');
  const [category, setCategory] = useState('General');
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  const categories = ['General', 'Transportation', 'Utilities', 'Maintenance', 'Salary', 'Other'];

  const addExpense = (e) => {
    e.preventDefault();
    const val = parseFloat(value);
    if (!description.trim() || isNaN(val) || val <= 0) {
      alert('Please enter a valid description and a positive value');
      return;
    }
    const newEntry = {
      id: Date.now(),
      description: description.trim(),
      value: val,
      category: category || 'General',
      date: new Date(selectedDate).toISOString()
    };
    onAddExpense(newEntry);
    setDescription('');
    setValue('');
    setCategory('General');
  };

  const deleteExpense = (id) => {
    if (!window.confirm('Delete this expense?')) return;
    onDeleteExpense(id);
  };

  const handleResetDailyExpensesConfirm = () => {
    setShowResetConfirm(false);
    if (onResetDailyExpenses) {
      onResetDailyExpenses();
    }
  };

  const today = new Date().toLocaleDateString();
  const todaysExpenses = expenses.filter(e => new Date(e.date).toLocaleDateString() === today);
  const total = expenses.reduce((s, e) => s + (parseFloat(e.value) || 0), 0);

  return (
    <div className="expenses-page">
      <h1 style={{ marginBottom: '25px', fontSize: '28px', fontWeight: '600', textAlign: 'center' }}>Expenses</h1>
      <div className="expenses-header">
        <div style={{display: 'flex', alignItems: 'center', gap: '15px'}}>
          <div className="expenses-total">Total: Rs. {total.toLocaleString()}</div>
          {todaysExpenses.length > 0 && (
            <button 
              style={{ 
                background: '#d32f2f', 
                color: 'white', 
                border: 'none', 
                padding: '8px 12px', 
                borderRadius: '4px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '13px',
                fontWeight: '500'
              }}
              onClick={() => setShowResetConfirm(true)}
              title="Reset today's expenses"
            >
              <RotateCcw size={14} />
              Reset Today
            </button>
          )}
        </div>
      </div>

      {showResetConfirm && (
        <ConfirmationDialog
          title="Reset Daily Expenses?"
          message={`This will delete all ${todaysExpenses.length} expense(s) from today. This action cannot be undone.`}
          confirmText="Reset"
          cancelText="Cancel"
          isDangerous={true}
          onConfirm={handleResetDailyExpensesConfirm}
          onCancel={() => setShowResetConfirm(false)}
        />
      )}

      <form className="expenses-form" onSubmit={addExpense}>
        <select
          className="input category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          {categories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
        <input
          className="input description"
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <input
          className="input value"
          placeholder="Value (Rs.)"
          type="number"
          step="0.01"
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <Calendar size={16} style={{ position: 'absolute', left: '10px', color: 'var(--text-light)' }} />
          <input
            type="date"
            className="input"
            style={{ paddingLeft: '35px' }}
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
        </div>
        <button className="btn-primary" type="submit">Add Expense</button>
      </form>

      <div className="recent-expenses">
        <h3 className="section-title">Recent Expenses</h3>
        <table className="expenses-table">
          <thead>
            <tr>
              <th>Category</th>
              <th>Description</th>
              <th>Value (Rs.)</th>
              <th>Date</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {expenses.length === 0 && (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', opacity: 0.8 }}>No expenses yet.</td>
              </tr>
            )}
            {expenses.map(exp => (
              <tr key={exp.id}>
                <td>{exp.category || 'General'}</td>
                <td>{exp.description}</td>
                <td>Rs. {parseFloat(exp.value).toLocaleString()}</td>
                <td>{new Date(exp.date).toLocaleString()}</td>
                <td>
                  <button className="btn-danger" onClick={() => deleteExpense(exp.id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Expenses;
