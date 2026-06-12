// Role tabanlı kök yönlendirme: oturum yok -> Auth; user -> UserTabs; admin -> AdminTabs.
import { useAuthStore } from '../store/authStore';
import AuthNavigator from './AuthNavigator';
import UserTabs from './UserTabs';
import AdminTabs from './AdminTabs';

export default function RootNavigator() {
  const user = useAuthStore((s) => s.currentUser);
  if (!user) return <AuthNavigator />;
  return user.role === 'admin' ? <AdminTabs /> : <UserTabs />;
}
