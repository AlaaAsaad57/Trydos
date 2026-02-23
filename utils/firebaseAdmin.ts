import "server-only";
import admin from "firebase-admin";

const requiredEnvVars = [
  "FIREBASE_PROJECT_ID",
  "FIREBASE_CLIENT_EMAIL",
  "FIREBASE_PRIVATE_KEY",
] as const;

const getMissingEnvVars = () => {
  return requiredEnvVars.filter((envVar) => !process.env[envVar]);
};

export const getFirebaseAdminApp = () => {
  if (admin.apps.length) {
    return admin.app();
  }

  const missingEnvVars = getMissingEnvVars();
  if (missingEnvVars.length > 0) {
    throw new Error(
      `Missing Firebase Admin env vars: ${missingEnvVars.join(", ")}`,
    );
  }

  return admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
  });
};

export const getFirebaseMessaging = () => {
  return getFirebaseAdminApp().messaging();
};
