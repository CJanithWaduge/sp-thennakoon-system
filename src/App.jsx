import api from './api/client';
import React, { useState, useEffect } from 'react';
import './App.css';
import defaultLogo from './assets/logo.png';
import { HashRouter } from 'react-router-dom';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import Sales from './pages/Sales';
import Creditors from './pages/Creditors';
import Statement from './pages/Statement';
import History from './pages/History';
import SettingsPage from './pages/Settings';
import Expenses from './pages/Expenses';
import Analytics from './pages/Analytics';
import Reports from './pages/Reports';
import {
  LayoutDashboard, Package, ShoppingCart, Users,
  History as HistoryIcon, FileText, Sun, Moon,
  Settings as SettingsIcon, Menu, CreditCard, BarChart3, Cog, LogOut, UserPlus, FileBarChart
} from 'lucide-react';

function App() {
  console.log('App component is rendering');

  const [activeTab, setActiveTab] = useState('Dashboard');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 768);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loggedInUser, setLoggedInUser] = useState(localStorage.getItem('samindu_current_user') || '');

  // Clear any stored zero card states to show all values by default
  React.useEffect(() => {
    localStorage.removeItem('display_zero_cards');
    localStorage.removeItem('display_zero_values');
    console.log('✓ Cleared stored zero card states');
  }, []);

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  // Mobile detection
  React.useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      if (!mobile) setIsMobileSidebarOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleNavClick = (tabId) => {
    setActiveTab(tabId);
    setSearchTerm('');
    if (isMobile) setIsMobileSidebarOpen(false);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    // Don't clear registration, just the current session
    localStorage.removeItem('samindu_current_user');
  };

  const handleRegisterNewAccount = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('samindu_current_user');
    // We want the Auth screen to show registration mode
    // We can use a temporary flag in sessionStorage or just rely on the user clicking "Create Account" on Auth
    // But to be proactive, let's signal it.
    sessionStorage.setItem('samindu_force_register', 'true');
  };



  /* --- DATA PERSISTENCE - Load from Database --- */
  const [items, setItems] = useState([]);
  const [salesHistory, setSalesHistory] = useState([]);
  const [routes, setRoutes] = useState(["General Route"]);
  const [statementEntries, setStatementEntries] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [companyName, setCompanyName] = useState("W2 Tech Solutions");
  const [logo, setLogo] = useState(null);
  const [profileImage, setProfileImage] = useState(null);

  const loadUserData = async (username) => {
    try {
      console.log(`📦 LOAD USER DATA: Starting for ${username}`);
      setIsLoading(true);
      console.log(`📦 Switching to database for user: ${username}`);

      // Initialize the database for this specific user
      await api.database.init(username);

      const [itemsData, salesData, expensesData, statementsData, routesData, companyData, logoData, profileData] = await Promise.all([
        api.items.getAll(),
        api.sales.getAll(),
        api.expenses.getAll(),
        api.statements.getAll(),
        api.routes.getAll(),
        api.settings.get('company_name'),
        api.settings.get('logo'),
        api.settings.get('profile_image'),
      ]);

      console.log(`📊 Data loaded for ${username}:`, {
        items: itemsData?.length || 0,
        sales: salesData?.length || 0,
        expenses: expensesData?.length || 0,
      });

      setItems(itemsData || []);
      setSalesHistory(salesData || []);
      setExpenses(expensesData || []);
      setStatementEntries(statementsData || []);
      setRoutes(routesData && routesData.length > 0 ? routesData : ["General Route"]);
      setCompanyName(companyData || "Samindu System");
      setLogo(logoData || null);
      setProfileImage(profileData || null);
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    console.log('🔐 AUTH STATUS CHECK:', { isAuthenticated, loggedInUser: localStorage.getItem('samindu_current_user') });
    if (isAuthenticated) {
      const username = localStorage.getItem('samindu_current_user') || 'default';
      loadUserData(username);
    }
  }, [isAuthenticated]);

  // Save items to database
  useEffect(() => {
    if (isLoading) return;
    const saveItems = async () => {
      try {
        // For now, we handle item updates through specific handlers
        // This effect is kept for consistency with original code
      } catch (error) {
        console.error('Error saving items:', error);
      }
    };
    saveItems();
  }, [items, isLoading]);

  // Save sales history to database
  useEffect(() => {
    if (isLoading) return;
    const saveSales = async () => {
      try {
        // Handled through specific handlers
      } catch (error) {
        console.error('Error saving sales:', error);
      }
    };
    saveSales();
  }, [salesHistory, isLoading]);

  // Save routes to database
  useEffect(() => {
    if (isLoading) return;
    const saveRoutes = async () => {
      try {
        // Handled through specific handlers
      } catch (error) {
        console.error('Error saving routes:', error);
      }
    };
    saveRoutes();
  }, [routes, isLoading]);

  // Save statements to database
  useEffect(() => {
    if (isLoading) return;
    const saveStatements = async () => {
      try {
        // Handled through specific handlers
      } catch (error) {
        console.error('Error saving statements:', error);
      }
    };
    saveStatements();
  }, [statementEntries, isLoading]);

  // Save expenses to database
  useEffect(() => {
    if (isLoading) return;
    const saveExpenses = async () => {
      try {
        // Handled through specific handlers
      } catch (error) {
        console.error('Error saving expenses:', error);
      }
    };
    saveExpenses();
  }, [expenses, isLoading]);

  // Save company name to database
  useEffect(() => {
    if (isLoading) return;
    const saveName = async () => {
      try {
        await api.settings.set('company_name', companyName);
      } catch (error) {
        console.error('Error saving company name:', error);
      }
    };
    saveName();
  }, [companyName, isLoading]);

  // Save logo to database
  useEffect(() => {
    if (isLoading) return;
    const saveLogo = async () => {
      try {
        await api.settings.set('logo', logo || '');
      } catch (error) {
        console.error('Error saving logo:', error);
      }
    };
    saveLogo();
  }, [logo, isLoading]);

  // Save profile image to database
  useEffect(() => {
    if (isLoading) return;
    const saveProfile = async () => {
      try {
        await api.settings.set('profile_image', profileImage || '');
      } catch (error) {
        console.error('Error saving profile image:', error);
      }
    };
    saveProfile();
  }, [profileImage, isLoading]);

  /* --- CORE LOGIC --- */
  const addStatementEntry = async (entry) => {
    const newEntry = {
      date: entry.date || new Date().toISOString(),
      type: entry.type,
      description: entry.description,
      amount: parseFloat(entry.amount)
    };

    try {
      const savedEntry = await api.statements.add(newEntry);
      setStatementEntries(prev => [savedEntry, ...prev]);
    } catch (error) {
      console.error('Error adding statement entry:', error);
    }
  };

  const deleteStatementEntry = async (id) => {
    if (window.confirm("Delete this entry from company statement?")) {
      try {
        await api.statements.delete(id);
        setStatementEntries(prev => prev.filter(e => e.id !== id));
      } catch (error) {
        console.error('Error deleting statement entry:', error);
      }
    }
  };

  const recordSale = async (shopName, basketItems, isCredit, routeName, customDate) => {
    const transactionDate = customDate ? new Date(customDate).toISOString() : new Date().toISOString();

    // Update inventory
    const updatedItems = items.map(item => {
      const soldItem = basketItems.find(b => b.id === item.id);
      if (soldItem) {
        const totalPhysicalDeduction = (soldItem.qty || 0) + (soldItem.freeQty || 0);
        const updatedItem = { ...item, lorryQty: Math.max(0, item.lorryQty - totalPhysicalDeduction) };
        // Update in database
        api.items.update(item.id, updatedItem).catch(err =>
          console.error('Error updating item in database:', err)
        );
        return updatedItem;
      }
      return item;
    });
    setItems(updatedItems);

    const totalNetValue = basketItems.reduce((sum, item) => sum + item.subtotal, 0);

     const newTransaction = {
      date: transactionDate,
      shopName: shopName || (isCredit ? 'Unknown Shop' : 'Cash Sale'),
      routeName,
      isCredit,
      itemsSold: basketItems,
      totalBill: totalNetValue,
      paidAmount: isCredit ? 0 : totalNetValue,
      paymentHistory: []
    };

    try {
      const savedSale = await api.sales.add(newTransaction);
      setSalesHistory(prev => [savedSale, ...prev]);
    } catch (error) {
      console.error('Error recording sale:', error);
    }
  };

  const updatePayment = async (transactionId, amount, shopName) => {
    const paymentDate = new Date().toISOString();

    const updatedHistory = salesHistory.map(sale => {
      if (sale.id === transactionId) {
        const currentPaid = sale.paidAmount || 0;
        const newPaidAmount = currentPaid + amount;
        if (newPaidAmount > sale.totalBill + 0.01) {
          alert(`Error: Payment exceeds balance.`);
          return sale;
        }

        // Add history entry for this payment
        addPaymentHistoryEntry({
          date: paymentDate,
          category: 'Creditors',
          details: `Payment from ${shopName}`,
          amount: parseFloat(amount),
          type: 'creditor_payment'
        });

        const updatedSale = {
          ...sale,
          paidAmount: newPaidAmount,
          paymentHistory: [...(sale.paymentHistory || []), { date: paymentDate, amount: parseFloat(amount) }]
        };

        // Update in database
        api.sales.update(sale.id, updatedSale).catch(err =>
          console.error('Error updating sale in database:', err)
        );

        return updatedSale;
      }
      return sale;
    });

    setSalesHistory(updatedHistory);
  };

  const addPaymentHistoryEntry = async (entry) => {
    const newEntry = {
      date: entry.date || new Date().toISOString(),
      category: entry.category,
      details: entry.details,
      amount: parseFloat(entry.amount),
      type: entry.type || 'payment'
    };

    try {
      const savedEntry = await api.statements.add(newEntry);
      setStatementEntries(prev => [savedEntry, ...prev]);
    } catch (error) {
      console.error('Error adding payment history entry:', error);
    }
  };

  const deleteRoute = async (routeToDelete) => {
    const isRouteInUse = salesHistory.some(sale => sale.routeName === routeToDelete);
    if (isRouteInUse) {
      alert("Cannot delete route with history!");
      return;
    }
    if (window.confirm(`Delete route "${routeToDelete}"?`)) {
      try {
        await api.routes.delete(routeToDelete);
        setRoutes(prev => prev.filter(r => r !== routeToDelete));
      } catch (error) {
        console.error('Error deleting route:', error);
      }
    }
  };

  const handleRenameRoute = async (oldName, newName) => {
    if (routes.includes(newName)) {
      alert("A route with this name already exists!");
      return;
    }

    try {
      // 1. Update routes list in state
      const updatedRoutes = routes.map(r => r === oldName ? newName : r);
      setRoutes(updatedRoutes);

      // Update in database
      await api.routes.delete(oldName);
      await api.routes.add(newName);

      // 2. Update sales history to use the new route name
      const updatedHistory = salesHistory.map(sale =>
        sale.routeName === oldName ? { ...sale, routeName: newName } : sale
      );
      setSalesHistory(updatedHistory);

      // Sync affected sales with database
      for (const sale of updatedHistory) {
        if (sale.routeName === newName) {
          await api.sales.update(sale.id, sale);
        }
      }
    } catch (error) {
      console.error('Error renaming route:', error);
    }
  };

  const handleRenameShop = async (saleId, newShopName) => {
    try {
      const updatedHistory = salesHistory.map(sale =>
        sale.id === saleId ? { ...sale, shopName: newShopName } : sale
      );
      setSalesHistory(updatedHistory);

      const updatedSale = updatedHistory.find(s => s.id === saleId);
      if (updatedSale) {
        await api.sales.update(saleId, updatedSale);
      }
    } catch (error) {
      console.error('Error renaming shop:', error);
    }
  };

  const handleFullReset = async () => {
    if (window.confirm("WARNING: This will wipe all inventory, sales, and settings data. Continue?")) {
      try {
        await api.database.reset();
        setItems([]);
        setSalesHistory([]);
        setExpenses([]);
        setStatementEntries([]);
        setRoutes(["General Route"]);
        setCompanyName("Samindu System");
        setLogo(null);
        setProfileImage(null);
        // Note: Auth data still uses localStorage - not reset by database reset
        console.log('Database reset successfully');
      } catch (error) {
        console.error('Error resetting database:', error);
      }
    }
  };

  const handleResetDailySales = async () => {
    // Get today's date in the same format as stored
    const today = new Date().toLocaleDateString();

    // Find all sales for today
    const todaysSales = salesHistory.filter(s => new Date(s.date).toLocaleDateString() === today);

    if (todaysSales.length === 0) {
      alert('No sales to reset for today!');
      return;
    }

    // Restore inventory for all items sold today
    const updatedItems = items.map(item => {
      let totalQtyToRestore = 0;

      todaysSales.forEach(sale => {
        const soldItem = sale.itemsSold?.find(itemSold => itemSold.id === item.id);
        if (soldItem) {
          totalQtyToRestore += (soldItem.qty || 0) + (soldItem.freeQty || 0);
        }
      });

      if (totalQtyToRestore > 0) {
        const restoredItem = { ...item, lorryQty: item.lorryQty + totalQtyToRestore };
        // Update in database
        api.items.update(item.id, restoredItem).catch(err =>
          console.error('Error updating item in database:', err)
        );
        return restoredItem;
      }
      return item;
    });

    setItems(updatedItems);

    // Delete all sales for today from database and state
    try {
      for (const sale of todaysSales) {
        await api.sales.delete(sale.id);
      }
      setSalesHistory(prev => prev.filter(s => new Date(s.date).toLocaleDateString() !== today));
      console.log(`✓ Deleted ${todaysSales.length} sale(s) and restored inventory for today`);
    } catch (error) {
      console.error('Error deleting today\'s sales:', error);
      alert('Error resetting daily sales!');
    }
  };

  const handleResetDailyExpenses = async () => {
    // Get today's date in the same format as stored
    const today = new Date().toLocaleDateString();

    // Find all expenses for today
    const todaysExpenses = expenses.filter(e => new Date(e.createdAt).toLocaleDateString() === today);

    if (todaysExpenses.length === 0) {
      alert('No expenses to reset for today!');
      return;
    }

    // Delete all expenses for today from database and state
    try {
      for (const expense of todaysExpenses) {
        await api.expenses.delete(expense.id);
      }
      setExpenses(prev => prev.filter(e => new Date(e.createdAt).toLocaleDateString() !== today));
      console.log(`✓ Deleted ${todaysExpenses.length} expense(s) for today`);
    } catch (error) {
      console.error('Error deleting today\'s expenses:', error);
      alert('Error resetting daily expenses!');
    }
  };

  // Update a single item field(s) in Firestore (called from Inventory.jsx handlers)
  const updateItemInDb = async (id, changes) => {
    try {
      await api.items.update(id, changes);
    } catch (error) {
      console.error('Error updating item in database:', error);
    }
  };

  // Delete a single item from Firestore (called from Inventory.jsx deleteItem handler)
  const deleteItemFromDb = async (id) => {
    try {
      await api.items.delete(id);
    } catch (error) {
      console.error('Error deleting item from database:', error);
    }
  };

  // Add a new item to Firestore and return it with the Firebase document ID
  const handleAddItem = async (newItemData) => {
    try {
      const savedItem = await api.items.add(newItemData);
      // savedItem.id is now the real Firestore document ID (string)
      setItems(prev => [...prev, savedItem]);
      return savedItem;
    } catch (error) {
      console.error('Error adding item to database:', error);
    }
  };

  // Wrapper for setItems that also saves to database
  // Only used for bulk operations (delete, rename, price edits) where items already have Firebase IDs
  const handleSetItems = (newItemsOrUpdater) => {
    let newItems;
    if (typeof newItemsOrUpdater === 'function') {
      newItems = newItemsOrUpdater(items);
    } else {
      newItems = newItemsOrUpdater;
    }

    setItems(newItems);
  };

  // Wrapper for setRoutes that also saves to database
  const handleSetRoutes = (newRoutesOrUpdater) => {
    let newRoutes;
    if (typeof newRoutesOrUpdater === 'function') {
      newRoutes = newRoutesOrUpdater(routes);
    } else {
      newRoutes = newRoutesOrUpdater;
    }

    setRoutes(newRoutes);
  };

  // Wrapper for setExpenses that also saves to database
  const handleSetExpenses = (newExpensesOrUpdater) => {
    let newExpenses;
    if (typeof newExpensesOrUpdater === 'function') {
      newExpenses = newExpensesOrUpdater(expenses);
    } else {
      newExpenses = newExpensesOrUpdater;
    }

    setExpenses(newExpenses);
  };

  const handleAddRouteInDb = async (name) => {
    try {
      await api.routes.add(name);
      setRoutes(prev => [...prev, name]);
    } catch (error) {
      console.error('Error adding route:', error);
    }
  };

  const handleAddExpenseInDb = async (expense) => {
    try {
      const saved = await api.expenses.add(expense);
      setExpenses(prev => [saved, ...prev]);
      return saved;
    } catch (error) {
      console.error('Error adding expense:', error);
    }
  };

  const handleDeleteExpenseInDb = async (id) => {
    try {
      await api.expenses.delete(id);
      setExpenses(prev => prev.filter(e => e.id !== id));
    } catch (error) {
      console.error('Error deleting expense:', error);
    }
  };

  // Authentication Handler
  const handleAuthenticated = (username) => {
    localStorage.setItem('samindu_current_user', username);
    setLoggedInUser(username);
    setIsAuthenticated(true);
  };

  if (!isAuthenticated) {
    return <Auth onAuthenticated={handleAuthenticated} profileImage={profileImage} />;
  }

  // Main Layout
  return (
    <div className={`app-container ${isDarkMode ? 'dark' : 'light'}-theme`}>
      {/* Mobile floating hamburger button */}
      {isMobile && !isMobileSidebarOpen && (
        <button
          className="mobile-hamburger-btn"
          onClick={() => setIsMobileSidebarOpen(true)}
          aria-label="Open menu"
        >
          <Menu size={22} />
        </button>
      )}

      {/* Mobile backdrop overlay */}
      {isMobile && isMobileSidebarOpen && (
        <div
          className="mobile-sidebar-overlay"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      <nav className={`sidebar ${isSidebarCollapsed ? 'collapsed' : ''} ${isMobile ? (isMobileSidebarOpen ? 'mobile-open' : 'mobile-closed') : ''}`}>
        <div className="sidebar-toggle-container">
          <button className="sidebar-toggle" onClick={() => isMobile ? setIsMobileSidebarOpen(false) : setIsSidebarCollapsed(!isSidebarCollapsed)}><Menu size={20} /></button>
        </div>
        <div className="brand">
          <img
            src={logo || defaultLogo}
            alt="Logo"
            style={{ height: '60px', maxWidth: '180px', objectFit: 'contain' }}
            onError={(e) => { e.currentTarget.src = defaultLogo; setLogo(null); }}
          />
          <div className="company-name" style={{ color: isDarkMode ? 'var(--brand-color)' : '#1e40af' }}>{companyName}</div>
        </div>

        <div className="nav-items-container">
          {[
            { id: 'Dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
            { id: 'Inventory', label: 'Inventory Control', icon: <Package size={20} /> },
            { id: 'Sales', label: 'Daily Sales', icon: <ShoppingCart size={20} /> },
            { id: 'Creditors', label: 'Creditors', icon: <Users size={20} /> },
            { id: 'Expenses', label: 'Expenses', icon: <CreditCard size={20} /> },
            { id: 'Reports', label: 'Reports', icon: <FileBarChart size={20} /> },
            { id: 'Analytics', label: 'Analytics', icon: <BarChart3 size={20} /> },
            { id: 'Statement', label: 'Statement', icon: <FileText size={20} /> },
            { id: 'History', label: 'History', icon: <HistoryIcon size={20} /> }
          ]
            .map(nav => (
              <div
                key={nav.id}
                className={`nav-item ${activeTab === nav.id ? 'active' : ''}`}
                onClick={() => handleNavClick(nav.id)}
              >
                {nav.icon} <span>{nav.label}</span>
              </div>
            ))}
        </div>

        {/* Sidebar Footer: Profile + Settings and Theme Toggle */}
        <div className="sidebar-footer">
          {/* Profile Avatar Section */}
          <div className="profile-section">
            <div className="profile-avatar">
              {profileImage ? (
                <img src={profileImage} alt="Profile" />
              ) : (
                <span className="profile-avatar-placeholder">👤</span>
              )}
              <div className="profile-avatar-overlay">
                <input
                  type="file"
                  id="profile-upload"
                  style={{ display: 'none' }}
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => setProfileImage(reader.result);
                      reader.readAsDataURL(file);
                    }
                  }}
                />
                <label htmlFor="profile-upload" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  Edit
                </label>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', margin: '4px 0 8px 0' }}>
            <button
              className={`sidebar-settings-btn ${activeTab === 'Settings' ? 'active' : ''}`}
              onClick={() => { setActiveTab('Settings'); setSearchTerm(''); }}
              title="System Settings"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <SettingsIcon
                size={28}
                strokeWidth={2.5}
                style={{
                  color: isDarkMode ? '#ffffff' : (activeTab === 'Settings' ? '#ffffff' : '#333333'),
                  display: 'block'
                }}
              />
            </button>
          </div>

          <button className="theme-toggle" onClick={toggleTheme}>
            {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
            {isDarkMode ? 'Light Mode' : 'Dark Mode'}
          </button>

          {/* Brand Footer */}
          <div className="sidebar-brand-footer" style={{
            marginTop: '12px',
            textAlign: 'center',
            fontSize: '10px',
            fontWeight: '500',
            color: isDarkMode ? '#4b5563' : '#94a3b8'
          }}>
            © 2026 W2 Tech Solutions
          </div>
        </div>
      </nav>

      <main className="main-content">
        <div style={{ width: '100%', maxWidth: '1600px' }}>
          {activeTab === 'Dashboard' && (
            <Dashboard items={items} salesHistory={salesHistory} statementEntries={statementEntries} expenses={expenses} onReset={handleFullReset} />
          )}
          {activeTab === 'Inventory' && (
            <Inventory items={items} setItems={handleSetItems} addItem={handleAddItem} updateItem={updateItemInDb} deleteItemFromDb={deleteItemFromDb} searchTerm={searchTerm} />
          )}
          {activeTab === 'Sales' && (
            <Sales items={items} onConfirmSale={recordSale} salesHistory={salesHistory} routes={routes} onAddRoute={handleAddRouteInDb} onResetDailySales={handleResetDailySales} />
          )}
          {activeTab === 'Creditors' && (
            <Creditors
              salesHistory={salesHistory}
              routes={routes}
              onUpdatePayment={updatePayment}
              onDeleteRoute={deleteRoute}
              onRenameShop={handleRenameShop}
              onRenameRoute={handleRenameRoute}
            />
          )}
          {activeTab === 'Statement' && (
            <Statement statementEntries={statementEntries} onAddEntry={addStatementEntry} onDeleteEntry={deleteStatementEntry} />
          )}
          {activeTab === 'History' && (
            <History items={items} salesHistory={salesHistory} statementEntries={statementEntries} />
          )}
          {activeTab === 'Expenses' && (
            <Expenses expenses={expenses} onAddExpense={handleAddExpenseInDb} onDeleteExpense={handleDeleteExpenseInDb} onResetDailyExpenses={handleResetDailyExpenses} />
          )}
          {activeTab === 'Analytics' && (
            <Analytics
              salesHistory={salesHistory}
              statementEntries={statementEntries}
              routes={routes}
              items={items}
              expenses={expenses}
              isDarkMode={isDarkMode}
            />
          )}
          {activeTab === 'Reports' && (
            <Reports
              items={items}
              salesHistory={salesHistory}
              companyName={companyName}
              expenses={expenses}
            />
          )}
          {activeTab === 'Settings' && (
            <SettingsPage
              username={loggedInUser}
              companyName={companyName}
              setCompanyName={setCompanyName}
              logo={logo}
              setLogo={setLogo}
              onFullReset={handleFullReset}
              items={items}
              salesHistory={salesHistory}
              routes={routes}
              statementEntries={statementEntries}
              expenses={expenses}
              onLogout={handleLogout}
              onRegisterNew={handleRegisterNewAccount}
            />
          )}
        </div>
      </main>
    </div>
  );

}

function AppWithRouter() {
  return (
    <HashRouter>
      <App />
    </HashRouter>
  );
}

export default AppWithRouter;