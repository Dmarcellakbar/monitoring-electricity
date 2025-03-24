/* eslint-disable */

'use client';
import { useState, useEffect } from "react";
import Gauge from "./components/gauge";
import Grafik from "./components/grafik";
import useSubscription from "./server/mqtt";
import AlertNotification from "./components/toast";
import { getHistoricalData, postValueSwitchPower } from "./server/switch.service";
import AlertDangerNotification from "./components/toast-danger";
import mqtt from "mqtt";

const MQTT_BROKER = "ws://165.154.208.223:8083/mqtt"; // Change to your MQTT broker's WebSocket URL
const MQTT_TOPIC1 = "esp32/relay1";
const MQTT_TOPIC2 = "esp32/relay2";

export default function Home() {
  const [dateTime, setDateTime] = useState("");
  const [theme, setTheme] = useState("light");

  const [labels, _s] = useState(["SAKLAR 1", "SAKLAR 2"]);
  const [alert, setAlert] = useState<any>(null);
  const [alertDanger, setAlertDanger] = useState<any>(null);

  const dataMqtt: any = useSubscription({ topic: "/realtime" });
  const [selectEdit, setSelectEdit] = useState({ index: 0, status: true })
  const [valStd, setValStd] = useState(null)
  const [selected, setSelected] = useState("hour");
  const options = ["hour", "daily", "weekly", "monthly"];
  const [relay1, setRelay1] = useState(false);
  const [relay2, setRelay2] = useState(false);

  const [isOn, setIsOn] = useState(false);
  const [isOn2, setIsOn2] = useState(false);

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



  const toggleRelay = (relay: number) => {
    const topic = relay === 1 ? MQTT_TOPIC1 : MQTT_TOPIC2;
    const newState = relay === 1 ? !relay1 : !relay2;
    client?.publish(topic, newState ? "ON" : "OFF");
    if (relay === 1) setRelay1(newState);
    else setRelay2(newState);
  };


  useEffect(() => {
    if (!!dataMqtt?.message?.md_electric) {
      setIsOn(dataMqtt?.message?.md_electric?.[0]?.cond_sensor);
      setIsOn2(dataMqtt?.message?.md_electric?.[1]?.cond_sensor);
    }
  }, []); // Fix dependency array


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

  const toggleTheme = () => setTheme(theme === "light" ? "dark" : "light");

 


  const handleEdit = (idx: number, status: boolean) => {
    setSelectEdit({ index: idx, status: status })
    const sts = dataMqtt?.message?.md_electric?.[idx]?.id

    if (status == true) {
      try {
        postValueSwitchPower("", valStd, sts)
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
    <>
      <header className="fixed top-0 w-full bg-white dark:bg-black p-4 border-b-2 border-black dark:border-white z-10">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">
            Dashboard Monitoring Energy
          </h1>
          <div className="text-gray-900 dark:text-white">{dateTime}</div>
          <button
            onClick={toggleTheme}
            className="px-4 py-2 text-white bg-gray-800 dark:bg-gray-300 dark:text-black rounded"
          >
            {theme === "light" ? "🌙" : "☀️"}
          </button>
        </div>
      </header>

      <main className="pt-20 px-4 bg-white dark:bg-black">
        {alert && <AlertNotification message={alert.message} type={alert.type} />}
        {alertDanger && <AlertDangerNotification message={alertDanger.message} type={alertDanger.type} />}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          {/* SENSOR GAUGES */}
          <div className="space-y-4">
            {["sensor_1", "sensor_2"].map((sensor, index) => (
              <div key={sensor} className="text-center grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                <div>
                  <h2 className="font-bold text-xl dark:text-white mt-4">SAKLAR {index + 1} (DAYA)</h2>
                  <Gauge value={dataMqtt?.message?.[sensor]?.power} max={700} metric={"W"} />
                </div>
                <div>
                  <h2 className="font-bold text-xl dark:text-white mt-4">SAKLAR {index + 1} (AMPERE)</h2>
                  <Gauge value={dataMqtt?.message?.[sensor]?.current} max={200} metric={"A"} />
                </div>
                <div>
                  <h2 className="font-bold text-xl dark:text-white mt-4">SAKLAR {index + 1} (VOLTAGE)</h2>
                  <Gauge value={dataMqtt?.message?.[sensor]?.voltage} max={500} metric={"V"} />
                </div>
              </div>
            ))}
          </div>

          {/* CONTROL PANEL */}
          <div className="max-h-fit mt-4 p-4 border-2 border-black dark:border-white rounded-2xl">
            <h2 className="font-bold text-xl dark:text-white text-center">CONTROL</h2>

            {labels.map((label, idx) => {
              const valSensor = dataMqtt?.message?.md_electric?.[idx]?.std_sensor ?? 0

              return (
                <div className="flex items-center justify-evenly mt-4" key={idx}>
                  <span className="font-bold text-lg dark:text-white">{label}</span>

                  <button
                    onClick={() => idx == 0 ? toggleRelay(1) : toggleRelay(2)}
                    className={`relative inline-flex items-center h-6 w-11 rounded-full transition-colors ${(idx == 0 ? relay1 : relay2) ? "bg-green-500" : "bg-gray-400"}`}
                  >
                    <span
                      className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${(idx == 0 ? relay1 : relay2) ? "translate-x-5" : "translate-x-1"}`}
                    ></span>
                  </button>

                  <span className="ml-2 text-lg dark:text-white">{(idx == 0 ? relay1 : relay2) ? "Aktif" : "Mati"}</span>

                  <div className="flex flex-col">
                    <label htmlFor="">Value Alarm : </label>
                    <input
                      defaultValue={valSensor}
                      disabled={selectEdit?.index == idx ? selectEdit?.status : true}
                      type="text"
                      className="border-b-2 p-1 dark:text-black w-20"
                      onChange={(e: any) => {
                        const newValue = e.target.value;
                        setValStd(newValue)
                      }}
                      style={{
                        background: selectEdit?.index == idx && selectEdit?.status == false ? 'white' : 'gray',
                        border: '1px solid black',
                        borderRadius: '1dvh'
                      }}
                    />
                  </div>
                  {selectEdit?.index == idx && selectEdit?.status == false ?
                    <button
                      className="bg-blue-400 px-3 py-1 rounded-lg text-white"
                      onClick={() => handleEdit(idx, true)}
                    >
                      Save
                    </button> :
                    <button
                      className="bg-yellow-500 px-3 py-1 rounded-lg text-white"
                      onClick={() => handleEdit(idx, false)}
                    >
                      Edit
                    </button>
                  }

                </div>
              )
            })}

            {/* HISTORICAL GRAPH */}
            <div className="mt-8">
              <h2 className="font-bold text-xl dark:text-white text-center">Historical</h2>
              <div className="flex gap-3">
                <div className="font-bold text-lg dark:text-white text-left">Filter :</div>
                <select
                  className="p-2 border rounded-lg focus:ring focus:ring-blue-300"
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
              <Grafik data={data}/>
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
          </div>
        </div>
      </main>
    </>
  );
}
