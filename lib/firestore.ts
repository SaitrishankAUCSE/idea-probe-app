import { adminDb } from "./firebase-admin";
import type { UserProfile, ValidationResult, ValidationDoc } from "@/types";

/** VIP accounts that always get Visionary-tier access regardless of Firestore plan */
const VIP_EMAILS = [
  "saitrishankb@gmail.com",
  "saitrishankb9@gmail.com",
  "bannusai899@gmail.com",
  "saitrishankb1311@gmail.com",
];

/** Check if an email is a VIP account */
export function isVipEmail(email: string): boolean {
  return VIP_EMAILS.includes(email.toLowerCase());
}

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const docRef = adminDb.collection("users").doc(userId);
  const docSnap = await docRef.get();
  
  if (docSnap.exists) {
    return docSnap.data() as UserProfile;
  }
  return null;
}

export async function updateUserProfile(
  userId: string,
  data: Partial<UserProfile>
): Promise<void> {
  const docRef = adminDb.collection("users").doc(userId);
  // We use FieldValue.serverTimestamp() from firebase-admin, or just let it update without it for simplicity
  // since this is just a counter update usually
  const { FieldValue } = await import("firebase-admin/firestore");
  
  await docRef.set({
    ...data,
    updatedAt: FieldValue.serverTimestamp(),
  }, { merge: true });
}

/* --- Validations --- */

export async function saveValidation(
  userId: string,
  ideaText: string,
  result: ValidationResult
): Promise<string> {
  const validationsRef = adminDb.collection("users").doc(userId).collection("validations");
  
  const docRef = await validationsRef.add({
    userId,
    ideaText,
    result,
    createdAt: new Date().toISOString(), // Use ISO string for easier sorting in client
    status: "completed",
  });
  
  return docRef.id;
}

export async function getValidations(userId: string): Promise<ValidationDoc[]> {
  const validationsRef = adminDb.collection("users").doc(userId).collection("validations");
  const querySnapshot = await validationsRef.orderBy("createdAt", "desc").get();
  
  const validations: ValidationDoc[] = [];
  
  querySnapshot.forEach((doc) => {
    validations.push({
      id: doc.id,
      ...doc.data(),
    } as ValidationDoc);
  });
  
  return validations;
}

export async function getValidation(
  userId: string,
  validationId: string
): Promise<ValidationDoc | null> {
  const docRef = adminDb.collection("users").doc(userId).collection("validations").doc(validationId);
  const docSnap = await docRef.get();
  
  if (docSnap.exists) {
    return {
      id: docSnap.id,
      ...docSnap.data(),
    } as ValidationDoc;
  }
  return null;
}

/* --- Usage Tracking --- */

export async function incrementUsage(userId: string): Promise<void> {
  const profile = await getUserProfile(userId);
  
  const today = new Date().toISOString().split("T")[0];
  
  if (!profile) {
    // Auto-provision minimal profile if missing
    await updateUserProfile(userId, {
      validationsToday: 1,
      lastValidationDate: today,
      totalValidations: 1,
    });
    return;
  }
  
  const isNewDay = profile.lastValidationDate !== today;
  
  await updateUserProfile(userId, {
    validationsToday: isNewDay ? 1 : (profile.validationsToday || 0) + 1,
    lastValidationDate: today,
    totalValidations: (profile.totalValidations || 0) + 1,
  });
}

export async function canValidate(userId: string, email: string = ""): Promise<boolean> {
  // VIP emails always get unlimited — check BEFORE profile lookup
  if (isVipEmail(email)) return true;

  const profile = await getUserProfile(userId);
  if (!profile) return true; // Let them through, incrementUsage will auto-provision their profile

  const today = new Date().toISOString().split("T")[0];
  const isNewDay = profile.lastValidationDate !== today;
  const currentUsage = isNewDay ? 0 : (profile.validationsToday || 0);
  
  // Elite/Visionary users get unlimited
  if (profile.plan === "elite" || profile.plan === "visionary") return true;

  // Pro users get 50 per day
  if (profile.plan === "pro") return currentUsage < 50;
  
  // Free users get 3 per day
  return currentUsage < 3;
}
