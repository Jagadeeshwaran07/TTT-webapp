import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../../store/auth';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAdmin } = useAuthStore();
  if (!isAdmin) return <Navigate to="/login" replace />;
  return <>{children}</>;
}
