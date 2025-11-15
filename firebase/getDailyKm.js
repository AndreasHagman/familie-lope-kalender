import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "./firebaseConfig";

/**
 * Henter eller trekker dagens km
 */
export async function getKmForToday() {
  const today = new Date().toISOString().slice(0, 10); // yyyy-mm-dd

  const selectedRef = doc(db, "config", "dailyKmSelected");
  const dailyListRef = doc(db, "config", "dailyKm");

  // 1. Hent alle allerede trukne tall
  const selectedSnap = await getDoc(selectedRef);

  if (selectedSnap.exists() && selectedSnap.data()[today]) {
    // Tallet er allerede trukket → returner det
    return selectedSnap.data()[today];
  }

  // 2. Hent original listen
  const listSnap = await getDoc(dailyListRef);
  console.log("daily list snap:", listSnap.exists(), listSnap.data());
  const list = listSnap.data()?.list;
if (!list) {
  console.error("Error: dailyKm list not found!");
  return 3; // fallback
}

  // 3. Finn dagens ukedag
  const weekday = new Date(today).getDay(); 
  // søndag=0, mandag=1, tirsdag=2...

  let kmForToday;

  // --- REGLER ---
  if (weekday === 0) {
    kmForToday = 0;  // Søndag
  } else if (weekday === 1) {
    kmForToday = 7;  // Mandag
  } else {
    // Vanlig dag → trekk tilfeldig fra restlisten

    // Fjern reserverte tall (4x7 og 4x0)
    const reserved = [7,7,7,7,0,0,0,0];
    const available = list.filter(v => !reserved.includes(v));

    kmForToday = available[Math.floor(Math.random() * available.length)];
  }

  // 4. Lagre dagens trekk slik at alle brukere får samme
  await setDoc(
    selectedRef,
    { [today]: kmForToday },
    { merge: true }
  );

  return kmForToday;
}
