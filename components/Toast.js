import { useEffect } from "react";

export default function Toast({ message, onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 2500); // auto-hide
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="
      fixed bottom-6 left-1/2 transform -translate-x-1/2 
      bg-gray-900 text-white px-4 py-2 rounded-lg shadow-lg
      z-50 text-sm animate-fade-in
    ">
      {message}
    </div>
  );
}