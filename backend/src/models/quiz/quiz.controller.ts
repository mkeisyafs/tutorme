import QuizService from "./quiz.service";

export class QuizController {
  static async getAll({ query }: any) {
    return QuizService.list(query);
  }

  static async getById({ params, error }: any) {
    const quiz = await QuizService.getById(params.id);
    if (!quiz) {
      return error(404, { message: "Quiz not found" });
    }
    return quiz;
  }

  static async create({ body }: any) {
    return QuizService.create(body);
  }

  static async update({ params, body }: any) {
    return QuizService.update(params.id, body);
  }

  static async delete({ params }: any) {
    return QuizService.delete(params.id);
  }
}
