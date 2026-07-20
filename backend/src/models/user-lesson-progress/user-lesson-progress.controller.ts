import UserLessonProgressService from "./user-lesson-progress.service";

export class UserLessonProgressController {
  static async getAll({ query }: any) {
    return UserLessonProgressService.list(query);
  }

  static async getById({ params, error }: any) {
    const progress = await UserLessonProgressService.getById(params.id);
    if (!progress) {
      return error(404, { message: "Progress not found" });
    }
    return progress;
  }

  static async create({ body }: any) {
    return UserLessonProgressService.create(body);
  }

  static async update({ params, body }: any) {
    return UserLessonProgressService.update(params.id, body);
  }

  static async delete({ params }: any) {
    return UserLessonProgressService.delete(params.id);
  }
}
