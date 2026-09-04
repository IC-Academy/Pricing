// ============================================================================
// Storage abstraction
// ----------------------------------------------------------------------------
// Every module talks to data through the Repository<T> interface below, never
// directly through window.localStorage. Today LocalStorageRepository is the
// only implementation; swapping local storage for a real API/SQL backend (or
// Microsoft 365 / Dataverse) later means writing one new class that satisfies
// this same interface — nothing in the UI or the engines needs to change.
// ============================================================================

export interface Repository<T extends { id: string }> {
  getAll(): T[];
  getById(id: string): T | undefined;
  create(item: T): T;
  update(id: string, patch: Partial<T>): T | undefined;
  replace(id: string, item: T): T | undefined;
  remove(id: string): void;
  setAll(items: T[]): void;
}

const NAMESPACE = "pm365";

function readRaw<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeRaw<T>(key: string, value: T): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(`[storage] failed to persist ${key}`, err);
  }
}

export class LocalStorageRepository<T extends { id: string }> implements Repository<T> {
  private key: string;

  constructor(collectionName: string) {
    this.key = `${NAMESPACE}:${collectionName}`;
  }

  getAll(): T[] {
    return readRaw<T[]>(this.key, []);
  }

  getById(id: string): T | undefined {
    return this.getAll().find((x) => x.id === id);
  }

  create(item: T): T {
    const all = this.getAll();
    all.push(item);
    writeRaw(this.key, all);
    return item;
  }

  update(id: string, patch: Partial<T>): T | undefined {
    const all = this.getAll();
    const idx = all.findIndex((x) => x.id === id);
    if (idx === -1) return undefined;
    all[idx] = { ...all[idx], ...patch };
    writeRaw(this.key, all);
    return all[idx];
  }

  replace(id: string, item: T): T | undefined {
    const all = this.getAll();
    const idx = all.findIndex((x) => x.id === id);
    if (idx === -1) return undefined;
    all[idx] = item;
    writeRaw(this.key, all);
    return item;
  }

  remove(id: string): void {
    const all = this.getAll().filter((x) => x.id !== id);
    writeRaw(this.key, all);
  }

  setAll(items: T[]): void {
    writeRaw(this.key, items);
  }
}

/** A single JSON-serializable value keyed in localStorage (for config, session, etc). */
export class LocalStorageValue<T> {
  private key: string;
  private fallback: T;

  constructor(name: string, fallback: T) {
    this.key = `${NAMESPACE}:${name}`;
    this.fallback = fallback;
  }

  get(): T {
    return readRaw<T>(this.key, this.fallback);
  }

  set(value: T): void {
    writeRaw(this.key, value);
  }

  clear(): void {
    window.localStorage.removeItem(this.key);
  }
}

export function clearAllPm365Storage(): void {
  const toRemove: string[] = [];
  for (let i = 0; i < window.localStorage.length; i++) {
    const key = window.localStorage.key(i);
    if (key && key.startsWith(`${NAMESPACE}:`)) toRemove.push(key);
  }
  toRemove.forEach((k) => window.localStorage.removeItem(k));
}
