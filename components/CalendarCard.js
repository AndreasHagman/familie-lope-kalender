import { useState } from "react";
import { motion } from "framer-motion";

export default function CalendarCard({ date, km, isOpenable }) {
  const [opened, setOpened] = useState(false);
  const [particles, setParticles] = useState([]);

  const handleOpen = () => {
    if (isOpenable && !opened) {
      setOpened(true);

      const newParticles = Array.from({ length: 35 }).map(() => ({
        x: Math.random() * 300 - 150,
        y: Math.random() * -200 - 50,
        scale: Math.random() * 1.2 + 0.5,
        rotate: Math.random() * 360,
        duration: 1.5 + Math.random() * 1.0,
      }));
      setParticles(newParticles);
    }
  };

  const dateObj = new Date(date);
  const monthNames = [
    "januar","februar","mars","april","mai","juni",
    "juli","august","september","oktober","november","desember"
  ];
  const dayMonth = `${dateObj.getDate()}. ${monthNames[dateObj.getMonth()]}`;

  return (
    <div className="flex justify-center my-4 relative">
      {/* Luken */}
      <motion.div
        className="w-40 sm:w-48 h-40 sm:h-48 perspective cursor-pointer relative z-10"
        onClick={handleOpen}
        whileTap={{ scale: 0.95 }}
      >
        <motion.div
          className="relative w-full h-full"
          animate={{ rotateY: opened ? 180 : 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          style={{ transformStyle: "preserve-3d" }}
        >
          {/* Forsiden – kun dato */}
          <div
            className="absolute w-full h-full bg-red-600 rounded-lg shadow-lg flex items-center justify-center text-white text-xl sm:text-2xl font-bold"
            style={{ backfaceVisibility: "hidden" }}
          >
            {dayMonth}
          </div>

          {/* Baksiden – kun km */}
          <div
            className="absolute w-full h-full bg-white rounded-lg shadow-lg flex items-center justify-center p-2"
            style={{
              backfaceVisibility: "hidden",
              transform: "rotateY(180deg)",
            }}
          >
            <p className="text-4xl font-bold">{km} km</p>
          </div>
        </motion.div>
      </motion.div>

      {/* Pop/eksplosjon med juletrær – høy z-index */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-20">
        {particles.map((p, i) => (
          <motion.div
            key={i}
            className="absolute text-green-700 text-xl"
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
