import crypto from "crypto";

export interface DraftLesson {
  id: string; // Temporary ID
  title: string;
  orderIndex: number;
}

export interface DraftModule {
  id: string; // Temporary ID
  title: string;
  description: string | null;
  orderIndex: number;
  lessons: DraftLesson[];
}

export interface DraftOutline {
  draftId: string;
  topic: string;
  courseTitle: string;
  courseDescription: string;
  courseCategory: string;
  courseLevel: string;
  modules: DraftModule[];
  createdAt: Date;
  userId: string;
}

import fs from "fs";
import path from "path";

/**
 * In-memory cache for temporary course outlines, backed by a local file
 * so it survives server restarts during development.
 * In a production environment, this should be backed by Redis.
 */
class OutlineCacheService {
  private cache = new Map<string, DraftOutline>();
  private cacheFilePath = path.join(process.cwd(), ".draft-cache.json");

  constructor() {
    this.loadCache();
  }

  private loadCache() {
    try {
      if (fs.existsSync(this.cacheFilePath)) {
        const data = fs.readFileSync(this.cacheFilePath, "utf8");
        const parsed = JSON.parse(data);
        for (const [key, value] of Object.entries(parsed)) {
          const draft = value as DraftOutline;
          if (typeof draft.createdAt === "string") {
            draft.createdAt = new Date(draft.createdAt);
          }
          this.cache.set(key, draft);
        }
      }
    } catch (e) {
      console.error("Failed to load draft cache from disk", e);
    }
  }

  private persistCache() {
    try {
      const obj = Object.fromEntries(this.cache.entries());
      fs.writeFileSync(this.cacheFilePath, JSON.stringify(obj, null, 2), "utf8");
    } catch (e) {
      console.error("Failed to write draft cache to disk", e);
    }
  }

  save(draft: DraftOutline): string {
    if (!draft.draftId) {
      draft.draftId = crypto.randomUUID();
    }
    this.cache.set(draft.draftId, draft);
    this.persistCache();
    return draft.draftId;
  }

  get(draftId: string): DraftOutline | undefined {
    return this.cache.get(draftId);
  }

  update(draftId: string, updates: Partial<DraftOutline>): DraftOutline | undefined {
    const existing = this.cache.get(draftId);
    if (!existing) return undefined;
    
    const updated = { ...existing, ...updates };
    this.cache.set(draftId, updated);
    this.persistCache();
    return updated;
  }

  delete(draftId: string): void {
    this.cache.delete(draftId);
    this.persistCache();
  }
}

export const outlineCache = new OutlineCacheService();
