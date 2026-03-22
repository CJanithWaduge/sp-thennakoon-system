import api from '../api/client';
import React, { useState, useEffect } from 'react';
import { Download, Upload, Trash2, ShieldAlert, Building, Palette, Image as ImageIcon, X, Lock, Info, ExternalLink, Mail, LogOut, UserPlus, Fingerprint } from 'lucide-react';

const Settings = ({
  username,
  companyName,
  setCompanyName,
  logo,
  setLogo,
  onFullReset,
  items,
  salesHistory,
  routes,
  statementEntries,
  expenses,
  onLogout,
  onRegisterNew
}) => {

  const [showAccountList, setShowAccountList] = useState(false);
  const [users, setUsers] = useState([]);
  const [requirePassword, setRequirePassword] = useState(() => {
    // Default to true for security, unless explicitly turned off
    const stored = localStorage.getItem('samindu_require_password');
    return stored === null ? true : stored === 'true';
  });

  useEffect(() => {
    const allUsers = JSON.parse(localStorage.getItem('samindu_users') || '[]');
    setUsers(allUsers);
  }, []);

  const handleRequirePasswordToggle = () => {
    const newValue = !requirePassword;
    setRequirePassword(newValue);
    localStorage.setItem('samindu_require_password', String(newValue));
  };

  const handleDeleteAccount = async (targetUser) => {
    const confirmDelete = window.confirm(`Are you sure you want to delete the account "${targetUser}"? This will permanently delete all data for this user.`);
    if (!confirmDelete) return;

    try {
      // Delete database file
      await api.database.deleteUser(targetUser);

      // Remove from localStorage
      const filteredUsers = users.filter(u => u.username !== targetUser);
      localStorage.setItem('samindu_users', JSON.stringify(filteredUsers));
      setUsers(filteredUsers);

      // If current user is deleted, logout
      if (targetUser === username) {
        onLogout();
      }
    } catch (error) {
      console.error('Failed to delete account:', error);
      alert('Error deleting account database. The account has been removed from the registry.');

      // Fallback: Remove from localStorage even if file deletion fails
      const filteredUsers = users.filter(u => u.username !== targetUser);
      localStorage.setItem('samindu_users', JSON.stringify(filteredUsers));
      setUsers(filteredUsers);

      if (targetUser === username) {
        onLogout();
      }
    }
  };

  // Function to handle image upload and convert to Base64
  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogo(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Function to export all data as a JSON file (Backup)
  const handleExportData = () => {
    // Get requirePassword setting from localStorage
    const requirePassword = localStorage.getItem('samindu_require_password') === 'true';

    const backupData = {
      // Branding & Identity
      companyName,
      logo,
      
      // Database Records
      inventory: items,
      sales: salesHistory,
      routes: routes || [],
      expenses: expenses || [],
      statements: statementEntries || [],
      
      // Settings
      settings: {
        requirePassword
      },
      
      // Metadata
      exportDate: new Date().toISOString(),
      version: "1.0.0",
      exportedUser: username
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupData, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `samindu_backup_${new Date().toLocaleDateString().replace(/\//g, '-')}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  // Function to import data from a JSON backup file
  const handleImportData = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const backupData = JSON.parse(event.target.result);

        // Validate backup structure
        if (!backupData.inventory || !Array.isArray(backupData.inventory)) {
          throw new Error('Invalid backup file: missing inventory data');
        }
        if (!backupData.sales || !Array.isArray(backupData.sales)) {
          throw new Error('Invalid backup file: missing sales data');
        }

        // Confirm before replacing data
        const confirmRestore = window.confirm(
          `Are you sure you want to restore data from ${backupData.exportDate ? new Date(backupData.exportDate).toLocaleDateString() : 'this backup'}?\n\nThis will replace:\n✓ Inventory: ${backupData.inventory.length} items\n✓ Sales: ${backupData.sales.length} records\n✓ Routes: ${backupData.routes?.length || 0}\n✓ Expenses: ${backupData.expenses?.length || 0}\n✓ Statements: ${backupData.statements?.length || 0}\n\nCurrent data will be lost unless you export it first.`
        );

        if (!confirmRestore) return;

        let restored = {
          inventory: 0,
          sales: 0,
          routes: 0,
          expenses: 0,
          statements: 0
        };

        // Delete all current data
        await api.database.reset();

        // Restore inventory items
        if (backupData.inventory && backupData.inventory.length > 0) {
          for (const item of backupData.inventory) {
            try {
              await api.items.add(item);
              restored.inventory++;
            } catch (error) {
              console.warn('Failed to restore item:', item.name, error);
            }
          }
        }

        // Restore sales records
        if (backupData.sales && backupData.sales.length > 0) {
          for (const sale of backupData.sales) {
            try {
              await api.sales.add(sale);
              restored.sales++;
            } catch (error) {
              console.warn('Failed to restore sale record:', error);
            }
          }
        }

        // Restore routes
        if (backupData.routes && backupData.routes.length > 0) {
          for (const route of backupData.routes) {
            try {
              await api.routes.add(route);
              restored.routes++;
            } catch (error) {
              console.warn('Failed to restore route:', route, error);
            }
          }
        }

        // Restore expenses
        if (backupData.expenses && backupData.expenses.length > 0) {
          for (const expense of backupData.expenses) {
            try {
              await api.expenses.add(expense);
              restored.expenses++;
            } catch (error) {
              console.warn('Failed to restore expense:', error);
            }
          }
        }

        // Restore statements
        if (backupData.statements && backupData.statements.length > 0) {
          for (const statement of backupData.statements) {
            try {
              await api.statements.add(statement);
              restored.statements++;
            } catch (error) {
              console.warn('Failed to restore statement:', error);
            }
          }
        }

        // Restore company name if available
        if (backupData.companyName) {
          setCompanyName(backupData.companyName);
        }

        // Restore logo if available
        if (backupData.logo) {
          setLogo(backupData.logo);
        }

        // Restore settings
        if (backupData.settings) {
          if (backupData.settings.requirePassword !== undefined) {
            localStorage.setItem('samindu_require_password', String(backupData.settings.requirePassword));
          }
        }

        // Show detailed restore summary
        const summary = `✓ RESTORE COMPLETE!\n\n` +
          `✓ Inventory: ${restored.inventory} items\n` +
          `✓ Sales: ${restored.sales} records\n` +
          `✓ Routes: ${restored.routes} routes\n` +
          `✓ Expenses: ${restored.expenses} entries\n` +
          `✓ Statements: ${restored.statements} entries\n` +
          `✓ Company Name: ${backupData.companyName || 'unchanged'}\n` +
          `✓ Logo: ${backupData.logo ? 'restored' : 'none'}`;

        alert(summary);

        // Refresh the page to reflect changes
        window.location.reload();
      } catch (error) {
        console.error('Import error:', error);
        alert(`Error restoring backup: ${error.message}`);
      }
    };

    reader.readAsText(file);
    // Reset file input so same file can be selected again
    e.target.value = '';
  };

  return (
    <div className="settings-container">

      {/* 1. BRANDING & IDENTITY */}
      <div className="settings-section-card">
        <h3 className="settings-section-title">
          <Building size={18} /> Branding & Identity
        </h3>

        {/* Company Name Input */}
        <div className="settings-row">
          <div className="settings-info">
            <h4>Company Name</h4>
            <p>This name appears in the sidebar and on printed bills.</p>
          </div>
          <input
            type="text"
            className="inventory-input"
            style={{ width: '200px' }}
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
          />
        </div>

        {/* NEW: Logo Upload Section */}
        <div className="settings-row" style={{ marginTop: '20px', borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
          <div className="settings-info">
            <h4>Custom Logo</h4>
            <p>Upload a brand image to replace the sidebar text.</p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            {logo ? (
              <div style={{ position: 'relative', border: '1px solid var(--border-color)', padding: '5px', borderRadius: '4px' }}>
                <img src={logo} alt="Preview" style={{ height: '40px', display: 'block' }} />
                <button
                  onClick={() => setLogo(null)}
                  style={{
                    position: 'absolute', top: '-8px', right: '-8px',
                    background: '#c42b1c', color: 'white', borderRadius: '50%',
                    border: 'none', cursor: 'pointer', padding: '2px'
                  }}
                >
                  <X size={12} />
                </button>
              </div>
            ) : (
              <label className="add-btn" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ImageIcon size={16} />
                Upload Logo
                <input
                  type="file"
                  hidden
                  accept="image/*"
                  onChange={handleLogoUpload}
                />
              </label>
            )}
          </div>
        </div>
      </div>


      {/* 2. SECURITY & PRIVACY */}
      <div className="settings-section-card">
        <h3 className="settings-section-title">
          <Lock size={18} /> Security & Privacy
        </h3>

        <div className="settings-row" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '20px', marginTop: '20px' }}>
          <div className="settings-info">
            <h4>Authentication Preference</h4>
            <p>Always require a password when starting the system.</p>
            {!requirePassword && (
              <p style={{ color: '#eab308', fontSize: '11px', fontWeight: '600' }}>
                Quick Login Active: Clicking a profile will login immediately.
              </p>
            )}
          </div>
          <div className="toggle-switch">
            <input
              type="checkbox"
              id="password-toggle"
              checked={requirePassword}
              onChange={handleRequirePasswordToggle}
              className="toggle-checkbox"
            />
            <label htmlFor="password-toggle" className="toggle-label">
              <span className={requirePassword ? 'toggle-on' : 'toggle-off'}>
                {requirePassword ? 'REQURED' : 'OPTIONAL'}
              </span>
            </label>
          </div>
        </div>
      </div>

      {/* 3. ACCOUNT MANAGEMENT */}
      <div className="settings-section-card">
        <h3 className="settings-section-title">
          <UserPlus size={18} /> Account Management
        </h3>
        <div className="settings-row">
          <div className="settings-info">
            <h4>Logout</h4>
            <p>Securely exit your session and return to the login screen.</p>
          </div>
          <button
            className="reset-btn-danger"
            style={{ borderColor: 'var(--accent-color)', color: 'var(--accent-color)', background: 'transparent' }}
            onClick={onLogout}
          >
            <LogOut size={16} /> Logout Session
          </button>
        </div>
        <div className="settings-row">
          <div className="settings-info">
            <h4>Create New Account</h4>
            <p>Register an additional user account for this system.</p>
          </div>
          <button
            className="backup-btn"
            style={{ background: 'var(--accent-color)' }}
            onClick={onRegisterNew}
          >
            <UserPlus size={16} /> Add Account
          </button>
        </div>
        <div className="settings-row" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '20px', marginTop: '20px' }}>
          <div className="settings-info">
            <h4>Manage Existing Accounts</h4>
            <p>View and remove other user accounts from this system.</p>
          </div>
          <button
            className="inventory-btn"
            style={{ background: showAccountList ? 'var(--header-pill-bg)' : 'transparent', color: 'var(--text-main)', border: '1px solid var(--border-color)' }}
            onClick={() => setShowAccountList(!showAccountList)}
          >
            {showAccountList ? 'Hide List' : 'Show Accounts'}
          </button>
        </div>

        {showAccountList && (
          <div style={{ marginTop: '15px' }}>
            {users.map((u) => (
              <div
                key={u.username}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 15px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  borderRadius: '8px',
                  marginBottom: '8px',
                  border: '1px solid var(--border-color)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ background: 'var(--accent-color)', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', color: 'white' }}>
                    {u.username.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontWeight: '600', fontSize: '14px', color: 'var(--text-main)' }}>{u.username}</div>
                    <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.6)' }}>
                      {u.username === username ? 'Current Session' : 'Registered User'}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteAccount(u.username)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#c42b1c',
                    cursor: 'pointer',
                    padding: '8px',
                    borderRadius: '4px',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                  title="Delete Account"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 3. DATA MANAGEMENT (BACKUP) */}
      <div className="settings-section-card">
        <h3 className="settings-section-title">
          <Download size={18} /> Data Management
        </h3>
        <div className="settings-row">
          <div className="settings-info">
            <h4>Export Backup</h4>
            <p>Download all inventory and sales data to a .json file.</p>
          </div>
          <button className="backup-btn" onClick={handleExportData}>
            <Download size={16} /> Export JSON
          </button>
        </div>
        <div className="settings-row">
          <div className="settings-info">
            <h4>Import Backup</h4>
            <p>Restore data from a previously downloaded .json backup file.</p>
          </div>
          <label className="backup-btn" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Upload size={16} /> Import JSON
            <input
              type="file"
              hidden
              accept=".json"
              onChange={handleImportData}
            />
          </label>
        </div>
        <div className="settings-row">
          <div className="settings-info">
            <h4>Cloud Sync</h4>
            <p>Feature coming soon in the next update.</p>
          </div>
          <span style={{ fontSize: '11px', color: 'var(--text-light)', fontStyle: 'italic' }}>Inactive</span>
        </div>
      </div>

      {/* 4. APPEARANCE PREFERENCES */}
      <div className="settings-section-card">
        <h3 className="settings-section-title">
          <Palette size={18} /> Appearance
        </h3>
        <div className="settings-row">
          <div className="settings-info">
            <h4>Theme Mode</h4>
            <p>Switch between Light and Dark mode using the sidebar button.</p>
          </div>
          <span className="stock-tag">Active</span>
        </div>
        <div className="settings-row">
          <div className="settings-info">
            <h4>Compact Mode</h4>
            <p>Show more rows in tables by reducing padding.</p>
          </div>
          <input type="checkbox" disabled />
        </div>
      </div>

      {/* 5. DANGER ZONE */}
      <div className="settings-section-card" style={{ border: '1px solid rgba(196, 43, 28, 0.3)' }}>
        <h3 className="settings-section-title" style={{ color: '#c42b1c' }}>
          <ShieldAlert size={18} /> Danger Zone
        </h3>
        <div className="settings-row">
          <div className="settings-info">
            <h4>Factory Reset</h4>
            <p>Permanently delete all sales, inventory, and system settings.</p>
          </div>
          <button className="reset-btn-danger" onClick={onFullReset}>
            <Trash2 size={16} /> Reset All
          </button>
        </div>
      </div>

      {/* 6. SOFTWARE INFORMATION */}
      <div className="settings-section-card">
        <h3 className="settings-section-title">
          <Info size={18} /> Software Information
        </h3>
        <div className="settings-row">
          <div className="settings-info">
            <h4>Application Name</h4>
            <p>Samindu System v1.0</p>
          </div>
        </div>
        <div className="settings-row">
          <div className="settings-info">
            <h4>Developer</h4>
            <p>W2 Tech Solutions</p>
          </div>
        </div>
        <div className="settings-row">
          <div className="settings-info">
            <h4>Support & Inquiries</h4>
            <p>Need help or custom features?</p>
          </div>
          <button
            className="backup-btn"
            style={{ background: 'var(--accent-color)' }}
            onClick={() => window.open('mailto:jwaduge819@gmail.com')}
          >
            <Mail size={16} /> Contact Support
          </button>
        </div>
      </div>

    </div >
  );
};

export default Settings;