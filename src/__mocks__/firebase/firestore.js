import { vi } from 'vitest';

const store = {};

export const collection = vi.fn((db, path) => ({ db, path }));
export const doc = vi.fn((db, ...pathParts) => ({ db, path: pathParts.join('/') }));
export const getDoc = vi.fn(async (docRef) => {
  const data = store[docRef.path];
  return { exists: () => !!data, data: () => data, id: docRef.path.split('/').pop() };
});
export const getDocs = vi.fn(async (q) => {
  const docs = Object.entries(store).map(([key, val]) => ({ id: key.split('/').pop(), data: () => val }));
  return { docs, empty: docs.length === 0, forEach: (cb) => docs.forEach(cb) };
});
export const addDoc = vi.fn(async (colRef, data) => {
  const id = `test-id-${Date.now()}`;
  store[id] = data;
  return { id };
});
export const setDoc = vi.fn(async (docRef, data) => {
  store[docRef.path] = data;
  return data;
});
export const updateDoc = vi.fn(async (docRef, data) => {
  if (store[docRef.path]) Object.assign(store[docRef.path], data);
  else store[docRef.path] = data;
});
export const deleteDoc = vi.fn(async (docRef) => {
  delete store[docRef.path];
});
export const query = vi.fn((colRef, ...rest) => ({ ...colRef, ...rest }));
export const orderBy = vi.fn((field, dir) => ({ field, dir }));
export const serverTimestamp = vi.fn(() => new Date().toISOString());
export const getFirestore = vi.fn(() => ({ app: 'test-app' }));
export const enableIndexedDbPersistence = vi.fn(() => Promise.resolve());

export const clearStore = () => {
  Object.keys(store).forEach(key => delete store[key]);
};
