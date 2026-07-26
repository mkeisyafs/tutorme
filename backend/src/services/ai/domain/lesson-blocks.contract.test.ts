import { describe, expect, test } from "bun:test";
import { createLessonBlocksSchema, getLessonPlainContent, LessonBlocksSchema, type LessonBlocks } from "./lesson-blocks";

const MARKDOWN_WITH_EXECUTABLE_CODE = `## Variables

Try this example:

\`\`\`python
name = "Ada"
print(f"Hello {name}")
\`\`\``;

const REQUIRED_MIXED_BLOCKS: LessonBlocks = {
  title: "Variables",
  blocks: [
    {
      type: "objective",
      title: "Learning Objective",
      content: "Understand how variables hold values.",
    },
    {
      type: "paragraph",
      content: "Variables give a reusable name to a value.",
    },
    {
      type: "interactive-quiz",
      question: "Which statement stores a value in a Python variable?",
      options: ["name = \"Ada\"", "print(name)", "# name"],
      correctIndex: 0,
      explanation: "The equals sign assigns the string value to the variable name.",
    },
    {
      type: "flashcard",
      front: "What is a variable?",
      back: "A named reference to a value that can be reused later.",
    },
    {
      type: "interactive-reveal",
      summary: "Why variables matter",
      details: "Variables keep examples readable because a meaningful name carries context.",
    },
    {
      type: "summary",
      content: "Use clear variable names to make code easier to follow.",
    },
  ],
};

const LEGACY_PLAIN_LESSON: LessonBlocks = {
  title: "Variables",
  blocks: [
    {
      type: "objective",
      title: "Learning Objective",
      content: "Understand how variables hold values.",
    },
    {
      type: "paragraph",
      content: "Variables give a reusable name to a value.",
    },
    {
      type: "summary",
      content: "Use clear variable names to make code easier to follow.",
    },
  ],
};

const COMPLETE_MIXED_BLOCKS: LessonBlocks = {
  ...REQUIRED_MIXED_BLOCKS,
  blocks: [
    ...REQUIRED_MIXED_BLOCKS.blocks,
    {
      type: "analogy",
      title: "Library shelves",
      content: "A variable is like a labeled shelf that holds a value.",
    },
    {
      type: "example",
      title: "Store a name",
      content: "`name = \"Ada\"` stores a value for later use.",
    },
    {
      type: "warning",
      title: "Watch out",
      items: ["Use a valid variable name."],
    },
    {
      type: "code-sandbox",
      code: "name = \"Ada\"\nprint(f\"Hello {name}\")",
      language: "python",
      expectedOutput: "Hello Ada",
      instructions: "Run the example and change the name value.",
    },
  ],
};

const RETRIEVED_IMAGE_URL = "https://cdn.example.com/variables.png";

