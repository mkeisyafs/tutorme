import { describe, expect, test } from "bun:test";

const persistenceUrl = new URL("./course-persistence.service.ts", import.meta.url);
const cacheUrl = new URL("./outline-cache.service.ts", import.meta.url);
const contextUrl = new URL("../../../../../frontend/src/context/CourseGenerationContext.tsx", import.meta.url);
const roadmapUrl = new URL("../../../../../frontend/src/pages/Roadmap.tsx", import.meta.url);

describe("draft publish lifecycle contracts", () => {
  test("Given a draft When published twice Then the existing course is reused instead of duplicated", async () => {
    const cache = await Bun.file(cacheUrl).text();
    const source = await Bun.file(persistenceUrl).text();

    expect(cache).toContain("publishedCourseId?: string");

    const reuseIndex = source.indexOf("if (draft.publishedCourseId)");
    const createIndex = source.indexOf("prisma.$transaction");
    expect(reuseIndex).toBeGreaterThan(-1);
    expect(createIndex).toBeGreaterThan(reuseIndex);
    expect(source).toContain("outlineCache.update(draftId, { publishedCourseId: course.id })");
  });

  test("Given publishing succeeds When lesson generation is still running Then the local draft is already removed", async () => {
    const source = await Bun.file(contextUrl).text();

    const removeIndex = source.indexOf("removeDraftFromLocalStorage(draftIdVal)");
    const lessonGenerateIndex = source.indexOf("/generate`");
    expect(removeIndex).toBeGreaterThan(-1);
    expect(lessonGenerateIndex).toBeGreaterThan(removeIndex);
    expect(source.match(/removeDraftFromLocalStorage\(draftIdVal\)/g)).toHaveLength(1);
  });

  test("Given a published draft is reopened When the roadmap loads Then it is not re-saved as a local draft", async () => {
    const source = await Bun.file(roadmapUrl).text();

    expect(source).toContain("if (data.publishedCourseId)");
    expect(source).toContain("removeDraftFromLocalStorage(data.draftId)");
    expect(source).toContain("if (!updatedDraft.publishedCourseId)");
  });
});
