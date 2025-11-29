export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { refresh_token } = req.body;
  if (!refresh_token) return res.status(400).json({ error: "Missing refresh_token" });

  try {
    const response = await fetch("https://www.strava.com/api/v3/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: process.env.NEXT_PUBLIC_STRAVA_CLIENT_ID,
        client_secret: process.env.STRAVA_CLIENT_SECRET,
        grant_type: "refresh_token",
        refresh_token,
      }),
    });

    const json = await response.json();
    if (!json.access_token) {
      return res.status(401).json({ error: "Refresh failed", details: json });
    }

    return res.status(200).json(json);

  } catch (err) {
    return res.status(500).json({ error: "Server error", details: err });
  }
}
