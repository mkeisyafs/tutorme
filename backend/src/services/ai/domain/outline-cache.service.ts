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

/**
 * In-memory cache for temporary course outlines.
 * In a production environment, this should be backed by Redis.
 */
class OutlineCacheService {
  private cache = new Map<string, DraftOutline>();

  save(draft: DraftOutline): string {
    if (!draft.draftId) {
      draft.draftId = crypto.randomUUID();
    }
    this.cache.set(draft.draftId, draft);
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
    return updated;
  }

  delete(draftId: string): void {
    this.cache.delete(draftId);
  }
}

export const outlineCache = new OutlineCacheService();
