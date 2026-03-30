import { useEffect, useState } from 'react';
import { Redirect, Slot, usePathname, useRouter } from 'expo-router';
import { Platform, Pressable, ScrollView, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/contexts/AuthContext';
import { useColors } from '../../src/contexts/ThemeContext';
import { TransactionDataProvider } from '../../src/contexts/TransactionDataContext';
import { useThemeStyles } from '../../src/hooks/useThemeStyles';
import { createDashboardLayoutStyles } from '../../src/styles/dashboardLayout.styles';
import LedgerWiseLogo from '../../src/components/icons/LedgerWiseLogo';
import ThemeToggle from '../../src/components/ThemeToggle';
import { isHovered } from '../../src/utils/pressable';
import { SIDEBAR_BREAKPOINT, COMPACT_BREAKPOINT } from '../../src/utils/responsive';

interface NavItem {
  name: string;
  path: '/dashboard/overview' | '/dashboard/spending' | '/dashboard/analytics' | '/dashboard/categorize' | '/dashboard/settings';
  icon: keyof typeof Ionicons.glyphMap;
  activeIcon: keyof typeof Ionicons.glyphMap;
}

const navItems: NavItem[] = [
  { name: 'Overview', path: '/dashboard/overview', icon: 'trending-up', activeIcon: 'trending-up' },
  { name: 'Spending', path: '/dashboard/spending', icon: 'pie-chart-outline', activeIcon: 'pie-chart' },
  { name: 'Analytics', path: '/dashboard/analytics', icon: 'bar-chart-outline', activeIcon: 'bar-chart' },
  { name: 'Categorize', path: '/dashboard/categorize', icon: 'pricetags-outline', activeIcon: 'pricetags' },
  { name: 'Settings', path: '/dashboard/settings', icon: 'settings-outline', activeIcon: 'settings' },
];


export default function DashboardLayout() {
  const { session, signOut } = useAuth();
  const colors = useColors();
  const styles = useThemeStyles(createDashboardLayoutStyles);
  const pathname = usePathname();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  // On web, useWindowDimensions can return a stale/default width during SSR.
  // Default to mobile layout until the client has mounted and measured.
  const [mounted, setMounted] = useState(Platform.OS !== 'web');
  useEffect(() => { setMounted(true); }, []);

  if (!session) {
    return <Redirect href="/login" />;
  }

  const showSidebar = mounted && width >= SIDEBAR_BREAKPOINT;
  const collapsedSidebar = showSidebar && width < COMPACT_BREAKPOINT;
  const token = session.access_token ?? null;

  const isActive = (path: string) =>
    pathname === path || pathname.startsWith(path + '/');

  return (
    <TransactionDataProvider token={token}>
    <View style={styles.root}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + (showSidebar ? 20 : 12) }]}>
        <View style={styles.headerLeft}>
          <LedgerWiseLogo size={showSidebar ? 38 : 34} />
          <Text style={[styles.headerTitle, !showSidebar && styles.headerTitleMobile]}>LedgerWise</Text>
        </View>
        <View style={styles.headerRight}>
          <ThemeToggle />
          <Pressable
            style={(state) => [
              styles.signOutButton,
              isHovered(state) && styles.signOutButtonHovered,
            ]}
            onPress={signOut}
            accessibilityRole="button"
            accessibilityLabel="Sign out"
          >
            <Ionicons name="log-out-outline" size={16} color={colors.text.secondary} />
            <Text style={styles.signOutText}>Sign Out</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.body}>
        {/* Sidebar (wide screens only) */}
        {showSidebar && (
          <View style={[styles.sidebar, collapsedSidebar && styles.sidebarCollapsed]}>
            <ScrollView style={styles.sidebarNav} showsVerticalScrollIndicator={false}>
              {navItems.map((item) => {
                const active = isActive(item.path);
                return (
                  <Pressable
                    key={item.path}
                    style={(state) => [
                      styles.navItem,
                      collapsedSidebar && styles.navItemCollapsed,
                      active && styles.navItemActive,
                      isHovered(state) && !active && styles.navItemHovered,
                    ]}
                    onPress={() => router.push(item.path)}
                    accessibilityRole="tab"
                    accessibilityLabel={item.name}
                    accessibilityState={{ selected: active }}
                  >
                    {active && <View style={styles.navActiveIndicator} />}
                    <Ionicons
                      name={item.icon}
                      size={collapsedSidebar ? 22 : 20}
                      color={active ? colors.brand.primary : colors.text.tertiary}
                    />
                    {!collapsedSidebar && (
                      <Text style={[styles.navText, active && styles.navTextActive]}>
                        {item.name}
                      </Text>
                    )}
                  </Pressable>
                );
              })}
            </ScrollView>

            {/* Pro Tip card */}
            {!collapsedSidebar && (
              <View style={styles.proTipCard}>
                <Text style={styles.proTipTitle}>Pro Tip</Text>
                <Text style={styles.proTipText}>
                  Categorize all transactions to get better insights
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Main content */}
        <View style={styles.content}>
          <Slot />
        </View>
      </View>

      {/* Bottom tabs (narrow screens) */}
      {!showSidebar && (
        <View style={styles.bottomBar}>
          {navItems.map((item) => {
            const active = isActive(item.path);
            return (
              <Pressable
                key={item.path}
                style={styles.bottomTab}
                onPress={() => router.push(item.path)}
                accessibilityRole="tab"
                accessibilityLabel={item.name}
                accessibilityState={{ selected: active }}
              >
                <Ionicons
                  name={item.activeIcon}
                  size={26}
                  color={active ? colors.brand.primary : colors.text.tertiary}
                />
                <Text style={[styles.bottomTabText, active && styles.bottomTabTextActive]}>
                  {item.name}
                </Text>
              </Pressable>
            );
          })}
        </View>
      )}
    </View>
    </TransactionDataProvider>
  );
}
