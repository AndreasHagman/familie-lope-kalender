/**
 * Hent dagens Strava-aktiviteter for en bruker med gitt access token,
 * og filtrer på et nøkkelord i navn eller beskrivelse.
 */
export async function fetchTodaysStravaActivities(accessToken, keyWord) {
  //const todayDate = new Date().toISOString().slice(0, 10);
  const todayDate = new Date().toLocaleDateString("sv-SE"); 
  // const todayDate = new Date("2025-11-17T00:00:00Z").toISOString().slice(0, 10);

  try {
    const res = await fetch(
      `https://www.strava.com/api/v3/athlete/activities?per_page=50`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    if (!res.ok) throw new Error("Strava fetch failed");

    const activities = await res.json();

    // 👇 Finn aktiviteter i dag som matcher keyWord
    const todayActivities = activities.filter((act) => {
      const actDate = act.start_date_local.slice(0, 10);
      return (
        actDate === todayDate &&
        (act.name?.toLowerCase().includes(keyWord.toLowerCase()) ||
          act.description?.toLowerCase().includes(keyWord.toLowerCase()))
      );
    });

    if (todayActivities.length === 0) {
      return { km: 0, time: null };
    }

    // 👇 Summer km
    const totalKm = todayActivities.reduce(
      (acc, act) => acc + act.distance / 1000,
      0
    );

    // 👇 Ta tidspunktet fra den første matchede aktiviteten
    const firstActivityTime = todayActivities[0].start_date_local;

    return {
      km: Number(totalKm.toFixed(2)),
      time: firstActivityTime,
    };
  } catch (err) {
    console.error("Feil ved henting av Strava-aktiviteter:", err);
    return { km: 0, time: null };
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