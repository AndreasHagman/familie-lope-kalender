import { useState, useEffect } from "react";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { useAuth } from "../firebase/AuthContext";
import { db } from "../firebase/firebaseConfig";
import Toast from "../components/Toast";

export default function StravaKeyword() {
  const { user } = useAuth();
  const [keyword, setKeyword] = useState("");
  const [toast, setToast] = useState("");

  // Load keyword from Firestore
  useEffect(() => {
    if (!user) return;
    const fetchKeyword = async () => {
      const docRef = doc(db, "users", user.uid);
      const snap = await getDoc(docRef);
      setKeyword(snap.data()?.stravaKeyWord || "");
    };
    fetchKeyword();
  }, [user]);

  const saveKeyword = async () => {
    if (!user) return;
    const userRef = doc(db, "users", user.uid);
    await updateDoc(userRef, { stravaKeyWord: keyword });
    setToast("Nøkkelord lagret! 🎉");
  };

  return (
    <div className="p-6 border rounded-lg shadow bg-white mt-6">
      <h2 className="text-lg font-semibold mb-2">Marker relevante økter</h2>
      <p className="text-gray-600 mb-2">
        Skriv inn et ord som skal finnes i navn eller beskrivelse på økter som skal importeres til kalenderen. 
        Dette er for å identifisere hvilke Strava-aktiviteter som er løpekalender-relaterte.
      </p>
      <input
        type="text"
        value={keyword}
        onChange={(e) => setKeyword(e.target.value)}
        placeholder="f.eks. luke"
        className="border rounded px-3 py-2 w-full mb-2"
      />
      <button
        onClick={saveKeyword}
        className="bg-juleRød text-white px-4 py-2 rounded hover:bg-red-700"
      >
        Lagre
      </button>
      {toast && <Toast message={toast} onClose={() => setToast("")} />}
    </div>
  );
}
