import { useState, useEffect } from "react";
import { motion } from "framer-motion";

export default function CalendarCard({ date, km, isOpenable, small, forceOpen, showNumericDate, showDateOnBack }) {
  const [opened, setOpened] = useState(false);
  const [particles, setParticles] = useState([]);

  // Hvis forceOpen endres (f.eks dagens luke), snu luken
  useEffect(() => {
    if (forceOpen) setOpened(true);
  }, [forceOpen]);

  const handleOpen = () => {
    // Kun trigger partikler og snu på første klikk hvis luken ikke allerede er snudd
    if (!opened && isOpenable) {
      setOpened(true);
      const newParticles = Array.from({ length: 25 }).map(() => ({
        x: Math.random() * 100 - 50,
        y: Math.random() * -100 - 20,
        scale: Math.random() * (small ? 0.6 : 1.2) + 0.3,
        rotate: Math.random() * 360,
        duration: 1 + Math.random() * 0.8,
      }));
      setParticles(newParticles);
    }
  };

  const dateObj = new Date(date);
  const day = dateObj.getDate().toString().padStart(2, "0");
  const month = (dateObj.getMonth() + 1).toString().padStart(2, "0");
  const monthNames = [
    "januar","februar","mars","april","mai","juni",
    "juli","august","september","oktober","november","desember"
  ];
  const dayMonth = showNumericDate ? `${day}.${month}` : `${dateObj.getDate()}. ${monthNames[dateObj.getMonth()]}`;

  return (
    <div className={`flex justify-center ${small ? "my-1" : "my-4"} relative`}>
      <motion.div
        className={`${
          small
            ? "w-16 h-16 text-xs"
            : "w-40 sm:w-48 h-40 sm:h-48 text-xl"
        } perspective cursor-pointer relative z-10`}
        onClick={handleOpen}
        whileTap={{ scale: 0.95 }}
      >
        <motion.div
          className="relative w-full h-full"
          animate={{ rotateY: opened ? 180 : 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          style={{ transformStyle: "preserve-3d" }}
        >
          {/* FORSIDE */}
          <div
            className={`absolute w-full h-full bg-red-600 rounded-lg shadow-lg flex items-center justify-center text-white font-bold ${
              small ? "text-[0.65rem] px-1" : "text-xl sm:text-2xl"
            }`}
            style={{ backfaceVisibility: "hidden" }}
          >
            {dayMonth}
          </div>

          {/* BAKSIDE */}
          <div
            className="absolute w-full h-full bg-white rounded-lg shadow-lg flex items-center justify-center"
            style={{
              backfaceVisibility: "hidden",
              transform: "rotateY(180deg)",
            }}
          >
            {showDateOnBack && (
              <p
                className={`absolute top-2 left-1/2 transform -translate-x-1/2 text-gray-500 ${
                  small ? "text-[0.5rem]" : "text-[0.6rem]"
                }`}
              >
                {dayMonth}
              </p>
            )}
            <p className={`font-bold ${small ? "text-base" : "text-4xl"}`}>
              {km} km
            </p>
          </div>
        </motion.div>
      </motion.div>

      {/* PARTIKLER */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-20">
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
