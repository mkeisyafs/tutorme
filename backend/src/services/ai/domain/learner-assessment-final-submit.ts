import prisma from "../../../lib/prisma";
import { answerIndex } from "./lesson-quiz-review";
import type { AuthorizedQuiz, QuizSubmissionResult, SubmitAssessmentInput } from "./learner-assessment-contracts";

export async function submitFinalExamQuiz(
  userId: string,
  quiz: AuthorizedQuiz,
  answers: Record<string, string | number | boolean | null>,
  input: SubmitAssessmentInput
): Promise<QuizSubmissionResult> {
  const multipleChoiceQuestions = quiz.questions.filter(
    (question) => question.type === "MULTIPLE_CHOICE"
  );
  const correctCount = multipleChoiceQuestions.reduce((count, question) => {
    const selectedAnswer = answerIndex(answers[question.id]);
    return question.correctAnswer !== null && selectedAnswer === question.correctAnswer
      ? count + 1
      : count;
  }, 0);
  const gradedQuestionCount = multipleChoiceQuestions.length;
  const score = gradedQuestionCount === 0 ? 0 : Math.round((correctCount / gradedQuestionCount) * 100);
  const gradeLetter = gradeLetterFor(score);

  const submission = await prisma.examSubmission.create({
    data: {
      userId,
      quizId: quiz.id,
      score,
      correctCount,
      totalQuestions: quiz.questions.length,
      timeSpentSec: Math.max(0, Math.floor(input.timeSpentSec ?? 0)),
      gradeLetter,
      userAnswers: answers,
      essayImageUrl: input.essayImageUrl ?? null,
    },
    select: { id: true },
  });

  return {
    ok: true,
    data: {
      submissionId: submission.id,
      score,
      correctCount,
      gradedQuestionCount,
      totalQuestions: quiz.questions.length,
      gradeLetter,
      passed: score >= quiz.passingScore,
      essayQuestionCount: quiz.questions.length - gradedQuestionCount,
    },
  };
}

function gradeLetterFor(score: number): string {
  if (score >= 90) return "A";
  if (score >= 80) return "B";
  if (score >= 70) return "C";
  if (score >= 60) return "D";
  return "F";
}
