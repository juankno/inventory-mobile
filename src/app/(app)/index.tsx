import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  TextInput,
  View,
  type TextInputInstance,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAlerts } from '@/features/inventory/hooks/useAlerts';
import { useProducts } from '@/features/products/hooks/useProducts';
import { errorMessage } from '@/shared/api/errors';
import type { Product } from '@/shared/api/types';
import { useConfirmExit } from '@/shared/device/useConfirmExit';
import { greeting } from '@/shared/format/dates';
import { stockStatus, stockStatusLabel, type StockStatus } from '@/shared/format/stock';
import { formatQuantity } from '@/shared/format/units';
import { messages } from '@/shared/i18n/messages';
import { useSession } from '@/shared/session/SessionProvider';
import { AppText } from '@/shared/ui/AppText';
import { BottomSheet, SheetAction } from '@/shared/ui/BottomSheet';
import { Button } from '@/shared/ui/Button';
import { Banner, StatusBadge } from '@/shared/ui/Feedback';
import { FilterChips } from '@/shared/ui/FilterChips';
import { Icon } from '@/shared/ui/Icon';
import { IconButton } from '@/shared/ui/IconButton';
import { theme } from '@/shared/ui/theme';

const t = messages.inventory;

// Quita tildes y mayúsculas para buscar "azucar" y encontrar "Azúcar".
const normalize = (text: string) =>
  text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();

type StatusFilter = 'all' | Exclude<StockStatus, 'ok'>;

// Coincide por nombre o por código (de barras o INV-), para encontrar un
// producto cuando la cámara no lee y no se recuerda el nombre exacto.
function matchesQuery(product: Product, term: string): boolean {
  if (!term) return true;
  const compactTerm = term.replace(/\s/g, '');
  return normalize(product.name).includes(term) || product.code.toLowerCase().includes(compactTerm);
}

