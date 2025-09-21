import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Switch,
  Modal,
} from 'react-native';
import { useTheme } from 'react-native-paper';
import { useLanguage } from '../../contexts/LanguageContext';
import { complianceService } from '../../services/compliance/gdprService';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface ConsentItem {
  id: string;
  title: string;
  description: string;
  required: boolean;
  purpose: string;
  dataTypes: string[];
  retention: string;
  thirdParties?: string[];
}

interface GDPRConsentProps {
  userId: string;
  isKidAccount?: boolean;
  parentId?: string;
  onConsentComplete: (consents: Record<string, boolean>) => void;
  onConsentError?: (error: string) => void;
}

export const GDPRConsent: React.FC<GDPRConsentProps> = ({
  userId,
  isKidAccount = false,
  parentId,
  onConsentComplete,
  onConsentError,
}) => {
  const theme = useTheme();
  const { t } = useLanguage();
  
  const [isVisible, setIsVisible] = useState(false);
  const [consentItems, setConsentItems] = useState<ConsentItem[]>([]);
  const [consents, setConsents] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showDetails, setShowDetails] = useState<string | null>(null);
  const [isEUUser, setIsEUUser] = useState(false);

  useEffect(() => {
    checkGDPRRequirement();
  }, [userId]);

  const checkGDPRRequirement = async () => {
    try {
      // Check if user is in EU and needs GDPR consent
      const isEU = await complianceService.isEUUser(userId);
      setIsEUUser(isEU);
      
      if (isEU) {
        const existingConsent = await complianceService.getExistingConsent(userId);
        if (!existingConsent || existingConsent.needsUpdate) {
          await loadConsentItems();
          setIsVisible(true);
        } else {
          onConsentComplete(existingConsent.consents);
        }
      } else {
        // Non-EU users get default consents
        onConsentComplete({ all: true });
      }
    } catch (error) {
      console.error('❌ Error checking GDPR requirement:', error);
      onConsentError?.('Failed to check GDPR requirements');
    }
  };

  const loadConsentItems = async () => {
    try {
      const items: ConsentItem[] = isKidAccount ? [
        // SPECIAL KID ACCOUNT CONSENTS (Enhanced Protection)
        {
          id: 'kid_safety_data',
          title: t('compliance.gdpr.kidSafety.title'),
          description: t('compliance.gdpr.kidSafety.description'),
          required: true,
          purpose: t('compliance.gdpr.purposes.kidSafety'),
          dataTypes: [
            t('compliance.gdpr.dataTypes.profile'),
            t('compliance.gdpr.dataTypes.emergencyContacts'),
            t('compliance.gdpr.dataTypes.safetyEvents'),
            t('compliance.gdpr.dataTypes.behaviorAssessment'),
          ],
          retention: t('compliance.gdpr.retention.untilAdult'),
        },
        {
          id: 'educational_data',
          title: t('compliance.gdpr.educational.title'),
          description: t('compliance.gdpr.educational.description'),
          required: false,
          purpose: t('compliance.gdpr.purposes.education'),
          dataTypes: [
            t('compliance.gdpr.dataTypes.learningProgress'),
            t('compliance.gdpr.dataTypes.grokInteractions'),
            t('compliance.gdpr.dataTypes.educationalContent'),
          ],
          retention: t('compliance.gdpr.retention.educational'),
        },
        {
          id: 'parent_communication',
          title: t('compliance.gdpr.parentCommunication.title'),
          description: t('compliance.gdpr.parentCommunication.description'),
          required: true,
          purpose: t('compliance.gdpr.purposes.parentalControl'),
          dataTypes: [
            t('compliance.gdpr.dataTypes.approvalRequests'),
            t('compliance.gdpr.dataTypes.safetyAlerts'),
            t('compliance.gdpr.dataTypes.progressReports'),
          ],
          retention: t('compliance.gdpr.retention.communication'),
        },
        {
          id: 'location_emergency',
          title: t('compliance.gdpr.location.title'),
          description: t('compliance.gdpr.location.description'),
          required: false,
          purpose: t('compliance.gdpr.purposes.emergency'),
          dataTypes: [
            t('compliance.gdpr.dataTypes.locationData'),
            t('compliance.gdpr.dataTypes.emergencyLocation'),
          ],
          retention: t('compliance.gdpr.retention.emergency'),
        },
      ] : [
        // ADULT CONSENTS
        {
          id: 'profile_data',
          title: t('compliance.gdpr.profile.title'),
          description: t('compliance.gdpr.profile.description'),
          required: true,
          purpose: t('compliance.gdpr.purposes.service'),
          dataTypes: [
            t('compliance.gdpr.dataTypes.profile'),
            t('compliance.gdpr.dataTypes.preferences'),
          ],
          retention: t('compliance.gdpr.retention.profile'),
        },
        {
          id: 'activity_data',
          title: t('compliance.gdpr.activity.title'),
          description: t('compliance.gdpr.activity.description'),
          required: false,
          purpose: t('compliance.gdpr.purposes.improvement'),
          dataTypes: [
            t('compliance.gdpr.dataTypes.activity'),
            t('compliance.gdpr.dataTypes.interactions'),
          ],
          retention: t('compliance.gdpr.retention.activity'),
        },
        {
          id: 'marketing_data',
          title: t('compliance.gdpr.marketing.title'),
          description: t('compliance.gdpr.marketing.description'),
          required: false,
          purpose: t('compliance.gdpr.purposes.marketing'),
          dataTypes: [
            t('compliance.gdpr.dataTypes.preferences'),
            t('compliance.gdpr.dataTypes.demographics'),
          ],
          retention: t('compliance.gdpr.retention.marketing'),
          thirdParties: ['Ad Networks', 'Analytics Providers'],
        },
      ];

      setConsentItems(items);
      
      // Initialize consents (required items default to true)
      const initialConsents: Record<string, boolean> = {};
      items.forEach(item => {
        initialConsents[item.id] = item.required;
      });
      setConsents(initialConsents);
      
    } catch (error) {
      console.error('❌ Error loading consent items:', error);
      onConsentError?.('Failed to load consent options');
    }
  };

  const handleConsentChange = (itemId: string, value: boolean) => {
    const item = consentItems.find(i => i.id === itemId);
    if (item?.required && !value) {
      Alert.alert(
        t('compliance.gdpr.requiredTitle'),
        t('compliance.gdpr.requiredMessage', { title: item.title }),
        [{ text: t('common.ok') }]
      );
      return;
    }
    
    setConsents(prev => ({
      ...prev,
      [itemId]: value,
    }));
  };

  const handleSubmitConsents = async () => {
    try {
      setIsLoading(true);
      
      // Validate required consents
      const missingRequired = consentItems.filter(
        item => item.required && !consents[item.id]
      );
      
      if (missingRequired.length > 0) {
        Alert.alert(
          t('compliance.gdpr.incompleteTitle'),
          t('compliance.gdpr.incompleteMessage'),
          [{ text: t('common.ok') }]
        );
        return;
      }

      // Save consents
      await complianceService.saveConsents(userId, {
        consents,
        timestamp: new Date().toISOString(),
        version: '1.0',
        ipAddress: await complianceService.getIPAddress(),
        userAgent: 'innkt-mobile-app',
        isKidAccount,
        parentId: isKidAccount ? parentId : undefined,
      });

      // Store locally for offline access
      await AsyncStorage.setItem('gdpr_consents', JSON.stringify({
        userId,
        consents,
        timestamp: new Date().toISOString(),
      }));

      setIsVisible(false);
      onConsentComplete(consents);
      
    } catch (error) {
      console.error('❌ Error saving consents:', error);
      onConsentError?.('Failed to save consent preferences');
    } finally {
      setIsLoading(false);
    }
  };

  const renderConsentItem = (item: ConsentItem) => (
    <View
      key={item.id}
      style={[styles.consentItem, { backgroundColor: theme.colors.surface }]}
    >
      <View style={styles.consentHeader}>
        <View style={styles.consentTitle}>
          <Text style={[styles.itemTitle, { color: theme.colors.onSurface }]}>
            {item.title}
          </Text>
          {item.required && (
            <Text style={[styles.requiredLabel, { color: theme.colors.error }]}>
              {t('compliance.gdpr.required')}
            </Text>
          )}
        </View>
        <Switch
          value={consents[item.id] || false}
          onValueChange={(value) => handleConsentChange(item.id, value)}
          disabled={item.required}
          trackColor={{
            false: theme.colors.outline,
            true: theme.colors.primary,
          }}
        />
      </View>
      
      <Text style={[styles.itemDescription, { color: theme.colors.onSurface }]}>
        {item.description}
      </Text>
      
      <TouchableOpacity
        style={styles.detailsButton}
        onPress={() => setShowDetails(showDetails === item.id ? null : item.id)}
      >
        <Text style={[styles.detailsText, { color: theme.colors.primary }]}>
          {showDetails === item.id 
            ? t('compliance.gdpr.hideDetails')
            : t('compliance.gdpr.showDetails')
          }
        </Text>
      </TouchableOpacity>
      
      {showDetails === item.id && (
        <View style={styles.detailsContainer}>
          <Text style={[styles.detailsTitle, { color: theme.colors.onSurface }]}>
            {t('compliance.gdpr.purpose')}: {item.purpose}
          </Text>
          
          <Text style={[styles.detailsTitle, { color: theme.colors.onSurface }]}>
            {t('compliance.gdpr.dataTypes')}:
          </Text>
          {item.dataTypes.map((dataType, index) => (
            <Text key={index} style={[styles.dataType, { color: theme.colors.onSurface }]}>
              • {dataType}
            </Text>
          ))}
          
          <Text style={[styles.detailsTitle, { color: theme.colors.onSurface }]}>
            {t('compliance.gdpr.retention')}: {item.retention}
          </Text>
          
          {item.thirdParties && (
            <>
              <Text style={[styles.detailsTitle, { color: theme.colors.onSurface }]}>
                {t('compliance.gdpr.thirdParties')}:
              </Text>
              {item.thirdParties.map((party, index) => (
                <Text key={index} style={[styles.dataType, { color: theme.colors.onSurface }]}>
                  • {party}
                </Text>
              ))}
            </>
          )}
        </View>
      )}
    </View>
  );

  if (!isEUUser || !isVisible) {
    return null;
  }

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.headerTitle, { color: theme.colors.onSurface }]}>
            {isKidAccount 
              ? t('compliance.gdpr.kidConsentTitle')
              : t('compliance.gdpr.consentTitle')
            }
          </Text>
          <Text style={[styles.headerSubtitle, { color: theme.colors.onSurface }]}>
            {isKidAccount
              ? t('compliance.gdpr.kidConsentSubtitle')
              : t('compliance.gdpr.consentSubtitle')
            }
          </Text>
        </View>

        {/* Consent Items */}
        <ScrollView style={styles.content}>
          {/* GDPR Rights Information */}
          <View style={[styles.rightsContainer, { backgroundColor: theme.colors.primaryContainer }]}>
            <Text style={[styles.rightsTitle, { color: theme.colors.onPrimaryContainer }]}>
              {t('compliance.gdpr.rights.title')}
            </Text>
            <Text style={[styles.rightsText, { color: theme.colors.onPrimaryContainer }]}>
              {t('compliance.gdpr.rights.description')}
            </Text>
            <View style={styles.rightsList}>
              {[
                'access',
                'rectification', 
                'erasure',
                'portability',
                'objection'
              ].map(right => (
                <Text key={right} style={[styles.rightItem, { color: theme.colors.onPrimaryContainer }]}>
                  • {t(`compliance.gdpr.rights.${right}`)}
                </Text>
              ))}
            </View>
          </View>

          {/* Consent Items */}
          {consentItems.map(renderConsentItem)}

          {/* Kid Account Special Notice */}
          {isKidAccount && (
            <View style={[styles.kidNotice, { backgroundColor: theme.colors.errorContainer }]}>
              <Text style={[styles.kidNoticeTitle, { color: theme.colors.onErrorContainer }]}>
                {t('compliance.gdpr.kidNotice.title')}
              </Text>
              <Text style={[styles.kidNoticeText, { color: theme.colors.onErrorContainer }]}>
                {t('compliance.gdpr.kidNotice.message')}
              </Text>
            </View>
          )}
        </ScrollView>

        {/* Footer */}
        <View style={[styles.footer, { backgroundColor: theme.colors.surface }]}>
          <TouchableOpacity
            style={[styles.button, styles.cancelButton, { borderColor: theme.colors.outline }]}
            onPress={() => {
              Alert.alert(
                t('compliance.gdpr.cancelTitle'),
                t('compliance.gdpr.cancelMessage'),
                [
                  { text: t('common.no') },
                  { 
                    text: t('common.yes'), 
                    onPress: () => {
                      setIsVisible(false);
                      onConsentError?.('User cancelled GDPR consent');
                    }
                  }
                ]
              );
            }}
            disabled={isLoading}
          >
            <Text style={[styles.cancelButtonText, { color: theme.colors.onSurface }]}>
              {t('common.cancel')}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.button,
              styles.submitButton,
              { backgroundColor: theme.colors.primary },
            ]}
            onPress={handleSubmitConsents}
            disabled={isLoading}
          >
            <Text style={[styles.submitButtonText, { color: theme.colors.onPrimary }]}>
              {isLoading 
                ? t('compliance.gdpr.processing')
                : t('compliance.gdpr.acceptConsents')
              }
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    opacity: 0.7,
    lineHeight: 22,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  rightsContainer: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  rightsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  rightsText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  rightsList: {
    marginLeft: 8,
  },
  rightItem: {
    fontSize: 14,
    marginBottom: 4,
  },
  consentItem: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  consentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  consentTitle: {
    flex: 1,
    marginRight: 16,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  requiredLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  itemDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  detailsButton: {
    paddingVertical: 8,
  },
  detailsText: {
    fontSize: 14,
    fontWeight: '500',
  },
  detailsContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 8,
  },
  detailsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
    marginTop: 8,
  },
  dataType: {
    fontSize: 13,
    marginLeft: 8,
    marginBottom: 4,
  },
  kidNotice: {
    padding: 16,
    borderRadius: 12,
    marginTop: 20,
  },
  kidNoticeTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  kidNoticeText: {
    fontSize: 14,
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  button: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButton: {
    marginRight: 12,
    borderWidth: 1,
  },
  submitButton: {
    marginLeft: 12,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default GDPRConsent;

