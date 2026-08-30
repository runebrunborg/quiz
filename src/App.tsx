import { useEffect } from 'react'
import { NavLink, Route, Routes } from 'react-router-dom'
import { syncOutbox } from './lib/api'
import BankScreen from './screens/BankScreen'
import FriendsScreen from './screens/FriendsScreen'
import PlayScreen from './screens/PlayScreen'
import StartScreen from './screens/StartScreen'
import StatsScreen from './screens/StatsScreen'

const NAV = [
  { to: '/', label: 'Spill', end: true },
  { to: '/statistikk', label: 'Statistikk', end: false },
  { to: '/venner', label: 'Venner', end: false },
  { to: '/banken', label: 'Banken', end: false },
]

export default function App() {
  // Sender resultater som ble spilt offline så snart appen er oppe igjen.
  useEffect(() => {
    void syncOutbox().catch(() => undefined)
  }, [])

  return (
    <div className="app">
      <header className="topbar">
        <div className="topbar__inner">
          <NavLink to="/" className="brand">
            <span className="brand__mark" aria-hidden="true" />
            Theme Quiz
          </NavLink>
          <nav className="nav">
            {NAV.map((item) => (
              <NavLink key={item.to} to={item.to} end={item.end} className={({ isActive }) => (isActive ? 'is-active' : '')}>
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>

      <main className="shell">
        <Routes>
          <Route path="/" element={<StartScreen />} />
          <Route path="/spill/:category/:difficulty/:region" element={<PlayScreen />} />
          <Route path="/statistikk" element={<StatsScreen />} />
          <Route path="/venner" element={<FriendsScreen />} />
          <Route path="/banken" element={<BankScreen />} />
          <Route path="*" element={<StartScreen />} />
        </Routes>
      </main>
    </div>
  )
}
