import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "./firebaseConfig";
import { dailyKmList } from "../utils/dailyKm";

export async function initializeDailyKmList() {
  const ref = doc(db, "config", "dailyKm");
  const snap = await getDoc(ref);

  // Ikke overskriv hvis den allerede finnes
  if (snap.exists()) return;

  await setDoc(ref, {
    list: dailyKmList,
    createdAt: new Date().toISOString(),
  });

  console.log("Daily KM list saved to Firestore for the first time!");
}
