# Weather Proxy API (NestJS + React)

A professional, dynamic weather application with a NestJS backend and a React frontend. The app uses OpenWeatherMap for current conditions, debounced city suggestions, and a polished, enterprise-grade UI.

## Monorepo Layout

- `backend/` NestJS API (TypeORM-ready, OpenWeather integration)
- `frontend/` React app (Create React App + TypeScript)

---

## Prerequisites

- Node.js 18+ and npm
- OpenWeatherMap account and API key

---

## 1) Clone and Install

```bash
# clone
git clone <https://github.com/chimken-adobo/Activity-4.git>
cd Activity-4

# install deps
cd backend

npm install

cd ..

cd frontend

npm install

```

---

## 2) Configure Environment

Backend expects an OpenWeather API key. You can export it in your shell or create a `.env` in `backend/`.

Windows PowerShell (current session):
```powershell
$env:OPENWEATHER_API_KEY="YOUR_KEY_HERE"
```

Windows (persist for future sessions):
```powershell
setx OPENWEATHER_API_KEY "YOUR_KEY_HERE"
# Close and reopen the terminal afterwards
```

## 3) Run the Backend (NestJS)

From `backend/`:
```bash
npm run start:dev
```

- Server starts on `http://localhost:3000`
- CORS is enabled for local dev

### API Endpoints

- `GET /weather?city=City,CC`
  - Returns current weather by city string (e.g., `Tokyo,JP`).
- `GET /weather?lat=..&lon=..`
  - Returns current weather by coordinates. Used by suggestions for accuracy.
- `GET /weather/geo?q=query`
  - OpenWeather geocoding proxy; returns up to 5 matching locations with `name`, `state`, `country`, `lat`, `lon`, `label`.

Example with Postman/curl:
```bash
curl "http://localhost:3000/weather?city=Tokyo,JP"
curl "http://localhost:3000/weather?lat=35.6762&lon=139.6503"
curl "http://localhost:3000/weather/geo?q=tokyo"
```

Common responses:
- `200 OK` `{ city, temperature, condition }`
- `404 Not Found` `City not found` (when `q` lookup fails at OpenWeather)
- `502 Bad Gateway` `Invalid OpenWeather API key` (bad key)
- `500` Missing `OPENWEATHER_API_KEY`

---

## 4) Run the Frontend (React)

From `frontend/`:
```bash
npm start
```

- CRA will run on a free port (3000/3001). The backend is on `http://localhost:3000`.
- The app uses CORS; no proxy is required.

Search usage:
- Type `City, CountryCode` (e.g., `Tokyo, JP`).
- Suggestions appear from `GET /weather/geo`; choose one to fetch by coordinates immediately.
- Press Enter to fetch by the typed string; if not found, a centered "No results found" message is shown.

UI Notes:
- Minimal hero layout with dynamic themes (sunny/rain/storm/cloud/night)
- Glassmorphism card, bold typography, modern icons
- Optional hourly preview row

---

## 5) Troubleshooting

- No suggestions / network error
  - Ensure backend is running and reachable at `http://localhost:3000`.
  - Verify `OPENWEATHER_API_KEY` is set in the backend environment and restart the backend terminal.

- Always seeing "City not found"
  - Try selecting from suggestions so the app queries by `lat/lon`.
  - Confirm your API key is valid and not rate-limited.

- CORS errors in the browser
  - Backend has CORS enabled; ensure you are running the frontend on `localhost` or `127.0.0.1`.

- Port conflicts
  - If CRA asks to use another port, accept (e.g., `http://localhost:3001`).

---

## 6) Project Scripts

Backend (`backend/`):
- `npm run start:dev` start in watch mode
- `npm run build` compile to `dist/`

Frontend (`frontend/`):
- `npm start` run dev server
- `npm run build` production build

---

## 7) Implementation Details

- Backend
  - NestJS + Axios, `GET /weather` supports city or coordinates
  - `GET /weather/geo` proxies OpenWeather Geocoding API
  - TypeORM entity `WeatherLog` available; logs are created on requests

- Frontend
  - React + TypeScript, Axios
  - Debounced suggestions (250ms), glass dropdown; hides on blur/selection
  - On suggestion selection, fetches by coordinates to avoid name ambiguity
  - Graceful empty/error states with fade transitions

---

## 8) Security

- The OpenWeather API key is never exposed to the browser; all external requests are made via the backend.
- Do not commit secrets. Use environment variables or secret managers in production.

---