import { Elysia } from "elysia";
import { QuizController } from "./quiz.controller";
import {
  CreateQuizBody,
  UpdateQuizBody,
  QuizParams,
  QuizListQuery,
} from "./quiz.schema";

export const quizRoute = new Elysia({ prefix: "/quizzes" })
  .get("/", QuizController.getAll, { query: QuizListQuery })
  .get("/:id", QuizController.getById, { params: QuizParams })
  .post("/", QuizController.create, { body: CreateQuizBody })
  .patch("/:id", QuizController.update, { params: QuizParams, body: UpdateQuizBody })
  .delete("/:id", QuizController.delete, { params: QuizParams });

export default quizRoute;
