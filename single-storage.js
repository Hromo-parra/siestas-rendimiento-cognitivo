import { DATABASE_NAME } from './single-protocol.js';

// Base independiente: los registros del piloto cruzado anterior no se modifican.
async function database() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, 1);
    request.onupgradeneeded = () => request.result.createObjectStore('sessions', { keyPath: 'id' });
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveSession(session) {
  const db = await database();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('sessions', 'readwrite');
    transaction.objectStore('sessions').put(session);
    transaction.oncomplete = () => { db.close(); resolve(); };
    transaction.onabort = transaction.onerror = () => { db.close(); reject(transaction.error); };
  });
}

export async function listSessions() {
  const db = await database();
  return new Promise((resolve, reject) => {
    const request = db.transaction('sessions').objectStore('sessions').getAll();
    request.onsuccess = () => { db.close(); resolve(request.result); };
    request.onerror = () => { db.close(); reject(request.error); };
  });
}
