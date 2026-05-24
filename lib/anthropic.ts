/* ============================================
   ANTHROPIC CLAUDE INTEGRATION — lib/anthropic.ts
   ============================================
   
   🎓 TEACHING NOTES:
   
   This is the brain of IdeaProbe. We use Claude 3.5 Sonnet
   because it has native web search capabilities and is
   excellent at structured JSON generation.
   
   Prompt Engineering Strategy:
   1. System Prompt: Defines Claude's persona ("brutally honest 
      VC / startup advisor").
   2. Web Search Tool: We give Claude the ability to search
      the web. It autonomously decides what queries to run.
   3. JSON Schema: We force Claude to return a specific JSON
      structure that perfectly matches our ValidationResult type.
      This allows us to render the UI predictably.
   ============================================ */

import Anthropic from "@anthropic-ai/sdk";
import type { ValidationResult } from "@/types";

// Initialize the Anthropic client (server-side only)
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || "dummy_key",
});

/**
 * Validates a startup idea using Claude 3.5 Sonnet + Web Search
 */
export async function validateIdea(ideaDescription: string): Promise<ValidationResult> {
  // We use tool choice to force Claude to return data matching our schema
  const validationSchema = {
    type: "object" as const,
    properties: {
      overallScore: { type: "integer", description: "0-100 overall score" },
      marketSize: {
        type: "object",
        properties: {
          score: { type: "integer", description: "0-10 score" },
          analysis: { type: "string" }
        },
        required: ["score", "analysis"]
      },
      competition: {
        type: "object",
        properties: {
          score: { type: "integer", description: "0-10 score" },
          competitors: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                url: { type: "string" },
                description: { type: "string" },
                threatLevel: { type: "string", enum: ["high", "medium", "low"] }
              },
              required: ["name", "url", "description", "threatLevel"]
            }
          },
          analysis: { type: "string" }
        },
        required: ["score", "competitors", "analysis"]
      },
      riskAssessment: {
        type: "object",
        properties: {
          score: { type: "integer", description: "0-10 score" },
          biggestRisk: { type: "string" },
          risks: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                severity: { type: "string", enum: ["high", "medium", "low"] },
                description: { type: "string" },
                mitigation: { type: "string" }
              },
              required: ["name", "severity", "description", "mitigation"]
            }
          },
          analysis: { type: "string" }
        },
        required: ["score", "biggestRisk", "risks", "analysis"]
      },
      feasibility: {
        type: "object",
        properties: {
          score: { type: "integer", description: "0-10 score" },
          analysis: { type: "string" }
        },
        required: ["score", "analysis"]
      },
      uniqueness: {
        type: "object",
        properties: {
          score: { type: "integer", description: "0-10 score" },
          analysis: { type: "string" }
        },
        required: ["score", "analysis"]
      },
      recommendation: { type: "string", description: "A brutal, honest 1-paragraph summary." },
      nextSteps: {
        type: "array",
        items: { type: "string" },
        description: "3-5 actionable next steps for the founder."
      }
    },
    required: [
      "overallScore", "marketSize", "competition", "riskAssessment",
      "feasibility", "uniqueness", "recommendation", "nextSteps"
    ]
  };

  const response = await anthropic.messages.create({
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 4096,
    temperature: 0.2, // Low temp for more consistent/analytical results
    system: `You are IdeaProbe, a brutally honest, world-class startup advisor and VC.
Your job is to analyze startup ideas, find competitors on the web, estimate market size, and identify the riskiest assumptions.
DO NOT be overly optimistic. If an idea is bad or in a hyper-crowded market without a moat, score it poorly and tell the founder why.
You must actively search the web to find real, existing competitors. Do not guess. Search for exactly what they are describing to see if it already exists.
Use the tool 'record_validation_result' to output your final analysis in the exact JSON structure requested.`,
    messages: [
      {
        role: "user",
        content: `Please validate this startup idea: ${ideaDescription}`
      }
    ],
    tools: [
      // 1. Give Claude the ability to search the web
      {
        type: "web_search_20250305" as any,
        name: "web_search"
      },
      // 2. Give Claude a tool to format the output as JSON
      {
        name: "record_validation_result",
        description: "Record the final structured validation result.",
        input_schema: validationSchema
      }
    ],
    // Force Claude to use the recording tool at the end
    tool_choice: { type: "tool", name: "record_validation_result" }
  });

  // Extract the JSON payload from the tool use block
  const toolCall = response.content.find(
    (block) => block.type === "tool_use" && block.name === "record_validation_result"
  );

  if (!toolCall || toolCall.type !== "tool_use") {
    throw new Error("Failed to generate structured validation result.");
  }

  // The input property contains the JSON that matches our schema
  return toolCall.input as unknown as ValidationResult;
}
