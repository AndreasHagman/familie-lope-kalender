import { useMemo } from "react";
import { motion } from "framer-motion";

export default function SnowBackground({ children }) {
  const snowballs = useMemo(() => Array.from({ length: 50 }), []);

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-blue-50 to-white overflow-hidden px-4 sm:px-8 py-2">

      {/* ❄ Falling snowballs */}
      {snowballs.map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-2 bg-white rounded-full opacity-80"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * -100}%`,
          }}
          animate={{ y: ["-10vh", "110vh"] }}
          transition={{
            repeat: Infinity,
            duration: 3 + Math.random() * 5,
            delay: Math.random() * 5,
            ease: "linear",
          }}
        />
      ))}

      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}
