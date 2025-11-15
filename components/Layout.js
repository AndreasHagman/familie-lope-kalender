import Link from "next/link";
import { useAuth } from "../firebase/AuthContext";
import { signOut } from "firebase/auth";
import { auth } from "../firebase/firebaseConfig";

export default function Layout({ children }) {
  const { user } = useAuth();

  return (
    <div className="relative min-h-screen bg-gray-50">
      {/* Snøeffekt */}
      <div className="snow"></div>

      <header className="bg-white shadow py-4 sticky top-0 z-20">
        <div className="container mx-auto flex flex-col sm:flex-row justify-between items-center px-4">
          <h1 className="fest-title text-2xl text-juleRød mb-2 sm:mb-0">Familieløpekalender</h1>

          {user && (
            <div className="overflow-x-auto w-full sm:w-auto">
              <ul className="flex space-x-2 sm:space-x-4 whitespace-nowrap">
                <li>
                  <Link href="/dashboard" className="btn-ghost py-2 px-4 text-center block">
                    Dashboard
                  </Link>
                </li>
                <li>
                  <Link href="/familie" className="btn-ghost py-2 px-4 text-center block">
                    Familien
                  </Link>
                </li>
                <li>
                  <button
                    className="btn-ghost py-2 px-4 text-center"
                    onClick={() => signOut(auth)}
                  >
                    Logg ut
                  </button>
                </li>
              </ul>
            </div>
          )}
        </div>
      </header>

      <main className="container mx-auto px-4 mt-6 z-10 relative">
        {children}
      </main>
    </div>
  );
}
