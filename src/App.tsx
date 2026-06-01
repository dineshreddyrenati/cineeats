import { AuthProvider, useAuth } from './context/AuthContext';
import AuthPage from './components/AuthPage';
import UserDashboard from './components/user/UserDashboard';
import TheaterDashboard from './components/theater/TheaterDashboard';
import RestaurantDashboard from './components/restaurant/RestaurantDashboard';

function AppRouter() {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400 text-sm">Loading CineEats...</p>
        </div>
      </div>
    );
  }

  if (!user || !profile) {
    return <AuthPage />;
  }

  switch (profile.role) {
    case 'theater_rep':
      return <TheaterDashboard />;
    case 'restaurant_rep':
      return <RestaurantDashboard />;
    default:
      return <UserDashboard />;
  }
}

export default function App() {
  return (
    <AuthProvider>
      <AppRouter />
    </AuthProvider>
  );
}
