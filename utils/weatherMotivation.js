export function getWeatherMotivation(weather) {
  const temp = weather.current.temp;
  const rain = weather.minutely?.some((m) => m.precipitation > 0);
  const wind = weather.current.wind_speed;

  if (rain) {
    return "🌧 Det ser ut til å bli regn i dag – kanskje løp nå før det starter?";
  }

  if (temp > 20) {
    return "☀️ Herlig varmt! Perfekt dag for en løpetur.";
  }

  if (temp > 10) {
    return "😊 Fint løpevær. Nyt turen!";
  }

  if (temp > 0) {
    return "❄️ Litt kaldt, men legg inn en rolig økt med gode klær!";
  }

  if (wind > 10) {
    return "💨 Mye vind i dag – prøv å løpe i skog eller mer skjermede steder!";
  }

  return "🏃‍♂️ Et greit utgangspunkt – bare kom deg ut og nyt turen!";
}
