import { adminDb } from "../../../firebase/adminConfig";
import crypto from "crypto";

// Server-side versjon av getValidStravaAccessToken (bruker Admin SDK)
async function getValidStravaAccessTokenServer(userId) {
  const userRef = adminDb.collection("users").doc(userId);
  const snap = await userRef.get();

  if (!snap.exists) return null;

  const data = snap.data().strava;
  if (!data) return null;

  const { access_token, refresh_token, expires_at } = data;
  const now = Math.floor(Date.now() / 1000);

  // valid token
  if (now < expires_at - 300) {
    return access_token;
  }

  // refresh on backend
  try {
    const res = await fetch("https://www.strava.com/api/v3/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: process.env.NEXT_PUBLIC_STRAVA_CLIENT_ID,
        client_secret: process.env.STRAVA_CLIENT_SECRET,
        grant_type: "refresh_token",
        refresh_token,
      }),
    });

    if (!res.ok) {
      console.error("Failed to refresh Strava token");
      return null;
    }

    const json = await res.json();
    if (!json.access_token) return null;

    // Verify document still exists before updating
    const verifySnap = await userRef.get();
    if (!verifySnap.exists) {
      console.error("User document no longer exists");
      return null;
    }

    // update Firebase (Admin SDK bypasser security rules)
    await userRef.update({
      strava: {
        ...data,
        access_token: json.access_token,
        refresh_token: json.refresh_token,
        expires_at: json.expires_at,
      },
    });

    return json.access_token;
  } catch (err) {
    console.error("Error refreshing Strava token:", err);
    return null;
  }
}

/**
 * Strava Webhook Handler
 * 
 * Strava sender webhook events når aktiviteter opprettes/oppdateres.
 * Vi verifiserer signaturen og oppdaterer automatisk brukerens log.
 */

// Verifiser webhook-signatur fra Strava
function verifyWebhookSignature(req, secret) {
  const signature = req.headers["x-hub-signature-256"];
  if (!signature) return false;

  const hmac = crypto.createHmac("sha256", secret);
  const payload = JSON.stringify(req.body);
  hmac.update(payload);
  const calculatedSignature = `sha256=${hmac.digest("hex")}`;

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(calculatedSignature)
  );
}

// Håndter webhook event
async function handleWebhookEvent(event) {
  console.log("📥 Strava webhook event:", event.object_type, event.aspect_type);

  // Vi er kun interessert i "activity" events
  if (event.object_type !== "activity") {
    console.log("Ignorerer event - ikke en aktivitet");
    return;
  }

  // Vi er kun interessert i "create" og "update" events
  if (event.aspect_type !== "create" && event.aspect_type !== "update") {
    console.log("Ignorerer event - ikke create/update");
    return;
  }

  const activityId = event.object_id;
  const athleteId = event.owner_id;

  console.log(`🔍 Søker etter bruker med Strava athlete ID: ${athleteId}`);

  // Finn bruker basert på Strava athlete ID (bruker Admin SDK)
  const usersRef = adminDb.collection("users");
  const querySnapshot = await usersRef
    .where("strava.athlete.id", "==", athleteId)
    .get();

  if (querySnapshot.empty) {
    console.log(`❌ Ingen bruker funnet med athlete ID: ${athleteId}`);
    return;
  }

  const userDoc = querySnapshot.docs[0];
  const userId = userDoc.id;
  const userData = userDoc.data();

  console.log(`✅ Funnet bruker: ${userId}`);

  // Hent gyldig access token
  const accessToken = await getValidStravaAccessTokenServer(userId);
  if (!accessToken) {
    console.error(`❌ Kunne ikke hente gyldig access token for bruker: ${userId}`);
    return;
  }

  // Hent aktivitetsdetaljer fra Strava
  try {
    const activityRes = await fetch(
      `https://www.strava.com/api/v3/activities/${activityId}`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    if (!activityRes.ok) {
      console.error(`❌ Kunne ikke hente aktivitet ${activityId}: ${activityRes.status}`);
      return;
    }

    const activity = await activityRes.json();
    console.log(`📊 Aktivitet hentet: ${activity.name} - ${activity.distance / 1000} km`);

    // Sjekk nøkkelord
    const keyWord = userData.stravaKeyWord || "";
    const activityName = activity.name?.toLowerCase() || "";
    const activityDescription = activity.description?.toLowerCase() || "";
    const keyWordLower = keyWord.toLowerCase();

    const matchesKeyword =
      !keyWord || // Hvis ingen nøkkelord er satt, aksepter alle
      activityName.includes(keyWordLower) ||
      activityDescription.includes(keyWordLower);

    if (!matchesKeyword) {
      console.log(`⏭️ Aktivitet matcher ikke nøkkelord "${keyWord}"`);
      return;
    }

    // Sjekk om aktiviteten er i dag (lokal tid)
    const activityDate = new Date(activity.start_date_local);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const activityDateOnly = new Date(activityDate);
    activityDateOnly.setHours(0, 0, 0, 0);

    const isToday = activityDateOnly.getTime() === today.getTime();

    if (!isToday) {
      console.log(`📅 Aktivitet er ikke fra i dag: ${activityDate.toISOString()}`);
      return;
    }

    // Beregn km
    const km = Number((activity.distance / 1000).toFixed(2));
    const time = activity.start_date_local;

    console.log(`✅ Aktivitet matcher! ${km} km på ${time}`);

    // Oppdater brukerens log (bruker Admin SDK som bypasser security rules)
    const userRef = adminDb.collection("users").doc(userId);
    const userSnap = await userRef.get();
    const currentLog = userSnap.data()?.log || {};

    // Bruk dagens dato som nøkkel (YYYY-MM-DD)
    const todayKey = activityDate.toISOString().slice(0, 10);

    // Oppdater kun hvis det ikke allerede finnes en logg for i dag
    // eller hvis den nye aktiviteten er nyere
    const existingLog = currentLog[todayKey];
    if (existingLog) {
      const existingTime = new Date(existingLog.time);
      const newTime = new Date(time);
      if (newTime <= existingTime) {
        console.log(`⏭️ Eksisterende logg er nyere eller lik, hopper over`);
        return;
      }
    }

    // Oppdater loggen
    const updatedLog = {
      ...currentLog,
      [todayKey]: {
        km: km,
        time: time,
      },
    };

    await userRef.update({ log: updatedLog });
    console.log(`🎉 Automatisk oppdatert logg for ${userId}: ${km} km`);

  } catch (error) {
    console.error("❌ Feil ved håndtering av webhook event:", error);
  }
}

export default async function handler(req, res) {
  // Strava sender GET request for verifisering ved oppsett
  if (req.method === "GET") {
    const challenge = req.query["hub.challenge"];
    return res.status(200).json({ "hub.challenge": challenge });
  }

  // Strava sender POST request for events
  if (req.method === "POST") {
    const webhookSecret = process.env.STRAVA_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.error("❌ STRAVA_WEBHOOK_SECRET ikke satt");
      return res.status(500).send("Webhook secret not configured");
    }

    // Verifiser signatur
    if (!verifyWebhookSignature(req, webhookSecret)) {
      console.error("❌ Webhook signatur verifisering feilet");
      return res.status(403).send("Invalid signature");
    }

    // Håndter eventet (async, men vi svarer raskt til Strava)
    const event = req.body;
    handleWebhookEvent(event).catch((error) => {
      console.error("❌ Feil ved håndtering av webhook event:", error);
    });

    // Svar raskt til Strava (innenfor 2 sekunder)
    return res.status(200).send("OK");
  }

  return res.status(405).send("Method not allowed");
}

