import React, { useMemo, useState } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [city, setCity] = useState('');
  const [weather, setWeather] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<Array<{ label: string; name: string; country: string; state?: string; lat?: number; lon?: number }>>([]);
  const [suggestOpen, setSuggestOpen] = useState(false);
  const [noResults, setNoResults] = useState(false);

  const getWeather = async (override?: string) => {
    const trimmed = city.trim();
    const query = (override ?? trimmed).trim();
    if (!query) return;
    setLoading(true);
    setError(null);
    setWeather(null);
    setNoResults(false);
    try {
      const res = await axios.get('http://localhost:3000/weather', {
        params: { city: query },
      });
      setWeather(res.data);
    } catch (err: any) {
      const status = err?.response?.status;
      if (status === 404) {
        setNoResults(true);
        setError(null);
      } else {
        const message = err?.response?.data?.message || 'Unable to fetch weather';
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void getWeather();
  };

  const getWeatherByCoords = async (lat: number, lon: number, label?: string) => {
    setLoading(true);
    setError(null);
    setWeather(null);
    setNoResults(false);
    try {
      const res = await axios.get('http://localhost:3000/weather', { params: { lat, lon } });
      setWeather(res.data);
      if (label) setCity(label);
    } catch (err: any) {
      const message = err?.response?.data?.message || 'Unable to fetch weather';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  // Debounced suggestions
  React.useEffect(() => {
    const q = city.trim();
    if (!q) {
      setSuggestions([]);
      setSuggestOpen(false);
      return;
    }
    const id = setTimeout(async () => {
      try {
        const res = await axios.get('http://localhost:3000/weather/geo', { params: { q } });
        setSuggestions(res.data || []);
        setSuggestOpen(true);
      } catch {
        setSuggestions([]);
        setSuggestOpen(false);
      }
    }, 250);
    return () => clearTimeout(id);
  }, [city]);

  const emptyState = useMemo(() => noResults || (!loading && !weather && !error && city.trim().length > 0 && suggestions.length === 0), [loading, weather, error, city, suggestions, noResults]);

  const condition = String(weather?.condition || '');
  const mainIcon = getWeatherIcon(condition);

  // Simple demo hourly and daily placeholder data for layout illustration
  const hourly = Array.from({ length: 8 }).map((_, i) => ({
    time: `${(new Date().getHours() + i) % 24}:00`,
    temp: weather ? Math.round(weather.temperature + (Math.sin(i) * 2)) : 24 + i,
    cond: condition,
  }));

  const daily = [
    'Mon','Tue','Wed','Thu','Fri','Sat','Sun'
  ].map((d, idx) => ({
    day: d,
    high: weather ? Math.round(weather.temperature + 3 - (idx % 3)) : 28 - idx,
    low: weather ? Math.round(weather.temperature - 3 - (idx % 2)) : 20 - idx,
    cond: condition,
  }));

  const themeClass = getThemeClass(condition);

  return (
    <div className={`hero ${themeClass}`}>
      <div className="mist" aria-hidden />
      <div className="hero-inner hero-inner-offset">
        <div className="hero-search">
          <input
            className="hero-input"
            type="text"
            placeholder="Search for cities"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') onSubmit(e as any); }}
            onFocus={() => setSuggestOpen(true)}
            onBlur={() => setTimeout(() => setSuggestOpen(false), 120)}
            aria-label="Search for cities"
            aria-autocomplete="list"
            aria-expanded={suggestOpen}
          />
          {suggestOpen && suggestions.length > 0 && (
            <div className="suggest-box">
              {suggestions.map((s, i) => (
                <button
                  key={i}
                  className="suggest-item"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    const label = `${s.name}, ${s.country}`;
                    setCity(label);
                    setSuggestOpen(false);
                    if (typeof s.lat === 'number' && typeof s.lon === 'number') {
                      setTimeout(() => void getWeatherByCoords(s.lat!, s.lon!, label), 0);
                    } else {
                      setTimeout(() => void getWeather(label), 0);
                    }
                  }}
                >
                  {s.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <section className="hero-card fade" aria-live="polite">
          {emptyState ? (
            <div className="empty-card">No results found</div>
          ) : (
            <>
              <div className="hero-icon" aria-hidden>{mainIcon}</div>
              <div className="hero-city">{weather?.city || '—'}</div>
              <div className="hero-temp">{weather ? Math.round(weather.temperature) : '—'}<span className="unit">°C</span></div>
              <div className="hero-cond">{titleCase(condition) || '—'}</div>
              <div className="hero-feels">Feels like {weather ? Math.round(weather.temperature) : '—'}°</div>

              <div className="hero-stats">
                <div className="hstat"><span>Rain</span><strong>{estimatePop(condition)}%</strong></div>
                <div className="hstat"><span>Humidity</span><strong>{estimateHumidity(condition)}%</strong></div>
                <div className="hstat"><span>Wind</span><strong>{estimateWind(condition)} km/h</strong></div>
              </div>
            </>
          )}
        </section>

        <section className="hero-hourly fade">
          <div className="hourly-mini">
            {hourly.slice(0, 8).map((h, i) => (
              <div key={i} className="hmini">
                <div className="hmini-time">{h.time}</div>
                <div className="hmini-icon">{getWeatherMiniIcon(h.cond)}</div>
                <div className="hmini-temp">{h.temp}°</div>
              </div>
            ))}
          </div>
        </section>
        {emptyState && (
          <div className="empty fade">No results found</div>
        )}
      </div>
    </div>
  );
}

export default App;

function titleCase(s: string) {
  return s.replace(/\b\w/g, (c) => c.toUpperCase());
}

function estimatePop(cond: string) {
  if (/rain|storm/i.test(cond)) return 70;
  if (/cloud/i.test(cond)) return 30;
  return 5;
}

function estimateHumidity(cond: string) {
  if (/rain|storm/i.test(cond)) return 80;
  if (/cloud/i.test(cond)) return 60;
  return 45;
}

function estimateWind(cond: string) {
  if (/storm/i.test(cond)) return 35;
  if (/rain/i.test(cond)) return 18;
  return 10;
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="metric">
      <div className="metric-label">{label}</div>
      <div className="metric-value">{value}</div>
    </div>
  );
}

function getWeatherIcon(cond: string) {
  if (/storm|thunder/i.test(cond)) return <IconStorm3D />;
  if (/rain|drizzle/i.test(cond)) return <IconRain3D />;
  if (/cloud|fog|mist/i.test(cond)) return <IconCloud3D />;
  if (/night|moon/i.test(cond)) return <IconMoon3D />;
  return <IconSun3D />;
}

function getWeatherMiniIcon(cond: string) {
  if (/storm|thunder/i.test(cond)) return <IconStorm small/>;
  if (/rain|drizzle/i.test(cond)) return <IconRain small/>;
  if (/cloud|fog|mist/i.test(cond)) return <IconCloud small/>;
  if (/night|moon/i.test(cond)) return <IconMoon small/>;
  return <IconSun small/>;
}

function IconWeather() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path d="M6 14a6 6 0 1 1 11.31 3H7a3 3 0 1 1-1-3z" stroke="currentColor" strokeWidth="1.5"/>
    </svg>
  );
}

function IconCities() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path d="M3 21V8l7-4 7 4v13M10 21V10m4 11V6" stroke="currentColor" strokeWidth="1.5"/>
    </svg>
  );
}

function IconMap() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path d="M3 6l6-3 6 3 6-3v15l-6 3-6-3-6 3V6z" stroke="currentColor" strokeWidth="1.5"/>
    </svg>
  );
}

