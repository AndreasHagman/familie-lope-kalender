import { useEffect } from "react";
import { useAuth } from "../firebase/AuthContext";
import { useRouter } from "next/router";

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (user) {
        router.replace("/dashboard"); // Hvis logget inn → dashboard
      } else {
        router.replace("/login"); // Hvis ikke → login
      }
    }
  }, [user, loading]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <p>Laster...</p>
    </div>
  );
}
