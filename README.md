# Pijon — IoT Pet Feeder

Pijon is a connected, 3D-printed pet feeder. This repo contains:

- A **Next.js control panel** that talks to the device over MQTT.
- **ESP32 firmware documentation** for the feeder logic + servo control.
- **3D models** (`.blend` + `.stl`) for printing the feeder body and mechanism.

> The web UI publishes feed commands and listens for acknowledgements/heartbeats.

---

## Quick Tour

| Area | Description |
| --- | --- |
| `app/page.tsx` | Web UI: feed controls, status pill, local schedules |
| `lib/mqttClient.js` | MQTT client helper (connect, publish, subscribe) |
| `../esp32-pijon.md` | Firmware reference for the ESP32 feeder logic |
| `3d Models/` | Blender + STL parts for the physical build |

---

## Features

- **Feed presets**: SMALL / MEDIUM / LARGE
- **MQTT live status**: ONLINE / OFFLINE with heartbeats
- **ACK handling**: FEED button unlocks only on device confirmation
- **Local scheduling**: browser-based timers (no cloud required)
- **Manual hardware feed button** on GPIO23 (debounced)

---

## Web App Setup

### 1) Install dependencies

```bash
npm install
```

### 2) Start development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## MQTT Details

The UI connects via WebSocket to a public broker by default:

```
wss://broker.hivemq.com:8884/mqtt
```

**Topics**

- `pijon/feed` — Publish commands
- `pijon/status` — Device heartbeats
- `pijon/ack` — Device acknowledgements

**Payloads**

- `FEED:SMALL`
- `FEED:MEDIUM`
- `FEED:LARGE`

**ACK Messages**

- `FED` — Successful feed
- `ERROR:TIMEOUT` — Servo timeout

---

## ESP32 Firmware

The firmware is documented in **`../esp32-pijon.md`** and covers:

- WiFi + MQTT connection
- Servo control (continuous rotation)
- Preset feed sizes
- GPIO23 manual feed button with debounce
- ACK publishing to `pijon/ack`

Use it as a reference for flashing your ESP32 in Arduino IDE or PlatformIO.

---

## 3D Models

All 3D assets live in **`3d Models/`**. Each part is available as:

- `.blend` (editable in Blender)
- `.stl` (ready to print)

Key parts:

- `base_compartment` — main chassis
- `FoodContainer` — hopper
- `MechanismCompartment` — gear + motor cavity
- `BigGear` / `SmallGear` / `SnailDrill`
- `top_lid`, `top_lid_2`, `BackLid`
- `RoundBowl` / `SquareBowl`

---

## Running a Feed Test

1. Power the ESP32 and connect it to WiFi.
2. Open the web UI.
3. Confirm the status shows **Online**.
4. Select a portion and press **Feed Now**.
5. Wait for `FED` acknowledgement.

---

## Troubleshooting

- **Offline status**: ensure ESP32 is powered and connected to WiFi.
- **No ACK**: verify device subscribes to `pijon/feed` and publishes to `pijon/ack`.
- **Wrong direction**: adjust servo microseconds in firmware.

---

## Repo Structure

```
Pijon/
├── esp32-pijon.md
└── pijon-web/
    ├── 3d Models/
    ├── app/
    ├── lib/
    └── README.md
```

---

## Credits

Built with Next.js, MQTT, and a lot of filament.
