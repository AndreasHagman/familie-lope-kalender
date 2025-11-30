export function getWeatherMotivation(data) { 
  if (!data || !data.main || !data.weather || !data.weather[0]) {
    return "🏃 Kom deg ut og nyt dagens løpetur!";
  }

  const temp = data.main.temp;
  const wind = data.wind?.speed || 0;
  const weatherId = data.weather[0].id; // ex: 800 = klar himmel

  const isRain = weatherId >= 500 && weatherId < 600;
  const isSnow = weatherId >= 600 && weatherId < 700;

  if (isRain) return "🌧 Litt regn i dag – vurder en tidligere økt!";
  
  if (isSnow) {
    if (temp <= -10) return "❄️ Veldig kaldt med snø – husk varme klær og reflekser!";
    if (temp <= -5) return "❄️ Kaldt med snø – finn gode sko og hold deg varm!";
    return "❄️ Litt snø – perfekt for en frisk løpetur!";
  }

  // Kaldt men ikke snø
  if (temp <= 0) {
    if (temp <= -10) return "🥶 Veldig kaldt ute – kle deg godt og vurder kortere tur!";
    if (temp <= -5) return "❄️ Kaldt ute – husk gode klær og sko!";
    return "🥶 Litt kjølig, men helt fint med riktige klær!";
  }

  // Mildt / varmt
  if (temp > 20) return "☀️ Perfekt løpevær i dag!";
  if (temp > 10) return "😄 Flott løpevær.";
  if (temp > 0) return "😊 Litt kjølig, men helt fint med riktige klær.";

  // Vind-advarsel kan legges til uavhengig
  if (wind > 10) return "💨 Mye vind – finn et mer skjermet område.";

  return "🏃 Kom deg ut og nyt dagens løpetur!";
}
