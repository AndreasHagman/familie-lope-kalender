import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";

export async function getValidStravaAccessToken(userId) {
  const userRef = doc(db, "users", userId);
  const snap = await getDoc(userRef);

  if (!snap.exists()) return null;

  const data = snap.data().strava;
  if (!data) return null;

  const { access_token, refresh_token, expires_at } = data;
  const now = Math.floor(Date.now() / 1000);

  // valid token
  if (now < expires_at - 300) {
    return access_token;
  }

  // refresh on backend
  const res = await fetch("/api/strava/refresh", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh_token }),
  });

  const json = await res.json();
  if (!json.access_token) return null;

  // update Firebase
  await updateDoc(userRef, {
    strava: {
      access_token: json.access_token,
      refresh_token: json.refresh_token,
      expires_at: json.expires_at,
    },
  });

  return json.access_token;
}
