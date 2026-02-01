import mqtt from "mqtt";

let client = null;
let statusCallback = null;
let ackCallback = null;

export function connectMQTT() {
  if (client) return client;

  const options = {
    clientId: "PIJON_WEB_" + Math.random().toString(16).slice(2),
    clean: true,
    connectTimeout: 4000,
    reconnectPeriod: 2000,
  };

  client = mqtt.connect("wss://broker.hivemq.com:8884/mqtt", options);

  client.on("connect", () => {
    console.log("MQTT connected");
  });

  client.on("error", (err) => {
    console.error("MQTT error", err);
  });

  client.on("message", (topic, message) => {
    if (topic === "pijon/status" && statusCallback) {
      statusCallback(message.toString());
    }
    if (topic === "pijon/ack" && ackCallback) {
      ackCallback(message.toString());
    }
  });

  return client;
}

export function publishFeed(payload = "FEED") {
  if (!client) return;
  client.publish("pijon/feed", payload);
}

export function onStatusUpdate(cb) {
  statusCallback = cb;
  if (client) {
    client.subscribe("pijon/status");
  }
}

export function onAck(cb) {
  ackCallback = cb;
  if (client) {
    client.subscribe("pijon/ack");
  }
}
