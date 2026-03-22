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

// items collection
export const itemsDb = {
  getAll: async () => {
    const q = query(collection(db, 'items'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
  },
  add: async (item) => {
    const docRef = await addDoc(collection(db, 'items'), {
      ...item,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    return { ...item, id: docRef.id };
  },
  update: async (id, item) => {
    const docRef = doc(db, 'items', id);
    await updateDoc(docRef, {
      ...item,
      updatedAt: new Date().toISOString()
    });
    return { ...item, id };
  },
  delete: async (id) => {
    await deleteDoc(doc(db, 'items', id));
  }
};

// sales collection
export const salesDb = {
  getAll: async () => {
    const q = query(collection(db, 'sales'), orderBy('date', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
  },
  add: async (sale) => {
    const docRef = await addDoc(collection(db, 'sales'), {
      ...sale,
      createdAt: new Date().toISOString()
    });
    return { ...sale, id: docRef.id };
  },
  update: async (id, sale) => {
    const docRef = doc(db, 'sales', id);
    await updateDoc(docRef, sale);
    return { ...sale, id };
  },
  delete: async (id) => {
    await deleteDoc(doc(db, 'sales', id));
  }
};

// expenses collection
export const expensesDb = {
  getAll: async () => {
    const q = query(collection(db, 'expenses'), orderBy('date', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
  },
  add: async (expense) => {
    const docRef = await addDoc(collection(db, 'expenses'), {
      ...expense,
      createdAt: new Date().toISOString()
    });
    return { ...expense, id: docRef.id };
  },
  delete: async (id) => {
    await deleteDoc(doc(db, 'expenses', id));
  }
};

// statements collection
export const statementsDb = {
  getAll: async () => {
    const q = query(collection(db, 'statements'), orderBy('date', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
  },
  add: async (statement) => {
    const docRef = await addDoc(collection(db, 'statements'), {
      ...statement,
      createdAt: new Date().toISOString()
    });
    return { ...statement, id: docRef.id };
  },
  delete: async (id) => {
    await deleteDoc(doc(db, 'statements', id));
  }
};

// routes collection
export const routesDb = {
  getAll: async () => {
    const q = query(collection(db, 'routes'), orderBy('name', 'asc'));
    const snapshot = await getDocs(q);
    const routes = snapshot.docs.map(d => d.data());
    if (routes.length === 0) {
      return ["General Route"];
    }
    return routes.map(r => r.name);
  },
  add: async (name) => {
    await addDoc(collection(db, 'routes'), { name, createdAt: new Date().toISOString() });
    return name;
  },
  delete: async (name) => {
    const q = query(collection(db, 'routes'));
    const snapshot = await getDocs(q);
    const routeDoc = snapshot.docs.find(d => d.data().name === name);
    if (routeDoc) {
      await deleteDoc(doc(db, 'routes', routeDoc.id));
    }
    return true;
  }
};

// settings collection
export const settingsDb = {
  get: async (key) => {
    const docRef = doc(db, 'settings', key);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data().value;
    }
    return null;
  },
  set: async (key, value) => {
    const docRef = doc(db, 'settings', key);
    await setDoc(docRef, {
      key,
      value,
      updatedAt: new Date().toISOString()
    });
    return true;
  }
};

export const systemDb = {
  init: async (username) => {
    try {
      const q = query(collection(db, 'routes'));
      const snapshot = await getDocs(q);
      if (snapshot.empty) {
        await addDoc(collection(db, 'routes'), { name: 'General Route', createdAt: new Date().toISOString() });
      }
    } catch(err) {
      console.error("Firebase init fallback", err);
    }
    return true;
  },
  reset: async () => {
    const collections = ['items', 'sales', 'expenses', 'statements', 'routes', 'settings'];
    for (const col of collections) {
      const q = query(collection(db, col));
      const snap = await getDocs(q);
      const deletePromises = snap.docs.map(d => deleteDoc(doc(db, col, d.id)));
      await Promise.all(deletePromises);
    }
    return true;
  },
  deleteUser: async () => {
    await systemDb.reset();
    return { success: true };
  }
};
