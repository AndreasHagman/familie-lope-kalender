export default async function handler(req, res) {
  const { lat, lon } = req.query;

  if (!lat || !lon) {
    return res.status(400).json({ error: "Lat/lon mangler" });
  }

  try {
    const apiKey = process.env.NEXT_PUBLIC_WEATHER_API_KEY;

    const weatherRes = await fetch(
      `https://api.openweathermap.org/data/3.0/onecall?lat=${lat}&lon=${lon}&units=metric&lang=no&appid=${apiKey}`
    );

    if (!weatherRes.ok) {
      throw new Error("Weather API feilet");
    }

    const data = await weatherRes.json();

    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: "Klarte ikke hente værdata" });
  }
}
