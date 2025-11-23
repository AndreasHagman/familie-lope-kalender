import { useState, useEffect } from "react";
import { motion } from "framer-motion";

export default function CalendarCard({
  date,
  km,
  isOpenable,
  small,
  isOpen,
  openTrigger,
  showNumericDate,
  showDateOnBack
}) {
  const [opened, setOpened] = useState(false);
  const [particles, setParticles] = useState([]);

  // Styr selve flippen fra Dashboard
  useEffect(() => {
    setOpened(isOpen);
  }, [isOpen]);

  // Kjør partikkel-animasjon bare når openTrigger endres
  useEffect(() => {
    if (openTrigger > 0) {
      const newParticles = Array.from({ length: 25 }).map(() => ({
        x: Math.random() * 100 - 50,
        y: Math.random() * -100 - 20,
        scale: Math.random() * (small ? 0.6 : 1.2) + 0.3,
        rotate: Math.random() * 360,
        duration: 1 + Math.random() * 0.8,
      }));
      setParticles(newParticles);
    }
  }, [openTrigger]);

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
        className={`${small ? "w-16 h-16" : "w-40 sm:w-48 h-40 sm:h-48"} perspective cursor-pointer relative z-10`}
        whileTap={{ scale: 0.95 }}
      >
        <motion.div
          className="relative w-full h-full"
          animate={{ rotateY: opened ? 180 : 0 }}
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
              <p className="absolute top-2 left-1/2 -translate-x-1/2 text-gray-500 text-sm">
                {dayMonth}
              </p>
            )}
            <p className="font-bold text-4xl">
              {km} km
            </p>
          </div>
        </motion.div>
      </motion.div>

      {/* Partikler */}
      <div 
      key={openTrigger}
      className="absolute top-0 left-0 w-full h-full pointer-events-none z-20">
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
