import { Elysia, t } from "elysia";
import { z } from "zod";
import { authMiddleware } from "../../middleware/auth";
import { FinalExamGeneratorService } from "../../services/ai/domain/final-exam-generator.service";
import { LearnerAssessmentService } from "../../services/ai/domain/learner-assessment.service";

const submitBodySchema = t.Object({
  answers: t.Record(t.String(), t.Any()),
  timeSpentSec: t.Optional(t.Number({ minimum: 0 })),
  essayImageUrl: t.Optional(t.Nullable(t.String())),
  imageBase64: t.Optional(t.Nullable(t.String())),
});

const SubmitAssessmentInputSchema = z.object({
  answers: z.record(z.string(), z.unknown()),
  timeSpentSec: z.number().min(0).optional(),
  essayImageUrl: z.string().nullable().optional(),
  imageBase64: z.string().nullable().optional(),
});

type VerifiedUser = {
  readonly sub: string;
  readonly email: string;
};

type UnauthorizedResult = {
  readonly message: "Unauthorized: Invalid or missing token";
};

type StatusSetter = {
  status?: number | string;
};

function verifiedUser(user: VerifiedUser | null, set: StatusSetter): VerifiedUser | UnauthorizedResult {
  if (!user) {
    set.status = 401;
    return { message: "Unauthorized: Invalid or missing token" };
  }

  return user;
}

export const protectedAssessmentRoute = new Elysia()
  .use(authMiddleware.as("scoped"))
  .onBeforeHandle(({ user, set }) => {
    if (!user) {
      set.status = 401;
      return { message: "Unauthorized: Invalid or missing token" };
    }
  })
  .post(
    "/course/:courseId/final-exam",
    async ({ params, user, set }) => {
      const verified = verifiedUser(user, set);
      if ("message" in verified) return verified;
      return FinalExamGeneratorService.requestGeneration(verified.sub, params.courseId);
    },
    {
      params: t.Object({ courseId: t.String() }),
    }
  )
  .get(
    "/course/:courseId/final-exam",
    async ({ params, user, set }) => {
      const verified = verifiedUser(user, set);
      if ("message" in verified) return verified;
      return FinalExamGeneratorService.getStatus(verified.sub, params.courseId);
    },
    {
      params: t.Object({ courseId: t.String() }),
    }
  )
  .post(
    "/course/:courseId/final-exam/retake",
    async ({ params, user, set }) => {
      const verified = verifiedUser(user, set);
      if ("message" in verified) return verified;
      return FinalExamGeneratorService.requestRetake(verified.sub, params.courseId);
    },
    {
      params: t.Object({ courseId: t.String() }),
    }
  )
  .get(
    "/quiz/:quizId/attempt",
    async ({ params, user, set }) => {
      const verified = verifiedUser(user, set);
      if ("message" in verified) return verified;
      const result = await LearnerAssessmentService.getAttempt(verified.sub, params.quizId);
      if (result.ok === false) {
        set.status = result.status;
        return { message: result.message };
      }
      return result.data;
    },
    {
      params: t.Object({ quizId: t.String() }),
    }
  )
  .post(
    "/quiz/:quizId/submit",
    async ({ params, body, user, set }) => {
      const verified = verifiedUser(user, set);
      if ("message" in verified) return verified;
      const result = await LearnerAssessmentService.submit(
        verified.sub,
        params.quizId,
        SubmitAssessmentInputSchema.parse(body)
      );
      if (result.ok === false) {
        set.status = result.status;
        return { message: result.message };
      }
      return result.data;
    },
    {
      params: t.Object({ quizId: t.String() }),
      body: submitBodySchema,
    }
  )
  .get(
    "/submission/:submissionId",
    async ({ params, user, set }) => {
      const verified = verifiedUser(user, set);
      if ("message" in verified) return verified;
      const result = await LearnerAssessmentService.getSubmission(
        verified.sub,
        params.submissionId
      );
      if (result.ok === false) {
        set.status = result.status;
        return { message: result.message };
      }
      return result.data;
    },
    {
      params: t.Object({ submissionId: t.String() }),
    }
  )
  .post(
    "/submission/:submissionId/return-to-course",
    async ({ params, user, set }) => {
      const verified = verifiedUser(user, set);
      if ("message" in verified) return verified;
      const result = await LearnerAssessmentService.returnToCourse(
        verified.sub,
        params.submissionId
      );
      if (result.ok === false) {
        set.status = result.status;
        return { message: result.message };
      }
      return result.data;
    },
    {
      params: t.Object({ submissionId: t.String() }),
    }
  );
