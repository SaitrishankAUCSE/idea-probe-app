/**
 * ============================================
 * IdeaProbe — TypeScript Type Definitions
 * ============================================
 *
 * WHY THIS FILE EXISTS:
 * TypeScript's biggest superpower is catching bugs at compile time instead of
 * runtime. By defining every data shape here, we get:
 *   1. Autocomplete everywhere — your editor knows every field
 *   2. Refactor safety — rename a field and TS tells you every file that breaks
 *   3. Documentation — these interfaces ARE the docs for our data model
 *
 * WHERE THESE TYPES ARE USED:
 *   - Firestore documents mirror UserProfile and ValidationDoc
 *   - The Anthropic Claude response is parsed into ValidationResult
 *   - Razorpay integration references UserProfile.plan and UserProfile.razorpayCustomerId
 *
 * DESIGN DECISIONS:
 *   - We use `interface` (not `type`) for object shapes because interfaces
 *     can be extended and produce clearer error messages
 *   - Union types like 'free' | 'pro' create exhaustive checks — if we add a
 *     'team' plan later, TypeScript flags every switch/if that doesn't handle it
 *   - Firestore Timestamps are typed as `any` because the client SDK and admin SDK
 *     use different Timestamp classes — we handle conversion at the boundary
 */

// ============================================
// User Profile
// ============================================

/**
 * Represents a user's profile stored in Firestore at `users/{uid}`.
 *
 * WHY THESE FIELDS:
 *   - `uid`: Matches Firebase Auth UID — this is our primary key and must
 *     be identical to the Firestore document ID for security rules to work
 *   - `plan`: Controls feature gating. 'free' users get 3 validations/month,
 *     'pro' users get unlimited. This is checked on EVERY validation attempt
 *   - `validationsThisMonth`: Counter for rate limiting free users. Gets
 *     reset at month boundaries (see resetMonthlyUsage in firestore.ts)
 *   - `razorpayCustomerId`: Optional because free users haven't paid yet.
 *     When a user upgrades via Razorpay checkout, we store the payment ID
 *     here so we can reference their transaction later
 *   - `createdAt` / `updatedAt`: Audit trail. Firestore's serverTimestamp()
 *     guarantees these are set by Google's servers, not the client's clock
 */
export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;

  /** Authentication provider used ('email' or 'google') */
  provider: 'email' | 'google';

  /** User role for authorization */
  role: string;

  /** URL to user's avatar image, empty string if none */
  avatar: string;

  /** The user's subscription plan — controls feature access and rate limits */
  plan: 'free' | 'pro' | 'elite' | 'visionary';

  /** How many validations the user has run TODAY */
  validationsToday: number;

  /** The date string (YYYY-MM-DD) of their last validation for resetting daily limits */
  lastValidationDate?: string;

  /** Razorpay payment ID — only set after user completes Razorpay checkout */
  razorpayCustomerId?: string;

  /**
   * Firestore Timestamp — typed as `any` because:
   * - Client SDK uses `firebase/firestore` Timestamp class
   * - Admin SDK uses `firebase-admin/firestore` Timestamp class
   * - They're structurally identical but TypeScript sees them as different types
   * - We convert to JS Date when we actually need to use the value
   */
  createdAt: any; // eslint-disable-line @typescript-eslint/no-explicit-any
  updatedAt: any; // eslint-disable-line @typescript-eslint/no-explicit-any
}

// ============================================
// Validation Result (Claude AI Response)
// ============================================

/**
 * The structured analysis that Claude returns after evaluating a startup idea.
 *
 * WHY THIS STRUCTURE:
 * Each dimension gets its own score (0-10) AND analysis text. This lets us:
 *   1. Show a radar chart with 5 numeric axes
 *   2. Show detailed explanations for each dimension
 *   3. Calculate a weighted overall score
 *
 * The dimensions were chosen based on what investors actually evaluate:
 *   - Market Size: Is the opportunity big enough to build a business?
 *   - Competition: Who else is doing this? How defensible is the moat?
 *   - Risk: What could kill this idea? What's the riskiest assumption?
 *   - Feasibility: Can this actually be built with current technology?
 *   - Uniqueness: What's genuinely different about this approach?
 */
export interface ValidationResult {
  /** Weighted average of all dimension scores (0-10) */
  overallScore: number;

  /** Market size / Total Addressable Market analysis */
  marketSize: {
    score: number;
    analysis: string;
  };

