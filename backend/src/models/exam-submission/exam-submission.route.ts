import { Elysia } from "elysia";
import { ExamSubmissionController } from "./exam-submission.controller";
import {
  CreateExamSubmissionBody,
  UpdateExamSubmissionBody,
  ExamSubmissionParams,
  ExamSubmissionListQuery,
} from "./exam-submission.schema";

export const examSubmissionRoute = new Elysia({ prefix: "/exam-submissions" })
  .get("/", ExamSubmissionController.getAll, { query: ExamSubmissionListQuery })
  .get("/:id", ExamSubmissionController.getById, { params: ExamSubmissionParams })
  .post("/", ExamSubmissionController.create, { body: CreateExamSubmissionBody })
  .patch("/:id", ExamSubmissionController.update, { params: ExamSubmissionParams, body: UpdateExamSubmissionBody })
  .delete("/:id", ExamSubmissionController.delete, { params: ExamSubmissionParams });

export default examSubmissionRoute;
