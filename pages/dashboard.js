import { useAuth } from "../firebase/AuthContext";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import CalendarCard from "../components/CalendarCard";
import { db } from "../firebase/firebaseConfig";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";

// 🔥 Hent/trrekk dagens km fra Firestore
async function getKmForToday() {
  const today = new Date().toISOString().slice(0, 10); // yyyy-mm-dd
  const selectedRef = doc(db, "config", "dailyKmSelected");
  const dailyListRef = doc(db, "config", "dailyKm");

  // Hent allerede trukne tall
  const selectedSnap = await getDoc(selectedRef);
  if (selectedSnap.exists() && selectedSnap.data()[today] !== undefined) {
    return selectedSnap.data()[today]; // Allerede trukket
  }

  // Hent hele originallisten
  const listSnap = await getDoc(dailyListRef);
  const list = listSnap.data()?.list || [];

  const weekday = new Date(today).getDay(); // 0=søndag, 1=mandag ...
  let kmForToday;

  if (weekday === 0) kmForToday = 0;       // Søndag
  else if (weekday === 1) kmForToday = 7;  // Mandag
  else {
    const reserved = [7,7,7,7,0,0,0,0];
    const available = list.filter(v => !reserved.includes(v));
    kmForToday = available[Math.floor(Math.random() * available.length)];
  }

  await setDoc(selectedRef, { [today]: kmForToday }, { merge: true });
  return kmForToday;
}

// ✅ Modal-knapp komponent
function LogKmButton({ onSubmit, existingLogForToday }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [kmLogged, setKmLogged] = useState("");

  const handleSubmit = () => {
    const kmValue = Number(kmLogged);
    if (isNaN(kmValue)) return;
    onSubmit(kmValue);
    setKmLogged("");
    setModalOpen(false);
  };

  return (
    <>
      <button
        onClick={() => setModalOpen(true)}
        className="bg-juleRød text-white px-6 py-3 rounded hover:bg-red-700 mt-4"
      >
        Logg løpeturen
      </button>

<AnimatePresence>
      {modalOpen && (
       <motion.div
            className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white rounded-lg p-6 w-80 max-w-full"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
            >
              {/* 🔥 VIS EKSISTERENDE LOGG FOR DAGENS DATO */}
        <div className="mb-4 text-center">
          {existingLogForToday !== undefined ? (
            <p className="text-sm text-gray-700">
              Du har allerede registrert:  
              <span className="font-bold text-juleRød"> {existingLogForToday} km</span>
            </p>
          ) : (
            <p className="text-sm text-gray-500">
              Ingen data registrert for i dag.
            </p>
          )}
        </div>
            <h2 className="text-xl font-bold mb-4 text-center">Logg løpeturen</h2>
            <input
              type="number"
              min="0"
              value={kmLogged}
              onChange={(e) => setKmLogged(e.target.value)}
              placeholder="Antall km"
              className="border rounded px-3 py-2 w-full text-center mb-4"
            />
            <div className="flex justify-between">
              <button
                onClick={() => setModalOpen(false)}
                className="px-4 py-2 rounded border hover:bg-gray-100"
              >
                Avbryt
              </button>
              <button
                onClick={handleSubmit}
                className="bg-juleRød text-white px-4 py-2 rounded hover:bg-red-700"
              >
                Logg km
              </button>
            </div>
          </motion.div>
          </motion.div>
      )}
      </AnimatePresence>
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
          setLogData(snap.data().log || {});
          setExistingLogForToday(snap.data().log?.[today]);

          const km = await getKmForToday();
          setDailyKm(km);

        } catch (err) {
          console.error("Feil ved init:", err);
        }
      };

      initUserAndFetch();
    }
  }, [user, loading]);

  const handleSubmit = async (kmValue) => {
    if (isNaN(kmValue)) return;

    try {
      const docRef = doc(db, "users", user.uid);
      const newLog = { ...logData, [today]: kmValue };

      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        await updateDoc(docRef, { log: newLog });
      } else {
        await setDoc(docRef, { log: newLog, displayName: user.displayName || user.email });
      }

      setLogData(newLog);
      router.push("/familie"); // Send bruker til Familie-fanen etter logging
    } catch (err) {
      console.error(err);
    }
  };

  // Snøballer
  const snowballs = Array.from({ length: 50 });

  return (
    <div className="relative h-full bg-gradient-to-b from-blue-50 to-white overflow-hidden px-4 sm:px-8 py-6 no-scroll">
      {snowballs.map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-2 bg-white rounded-full"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * -100}%`,
          }}
          animate={{ y: ["-10vh", "110vh"] }}
          transition={{
            repeat: Infinity,
            repeatType: "loop",
            duration: 3 + Math.random() * 5,
            delay: Math.random() * 5,
            ease: "linear",
          }}
        />
      ))}

      <h2 className="text-3xl fest-title mb-6 text-juleRød text-center relative z-10">
        Dagens luke
      </h2>

      <div className="relative z-10 flex flex-col items-center">
        {dailyKm === null ? (
          <p className="text-center text-lg">Henter dagens luke...</p>
        ) : (
          <CalendarCard date={today} km={dailyKm} isOpenable={true} />
        )}

        <LogKmButton 
        onSubmit={handleSubmit} 
        existingLogForToday={existingLogForToday}
      />
      </div>
    </div>
  );
}
