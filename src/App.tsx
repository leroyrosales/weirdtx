import { Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
// Sign-in / saved places paused: restore IdentityProvider + /saved route below.
// import { IdentityProvider } from './contexts/IdentityProvider'
import { RandomPickProvider } from './contexts/RandomPickProvider'
import { EventPage } from './pages/EventPage'
import { EventsPage } from './pages/EventsPage'
import { ExplorePage } from './pages/ExplorePage'
import { HomePage } from './pages/HomePage'
import { PlacePage } from './pages/PlacePage'
import { PlacesPage } from './pages/PlacesPage'
import { TagPage } from './pages/TagPage'
import { RegionPage } from './pages/RegionPage'
import { CategoryPage } from './pages/CategoryPage'
import { RandomListingPage } from './pages/RandomListingPage'
// import { SavedPlacesPage } from './pages/SavedPlacesPage'

export default function App() {
  return (
    <RandomPickProvider>
      {/* <IdentityProvider> */}
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<HomePage />} />
            <Route path="random" element={<RandomListingPage />} />
            <Route path="explore" element={<ExplorePage />} />
            {/* <Route path="saved" element={<SavedPlacesPage />} /> */}
            <Route path="places" element={<PlacesPage />} />
            <Route path="places/:slug" element={<PlacePage />} />
            <Route path="events" element={<EventsPage />} />
            <Route path="events/:slug" element={<EventPage />} />
            <Route path="tags/:tag" element={<TagPage />} />
            <Route path="regions/:region" element={<RegionPage />} />
            <Route path="categories/:category" element={<CategoryPage />} />
          </Route>
        </Routes>
      {/* </IdentityProvider> */}
    </RandomPickProvider>
  )
}
