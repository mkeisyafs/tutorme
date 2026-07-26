import { describe, expect, test } from "bun:test";

const routeUrl = new URL("./course.route.ts", import.meta.url);
const serviceUrl = new URL("./course.service.ts", import.meta.url);

describe("Course deletion contract", () => {
  test("Given the delete route When inspected Then it sits behind requireAuth", async () => {
    const route = await Bun.file(routeUrl).text();
    const [publicSection, protectedSection] = [
      route.slice(route.indexOf("export const courseRoute")),
      route.slice(route.indexOf("const libraryRoute"), route.indexOf("export const courseRoute")),
    ];

    expect(protectedSection).toContain("requireAuth");
    expect(protectedSection).toContain('.delete("/:id", CourseController.delete');
    expect(publicSection).not.toContain(".delete(");
  });

  test("Given the delete service When inspected Then it scopes the lookup to the creator", async () => {
    const service = await Bun.file(serviceUrl).text();
    const deleteBody = service.slice(service.indexOf("static async delete("));

    expect(deleteBody).toContain("creatorId: userId");
    expect(deleteBody).toContain('return { error: "NOT_FOUND" }');
    // The ownership check must precede the destructive call.
    expect(deleteBody.indexOf("creatorId: userId")).toBeLessThan(deleteBody.indexOf("prisma.course.delete"));
  });
});
