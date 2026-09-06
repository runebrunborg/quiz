import { useEffect } from 'react'
import { NavLink, Route, Routes, useLocation } from 'react-router-dom'
import Logo from './components/Logo'
import { syncFeedback, syncOutbox } from './lib/api'
import AccountScreen from './screens/AccountScreen'
import BankScreen from './screens/BankScreen'
import FeedbackScreen from './screens/FeedbackScreen'
import FriendsScreen from './screens/FriendsScreen'
import LeaderboardScreen from './screens/LeaderboardScreen'
import PlayScreen from './screens/PlayScreen'
import StartScreen from './screens/StartScreen'
import StatsScreen from './screens/StatsScreen'

const NAV = [
  { to: '/', label: 'Spill', end: true },
  { to: '/statistikk', label: 'Statistikk', end: false },
  { to: '/venner', label: 'Venner', end: false },
  { to: '/toppliste', label: 'Toppliste', end: false },
  { to: '/banken', label: 'Banken', end: false },
  { to: '/kvalitet', label: 'Kvalitet', end: false },
  { to: '/konto', label: 'Profil', end: false },
]

/**
 * Ved sidebytte står nettleseren igjen med rulleposisjonen fra forrige side,
 * så en runde startet fra bunnen av startskjermen åpnet midt i spørsmålslista.
 * Her nullstilles den ved hvert bytte av sti.
 */
function ScrollToTop() {
  const { pathname } = useLocation()

  useEffect(() => {
    // Nettleserens egen gjenoppretting gjelder samme dokument, og i en
    // enkeltsideapp gir den bare en tilfeldig posisjon på den nye skjermen.
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual'
  }, [])

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior })
  }, [pathname])

  return null
}

export default function App() {
  // Sender resultater som ble spilt offline så snart appen er oppe igjen.
  useEffect(() => {
    void syncOutbox().catch(() => undefined)
    void syncFeedback().catch(() => undefined)
  }, [])

  return (
    <div className="app">
      <ScrollToTop />
      <header className="topbar">
        <div className="topbar__inner">
          <NavLink to="/" className="brand" aria-label="LinnQuiz">
            <Logo size={24} withWordmark />
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
          <Route path="/toppliste" element={<LeaderboardScreen />} />
          <Route path="/banken" element={<BankScreen />} />
          <Route path="/kvalitet" element={<FeedbackScreen />} />
          <Route path="/konto" element={<AccountScreen />} />
          <Route path="*" element={<StartScreen />} />
        </Routes>
      </main>
    </div>
  )
}
