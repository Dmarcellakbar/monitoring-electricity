/* eslint-disable */

'use client';
import { useEffect, useState } from "react";
import mqtt from "mqtt";
import useSubscription from "../server/mqtt";
import { getHistoricalData, postValueSwitchPower } from "../server/switch.service";
import Grafik from "../components/grafik";
import AlertNotification from "../components/toast";
import AlertDangerNotification from "../components/toast-danger";

const MQTT_BROKER = "wss://mqtt.hardiot.my.id/mqtt"; // Change to your MQTT broker's WebSocket URL
const MQTT_TOPIC1 = "esp32/relay1";
const MQTT_TOPIC2 = "esp32/relay2";

export default function Home() {
  const [dateTime, setDateTime] = useState("");
  const [theme, setTheme] = useState("light");
  const [alertDanger, setAlertDanger] = useState<any>(null);
  const [alert, setAlert] = useState<any>(null);

  const [relay1, setRelay1] = useState(false);
  const [relay2, setRelay2] = useState(false);
  const dataMqtt: any = useSubscription({ topic: "/realtime" });
  const toggleTheme = () => setTheme(theme === "light" ? "dark" : "light");

  const [selectEdit, setSelectEdit] = useState({ index: 0, status: true })
  const [valStd, setValStd] = useState(null)


  const [labels, _s] = useState([{
    name: "SAKLAR 1",
    code: "sensor_1",
  },
  {
    name: "SAKLAR 2",
    code: "sensor_2",
  }]);

  const [client, setClient] = useState<mqtt.MqttClient | null>(null);

  useEffect(() => {
    const mqttClient = mqtt.connect(MQTT_BROKER, {
      reconnectPeriod: 5000, // Coba reconnect setiap 5 detik
      keepalive: 60, // Kirim sinyal tiap 60 detik agar koneksi tetap hidup
      will: {
        topic: "esp32/status",
        payload: "offline",
        qos: 1,
        retain: true,
      },
    });

    mqttClient.on("connect", () => {
      console.log("Connected to MQTT broker");
    });

    mqttClient.on("error", (err) => {
      console.error("MQTT Error:", err);
      mqttClient.end();
    });

    mqttClient.on("offline", () => {
      console.warn("MQTT Broker offline, mencoba reconnect...");
      setTimeout(() => mqttClient.reconnect(), 5000);
    });

    setClient(mqttClient);

    return () => {
      mqttClient.end(); // Bersihkan koneksi saat komponen di-unmount
    };
  }, []);


  const [selected, setSelected] = useState("hour");
  const options = ["hour", "daily", "weekly", "monthly"];
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);


  const ITEMS_PER_PAGE = 10;

  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.ceil(data?.xAxis?.length / ITEMS_PER_PAGE);

  const currentData = data?.xAxis?.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  ).map((_: any, index: number) => ({
    xAxis: data?.xAxis[(currentPage - 1) * ITEMS_PER_PAGE + index],
    power_1: data?.power_1[(currentPage - 1) * ITEMS_PER_PAGE + index],
    power_2: data?.power_2[(currentPage - 1) * ITEMS_PER_PAGE + index],
  })) ?? []

  const toggleRelay = (relay: number) => {
    const topic = relay === 1 ? MQTT_TOPIC1 : MQTT_TOPIC2;
    const newState = relay === 1 ? !relay1 : !relay2;
    client?.publish(topic, newState ? "ON" : "OFF");
    if (relay === 1) setRelay1(newState);
    else setRelay2(newState);
  };


  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      const options: any = { weekday: "short", day: "2-digit", month: "short", year: "numeric" };
      const date = now.toLocaleDateString("en-US", options);
      const time = now.toLocaleTimeString("en-US", { hour12: false });
      setDateTime(`${date} - ${time}`);
    };
    updateDateTime();
    const intervalId = setInterval(updateDateTime, 1000);
    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    document.body.className = theme === "dark" ? "dark" : "light";
  }, [theme]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const result = await getHistoricalData(selected);
        setData(result);
      } catch (err) {
        setError("Failed to fetch data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selected]);

  const handleEdit = (idx: number, status: boolean) => {
    setSelectEdit({ index: idx, status: status })
    const sts = dataMqtt?.message?.md_electric?.[idx]?.id

    if (status == true) {
      try {
        postValueSwitchPower("", !!valStd ? valStd : dataMqtt?.message?.md_electric?.[idx]?.std_sensor, sts)
      } catch (error) {
        console.log(error)
      } finally {
        setValStd(null)
        setAlert({ message: `Value alarm saved`, type: "success" });
        setTimeout(() => setAlert(null), 3000);
      }
    }
  };

  useEffect(() => {
    if (dataMqtt?.message?.alert_notif) {
      triggerAlert();
    }
  }, [dataMqtt?.message?.alert_notif]); // Use specific value to reduce re-renders

  const triggerAlert = () => {
    setAlertDanger({ message: "WARNING DAYA MELEBIHI BATAS, MOHON MATIKAN SAKLAR", type: "error" });
    setTimeout(() => setAlertDanger(null), 10000); // Uncomment if you want auto-dismiss
  };


  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white dark:bg-gray-700 p-4">
      <header className="fixed top-0 w-full bg-white dark:bg-gray-700 p-4 border-b-2 border-black dark:border-white z-10">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-3">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">
            Dashboard Monitoring Energy
          </h1>
          <div className="flex justify-between gap-3 align-middle">
            <div className="text-gray-900 dark:text-white">{dateTime}</div>
            <button
              onClick={toggleTheme}
              className="px-1 py-0 text-white bg-gray-800 dark:bg-gray-300 dark:text-black rounded"
            >
              {theme === "light" ? "🌙" : "☀️"}
            </button>
          </div>
        </div>
      </header>

      {alert && <AlertNotification message={alert.message} type={alert.type} />}
      {alertDanger && <AlertDangerNotification message={alertDanger.message} type={alertDanger.type} />}


      <div className="w-full mt-20">
        {labels?.map(l => {
          return (
            <div key={l?.code} className="mt-3 bg-gray-100 dark:bg-gray-600 w-full p-4 rounded-lg">
              <h2 className="font-bold text-xl text-green-500">{l?.name}</h2>
              <div className="flex gap-2 justify-between">
                <div className="bg-gray-300 dark:bg-gray-500 dark:text-white p-3 rounded-lg" style={{ width: '100%', height: '10dvh' }}>
                  <div className="font-bold text-md">Power</div>
                  <div className="text-lg">{dataMqtt?.message?.[l?.code]?.power ?? 0} W</div>
                </div>
                <div className="bg-gray-300 dark:bg-gray-500 dark:text-white  p-3 rounded-lg" style={{ width: '100%', height: '10dvh' }}>
                  <div className="font-bold text-md">Voltage</div>
                  <div className="text-lg">{dataMqtt?.message?.[l?.code]?.voltage ?? 0} V</div>
                </div>
                <div className="bg-gray-300 dark:bg-gray-500 dark:text-white p-3 rounded-lg" style={{ width: '100%', height: '10dvh' }}>
                  <div className="font-bold text-md">Current</div>
                  <div className="text-lg">{dataMqtt?.message?.[l?.code]?.current ?? 0} A</div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="mt-4 bg-gray-100 dark:bg-gray-600 w-full p-3 rounded-lg">
        <div className="flex align-middle items-center justify-between w-full max-w-sm bg-gray-200 dark:bg-gray-500 shadow-lg rounded-lg p-6 gap-3">
          <div>
            <p className="text-lg font-bold text-green-500">Saklar 1: {relay1 ? "Aktif" : "Mati"}</p>
            <button
              onClick={() => toggleRelay(1)}
              className={`relative inline-flex items-center h-6 w-11 rounded-full transition-colors ${relay1 ? "bg-green-500" : "bg-gray-400"}`}
            >
              <span
                className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${relay1 ? "translate-x-5" : "translate-x-1"}`}
              ></span>
            </button>
          </div>
          <div className="flex flex-col">
            <label htmlFor="">Alarm: </label>
            <input
              defaultValue={dataMqtt?.message?.md_electric?.[0]?.std_sensor}
              disabled={selectEdit?.index == 0 ? selectEdit?.status : true}
              type="text"
              className="border-b-2 p-1 dark:text-black w-20"
              onChange={(e: any) => {
                const newValue = e.target.value;
                setValStd(newValue)
              }}
              style={{
                background: selectEdit?.index == 0 && selectEdit?.status == false ? 'white' : 'gray',
                border: '1px solid black',
                borderRadius: '1dvh'
              }}
            />
          </div>
          {selectEdit?.index == 0 && selectEdit?.status == false ?
            <button
              className="bg-blue-400 px-3 py-1 rounded-lg text-white"
              onClick={() => handleEdit(0, true)}
            >
              Save
            </button> :
            <button
              className="bg-yellow-500 px-3 py-1 rounded-lg text-white"
              onClick={() => handleEdit(0, false)}
            >
              Edit
            </button>
          }
        </div>

        <div className="flex mt-4 items-center justify-between w-full max-w-sm bg-gray-200 dark:bg-gray-500 shadow-lg rounded-lg p-6 gap-3">
         <div>
         <p className="text-lg font-bold text-green-500">Saklar 2: {relay2 ? "Aktif" : "Mati"}</p>
          <button
            onClick={() => toggleRelay(2)}
            className={`relative inline-flex items-center h-6 w-11 rounded-full transition-colors ${relay2 ? "bg-green-500" : "bg-gray-400"}`}
          >
            <span
              className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${relay2 ? "translate-x-5" : "translate-x-1"}`}
            ></span>
          </button>
         </div>

          <div className="flex flex-col">
            <label htmlFor="">Alarm: </label>
            <input
              defaultValue={dataMqtt?.message?.md_electric?.[1]?.std_sensor}
              disabled={selectEdit?.index == 1 ? selectEdit?.status : true}
              type="text"
              className="border-b-2 p-1 dark:text-black w-20"
              onChange={(e: any) => {
                const newValue = e.target.value;
                setValStd(newValue)
              }}
              style={{
                background: selectEdit?.index == 1 && selectEdit?.status == false ? 'white' : 'gray',
                border: '1px solid black',
                borderRadius: '1dvh'
              }}
            />
          </div>
          {selectEdit?.index == 1 && selectEdit?.status == false ?
            <button
              className="bg-blue-400 px-3 py-1 rounded-lg text-white"
              onClick={() => handleEdit(1, true)}
            >
              Save
            </button> :
            <button
              className="bg-yellow-500 px-3 py-1 rounded-lg text-white"
              onClick={() => handleEdit(1, false)}
            >
              Edit
            </button>
          }
        </div>
      </div>
      {/* HISTORICAL GRAPH */}
      <div className="mt-8 w-full bg-gray-100 dark:bg-gray-600 p-2 rounded-lg">
        <h2 className="font-bold text-xl dark:text-white text-center">Historical</h2>
        <div className="flex gap-3 mt-2">
          <div className="font-bold text-lg dark:text-white text-left">Filter :</div>
          <select
            className="p-2 border rounded-lg focus:ring focus:ring-blue-300 bg-gray-100 text-black dark:bg-gray-600 dark:text-white"
            value={selected}
            onChange={(e) => {
              setSelected(e.target.value)
              setCurrentPage(1)
            }}
          >
            {options.map((option, index) => (
              <option key={index} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
        <Grafik data={data} />
        <div>
          <div className="p-4 w-full max-w-3xl mx-auto">
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-200">
                  <th className="border border-gray-300 p-2">X Axis</th>
                  <th className="border border-gray-300 p-2">Power 1</th>
                  <th className="border border-gray-300 p-2">Power 2</th>
                </tr>
              </thead>
              <tbody>
                {currentData.map((row: any, index: number) => (
                  <tr key={index} className="odd:bg-white even:bg-gray-100">
                    <td className="border border-gray-300 p-2 text-center">{row?.xAxis}</td>
                    <td className="border border-gray-300 p-2 text-center">{row?.power_1}</td>
                    <td className="border border-gray-300 p-2 text-center">{row?.power_2}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="flex justify-between items-center mt-4">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 bg-blue-500 text-white rounded disabled:bg-gray-300"
              >
                Previous
              </button>
              <span>Page {currentPage} of {totalPages}</span>
              <button
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 bg-blue-500 text-white rounded disabled:bg-gray-300"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="mt-4 text-black dark:text-white">
        Powered by HARD IoT
      </div>
    </div>
  );
}