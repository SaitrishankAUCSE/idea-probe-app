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
      overallScore: { type: Type.INTEGER, description: "0-100 weighted overall viability score. Weighted formula: (marketSize*0.25 + competition*0.15 + riskAssessment*0.15 + feasibility*0.20 + uniqueness*0.10 + scalability*0.15) * 10. Round to nearest integer." },
      marketSize: {
        type: Type.OBJECT,
        properties: {
          score: { type: Type.INTEGER, description: "0-10. Base on real data: 8-10 = TAM > $10B, 5-7 = $1-10B, 2-4 = $100M-1B, 0-1 = <$100M." },
          analysis: { type: Type.STRING, description: "3-5 sentences. MUST include estimated TAM, SAM, and SOM figures with sources. Mention growth rate (CAGR) if available. Reference specific market research reports or industry data found via web search. Example: 'The global online education market was valued at $185B in 2024 (Grand View Research) with a projected CAGR of 13.6%...'" }
        },
        required: ["score", "analysis"]
      },
      competition: {
        type: Type.OBJECT,
        properties: {
          score: { type: Type.INTEGER, description: "0-10 where 10 means wide-open market with no real competitors. 0 means monopoly by incumbents. 5-6 = competitive but differentiable." },
          competitors: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING, description: "Exact company/product name found via web search" },
                url: { type: Type.STRING, description: "Real working URL of the competitor's website. Must be a valid URL you found via search. Use https://example.com only if no URL was found." },
                description: { type: Type.STRING, description: "2-3 sentences: what they do, their funding/revenue if known, their key differentiator, and how they overlap with this idea." },
                threatLevel: { type: Type.STRING, description: "Must be 'high', 'medium', or 'low'. High = directly competes with same value prop and has strong traction. Medium = overlaps partially. Low = adjacent/tangential." }
              },
              required: ["name", "url", "description", "threatLevel"]
            }
          },
          analysis: { type: Type.STRING, description: "3-5 sentences analyzing the competitive landscape overall. Identify gaps competitors are missing. Explain what moat or differentiator this idea could build. Reference specific competitor weaknesses found during research." }
        },
        required: ["score", "competitors", "analysis"]
      },
      riskAssessment: {
        type: Type.OBJECT,
        properties: {
          score: { type: Type.INTEGER, description: "0-10 where 10 means extremely low risk, 0 means existential risks. Consider regulatory, market, technical, financial, and execution risks." },
          biggestRisk: { type: Type.STRING, description: "One sentence identifying THE single most critical risk that could kill this startup. Be specific and quantify if possible." },
          risks: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING, description: "Short risk title (e.g. 'Regulatory Compliance', 'Customer Acquisition Cost')" },
                severity: { type: Type.STRING, description: "Must be 'high', 'medium', or 'low'" },
                description: { type: Type.STRING, description: "2-3 sentences explaining the risk with real-world context. Reference similar startups that failed from this risk if applicable." },
                mitigation: { type: Type.STRING, description: "Specific, actionable mitigation strategy. Not generic advice — give a concrete playbook step." }
              },
              required: ["name", "severity", "description", "mitigation"]
            }
          },
          analysis: { type: Type.STRING, description: "3-4 sentences providing an overall risk profile. Categorize risks across regulatory, market, technical, and operational dimensions." }
        },
        required: ["score", "biggestRisk", "risks", "analysis"]
      },
      feasibility: {
        type: Type.OBJECT,
        properties: {
          score: { type: Type.INTEGER, description: "0-10. Consider: tech complexity, team requirements, capital needed, time-to-market, infrastructure dependencies." },
          analysis: { type: Type.STRING, description: "3-5 sentences covering technical stack requirements, estimated team size needed, approximate capital required for MVP vs. scale, and key technical challenges. Be specific: 'Building this requires ML engineers with NLP expertise, a minimum $50K cloud infrastructure budget, and roughly 4-6 months of development...'" }
        },
        required: ["score", "analysis"]
      },
      uniqueness: {
        type: Type.OBJECT,
        properties: {
          score: { type: Type.INTEGER, description: "0-10. How differentiated is this from existing solutions? 8-10 = novel approach/technology. 4-7 = differentiated execution. 0-3 = me-too product." },
          analysis: { type: Type.STRING, description: "3-4 sentences explaining what makes this unique or not. Identify the core innovation (if any). Assess defensibility: is this a feature, a product, or a company? Can incumbents easily copy this?" }
        },
        required: ["score", "analysis"]
      },
      scalability: {
        type: Type.OBJECT,
        properties: {
          score: { type: Type.INTEGER, description: "0-10. Consider unit economics at scale, network effects, viral potential, marginal cost of serving additional customers." },
          analysis: { type: Type.STRING, description: "3-4 sentences on growth mechanics. Discuss potential revenue models, unit economics (LTV/CAC ratio), whether the business has network effects or economies of scale, and geographic expansion potential." }
        },
        required: ["score", "analysis"]
      },
      opportunities: {
        type: Type.OBJECT,
        properties: {
          analysis: { type: Type.STRING, description: "2-3 sentences about untapped opportunities in this space discovered during research. Reference specific trends, emerging technologies, or underserved segments." },
          list: {
            type: Type.ARRAY,
            items: { type: Type.STRING, description: "Each opportunity should be a specific, actionable insight (1-2 sentences) grounded in market data or trends. e.g. 'The rise of AI coding assistants (GitHub Copilot hit 1.8M subscribers in 2024) creates an adjacent opportunity for AI-powered code review targeted at enterprise compliance teams.'" }
          }
        },
        required: ["analysis", "list"]
      },
      startupArchetype: {
        type: Type.OBJECT,
        properties: {
          type: { type: Type.STRING, description: "Classify precisely: B2C SaaS, B2B SaaS, B2B2C, Marketplace, D2C E-commerce, Platform, API/Dev Tools, Hardware+Software, Fintech, HealthTech, EdTech, etc." },
          difficulty: { type: Type.STRING, description: "Must be 'Low', 'Medium', 'Medium-High', 'High', or 'Extreme'. Based on capital intensity, regulatory burden, tech complexity, and go-to-market difficulty." },
          timeToMvp: { type: Type.STRING, description: "Realistic estimate. e.g. '6-8 Weeks' for a simple web app, '4-6 Months' for a platform, '12-18 Months' for hardware or heavily regulated product." },
          monetizationPotential: { type: Type.STRING, description: "Must be 'Weak', 'Moderate', 'Strong', or 'Very Strong'. Based on pricing power, willingness-to-pay research, and comparable company revenue multiples." }
        },
        required: ["type", "difficulty", "timeToMvp", "monetizationPotential"]
      },
      recommendation: { type: Type.STRING, description: "A 4-6 sentence balanced, actionable executive summary. Start with the verdict (pursue/pivot/rethink), then explain the core reasoning, key opportunity, primary risk, and one concrete first action. Write in a professional but direct tone like a VC partner giving feedback after a pitch." },
      whyThisScore: { type: Type.STRING, description: "3-5 sentences. Write as a mentor speaking directly to the founder. Be candid and conversational but backed by evidence: 'Your idea scores a 62 because while the Indian EdTech market is genuinely massive ($10B+ by 2025 per RedSeer), you're entering a segment where Coursera, Udemy, and Scaler Academy have already established brand trust and content libraries. Your differentiation around AI-powered career reports is interesting but unproven — no startup has successfully monetized this at scale yet, which is both your opportunity and your risk...'" },
      pivotSuggestions: {
        type: Type.ARRAY,
        items: { type: Type.STRING, description: "Each pivot must be specific and actionable with a clear target market. Not 'try a different market' but 'Pivot to a B2B model: license your Skill Viability scoring engine to corporate L&D departments (like LinkedIn Learning does) — they spend $380B/year globally on employee training and need better ROI measurement tools.'" },
        description: "3-5 concrete, research-backed pivot or niche strategies."
      },
      nextSteps: {
        type: Type.ARRAY,
        items: { type: Type.STRING, description: "Each step must be immediately actionable with a clear timeline and success metric. e.g. 'Week 1-2: Interview 20 target users (freelancers earning $50K+) using a screener survey on LinkedIn. Goal: validate that they actively search for skill recommendations and would pay $29/month for personalized reports.'" },
        description: "5-7 sequenced, time-bound next steps forming a 90-day validation roadmap."
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

  const primaryModel = isPremium ? "gemini-2.5-pro" : "gemini-2.5-flash";
  const fallbackModel = "gemini-2.5-flash"; // Always available as a safety net

  const systemPrompt = `You are IdeaProbe — an elite, hyper-critical startup validation engine trusted by Tier-1 VCs (Sequoia, YC, a16z). You combine the rigorous, MECE (Mutually Exclusive, Collectively Exhaustive) analytical frameworks of a McKinsey consultant with the ruthless pattern recognition of a Y Combinator partner who has evaluated 20,000+ pitches. 

Your sole purpose is to strip away founder bias and provide a brutally honest, evidence-based, and highly actionable analysis of their startup idea.

## REQUIRED RESEARCH METHODOLOGY (Follow this sequence precisely):
1. **DEEP SEARCH & GROUNDING**: You MUST use Google Search before writing any analysis.
   - Search for exact direct competitors and similar failed startups (e.g., "[idea concept] startup", "why did [concept] startups fail").
   - Find reliable market data (e.g., "[industry] market size TAM 2024").
   - Look up current macro trends impacting this specific space.
   - You MUST extract real URLs, real company names, and real funding/revenue metrics. NEVER hallucinate companies or data.

2. **ANALYTICAL FRAMEWORKS TO APPLY MENTALLY**:
   - **Porter's Five Forces**: Mentally assess competitive rivalry, supplier power, buyer power, threat of substitution, and threat of new entry.
   - **Unit Economics**: Consider LTV/CAC ratios, churn rates, and margin structures typical for this archetype.
   - **The "Why Now?" Test**: Analyze why this idea hasn't worked before, or what technological/regulatory shift makes it possible today.

3. **SCORING CALIBRATION (BE RUTHLESS)**:
   - **80-100**: Extremely rare (top 1%). Proven product-market fit, massive defensible moat, clear monopoly potential.
   - **60-79**: Promising but requires flawless execution. Real market, but faces stiff competition or high CAC.
   - **40-59**: The "Danger Zone". A recognizable problem but poor differentiation, crowded market, or weak unit economics. Requires a major pivot.
   - **20-39**: Fundamentally flawed. Solution in search of a problem, impossibly high capital requirements, or physically/economically unviable.
   - *Note*: An average idea should score in the 40-55 range. Do not inflate scores to be polite.

## OUTPUT QUALITY STANDARDS:
- **Professionalism**: Write in a crisp, authoritative, direct tone (like a partner memo at a top venture capital firm). Avoid fluff, jargon, or generic praise.
- **Accuracy**: Every statistic, market size, and competitor MUST be grounded in reality. Cite your sources directly in the text (e.g., "per Gartner's 2024 report...").
- **Critical Thinking**: Do not just list competitors; explain *why* they are formidable or vulnerable. Do not just list risks; explain the systemic failure mode this startup will likely face.
- **Depth**: Each text field must contain 4-6 dense, highly specific sentences. Generalities like "The market is growing fast" are unacceptable. Instead use "The market is expanding at a 14% CAGR, driven by regulatory shifts, but value is accruing primarily to infrastructure layers rather than application layers."
- **Actionable Pivot**: If the idea is weak, your pivot suggestions must be specific, identifying a wedge strategy or a niche beachhead market.

${isPremium ? `
## PREMIUM (VISIONARY) ANALYSIS REQUIREMENTS:
- Conduct exhaustive research: find 5-8 competitors with verified URLs and detailed descriptions.
- Include a full SWOT analysis with 4-6 items per category, each backed by evidence.
- Risk analysis must cover ALL dimensions: regulatory, market/demand, technical, operational, financial, and competitive.
- Provide 7 time-bound next steps forming a complete 90-day validation roadmap.` : ""}`;

  const contentPrompt = `STARTUP IDEA TO VALIDATE:
"""${ideaDescription}"""

INSTRUCTIONS:
1. Conduct extensive web research. Find 3-5 REAL competitors. Find REAL market size numbers.
2. Mentally apply a critical Chain of Thought: Why will this fail? Who is already doing this? How much does it cost to acquire a customer?
3. Compute the overallScore strictly using this weighted formula: (marketSize*0.25 + competition*0.15 + riskAssessment*0.15 + feasibility*0.20 + uniqueness*0.10 + scalability*0.15) * 10. Round to the nearest integer.
4. Output the final result as a clean, valid JSON object matching the requested schema exactly. Do NOT wrap it in markdown formatting or add conversational filler. Just the raw JSON:
${JSON.stringify(validationSchema, null, 2)}`;

  const config = {
    systemInstruction: systemPrompt,
    tools: [{ googleSearch: {} }],
    temperature: 0.2,
  };

  function extractJsonPayload(text: string): string {
    const trimmed = text.trim();

    const fencedMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```$/i);
    if (fencedMatch?.[1]) {
      return fencedMatch[1].trim();
    }

    const firstBrace = trimmed.indexOf("{");
    const lastBrace = trimmed.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      return trimmed.slice(firstBrace, lastBrace + 1).trim();
    }

    return trimmed;
  }

  function ensureApiKey(): void {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "dummy_key") {
      throw new Error("Missing Gemini API key. Set GEMINI_API_KEY in environment.");
    }
  }

  // Retry helper with exponential backoff
  async function callWithRetry(modelName: string, maxRetries: number = 3): Promise<string> {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        ensureApiKey();
        const response = await ai.models.generateContent({
          model: modelName,
          contents: contentPrompt,
          config,
        });
        if (!response.text) {
          throw new Error("Empty response from Gemini.");
        }
        return response.text;
      } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : String(err);
        const isRetryable = errMsg.includes("503") || errMsg.includes("UNAVAILABLE") || errMsg.includes("high demand") || errMsg.includes("overloaded");

        if (isRetryable && attempt < maxRetries) {
          // Exponential backoff: 2s, 4s, 8s
          const delay = Math.pow(2, attempt + 1) * 1000;
          console.warn(`[IdeaProbe] Gemini ${modelName} attempt ${attempt + 1} failed (503). Retrying in ${delay / 1000}s...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        throw err; // Non-retryable or exhausted retries
      }
    }
    throw new Error("Max retries exhausted");
  }

  // Try primary model first, then fallback if it keeps failing
  let rawText: string;
  try {
    rawText = await callWithRetry(primaryModel);
  } catch (primaryErr) {
    if (primaryModel !== fallbackModel) {
      console.warn(`[IdeaProbe] Primary model ${primaryModel} failed. Falling back to ${fallbackModel}...`);
      rawText = await callWithRetry(fallbackModel);
    } else {
      throw primaryErr;
    }
  }

  const extractedText = extractJsonPayload(rawText);
  try {
    return JSON.parse(extractedText) as ValidationResult;
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error("JSON PARSE ERROR:", errMsg);
    console.error("RAW TEXT:", rawText);
    throw new Error(
      `JSON_PARSE_FAILED: ${errMsg}`
    );
  }
}
