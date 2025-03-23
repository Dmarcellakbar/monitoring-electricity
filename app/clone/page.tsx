// /* eslint-disable */

// 'use client';
// import { useEffect, useState } from "react";
// import mqtt from "mqtt";
// import useSubscription from "../server/mqtt";
// import { getHistoricalData } from "../server/switch.service";
// import Grafik from "../components/grafik";

// const MQTT_BROKER = "ws://165.154.208.223:8083/mqtt"; // Change to your MQTT broker's WebSocket URL
// const MQTT_TOPIC1 = "esp32/relay1";
// const MQTT_TOPIC2 = "esp32/relay2";

// export default function Home() {
//   const [dateTime, setDateTime] = useState("");
//   const [theme, setTheme] = useState("light");

//   const [relay1, setRelay1] = useState(false);
//   const [relay2, setRelay2] = useState(false);
//   const dataMqtt: any = useSubscription({ topic: "/realtime" });
//   const toggleTheme = () => setTheme(theme === "light" ? "dark" : "light");

//   const [labels, _s] = useState([{
//     name: "SAKLAR 1",
//     code: "sensor_1",
//   },
//   {
//     name: "SAKLAR 2",
//     code: "sensor_2",
//   }]);

//   const client = mqtt.connect(MQTT_BROKER);

//   client.on("connect", () => {
//     console.log("Connected to MQTT broker");
//   });

//   const [selected, setSelected] = useState("daily");
//   const options = ["daily", "weekly", "monthly"];
//   const [data, setData] = useState<any>(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);


//   const toggleRelay = (relay: number) => {
//     const topic = relay === 1 ? MQTT_TOPIC1 : MQTT_TOPIC2;
//     const newState = relay === 1 ? !relay1 : !relay2;
//     client.publish(topic, newState ? "ON" : "OFF");
//     if (relay === 1) setRelay1(newState);
//     else setRelay2(newState);
//   };


//   useEffect(() => {
//     const updateDateTime = () => {
//       const now = new Date();
//       const options: any = { weekday: "short", day: "2-digit", month: "short", year: "numeric" };
//       const date = now.toLocaleDateString("en-US", options);
//       const time = now.toLocaleTimeString("en-US", { hour12: false });
//       setDateTime(`${date} - ${time}`);
//     };
//     updateDateTime();
//     const intervalId = setInterval(updateDateTime, 1000);
//     return () => clearInterval(intervalId);
//   }, []);

//   useEffect(() => {
//     document.body.className = theme === "dark" ? "dark" : "light";
//   }, [theme]);

//   useEffect(() => {
//     const fetchData = async () => {
//       try {
//         const result = await getHistoricalData(selected);
//         setData(result);
//       } catch (err) {
//         setError("Failed to fetch data");
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchData();
//   }, [selected]);

//   return (
//     <div className="flex flex-col items-center justify-center min-h-screen bg-white dark:bg-gray-700 p-4">
//       <header className="fixed top-0 w-full bg-white dark:bg-gray-700 p-4 border-b-2 border-black dark:border-white z-10">
//         <div className="flex flex-col lg:flex-row items-center justify-between gap-3">
//           <h1 className="text-xl font-bold text-gray-900 dark:text-white">
//             Dashboard Monitoring Energy
//           </h1>
//           <div className="flex justify-between gap-3 align-middle">
//             <div className="text-gray-900 dark:text-white">{dateTime}</div>
//             <button
//               onClick={toggleTheme}
//               className="px-1 py-0 text-white bg-gray-800 dark:bg-gray-300 dark:text-black rounded"
//             >
//               {theme === "light" ? "🌙" : "☀️"}
//             </button>
//           </div>
//         </div>
//       </header>

//       <div className="w-full mt-20">
//         {labels?.map(l => {
//           return (
//             <div key={l?.code} className="mt-3 bg-gray-100 dark:bg-gray-600 w-full p-4 rounded-lg">
//               <h2 className="font-bold text-xl text-green-500">{l?.name}</h2>
//               <div className="flex gap-2 justify-between">
//                 <div className="bg-gray-300 dark:bg-gray-500 dark:text-white p-3 rounded-lg" style={{ width: '100%', height: '10dvh' }}>
//                   <div className="font-bold text-md">Power</div>
//                   <div className="text-lg">{dataMqtt?.message?.[l?.code]?.power ?? 0} W</div>
//                 </div>
//                 <div className="bg-gray-300 dark:bg-gray-500 dark:text-white  p-3 rounded-lg" style={{ width: '100%', height: '10dvh' }}>
//                   <div className="font-bold text-md">Voltage</div>
//                   <div className="text-lg">{dataMqtt?.message?.[l?.code]?.voltage ?? 0} V</div>
//                 </div>
//                 <div className="bg-gray-300 dark:bg-gray-500 dark:text-white p-3 rounded-lg" style={{ width: '100%', height: '10dvh' }}>
//                   <div className="font-bold text-md">Current</div>
//                   <div className="text-lg">{dataMqtt?.message?.[l?.code]?.current ?? 0} A</div>
//                 </div>
//               </div>
//             </div>
//           )
//         })}
//       </div>

//       <div className="mt-4 bg-gray-100 dark:bg-gray-600 w-full p-8 rounded-lg">
//         <div className="flex items-center justify-between w-full max-w-sm bg-gray-200 dark:bg-gray-500 shadow-lg rounded-lg p-6">
//           <p className="text-xl font-bold text-green-500">Saklar 1: {relay1 ? "Aktif" : "Mati"}</p>
//           <button
//             onClick={() => toggleRelay(1)}
//             className={`relative inline-flex items-center h-6 w-11 rounded-full transition-colors ${relay1 ? "bg-green-500" : "bg-gray-400"}`}
//           >
//             <span
//               className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${relay1 ? "translate-x-5" : "translate-x-1"}`}
//             ></span>
//           </button>
//         </div>

//         <div className="flex mt-4 items-center justify-between w-full max-w-sm bg-gray-200 dark:bg-gray-500 shadow-lg rounded-lg p-6">
//           <p className="text-xl font-bold text-green-500">Saklar 2: {relay2 ? "Aktif" : "Mati"}</p>
//           <button
//             onClick={() => toggleRelay(2)}
//             className={`relative inline-flex items-center h-6 w-11 rounded-full transition-colors ${relay2 ? "bg-green-500" : "bg-gray-400"}`}
//           >
//             <span
//               className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${relay2 ? "translate-x-5" : "translate-x-1"}`}
//             ></span>
//           </button>
//         </div>
//       </div>
//       {/* HISTORICAL GRAPH */}
//       <div className="mt-8 w-full bg-gray-100 dark:bg-gray-600 p-2 rounded-lg">
//         <h2 className="font-bold text-xl dark:text-white text-center">Historical</h2>
//         <div className="flex gap-3 mt-2">
//           <div className="font-bold text-lg dark:text-white text-left">Filter :</div>
//           <select
//             className="p-2 border rounded-lg focus:ring focus:ring-blue-300 bg-gray-100 text-black dark:bg-gray-600 dark:text-white"
//             value={selected}
//             onChange={(e) => setSelected(e.target.value)}
//           >
//             {options.map((option, index) => (
//               <option key={index} value={option}>
//                 {option}
//               </option>
//             ))}
//           </select>
//         </div>
//         <Grafik data={data} />
//       </div>
//       <div className="mt-4 text-black dark:text-white">
//         Powered by HARD IoT
//       </div>
//     </div>
//   );
// }