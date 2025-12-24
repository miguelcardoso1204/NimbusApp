import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  calculateStats,
  formatTimestamp,
  getAllReadings,
  Reading,
} from '../../services/firebaseService';

type Mode = 'overview' | 'analysis';
type Range = '24h' | '7d' | '30d';

// Calculate moving average with configurable window size
const calculateMovingAverage = (data: number[], windowSize: number = 5): number[] => {
  if (data.length === 0) return [];
  const result: number[] = [];
  for (let i = 0; i < data.length; i++) {
    if (i < windowSize - 1) {
      // Not enough data points yet, use available average
      const available = data.slice(0, i + 1);
      result.push(available.reduce((a, b) => a + b, 0) / available.length);
    } else {
      const window = data.slice(i - windowSize + 1, i + 1);
      const avg = window.reduce((a, b) => a + b, 0) / windowSize;
      result.push(avg);
    }
  }
  return result;
};

// Calculate linear regression for trend line
const calculateTrend = (data: number[]): { slope: number; trendLine: number[] } => {
  if (data.length === 0) return { slope: 0, trendLine: [] };
  
  const n = data.length;
  let xSum = 0;
  let ySum = 0;
  let xySum = 0;
  let x2Sum = 0;

  for (let i = 0; i < n; i++) {
    xSum += i;
    ySum += data[i];
    xySum += i * data[i];
    x2Sum += i * i;
  }

  const denominator = n * x2Sum - xSum * xSum;
  const slope = denominator !== 0 ? (n * xySum - xSum * ySum) / denominator : 0;
  const intercept = (ySum - slope * xSum) / n;

  const trendLine = data.map((_, i) => slope * i + intercept);
  return { slope, trendLine };
};

// Get trend direction info
const getTrendInfo = (slope: number, unit: string) => {
  const absSlope = Math.abs(slope);
  const perReading = absSlope.toFixed(3);
  
  if (slope > 0.01) {
    return { direction: 'rising', icon: '↑', color: '#ef4444', text: `+${perReading}${unit}/reading` };
  } else if (slope < -0.01) {
    return { direction: 'falling', icon: '↓', color: '#22c55e', text: `${perReading}${unit}/reading` };
  } else {
    return { direction: 'stable', icon: '→', color: '#64748b', text: 'Stable' };
  }
};