// Inventario: lista, búsqueda, contador de alertas y acceso al escáner (RF-03, RF-14, RIU-03).
export default function InventoryScreen() {
  const insets = useSafeAreaInsets();
  const { session, signOut } = useSession();
  const { focusSearch } = useLocalSearchParams<{ focusSearch?: string }>();
  const products = useProducts();
  const alerts = useAlerts();
  const [query, setQuery] = useState('');
  const [ascending, setAscending] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [menuOpen, setMenuOpen] = useState(false);
  const searchRef = useRef<TextInputInstance>(null);
  useConfirmExit();

  useEffect(() => {
    if (focusSearch) searchRef.current?.focus();
  }, [focusSearch]);

  // Cuántos productos hay en cada estado, para los números de los filtros.
  const statusCounts = useMemo(() => {
    const counts = { all: 0, low: 0, out: 0 };
    for (const product of products.data ?? []) {
      counts.all += 1;
      const status = stockStatus(product);
      if (status !== 'ok') counts[status] += 1;
    }
    return counts;
  }, [products.data]);

  const filterOptions = [
    { value: 'all', label: t.filterAll, count: statusCounts.all },
    { value: 'low', label: t.filterLow, count: statusCounts.low },
    { value: 'out', label: t.filterOut, count: statusCounts.out },
  ] as const;

  const visible = useMemo(() => {
    const term = normalize(query.trim());
    const list = (products.data ?? []).filter(
      (product) =>
        matchesQuery(product, term) && (statusFilter === 'all' || stockStatus(product) === statusFilter),
    );
    return list.sort((a, b) => (ascending ? 1 : -1) * a.name.localeCompare(b.name, 'es'));
  }, [products.data, query, ascending, statusFilter]);

  const toRestock = alerts.data?.total ?? 0;
  const firstName = session?.ownerName.split(' ')[0] ?? '';

  const refresh = () => {
    void products.refetch();
    void alerts.refetch();
  };

  const header = (
    <View style={styles.listHeader}>
      <View style={styles.stats}>
        <View style={[styles.stat, styles.statNeutral]}>
          <AppText variant="lead">{t.registered}</AppText>
          <AppText maxFontSizeMultiplier={theme.maxFontScale.number} style={styles.statNumber}>{products.data?.length ?? '–'}</AppText>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t.alerts(toRestock)}
          onPress={() => router.push('/alerts')}
          style={({ pressed }) => [styles.stat, styles.statWarning, pressed && styles.pressed]}
        >
          <View style={styles.statTop}>
            <AppText variant="lead" style={styles.flex}>
              {t.toRestock}
            </AppText>
            <Icon name="arrowUpRight" color={theme.colors.warningText} />
          </View>
          <AppText maxFontSizeMultiplier={theme.maxFontScale.number} style={styles.statNumber}>{alerts.data ? toRestock : '–'}</AppText>
        </Pressable>
      </View>

      <View style={styles.search}>
        <Icon name="search" color={theme.colors.secondary} />
        <TextInput
          ref={searchRef}
          value={query}
          onChangeText={setQuery}
          placeholder={t.search}
          placeholderTextColor={theme.colors.muted}
          style={styles.searchInput}
          returnKeyType="search"
          accessibilityLabel={t.search}
        />
        {query ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={messages.common.close}
            onPress={() => setQuery('')}
            style={styles.clear}
          >
            <Icon name="close" size={20} color={theme.colors.secondary} />
          </Pressable>
        ) : null}
      </View>

      {products.data && products.data.length > 0 ? (
        <FilterChips
          accessibilityLabel={t.filterLabel}
          options={filterOptions}
          value={statusFilter}
          onChange={setStatusFilter}
        />
      ) : null}

      <View style={styles.listTitle}>
        <AppText variant="heading" accessibilityRole="header">
          {t.listTitle}
        </AppText>
        <Pressable accessibilityRole="button" onPress={() => setAscending((value) => !value)} style={styles.touch}>
          <AppText variant="lead" tone="secondary">
            {ascending ? t.sortAsc : t.sortDesc}
          </AppText>
        </Pressable>
      </View>

      {products.error ? <Banner message={errorMessage(products.error, messages.errors.loadFailed)} /> : null}
    </View>
  );

  const empty = products.isPending ? (
    <ActivityIndicator color={theme.colors.ink} style={styles.loading} />
  ) : products.data && products.data.length === 0 ? (
    <View style={styles.empty}>
      <AppText variant="title">{t.emptyTitle}</AppText>
      <AppText variant="body" tone="secondary">
        {t.emptyBody}
      </AppText>
    </View>
  ) : query ? (
    <AppText variant="body" tone="secondary" style={styles.empty}>
      {t.noResults(query.trim())}
    </AppText>
  ) : statusFilter !== 'all' ? (
    <AppText variant="body" tone="secondary" style={styles.empty}>
      {t.noFilterResults[statusFilter]}
    </AppText>
  ) : null;

  return (
    <View style={[styles.root, { paddingTop: insets.top + theme.spacing.md }]}>
      <View style={styles.topBar}>
        <AppText
          style={styles.greeting}
          accessibilityRole="header"
          maxFontSizeMultiplier={theme.maxFontScale.display}
        >
          {greeting()}
          {firstName ? <AppText style={[styles.greeting, styles.greetingName]}>{`\n${firstName}`}</AppText> : null}
        </AppText>
        <View style={styles.topActions}>
          <IconButton icon="menu" accessibilityLabel={t.menu} onPress={() => setMenuOpen(true)} />
          <IconButton
            icon="bell"
            variant="dark"
            accessibilityLabel={t.alerts(toRestock)}
            badge={toRestock}
            onPress={() => router.push('/alerts')}
          />
        </View>
      </View>

      <View style={styles.sheet}>
        <FlatList
          data={visible}
          keyExtractor={(product) => product.id}
          renderItem={({ item }) => <ProductRow product={item} />}
          ListHeaderComponent={header}
          ListEmptyComponent={empty ?? undefined}
          contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 120 }]}
          ItemSeparatorComponent={Separator}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          refreshControl={
            <RefreshControl refreshing={products.isRefetching} onRefresh={refresh} tintColor={theme.colors.ink} />
          }
        />
      </View>

      <View style={[styles.actions, { bottom: Math.max(insets.bottom, theme.spacing.md) + theme.spacing.sm }]}>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/scanner')}
          style={({ pressed }) => [styles.scanButton, pressed && styles.pressed]}
        >
          <View style={styles.scanIcon}>
            <Icon name="scanBarcode" color={theme.colors.onInk} />
          </View>
          <AppText variant="title" tone="inverse" style={styles.scanLabel}>
            {t.scan}
          </AppText>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t.add}
          onPress={() => router.push('/products/new')}
          style={({ pressed }) => [styles.addButton, pressed && styles.pressed]}
        >
          <Icon name="plus" size={30} />
        </Pressable>
      </View>

      <BottomSheet visible={menuOpen} onClose={() => setMenuOpen(false)}>
        <View>
          <AppText variant="heading">{session?.businessName}</AppText>
          <AppText variant="body" tone="secondary">
            {session?.ownerName}
          </AppText>
        </View>
        <SheetAction
          icon="bell"
          label={t.menuAlerts}
          onPress={() => {
            setMenuOpen(false);
            router.push('/alerts');
          }}
        />
        <SheetAction
          icon="logOut"
          label={t.menuLogout}
          destructive
          onPress={() => {
            setMenuOpen(false);
            void signOut();
          }}
        />
        <Button label={messages.common.close} variant="secondary" onPress={() => setMenuOpen(false)} />
      </BottomSheet>
    </View>
  );
}

