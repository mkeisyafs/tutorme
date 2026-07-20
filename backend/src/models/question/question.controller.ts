import QuestionService from "./question.service";

export class QuestionController {
  static async getAll({ query }: any) {
    return QuestionService.list(query);
  }

  static async getById({ params, error }: any) {
    const question = await QuestionService.getById(params.id);
    if (!question) {
      return error(404, { message: "Question not found" });
    }
    return question;
  }

  static async create({ body }: any) {
    return QuestionService.create(body);
  }

  static async update({ params, body }: any) {
    return QuestionService.update(params.id, body);
  }

  static async delete({ params }: any) {
    return QuestionService.delete(params.id);
  }
}
