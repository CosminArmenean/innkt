import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Dimensions,
} from 'react-native';
import { useTheme } from 'react-native-paper';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { kidSafetyService } from '../../services/kidSafety/kidSafetyService';
import { adService } from '../../services/ads/adService';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AdManagerProps {
  placement: 'feed' | 'banner' | 'interstitial' | 'native';
  userId: string;
  isKidAccount?: boolean;
  onAdLoaded?: () => void;
  onAdError?: (error: string) => void;
  onAdClicked?: () => void;
}

interface AdData {
  id: string;
  type: 'banner' | 'native' | 'interstitial';
  title: string;
  description: string;
  imageUrl?: string;
  clickUrl: string;
  advertiser: string;
  category: string;
  isFamilyFriendly: boolean;
  gdprCompliant: boolean;
  targetAgeMin: number;
  targetAgeMax: number;
}

export const AdManager: React.FC<AdManagerProps> = ({
  placement,
  userId,
  isKidAccount = false,
  onAdLoaded,
  onAdError,
  onAdClicked,
}) => {
  const theme = useTheme();
  const { t } = useLanguage();
  const { user } = useAuth();
  
  const [adData, setAdData] = useState<AdData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasConsent, setHasConsent] = useState(false);
  const [showAd, setShowAd] = useState(false);

  // CRITICAL RULE: NO ADS FOR KIDS EVER!
  useEffect(() => {
    if (isKidAccount) {
      console.log('🛡️ KID ACCOUNT DETECTED - NO ADS WILL BE SHOWN');
      setShowAd(false);
      return;
    }
    
    initializeAdSystem();
  }, [isKidAccount, userId]);

  const initializeAdSystem = async () => {
    try {
      setIsLoading(true);

      // Check if user is adult (18+)
      const userAge = await getUserAge();
      if (userAge < 18) {
        console.log('🛡️ MINOR DETECTED - NO ADS WILL BE SHOWN');
        setShowAd(false);
        return;
      }

      // Check GDPR consent for EU users
      const gdprConsent = await checkGDPRConsent();
      setHasConsent(gdprConsent);

      // Load appropriate ad
      if (gdprConsent) {
        await loadAd();
      } else {
        await showConsentDialog();
      }

    } catch (error) {
      console.error('❌ Ad system initialization error:', error);
      onAdError?.('Failed to initialize ad system');
    } finally {
      setIsLoading(false);
    }
  };

  const getUserAge = async (): Promise<number> => {
    try {
      // Get user age from profile or calculate from birth date
      const userProfile = await AsyncStorage.getItem('user_profile');
      if (userProfile) {
        const profile = JSON.parse(userProfile);
        return profile.age || calculateAge(profile.birthDate) || 25; // Default adult age
      }
      return 25; // Default adult age if no profile
    } catch (error) {
      console.error('❌ Error getting user age:', error);
      return 25; // Default to adult age for safety
    }
  };

  const calculateAge = (birthDate: string): number => {
    if (!birthDate) return 25;
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const checkGDPRConsent = async (): Promise<boolean> => {
    try {
      // Check if user is in EU and needs GDPR consent
      const gdprRequired = await adService.isGDPRRequired(userId);
      if (!gdprRequired) return true;

      // Check existing consent
      const consent = await AsyncStorage.getItem('gdpr_ad_consent');
      return consent === 'granted';
    } catch (error) {
      console.error('❌ Error checking GDPR consent:', error);
      return false; // Default to no consent for safety
    }
  };

  const showConsentDialog = async () => {
    Alert.alert(
      t('ads.gdpr.title'),
      t('ads.gdpr.message'),
      [
        {
          text: t('ads.gdpr.reject'),
          onPress: () => {
            AsyncStorage.setItem('gdpr_ad_consent', 'rejected');
            setHasConsent(false);
            setShowAd(false);
          },
          style: 'cancel',
        },
        {
          text: t('ads.gdpr.accept'),
          onPress: async () => {
            await AsyncStorage.setItem('gdpr_ad_consent', 'granted');
            setHasConsent(true);
            await loadAd();
          },
        },
      ]
    );
  };

  const loadAd = async () => {
    try {
      // Get user preferences and targeting data
      const adPreferences = await getAdPreferences();
      
      // Request family-friendly ad
      const ad = await adService.requestAd({
        placement,
        userId,
        preferences: adPreferences,
        familyFriendly: true,
        gdprCompliant: hasConsent,
        excludeCategories: ['adult', 'gambling', 'alcohol', 'violence'],
        includeCategories: ['family', 'education', 'technology', 'health', 'travel'],
      });

      if (ad && ad.isFamilyFriendly) {
        setAdData(ad);
        setShowAd(true);
        onAdLoaded?.();
      } else {
        console.log('🛡️ No family-friendly ads available');
        setShowAd(false);
      }

    } catch (error) {
      console.error('❌ Error loading ad:', error);
      onAdError?.('Failed to load ad');
      setShowAd(false);
    }
  };

  const getAdPreferences = async () => {
    try {
      const preferences = await AsyncStorage.getItem('ad_preferences');
      return preferences ? JSON.parse(preferences) : {
        personalizedAds: hasConsent,
        categories: ['technology', 'education', 'family'],
        frequency: 'low', // Show fewer ads
      };
    } catch (error) {
      return { personalizedAds: false, categories: ['family'], frequency: 'low' };
    }
  };

  const handleAdClick = () => {
    if (!adData) return;

    // Log ad interaction
    adService.logAdInteraction({
      adId: adData.id,
      userId,
      action: 'click',
      placement,
    });

    onAdClicked?.();
    
    // Open ad URL (with safety checks)
    Alert.alert(
      t('ads.leaving.title'),
      t('ads.leaving.message', { advertiser: adData.advertiser }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { 
          text: t('ads.leaving.continue'), 
          onPress: () => {
            // Open external URL safely
            // Linking.openURL(adData.clickUrl);
          }
        },
      ]
    );
  };

  const handleReportAd = () => {
    if (!adData) return;

    Alert.alert(
      t('ads.report.title'),
      t('ads.report.message'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { 
          text: t('ads.report.inappropriate'), 
          onPress: () => reportAd('inappropriate')
        },
        { 
          text: t('ads.report.misleading'), 
          onPress: () => reportAd('misleading')
        },
        { 
          text: t('ads.report.other'), 
          onPress: () => reportAd('other')
        },
      ]
    );
  };

  const reportAd = async (reason: string) => {
    try {
      await adService.reportAd({
        adId: adData!.id,
        userId,
        reason,
        placement,
      });
      
      Alert.alert(
        t('ads.report.thanks'),
        t('ads.report.thanksMessage')
      );
      
      // Hide the reported ad
      setShowAd(false);
      
    } catch (error) {
      console.error('❌ Error reporting ad:', error);
    }
  };

  // Don't render anything for kids or if no ad to show
  if (isKidAccount || !showAd || !adData || isLoading) {
    return null;
  }

  const renderBannerAd = () => (
    <View style={[styles.bannerContainer, { backgroundColor: theme.colors.surface }]}>
      <View style={styles.adHeader}>
        <Text style={[styles.sponsoredText, { color: theme.colors.onSurface }]}>
          {t('ads.sponsored')}
        </Text>
        <TouchableOpacity onPress={handleReportAd} style={styles.reportButton}>
          <Text style={[styles.reportText, { color: theme.colors.primary }]}>
            ⚠️
          </Text>
        </TouchableOpacity>
      </View>
      
      <TouchableOpacity onPress={handleAdClick} style={styles.adContent}>
        <Text style={[styles.adTitle, { color: theme.colors.onSurface }]}>
          {adData.title}
        </Text>
        <Text style={[styles.adDescription, { color: theme.colors.onSurface }]}>
          {adData.description}
        </Text>
        <Text style={[styles.advertiser, { color: theme.colors.primary }]}>
          {adData.advertiser}
        </Text>
      </TouchableOpacity>
      
      <View style={styles.adFooter}>
        <Text style={[styles.familyFriendly, { color: theme.colors.secondary }]}>
          ✅ {t('ads.familyFriendly')}
        </Text>
      </View>
    </View>
  );

  const renderNativeAd = () => (
    <View style={[styles.nativeContainer, { backgroundColor: theme.colors.surface }]}>
      <View style={styles.adHeader}>
        <Text style={[styles.sponsoredText, { color: theme.colors.onSurface }]}>
          {t('ads.sponsored')}
        </Text>
        <TouchableOpacity onPress={handleReportAd}>
          <Text style={[styles.reportText, { color: theme.colors.primary }]}>
            {t('ads.reportAd')}
          </Text>
        </TouchableOpacity>
      </View>
      
      <TouchableOpacity onPress={handleAdClick} style={styles.nativeContent}>
        <Text style={[styles.adTitle, { color: theme.colors.onSurface }]}>
          {adData.title}
        </Text>
        <Text style={[styles.adDescription, { color: theme.colors.onSurface }]}>
          {adData.description}
        </Text>
      </TouchableOpacity>
      
      <View style={styles.adFooter}>
        <Text style={[styles.familyFriendly, { color: theme.colors.secondary }]}>
          ✅ {t('ads.familyFriendly')}
        </Text>
        <Text style={[styles.gdprCompliant, { color: theme.colors.secondary }]}>
          🔒 GDPR
        </Text>
      </View>
    </View>
  );

  // Render based on placement type
  switch (placement) {
    case 'banner':
      return renderBannerAd();
    case 'native':
    case 'feed':
      return renderNativeAd();
    case 'interstitial':
      // Interstitial ads would be handled differently (full screen)
      return null;
    default:
      return null;
  }
};

const styles = StyleSheet.create({
  bannerContainer: {
    margin: 8,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  nativeContainer: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  adHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sponsoredText: {
    fontSize: 12,
    fontWeight: 'bold',
    opacity: 0.7,
  },
  reportButton: {
    padding: 4,
  },
  reportText: {
    fontSize: 12,
  },
  adContent: {
    marginBottom: 8,
  },
  nativeContent: {
    marginBottom: 12,
  },
  adTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  adDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  advertiser: {
    fontSize: 12,
    fontWeight: '500',
  },
  adFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  familyFriendly: {
    fontSize: 12,
    fontWeight: '500',
  },
  gdprCompliant: {
    fontSize: 12,
    fontWeight: '500',
  },
});

export default AdManager;

