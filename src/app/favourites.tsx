import { router } from 'expo-router';
import { EntryRow } from '@/components/content';
import { Button, EmptyState, Screen, SectionTitle } from '@/components/ui';
import { entriesById } from '@/content';
import { useT } from '@/i18n';
import { useStore } from '@/state/store';

export default function FavouritesScreen() {
  const { t } = useT();
  const favourites = useStore((s) => s.favourites);
  const bookmarks = useStore((s) => s.bookmarks);
  const favEntries = favourites.map((id) => entriesById.get(id)).filter((e): e is NonNullable<typeof e> => !!e);
  const bookmarked = Object.keys(bookmarks)
    .map((id) => entriesById.get(id))
    .filter((e): e is NonNullable<typeof e> => !!e);

  if (favEntries.length === 0 && bookmarked.length === 0) {
    return <EmptyState icon="heart-outline" title={t('favourites')} body={t('noFavourites')} action={<Button label={t('tabLibrary')} kind="secondary" onPress={() => router.navigate('/library')} />} />;
  }

  return (
    <Screen>
      {favEntries.length > 0 && (
        <>
          <SectionTitle>{t('favourites')}</SectionTitle>
          {favEntries.map((e) => (
            <EntryRow key={e.id} entry={e} />
          ))}
        </>
      )}
      {bookmarked.length > 0 && (
        <>
          <SectionTitle>{t('bookmarks')}</SectionTitle>
          {bookmarked.map((e) => (
            <EntryRow key={e.id} entry={e} />
          ))}
        </>
      )}
    </Screen>
  );
}
