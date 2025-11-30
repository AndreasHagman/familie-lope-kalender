import admin from "firebase-admin";

// Initialize Firebase Admin SDK hvis den ikke allerede er initialisert
if (!admin.apps.length) {
  try {
    // Metode 1: Service Account Key (JSON string i environment variable)
    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      console.log("✅ Firebase Admin initialisert med service account key");
    }
    // Metode 2: Individuelle credentials (for Vercel, etc.)
    else if (process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID,
          privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        }),
      });
      console.log("✅ Firebase Admin initialisert med credentials");
    }
    // Metode 3: Application Default Credentials (ADC) - fungerer på Google Cloud, Vercel med Firebase integration
    else if (process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID) {
      admin.initializeApp({
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID,
      });
      console.log("✅ Firebase Admin initialisert med Application Default Credentials");
    }
    // Fallback: Prøv å bruke default credentials
    else {
      admin.initializeApp();
      console.log("✅ Firebase Admin initialisert med default credentials");
    }
  } catch (error) {
    console.error("❌ Feil ved initialisering av Firebase Admin:", error);
    throw error;
  }
}

export const adminDb = admin.firestore();
export default admin;

