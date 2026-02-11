export type LocalScoreRow = {
  id?: number;
  anonId: string;
  score: number;
  createdAt: string;
};

const DB_NAME = "nexus-rush-db";
const STORE_NAME = "scores";
const DB_VERSION = 1;

let dbPromise: Promise<IDBDatabase | null> | null = null;

const requestToPromise = <T>(request: IDBRequest<T>) =>
  new Promise<T>((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

const transactionDone = (tx: IDBTransaction) =>
  new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });

const openDb = (): Promise<IDBDatabase | null> => {
  if (dbPromise) return dbPromise;
  if (typeof window === "undefined" || !("indexedDB" in window)) {
    dbPromise = Promise.resolve(null);
    return dbPromise;
  }

  dbPromise = new Promise((resolve, reject) => {
    const req = window.indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: "id", autoIncrement: true });
        store.createIndex("score", "score", { unique: false });
        store.createIndex("createdAt", "createdAt", { unique: false });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });

  return dbPromise;
};

export const addLocalScore = async (row: Omit<LocalScoreRow, "id" | "createdAt"> & { createdAt?: string }) => {
  const db = await openDb();
  if (!db) return;

  const tx = db.transaction(STORE_NAME, "readwrite");
  tx.objectStore(STORE_NAME).add({
    anonId: row.anonId,
    score: row.score,
    createdAt: row.createdAt ?? new Date().toISOString()
  });
  await transactionDone(tx);
};

export const getTopLocalScores = async (limit = 50): Promise<LocalScoreRow[]> => {
  const db = await openDb();
  if (!db) return [];

  const tx = db.transaction(STORE_NAME, "readonly");
  const rows = (await requestToPromise(tx.objectStore(STORE_NAME).getAll())) as LocalScoreRow[];
  rows.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
  return rows.slice(0, limit);
};
