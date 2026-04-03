# Project: Artemis II Live Mission Tracker
A real-time 3D dashboard tracking the Artemis II mission (Launch: April 1, 2026).

## Tech Stack
- Frontend: React (Vite)
- 3D Engine: @react-three/fiber, @react-three/drei
- Styling: Tailwind CSS
- Data Source: NASA JPL Horizons / AROW API

## Mission Context (IMPORTANT)
- Current Phase: Trans-Lunar Coast (Outbound to Moon).
- Key Coordinates: Earth at [0,0,0], Moon at scaled Z-axis (~384k units).
- Trajectory: Free Return Trajectory (Figure-8 path).

## Coding Standards
- Use Functional Components and Hooks.
- Keep 3D logic in separate components (e.g., TrajectoryView3D.jsx).
- Data calls must handle CORS using the established proxy.
- Base path for deployment: `/Artemis-Tracker/`.

## Critical API Info
- JPL Horizons ID for Orion: 'Integrity' (Target ID: -135).
- Endpoint: https://ssd.jpl.nasa.gov/api/horizons.api
- Parameters: COMMAND='-135', OBJ_DATA='YES', MAKE_EPHEM='YES', EPHEM_TYPE='VECTORS'.

## How to Build/Deploy
- Build: `npm run build`
- Deploy: Pushed to `main` branch, served from `/dist` folder on GitHub Pages.