function Separator() {
  return <View style={styles.separator} />;
}

function ProductRow({ product }: { product: Product }) {
  const status = stockStatus(product);
  const quantity = formatQuantity(product.stock, product.unit);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${product.name}, ${quantity}${status === 'ok' ? '' : `, ${stockStatusLabel[status]}`}`}
      onPress={() => router.push({ pathname: '/products/[id]', params: { id: product.id } })}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      <View style={styles.rowIcon}>
        <Icon name="box" />
      </View>
      <View style={styles.flex}>
        <AppText variant="title" numberOfLines={1}>
          {product.name}
        </AppText>
        <AppText variant="lead" tone="secondary">
          {quantity}
        </AppText>
      </View>
      {status === 'ok' ? (
        <Icon name="chevronRight" color={theme.colors.secondary} />
      ) : (
        <StatusBadge label={stockStatusLabel[status]} tone={status === 'out' ? 'danger' : 'warning'} />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.colors.background },
  flex: { flex: 1 },
  pressed: { opacity: 0.85 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.xl,
  },
  greeting: { flexShrink: 1, fontFamily: theme.fonts.extrabold, fontSize: 30, lineHeight: 36, letterSpacing: -1, color: theme.colors.text },
  greetingName: { color: theme.colors.muted },
  topActions: { flexDirection: 'row', gap: theme.spacing.md },
  sheet: {
    flex: 1,
    marginTop: theme.spacing.xl,
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: theme.radius.sheet,
    borderTopRightRadius: theme.radius.sheet,
    overflow: 'hidden',
  },
  listContent: { padding: theme.spacing.lg, paddingTop: theme.spacing.xl },
  listHeader: { gap: theme.spacing.lg, marginBottom: theme.spacing.md },
  stats: { flexDirection: 'row', gap: theme.spacing.md },
  stat: { flex: 1, borderRadius: theme.radius.lg, padding: theme.spacing.lg, gap: theme.spacing.md, minHeight: 130 },
  statNeutral: { backgroundColor: theme.colors.field },
  statWarning: { backgroundColor: theme.colors.warningBg },
  statTop: { flexDirection: 'row', alignItems: 'flex-start' },
  statNumber: { fontFamily: theme.fonts.medium, fontSize: 40, lineHeight: 46, color: theme.colors.text },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    minHeight: theme.controlHeight,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.field,
    paddingHorizontal: theme.spacing.lg,
  },
  searchInput: {
    flex: 1,
    minHeight: theme.controlHeight,
    fontFamily: theme.fonts.regular,
    fontSize: theme.fontSize.lead,
    color: theme.colors.text,
  },
  clear: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center', marginRight: -12 },
  touch: { minHeight: theme.minTouchSize, justifyContent: 'center' },
  listTitle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  separator: { height: theme.spacing.sm },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    padding: theme.spacing.md,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  rowIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.field,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loading: { marginTop: theme.spacing.xxl },
  empty: { gap: theme.spacing.sm, paddingVertical: theme.spacing.lg },
  actions: {
    position: 'absolute',
    left: theme.spacing.lg,
    right: theme.spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  scanButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    minHeight: 64,
    paddingLeft: theme.spacing.lg,
    paddingRight: theme.spacing.xl,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.ink,
  },
  scanIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.scannerButton,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanLabel: { fontFamily: theme.fonts.bold },
  addButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
});
