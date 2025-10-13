import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { 
  UserIcon, 
  CalendarIcon, 
  PhotoIcon, 
  SparklesIcon,
  UserGroupIcon,
  EyeIcon,
  EyeSlashIcon
} from '@heroicons/react/24/outline';
import UsernameInput from '../common/UsernameInput';

interface RegistrationData {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  username: string;
  birthDate: string;
  avatar?: string;
  useAiBackgroundRemoval: boolean;
  createKidsAccount: boolean;
  kidsAccounts: KidsAccountData[];
  acceptTerms: boolean;
  acceptPrivacyPolicy: boolean;
}

interface KidsAccountData {
  firstName: string;
  lastName: string;
  username: string;
  birthDate: string;
  avatar?: string;
}

const EnhancedRegister: React.FC = () => {
  const { t } = useTranslation();
  const { register } = useAuth();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState<RegistrationData>({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    username: '',
    birthDate: '',
    useAiBackgroundRemoval: false,
    createKidsAccount: false,
    kidsAccounts: [],
    acceptTerms: false,
    acceptPrivacyPolicy: false,
  });

  const totalSteps = 4;

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    // Helper functions for validation
    const isValidName = (name: string): boolean => {
      return /^[a-zA-Z\s]+$/.test(name);
    };

    const isValidUsername = (username: string): boolean => {
      return /^[a-zA-Z0-9.]+$/.test(username);
    };

    switch (step) {
      case 1:
        if (!formData.email) newErrors.email = t('auth.validation.emailRequired');
        else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = t('auth.validation.emailInvalid');
        
        if (!formData.password) newErrors.password = t('auth.validation.passwordRequired');
        else if (formData.password.length < 8) newErrors.password = t('auth.validation.passwordTooShort');
        
        if (!formData.confirmPassword) newErrors.confirmPassword = t('auth.validation.confirmPasswordRequired');
        else if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = t('auth.validation.passwordsDoNotMatch');
        break;

      case 2:
        if (!formData.firstName) newErrors.firstName = t('auth.validation.firstNameRequired');
        else if (!isValidName(formData.firstName)) newErrors.firstName = t('auth.validation.firstNameInvalid');
        
        if (!formData.lastName) newErrors.lastName = t('auth.validation.lastNameRequired');
        else if (!isValidName(formData.lastName)) newErrors.lastName = t('auth.validation.lastNameInvalid');
        
        if (!formData.username) newErrors.username = t('auth.validation.usernameRequired');
        else if (formData.username.length < 3) newErrors.username = t('auth.validation.usernameTooShort');
        else if (!isValidUsername(formData.username)) newErrors.username = t('auth.validation.usernameInvalid');
        else if (formData.username.startsWith('.') || formData.username.endsWith('.')) newErrors.username = t('auth.validation.usernameNoDots');
        else if (formData.username.includes('..')) newErrors.username = t('auth.validation.usernameNoConsecutiveDots');
        
        if (!formData.birthDate) newErrors.birthDate = t('auth.validation.birthDateRequired');
        break;

      case 3:
        // No validation needed for preferences
        break;

      case 4:
        if (!formData.acceptTerms) newErrors.acceptTerms = t('auth.validation.termsRequired');
        if (!formData.acceptPrivacyPolicy) newErrors.acceptPrivacyPolicy = t('auth.validation.privacyRequired');
        
        // Validate kids accounts if they are being created
        if (formData.createKidsAccount) {
          formData.kidsAccounts.forEach((kid, index) => {
            const childNumber = index + 1;
            if (!kid.firstName) newErrors[`kid_${index}_firstName`] = t('auth.validation.childFirstNameRequired', { number: childNumber });
            else if (!isValidName(kid.firstName)) newErrors[`kid_${index}_firstName`] = t('auth.validation.firstNameInvalid');
            
            if (!kid.lastName) newErrors[`kid_${index}_lastName`] = t('auth.validation.childLastNameRequired', { number: childNumber });
            else if (!isValidName(kid.lastName)) newErrors[`kid_${index}_lastName`] = t('auth.validation.lastNameInvalid');
            
            if (!kid.username) newErrors[`kid_${index}_username`] = t('auth.validation.childUsernameRequired', { number: childNumber });
            else if (kid.username.length < 3) newErrors[`kid_${index}_username`] = t('auth.validation.usernameTooShort');
            else if (!isValidUsername(kid.username)) newErrors[`kid_${index}_username`] = t('auth.validation.usernameInvalid');
            else if (kid.username.startsWith('.') || kid.username.endsWith('.')) newErrors[`kid_${index}_username`] = t('auth.validation.usernameNoDots');
            else if (kid.username.includes('..')) newErrors[`kid_${index}_username`] = t('auth.validation.usernameNoConsecutiveDots');
            
            if (!kid.birthDate) newErrors[`kid_${index}_birthDate`] = t('auth.validation.childBirthDateRequired', { number: childNumber });
          });
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, totalSteps));
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (!validateStep(4)) return;

    setIsLoading(true);
    try {
      const success = await register(formData);
      if (success) {
        navigate('/setup-2fa');
      }
    } catch (error) {
      console.error('Registration failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const addKidsAccount = () => {
    setFormData(prev => ({
      ...prev,
      kidsAccounts: [...prev.kidsAccounts, { firstName: '', lastName: '', username: '', birthDate: '' }]
    }));
  };

  const updateKidsAccount = (index: number, field: keyof KidsAccountData, value: string) => {
    setFormData(prev => ({
      ...prev,
      kidsAccounts: prev.kidsAccounts.map((kid, i) => 
        i === index ? { ...kid, [field]: value } : kid
      )
    }));
  };

  const removeKidsAccount = (index: number) => {
    setFormData(prev => ({
      ...prev,
      kidsAccounts: prev.kidsAccounts.filter((_, i) => i !== index)
    }));
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">{t('auth.createYourAccount')}</h2>
            <p className="text-gray-600">{t('auth.basicInformation')}</p>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('auth.emailAddress')}</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder={t('auth.enterEmail')}
              />
              {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('auth.password')}</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder={t('auth.createStrongPassword')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPassword ? <EyeSlashIcon className="h-5 w-5 text-gray-400" /> : <EyeIcon className="h-5 w-5 text-gray-400" />}
                </button>
              </div>
              {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('auth.confirmPassword')}</label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder={t('auth.confirmYourPassword')}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showConfirmPassword ? <EyeSlashIcon className="h-5 w-5 text-gray-400" /> : <EyeIcon className="h-5 w-5 text-gray-400" />}
                </button>
              </div>
              {errors.confirmPassword && <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">{t('auth.personalInformation')}</h2>
            <p className="text-gray-600">{t('auth.tellUsAboutYourself')}</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('auth.firstName')}</label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^a-zA-Z\s]/g, '');
                    setFormData(prev => ({ ...prev, firstName: value }));
                  }}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                    errors.firstName ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder={t('auth.enterFirstName')}
                />
                {errors.firstName && <p className="text-red-500 text-sm mt-1">{errors.firstName}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('auth.lastName')}</label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^a-zA-Z\s]/g, '');
                    setFormData(prev => ({ ...prev, lastName: value }));
                  }}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                    errors.lastName ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder={t('auth.enterLastName')}
                />
                {errors.lastName && <p className="text-red-500 text-sm mt-1">{errors.lastName}</p>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('auth.username')}</label>
              <UsernameInput
                value={formData.username}
                onChange={(value) => setFormData(prev => ({ ...prev, username: value }))}
                placeholder={t('auth.chooseUsername')}
                showSuggestions={true}
                debounceMs={500}
                onValidationChange={(isValid, errors) => {
                  if (!isValid) {
                    setErrors(prev => ({ ...prev, username: errors.join(', ') }));
                  } else {
                    setErrors(prev => {
                      const newErrors = { ...prev };
                      delete newErrors.username;
                      return newErrors;
                    });
                  }
                }}
              />
              {errors.username && <p className="text-red-500 text-sm mt-1">{errors.username}</p>}
              {formData.username && formData.username.length >= 3 && !errors.username && (
                <p className="text-green-600 text-sm mt-1">✓ {t('auth.usernameAvailable')}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('auth.birthDate')}</label>
              <input
                type="date"
                value={formData.birthDate}
                onChange={(e) => setFormData(prev => ({ ...prev, birthDate: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              {errors.birthDate && <p className="text-red-500 text-sm mt-1">{errors.birthDate}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('auth.profilePicture')}</label>
              <div className="flex items-center space-x-4">
                <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center">
                  {formData.avatar ? (
                    <img src={formData.avatar} alt="Profile" className="w-20 h-20 rounded-full object-cover" />
                  ) : (
                    <UserIcon className="h-8 w-8 text-gray-400" />
                  )}
                </div>
                <div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (e) => {
                          setFormData(prev => ({ ...prev, avatar: e.target?.result as string }));
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="hidden"
                    id="avatar-upload"
                  />
                  <label
                    htmlFor="avatar-upload"
                    className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 cursor-pointer transition-colors"
                  >
                    {t('auth.uploadPhoto')}
                  </label>
                </div>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">{t('auth.preferences')}</h2>
            <p className="text-gray-600">{t('auth.customizeExperience')}</p>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center space-x-3">
                  <SparklesIcon className="h-6 w-6 text-purple-600" />
                  <div>
                    <h3 className="font-medium text-gray-900">{t('auth.aiBackgroundRemoval')}</h3>
                    <p className="text-sm text-gray-600">{t('auth.aiBackgroundDescription')}</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.useAiBackgroundRemoval}
                    onChange={(e) => setFormData(prev => ({ ...prev, useAiBackgroundRemoval: e.target.checked }))}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center space-x-3">
                  <UserGroupIcon className="h-6 w-6 text-purple-600" />
                  <div>
                    <h3 className="font-medium text-gray-900">{t('auth.kidsAccount')}</h3>
                    <p className="text-sm text-gray-600">{t('auth.kidsAccountDescription')}</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.createKidsAccount}
                    onChange={(e) => setFormData(prev => ({ ...prev, createKidsAccount: e.target.checked }))}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                </label>
              </div>
            </div>

            {formData.createKidsAccount && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">{t('auth.kidsAccount')}</h3>
                {formData.kidsAccounts.map((kid, index) => (
                  <div key={index} className="p-4 border border-gray-200 rounded-lg space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-gray-900">{t('auth.child')} {index + 1}</h4>
                      <button
                        type="button"
                        onClick={() => removeKidsAccount(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        {t('auth.removeChild')}
                      </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">{t('auth.firstName')}</label>
                        <input
                          type="text"
                          value={kid.firstName}
                          onChange={(e) => {
                            const value = e.target.value.replace(/[^a-zA-Z\s]/g, '');
                            updateKidsAccount(index, 'firstName', value);
                          }}
                          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                            errors[`kid_${index}_firstName`] ? 'border-red-300' : 'border-gray-300'
                          }`}
                          placeholder={t('auth.childsFirstName')}
                        />
                        {errors[`kid_${index}_firstName`] && (
                          <p className="text-red-500 text-sm mt-1">{errors[`kid_${index}_firstName`]}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">{t('auth.lastName')}</label>
                        <input
                          type="text"
                          value={kid.lastName}
                          onChange={(e) => {
                            const value = e.target.value.replace(/[^a-zA-Z\s]/g, '');
                            updateKidsAccount(index, 'lastName', value);
                          }}
                          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                            errors[`kid_${index}_lastName`] ? 'border-red-300' : 'border-gray-300'
                          }`}
                          placeholder={t('auth.childsLastName')}
                        />
                        {errors[`kid_${index}_lastName`] && (
                          <p className="text-red-500 text-sm mt-1">{errors[`kid_${index}_lastName`]}</p>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">{t('auth.username')}</label>
                        <div className="relative">
                          <input
                            type="text"
                            value={kid.username}
                            onChange={(e) => {
                              const value = e.target.value.replace(/[^a-zA-Z0-9.]/g, '');
                              updateKidsAccount(index, 'username', value);
                            }}
                            className={`w-full px-3 py-2 pr-10 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                              errors[`kid_${index}_username`] ? 'border-red-300' :
                              kid.username && kid.username.length < 3 ? 'border-yellow-300' : 'border-gray-300'
                            }`}
                            placeholder={t('auth.childsUsername')}
                          />
                          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                            {kid.username && (
                              <div className={`w-4 h-4 rounded-full flex items-center justify-center ${
                                kid.username.length >= 3 ? 'bg-green-100' : 'bg-yellow-100'
                              }`}>
                                {kid.username.length >= 3 ? (
                                  <svg className="w-2 h-2 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                ) : (
                                  <div className="w-1 h-1 bg-yellow-500 rounded-full"></div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                        {kid.username && kid.username.length < 3 && (
                          <p className="text-yellow-600 text-xs mt-1">{t('auth.usernameTooShortHint')}</p>
                        )}
                        {errors[`kid_${index}_username`] && (
                          <p className="text-red-500 text-sm mt-1">{errors[`kid_${index}_username`]}</p>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">{t('auth.birthDate')}</label>
                        <input
                          type="date"
                          value={kid.birthDate}
                          onChange={(e) => updateKidsAccount(index, 'birthDate', e.target.value)}
                          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                            errors[`kid_${index}_birthDate`] ? 'border-red-300' : 'border-gray-300'
                          }`}
                        />
                        {errors[`kid_${index}_birthDate`] && (
                          <p className="text-red-500 text-sm mt-1">{errors[`kid_${index}_birthDate`]}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">{t('auth.profilePicture')}</label>
                        <div className="flex items-center space-x-2">
                          <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                            {kid.avatar ? (
                              <img src={kid.avatar} alt="Child" className="w-12 h-12 rounded-full object-cover" />
                            ) : (
                              <UserIcon className="h-6 w-6 text-gray-400" />
                            )}
                          </div>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onload = (e) => {
                                  updateKidsAccount(index, 'avatar', e.target?.result as string);
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                            className="hidden"
                            id={`kid-avatar-${index}`}
                          />
                          <label
                            htmlFor={`kid-avatar-${index}`}
                            className="bg-purple-600 text-white px-3 py-1 rounded text-sm hover:bg-purple-700 cursor-pointer transition-colors"
                          >
                            {t('auth.upload')}
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addKidsAccount}
                  className="w-full border-2 border-dashed border-gray-300 rounded-lg p-4 text-gray-600 hover:border-purple-400 hover:text-purple-600 transition-colors"
                >
                  + {t('auth.addAnotherChild')}
                </button>
              </div>
            )}
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">{t('auth.termsAndConditions')}</h2>
            <p className="text-gray-600">{t('auth.reviewAcceptTerms')}</p>
            
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <input
                  type="checkbox"
                  id="terms"
                  checked={formData.acceptTerms}
                  onChange={(e) => setFormData(prev => ({ ...prev, acceptTerms: e.target.checked }))}
                  className="mt-1 h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                />
                <label htmlFor="terms" className="text-sm text-gray-700">
                  {t('auth.agreeToTerms')} <Link to="/terms" className="text-purple-600 hover:text-purple-700">{t('auth.termsConditions')}</Link>
                </label>
              </div>
              {errors.acceptTerms && <p className="text-red-500 text-sm">{errors.acceptTerms}</p>}

              <div className="flex items-start space-x-3">
                <input
                  type="checkbox"
                  id="privacy"
                  checked={formData.acceptPrivacyPolicy}
                  onChange={(e) => setFormData(prev => ({ ...prev, acceptPrivacyPolicy: e.target.checked }))}
                  className="mt-1 h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                />
                <label htmlFor="privacy" className="text-sm text-gray-700">
                  {t('auth.agreeToPrivacy')} <Link to="/privacy" className="text-purple-600 hover:text-purple-700">{t('auth.privacyPolicy')}</Link>
                </label>
              </div>
              {errors.acceptPrivacyPolicy && <p className="text-red-500 text-sm">{errors.acceptPrivacyPolicy}</p>}
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-medium text-blue-900 mb-2">{t('auth.whatHappensNext')}</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• {t('auth.verifyEmail')}</li>
                <li>• {t('auth.setup2FA')}</li>
                <li>• {t('auth.accountReady')}</li>
              </ul>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full space-y-8">
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-2xl">I</span>
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">{t('auth.joinINNKT')}</h1>
          <p className="text-gray-600 mt-2">{t('auth.createAccountSteps')}</p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8">
          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">{t('auth.step')} {currentStep} {t('auth.of')} {totalSteps}</span>
              <span className="text-sm text-gray-500">{Math.round((currentStep / totalSteps) * 100)}% {t('auth.complete')}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(currentStep / totalSteps) * 100}%` }}
              ></div>
            </div>
          </div>

          {/* Step Content */}
          {renderStepContent()}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8">
            <button
              onClick={handlePrevious}
              disabled={currentStep === 1}
              className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {t('common.previous')}
            </button>

            {currentStep < totalSteps ? (
              <button
                onClick={handleNext}
                className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                {t('common.next')}
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={isLoading}
                className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? t('auth.creatingAccount') : t('auth.createAccount')}
              </button>
            )}
          </div>

          {/* Login Link */}
          <div className="text-center mt-6">
            <p className="text-gray-600">
              {t('auth.alreadyHaveAccount')}{' '}
              <Link to="/login" className="text-purple-600 hover:text-purple-700 font-medium">
                {t('auth.signInHere')}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedRegister;
