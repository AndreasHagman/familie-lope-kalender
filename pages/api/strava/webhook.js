import { adminDb } from "../../../firebase/adminConfig";
import crypto from "crypto";
import getRawBody from "raw-body";

// Next.js må bruke raw body for korrekt signaturverifikasjon
export const config = {
  api: {
    bodyParser: false,
  },
};

/**
 * Verify Strava webhook signature using client_secret
 */
function verifyWebhookSignature(rawBody, secret, signatureHeader) {
  if (!signatureHeader) {
    console.error("❌ Missing x-hub-signature-256 header");
    return false;
  }

  console.log("🔹 Signature header:", signatureHeader);

  const hmac = crypto.createHmac("sha256", secret);
  hmac.update(rawBody.toString("utf8"));
  const expected = hmac.digest("hex");
  console.log("🔹 Expected HMAC (hex):", expected);

  try {
    const signatureBuffer = Buffer.from(signatureHeader.replace(/^sha256=/, "").trim(), "hex");
    const expectedBuffer = Buffer.from(expected, "hex");

    console.log("🔹 signatureBuffer length:", signatureBuffer.length);
    console.log("🔹 expectedBuffer length:", expectedBuffer.length);

    const valid = crypto.timingSafeEqual(signatureBuffer, expectedBuffer);
    console.log("🔹 timingSafeEqual result:", valid);

    return valid;
  } catch (err) {
    console.error("❌ Error in timingSafeEqual:", err);
    return false;
  }
}

/**
 * Fetch or refresh Strava access token using Admin SDK
 */
async function getValidStravaAccessTokenServer(userId) {
  const userRef = adminDb.collection("users").doc(userId);
  const snap = await userRef.get();
  if (!snap.exists) return null;

  const data = snap.data().strava;
  if (!data) return null;

  const { access_token, refresh_token, expires_at } = data;
  const now = Math.floor(Date.now() / 1000);

  if (now < expires_at - 300) return access_token;

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

  const json = await res.json();
  if (!json.access_token) return null;

  await userRef.update({
    strava: {
      ...data,
      access_token: json.access_token,
      refresh_token: json.refresh_token,
      expires_at: json.expires_at,
    },
  });

  return json.access_token;
}

/**
 * Handle actual Strava webhook events
 */
async function handleWebhookEvent(event) {
  console.log("📥 Webhook event:", event.object_type, event.aspect_type);

  if (event.object_type !== "activity") return;
  if (!["create", "update"].includes(event.aspect_type)) return;

  const activityId = event.object_id;
  const athleteId = event.owner_id;

  console.log("🔎 Searching for user with athlete ID:", athleteId);

  const usersRef = adminDb.collection("users");
  const querySnapshot = await usersRef.where("strava.athlete.id", "==", athleteId).get();

  if (querySnapshot.empty) {
    console.log("❌ No user found for athlete:", athleteId);
    return;
  }

  const userDoc = querySnapshot.docs[0];
  const userId = userDoc.id;
  const userData = userDoc.data();

  console.log("✅ Matched user:", userId);

  const accessToken = await getValidStravaAccessTokenServer(userId);
  if (!accessToken) return;

  const activityRes = await fetch(`https://www.strava.com/api/v3/activities/${activityId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!activityRes.ok) {
    console.log("❌ Failed fetching activity:", activityId);
    return;
  }

  const activity = await activityRes.json();
  const km = Number((activity.distance / 1000).toFixed(2));

  const kw = (userData.stravaKeyWord || "").toLowerCase();
  const name = (activity.name || "").toLowerCase();
  const desc = (activity.description || "").toLowerCase();

  if (kw && !name.includes(kw) && !desc.includes(kw)) {
    console.log("⏭️ Keyword mismatch");
    return;
  }

  const startDate = new Date(activity.start_date_local);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const startOnly = new Date(startDate);
  startOnly.setHours(0, 0, 0, 0);

  if (startOnly.getTime() !== today.getTime()) {
    console.log("⏭️ Activity is not from today");
    return;
  }

  const time = activity.start_date_local;
  const userRef = adminDb.collection("users").doc(userId);
  const snap = await userRef.get();

  const currentLog = snap.data()?.log || {};
  const todayKey = startDate.toISOString().slice(0, 10);
  const existing = currentLog[todayKey];

  if (existing && new Date(existing.time) >= new Date(time)) {
    console.log("⏭️ Existing entry is newer or equal");
    return;
  }

  const updated = {
    ...currentLog,
    [todayKey]: { km, time },
  };

  await userRef.update({ log: updated });
  console.log(`🎉 Updated log for ${userId}: ${km} km`);
}

/**
 * Main API handler
 */
export default async function handler(req, res) {
  const clientSecret = process.env.STRAVA_CLIENT_SECRET;

  // GET = validation from Strava
  if (req.method === "GET") {
    console.log("🔹 GET request for hub.challenge:", req.query["hub.challenge"]);
    return res.status(200).send(req.query["hub.challenge"]);
  }

  // POST = webhook event
  if (req.method === "POST") {
    try {
      const rawBody = await getRawBody(req);
      console.log("🔹 rawBody length:", rawBody.length);
      console.log("🔹 All headers:", req.headers);

    // Try both possible header names
    const signature =
    req.headers["x-hub-signature-256"] || req.headers["x-hub-signature"];
    console.log("🔹 Using signature header:", signature);

      if (!verifyWebhookSignature(rawBody, clientSecret, signature)) {
        console.error("❌ Invalid webhook signature");
        return res.status(403).send("Invalid signature");
      }

      const event = JSON.parse(rawBody.toString("utf8"));
      console.log("🔹 Parsed event:", event);

      handleWebhookEvent(event).catch((err) => console.error("❌ Webhook event error:", err));
      return res.status(200).send("OK");
    } catch (err) {
      console.error("❌ Error handling webhook:", err);
      return res.status(500).send("Server error");
    }
  }

  return res.status(405).send("Method Not Allowed");
}
