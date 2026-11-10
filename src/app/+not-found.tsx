import { router, Stack } from 'expo-router';
import { View } from 'react-native';
import { Button, EmptyState } from '@/components/ui';
import { useT } from '@/i18n';
import { usePalette } from '@/theme';

export default function NotFound() {
  const { t } = useT();
  const p = usePalette();
  return (
    <View style={{ flex: 1, backgroundColor: p.background, justifyContent: 'center' }}>
      <Stack.Screen options={{ title: '' }} />
      <EmptyState icon="compass-outline" title={t('notFound')} action={<Button label={t('goHome')} onPress={() => router.replace('/')} />} />
    </View>
  );
}
