'use client';
import { useState, useEffect } from "react";
import Gauge from "./components/gauge";
import Grafik from "./components/grafik";
import useSubscription from "./server/mqtt";
import AlertNotification from "./components/toast";
import { postSwitchPower, postValueSwitchPower } from "./server/switch.service";
import AlertDangerNotification from "./components/toast-danger";

export default function Home() {
  const [dateTime, setDateTime] = useState("");
  const [theme, setTheme] = useState("light");
  const [isOn, setIsOn] = useState(false);
  const [isOn2, setIsOn2] = useState(false);
  const [labels, _s] = useState(["SAKLAR 1", "SAKLAR 2"]);
  const [alert, setAlert] = useState<any>(null);
  const [alertDanger, setAlertDanger] = useState<any>(null);

  const dataMqtt: any = useSubscription({ topic: "/realtime" });
  const [selectEdit, setSelectEdit] = useState({ index: 0, status: true })
  const [valStd, setValStd] = useState(null)
  const [selected, setSelected] = useState("Daily");
  const options = ["Daily", "Weekly", "Monthly", "Yearly"];


  console.log('dataMqtt', dataMqtt?.message)

  // console.log('valStd', valStd)
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


  useEffect(() => {
    if (dataMqtt?.message?.alert_notif) {
      triggerAlert();
    }
  }, [dataMqtt?.message?.alert_notif]); // Use specific value to reduce re-renders

  const triggerAlert = () => {
    setAlertDanger({ message: "Power Maximum Value, Please Down Electricity", type: "error" });
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
          {/* <button onClick={triggerAlert} className="px-6 py-2 bg-blue-500 text-white rounded-lg">
            Show Alert
          </button> */}
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
                  <Gauge value={dataMqtt?.message?.[sensor]?.power} max={5000} metric={"W"} />
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
        </div>
      </main>
    </>
  );
}
