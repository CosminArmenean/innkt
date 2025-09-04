import React, {useState} from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import {
  Text,
  TextInput,
  Button,
  Card,
  Checkbox,
  useTheme,
} from 'react-native-paper';
import {useNavigation} from '@react-navigation/native';
import {StackNavigationProp} from '@react-navigation/stack';
import {useAuth} from '../../contexts/AuthContext';
import {useLanguage} from '../../contexts/LanguageContext';
import {RootStackParamList} from '../../types/navigation';
import LinearGradient from 'react-native-linear-gradient';

type LoginScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Login'>;

const LoginScreen: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const navigation = useNavigation<LoginScreenNavigationProp>();
  const {login} = useAuth();
  const {t, isRTL} = useLanguage();
  const theme = useTheme();

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert(t('common.error'), t('error.validation'));
      return;
    }

    setIsLoading(true);
    try {
      const success = await login({email: email.trim(), password});
      if (success) {
        // Navigation will be handled automatically by the auth state change
        console.log('Login successful');
      }
    } catch (error) {
      console.error('Login error:', error);
      Alert.alert(t('common.error'), t('error.auth'));
    } finally {
      setIsLoading(false);
    }
  };

  const navigateToRegister = () => {
    navigation.navigate('Register');
  };

  return (
    <LinearGradient
      colors={[theme.colors.primary, theme.colors.secondary]}
      style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}>
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}>
          <View style={styles.content}>
            {/* Logo/Brand Section */}
            <View style={styles.brandSection}>
              <Text style={styles.brandTitle}>Innkt</Text>
              <Text style={styles.brandSubtitle}>
                {t('auth.login')} - {t('common.loading')}
              </Text>
            </View>

            {/* Login Form Card */}
            <Card style={[styles.loginCard, {backgroundColor: theme.colors.surface}]}>
              <Card.Content style={styles.cardContent}>
                <Text style={[styles.title, {color: theme.colors.onSurface}]}>
                  {t('auth.welcome')}
                </Text>
                <Text style={[styles.subtitle, {color: theme.colors.onSurfaceVariant}]}>
                  {t('auth.signIn')} {t('auth.toContinue')}
                </Text>

                {/* Email Input */}
                <TextInput
                  label={t('auth.email')}
                  value={email}
                  onChangeText={setEmail}
                  mode="outlined"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  style={styles.input}
                  theme={theme}
                  left={<TextInput.Icon icon="email" />}
                />

                {/* Password Input */}
                <TextInput
                  label={t('auth.password')}
                  value={password}
                  onChangeText={setPassword}
                  mode="outlined"
                  secureTextEntry={!showPassword}
                  style={styles.input}
                  theme={theme}
                  left={<TextInput.Icon icon="lock" />}
                  right={
                    <TextInput.Icon
                      icon={showPassword ? 'eye-off' : 'eye'}
                      onPress={() => setShowPassword(!showPassword)}
                    />
                  }
                />

                {/* Remember Me & Forgot Password */}
                <View style={styles.optionsRow}>
                  <Checkbox
                    status={rememberMe ? 'checked' : 'unchecked'}
                    onPress={() => setRememberMe(!rememberMe)}
                  />
                  <Text style={[styles.checkboxLabel, {color: theme.colors.onSurface}]}>
                    {t('auth.rememberMe')}
                  </Text>
                  <Button
                    mode="text"
                    onPress={() => {
                      // TODO: Implement forgot password
                      Alert.alert('Info', 'Forgot password feature coming soon!');
                    }}
                    style={styles.forgotPasswordButton}>
                    {t('auth.forgotPassword')}
                  </Button>
                </View>

                {/* Login Button */}
                <Button
                  mode="contained"
                  onPress={handleLogin}
                  loading={isLoading}
                  disabled={isLoading || !email.trim() || !password.trim()}
                  style={styles.loginButton}
                  contentStyle={styles.loginButtonContent}
                  labelStyle={styles.loginButtonLabel}>
                  {isLoading ? t('common.loading') : t('auth.signIn')}
                </Button>

                {/* Divider */}
                <View style={styles.divider}>
                  <View style={[styles.dividerLine, {backgroundColor: theme.colors.outline}]} />
                  <Text style={[styles.dividerText, {color: theme.colors.onSurfaceVariant}]}>
                    {t('common.or')}
                  </Text>
                  <View style={[styles.dividerLine, {backgroundColor: theme.colors.outline}]} />
                </View>

                {/* Social Login Buttons */}
                <View style={styles.socialButtons}>
                  <Button
                    mode="outlined"
                    icon="google"
                    onPress={() => {
                      // TODO: Implement Google login
                      Alert.alert('Info', 'Google login coming soon!');
                    }}
                    style={[styles.socialButton, {borderColor: theme.colors.outline}]}
                    textColor={theme.colors.onSurface}>
                    {t('auth.continueWithGoogle')}
                  </Button>

                  <Button
                    mode="outlined"
                    icon="facebook"
                    onPress={() => {
                      // TODO: Implement Facebook login
                      Alert.alert('Info', 'Facebook login coming soon!');
                    }}
                    style={[styles.socialButton, {borderColor: theme.colors.outline}]}
                    textColor={theme.colors.onSurface}>
                    {t('auth.continueWithFacebook')}
                  </Button>
                </View>

                {/* Register Link */}
                <View style={styles.registerSection}>
                  <Text style={[styles.registerText, {color: theme.colors.onSurfaceVariant}]}>
                    {t('auth.dontHaveAccount')}
                  </Text>
                  <Button
                    mode="text"
                    onPress={navigateToRegister}
                    textColor={theme.colors.primary}>
                    {t('auth.signUp')}
                  </Button>
                </View>
              </Card.Content>
            </Card>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  brandSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  brandTitle: {
    fontSize: 48,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  brandSubtitle: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  loginCard: {
    borderRadius: 16,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  cardContent: {
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
  },
  input: {
    marginBottom: 16,
  },
  optionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  checkboxLabel: {
    marginLeft: 8,
    flex: 1,
  },
  forgotPasswordButton: {
    marginLeft: 'auto',
  },
  loginButton: {
    borderRadius: 8,
    marginBottom: 24,
  },
  loginButtonContent: {
    height: 48,
  },
  loginButtonLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 14,
  },
  socialButtons: {
    gap: 12,
    marginBottom: 24,
  },
  socialButton: {
    borderRadius: 8,
    height: 48,
  },
  registerSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  registerText: {
    fontSize: 16,
  },
});

export default LoginScreen;





