import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "./firebaseConfig";
import { dailyKmList } from "../utils/dailyKm";


export async function initializeDailyKmList() {
  const originalRef = doc(db, "config", "dailyKm");
  const remainingRef = doc(db, "config", "dailyKmRemaining");

  // 1. Sjekk originallisten
  const originalSnap = await getDoc(originalRef);
  let originalList = originalSnap.data()?.list;

  if (!originalList || !originalList.length) {
    await setDoc(originalRef, {
    list: dailyKmList,
    createdAt: new Date().toISOString(),
  });
    console.log("Originallisten dailyKm opprettet");
  }

  // 2. Sjekk remaining-listen
  const remainingSnap = await getDoc(remainingRef);
  let remainingList = remainingSnap.data()?.list;

  if (!remainingList || !remainingList.length) {
    remainingList = [...dailyKmList]; // kopi av original
    await setDoc(remainingRef, { list: remainingList });
    console.log("Remaining-listen dailyKmRemaining opprettet");
  }
}

