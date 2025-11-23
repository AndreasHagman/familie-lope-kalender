import Link from "next/link";
import { useRouter } from "next/router";
import { useAuth } from "../firebase/AuthContext";
import { signOut } from "firebase/auth";
import { auth } from "../firebase/firebaseConfig";
import { useState } from "react";

export default function Layout({ children }) {
  const { user } = useAuth();
  const router = useRouter();
  const currentPath = router.pathname;

  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = [
    { href: "/dashboard", label: "Dagens" },
    { href: "/luker", label: "Luker" },
    { href: "/familie", label: "Familien" },
    { href: "/stravaProfil", label: "Strava" },
  ];

  return (
    <div className="relative flex flex-col min-h-screen bg-gray-50">
      <div className="snow"></div>

      <header className="bg-white shadow py-0 sticky top-0 z-20 flex-shrink-0">
        <div className="container mx-auto flex flex-col sm:flex-row justify-between items-center px-4">
          <h1 className="fest-title text-3xl text-juleRød mb-2 sm:mb-0">
            Kvale's Løpekalender
          </h1>

          {user && (
            <div className="w-full sm:w-auto relative">
              {/* Hamburger for mobile */}
              <button
               className="sm:hidden px-4 py-1 text-2xl border rounded"
              onClick={() => setMobileOpen(!mobileOpen)}
              style={{ lineHeight: 1.5 }}
              >
                ☰
              </button>

              {/* Menu links */}
              <ul
                className={`flex flex-col sm:flex-row sm:space-x-4 whitespace-nowrap mt-2 sm:mt-0 overflow-hidden transition-[max-height] duration-300 ease-in-out ${
                  mobileOpen ? "max-h-96" : "max-h-0 sm:max-h-full"
                }`}
              >
                {navItems.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={`py-2 px-4 text-center block rounded transition-all duration-200 ${
                        currentPath === item.href
                          ? "bg-juleRød text-white font-semibold shadow"
                          : "btn-ghost hover:bg-gray-100"
                      }`}
                      onClick={() => setMobileOpen(false)} // close menu after click on mobile
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
                <li>
                  <button
                    className="btn-ghost py-2 px-4 text-center block rounded hover:bg-gray-100 mt-1 sm:mt-0"
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

      <main className="flex-1 overflow-hidden container mx-auto px-4 z-10 relative">
        {children}
      </main>
    </div>
  );
}