  /** Competitive landscape analysis */
  competition: {
    score: number;
    /** Real competitors found via web search */
    competitors: Competitor[];
    analysis: string;
  };

  /** Risk assessment — what could go wrong */
  riskAssessment: {
    score: number;
    /** The single most dangerous assumption */
    biggestRisk: string;
    /** All identified risks with severity levels */
    risks: Risk[];
    analysis: string;
  };

  /** Technical and operational feasibility */
  feasibility: {
    score: number;
    analysis: string;
  };

  /** What makes this idea different from alternatives */
  uniqueness: {
    score: number;
    analysis: string;
  };

  /** Scalability and growth potential (NEW) */
  scalability: {
    score: number;
    analysis: string;
  };

  /** Specific niches, underserved audiences, and pivots to keep user optimistic (NEW) */
  opportunities: {
    analysis: string;
    list: string[];
  };

  /** Investor-style summary of the business model and execution (NEW) */
  startupArchetype: {
    type: string;
    difficulty: 'Low' | 'Medium' | 'Medium-High' | 'High' | 'Extreme';
    timeToMvp: string;
    monetizationPotential: 'Weak' | 'Moderate' | 'Strong' | 'Very Strong';
  };

  /** One-paragraph summary: should the user pursue this idea? */
  recommendation: string;

  /** Human-readable explanation of why the AI gave this score */
  whyThisScore?: string;

  /** Actionable pivot/niche suggestions to make the idea stronger */
  pivotSuggestions?: string[];

  /** SWOT Analysis - exclusively available for visionary/elite plans */
  swotAnalysis?: {
    strengths: string[];
    weaknesses: string[];
    opportunities: string[];
    threats: string[];
  };

  /** Concrete, actionable next steps the founder should take */
  nextSteps: string[];
}

// ============================================
// Competitor (Found via Web Search)
// ============================================

/**
 * A real competitor discovered by Claude's web search.
 *
 * WHY `threatLevel`:
 * Not all competitors are equal. A direct clone with $100M funding is
 * 'high' threat, while a tangentially related tool is 'low'. This helps
 * founders prioritize which competitors to study and differentiate from.
 */
export interface Competitor {
  /** Company or product name */
  name: string;

  /** URL to the competitor's website */
  url: string;

  /** Brief description of what they do and how they overlap */
  description: string;

  /** How directly this competitor threatens the idea */
  threatLevel: 'high' | 'medium' | 'low';
}

// ============================================
// Risk (Identified Threat)
// ============================================

/**
 * A specific risk that could derail the startup idea.
 *
 * WHY `mitigation`:
 * IdeaProbe isn't just about pointing out problems — it's about helping
 * founders think through solutions. Every risk comes with a suggested
 * mitigation strategy so the user walks away with actionable insights.
 */
export interface Risk {
  /** Short name for the risk (e.g., "Regulatory compliance") */
  name: string;

  /** How likely and impactful this risk is */
  severity: 'high' | 'medium' | 'low';

  /** Detailed explanation of the risk */
  description: string;

  /** Suggested strategy to mitigate or avoid this risk */
  mitigation: string;
}

// ============================================
// Validation Document (Firestore Record)
// ============================================

/**
 * A saved validation stored in Firestore at `users/{uid}/validations/{id}`.
 *
 * WHY A SUBCOLLECTION:
 * Validations live under the user document (not as a top-level collection) because:
 *   1. Security rules: we can enforce "users can only read their own validations"
 *      with a single rule: `match /users/{uid}/validations/{vid} { allow read: if request.auth.uid == uid }`
 *   2. Query efficiency: fetching "all validations for user X" is a simple
 *      subcollection query, no need for a WHERE clause
 *   3. Data locality: conceptually, validations belong to a user
 *
 * WHY `status`:
 * Validation might fail mid-way (Claude API error, timeout, etc). The status
 * field lets us show appropriate UI:
 *   - 'pending': spinner / loading state
 *   - 'completed': show the results
 *   - 'failed': show error and offer retry
 */
export interface ValidationDoc {
  /** Firestore document ID — auto-generated */
  id: string;

  /** The user who ran this validation */
  userId: string;

  /** The raw idea text the user submitted */
  ideaText: string;

  /** The structured AI analysis result */
  result: ValidationResult;

  /** When this validation was created (Firestore Timestamp) */
  createdAt: any; // eslint-disable-line @typescript-eslint/no-explicit-any

  /** Current processing status */
  status: 'pending' | 'completed' | 'failed';
}
