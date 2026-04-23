import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import 'leaflet/dist/leaflet.css'
import './styles/leaflet-theme.css'
import { RouterProvider } from './app/providers'
import { useThemeStore } from './store/themeStore'

// Initialize theme before render
const initTheme = () => {
  const theme = useThemeStore.getState().theme
  document.documentElement.classList.remove('dark', 'light')
  document.documentElement.classList.add(theme)
}

initTheme()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider />
  </StrictMode>,
)
