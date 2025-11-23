import { useAuth } from "../firebase/AuthContext";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import CalendarCard from "../components/CalendarCard";
import { db } from "../firebase/firebaseConfig";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { motion } from "framer-motion";
import LogKmModal from "../components/LogKmModal";
import WeatherMotivator from "../components/WeatherMotivator";

// 🔥 Hent/trrekk dagens km fra Firestore
async function getKmForToday() {
  const today = new Date().toISOString().slice(0, 10); 
  const selectedRef = doc(db, "config", "dailyKmSelected");
  const dailyListRef = doc(db, "config", "dailyKm");

  const selectedSnap = await getDoc(selectedRef);
  if (selectedSnap.exists() && selectedSnap.data()[today] !== undefined) {
    return selectedSnap.data()[today];
  }

  const listSnap = await getDoc(dailyListRef);
  const list = listSnap.data()?.list || [];

  const weekday = new Date(today).getDay();
  let kmForToday;
  if (weekday === 0) kmForToday = 0;     
  else if (weekday === 1) kmForToday = 7; 
  else {
    const reserved = [7,7,7,7,0,0,0,0];
    const available = list.filter(v => !reserved.includes(v));
    kmForToday = available[Math.floor(Math.random() * available.length)];
  }

  await setDoc(selectedRef, { [today]: kmForToday }, { merge: true });
  return kmForToday;
}

// ✅ Modal button component med Strava
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
  const [today] = useState(new Date().toISOString().slice(0, 10));
  const [existingLogForToday, setExistingLogForToday] = useState(undefined);
  const [stravaAccessToken, setStravaAccessToken] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [openTrigger, setOpenTrigger] = useState(0);

 const handleCardClick = () => {
  setIsOpen(prev => !prev);
    };

    // 🔥 Trigger juletrær når kortet GÅR FRA lukket → åpent
    useEffect(() => {
      if (isOpen) {
        setOpenTrigger(t => t + 1);
      }
    }, [isOpen]);

  useEffect(() => {
    if (!loading && !user) router.push("/login");

    if (user) {
      const initUserAndFetch = async () => {
        try {
          const docRef = doc(db, "users", user.uid);
          const docSnap = await getDoc(docRef);

          if (!docSnap.exists()) {
            await setDoc(docRef, {
              displayName: user.displayName || user.email,
              log: {},
              createdAt: new Date().toISOString(),
            });
          }

          const snap = await getDoc(docRef);
          const data = snap.data();
          setLogData(data.log || {});
          setExistingLogForToday(data.log?.[today]);
          
          // 🔹 Hent Strava access token
          if (data.strava?.access_token) {
            setStravaAccessToken(data.strava.access_token);
          }

          const km = await getKmForToday();
          setDailyKm(km);
        } catch (err) {
          console.error("Feil ved init:", err);
        }
      };

      initUserAndFetch();
    }
  }, [user, loading]);

  const handleSubmit = async (kmValue, timeValue) => {
  if (isNaN(kmValue)) return;

  // Hvis Strava ikke ga oss tidspunkt → bruk nåværende tidspunkt
  const timestamp = timeValue || new Date().toISOString();

  try {
    const docRef = doc(db, "users", user.uid);

    // Ny struktur for dagens logg
    const newLog = {
      ...logData,
      [today]: {
        km: kmValue,
        time: timestamp,
      },
    };

    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      await updateDoc(docRef, { log: newLog });
    } else {
      await setDoc(docRef, {
        log: newLog,
        displayName: user.displayName || user.email,
      });
    }

    setLogData(newLog);
    router.push("/familie");
  } catch (err) {
    console.error(err);
  }
};


  // Snøballer
  const snowballs = Array.from({ length: 50 });

  return (
    <div className="relative h-full bg-gradient-to-b from-blue-50 to-white overflow-hidden px-4 sm:px-8 py-2 no-scroll">
      {snowballs.map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-2 bg-white rounded-full"
          style={{ left: `${Math.random() * 100}%`, top: `${Math.random() * -100}%` }}
          animate={{ y: ["-10vh", "110vh"] }}
          transition={{ repeat: Infinity, repeatType: "loop", duration: 3 + Math.random() * 5, delay: Math.random() * 5, ease: "linear" }}
        />
      ))}

      <h2 className="text-3xl fest-title mb-6 text-juleRød text-center relative z-10">
        Dagens luke
      </h2>

      <div className="relative z-10 flex flex-col items-center">
        {dailyKm === null ? (
          <p className="text-center text-lg">Henter dagens luke...</p>
        ) : (
          <div onClick={handleCardClick}>
            <CalendarCard
              date={today}
              km={dailyKm}
              isOpenable={true}
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
      </div>
    </div>
  );
}
