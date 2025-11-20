export default async function handler(req, res) {
  const { lat, lon } = req.query;

  try {
    const apiKey = process.env.NEXT_PUBLIC_WEATHER_API_KEY;

    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&lang=no&appid=${apiKey}`;

    const weatherRes = await fetch(url);

    if (!weatherRes.ok) {
      return res.status(500).json({ error: "Weather API feilet" });
    }

    const data = await weatherRes.json();
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: "Serverfeil ved henting av værdata" });
  }
}