function IconSettings() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M19.4 15a1 1 0 0 0 .2 1.1l.1.1a2 2 0 1 1-2.9 2.9l-.1-.1a1 1 0 0 0-1.1-.2 1 1 0 0 0-.6.9V20a2 2 0 1 1-4 0v-.1a1 1 0 0 0-.6-.9 1 1 0 0 0-1.1.2l-.1.1a2 2 0 1 1-2.9-2.9l.1-.1a1 1 0 0 0 .2-1.1 1 1 0 0 0-.9-.6H4a2 2 0 1 1 0-4h.1a1 1 0 0 0 .9-.6 1 1 0 0 0-.2-1.1l-.1-.1A2 2 0 1 1 7.6 5l.1.1a1 1 0 0 0 1.1.2H9a1 1 0 0 0 .6-.9V4a2 2 0 1 1 4 0v.1a1 1 0 0 0 .6.9 1 1 0 0 0 1.1-.2l.1-.1A2 2 0 1 1 19 7.6l-.1.1a1 1 0 0 0-.2 1.1V9c0 .4.2.8.6.9H20a2 2 0 1 1 0 4h-.1a1 1 0 0 0-.9.6z" stroke="currentColor" strokeWidth="1.5"/>
    </svg>
  );
}

function IconSun({ small }: { small?: boolean }) {
  const size = small ? 20 : 72;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <circle cx="12" cy="12" r="4" fill="currentColor"/>
      <g stroke="currentColor" strokeWidth="1.5">
        <path d="M12 2v2M12 20v2M4 12H2M22 12h-2M5 5l-1.5-1.5M20.5 20.5 19 19M5 19l-1.5 1.5M20.5 3.5 19 5"/>
      </g>
    </svg>
  );
}

function IconMoon({ small }: { small?: boolean }) {
  const size = small ? 20 : 72;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path d="M21 13.5A8.5 8.5 0 1 1 10.5 3 7 7 0 0 0 21 13.5z" fill="currentColor"/>
    </svg>
  );
}

