import ExamSubmissionService from "./exam-submission.service";

export class ExamSubmissionController {
  static async getAll({ query }: any) {
    return ExamSubmissionService.list(query);
  }

  static async getById({ params, error }: any) {
    const submission = await ExamSubmissionService.getById(params.id);
    if (!submission) {
      return error(404, { message: "Exam submission not found" });
    }
    return submission;
  }

  static async create({ body }: any) {
    return ExamSubmissionService.create(body);
  }

  static async update({ params, body }: any) {
    return ExamSubmissionService.update(params.id, body);
  }

  static async delete({ params }: any) {
    return ExamSubmissionService.delete(params.id);
  }
}
