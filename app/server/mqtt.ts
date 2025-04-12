import { useEffect, useState } from "react";
import mqtt from "mqtt";

export default function useSubscription({ topic }: { topic: string }) {
  const [message, setMessage] = useState<string | null>(null);
  const [client, setClient] = useState<mqtt.MqttClient | null>(null);
  const brokerUrl = "wss://mqtt.hardiot.my.id/mqtt"; // Gunakan ws jika tidak menggunakan SSL

  useEffect(() => {
    const mqttClient = mqtt.connect(brokerUrl);

    mqttClient.on("connect", () => {
      console.log("Connected to MQTT broker");
      mqttClient.subscribe(topic, (err) => {
        if (!err) {
          console.log(`Subscribed to ${topic}`);
        } else {
          console.error("Subscription error:", err);
        }
      });
    });

    mqttClient.on("error", (error) => {
      console.error("MQTT Connection Error:", error);
    });

    mqttClient.on("message", (receivedTopic, message) => {
      if (receivedTopic === topic) {
        const msgData = JSON.parse(message.toString())
        setMessage(msgData); // Menyimpan hanya satu pesan terbaru
      }
    });

    mqttClient.on("close", () => {
      console.warn("MQTT connection closed");
    });

    setClient(mqttClient);

    return () => {
      mqttClient.end();
    };
  }, [topic]);

  return {
    client,
    message, // Mengembalikan hanya satu pesan terbaru
  };
}
