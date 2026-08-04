import { useEffect, useState, type ComponentType } from 'react'
import { onAuthStateChanged, signOut, type User } from 'firebase/auth'
import Login from './Components/Login'
import Register from './Components/Register'
import Customers from './pages/Customers'
import Dashboard from './pages/Dashboard'
import Inventory from './pages/Inventory'
import Index from './pages'
import { appRoutes, type PageProps, type RouteId } from './pages/pageData'
import { auth } from './pages/Firebase/config'
import Sales from './pages/Sales'
import { ensureBusinessContext } from './api/setup'

// Register service worker
if ('serviceWorker' in navigator && typeof window !== 'undefined') {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('ServiceWorker registration successful with scope: ', registration.scope);
      })
      .catch((error) => {
        console.log('ServiceWorker registration failed: ', error);
      });
  });
}

const routeComponents: Record<RouteId, ComponentType<PageProps>> = {
  home: Index,
  dashboard: Dashboard,
  sales: Sales,
  inventory: Inventory,
  customers: Customers,
}

const isRouteId = (value: string): value is RouteId => appRoutes.some((route) => route.id === value)

const readRoute = (): RouteId => {
  if (typeof window === 'undefined') {
    return 'home'
  }

  const hashRoute = window.location.hash.replace('#', '')
  return isRouteId(hashRoute) ? hashRoute : 'home'
}

const App = () => {
  const [activeRoute, setActiveRoute] = useState<RouteId>(readRoute)
  const [authView, setAuthView] = useState<'login' | 'register'>('login')
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [isLoadingAuth, setIsLoadingAuth] = useState(true)
  const Page = routeComponents[activeRoute]

  useEffect(() => {
    const syncRoute = () => setActiveRoute(readRoute())
    window.addEventListener('hashchange', syncRoute)
    return () => window.removeEventListener('hashchange', syncRoute)
  }, [])

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          await ensureBusinessContext()
          await user.getIdToken(true)
        } catch {
          // Setup may fail for network reasons — continue anyway
        }
      }
      setCurrentUser(user)
      setIsLoadingAuth(false)
    })

    return unsubscribe
  }, [])

  const navigate = (route: RouteId) => {
    setActiveRoute(route)
    window.location.hash = route
  }

  const handleSignOut = async () => {
    try {
      await signOut(auth)
      setCurrentUser(null)
      setAuthView('login')
      window.location.hash = ''
    } catch {
      // Sign-out failure is non-critical
    }
  }

  const openDashboardAfterAuth = () => {
    navigate('dashboard')
  }

  if (isLoadingAuth) {
    return (
      <main className="grid min-h-screen place-items-center bg-zinc-100 px-4">
        <div className="rounded-lg border border-zinc-200 bg-white px-5 py-4 text-sm font-semibold text-zinc-700 shadow-sm" role="status">
          Checking secure access...
        </div>
      </main>
    )
  }

  if (!currentUser) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-zinc-100 px-4 py-8">
        {authView === 'login' ? (
          <Login onAuthenticated={openDashboardAfterAuth} onSwitchToRegister={() => setAuthView('register')} />
        ) : (
          <Register onAuthenticated={openDashboardAfterAuth} onSwitchToLogin={() => setAuthView('login')} />
        )}
      </main>
    )
  }

  return (
    <Page
      activeRoute={activeRoute}
      onNavigate={navigate}
      onSignOut={handleSignOut}
      userEmail={currentUser.email}
    />
  )
}

export default App
