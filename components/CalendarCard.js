import { useEffect, useState } from "react";
import { motion } from "framer-motion";

export default function CalendarCard({
  date,
  km,
  small,
  isOpen,
  openTrigger,
  showNumericDate,
  showDateOnBack,
}) {
  const [particles, setParticles] = useState([]);

  // 🎄 Lag nye partikler hver gang openTrigger øker
  useEffect(() => {
    if (openTrigger > 0) {
      setParticles(
        Array.from({ length: 25 }).map(() => ({
          x: Math.random() * 100 - 50,
          y: Math.random() * -100 - 20,
          scale: Math.random() * (small ? 0.6 : 1.2) + 0.3,
          rotate: Math.random() * 360,
          duration: 1 + Math.random() * 0.8,
        }))
      );
    }
  }, [openTrigger, small]);

  // 📅 Formater dato
  const dateObj = new Date(date);
  const day = dateObj.getDate().toString().padStart(2, "0");
  const month = (dateObj.getMonth() + 1).toString().padStart(2, "0");

  const monthNames = [
    "januar","februar","mars","april","mai","juni",
    "juli","august","september","oktober","november","desember"
  ];

  const dayMonth = showNumericDate
    ? `${day}.${month}`
    : `${dateObj.getDate()}. ${monthNames[dateObj.getMonth()]}`;

  const sizeClasses = small ? "w-16 h-16" : "w-40 sm:w-48 h-40 sm:h-48";

  return (
    <div className={`flex justify-center ${small ? "my-1" : "my-4"} relative`}>
      <motion.div className={`${sizeClasses} perspective cursor-pointer z-10`} whileTap={{ scale: 0.95 }}>
        <motion.div
          className="relative w-full h-full"
          animate={{ rotateY: isOpen ? 180 : 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          style={{ transformStyle: "preserve-3d" }}
        >
          {/* Front */}
          <div
            className="absolute w-full h-full bg-red-600 rounded-lg shadow-lg flex items-center justify-center text-white font-bold"
            style={{ backfaceVisibility: "hidden" }}
          >
            {dayMonth}
          </div>

          {/* Back */}
          <div
            className="absolute w-full h-full bg-white rounded-lg shadow-lg flex items-center justify-center"
            style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
          >
            {showDateOnBack && (
  <p
    className={`absolute top-1 left-1/2 text-gray-500 ${
      small ? "text-[0.45rem]" : "text-xs"
    }`}
    style={{ transform: "translateX(-50%)" }}
  >
    {dayMonth}
  </p>
)}
            <p className={`${small ? "text-base" : "text-4xl"} font-bold`}>
              {km} km
            </p>
          </div>
        </motion.div>
      </motion.div>

      {/* 🎄 Partikler */}
      <div key={openTrigger} className="absolute inset-0 pointer-events-none z-20">
        {particles.map((p, i) => (
          <motion.div
            key={i}
            className={`absolute text-green-700 ${small ? "text-xs" : "text-xl"}`}
            style={{ top: "50%", left: "50%" }}
            initial={{ opacity: 1, x: 0, y: 0, scale: 1 }}
            animate={{
              x: p.x,
              y: p.y,
              scale: p.scale,
              rotate: p.rotate,
              opacity: 0,
            }}
            transition={{ duration: p.duration, ease: "easeOut" }}
          >
            🎄
          </motion.div>
        ))}
      </div>
    </div>
  );
}
