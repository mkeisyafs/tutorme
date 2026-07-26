import CourseService from "./course.service";

export class CourseController {
  static async getLibrary({ query, user }: any) {
    return CourseService.listLibrary(user.sub, query);
  }

  static async getMine({ user }: any) {
    return CourseService.listMine(user.sub);
  }

  static async share({ params, user, error }: any) {
    const result = await CourseService.share(user.sub, params.id);
    if (result?.error === "NOT_FOUND") {
      return error(404, { message: "Course not found or you do not own it" });
    }
    if (result?.error === "NOT_COMPLETED") {
      return error(400, { message: "You can only share a course after completing it" });
    }
    return result.data;
  }

  static async reuse({ params, user, error }: any) {
    const enrollment = await CourseService.reuse(user.sub, params.id);
    if (!enrollment) {
      return error(404, { message: "Shared course not found" });
    }
    return enrollment;
  }

  static async getAll({ query }: any) {
    return CourseService.list(query);
  }

  static async getById({ params, error }: any) {
    const course = await CourseService.getById(params.id);
    if (!course) {
      return error(404, { message: "Course not found" });
    }
    return course;
  }

  static async create({ body }: any) {
    return CourseService.create(body);
  }

  static async update({ params, body }: any) {
    return CourseService.update(params.id, body);
  }

  static async delete({ params, user, error }: any) {
    const result = await CourseService.delete(user.sub, params.id);
    if (result?.error === "NOT_FOUND") {
      return error(404, { message: "Course not found or you do not own it" });
    }
    return result.data;
  }
}
