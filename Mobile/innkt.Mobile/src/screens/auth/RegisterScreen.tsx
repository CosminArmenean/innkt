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
  Divider,
} from 'react-native-paper';
import {useNavigation} from '@react-navigation/native';
import {StackNavigationProp} from '@react-navigation/stack';
import {useAuth, RegisterRequest} from '../../contexts/AuthContext';
import {useLanguage} from '../../contexts/LanguageContext';
import {RootStackParamList} from '../../types/navigation';
import LinearGradient from 'react-native-linear-gradient';

type RegisterScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Register'>;

const RegisterScreen: React.FC = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    emailConfirmation: '',
    password: '',
    passwordConfirmation: '',
    language: 'en',
  });

  const [jointAccountData, setJointAccountData] = useState({
    isJointAccount: false,
    secondUserFirstName: '',
    secondUserLastName: '',
    secondUserPassword: '',
    secondUserPasswordConfirmation: '',
    secondUserCountryCode: '',
    secondUserMobilePhone: '',
    secondUserBirthDate: '',
    secondUserGender: '',
  });

  const [consent, setConsent] = useState({
    acceptTerms: false,
    acceptPrivacyPolicy: false,
    acceptMarketing: false,
    acceptCookies: false,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showJointPassword, setShowJointPassword] = useState(false);

  const navigation = useNavigation<RegisterScreenNavigationProp>();
  const {register} = useAuth();
  const {t, isRTL, getAvailableLanguages} = useLanguage();
  const theme = useTheme();

  const languages = getAvailableLanguages();

  const updateFormData = (field: string, value: string) => {
    setFormData(prev => ({...prev, [field]: value}));
  };

  const updateJointAccountData = (field: string, value: string | boolean) => {
    setJointAccountData(prev => ({...prev, [field]: value}));
  };

  const updateConsent = (field: string, value: boolean) => {
    setConsent(prev => ({...prev, [field]: value}));
  };

  const validateForm = (): boolean => {
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      Alert.alert(t('common.error'), 'Please enter your first and last name');
      return false;
    }

    if (!formData.email.trim() || !formData.emailConfirmation.trim()) {
      Alert.alert(t('common.error'), 'Please enter and confirm your email');
      return false;
    }

    if (formData.email !== formData.emailConfirmation) {
      Alert.alert(t('common.error'), 'Email addresses do not match');
      return false;
    }

    if (!formData.password || !formData.passwordConfirmation) {
      Alert.alert(t('common.error'), 'Please enter and confirm your password');
      return false;
    }

    if (formData.password !== formData.passwordConfirmation) {
      Alert.alert(t('common.error'), 'Passwords do not match');
      return false;
    }

    if (formData.password.length < 8) {
      Alert.alert(t('common.error'), 'Password must be at least 8 characters long');
      return false;
    }

    if (jointAccountData.isJointAccount) {
      if (!jointAccountData.secondUserFirstName.trim() || !jointAccountData.secondUserLastName.trim()) {
        Alert.alert(t('common.error'), 'Please enter the second user\'s name');
        return false;
      }

      if (!jointAccountData.secondUserPassword || !jointAccountData.secondUserPasswordConfirmation) {
        Alert.alert(t('common.error'), 'Please enter and confirm the second user\'s password');
        return false;
      }

      if (jointAccountData.secondUserPassword !== jointAccountData.secondUserPasswordConfirmation) {
        Alert.alert(t('common.error'), 'Second user passwords do not match');
        return false;
      }

      if (jointAccountData.secondUserPassword.length < 8) {
        Alert.alert(t('common.error'), 'Second user password must be at least 8 characters long');
        return false;
      }
    }

    if (!consent.acceptTerms || !consent.acceptPrivacyPolicy) {
      Alert.alert(t('common.error'), 'You must accept the Terms of Service and Privacy Policy');
      return false;
    }

    return true;
  };

  const handleRegister = async () => {
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      const registerData: RegisterRequest = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim(),
        password: formData.password,
        language: formData.language,
        isJointAccount: jointAccountData.isJointAccount,
        acceptTerms: consent.acceptTerms,
        acceptPrivacyPolicy: consent.acceptPrivacyPolicy,
        acceptMarketing: consent.acceptMarketing,
        acceptCookies: consent.acceptCookies,
      };

      if (jointAccountData.isJointAccount) {
        registerData.jointAccount = {
          secondUserFirstName: jointAccountData.secondUserFirstName.trim(),
          secondUserLastName: jointAccountData.secondUserLastName.trim(),
          secondUserPassword: jointAccountData.secondUserPassword,
          secondUserPasswordConfirmation: jointAccountData.secondUserPasswordConfirmation,
          secondUserCountryCode: jointAccountData.secondUserCountryCode,
          secondUserMobilePhone: jointAccountData.secondUserMobilePhone,
          secondUserBirthDate: jointAccountData.secondUserBirthDate,
          secondUserGender: jointAccountData.secondUserGender,
        };
      }

      const success = await register(registerData);
      if (success) {
        console.log('Registration successful');
        // Navigation will be handled automatically by the auth state change
      }
    } catch (error) {
      console.error('Registration error:', error);
      Alert.alert(t('common.error'), t('error.auth'));
    } finally {
      setIsLoading(false);
    }
  };

  const navigateToLogin = () => {
    navigation.navigate('Login');
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
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.brandTitle}>Innkt</Text>
              <Text style={styles.brandSubtitle}>{t('auth.register')}</Text>
            </View>

            {/* Registration Form Card */}
            <Card style={[styles.registerCard, {backgroundColor: theme.colors.surface}]}>
              <Card.Content style={styles.cardContent}>
                <Text style={[styles.title, {color: theme.colors.onSurface}]}>
                  {t('auth.createAccount')}
                </Text>

                {/* Personal Information Section */}
                <View style={styles.section}>
                  <Text style={[styles.sectionTitle, {color: theme.colors.onSurface}]}>
                    {t('register.personalInformation')}
                  </Text>
                  
                  <View style={styles.row}>
                    <TextInput
                      label={t('register.firstName')}
                      value={formData.firstName}
                      onChangeText={(value) => updateFormData('firstName', value)}
                      mode="outlined"
                      style={[styles.input, styles.halfInput]}
                      theme={theme}
                    />
                    <TextInput
                      label={t('register.lastName')}
                      value={formData.lastName}
                      onChangeText={(value) => updateFormData('lastName', value)}
                      mode="outlined"
                      style={[styles.input, styles.halfInput]}
                      theme={theme}
                    />
                  </View>

                  <TextInput
                    label={t('auth.email')}
                    value={formData.email}
                    onChangeText={(value) => updateFormData('email', value)}
                    mode="outlined"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    style={styles.input}
                    theme={theme}
                    left={<TextInput.Icon icon="email" />}
                  />

                  <TextInput
                    label={t('register.emailConfirmation')}
                    value={formData.emailConfirmation}
                    onChangeText={(value) => updateFormData('emailConfirmation', value)}
                    mode="outlined"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    style={styles.input}
                    theme={theme}
                    left={<TextInput.Icon icon="email-check" />}
                  />

                  <TextInput
                    label={t('auth.password')}
                    value={formData.password}
                    onChangeText={(value) => updateFormData('password', value)}
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

                  <TextInput
                    label={t('register.passwordConfirmation')}
                    value={formData.passwordConfirmation}
                    onChangeText={(value) => updateFormData('passwordConfirmation', value)}
                    mode="outlined"
                    secureTextEntry={!showPassword}
                    style={styles.input}
                    theme={theme}
                    left={<TextInput.Icon icon="lock-check" />}
                  />

                  <TextInput
                    label={t('register.language')}
                    value={formData.language}
                    onChangeText={(value) => updateFormData('language', value)}
                    mode="outlined"
                    style={styles.input}
                    theme={theme}
                    left={<TextInput.Icon icon="translate" />}
                    render={({value, ...props}) => (
                      <TextInput
                        {...props}
                        value={languages.find(lang => lang.code === value)?.nativeName || value}
                        right={<TextInput.Icon icon="chevron-down" />}
                      />
                    )}
                  />
                </View>

                {/* Joint Account Section */}
                <View style={styles.section}>
                  <Checkbox
                    status={jointAccountData.isJointAccount ? 'checked' : 'unchecked'}
                    onPress={() => updateJointAccountData('isJointAccount', !jointAccountData.isJointAccount)}
                  />
                  <Text style={[styles.checkboxLabel, {color: theme.colors.onSurface}]}>
                    {t('register.jointAccount')}
                  </Text>
                  <Text style={[styles.checkboxDescription, {color: theme.colors.onSurfaceVariant}]}>
                    {t('register.jointAccountDescription')}
                  </Text>

                  {jointAccountData.isJointAccount && (
                    <View style={styles.jointAccountForm}>
                      <Divider style={styles.divider} />
                      
                      <View style={styles.row}>
                        <TextInput
                          label={t('register.secondUserFirstName')}
                          value={jointAccountData.secondUserFirstName}
                          onChangeText={(value) => updateJointAccountData('secondUserFirstName', value)}
                          mode="outlined"
                          style={[styles.input, styles.halfInput]}
                          theme={theme}
                        />
                        <TextInput
                          label={t('register.secondUserLastName')}
                          value={jointAccountData.secondUserLastName}
                          onChangeText={(value) => updateJointAccountData('secondUserLastName', value)}
                          mode="outlined"
                          style={[styles.input, styles.halfInput]}
                          theme={theme}
                        />
                      </View>

                      <TextInput
                        label={t('register.secondUserPassword')}
                        value={jointAccountData.secondUserPassword}
                        onChangeText={(value) => updateJointAccountData('secondUserPassword', value)}
                        mode="outlined"
                        secureTextEntry={!showJointPassword}
                        style={styles.input}
                        theme={theme}
                        left={<TextInput.Icon icon="lock" />}
                        right={
                          <TextInput.Icon
                            icon={showJointPassword ? 'eye-off' : 'eye'}
                            onPress={() => setShowJointPassword(!showJointPassword)}
                          />
                        }
                      />

                      <TextInput
                        label={t('register.secondUserPasswordConfirmation')}
                        value={jointAccountData.secondUserPasswordConfirmation}
                        onChangeText={(value) => updateJointAccountData('secondUserPasswordConfirmation', value)}
                        mode="outlined"
                        secureTextEntry={!showJointPassword}
                        style={styles.input}
                        theme={theme}
                        left={<TextInput.Icon icon="lock-check" />}
                      />

                      <View style={styles.row}>
                        <TextInput
                          label={t('register.secondUserCountryCode')}
                          value={jointAccountData.secondUserCountryCode}
                          onChangeText={(value) => updateJointAccountData('secondUserCountryCode', value)}
                          mode="outlined"
                          placeholder="+1"
                          style={[styles.input, styles.halfInput]}
                          theme={theme}
                        />
                        <TextInput
                          label={t('register.secondUserMobilePhone')}
                          value={jointAccountData.secondUserMobilePhone}
                          onChangeText={(value) => updateJointAccountData('secondUserMobilePhone', value)}
                          mode="outlined"
                          keyboardType="phone-pad"
                          style={[styles.input, styles.halfInput]}
                          theme={theme}
                        />
                      </View>

                      <View style={styles.row}>
                        <TextInput
                          label={t('register.secondUserBirthDate')}
                          value={jointAccountData.secondUserBirthDate}
                          onChangeText={(value) => updateJointAccountData('secondUserBirthDate', value)}
                          mode="outlined"
                          style={[styles.input, styles.halfInput]}
                          theme={theme}
                          left={<TextInput.Icon icon="calendar" />}
                        />
                        <TextInput
                          label={t('register.secondUserGender')}
                          value={jointAccountData.secondUserGender}
                          onChangeText={(value) => updateJointAccountData('secondUserGender', value)}
                          mode="outlined"
                          style={[styles.input, styles.halfInput]}
                          theme={theme}
                          left={<TextInput.Icon icon="account" />}
                        />
                      </View>
                    </View>
                  )}
                </View>

                {/* Consent Section */}
                <View style={styles.section}>
                  <Text style={[styles.sectionTitle, {color: theme.colors.onSurface}]}>
                    {t('register.consent')}
                  </Text>
                  
                  <View style={styles.consentItem}>
                    <Checkbox
                      status={consent.acceptTerms ? 'checked' : 'unchecked'}
                      onPress={() => updateConsent('acceptTerms', !consent.acceptTerms)}
                    />
                    <Text style={[styles.consentText, {color: theme.colors.onSurface}]}>
                      {t('register.acceptTerms')}
                    </Text>
                  </View>

                  <View style={styles.consentItem}>
                    <Checkbox
                      status={consent.acceptPrivacyPolicy ? 'checked' : 'unchecked'}
                      onPress={() => updateConsent('acceptPrivacyPolicy', !consent.acceptPrivacyPolicy)}
                    />
                    <Text style={[styles.consentText, {color: theme.colors.onSurface}]}>
                      {t('register.acceptPrivacyPolicy')}
                    </Text>
                  </View>

                  <View style={styles.consentItem}>
                    <Checkbox
                      status={consent.acceptMarketing ? 'checked' : 'unchecked'}
                      onPress={() => updateConsent('acceptMarketing', !consent.acceptMarketing)}
                    />
                    <Text style={[styles.consentText, {color: theme.colors.onSurface}]}>
                      {t('register.acceptMarketing')}
                    </Text>
                  </View>

                  <View style={styles.consentItem}>
                    <Checkbox
                      status={consent.acceptCookies ? 'checked' : 'unchecked'}
                      onPress={() => updateConsent('acceptCookies', !consent.acceptCookies)}
                    />
                    <Text style={[styles.consentText, {color: theme.colors.onSurface}]}>
                      {t('register.acceptCookies')}
                    </Text>
                  </View>
                </View>

                {/* Register Button */}
                <Button
                  mode="contained"
                  onPress={handleRegister}
                  loading={isLoading}
                  disabled={isLoading}
                  style={styles.registerButton}
                  contentStyle={styles.registerButtonContent}
                  labelStyle={styles.registerButtonLabel}>
                  {isLoading ? t('common.loading') : t('auth.signUp')}
                </Button>

                {/* Login Link */}
                <View style={styles.loginSection}>
                  <Text style={[styles.loginText, {color: theme.colors.onSurfaceVariant}]}>
                    {t('auth.alreadyHaveAccount')}
                  </Text>
                  <Button
                    mode="text"
                    onPress={navigateToLogin}
                    textColor={theme.colors.primary}>
                    {t('auth.signIn')}
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
    padding: 20,
  },
  content: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  brandTitle: {
    fontSize: 36,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  brandSubtitle: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  registerCard: {
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
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  input: {
    marginBottom: 16,
  },
  halfInput: {
    flex: 1,
  },
  checkboxLabel: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '500',
  },
  checkboxDescription: {
    marginLeft: 32,
    fontSize: 14,
    marginTop: 4,
  },
  jointAccountForm: {
    marginTop: 16,
  },
  divider: {
    marginVertical: 16,
  },
  consentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  consentText: {
    marginLeft: 8,
    fontSize: 14,
    flex: 1,
  },
  registerButton: {
    borderRadius: 8,
    marginBottom: 24,
  },
  registerButtonContent: {
    height: 48,
  },
  registerButtonLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  loginSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  loginText: {
    fontSize: 16,
  },
});

export default RegisterScreen;






