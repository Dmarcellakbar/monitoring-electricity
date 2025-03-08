/* eslint-disable */

'use client';
import { useState, useEffect } from "react";
import useSubscription from "../server/mqtt";
import { postSwitchPower, postValueSwitchPower } from "../server/switch.service";

const page = () => {
  const [dateTime, setDateTime] = useState("");
  const [theme, setTheme] = useState("light");
  const dataMqtt: any = useSubscription({ topic: "/realtime" });
  const [isOn, setIsOn] = useState(false);
  const [isOn2, setIsOn2] = useState(false);
  const [alert, setAlert] = useState<any>(null);
  const [selectEdit, setSelectEdit] = useState({ index: 0, status: true })
  const [valStd, setValStd] = useState(null)

  // console.log(',dataMqtt', dataMqtt)
  const [labels, _s] = useState([{
    name: "SAKLAR 1",
    code: "sensor_1",
  },
  {
    name: "SAKLAR 2",
    code: "sensor_2",
  }]);

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


    const handleEdit = (idx: number, status: boolean, valSensor: any) => {
      setSelectEdit({ index: idx, status: status })
      const sts = dataMqtt?.message?.md_electric?.[idx]?.id
  
      if (status == true) {
        try {
          postValueSwitchPower("", !!valStd ? valStd : valSensor, sts)
        } catch (error) {
          console.log(error)
        } finally {
          setValStd(null)
          setAlert({ message: `Value alarm saved`, type: "success" });
          setTimeout(() => setAlert(null), 3000);
        }
      }
    };
  

  return (
    <>
      <header className="fixed top-0 w-full bg-white dark:bg-slate-800 p-4 border-b-2 border-black dark:border-white z-10">
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
      <div>{'..'}</div>
      <main className="pt-20 px-4 bg-white dark:bg-slate-800" style={{ height: '110dvh' }}>
        {labels?.map(l => {
          return (
            <div key={l?.code} className="mt-3">
              <h2 className="font-bold text-xl dark:text-white">{l?.name}</h2>
              <div className="flex gap-2 justify-between">
                <div className="bg-cyan-300 p-3 rounded-lg" style={{ width: '100%', height: '10dvh' }}>
                  <div className="font-bold text-md">Power</div>
                  <div className="text-lg">{dataMqtt?.message?.[l?.code]?.power ?? 0} W</div>
                </div>
                <div className="bg-yellow-300  p-3 rounded-lg" style={{ width: '100%', height: '10dvh' }}>
                  <div className="font-bold text-md">Voltage</div>
                  <div className="text-lg">{dataMqtt?.message?.[l?.code]?.voltage ?? 0} V</div>
                </div>
                <div className="bg-green-300  p-3 rounded-lg" style={{ width: '100%', height: '10dvh' }}>
                  <div className="font-bold text-md">Current</div>
                  <div className="text-lg">{dataMqtt?.message?.[l?.code]?.current ?? 0} A</div>
                </div>
              </div>
            </div>
          )
        })}
        <div className="mt-3 border-slate-800 dark:border-white border-2 rounded-lg p-2">
          <h2 className="font-bold text-xl dark:text-white text-center">CONTROL</h2>
          {labels?.map((l, idx) => {
            const valSensor = dataMqtt?.message?.md_electric[idx]?.std_sensor ?? 0

            return (
              <div key={l?.code} className="mt-3">
                <span className="font-bold text-lg dark:text-white">{l?.name}</span>
                <div className="flex gap-3 align-middle items-center justify-between">
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
                <div className="flex flex-col">
                    <label htmlFor="" className="dark:text-white">Value Alarm : </label>
                    <input
                      defaultValue={valSensor}
                      disabled={selectEdit?.index == idx ? selectEdit?.status : true}
                      type="text"
                      className="border-b-2 p-1 dark:text-white w-20"
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
                      onClick={() => handleEdit(idx, true, valSensor)}
                    >
                      Save
                    </button> :
                    <button
                      className="bg-yellow-500 px-3 py-1 rounded-lg text-white"
                      onClick={() => handleEdit(idx, false, valSensor)}
                    >
                      Edit
                    </button>
                  }
                </div>

              </div>
            )
          })}
        </div>
      </main>
    </>
  )
}

export default page
