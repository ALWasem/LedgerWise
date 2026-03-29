import { Pressable, ScrollView, Text, View } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useThemeStyles } from '../hooks/useThemeStyles';
import { createAuthStyles } from '../styles/auth.styles';
import { isHovered } from '../utils/pressable';
import LedgerWiseLogo from './icons/LedgerWiseLogo';
import GoogleIcon from './icons/GoogleIcon';

export default function LoginScreen() {
  const { signInWithGoogle } = useAuth();
  const authStyles = useThemeStyles(createAuthStyles);

  return (
    <ScrollView
      contentContainerStyle={authStyles.scrollContent}
      style={authStyles.scrollView}
    >
      <View style={authStyles.container}>
        {/* Decorative background elements */}
        <View style={authStyles.bgCircleTopRight} />
        <View style={authStyles.bgCircleBottomLeft} />
        <View style={authStyles.bgGeometric1} />
        <View style={authStyles.bgGeometric2} />
        <View style={authStyles.bgGeometric3} />
        <View style={authStyles.bgGeometric4} />

        {/* Login Card */}
        <View style={authStyles.card}>
          {/* Logo and Branding */}
          <View style={authStyles.brandingContainer}>
            <View style={authStyles.logoWrapper}>
              <LedgerWiseLogo size={64} />
            </View>
            <Text style={authStyles.title}>LedgerWise</Text>
            <Text style={authStyles.subtitle}>Your finances, simplified</Text>
          </View>

          {/* Divider */}
          <View style={authStyles.dividerContainer}>
            <View style={authStyles.dividerLine} />
            <View style={authStyles.dividerTextWrapper}>
              <Text style={authStyles.dividerText}>Sign in to continue</Text>
            </View>
          </View>

          {/* Google Sign In Button */}
          <Pressable
            style={(state) => [
              authStyles.googleButton,
              isHovered(state) && authStyles.googleButtonHovered,
              state.pressed && authStyles.googleButtonPressed,
            ]}
            onPress={signInWithGoogle}
          >
            <GoogleIcon size={20} />
            <Text style={authStyles.googleButtonText}>Sign in with Google</Text>
          </Pressable>

          {/* Footer */}
          <View style={authStyles.footerContainer}>
            <Text style={authStyles.footerText}>
              By continuing, you agree to our{' '}
              <Text style={authStyles.footerLink}>Terms</Text> and{' '}
              <Text style={authStyles.footerLink}>Privacy Policy</Text>
            </Text>
          </View>
        </View>

        {/* Bottom Tagline */}
        <View style={authStyles.taglineContainer}>
          <Text style={authStyles.taglineText}>
            Trusted by thousands to manage their finances
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}
