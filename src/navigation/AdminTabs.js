// Admin navigasyonu: Dashboard / Kullanıcılar / Yedekleme.
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import AdminDashboardScreen from '../screens/admin/AdminDashboardScreen';
import UserListScreen from '../screens/admin/UserListScreen';
import BackupRestoreScreen from '../screens/admin/BackupRestoreScreen';
import { HeaderLogout } from '../components/ui';
import { useTheme } from '../utils/useTheme';

const Tab = createBottomTabNavigator();

const ICONS = {
  Panel: 'stats-chart',
  Kullanıcılar: 'people',
  Yedekleme: 'archive',
};

export default function AdminTabs() {
  const { colors } = useTheme();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerStyle: { backgroundColor: colors.card },
        headerTitleStyle: { color: colors.text },
        headerTintColor: colors.text,
        headerRight: () => <HeaderLogout />,
        tabBarStyle: { backgroundColor: colors.card, borderTopColor: colors.border },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.subtext,
        tabBarIcon: ({ color, size }) => (
          <Ionicons name={ICONS[route.name]} size={size} color={color} />
        ),
      })}
    >
      <Tab.Screen name="Panel" component={AdminDashboardScreen} />
      <Tab.Screen name="Kullanıcılar" component={UserListScreen} />
      <Tab.Screen name="Yedekleme" component={BackupRestoreScreen} />
    </Tab.Navigator>
  );
}
