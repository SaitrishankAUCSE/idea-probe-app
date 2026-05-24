/* ============================================
   FIRESTORE HELPERS — lib/firestore.ts
   ============================================
   
   🎓 TEACHING NOTES:
   
   This file contains all our database operations.
   We centralize them here so our components don't have
   Firestore-specific code scattered everywhere.
   
   Data Structure:
   - Collection: "users"
     - Document: {uid} (User profile)
       - Subcollection: "validations"
         - Document: {autoId} (Validation result)
         
   Why use subcollections?
   It makes security rules easy: "A user can only read/write
   validations that belong to their own UID."
   ============================================ */

import { db } from "./firebase";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  addDoc,
  query,
  orderBy,
  getDocs,
  serverTimestamp,
} from "firebase/firestore";
import type { UserProfile, ValidationResult, ValidationDoc } from "@/types";

/* --- User Profile --- */

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const docRef = doc(db, "users", userId);
  const docSnap = await getDoc(docRef);
  
  if (docSnap.exists()) {
    return docSnap.data() as UserProfile;
  }
  return null;
}

export async function updateUserProfile(
  userId: string,
  data: Partial<UserProfile>
): Promise<void> {
  const docRef = doc(db, "users", userId);
  await updateDoc(docRef, {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

/* --- Validations --- */

export async function saveValidation(
  userId: string,
  ideaText: string,
  result: ValidationResult
): Promise<string> {
  // Add to the user's "validations" subcollection
  const validationsRef = collection(db, "users", userId, "validations");
  
  const docRef = await addDoc(validationsRef, {
    userId,
    ideaText,
    result,
    createdAt: new Date().toISOString(), // Use ISO string for easier sorting in client
    status: "completed",
  });
  
  return docRef.id;
}

export async function getValidations(userId: string): Promise<ValidationDoc[]> {
  const validationsRef = collection(db, "users", userId, "validations");
  const q = query(validationsRef, orderBy("createdAt", "desc"));
  
  const querySnapshot = await getDocs(q);
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
  const docRef = doc(db, "users", userId, "validations", validationId);
  const docSnap = await getDoc(docRef);
  
  if (docSnap.exists()) {
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
  if (!profile) return;
  
  await updateUserProfile(userId, {
    validationsThisMonth: (profile.validationsThisMonth || 0) + 1,
  });
}

export async function canValidate(userId: string): Promise<boolean> {
  const profile = await getUserProfile(userId);
  if (!profile) return false;
  
  // Pro users have no limits
  if (profile.plan === "pro") return true;
  
  // Free users get 3 per month
  return (profile.validationsThisMonth || 0) < 3;
}
