import UserCourseService from "./user-course.service";

export class UserCourseController {
  static async getAll({ query }: any) {
    return UserCourseService.list(query);
  }

  static async getById({ params, error }: any) {
    const userCourse = await UserCourseService.getById(params.id);
    if (!userCourse) {
      return error(404, { message: "Enrollment not found" });
    }
    return userCourse;
  }

  static async create({ body, error }: any) {
    try {
      return await UserCourseService.create(body);
    } catch (e: any) {
      return error(400, { message: e.message });
    }
  }

  static async update({ params, body }: any) {
    return UserCourseService.update(params.id, body);
  }

  static async delete({ params }: any) {
    return UserCourseService.delete(params.id);
  }
}
