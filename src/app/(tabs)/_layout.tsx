import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs } from 'expo-router/tabs';
import { useT } from '@/i18n';
import { fonts, usePalette } from '@/theme';

export default function TabsLayout() {
  const p = usePalette();
  const { t } = useT();
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: p.background },
        headerTitleStyle: { fontFamily: fonts.ui.bold, color: p.text, fontSize: 15 },
        headerShadowVisible: false,
        tabBarActiveTintColor: p.text,
        tabBarInactiveTintColor: p.textMuted,
        tabBarStyle: { backgroundColor: p.background, borderTopColor: p.border, borderTopWidth: 1, minHeight: 60 },
        tabBarLabelStyle: { fontFamily: fonts.ui.semibold, fontSize: 11 },
        sceneStyle: { backgroundColor: p.background },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('tabHome'),
          headerShown: false,
          tabBarIcon: ({ color, size }) => <Ionicons name="home-outline" size={size} color={color as string} />,
        }}
      />
      <Tabs.Screen
        name="library"
        options={{
          title: t('tabLibrary'),
          tabBarIcon: ({ color, size }) => <Ionicons name="library-outline" size={size} color={color as string} />,
        }}
      />
      <Tabs.Screen
        name="jap"
        options={{
          title: t('tabJap'),
          headerTitle: t('japTitle'),
          tabBarIcon: ({ color, size }) => <Ionicons name="radio-button-on-outline" size={size} color={color as string} />,
        }}
      />
      <Tabs.Screen
        name="learn"
        options={{
          title: t('tabLearn'),
          headerTitle: t('learnTitle'),
          tabBarIcon: ({ color, size }) => <Ionicons name="school-outline" size={size} color={color as string} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: t('tabSettings'),
          tabBarIcon: ({ color, size }) => <Ionicons name="settings-outline" size={size} color={color as string} />,
        }}
      />
    </Tabs>
  );
}
