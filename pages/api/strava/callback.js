import { db } from "../../../firebase/firebaseConfig";
import { doc, getDoc, updateDoc } from "firebase/firestore";

export default async function handler(req, res) {
  console.log("🔥 Strava callback triggered");
  console.log("Query params:", req.query);

  const { code, state } = req.query;

  if (!code || !state) {
    console.error("Missing code or state in Strava callback");
    return res.status(400).send("Missing code or state");
  }

  const userId = state; // state is user UID
  console.log("State / UID:", userId);

  try {
    console.log("Exchanging code for tokens...");

    const tokenResponse = await fetch("https://www.strava.com/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: process.env.NEXT_PUBLIC_STRAVA_CLIENT_ID,
        client_secret: process.env.STRAVA_CLIENT_SECRET,
        code: code,
        grant_type: "authorization_code",
      }),
    });

    const tokenData = await tokenResponse.json();
    console.log("Token response from Strava:", tokenData);

    if (!tokenData.access_token) {
      console.error("No access token returned from Strava");
      return res.status(400).send("Failed to get access token");
    }

    // Get existing user document
    const userRef = doc(db, "users", userId);

    // Save merged data
   // Save only Strava tokens, keep existing fields untouched
    await updateDoc(userRef, {
        strava: {
            access_token: tokenData.access_token,
            refresh_token: tokenData.refresh_token,
            expires_at: tokenData.expires_at,
            athlete: tokenData.athlete,
        },
    });
    console.log("✅ Strava tokens merged and saved to Firestore");

    res.redirect("/stravaProfil"); // redirect to Strava profile page
  } catch (err) {
    console.error("Strava callback error:", err);
    res.status(500).send("Strava callback failed");
  }
}
