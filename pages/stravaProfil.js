import { useEffect, useState } from "react";
import { auth, db } from "../firebase/firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import StravaKeyword from "../components/StravaKeyword";
import StravaTodayActivities from "../components/StravaTodayActivities";
import { fetchStravaAthlete } from "../utils/stravaClient";
import { getValidStravaAccessToken } from "../utils/stravaAuth";

export default function StravaProfile() {
  const [user, setUser] = useState(null);
  const [strava, setStrava] = useState(null);
  const [loading, setLoading] = useState(true);
  const [athlete, setAthlete] = useState(null);

  const STRAVA_AUTH_URL = `https://www.strava.com/oauth/authorize?client_id=${
    process.env.NEXT_PUBLIC_STRAVA_CLIENT_ID
  }&response_type=code&redirect_uri=${
    process.env.NEXT_PUBLIC_STRAVA_REDIRECT_URL
  }&approval_prompt=auto&scope=read,activity:read&state=${user?.uid || ""}`;

  // -------------------------
  // 1. Sjekk innlogget bruker
  // -------------------------
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      if (!u) {
        setUser(null);
        setLoading(false);
        return;
      }

      setUser(u);

      const docRef = doc(db, "users", u.uid);
      const snapshot = await getDoc(docRef);

      if (snapshot.exists() && snapshot.data().strava) {
        const data = snapshot.data().strava;
        setStrava(data);

        // Hvis access token finnes → hent athlete-info
        if (data.access_token) {
          // 1. Refresh token (if needed)
          const token = await getValidStravaAccessToken(u.uid);
          // 2. Hvis token ble oppdatert → hent hele oppdaterte strava-objektet
          if (token !== data.access_token) {
            const freshSnap = await getDoc(doc(db, "users", u.uid));
            const freshStrava = freshSnap.data().strava;
            setStrava(freshStrava);
          }

          // 3. Hent athlete-data med gyldig token
          const athleteData = await fetchStravaAthlete(token);
          setAthlete(athleteData);
        }
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // ------------------------------
  // 3. Koble fra Strava
  // ------------------------------
  async function disconnectStrava() {
    if (!user) return;

    const userRef = doc(db, "users", user.uid);

    await updateDoc(userRef, {
      strava: null,
    });

    setStrava(null);
    setAthlete(null);
  }

  if (loading) {
    return <div className="p-6">Laster…</div>;
  }

  if (!user) {
    return <div className="p-6">Du må være innlogget.</div>;
  }

  return (
    <div className="max-w-lg mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">Strava-integrasjon</h1>

      {/* Ikke tilkoblet */}
      {!strava && (
        <div className="p-6 border rounded-lg shadow bg-white">
          <p className="mb-4">
            Du har ikke koblet kontoen din til Strava enda.
          </p>

          <a
            href={STRAVA_AUTH_URL}
            className="bg-orange-600 text-white px-4 py-2 rounded block text-center hover:bg-orange-700"
          >
            🔗 Koble til Strava
          </a>
        </div>
      )}

      {/* Tilkoblet */}
      {strava && (
        <div className="p-6 border rounded-lg shadow bg-white">
          <p className="text-green-700 font-semibold mb-4">
            ✔ Strava er koblet til!
          </p>

          {athlete && (
            <div className="flex items-center gap-4 mb-4">
              <img
                src={athlete.profile}
                className="w-16 h-16 rounded-full"
                alt="Profil"
              />
              <div>
                <p className="font-semibold text-lg">
                  {athlete.firstname} {athlete.lastname}
                </p>
                <p className="text-sm text-gray-500">
                  Athlete ID: {athlete.id}
                </p>
              </div>
            </div>
          )}

          {!athlete && (
            <p className="text-gray-500 mb-4">Henter Strava-info…</p>
          )}

          <button
            onClick={disconnectStrava}
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
          >
            ❌ Koble fra Strava
          </button>
          {/* ---------------- Keyword component ---------------- */}
          <StravaKeyword />

           {/* ⭐ NYTT KOMPONENT: viser dagens Strava-aktiviteter */}
            <StravaTodayActivities accessToken={strava.access_token} />
        </div>
      )}
    </div>
  );
}
