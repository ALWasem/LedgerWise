import { Redirect, Slot, usePathname, useRouter } from 'expo-router';
import { Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/contexts/AuthContext';
import LedgerWiseLogo from '../../src/components/LedgerWiseLogo';
import { dashboardLayoutStyles as styles } from '../../src/styles/dashboardLayout.styles';

interface NavItem {
  name: string;
  path: '/dashboard/overview' | '/dashboard/spending' | '/dashboard/analytics' | '/dashboard/settings';
  icon: keyof typeof Ionicons.glyphMap;
}

const navItems: NavItem[] = [
  { name: 'Overview', path: '/dashboard/overview', icon: 'trending-up' },
  { name: 'Spending', path: '/dashboard/spending', icon: 'pie-chart-outline' },
  { name: 'Analytics', path: '/dashboard/analytics', icon: 'bar-chart-outline' },
  { name: 'Settings', path: '/dashboard/settings', icon: 'settings-outline' },
];

export default function DashboardLayout() {
  const { session, signOut } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  if (!session) {
    return <Redirect href="/login" />;
  }

  const isWeb = Platform.OS === 'web';

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <LedgerWiseLogo size={32} />
          <Text style={styles.headerTitle}>LedgerWise</Text>
        </View>
        <Pressable
          style={(state) => [
            styles.signOutButton,
            (state as unknown as { hovered: boolean }).hovered && styles.signOutButtonHovered,
          ]}
          onPress={signOut}
        >
          <Ionicons name="log-out-outline" size={16} color="#525252" />
          <Text style={styles.signOutText}>Sign Out</Text>
        </Pressable>
      </View>

      <View style={styles.body}>
        {/* Sidebar (web only) */}
        {isWeb && (
          <View style={styles.sidebar}>
            <ScrollView style={styles.sidebarNav} showsVerticalScrollIndicator={false}>
              {navItems.map((item) => {
                const isActive = pathname === item.path || pathname.startsWith(item.path + '/');
                return (
                  <Pressable
                    key={item.path}
                    style={(state) => [
                      styles.navItem,
                      isActive && styles.navItemActive,
                      (state as unknown as { hovered: boolean }).hovered && !isActive && styles.navItemHovered,
                    ]}
                    onPress={() => router.push(item.path)}
                  >
                    <Ionicons
                      name={item.icon}
                      size={20}
                      color={isActive ? '#6366F1' : '#737373'}
                    />
                    <Text style={[styles.navText, isActive && styles.navTextActive]}>
                      {item.name}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            {/* Pro Tip card */}
            <View style={styles.proTipCard}>
              <Text style={styles.proTipTitle}>Pro Tip</Text>
              <Text style={styles.proTipText}>
                Categorize all transactions to get better insights
              </Text>
            </View>
          </View>
        )}

        {/* Main content */}
        <View style={styles.content}>
          <Slot />
        </View>
      </View>

      {/* Bottom tabs (mobile only) */}
      {!isWeb && (
        <View style={styles.bottomBar}>
          {navItems.map((item) => {
            const isActive = pathname === item.path || pathname.startsWith(item.path + '/');
            return (
              <Pressable
                key={item.path}
                style={styles.bottomTab}
                onPress={() => router.push(item.path)}
              >
                <Ionicons
                  name={item.icon}
                  size={22}
                  color={isActive ? '#6366F1' : '#A3A3A3'}
                />
                <Text style={[styles.bottomTabText, isActive && styles.bottomTabTextActive]}>
                  {item.name}
                </Text>
              </Pressable>
            );
          })}
        </View>
      )}
    </View>
  );
}
