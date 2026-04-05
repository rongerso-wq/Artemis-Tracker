# Artemis II Mission Control Dashboard

A real-time mission tracking dashboard for NASA's Artemis II crewed lunar flyby mission, built with React.

## Features

- **Live telemetry** — pulls trajectory data from NASA JPL Horizons API, refreshes every 30 seconds
- **Simulation mode** — mock trajectory when live data is unavailable or pre-launch
- **Mission clock** — elapsed time since launch (MET)
- **Metric cards** — real-time velocity, distance from Earth, and distance to Moon
- **3D trajectory view** — interactive visual of the spacecraft's path between Earth and Moon
- **Mission milestones** — phase progress tracker (Ascent → TLI Burn → Trans-Lunar Coast → Lunar Approach → Re-entry → Splashdown)
- **State vectors** — raw position and velocity telemetry (X/Y/Z in geocentric J2000 frame)
- **Mission log** — timestamped event log tied to mission elapsed time
- **NASA TV card** — two live streams (NASA TV official coverage + Orion spacecraft cam), thumbnail poster with click-to-play, sourced from nasa.gov/live
- **Sound alerts** — audio cue on phase transitions (configurable)
- **Settings panel** — configure launch time, mock mode, and sound
- **Embed mode** — append `?embed=1` to the URL to show only the 3D trajectory (no header/cards), useful for iframes

## Tech Stack

- React (Create React App)
- Tailwind CSS
- NASA JPL Horizons API (ephemeris data)
- Deployed via GitHub Pages (`npm run deploy` → `gh-pages` branch)

## Getting Started

```bash
npm install
npm start
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Available Scripts

| Script | Description |
|---|---|
| `npm start` | Run in development mode |
| `npm test` | Run tests |
| `npm run build` | Build for production |
| `npm run deploy` | Build and publish to GitHub Pages |

## Live App

[https://rongerso-wq.github.io/Artemis-Tracker](https://rongerso-wq.github.io/Artemis-Tracker)

## Project Structure

```
src/
  components/
    MetricCard.jsx        # Velocity / distance display cards
    MissionClock.jsx      # Mission elapsed time counter
    MissionMilestone.jsx  # Phase progress tracker
    MissionLog.jsx        # Timestamped event log
    TrajectoryView3D.jsx  # 3D Earth–Moon trajectory visual
    NasaTVCard.jsx        # NASA TV + Orion cam live streams (click-to-play, youtube-nocookie embed)
    OrbitalDiagram.jsx    # Orbital diagram
    SettingsPanel.jsx     # Settings modal
  hooks/
    useArtemisData.js     # Main data hook (live + mock modes)
    useMilestoneAlerts.js # Sound alerts on phase change
    useMissionData.js     # Mission data utilities
    useEmbedMode.js       # Embed mode detection
  services/
    nasaApi.js            # JPL Horizons API client
    mockData.js           # Simulated trajectory data
```

## Data Source

Live data is fetched from the [JPL Horizons System](https://ssd.jpl.nasa.gov/horizons/), NASA's solar system ephemeris service. When live data is unavailable, the app falls back to a simulated mock trajectory.

## Layout (top to bottom)

1. **Header** — mission name, data source badge, phase badge, settings
2. **Mission Clock** — elapsed MET since launch
3. **Metric Cards** — velocity / distance from Earth / distance to Moon
4. **NASA TV** (left) + **Mission Milestone** (right) — visible on first load without scrolling
5. **State Vectors** — raw X/Y/Z position and velocity telemetry (when live data available)
6. **3D Trajectory** — interactive Earth–Moon path
7. **Mission Log** — timestamped event log

## Mission Phases

`ASCENT` → `PARKING_ORBIT` → `TLI_BURN` → `COAST_OUTBOUND` → `LUNAR_APPROACH` → `COAST_RETURN` → `REENTRY` → `SPLASHDOWN`

## NASA TV Streams

Video IDs sourced from [nasa.gov/live](https://www.nasa.gov/live/):

| Tab | Stream | Video ID |
|---|---|---|
| NASA TV | Official live mission coverage | `m3kR2KK8TEs` |
| Orion Cam | Live views from Orion spacecraft | `6RwfNBtepa4` |
