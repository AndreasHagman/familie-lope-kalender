/**
 * Hent dagens Strava-aktiviteter for en bruker med gitt access token,
 * og filtrer på et nøkkelord i navn eller beskrivelse.
 */
export async function fetchTodaysStravaActivities(accessToken, keyWord) {
  //const todayDate = new Date().toISOString().slice(0, 10);
  const todayDate = new Date("2025-11-17T00:00:00Z").toISOString().slice(0, 10);

  try {
    const res = await fetch(
      `https://www.strava.com/api/v3/athlete/activities?per_page=50`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    if (!res.ok) throw new Error("Strava fetch failed");

    const activities = await res.json();

    // Filtrer dagens aktiviteter med keyWord i navn/description
    const todayActivities = activities.filter((act) => {
      const actDate = act.start_date_local.slice(0, 10);
      return (
        actDate === todayDate 
        &&
        (act.name?.toLowerCase().includes(keyWord.toLowerCase()) ||
        act.description?.toLowerCase().includes(keyWord.toLowerCase()))
      );
    });

    // Summer km hvis flere aktiviteter
    const totalKm =
      todayActivities.length > 0
        ? todayActivities.reduce((acc, act) => acc + act.distance / 1000, 0)
        : 0;

    return totalKm.toFixed(2);
  } catch (err) {
    console.error("Feil ved henting av Strava-aktiviteter:", err);
    return 0;
  }
}

// ---------------------------------------------
// 1. Hent Strava athlete-profil
// ---------------------------------------------
export async function fetchStravaAthlete(accessToken) {
  try {
    const res = await fetch("https://www.strava.com/api/v3/athlete", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!res.ok) {
      console.warn("Athlete fetch failed:", res.status);
      return null;
    }

    return await res.json();
  } catch (err) {
    console.error("Feil ved henting av athlete:", err);
    return null;
  }
}