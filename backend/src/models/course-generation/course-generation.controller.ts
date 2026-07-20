import CourseGenerationService from "./course-generation.service";

export class CourseGenerationController {
  static async getAll({ query }: any) {
    return CourseGenerationService.list(query);
  }

  static async getById({ params, error }: any) {
    const generation = await CourseGenerationService.getById(params.id);
    if (!generation) {
      return error(404, { message: "Generation not found" });
    }
    return generation;
  }

  static async create({ body }: any) {
    return CourseGenerationService.create(body);
  }

  static async update({ params, body }: any) {
    return CourseGenerationService.update(params.id, body);
  }

  static async delete({ params }: any) {
    return CourseGenerationService.delete(params.id);
  }
}
