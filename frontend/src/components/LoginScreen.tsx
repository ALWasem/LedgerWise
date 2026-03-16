import { Pressable, Text, View } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { authStyles } from '../styles/auth.styles';

export default function LoginScreen() {
  const { signInWithGoogle } = useAuth();

  return (
    <View style={authStyles.container}>
      <Text style={authStyles.title}>LedgerWise</Text>
      <Text style={authStyles.subtitle}>Your finances, simplified</Text>
      <Pressable
        style={({ pressed }) => [
          authStyles.googleButton,
          pressed && authStyles.googleButtonPressed,
        ]}
        onPress={signInWithGoogle}
      >
        <Text style={authStyles.googleButtonText}>Sign in with Google</Text>
      </Pressable>
    </View>
  );
}
