// Kullanıcı navigasyonu: alt sekmeler (Takvim/Kategoriler/Ayarlar) + üstte EventForm stack.
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import CalendarScreen from '../screens/user/CalendarScreen';
import ClockScreen from '../screens/user/ClockScreen';
import CategoriesScreen from '../screens/user/CategoriesScreen';
import SettingsScreen from '../screens/user/SettingsScreen';
import EventFormScreen from '../screens/user/EventFormScreen';
import { HeaderLogout } from '../components/ui';
import { useTheme } from '../utils/useTheme';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const ICONS = {
  Takvim: 'calendar',
  Saat: 'time',
  Kategoriler: 'pricetags',
  Ayarlar: 'settings',
};

function Tabs() {
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
      <Tab.Screen name="Takvim" component={CalendarScreen} />
      <Tab.Screen name="Saat" component={ClockScreen} />
      <Tab.Screen name="Kategoriler" component={CategoriesScreen} />
      <Tab.Screen name="Ayarlar" component={SettingsScreen} />
    </Tab.Navigator>
  );
}

export default function UserTabs() {
  const { colors } = useTheme();
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.card },
        headerTitleStyle: { color: colors.text },
        headerTintColor: colors.primary,
      }}
    >
      <Stack.Screen name="MainTabs" component={Tabs} options={{ headerShown: false }} />
      <Stack.Screen name="EventForm" component={EventFormScreen} options={{ title: 'Etkinlik' }} />
    </Stack.Navigator>
  );
}
