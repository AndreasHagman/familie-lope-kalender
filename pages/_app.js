import '../styles/globals.css'
import { initializeDailyKmList } from "../firebase/initKmData";
import { AuthProvider, useAuth } from '../firebase/AuthContext'
import Layout from '../components/Layout'
import { useEffect } from "react";

function Initializer() {
  const { loading } = useAuth();

  useEffect(() => {
    if (loading) return;

    // Client-only
    if (typeof window !== "undefined") {
      initializeDailyKmList();
    }
  }, [loading]);

  return null; // renders nothing
}

function MyApp({ Component, pageProps }) {
  return (
    <AuthProvider>
      <Initializer />  {/* ensures Firestore init runs only after auth is ready */}
      <Layout>
        <Component {...pageProps} />
      </Layout>
    </AuthProvider>
  );
}

export default MyApp;
