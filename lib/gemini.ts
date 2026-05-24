/* ============================================
   GOOGLE GEMINI INTEGRATION — lib/gemini.ts
   ============================================
   
   🎓 TEACHING NOTES:
   
   This replaces Anthropic with Google Gemini (gemini-2.5-flash).
   Gemini provides an excellent free tier and has native
   Google Search grounding.
   
   Prompt Engineering Strategy:
   1. System Instruction: Defines Gemini's persona.
   2. Web Search Tool: We enable { googleSearch: {} } so Gemini
      queries Google for real competitors.
   3. JSON Schema: We enforce structured outputs using responseSchema.
   ============================================ */

import { GoogleGenAI, Type } from "@google/genai";
import type { ValidationResult } from "@/types";

// Initialize the Gemini client (server-side only)
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || "dummy_key",
});

/**
 * Validates a startup idea using Gemini + Google Search Grounding
 */
export async function validateIdea(ideaDescription: string): Promise<ValidationResult> {
  const validationSchema = {
    type: Type.OBJECT,
    properties: {
      overallScore: { type: Type.INTEGER, description: "0-100 overall score" },
      marketSize: {
        type: Type.OBJECT,
        properties: {
          score: { type: Type.INTEGER, description: "0-10 score" },
          analysis: { type: Type.STRING }
        },
        required: ["score", "analysis"]
      },
      competition: {
        type: Type.OBJECT,
        properties: {
          score: { type: Type.INTEGER, description: "0-10 score" },
          competitors: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                url: { type: Type.STRING },
                description: { type: Type.STRING },
                threatLevel: { type: Type.STRING, description: "Must be 'high', 'medium', or 'low'" }
              },
              required: ["name", "url", "description", "threatLevel"]
            }
          },
          analysis: { type: Type.STRING }
        },
        required: ["score", "competitors", "analysis"]
      },
      riskAssessment: {
        type: Type.OBJECT,
        properties: {
          score: { type: Type.INTEGER, description: "0-10 score" },
          biggestRisk: { type: Type.STRING },
          risks: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                severity: { type: Type.STRING, description: "Must be 'high', 'medium', or 'low'" },
                description: { type: Type.STRING },
                mitigation: { type: Type.STRING }
              },
              required: ["name", "severity", "description", "mitigation"]
            }
          },
          analysis: { type: Type.STRING }
        },
        required: ["score", "biggestRisk", "risks", "analysis"]
      },
      feasibility: {
        type: Type.OBJECT,
        properties: {
          score: { type: Type.INTEGER, description: "0-10 score" },
          analysis: { type: Type.STRING }
        },
        required: ["score", "analysis"]
      },
      uniqueness: {
        type: Type.OBJECT,
        properties: {
          score: { type: Type.INTEGER, description: "0-10 score" },
          analysis: { type: Type.STRING }
        },
        required: ["score", "analysis"]
      },
      recommendation: { type: Type.STRING, description: "A brutal, honest 1-paragraph summary." },
      nextSteps: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description: "3-5 actionable next steps for the founder."
      }
    },
    required: [
      "overallScore", "marketSize", "competition", "riskAssessment",
      "feasibility", "uniqueness", "recommendation", "nextSteps"
    ]
  };

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: `Please validate this startup idea: ${ideaDescription}`,
    config: {
      systemInstruction: `You are IdeaProbe, a brutally honest, world-class startup advisor and VC.
Your job is to analyze startup ideas, find competitors on the web, estimate market size, and identify the riskiest assumptions.
DO NOT be overly optimistic. If an idea is bad or in a hyper-crowded market without a moat, score it poorly and tell the founder why.
You must actively search the web using your Google Search tool to find real, existing competitors. Do not guess. Search for exactly what they are describing to see if it already exists.`,
      tools: [{ googleSearch: {} }],
      responseMimeType: "application/json",
      responseSchema: validationSchema,
      temperature: 0.2,
    }
  });

  if (!response.text) {
    throw new Error("Failed to generate structured validation result.");
  }

  const result = JSON.parse(response.text) as ValidationResult;
  return result;
}
