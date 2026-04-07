import { Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { EventPage } from './pages/EventPage'
import { EventsPage } from './pages/EventsPage'
import { ExplorePage } from './pages/ExplorePage'
import { HomePage } from './pages/HomePage'
import { PlacePage } from './pages/PlacePage'
import { PlacesPage } from './pages/PlacesPage'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="explore" element={<ExplorePage />} />
        <Route path="places" element={<PlacesPage />} />
        <Route path="places/:slug" element={<PlacePage />} />
        <Route path="events" element={<EventsPage />} />
        <Route path="events/:slug" element={<EventPage />} />
      </Route>
    </Routes>
  )
}
