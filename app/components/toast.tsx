import { useState } from "react";

export default function AlertNotification({ message, type }: any) {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  return (
    <div
      className={`z-50 fixed bottom-4 left-1/2 transform -translate-x-1/2 p-4 rounded-lg shadow-lg text-white ${
        type === "success"
          ? "bg-green-500"
          : type === "error"
          ? "bg-red-500"
          : "bg-yellow-500"
      }`}
    >
      <div className="flex justify-between items-center">
        <span>{message}</span>
        <button
          onClick={() => setIsVisible(false)}
          className="ml-4 text-white font-bold"
        >
          &times;
        </button>
      </div>
    </div>
  );
}



