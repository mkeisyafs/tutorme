import { z } from "zod";
import crypto from "crypto";
import { AiService } from "../core/ai.service";
import { outlineCache, type DraftOutline } from "./outline-cache.service";
import { getPowerfulModel } from "../core/ai-providers";

const OutlineSchema = z.object({
  courseTitle: z.string().describe("An engaging title for the course"),
  courseDescription: z.string().describe("A brief description of what the course covers"),
  courseCategory: z.string().describe("The primary category (e.g., Programming, Business, Design)"),
  courseLevel: z.enum(["Beginner", "Intermediate", "Advanced"]).describe("The difficulty level"),
  modules: z.array(
    z.object({
      title: z.string().describe("Module title"),
      description: z.string().describe("Brief description of the module"),
      lessons: z.array(
        z.object({
          title: z.string().describe("Lesson title"),
        })
      ),
    })
  ).describe("The modules that make up the course"),
});

export class CourseGeneratorService {
  /**
   * Generates a course outline and saves it to the temporary cache.
   */
  static async generateOutline(
    userId: string,
    topic: string,
    familiarity: string,
    language: string = "English",
    quizSettings?: {
      enableEssayQuestions: boolean;
      requireImageSubmission: boolean;
      quizLength: string;
    }
  ): Promise<string> {
    const targetLanguage = language && language.trim() ? language.trim() : "English";
    const prompt = `Create a comprehensive course outline about "${topic}". The target audience has a "${familiarity}" familiarity level with the topic. Structure the course logically into modules and lessons. The entire outline MUST be generated using ${targetLanguage} language.`;
    
    const system = `You are an expert instructional designer and educator. Generate well-structured, engaging course outlines. Ensure a logical progression from fundamental to advanced concepts based on the target audience's familiarity. Make sure to explicitly provide the 'courseCategory' field (e.g., Technology, Art, Science). ALWAYS respond using ${targetLanguage} language.`;

    const result = await AiService.structuredObject<z.infer<typeof OutlineSchema>>(
      prompt,
      OutlineSchema,
      getPowerfulModel(),
      system
    );

    // Map to DraftOutline format
    const draft: DraftOutline = {
      draftId: crypto.randomUUID(),
      topic,
      userId,
      createdAt: new Date(),
      courseTitle: result.courseTitle,
      courseDescription: result.courseDescription,
      courseCategory: result.courseCategory,
      courseLevel: result.courseLevel,
      modules: result.modules.map((m, mIndex) => ({
        id: crypto.randomUUID(),
        title: m.title,
        description: m.description,
        orderIndex: mIndex,
        lessons: m.lessons.map((l, lIndex) => ({
          id: crypto.randomUUID(),
          title: l.title,
          orderIndex: lIndex,
        })),
      })),
      quizSettings: quizSettings ?? {
        enableEssayQuestions: true,
        requireImageSubmission: false,
        quizLength: "Random",
      },
    };

    // Store in memory (does NOT write to DB yet)
    return outlineCache.save(draft);
  }
}
