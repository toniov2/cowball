/** IndexedDB store with rolling snapshots. localStorage ('cowball') stays the legacy primary; this is a validated mirror
 *  that survives a full localStorage quota and lets the game restore a lost save. */
const DB = 'cowball-v2';
const STORE = 'saves';
const KEEP = 5;

export interface Snapshot {
  key: string;
  at: number;
  json: string;
}

function open(): Promise<IDBDatabase> {
  return new Promise((res, rej) => {
    const r = indexedDB.open(DB, 1);
    r.onupgradeneeded = () => r.result.createObjectStore(STORE, { keyPath: 'key' });
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error ?? new Error('indexedDB open failed'));
  });
}

function tx<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return open().then(
    (db) =>
      new Promise<T>((res, rej) => {
        const t = db.transaction(STORE, mode);
        const req = fn(t.objectStore(STORE));
        t.oncomplete = () => {
          db.close();
          res(req.result);
        };
        t.onerror = t.onabort = () => {
          db.close();
          rej(t.error ?? new Error('tx failed'));
        };
      }),
  );
}

export async function writeSnapshot(json: string, now = Date.now()): Promise<void> {
  await tx('readwrite', (s) => s.put({ key: 'latest', at: now, json } satisfies Snapshot));
  // rolling history: one snapshot per minute at most, newest KEEP kept
  const all = (await tx('readonly', (s) => s.getAll())) as Snapshot[];
  const hist = all.filter((x) => x.key.startsWith('h:')).sort((a, b) => b.at - a.at);
  if (!hist[0] || now - hist[0].at >= 60_000) {
    await tx('readwrite', (s) => s.put({ key: `h:${now}`, at: now, json } satisfies Snapshot));
    for (const old of hist.slice(KEEP - 1)) await tx('readwrite', (s) => s.delete(old.key));
  }
}

export async function readLatest(): Promise<Snapshot | null> {
  return ((await tx('readonly', (s) => s.get('latest'))) as Snapshot | undefined) ?? null;
}

export async function listHistory(): Promise<Snapshot[]> {
  return ((await tx('readonly', (s) => s.getAll())) as Snapshot[])
    .filter((x) => x.key.startsWith('h:'))
    .sort((a, b) => b.at - a.at);
}
