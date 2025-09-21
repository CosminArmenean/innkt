import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Vibration,
  Dimensions,
  Animated,
} from 'react-native';
import { useTheme } from 'react-native-paper';
import Geolocation from '@react-native-community/geolocation';
import { emergencyService } from '../../services/kidSafety/emergencyService';
import { useLanguage } from '../../contexts/LanguageContext';

interface PanicButtonProps {
  kidAccountId: string;
  isVisible: boolean;
  onEmergencyTriggered?: () => void;
}

const { width, height } = Dimensions.get('window');

export const PanicButton: React.FC<PanicButtonProps> = ({
  kidAccountId,
  isVisible = true,
  onEmergencyTriggered,
}) => {
  const theme = useTheme();
  const { t } = useLanguage();
  const [isPressed, setIsPressed] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [pulseAnim] = useState(new Animated.Value(1));
  const [location, setLocation] = useState<{latitude: number; longitude: number} | null>(null);

  // Animated pulse effect for emergency button
  useEffect(() => {
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    pulseAnimation.start();
    return () => pulseAnimation.stop();
  }, []);

  // Get current location for emergency services
  useEffect(() => {
    Geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      (error) => {
        console.log('Location error:', error);
        // Emergency button still works without location
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
    );
  }, []);

  const handlePanicButtonPress = () => {
    if (isActive) return; // Prevent multiple activations

    setIsPressed(true);
    setCountdown(3); // 3-second countdown for accidental press prevention
    
    // Vibration pattern: long, short, long
    Vibration.vibrate([0, 1000, 200, 500]);

    // Start countdown
    const countdownInterval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          triggerEmergency();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Show cancel option
    setTimeout(() => {
      if (countdown > 0) {
        Alert.alert(
          t('emergency.panicButton.confirmTitle'),
          t('emergency.panicButton.confirmMessage'),
          [
            {
              text: t('emergency.panicButton.cancel'),
              onPress: () => {
                clearInterval(countdownInterval);
                setIsPressed(false);
                setCountdown(0);
              },
              style: 'cancel',
            },
            {
              text: t('emergency.panicButton.confirm'),
              onPress: () => {
                clearInterval(countdownInterval);
                triggerEmergency();
              },
              style: 'destructive',
            },
          ]
        );
      }
    }, 1000);
  };

  const triggerEmergency = async () => {
    try {
      setIsActive(true);
      setIsPressed(false);
      setCountdown(0);

      // Continuous vibration for emergency
      Vibration.vibrate([0, 500, 200, 500, 200, 500], true);

      // Trigger emergency services
      const emergencyData = {
        kidAccountId,
        timestamp: new Date().toISOString(),
        location: location || undefined,
        deviceInfo: {
          platform: 'mobile',
          userAgent: 'innkt-mobile-app',
        },
      };

      await emergencyService.triggerPanicButton(emergencyData);

      // Notify parent callback
      onEmergencyTriggered?.();

      // Show confirmation to kid
      Alert.alert(
        t('emergency.panicButton.activatedTitle'),
        t('emergency.panicButton.activatedMessage'),
        [
          {
            text: t('emergency.panicButton.ok'),
            onPress: () => {
              Vibration.cancel();
              setIsActive(false);
            },
          },
        ]
      );

    } catch (error) {
      console.error('Emergency trigger failed:', error);
      
      // Even if API fails, still notify locally
      Alert.alert(
        t('emergency.panicButton.errorTitle'),
        t('emergency.panicButton.errorMessage'),
        [
          {
            text: t('emergency.panicButton.tryAgain'),
            onPress: triggerEmergency,
          },
          {
            text: t('emergency.panicButton.cancel'),
            onPress: () => {
              Vibration.cancel();
              setIsActive(false);
            },
            style: 'cancel',
          },
        ]
      );
    }
  };

  if (!isVisible) return null;

  return (
    <View style={styles.container}>
      {/* Emergency Button */}
      <Animated.View
        style={[
          styles.buttonContainer,
          { transform: [{ scale: isPressed ? 1.1 : pulseAnim }] },
        ]}
      >
        <TouchableOpacity
          style={[
            styles.panicButton,
            {
              backgroundColor: isActive
                ? theme.colors.error
                : isPressed
                ? '#FF6B6B'
                : '#FF4757',
            },
          ]}
          onPress={handlePanicButtonPress}
          disabled={isActive}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>
            {isActive
              ? t('emergency.panicButton.active')
              : isPressed
              ? countdown.toString()
              : t('emergency.panicButton.help')}
          </Text>
          <Text style={styles.buttonSubtext}>
            {isActive
              ? t('emergency.panicButton.helpComing')
              : t('emergency.panicButton.pressForHelp')}
          </Text>
        </TouchableOpacity>
      </Animated.View>

      {/* Safety Message */}
      <View style={styles.safetyMessage}>
        <Text style={[styles.safetyText, { color: theme.colors.onSurface }]}>
          {t('emergency.panicButton.safetyReminder')}
        </Text>
      </View>

      {/* Emergency Contacts Quick Access */}
      <View style={styles.emergencyContacts}>
        <Text style={[styles.contactsTitle, { color: theme.colors.onSurface }]}>
          {t('emergency.panicButton.emergencyContacts')}
        </Text>
        <Text style={[styles.contactsText, { color: theme.colors.onSurface }]}>
          {t('emergency.panicButton.contactsAvailable')}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: height * 0.1,
    right: 20,
    alignItems: 'center',
    zIndex: 1000,
  },
  buttonContainer: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  panicButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  buttonSubtext: {
    color: '#FFFFFF',
    fontSize: 10,
    textAlign: 'center',
    marginTop: 2,
  },
  safetyMessage: {
    marginTop: 10,
    padding: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 8,
    maxWidth: 120,
  },
  safetyText: {
    fontSize: 12,
    textAlign: 'center',
    fontWeight: '500',
  },
  emergencyContacts: {
    marginTop: 8,
    padding: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 6,
    maxWidth: 120,
  },
  contactsTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  contactsText: {
    fontSize: 9,
    textAlign: 'center',
    marginTop: 2,
  },
});

export default PanicButton;

