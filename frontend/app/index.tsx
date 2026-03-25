import { Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { useAuth } from '../src/contexts/AuthContext';
import { authGateStyles as styles } from '../src/styles/authGate.styles';

export default function Index() {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366F1" />
      </View>
    );
  }

  if (!session) {
    return <Redirect href="/login" />;
  }

  return <Redirect href="/dashboard/spending" />;
}
