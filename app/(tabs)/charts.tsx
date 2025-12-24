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
  getAllReadings,
  calculateStats,
  formatTimestamp,
  Reading,
} from '../../services/firebaseService';

type Mode = 'overview' | 'analysis';
type Range = '24h' | '7d' | '30d';

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
                    data={readings.map((r) => r.temperatura)}
                    color="#ef4444"
                    unit="°C"
                  />
                  <Text style={styles.chartInfo}>
                    {readings.length} readings
                  </Text>
                </ChartCard>
                <ChartCard title="Humidity">
                  <SimpleChart
                    data={readings.map((r) => r.humidade)}
                    color="#3b82f6"
                    unit="%"
                  />
                </ChartCard>
                <ChartCard title="Particles">
                  <SimpleChart
                    data={readings.map((r) => r.particulas)}
                    color="#22c55e"
                    unit=""
                  />
                </ChartCard>
              </>
            ) : (
              <>
                <ChartCard title="Statistics">
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
                  <View style={styles.statRow}>
                    <Text style={styles.statLabel}>Avg Particles:</Text>
                    <Text style={styles.statValue}>{stats.avgParticulas.toFixed(1)}</Text>
                  </View>
                  <View style={styles.statRow}>
                    <Text style={styles.statLabel}>Total Readings:</Text>
                    <Text style={styles.statValue}>{readings.length}</Text>
                  </View>
                </ChartCard>

                <ChartCard title="Temperature Range">
                  <SimpleChart
                    data={readings.map((r) => r.temperatura)}
                    color="#ef4444"
                    unit="°C"
                    showAvgLine
                    avgValue={stats.avgTemp}
                  />
                </ChartCard>

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
});
