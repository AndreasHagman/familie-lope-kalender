import { useState } from "react";
import { auth, provider, db } from "../firebase/firebaseConfig";
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup 
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { useAuth } from "../firebase/AuthContext";
import { useRouter } from "next/router";

export default function Login() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nickname, setNickname] = useState("");  // ⬅️ NYTT
  const [isRegister, setIsRegister] = useState(false);
  const [error, setError] = useState("");

  if (!loading && user) router.push("/dashboard");

  // 🚀 E-post registrering / login
  const handleEmailAuth = async () => {
    setError("");
    try {
      if (isRegister) {
        // 🔥 1. Opprett bruker i Firebase Auth
        const userCred = await createUserWithEmailAndPassword(auth, email, password);
        const uid = userCred.user.uid;

        // 🔥 2. Opprett Firestore-dokument med displayName = nickname
        await setDoc(doc(db, "users", uid), {
          displayName: nickname,
          log: {},
          createdAt: new Date().toISOString(),
        });

      } else {
        // Vanlig login
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  // 🚀 Google login
  const handleGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      const uid = result.user.uid;

      const userRef = doc(db, "users", uid);
      const snap = await getDoc(userRef);

      // Hvis Google-bruker ikke har dokument – opprett det
      if (!snap.exists()) {
        await setDoc(userRef, {
          displayName: result.user.displayName || result.user.email,
          log: {},
          createdAt: new Date().toISOString(),
        });
      }

    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <div className="card w-full max-w-md p-6">
        <h2 className="text-2xl fest-title mb-4">
          {isRegister ? "Registrer" : "Logg inn"}
        </h2>

        {error && <p className="text-red-500 mb-2">{error}</p>}

        {/* ⬅️ Vises kun ved registrering */}
        {isRegister && (
          <input
            className="border rounded px-3 py-2 w-full mb-2"
            type="text"
            placeholder="Kallenavn"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            required
          />
        )}

        <input
          className="border rounded px-3 py-2 w-full mb-2"
          type="email"
          placeholder="E-post"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          className="border rounded px-3 py-2 w-full mb-4"
          type="password"
          placeholder="Passord"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button className="btn w-full mb-2" onClick={handleEmailAuth}>
          {isRegister ? "Registrer" : "Logg inn"}
        </button>

        <button
          className="btn w-full mb-2 bg-blue-500 hover:bg-blue-600"
          onClick={handleGoogle}
        >
          Logg inn med Google
        </button>

        <p className="text-sm mt-2">
          {isRegister ? "Allerede bruker?" : "Ikke registrert?"}{" "}
          <button
            className="text-juleRød font-bold"
            onClick={() => setIsRegister(!isRegister)}
          >
            {isRegister ? "Logg inn" : "Registrer"}
          </button>
        </p>
      </div>
    </div>
  );
}