export default function ChartsScreen() {
  const [mode, setMode] = useState<Mode>('overview');
  const [range, setRange] = useState<Range>('24h');
  const [readings, setReadings] = useState<Reading[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedStation] = useState('STATION_00');

  useEffect(() => {
    loadReadings();
  }, [range]);

  const getReadingsCount = () => {
    switch (range) {
      case '24h':
        return 50;
      case '7d':
        return 200;
      case '30d':
        return 500;
      default:
        return 50;
    }
  };

  // Moving average window size based on range
  const getMAWindowSize = () => {
    switch (range) {
      case '24h':
        return 5;
      case '7d':
        return 10;
      case '30d':
        return 20;
      default:
        return 5;
    }
  };

  const loadReadings = async () => {
    setLoading(true);
    try {
      const data = await getAllReadings(selectedStation, getReadingsCount());
      setReadings(data);
    } catch (error) {
      console.error('Error loading readings:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadReadings();
    setRefreshing(false);
  };

  const stats = calculateStats(readings);

  // Calculate trends for each metric
  const tempData = readings.map((r) => r.temperatura);
  const humidityData = readings.map((r) => r.humidade);
  const particlesData = readings.map((r) => r.particulas);

  const tempTrend = calculateTrend(tempData);
  const humidityTrend = calculateTrend(humidityData);
  const particlesTrend = calculateTrend(particlesData);

  const tempTrendInfo = getTrendInfo(tempTrend.slope, '°C');
  const humidityTrendInfo = getTrendInfo(humidityTrend.slope, '%');
  const particlesTrendInfo = getTrendInfo(particlesTrend.slope, '');

  // Calculate moving averages
  const maWindowSize = getMAWindowSize();
  const tempMA = calculateMovingAverage(tempData, maWindowSize);
  const humidityMA = calculateMovingAverage(humidityData, maWindowSize);
  const particlesMA = calculateMovingAverage(particlesData, maWindowSize);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 24 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Station */}
        <View style={styles.header}>
          <Text style={styles.stationLabel}>Weather Station</Text>
          <Text style={styles.stationName}>{selectedStation.replace('_', ' ')}</Text>
        </View>

        {/* Mode toggle */}
        <View style={styles.segmentRow}>
          <SegmentButton
            label="Overview"
            active={mode === 'overview'}
            onPress={() => setMode('overview')}
          />
          <SegmentButton
            label="Analysis"
            active={mode === 'analysis'}
            onPress={() => setMode('analysis')}
          />
        </View>

        {/* Range selector */}
        <View style={styles.segmentRow}>
          <SegmentButton
            label="Last 24h"
            active={range === '24h'}
            onPress={() => setRange('24h')}
          />
          <SegmentButton
            label="7 days"
            active={range === '7d'}
            onPress={() => setRange('7d')}
          />
          <SegmentButton
            label="30 days"
            active={range === '30d'}
            onPress={() => setRange('30d')}
          />
        </View>

        {/* Loading */}
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#2563eb" />
            <Text style={styles.loadingText}>Loading data...</Text>
          </View>
        )}

        {/* Content */}
        {!loading && readings.length > 0 && (
          <>
            {mode === 'overview' ? (
              <>
                <ChartCard title="Temperature">
                  <SimpleChart
                    data={tempData}
                    color="#ef4444"
                    unit="°C"
                  />
                  <Text style={styles.chartInfo}>
                    {readings.length} readings
                  </Text>
                </ChartCard>
                <ChartCard title="Humidity">
                  <SimpleChart
                    data={humidityData}
                    color="#3b82f6"
                    unit="%"
                  />
                </ChartCard>
                <ChartCard title="Particles">
                  <SimpleChart
                    data={particlesData}
                    color="#22c55e"
                    unit=""
                  />
                </ChartCard>
              </>
            ) : (
              <>
                {/* Statistics with Trend Indicators */}
                <ChartCard title="Statistics & Trends">
                  <View style={styles.statRow}>
                    <Text style={styles.statLabel}>Avg Temperature:</Text>
                    <Text style={styles.statValue}>{stats.avgTemp.toFixed(1)}°C</Text>
                  </View>
                  <View style={styles.statRow}>
                    <Text style={styles.statLabel}>Min / Max Temp:</Text>
                    <Text style={styles.statValue}>
                      {stats.minTemp.toFixed(1)}°C / {stats.maxTemp.toFixed(1)}°C
                    </Text>
                  </View>
                  <TrendIndicator
                    label="Temperature Trend"
                    trendInfo={tempTrendInfo}
                  />
                  
                  <View style={styles.sectionDivider} />
                  
                  <View style={styles.statRow}>
                    <Text style={styles.statLabel}>Avg Humidity:</Text>
                    <Text style={styles.statValue}>{stats.avgHumidity.toFixed(1)}%</Text>
                  </View>
                  <View style={styles.statRow}>
                    <Text style={styles.statLabel}>Min / Max Humidity:</Text>
                    <Text style={styles.statValue}>
                      {stats.minHumidity.toFixed(1)}% / {stats.maxHumidity.toFixed(1)}%
                    </Text>
                  </View>
                  <TrendIndicator
                    label="Humidity Trend"
                    trendInfo={humidityTrendInfo}
                  />
                  
                  <View style={styles.sectionDivider} />
                  
                  <View style={styles.statRow}>
                    <Text style={styles.statLabel}>Avg Particles:</Text>
                    <Text style={styles.statValue}>{stats.avgParticulas.toFixed(1)}</Text>
                  </View>
                  <TrendIndicator
                    label="Particles Trend"
                    trendInfo={particlesTrendInfo}
                  />
                  
                  <View style={styles.sectionDivider} />
                  
                  <View style={styles.statRow}>
                    <Text style={styles.statLabel}>Total Readings:</Text>
                    <Text style={styles.statValue}>{readings.length}</Text>
                  </View>
                  <View style={styles.statRow}>
                    <Text style={styles.statLabel}>Moving Avg Window:</Text>
                    <Text style={styles.statValue}>{maWindowSize} readings</Text>
                  </View>
                </ChartCard>

                {/* Temperature with MA and Trend */}
                <ChartCard title="Temperature Analysis">
                  <AnalysisChart
                    data={tempData}
                    movingAverage={tempMA}
                    trendLine={tempTrend.trendLine}
                    color="#ef4444"
                    maColor="#f97316"
                    trendColor="#7c3aed"
                    unit="°C"
                  />
                  <View style={styles.legendRow}>
                    <LegendItem color="#ef4444" label="Data" />
                    <LegendItem color="#f97316" label="Moving Avg" />
                    <LegendItem color="#7c3aed" label="Trend" dashed />
                  </View>
                </ChartCard>

                {/* Humidity with MA and Trend */}
                <ChartCard title="Humidity Analysis">
                  <AnalysisChart
                    data={humidityData}
                    movingAverage={humidityMA}
                    trendLine={humidityTrend.trendLine}
                    color="#3b82f6"
                    maColor="#06b6d4"
                    trendColor="#7c3aed"
                    unit="%"
                  />
                  <View style={styles.legendRow}>
                    <LegendItem color="#3b82f6" label="Data" />
                    <LegendItem color="#06b6d4" label="Moving Avg" />
                    <LegendItem color="#7c3aed" label="Trend" dashed />
                  </View>
                </ChartCard>

                {/* Particles with MA and Trend */}
                <ChartCard title="Particles Analysis">
                  <AnalysisChart
                    data={particlesData}
                    movingAverage={particlesMA}
                    trendLine={particlesTrend.trendLine}
                    color="#22c55e"
                    maColor="#84cc16"
                    trendColor="#7c3aed"
                    unit=""
                  />
                  <View style={styles.legendRow}>
                    <LegendItem color="#22c55e" label="Data" />
                    <LegendItem color="#84cc16" label="Moving Avg" />
                    <LegendItem color="#7c3aed" label="Trend" dashed />
                  </View>
                </ChartCard>

                {/* Recent Readings */}
                <ChartCard title="Recent Readings">
                  {readings.slice(-5).reverse().map((reading, index) => (
                    <View key={index} style={styles.readingRow}>
                      <Text style={styles.readingTime}>
                        {formatTimestamp(reading.timestamp)}
                      </Text>
                      <Text style={styles.readingValues}>
                        {reading.temperatura.toFixed(1)}°C | {reading.humidade.toFixed(0)}%
                      </Text>
                    </View>
                  ))}
                </ChartCard>
              </>
            )}
          </>
        )}

        {/* No data */}
        {!loading && readings.length === 0 && (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No readings available</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// Segment Button Component
type SegmentProps = {
  label: string;
  active: boolean;
  onPress: () => void;
};

function SegmentButton({ label, active, onPress }: SegmentProps) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.segmentButton, active && styles.segmentButtonActive]}
    >
      <Text style={[styles.segmentLabel, active && styles.segmentLabelActive]}>
        {label}
      </Text>
    </Pressable>
  );
}

