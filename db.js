const DB_NAME = 'nap-study-pilot-v1';
const STORES = ['profiles', 'sessions', 'assessments', 'trials', 'events'];

function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      for (const store of STORES) if (!db.objectStoreNames.contains(store)) db.createObjectStore(store, { keyPath: 'row_id' });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function put(store, value) {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(store, 'readwrite');
    transaction.objectStore(store).put(value);
    transaction.oncomplete = () => { db.close(); resolve(value); };
    transaction.onerror = () => reject(transaction.error);
  });
}

export async function get(store, key) {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const request = db.transaction(store).objectStore(store).get(key);
    request.onsuccess = () => { db.close(); resolve(request.result); };
    request.onerror = () => reject(request.error);
  });
}

export async function all(store) {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const request = db.transaction(store).objectStore(store).getAll();
    request.onsuccess = () => { db.close(); resolve(request.result); };
    request.onerror = () => reject(request.error);
  });
}

export async function recordEvent(type, details = {}) {
  const timestamp = new Date().toISOString();
  return put('events', { row_id: crypto.randomUUID(), type, timestamp, ...details });
}

export async function exportAll() {
  const result = { schema_version: 1, exported_at: new Date().toISOString() };
  for (const store of STORES) result[store] = await all(store);
  return result;
}

