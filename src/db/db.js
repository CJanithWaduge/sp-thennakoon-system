import { 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  orderBy,
  setDoc,
  getDoc
} from 'firebase/firestore';
import { db } from './firebase-config';

// Track the logged-in user to scope all database operations!
let currentUserId = localStorage.getItem('samindu_current_user') || 'default';

// Helper to get the scoped path for a user's collection
const getScopedCollection = (colName) => {
  return collection(db, 'users', currentUserId, colName);
};

// items collection
export const itemsDb = {
  getAll: async () => {
    const q = query(getScopedCollection('items'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
  },
  add: async (item) => {
    const docRef = await addDoc(getScopedCollection('items'), {
      ...item,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    return { ...item, id: docRef.id };
  },
  update: async (id, item) => {
    const docRef = doc(db, 'users', currentUserId, 'items', id);
    await updateDoc(docRef, {
      ...item,
      updatedAt: new Date().toISOString()
    });
    return { ...item, id };
  },
  delete: async (id) => {
    await deleteDoc(doc(db, 'users', currentUserId, 'items', id));
  }
};

// sales collection
export const salesDb = {
  getAll: async () => {
    const q = query(getScopedCollection('sales'), orderBy('date', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
  },
  add: async (sale) => {
    const docRef = await addDoc(getScopedCollection('sales'), {
      ...sale,
      createdAt: new Date().toISOString()
    });
    return { ...sale, id: docRef.id };
  },
  update: async (id, sale) => {
    const docRef = doc(db, 'users', currentUserId, 'sales', id);
    await updateDoc(docRef, sale);
    return { ...sale, id };
  },
  delete: async (id) => {
    await deleteDoc(doc(db, 'users', currentUserId, 'sales', id));
  }
};

// expenses collection
export const expensesDb = {
  getAll: async () => {
    const q = query(getScopedCollection('expenses'), orderBy('date', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
  },
  add: async (expense) => {
    const docRef = await addDoc(getScopedCollection('expenses'), {
      ...expense,
      createdAt: new Date().toISOString()
    });
    return { ...expense, id: docRef.id };
  },
  delete: async (id) => {
    await deleteDoc(doc(db, 'users', currentUserId, 'expenses', id));
  }
};

// statements collection
export const statementsDb = {
  getAll: async () => {
    const q = query(getScopedCollection('statements'), orderBy('date', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
  },
  add: async (statement) => {
    const docRef = await addDoc(getScopedCollection('statements'), {
      ...statement,
      createdAt: new Date().toISOString()
    });
    return { ...statement, id: docRef.id };
  },
  delete: async (id) => {
    await deleteDoc(doc(db, 'users', currentUserId, 'statements', id));
  }
};

// routes collection
export const routesDb = {
  getAll: async () => {
    const q = query(getScopedCollection('routes'), orderBy('name', 'asc'));
    const snapshot = await getDocs(q);
    const routes = snapshot.docs.map(d => d.data());
    if (routes.length === 0) {
      return ["General Route"];
    }
    return routes.map(r => r.name);
  },
  add: async (name) => {
    await addDoc(getScopedCollection('routes'), { name, createdAt: new Date().toISOString() });
    return name;
  },
  delete: async (name) => {
    const q = query(getScopedCollection('routes'));
    const snapshot = await getDocs(q);
    const routeDoc = snapshot.docs.find(d => d.data().name === name);
    if (routeDoc) {
      await deleteDoc(doc(db, 'users', currentUserId, 'routes', routeDoc.id));
    }
    return true;
  }
};

// settings collection
export const settingsDb = {
  get: async (key) => {
    const docRef = doc(db, 'users', currentUserId, 'settings', key);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data().value;
    }
    return null;
  },
  set: async (key, value) => {
    const docRef = doc(db, 'users', currentUserId, 'settings', key);
    await setDoc(docRef, {
      key,
      value,
      updatedAt: new Date().toISOString()
    });
    return true;
  }
};

export const systemDb = {
  // Set the current user and initialize their database space
  init: async (username) => {
    if (!username) return false;
    currentUserId = username;
    
    try {
      // Ensure 'General Route' exists for new users
      const q = query(getScopedCollection('routes'));
      const snapshot = await getDocs(q);
      if (snapshot.empty) {
        await addDoc(getScopedCollection('routes'), { name: 'General Route', createdAt: new Date().toISOString() });
      }
    } catch(err) {
      console.error("Firebase init fallback", err);
    }
    return true;
  },

  // Reset ONLY the current user's data
  reset: async () => {
    if (!currentUserId) return false;
    
    const collections = ['items', 'sales', 'expenses', 'statements', 'routes', 'settings'];
    for (const col of collections) {
      const q = query(getScopedCollection(col));
      const snap = await getDocs(q);
      const deletePromises = snap.docs.map(d => deleteDoc(doc(db, 'users', currentUserId, col, d.id)));
      await Promise.all(deletePromises);
    }
    return true;
  },

  // Delete a specific user's database space
  deleteUser: async (username) => {
    if (!username) return { success: false };
    
    // Save current user to restore it later
    const previousUser = currentUserId;
    
    // Switch context to the target user
    currentUserId = username;
    await systemDb.reset();
    
    // Restore context
    currentUserId = previousUser;
    
    return { success: true };
  }
};
