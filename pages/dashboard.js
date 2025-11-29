import { useAuth } from "../firebase/AuthContext";
import { useRouter } from "next/router";
import { useEffect, useState, useMemo } from "react";
import CalendarCard from "../components/CalendarCard";
import { db } from "../firebase/firebaseConfig";
import { getKmForToday } from "../firebase/getDailyKm";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import LogKmModal from "../components/LogKmModal";
import WeatherMotivator from "../components/WeatherMotivator";
import { isWithinAdventPeriod } from "../utils/isWithinAdventPeriod";
import SnowBackground from "../components/SnowBackground";

function LogKmButton({ onSubmit, existingLogForToday, stravaAccessToken, user }) {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setModalOpen(true)}
        className="bg-juleRød text-white px-6 py-3 rounded hover:bg-red-700 mt-4"
      >
        Logg løpeturen
      </button>

      <LogKmModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={onSubmit}
        existingLogForToday={existingLogForToday}
        stravaAccessToken={stravaAccessToken}
        user={user}
      />
    </>
  );
}

export default function Dashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [logData, setLogData] = useState({});
  const [dailyKm, setDailyKm] = useState(null);
  const [existingLogForToday, setExistingLogForToday] = useState(null);
  const [stravaAccessToken, setStravaAccessToken] = useState(null);

  const [isOpen, setIsOpen] = useState(false);
  const [openTrigger, setOpenTrigger] = useState(0);

  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const isValidAdventDay = isWithinAdventPeriod();

  const handleCardClick = () => setIsOpen(prev => !prev);

  useEffect(() => {
    if (isOpen) setOpenTrigger(t => t + 1);
  }, [isOpen]);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
      return;
    }

    if (!user) return;

    const loadUser = async () => {
      const docRef = doc(db, "users", user.uid);
      let snap = await getDoc(docRef);

      if (!snap.exists()) {
        await setDoc(docRef, {
          displayName: user.displayName || user.email,
          log: {},
          createdAt: new Date().toISOString(),
        });
        snap = await getDoc(docRef);
      }

      const data = snap.data();
      setLogData(data.log || {});
      setExistingLogForToday(data.log?.[today]);
      setStravaAccessToken(data.strava?.access_token || null);

      if (isValidAdventDay) {
        setDailyKm(await getKmForToday());
      }

    };

    loadUser();
  }, [user, loading, today, router]);

  const handleSubmit = async (kmValue, timeValue) => {
    if (isNaN(kmValue)) return;

    const timestamp = timeValue || new Date().toISOString();
    const docRef = doc(db, "users", user.uid);

    const newLog = {
      ...logData,
      [today]: { km: kmValue, time: timestamp },
    };

    const snap = await getDoc(docRef);

    if (snap.exists()) {
      await updateDoc(docRef, { log: newLog });
    } else {
      await setDoc(docRef, {
        log: newLog,
        displayName: user.displayName || user.email,
      });
    }

    setLogData(newLog);
    router.push("/familie");
  };

  return (
    <div className="relative h-full bg-gradient-to-b from-blue-50 to-white overflow-hidden px-4 sm:px-8 py-2">
      <SnowBackground>
      <h2 className="text-3xl fest-title mb-6 text-juleRød text-center relative z-10">
        Dagens luke
      </h2>

      <div className="relative z-10 flex flex-col items-center">

  {!isValidAdventDay ? (
    <>
      <h2 className="text-3xl fest-title mb-6 text-juleRød text-center">
        🎅 Snart desember!
      </h2>
      <p className="text-center text-gray-700 max-w-md">
        Adventskalenderen åpner 1. desember, og frem til da er nissene travelt opptatt 
        med å pakke inn løpemotivasjon og juleglede.  
        <br /><br />
        Kom tilbake da for å åpne første luke! 🎁✨
      </p>
    </>
  ) : (
    <>
      {dailyKm == null ? (
        <p>Henter dagens luke...</p>
      ) : (
        <div onClick={handleCardClick}>
          <CalendarCard
            date={today}
            km={dailyKm}
            isOpen={isOpen}
            openTrigger={openTrigger}
          />
        </div>
      )}

      <LogKmButton
        onSubmit={handleSubmit}
        existingLogForToday={existingLogForToday}
        stravaAccessToken={stravaAccessToken}
        user={user}
      />

      <WeatherMotivator />
    </>
  )}

    </div>
    </SnowBackground>
  </div>
  );
}
