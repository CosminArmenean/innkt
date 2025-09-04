import React, {useState, useEffect} from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import {
  Card,
  Text,
  Button,
  useTheme,
  Chip,
  Divider,
  ProgressBar,
  List,
  IconButton,
} from 'react-native-paper';
import {useAnalytics} from '../../contexts/AnalyticsContext';
import {useABTesting} from '../../contexts/AnalyticsContext';
import {usePredictiveAnalytics} from '../../contexts/AnalyticsContext';
import {useBusinessIntelligence} from '../../contexts/AnalyticsContext';

interface AnalyticsMetric {
  id: string;
  name: string;
  value: number;
  target: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  change: number;
}

interface ExperimentData {
  id: string;
  name: string;
  status: 'active' | 'paused' | 'completed';
  variants: Array<{
    id: string;
    name: string;
    conversionRate: number;
    users: number;
  }>;
}

interface PredictionData {
  type: string;
  value: number;
  confidence: number;
  trend: string;
}

const AnalyticsDashboard = () => {
  const theme = useTheme();
  const analytics = useAnalytics();
  const abTesting = useABTesting();
  const predictiveAnalytics = usePredictiveAnalytics();
  const businessIntelligence = useBusinessIntelligence();

  const [metrics, setMetrics] = useState<AnalyticsMetric[]>([]);
  const [experiments, setExperiments] = useState<ExperimentData[]>([]);
  const [predictions, setPredictions] = useState<PredictionData[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load analytics data
  useEffect(() => {
    loadAnalyticsData();
  }, []);

  const loadAnalyticsData = async () => {
    setIsLoading(true);
    try {
      // Load metrics
      const metricsData = await businessIntelligence.getMetrics();
      setMetrics(transformMetrics(metricsData));

      // Load experiments
      const experimentsData = abTesting.activeExperiments;
      setExperiments(transformExperiments(experimentsData));

      // Load predictions
      const predictionsData = await loadPredictions();
      setPredictions(predictionsData);

    } catch (error) {
      console.error('Failed to load analytics data:', error);
      Alert.alert('Error', 'Failed to load analytics data');
    } finally {
      setIsLoading(false);
    }
  };

  const transformMetrics = (data: any[]): AnalyticsMetric[] => {
    // Transform raw metrics data to our format
    return data.map(metric => ({
      id: metric.id || Math.random().toString(),
      name: metric.name || 'Unknown Metric',
      value: metric.value || 0,
      target: metric.target || 100,
      unit: metric.unit || '',
      trend: metric.trend || 'stable',
      change: metric.change || 0,
    }));
  };

  const transformExperiments = (data: any[]): ExperimentData[] => {
    // Transform raw experiment data to our format
    return data.map(exp => ({
      id: exp.id || Math.random().toString(),
      name: exp.name || 'Unknown Experiment',
      status: exp.status || 'active',
      variants: exp.variants || [],
    }));
  };

  const loadPredictions = async (): Promise<PredictionData[]> => {
    try {
      // Load various predictions
      const predictions: PredictionData[] = [];

      // User behavior prediction
      const userPrediction = await predictiveAnalytics.getUserBehaviorPrediction('user123');
      if (userPrediction) {
        predictions.push({
          type: 'User Engagement',
          value: userPrediction.engagementScore || 0,
          confidence: userPrediction.confidence || 0,
          trend: userPrediction.trend || 'stable',
        });
      }

      // Content performance prediction
      const contentPrediction = await predictiveAnalytics.getContentPerformancePrediction('content123');
      if (contentPrediction) {
        predictions.push({
          type: 'Content Performance',
          value: contentPrediction.performanceScore || 0,
          confidence: contentPrediction.confidence || 0,
          trend: contentPrediction.trend || 'stable',
        });
      }

      return predictions;
    } catch (error) {
      console.error('Failed to load predictions:', error);
      return [];
    }
  };

  const handleMetricUpdate = async (metricId: string, newValue: number) => {
    try {
      await businessIntelligence.updateMetricValue(metricId, newValue);
      
      // Track the update event
      analytics.trackEvent('metric_updated', {
        metricId,
        oldValue: metrics.find(m => m.id === metricId)?.value,
        newValue,
        timestamp: new Date().toISOString(),
      });

      // Reload data
      await loadAnalyticsData();
      
      Alert.alert('Success', 'Metric updated successfully');
    } catch (error) {
      console.error('Failed to update metric:', error);
      Alert.alert('Error', 'Failed to update metric');
    }
  };

  const handleExperimentAction = async (experimentId: string, action: string) => {
    try {
      switch (action) {
        case 'start':
          await abTesting.startExperiment(experimentId);
          break;
        case 'pause':
          await abTesting.pauseExperiment(experimentId);
          break;
        case 'complete':
          await abTesting.completeExperiment(experimentId);
          break;
      }

      // Track the action
      analytics.trackEvent('experiment_action', {
        experimentId,
        action,
        timestamp: new Date().toISOString(),
      });

      // Reload data
      await loadAnalyticsData();
      
      Alert.alert('Success', `Experiment ${action}ed successfully`);
    } catch (error) {
      console.error(`Failed to ${action} experiment:`, error);
      Alert.alert('Error', `Failed to ${action} experiment`);
    }
  };

  const handleExportData = async () => {
    try {
      const exportData = await businessIntelligence.exportData(
        metrics.map(m => m.id),
        'csv',
        {start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), end: new Date()}
      );

      // Track export event
      analytics.trackEvent('data_exported', {
        format: 'csv',
        metricsCount: metrics.length,
        timestamp: new Date().toISOString(),
      });

      Alert.alert('Success', 'Data exported successfully');
    } catch (error) {
      console.error('Failed to export data:', error);
      Alert.alert('Error', 'Failed to export data');
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return 'trending-up';
      case 'down':
        return 'trending-down';
      default:
        return 'trending-neutral';
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'up':
        return theme.colors.success;
      case 'down':
        return theme.colors.error;
      default:
        return theme.colors.onSurfaceVariant;
    }
  };

  const getProgressColor = (value: number, target: number) => {
    const percentage = (value / target) * 100;
    if (percentage >= 80) return theme.colors.success;
    if (percentage >= 60) return theme.colors.warning;
    return theme.colors.error;
  };

  return (
    <ScrollView style={[styles.container, {backgroundColor: theme.colors.background}]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, {color: theme.colors.onBackground}]}>
          Analytics Dashboard
        </Text>
        <Button
          mode="contained"
          onPress={handleExportData}
          icon="download">
          Export Data
        </Button>
      </View>

      {/* Key Metrics */}
      <Card style={[styles.card, {backgroundColor: theme.colors.surface}]}>
        <Card.Content>
          <Text style={[styles.sectionTitle, {color: theme.colors.onSurface}]}>
            Key Performance Indicators
          </Text>
          
          {metrics.map((metric, index) => (
            <View key={metric.id}>
              <View style={styles.metricRow}>
                <View style={styles.metricInfo}>
                  <Text style={[styles.metricName, {color: theme.colors.onSurface}]}>
                    {metric.name}
                  </Text>
                  <Text style={[styles.metricValue, {color: theme.colors.primary}]}>
                    {metric.value} {metric.unit}
                  </Text>
                </View>
                <View style={styles.metricTrend}>
                  <IconButton
                    icon={getTrendIcon(metric.trend)}
                    iconColor={getTrendColor(metric.trend)}
                    size={20}
                  />
                  <Text style={[styles.metricChange, {color: getTrendColor(metric.trend)}]}>
                    {metric.change > 0 ? '+' : ''}{metric.change}%
                  </Text>
                </View>
              </View>
              
              <ProgressBar
                progress={metric.value / metric.target}
                color={getProgressColor(metric.value, metric.target)}
                style={styles.progressBar}
              />
              
              <Text style={[styles.metricTarget, {color: theme.colors.onSurfaceVariant}]}>
                Target: {metric.target} {metric.unit}
              </Text>
              
              {index < metrics.length - 1 && <Divider style={styles.divider} />}
            </View>
          ))}
        </Card.Content>
      </Card>

      {/* A/B Testing Experiments */}
      <Card style={[styles.card, {backgroundColor: theme.colors.surface}]}>
        <Card.Content>
          <Text style={[styles.sectionTitle, {color: theme.colors.onSurface}]}>
            Active Experiments
          </Text>
          
          {experiments.map((experiment, index) => (
            <View key={experiment.id}>
              <View style={styles.experimentHeader}>
                <View style={styles.experimentInfo}>
                  <Text style={[styles.experimentName, {color: theme.colors.onSurface}]}>
                    {experiment.name}
                  </Text>
                  <Chip
                    mode="outlined"
                    compact
                    style={[
                      styles.statusChip,
                      {
                        borderColor: experiment.status === 'active' 
                          ? theme.colors.success 
                          : theme.colors.warning
                      }
                    ]}>
                    {experiment.status}
                  </Chip>
                </View>
                
                <View style={styles.experimentActions}>
                  {experiment.status === 'active' && (
                    <>
                      <Button
                        mode="outlined"
                        compact
                        onPress={() => handleExperimentAction(experiment.id, 'pause')}>
                        Pause
                      </Button>
                      <Button
                        mode="outlined"
                        compact
                        onPress={() => handleExperimentAction(experiment.id, 'complete')}>
                        Complete
                      </Button>
                    </>
                  )}
                  {experiment.status === 'paused' && (
                    <Button
                      mode="contained"
                      compact
                      onPress={() => handleExperimentAction(experiment.id, 'start')}>
                      Resume
                    </Button>
                  )}
                </View>
              </View>
              
              {experiment.variants.map(variant => (
                <View key={variant.id} style={styles.variantRow}>
                  <Text style={[styles.variantName, {color: theme.colors.onSurfaceVariant}]}>
                    {variant.name}
                  </Text>
                  <Text style={[styles.variantStats, {color: theme.colors.onSurface}]}>
                    {variant.conversionRate.toFixed(2)}% ({variant.users} users)
                  </Text>
                </View>
              ))}
              
              {index < experiments.length - 1 && <Divider style={styles.divider} />}
            </View>
          ))}
          
          {experiments.length === 0 && (
            <Text style={[styles.emptyState, {color: theme.colors.onSurfaceVariant}]}>
              No active experiments
            </Text>
          )}
        </Card.Content>
      </Card>

      {/* Predictive Analytics */}
      <Card style={[styles.card, {backgroundColor: theme.colors.surface}]}>
        <Card.Content>
          <Text style={[styles.sectionTitle, {color: theme.colors.onSurface}]}>
            AI Predictions
          </Text>
          
          {predictions.map((prediction, index) => (
            <View key={index}>
              <View style={styles.predictionRow}>
                <View style={styles.predictionInfo}>
                  <Text style={[styles.predictionType, {color: theme.colors.onSurface}]}>
                    {prediction.type}
                  </Text>
                  <Text style={[styles.predictionValue, {color: theme.colors.primary}]}>
                    {prediction.value.toFixed(2)}
                  </Text>
                </View>
                
                <View style={styles.predictionMeta}>
                  <Text style={[styles.confidence, {color: theme.colors.onSurfaceVariant}]}>
                    {prediction.confidence.toFixed(1)}% confidence
                  </Text>
                  <Chip
                    mode="outlined"
                    compact
                    icon={getTrendIcon(prediction.trend)}>
                    {prediction.trend}
                  </Chip>
                </View>
              </View>
              
              {index < predictions.length - 1 && <Divider style={styles.divider} />}
            </View>
          ))}
          
          {predictions.length === 0 && (
            <Text style={[styles.emptyState, {color: theme.colors.onSurfaceVariant}]}>
              No predictions available
            </Text>
          )}
        </Card.Content>
      </Card>

      {/* Refresh Button */}
      <Button
        mode="contained"
        onPress={loadAnalyticsData}
        loading={isLoading}
        style={styles.refreshButton}
        icon="refresh">
        Refresh Data
      </Button>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  card: {
    marginBottom: 16,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  metricInfo: {
    flex: 1,
  },
  metricName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  metricTrend: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metricChange: {
    fontSize: 14,
    fontWeight: '600',
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    marginBottom: 8,
  },
  metricTarget: {
    fontSize: 12,
    textAlign: 'right',
  },
  experimentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  experimentInfo: {
    flex: 1,
  },
  experimentName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  statusChip: {
    alignSelf: 'flex-start',
  },
  experimentActions: {
    flexDirection: 'row',
    gap: 8,
  },
  variantRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    marginLeft: 16,
  },
  variantName: {
    fontSize: 14,
  },
  variantStats: {
    fontSize: 14,
    fontWeight: '600',
  },
  predictionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  predictionInfo: {
    flex: 1,
  },
  predictionType: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  predictionValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  predictionMeta: {
    alignItems: 'flex-end',
  },
  confidence: {
    fontSize: 12,
    marginBottom: 4,
  },
  divider: {
    marginVertical: 16,
  },
  emptyState: {
    textAlign: 'center',
    fontStyle: 'italic',
    marginVertical: 20,
  },
  refreshButton: {
    marginTop: 16,
    marginBottom: 32,
  },
});

export default AnalyticsDashboard;





