'use client';
import { useState, useEffect } from "react";
import AlertNotification from "../components/toast";
import useSubscription from "../server/mqtt";
import Grafik from "../components/grafik";
import { postSwitchPower, postValueSwitchPower } from "../server/switch.service";

export default function Home() {
  const [dateTime, setDateTime] = useState("");
  const [theme, setTheme] = useState("light");
  const [isOn, setIsOn] = useState(false);
  const [isOn2, setIsOn2] = useState(false);
  const [alert, setAlert] = useState<any>(null);
  const dataMqtt: any = useSubscription({ topic: "/realtime" });
  const [selectEdit, setSelectEdit] = useState({ index: 0, status: true })
  const [valStd, setValStd] = useState(null)
  const [selected, setSelected] = useState("Daily");
  const options = ["Daily", "Weekly", "Monthly", "Yearly"];
  const [labels, _s] = useState(["SAKLAR 1", "SAKLAR 2"]);


  console.log('dataMqtt',dataMqtt)

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

  const renderProgressBar = (label: string, value: number, max: number, color: string) => {
    const percentage = (value / max) * 100;
    return (
      <div className="flex flex-col items-center w-16" key={label}>
        <div className="text-md font-bold text-center dark:text-white mb-2">{label}</div>
        <div className="w-6 h-24 bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden flex flex-col-reverse">
          <div className={`bg-${color}-500 w-full`} style={{ height: `${percentage}%` }}></div>
        </div>
        <div className="text-lg dark:text-white mt-2">{value}</div>
      </div>
    );
  };


    const toggleSwitch = () => {
      const sts = dataMqtt?.message?.md_electric?.[0]?.id
      setIsOn(!isOn);
      try {
        postSwitchPower("sensor_1", !isOn, sts);
      } catch (error) {
        console.log(error)
      } finally {
        setAlert({ message: `Saklar 1 aktif`, type: "success" });
        setTimeout(() => setAlert(null), 3000);
      }
    };
  
    const toggleSwitch2 = () => {
      const sts = dataMqtt?.message?.md_electric?.[1]?.id
      setIsOn2(!isOn2);
      try {
        postSwitchPower("sensor_2", !isOn2, sts);
      } catch (error) {
        console.log(error)
      } finally {
        setAlert({ message: `Saklar 2 aktif`, type: "success" });
        setTimeout(() => setAlert(null), 3000);
      }
    };
  
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
  
    const triggerAlert = () => {
      setAlert({ message: "This is a success message!", type: "success" });
      setTimeout(() => setAlert(null), 3000);
    };
  

  return (
    <>
      <header className="fixed top-0 w-full bg-white dark:bg-black p-4 border-b-2 border-black dark:border-white z-10">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">
            Dashboard Monitoring Energy
          </h1>
          <div className="text-gray-900 dark:text-white text-xl font-semibold">{dateTime}</div>
          <button
            onClick={toggleTheme}
            className="px-4 py-2 text-white bg-gray-800 dark:bg-gray-300 dark:text-black rounded"
          >
            {theme === "light" ? "🌙" : "☀️"}
          </button>
        </div>
      </header>

      <main className="pt-20 px-4 bg-white dark:bg-black" style={{ height: "110dvh" }}>
        {alert && <AlertNotification message={alert.message} type={alert.type} />}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          {["sensor_1", "sensor_2"].map((sensor) => (
            <div key={sensor} className="text-center">
              <h2 className="font-bold text-xl dark:text-white mt-4">{sensor.toUpperCase()}</h2>
              <div className="flex justify-center gap-4">
                {[
                  { label: "Power", key: "power", max: 2000, color: "yellow" },
                  { label: "Voltage", key: "voltage", max: 240, color: "red" },
                  { label: "Current", key: "current", max: 50, color: "green" },
                  { label: "PF", key: "power_factor", max: 1, color: "blue" },
                  { label: "Energy", key: "energy", max: 5000, color: "green" },
                  { label: "Frequency", key: "frequency", max: 100, color: "red" },
                ].map((param) => (
                  renderProgressBar(
                    param.label,
                    dataMqtt?.message?.[sensor]?.[param.key] ?? 0,
                    param.max,
                    param.color
                  )
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* CONTROL PANEL */}
                  <div className="max-h-fit mt-4 p-4 border-2 border-black dark:border-white rounded-2xl">
                    <h2 className="font-bold text-xl dark:text-white text-center">CONTROL</h2>
        
                    {labels.map((label, idx) => {
                      const valSensor = dataMqtt?.message?.md_electric[idx]?.std_sensor ?? 0
        
                      return (
                        <div className="flex items-center justify-evenly mt-4" key={idx}>
                          <span className="font-bold text-lg dark:text-white">{label}</span>
        
                          <button
                            onClick={idx === 0 ? toggleSwitch : toggleSwitch2}
                            className={`relative inline-flex items-center h-6 w-11 rounded-full transition-colors ${(idx === 0 ? isOn : isOn2) ? "bg-green-500" : "bg-gray-300"
                              }`}
                          >
                            <span
                              className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${(idx === 0 ? isOn : isOn2) ? "translate-x-5" : "translate-x-1"
                                }`}
                            ></span>
                          </button>
        
                          <span className="ml-2 text-lg dark:text-white">{(idx === 0 ? isOn : isOn2) ? "ON" : "OFF"}</span>
        
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
                          onChange={(e) => setSelected(e.target.value)}
                        >
                          {options.map((option, index) => (
                            <option key={index} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                      </div>
                      <Grafik />
                    </div>
                  </div>
      </main>
    </>
  );
}