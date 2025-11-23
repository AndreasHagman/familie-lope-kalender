import { useEffect, useState } from "react";
import { db } from "../firebase/firebaseConfig";
import { collection, getDocs } from "firebase/firestore";
import ProgressBar from "../components/ProgressBar";
import { useAuth } from "../firebase/AuthContext";
import { useRouter } from "next/router";
import { dailyKmList } from "../utils/dailyKm";
import Link from "next/link";

export default function Familie() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [usersData, setUsersData] = useState([]);

  useEffect(() => {
    if (!loading && !user) router.push("/login");

    if (user) {
      const fetchData = async () => {
        const usersCol = collection(db, "users");
        const userSnapshot = await getDocs(usersCol);
        const usersArr = userSnapshot.docs.map(doc => ({
          id: doc.id,
          displayName: doc.data().displayName || doc.data().email,
          log: doc.data().log || {}
        }));
        setUsersData(usersArr);
      };
      fetchData();
    }
  }, [user, loading]);

  const totalGoal = dailyKmList.reduce((sum, km) => sum + km, 0);

  return (
  <div className="px-4 sm:px-8 py-2">
    <h2 className="text-3xl fest-title mb-6 text-juleRød text-center">Familien</h2>

    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {usersData.map((u) => {
        // Sum all km from the log objects
        const totalLogged = Object.values(u.log).reduce((acc, entry) => {
          return acc + (entry.km || 0);
        }, 0);

        const progress = Math.min((totalLogged / totalGoal) * 100, 100);

        return (
          <Link key={u.id} href={`/familie/${u.id}`}>
            <div className="bg-white rounded-lg shadow p-4 flex flex-col space-y-2 cursor-pointer hover:bg-gray-50 transition">
              <p className="font-semibold text-lg">{u.displayName}</p>

              <p className="text-sm text-gray-700">
                {totalLogged} km av {totalGoal} km
              </p>

              <ProgressBar progress={progress} />
            </div>
          </Link>
        );
      })}
    </div>
  </div>
);
}
