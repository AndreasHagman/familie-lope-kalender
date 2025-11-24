import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "./firebaseConfig";

export async function getKmForToday() {
  const today = new Date().toISOString().slice(0, 10); // yyyy-mm-dd

  const selectedRef = doc(db, "config", "dailyKmSelected");
  const remainingRef = doc(db, "config", "dailyKmRemaining");
  const originalRef = doc(db, "config", "dailyKm"); // original full liste

  // 1. Sjekk om dagens km allerede er trukket
  const selectedSnap = await getDoc(selectedRef);
  if (selectedSnap.exists() && selectedSnap.data()[today] !== undefined) {
    return selectedSnap.data()[today];
  }

  // 2. Hent listen over resterende tall
  let remainingSnap = await getDoc(remainingRef);
  let remaining = remainingSnap.exists() ? [...remainingSnap.data().list] : [];

  // Hvis listen ikke finnes eller er tom, lag basert på originallisten
  if (!remaining || remaining.length === 0) {
    const originalSnap = await getDoc(originalRef);
    remaining = [...(originalSnap.data()?.list || [])];
  }

  // 3. Trekk dagens tall (inkl. helgedags-regel)
  const weekday = new Date(today).getDay(); // <-- MÅ være med!

  let kmForToday;
  if (weekday === 0) kmForToday = 0;      // søndag
  else if (weekday === 1) kmForToday = 7; // mandag
  else {
    const index = Math.floor(Math.random() * remaining.length);
    kmForToday = remaining[index];
  }

  // 4. Fjern **bare én forekomst** av dagens tall fra remaining
  const removeIndex = remaining.indexOf(kmForToday);
  if (removeIndex !== -1) remaining.splice(removeIndex, 1);

  // 5. Lagre dagens trekk
  await setDoc(selectedRef, { [today]: kmForToday }, { merge: true });

  // 6. Oppdater remaining-listen
  await setDoc(remainingRef, { list: remaining }, { merge: true });

  return kmForToday;
}