// Chart Card Component
type ChartCardProps = {
  title: string;
  children: React.ReactNode;
};

function ChartCard({ title, children }: ChartCardProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{title}</Text>
      {children}
    </View>
  );
}

// Trend Indicator Component
type TrendIndicatorProps = {
  label: string;
  trendInfo: { direction: string; icon: string; color: string; text: string };
};

function TrendIndicator({ label, trendInfo }: TrendIndicatorProps) {
  return (
    <View style={styles.trendRow}>
      <Text style={styles.statLabel}>{label}:</Text>
      <View style={styles.trendBadge}>
        <Text style={[styles.trendIcon, { color: trendInfo.color }]}>
          {trendInfo.icon}
        </Text>
        <Text style={[styles.trendText, { color: trendInfo.color }]}>
          {trendInfo.text}
        </Text>
      </View>
    </View>
  );
}

// Legend Item Component
type LegendItemProps = {
  color: string;
  label: string;
  dashed?: boolean;
};

function LegendItem({ color, label, dashed }: LegendItemProps) {
  return (
    <View style={styles.legendItem}>
      <View
        style={[
          styles.legendLine,
          { backgroundColor: color },
          dashed && styles.legendLineDashed,
        ]}
      />
      <Text style={styles.legendLabel}>{label}</Text>
    </View>
  );
}

