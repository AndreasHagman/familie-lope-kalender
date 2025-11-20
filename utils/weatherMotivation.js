export function getWeatherMotivation(data) { 
  const temp = data.main.temp;
  const wind = data.wind.speed;
  const weatherId = data.weather[0].id; // ex: 800 = klar himmel
  const isRain = weatherId >= 500 && weatherId < 600;
  const isSnow = weatherId >= 600 && weatherId < 700; // snøtyper i OpenWeather

  if (isRain) return "🌧 Litt regn i dag – vurder en tidligere økt!";
  if (isSnow || temp <= 0) {
    if (temp <= -10) return "❄️ Veldig kaldt med snø – husk varme klær og reflekser!";
    if (temp <= -5) return "❄️ Kaldt med snø – finn gode sko og hold deg varm!";
    return "❄️ Litt snø og kaldt – perfekt for en frisk løpetur!";
  }
  if (temp > 20) return "☀️ Perfekt løpevær i dag!";
  if (temp > 10) return "😄 Flott løpevær.";
  if (temp > 0) return "❄️ Litt kaldt, men helt fint med riktige klær.";
  if (wind > 10) return "💨 Mye vind – finn et mer skjermet område.";

  return "🏃 Kom deg ut og nyt dagens løpetur!";
}
