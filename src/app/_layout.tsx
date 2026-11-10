// Per-weight imports so only the six weights used are bundled (not all eighteen).
import { NotoSansDevanagari_400Regular } from '@expo-google-fonts/noto-sans-devanagari/400Regular';
import { NotoSansDevanagari_500Medium } from '@expo-google-fonts/noto-sans-devanagari/500Medium';
import { NotoSansDevanagari_600SemiBold } from '@expo-google-fonts/noto-sans-devanagari/600SemiBold';
import { NotoSansDevanagari_700Bold } from '@expo-google-fonts/noto-sans-devanagari/700Bold';
import { NotoSerifDevanagari_400Regular } from '@expo-google-fonts/noto-serif-devanagari/400Regular';
import { NotoSerifDevanagari_600SemiBold } from '@expo-google-fonts/noto-serif-devanagari/600SemiBold';
import { useFonts } from 'expo-font';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider, type Theme } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
import { useEffect, useMemo } from 'react';
import { useT } from '@/i18n';
import { UpdatesProvider } from '@/services/updates';
import { useHydrated } from '@/state/store';
import { fonts, usePalette } from '@/theme';

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  // Fonts are bundled with the app (no network). Noto Devanagari shapes conjuncts and matras correctly.
  const [fontsLoaded, fontError] = useFonts({
    NotoSansDevanagari_400Regular,
    NotoSansDevanagari_500Medium,
    NotoSansDevanagari_600SemiBold,
    NotoSansDevanagari_700Bold,
    NotoSerifDevanagari_400Regular,
    NotoSerifDevanagari_600SemiBold,
  });
  const hydrated = useHydrated();
  const ready = (fontsLoaded || !!fontError) && hydrated;

  useEffect(() => {
    if (ready) SplashScreen.hideAsync().catch(() => {});
  }, [ready]);

  if (!ready) return null;
  return (
    <UpdatesProvider>
      <ThemedStack />
    </UpdatesProvider>
  );
}

function ThemedStack() {
  const p = usePalette();
  const { t } = useT();

  useEffect(() => {
    SystemUI.setBackgroundColorAsync(p.background).catch(() => {});
  }, [p.background]);

  const navTheme: Theme = useMemo(() => {
    const base = p.isDark ? DarkTheme : DefaultTheme;
    return {
      ...base,
      dark: p.isDark,
      colors: { ...base.colors, primary: p.accent, background: p.background, card: p.background, text: p.text, border: p.border, notification: p.accent },
    };
  }, [p]);

  return (
    <ThemeProvider value={navTheme}>
      <StatusBar style={p.isDark ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: p.background },
          headerTintColor: p.text,
          headerTitleStyle: { fontFamily: fonts.ui.bold, color: p.text, fontSize: 15 },
          headerShadowVisible: false,
          headerBackTitle: t('back'),
          contentStyle: { backgroundColor: p.background },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="prayer/[id]" options={{ title: '' }} />
        <Stack.Screen name="yantra/[id]" options={{ title: t('yantraTitle') }} />
        <Stack.Screen name="deity/[id]" options={{ title: '' }} />
        <Stack.Screen name="deities" options={{ title: t('allDeities') }} />
        <Stack.Screen name="favourites" options={{ title: t('favourites') }} />
        <Stack.Screen name="sources" options={{ title: t('sourcesTitle') }} />
      </Stack>
    </ThemeProvider>
  );
}
