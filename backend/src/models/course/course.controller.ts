import CourseService from "./course.service";

export class CourseController {
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

  static async delete({ params }: any) {
    return CourseService.delete(params.id);
  }
}