// Simple Chart Component (for Overview)
type SimpleChartProps = {
  data: number[];
  color: string;
  unit: string;
  showAvgLine?: boolean;
  avgValue?: number;
};

function SimpleChart({ data, color, unit, showAvgLine, avgValue }: SimpleChartProps) {
  if (data.length === 0) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const chartHeight = 100;

  // Sample data to show max ~40 bars
  const sampleRate = Math.max(1, Math.floor(data.length / 40));
  const sampledData = data.filter((_, i) => i % sampleRate === 0);

  // Calculate average line position as percentage from bottom
  const avgPercent = avgValue !== undefined
    ? ((avgValue - min) / range) * 100
    : 0;

  return (
    <View style={styles.chartContainer}>
      <View style={styles.chartLabels}>
        <Text style={styles.chartLabelText}>
          {max.toFixed(1)}{unit}
        </Text>
        <Text style={styles.chartLabelText}>
          {min.toFixed(1)}{unit}
        </Text>
      </View>
      <View style={[styles.chartBars, { height: chartHeight }]}>
        {showAvgLine && avgValue !== undefined && (
          <View
            style={[
              styles.avgLine,
              { bottom: `${avgPercent}%` },
            ]}
          />
        )}
        {sampledData.map((value, index) => {
          const heightPercent = ((value - min) / range) * 100;
          return (
            <View
              key={index}
              style={[
                styles.bar,
                {
                  height: `${Math.max(heightPercent, 2)}%`,
                  backgroundColor: color,
                },
              ]}
            />
          );
        })}
      </View>
    </View>
  );
}

// Analysis Chart Component (with MA and Trend)
type AnalysisChartProps = {
  data: number[];
  movingAverage: number[];
  trendLine: number[];
  color: string;
  maColor: string;
  trendColor: string;
  unit: string;
};

