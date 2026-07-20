import { tool } from "ai";
import { z } from "zod";

import FirecrawlApp, { SearchResponse } from "@mendable/firecrawl-js";

/**
 * Firecrawl search tool to provide the agent with live internet context.
 */
export const webSearchTool = tool({
  description: "Search the web for up-to-date information on a specific topic.",
  parameters: z.object({
    query: z.string().describe("The search query to look up."),
  }),
  execute: async ({ query }) => {
    try {
      const apiKey = process.env.FIRECRAWL_API_KEY;
      if (!apiKey || apiKey === "fc-YOUR_API_KEY") {
        return {
          results: `Mock search results for: ${query}. (Please set FIRECRAWL_API_KEY in .env to enable real search).`,
        };
      }

      const app = new FirecrawlApp({ apiKey });
      const searchResults = await app.search(query) as any;
      
      const resultsArray = searchResults.web || [];

      if (!resultsArray || !Array.isArray(resultsArray) || resultsArray.length === 0) {
         return { results: `Search failed or returned no results for: ${query}` };
      }

      // Map Firecrawl results into a readable string for the AI
      const resultsText = resultsArray.map((res: any, index: number) => {
        return `[${index + 1}] ${res.title}\\nURL: ${res.url}\\nSnippet: ${res.description}\\n`;
      }).join("\\n");

      return {
        results: resultsText || "No relevant results found.",
      };
    } catch (error: any) {
      console.error("Firecrawl search error:", error);
      return { results: `Search failed due to an error: ${error.message}` };
    }
  },
});

/**
 * A YouTube search tool using Firecrawl to find educational videos.
 */
export const youtubeSearchTool = tool({
  description: "Search for a relevant educational YouTube video URL.",
  parameters: z.object({
    topic: z.string().describe("The topic to search for on YouTube."),
  }),
  execute: async ({ topic }) => {
    try {
      const apiKey = process.env.FIRECRAWL_API_KEY;
      if (!apiKey || apiKey === "fc-YOUR_API_KEY") {
        return {
          videoUrl: `https://youtube.com/watch?v=mock_${encodeURIComponent(topic.replace(/\\s+/g, "_"))}`,
          title: `Mock Video about ${topic}`,
        };
      }

      const app = new FirecrawlApp({ apiKey });
      const query = `site:youtube.com ${topic}`;
      const searchResults = await app.search(query) as any;
      
      const resultsArray = searchResults.web || [];

      if (!resultsArray || !Array.isArray(resultsArray) || resultsArray.length === 0) {
        return { videoUrl: null, title: "No video found" };
      }

      // Try to find a valid YouTube watch URL
      const videoResult = resultsArray.find((res: any) => res.url && res.url.includes("youtube.com/watch?v="));
      
      if (videoResult) {
        return {
          videoUrl: videoResult.url,
          title: videoResult.title || `Video about ${topic}`,
        };
      }

      return { videoUrl: null, title: "No video found" };
    } catch (error: any) {
      console.error("YouTube search error:", error);
      return { videoUrl: null, title: "Error searching video" };
    }
  },
});
