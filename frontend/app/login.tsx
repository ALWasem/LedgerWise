import { Redirect } from 'expo-router';
import LoginScreen from '../src/components/LoginScreen';
import { useAuth } from '../src/contexts/AuthContext';

export default function Login() {
  const { session } = useAuth();

  if (session) {
    return <Redirect href="/dashboard/spending" />;
  }

  return <LoginScreen />;
}
