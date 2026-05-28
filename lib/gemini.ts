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

   Plan-based routing:
   - Free/Pro: gemini-2.5-flash (fast, cost-effective)
   - Elite/Visionary: gemini-2.5-pro (deeper reasoning, richer analysis)
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
export async function validateIdea(ideaDescription: string, plan: "free" | "pro" | "elite" | "visionary" = "free"): Promise<ValidationResult> {
  const isPremium = plan === "elite" || plan === "visionary";
  
  const properties: Record<string, unknown> = {
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
      scalability: {
        type: Type.OBJECT,
        properties: {
          score: { type: Type.INTEGER, description: "0-10 score" },
          analysis: { type: Type.STRING }
        },
        required: ["score", "analysis"]
      },
      opportunities: {
        type: Type.OBJECT,
        properties: {
          analysis: { type: Type.STRING },
          list: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          }
        },
        required: ["analysis", "list"]
      },
      startupArchetype: {
        type: Type.OBJECT,
        properties: {
          type: { type: Type.STRING, description: "e.g. B2C SaaS, B2B Marketplace, D2C Ecommerce" },
          difficulty: { type: Type.STRING, description: "Must be 'Low', 'Medium', 'Medium-High', 'High', or 'Extreme'" },
          timeToMvp: { type: Type.STRING, description: "e.g. 2-4 Months" },
          monetizationPotential: { type: Type.STRING, description: "Must be 'Weak', 'Moderate', 'Strong', or 'Very Strong'" }
        },
        required: ["type", "difficulty", "timeToMvp", "monetizationPotential"]
      },
      recommendation: { type: Type.STRING, description: "A balanced, actionable 1-paragraph summary." },
      whyThisScore: { type: Type.STRING, description: "2-3 sentence human-like explanation of why the overall score is what it is. Be candid and conversational." },
      pivotSuggestions: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description: "3-5 concrete, actionable pivot or niche ideas to make this concept stronger or more differentiated."
      },
      nextSteps: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description: "3-5 actionable next steps for the founder."
      }
    };

  const requiredFields = [
    "overallScore", "marketSize", "competition", "riskAssessment",
    "feasibility", "uniqueness", "scalability", "opportunities", 
    "startupArchetype", "recommendation", "whyThisScore", "pivotSuggestions", "nextSteps"
  ];

  if (isPremium) {
    properties.swotAnalysis = {
      type: Type.OBJECT,
      properties: {
        strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
        weaknesses: { type: Type.ARRAY, items: { type: Type.STRING } },
        opportunities: { type: Type.ARRAY, items: { type: Type.STRING } },
        threats: { type: Type.ARRAY, items: { type: Type.STRING } }
      },
      required: ["strengths", "weaknesses", "opportunities", "threats"]
    };
    requiredFields.push("swotAnalysis");
  }

  const validationSchema = {
    type: Type.OBJECT,
    properties,
    required: requiredFields
  };

  const modelName = isPremium ? "gemini-2.5-pro" : "gemini-2.5-flash";

  const systemPrompt = `You are IdeaProbe, an elite startup advisor with the combined expertise of a Y Combinator partner, a Sequoia VC, and a serial entrepreneur who has built and exited 3 companies.

Your job is to deeply analyze startup ideas with intellectual honesty and strategic wisdom. You are NOT a generic AI — you think like a founder who has seen thousands of pitch decks and knows what separates the winners from the rest.

CRITICAL ANALYSIS RULES:
1. SEARCH THE WEB ACTIVELY. Use your Google Search tool to find REAL competitors. Do not guess or hallucinate competitors. Search for the exact concept the user describes.
2. Be BALANCED. Do NOT automatically reject ideas just because competitors exist. Many billion-dollar companies launched into crowded markets (Google was the 18th search engine). Find the niche, execution advantage, or timing edge.
3. SCORING CALIBRATION:
   - 80-100: Exceptional idea with clear moat and massive market (rare, <5% of ideas)
   - 60-79: Strong idea with solid fundamentals, worth pursuing with the right execution
   - 40-59: Average idea with notable challenges but potential if pivoted correctly
   - 20-39: Weak idea with fundamental flaws, needs major rethinking
   - 0-19: Non-viable concept (reserved for ideas that are physically impossible or illegal)
   - An average, decent startup idea should score 55-70. Do NOT give 1s and 2s unless truly impossible.
4. whyThisScore: Write this as if you're a mentor sitting across the table from the founder. Be candid and conversational: "Your idea scores a 62 because while the market is clearly there, you're entering a space where Uber and Lyft have already locked up supply-side partnerships..."
5. pivotSuggestions: Give SPECIFIC, actionable pivots. Not "consider a different market" but "Focus exclusively on pet transport for veterinary clinics — a $2B niche that Uber ignores entirely."
6. Encourage iteration and refinement rather than simply suggesting failure.
${isPremium ? `7. This is a PREMIUM (Visionary) analysis. Conduct an extremely rigorous, deeply researched analysis. Include a comprehensive SWOT analysis with 4-6 items in each category. Your competitor search should be exhaustive — find at least 5 relevant competitors. Your risk analysis should cover regulatory, market, technical, and operational risks.` : ""}`;

  const response = await ai.models.generateContent({
    model: modelName,
    contents: `Please validate this startup idea: ${ideaDescription}\n\nYou MUST return your response as a valid JSON object matching this schema exactly:\n${JSON.stringify(validationSchema, null, 2)}\n\nDo not include any markdown formatting, backticks, or extra text outside the JSON object.`,
    config: {
      systemInstruction: systemPrompt,
      tools: [{ googleSearch: {} }],
      temperature: 0.2,
    }
  });

  if (!response.text) {
    throw new Error("Failed to generate structured validation result.");
  }

  // Extract JSON from the response text (in case it includes markdown backticks)
  let rawText = response.text.trim();
  if (rawText.startsWith('```json')) {
    rawText = rawText.replace(/^```json/, '').replace(/```$/, '').trim();
  } else if (rawText.startsWith('```')) {
    rawText = rawText.replace(/^```/, '').replace(/```$/, '').trim();
  }

  const result = JSON.parse(rawText) as ValidationResult;
  return result;
}
