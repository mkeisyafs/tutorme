import LessonService from "./lesson.service";

export class LessonController {
  static async getAll({ query }: any) {
    return LessonService.list(query);
  }

  static async getById({ params, error }: any) {
    const lesson = await LessonService.getById(params.id);
    if (!lesson) {
      return error(404, { message: "Lesson not found" });
    }
    return lesson;
  }

  static async create({ body }: any) {
    return LessonService.create(body);
  }

  static async update({ params, body }: any) {
    return LessonService.update(params.id, body);
  }

  static async delete({ params }: any) {
    return LessonService.delete(params.id);
  }
}
