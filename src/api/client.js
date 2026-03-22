import { 
  itemsDb, 
  salesDb, 
  expensesDb, 
  statementsDb, 
  routesDb, 
  settingsDb, 
  systemDb 
} from '../db/db';

// Fallback UUID generator if Crypto API fails
function generateUUID() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

const api = {
  // Machine ID mock for PWA
  getMachineId: async () => {
    let id = localStorage.getItem('machine_id');
    if (!id) {
      id = generateUUID();
      localStorage.setItem('machine_id', id);
    }
    return { success: true, machineId: id };
  },

  // Open External Links
  openExternal: async (url) => {
    window.open(url, '_blank');
    return { success: true };
  },

  // PDF Save API replacement
  pdf: {
    save: async (buffer, filename) => {
      try {
        const blob = new Blob([buffer], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename || 'Monthly_Report.pdf';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        return { success: true, filePath: 'Downloads folder' };
      } catch (error) {
        console.error('Failed to save PDF in browser:', error);
        return { success: false, error: error.message };
      }
    }
  },

  // Database APIs
  items: itemsDb,
  sales: salesDb,
  expenses: expensesDb,
  statements: statementsDb,
  routes: routesDb,
  settings: settingsDb,
  database: systemDb
};

export default api;