// 3D/gradient-styled large icons
function IconSun3D() {
  return (
    <svg width="96" height="96" viewBox="0 0 96 96" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <defs>
        <radialGradient id="gSun" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#fff59d"/>
          <stop offset="60%" stopColor="#fde047"/>
          <stop offset="100%" stopColor="#f59e0b"/>
        </radialGradient>
      </defs>
      <circle cx="48" cy="48" r="20" fill="url(#gSun)"/>
      <g stroke="#fbbf24" strokeWidth="4" strokeLinecap="round">
        <path d="M48 10v10M48 76v10M10 48h10M76 48h10M21 21l7 7M68 68l7 7M21 75l7-7M68 28l7-7"/>
      </g>
    </svg>
  );
}

function IconCloud3D() {
  return (
    <svg width="96" height="96" viewBox="0 0 96 96" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <defs>
        <linearGradient id="gCloud" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#cbd5e1"/>
          <stop offset="100%" stopColor="#94a3b8"/>
        </linearGradient>
      </defs>
      <path d="M30 64a14 14 0 1 1 2.8-27.7A20 20 0 0 1 70 42a13 13 0 1 1 0 26H30z" fill="url(#gCloud)"/>
    </svg>
  );
}

function IconRain3D() {
  return (
    <svg width="96" height="96" viewBox="0 0 96 96" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <defs>
        <linearGradient id="gRainC" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#cbd5e1"/>
          <stop offset="100%" stopColor="#94a3b8"/>
        </linearGradient>
        <linearGradient id="gDrop" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#60a5fa"/>
          <stop offset="100%" stopColor="#3b82f6"/>
        </linearGradient>
      </defs>
      <path d="M30 58a14 14 0 1 1 2.8-27.7A20 20 0 0 1 70 36a13 13 0 1 1 0 26H30z" fill="url(#gRainC)"/>
      <g fill="url(#gDrop)">
        <path d="M36 66c-2 3 1 6 3 6s5-3 3-6l-3-5-3 5z"/>
        <path d="M48 66c-2 3 1 6 3 6s5-3 3-6l-3-5-3 5z"/>
        <path d="M60 66c-2 3 1 6 3 6s5-3 3-6l-3-5-3 5z"/>
      </g>
    </svg>
  );
}

function IconStorm3D() {
  return (
    <svg width="96" height="96" viewBox="0 0 96 96" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <defs>
        <linearGradient id="gStormC" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#9ca3af"/>
          <stop offset="100%" stopColor="#6b7280"/>
        </linearGradient>
        <linearGradient id="gBolt" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#fde047"/>
          <stop offset="100%" stopColor="#f59e0b"/>
        </linearGradient>
      </defs>
      <path d="M30 58a14 14 0 1 1 2.8-27.7A20 20 0 0 1 70 36a13 13 0 1 1 0 26H30z" fill="url(#gStormC)"/>
      <path d="M50 50l-8 14h8l-3 12 12-18h-8l3-8h-4z" fill="url(#gBolt)"/>
    </svg>
  );
}

function IconMoon3D() {
  return (
    <svg width="96" height="96" viewBox="0 0 96 96" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <defs>
        <radialGradient id="gMoon" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#d1d5db"/>
          <stop offset="100%" stopColor="#9ca3af"/>
        </radialGradient>
      </defs>
      <path d="M74 54A26 26 0 1 1 42 22a22 22 0 0 0 32 32z" fill="url(#gMoon)"/>
    </svg>
  );
}

function getThemeClass(cond: string) {
  if (/storm|thunder/i.test(cond)) return 'theme-storm';
  if (/rain|drizzle/i.test(cond)) return 'theme-rain';
  if (/cloud|fog|mist/i.test(cond)) return 'theme-cloud';
  if (/night|moon/i.test(cond)) return 'theme-night';
  return 'theme-sun';
}
function IconCloud({ small }: { small?: boolean }) {
  const size = small ? 20 : 72;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path d="M7 18a4 4 0 1 1 1.2-7.8A5.5 5.5 0 0 1 18.5 11 3.5 3.5 0 1 1 17 18H7z" fill="currentColor"/>
    </svg>
  );
}

function IconRain({ small }: { small?: boolean }) {
  const size = small ? 20 : 72;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path d="M7 14a4 4 0 1 1 1.2-7.8A5.5 5.5 0 0 1 18.5 7 3.5 3.5 0 1 1 17 14H7z" fill="currentColor"/>
      <g stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
        <path d="M8 16l-1 3M12 16l-1 3M16 16l-1 3"/>
      </g>
    </svg>
  );
}

function IconStorm({ small }: { small?: boolean }) {
  const size = small ? 20 : 72;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path d="M7 14a4 4 0 1 1 1.2-7.8A5.5 5.5 0 0 1 18.5 7 3.5 3.5 0 1 1 17 14H7z" fill="currentColor"/>
      <path d="M12 14l-2 4h3l-1 4 4-6h-3l1-2h-2z" fill="currentColor"/>
    </svg>
  );
}