function AnalysisChart({
  data,
  movingAverage,
  trendLine,
  color,
  maColor,
  trendColor,
  unit,
}: AnalysisChartProps) {
  if (data.length === 0) return null;

  // Combine all data to find min/max
  const allValues = [...data, ...movingAverage, ...trendLine];
  const min = Math.min(...allValues);
  const max = Math.max(...allValues);
  const range = max - min || 1;
  const chartHeight = 120;

  // Sample data for display
  const sampleRate = Math.max(1, Math.floor(data.length / 40));
  const sampledIndices = data.map((_, i) => i).filter((i) => i % sampleRate === 0);
  
  const sampledData = sampledIndices.map((i) => data[i]);
  const sampledMA = sampledIndices.map((i) => movingAverage[i]);
  const sampledTrend = sampledIndices.map((i) => trendLine[i]);

  const getYPosition = (value: number) => {
    return ((value - min) / range) * 100;
  };

  return (
    <View style={styles.chartContainer}>
      <View style={styles.chartLabels}>
        <Text style={styles.chartLabelText}>
          {max.toFixed(1)}{unit}
        </Text>
        <Text style={styles.chartLabelText}>
          {((max + min) / 2).toFixed(1)}{unit}
        </Text>
        <Text style={styles.chartLabelText}>
          {min.toFixed(1)}{unit}
        </Text>
      </View>
      <View style={[styles.analysisChartArea, { height: chartHeight }]}>
        {/* Trend Line (background) */}
        <View style={styles.lineLayer}>
          {sampledTrend.map((value, index) => {
            if (index === 0) return null;
            const prevY = getYPosition(sampledTrend[index - 1]);
            const currY = getYPosition(value);
            const segmentWidth = 100 / (sampledTrend.length - 1);
            
            return (
              <View
                key={`trend-${index}`}
                style={[
                  styles.trendSegment,
                  {
                    left: `${(index - 1) * segmentWidth}%`,
                    width: `${segmentWidth}%`,
                    bottom: `${Math.min(prevY, currY)}%`,
                    height: 2,
                    backgroundColor: trendColor,
                    transform: [
                      { rotate: `${Math.atan2(currY - prevY, segmentWidth) * 0.5}rad` },
                    ],
                  },
                ]}
              />
            );
          })}
        </View>

        {/* Moving Average Line */}
        <View style={styles.lineLayer}>
          {sampledMA.map((value, index) => {
            const yPos = getYPosition(value);
            const dotSize = 6;
            const segmentWidth = 100 / sampledMA.length;
            
            return (
              <View
                key={`ma-${index}`}
                style={[
                  styles.maDot,
                  {
                    left: `${index * segmentWidth + segmentWidth / 2 - 1}%`,
                    bottom: `${yPos - 1}%`,
                    width: dotSize,
                    height: dotSize,
                    backgroundColor: maColor,
                  },
                ]}
              />
            );
          })}
        </View>

        {/* Data Bars */}
        <View style={styles.barsLayer}>
          {sampledData.map((value, index) => {
            const heightPercent = getYPosition(value);
            return (
              <View
                key={`bar-${index}`}
                style={[
                  styles.bar,
                  {
                    height: `${Math.max(heightPercent, 2)}%`,
                    backgroundColor: color,
                    opacity: 0.7,
                  },
                ]}
              />
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#e0f2fe',
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  header: {
    marginBottom: 16,
  },
  stationLabel: {
    fontSize: 14,
    color: '#64748b',
  },
  stationName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0f172a',
  },
  segmentRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  segmentButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    marginHorizontal: 4,
  },
  segmentButtonActive: {
    backgroundColor: '#2563eb',
  },
  segmentLabel: {
    fontSize: 14,
    color: '#64748b',
  },
  segmentLabelActive: {
    color: '#ffffff',
    fontWeight: '600',
  },
  card: {
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 12,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 12,
    color: '#64748b',
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    color: '#64748b',
  },
  chartContainer: {
    flexDirection: 'row',
  },
  chartLabels: {
    width: 50,
    justifyContent: 'space-between',
    paddingRight: 8,
  },
  chartLabelText: {
    fontSize: 10,
    color: '#64748b',
  },
  chartInfo: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 8,
    textAlign: 'right',
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  statLabel: {
    fontSize: 14,
    color: '#64748b',
  },
  statValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a',
  },
  readingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  readingTime: {
    fontSize: 12,
    color: '#64748b',
  },
  readingValues: {
    fontSize: 12,
    fontWeight: '500',
    color: '#0f172a',
  },
  chartBars: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 2,
    backgroundColor: '#f1f5f9',
    borderRadius: 4,
    padding: 4,
    position: 'relative',
  },
  bar: {
    flex: 1,
    borderRadius: 2,
    minWidth: 3,
  },
  avgLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: '#94a3b8',
    borderStyle: 'dashed',
  },
  // Trend indicator styles
  trendRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  trendIcon: {
    fontSize: 16,
    fontWeight: '700',
    marginRight: 4,
  },
  trendText: {
    fontSize: 12,
    fontWeight: '600',
  },
  sectionDivider: {
    height: 12,
    borderBottomWidth: 2,
    borderBottomColor: '#cbd5e1',
    marginBottom: 8,
  },
  // Legend styles
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 12,
    gap: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendLine: {
    width: 16,
    height: 3,
    borderRadius: 2,
    marginRight: 6,
  },
  legendLineDashed: {
    opacity: 0.7,
  },
  legendLabel: {
    fontSize: 11,
    color: '#64748b',
  },
  // Analysis chart styles
  analysisChartArea: {
    flex: 1,
    backgroundColor: '#f1f5f9',
    borderRadius: 4,
    padding: 4,
    position: 'relative',
  },
  lineLayer: {
    position: 'absolute',
    left: 4,
    right: 4,
    top: 4,
    bottom: 4,
  },
  barsLayer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 2,
  },
  maDot: {
    position: 'absolute',
    borderRadius: 3,
  },
  trendSegment: {
    position: 'absolute',
    opacity: 0.6,
  },
});