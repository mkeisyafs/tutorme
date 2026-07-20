import { Elysia } from "elysia";
import { QuestionController } from "./question.controller";
import {
  CreateQuestionBody,
  UpdateQuestionBody,
  QuestionParams,
  QuestionListQuery,
} from "./question.schema";

export const questionRoute = new Elysia({ prefix: "/questions" })
  .get("/", QuestionController.getAll, { query: QuestionListQuery })
  .get("/:id", QuestionController.getById, { params: QuestionParams })
  .post("/", QuestionController.create, { body: CreateQuestionBody })
  .patch("/:id", QuestionController.update, { params: QuestionParams, body: UpdateQuestionBody })
  .delete("/:id", QuestionController.delete, { params: QuestionParams });

export default questionRoute;