describe("lesson block generation contracts", () => {
  test("Given an image block from the retrieved list When parsed Then it is accepted", () => {
    const result = createLessonBlocksSchema(MARKDOWN_WITH_EXECUTABLE_CODE, [RETRIEVED_IMAGE_URL]).safeParse({
      ...COMPLETE_MIXED_BLOCKS,
      blocks: [
        ...COMPLETE_MIXED_BLOCKS.blocks,
        { type: "image", url: RETRIEVED_IMAGE_URL, caption: "A labeled shelf", altText: "Shelf holding a value" },
      ],
    });

    expect(result.success).toBe(true);
  });

  test("Given a hallucinated image URL When parsed Then the generation schema rejects it", () => {
    const result = createLessonBlocksSchema(MARKDOWN_WITH_EXECUTABLE_CODE, [RETRIEVED_IMAGE_URL]).safeParse({
      ...COMPLETE_MIXED_BLOCKS,
      blocks: [
        ...COMPLETE_MIXED_BLOCKS.blocks,
        { type: "image", url: "https://cdn.example.com/made-up.png", caption: "Invented" },
      ],
    });

    expect(result.success).toBe(false);
  });

  test("Given a malformed image url When parsed Then the base schema rejects it", () => {
    const result = LessonBlocksSchema.safeParse({
      title: "Variables",
      blocks: [{ type: "image", url: "not-a-url", caption: "Broken" }],
    });

    expect(result.success).toBe(false);
  });

  test("Given no image blocks When parsed Then the lesson is still valid", () => {
    const result = createLessonBlocksSchema(MARKDOWN_WITH_EXECUTABLE_CODE, []).safeParse(COMPLETE_MIXED_BLOCKS);

    expect(result.success).toBe(true);
  });

  test("Given an image block When converted to plain content Then it renders markdown image syntax", () => {
    const plain = getLessonPlainContent(
      JSON.stringify({
        title: "Variables",
        blocks: [{ type: "image", url: RETRIEVED_IMAGE_URL, caption: "A shelf", altText: "Shelf alt" }],
      })
    );

    expect(plain).toBe(`![Shelf alt](${RETRIEVED_IMAGE_URL})`);
  });

  test("Given a legacy plain lesson When parsed by the base renderer schema Then existing content remains valid", () => {
    const result = LessonBlocksSchema.safeParse(LEGACY_PLAIN_LESSON);

    expect(result.success).toBe(true);
  });

  test("Given a mixed renderer-supported payload When parsed Then required learning interactions are accepted", () => {
    const result = createLessonBlocksSchema(MARKDOWN_WITH_EXECUTABLE_CODE).safeParse(COMPLETE_MIXED_BLOCKS);

    expect(result.success).toBe(true);
  });

  test("Given a generated lesson missing any renderer block When parsed Then the generation schema rejects it", () => {
    for (const removedType of [
      "objective",
      "paragraph",
      "analogy",
      "example",
      "warning",
      "summary",
      "interactive-quiz",
      "flashcard",
      "interactive-reveal",
      "code-sandbox",
    ] as const) {
      const result = createLessonBlocksSchema(MARKDOWN_WITH_EXECUTABLE_CODE).safeParse({
        ...COMPLETE_MIXED_BLOCKS,
        blocks: COMPLETE_MIXED_BLOCKS.blocks.filter((block) => block.type !== removedType),
      });

      expect(result.success).toBe(false);
      if (result.success) throw new Error(`Expected ${removedType} omission to fail`);
      expect(result.error.issues.some((issue) => issue.path[0] === "blocks")).toBe(true);
    }
  });

  test("Given no executable source example When code sandbox is produced Then the markdown-aware schema rejects it", () => {
    const result = createLessonBlocksSchema("## Variables\n\nVariables hold values.").safeParse(COMPLETE_MIXED_BLOCKS);

    expect(result.success).toBe(false);
  });

  test("Given no executable source example When payload has all required non-code blocks Then the schema accepts it", () => {
    const nonCodeBlocks: LessonBlocks = {
      title: "Variables",
      blocks: [
        { type: "objective", title: "Obj", content: "Learn variables" },
        { type: "paragraph", content: "Variables hold values" },
        { type: "analogy", title: "Analogy", content: "Like a box" },
        { type: "example", title: "Example", content: "x = 5" },
        { type: "warning", title: "Warning", items: ["Careful"] },
        { type: "interactive-quiz", question: "Q?", options: ["A", "B"], correctIndex: 0, explanation: "Exp" },
        { type: "flashcard", front: "Front", back: "Back" },
        { type: "interactive-reveal", summary: "Rev", details: "Det" },
        { type: "summary", content: "Summary text" },
      ],
    };

    const result = createLessonBlocksSchema("## Variables\n\nVariables hold values.").safeParse(nonCodeBlocks);

    expect(result.success).toBe(true);
  });

  test("Given multiple occurrences of block types When parsed Then the schema accepts repeated blocks", () => {
    const repeatedBlocks: LessonBlocks = {
      title: "Variables and Data Types",
      blocks: [
        { type: "objective", title: "Objectives", content: "Master variables" },
        { type: "paragraph", content: "Section 1: Intro to variables" },
        { type: "analogy", title: "Analogy 1", content: "Variables are like labeled boxes" },
        { type: "paragraph", content: "Section 2: Changing variable values" },
        { type: "analogy", title: "Analogy 2", content: "Reassigning a variable is like replacing items in the box" },
        { type: "example", title: "Example 1", content: "let x = 10;" },
        { type: "example", title: "Example 2", content: "let name = 'Alice';" },
        { type: "warning", title: "Warning 1", items: ["Don't use reserved keywords"] },
        { type: "warning", title: "Warning 2", items: ["Variables are case-sensitive"] },
        { type: "flashcard", front: "Front 1", back: "Back 1" },
        { type: "flashcard", front: "Front 2", back: "Back 2" },
        { type: "interactive-reveal", summary: "Deep Dive 1", details: "Detail 1" },
        { type: "interactive-reveal", summary: "Deep Dive 2", details: "Detail 2" },
        { type: "interactive-quiz", question: "Q1?", options: ["A", "B"], correctIndex: 0, explanation: "Exp 1" },
        { type: "interactive-quiz", question: "Q2?", options: ["C", "D"], correctIndex: 1, explanation: "Exp 2" },
        { type: "code-sandbox", code: "console.log('Test 1');", language: "js", expectedOutput: "Test 1", instructions: "Run 1" },
        { type: "code-sandbox", code: "console.log('Test 2');", language: "js", expectedOutput: "Test 2", instructions: "Run 2" },
        { type: "summary", content: "Lesson wrap-up" },
      ],
    };

    const result = createLessonBlocksSchema("```javascript\nconsole.log('Test 1');\n```").safeParse(repeatedBlocks);

    expect(result.success).toBe(true);
  });
});
