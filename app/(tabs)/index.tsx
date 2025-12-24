import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  View,
  Pressable,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  getAvailableStations,
  getLatestReading,
  formatTimestamp,
  Reading,
} from '../../services/firebaseService';

export default function HomeScreen() {
  const [stations, setStations] = useState<string[]>([]);
  const [selectedStation, setSelectedStation] = useState<string>('STATION_00');
  const [reading, setReading] = useState<Reading | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load available stations on mount
  useEffect(() => {
    loadStations();
  }, []);

  // Load reading when station changes
  useEffect(() => {
    if (selectedStation) {
      loadReading();
    }
  }, [selectedStation]);

  const loadStations = async () => {
    try {
      const availableStations = await getAvailableStations();
      setStations(availableStations);
      if (availableStations.length > 0 && !availableStations.includes(selectedStation)) {
        setSelectedStation(availableStations[0]);
      }
    } catch (err) {
      console.error('Error loading stations:', err);
    }
  };

  const loadReading = async () => {
    setLoading(true);
    setError(null);
    try {
      const latestReading = await getLatestReading(selectedStation);
      if (latestReading) {
        setReading(latestReading);
      } else {
        setError('No readings available');
      }
    } catch (err) {
      setError('Failed to load data');
      console.error('Error loading reading:', err);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadReading();
    setRefreshing(false);
  };

  // Format station name for display
  const formatStationName = (stationId: string) => {
    return stationId.replace('_', ' ');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Station selector */}
        <View style={styles.header}>
          <Text style={styles.stationLabel}>Weather Station</Text>
          <Text style={styles.stationName}>{formatStationName(selectedStation)}</Text>
        </View>

        {/* Station buttons */}
        {stations.length > 1 && (
          <View style={styles.stationSelector}>
            {stations.map((station) => (
              <Pressable
                key={station}
                style={[
                  styles.stationButton,
                  selectedStation === station && styles.stationButtonActive,
                ]}
                onPress={() => setSelectedStation(station)}
              >
                <Text
                  style={[
                    styles.stationButtonText,
                    selectedStation === station && styles.stationButtonTextActive,
                  ]}
                >
                  {formatStationName(station)}
                </Text>
              </Pressable>
            ))}
          </View>
        )}

        {/* Loading state */}
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#2563eb" />
            <Text style={styles.loadingText}>Loading data...</Text>
          </View>
        )}

        {/* Error state */}
        {error && !loading && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <Pressable style={styles.retryButton} onPress={loadReading}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </Pressable>
          </View>
        )}

        {/* Data display */}
        {reading && !loading && !error && (
          <>
            {/* Current temperature card */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Current Conditions</Text>
              <Text style={styles.temperature}>
                {reading.temperatura.toFixed(1)}°C
              </Text>
              <Text style={styles.timestamp}>
                Last updated: {formatTimestamp(reading.timestamp)}
              </Text>
            </View>

            {/* Extra details */}
            <View style={styles.row}>
              <View style={[styles.smallCard, { marginRight: 8 }]}>
                <Text style={styles.smallLabel}>Humidity</Text>
                <Text style={styles.smallValue}>{reading.humidade.toFixed(1)}%</Text>
              </View>
              <View style={[styles.smallCard, { marginLeft: 8 }]}>
                <Text style={styles.smallLabel}>Particles</Text>
                <Text style={styles.smallValue}>
                  {reading.particulas.toFixed(1)}
                </Text>
              </View>
            </View>

            {/* Raw data card */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Raw Data</Text>
              <View style={styles.dataRow}>
                <Text style={styles.dataLabel}>Temperature:</Text>
                <Text style={styles.dataValue}>{reading.temperatura}°C</Text>
              </View>
              <View style={styles.dataRow}>
                <Text style={styles.dataLabel}>Humidity:</Text>
                <Text style={styles.dataValue}>{reading.humidade}%</Text>
              </View>
              <View style={styles.dataRow}>
                <Text style={styles.dataLabel}>Particles:</Text>
                <Text style={styles.dataValue}>{reading.particulas}</Text>
              </View>
              <View style={styles.dataRow}>
                <Text style={styles.dataLabel}>Timestamp:</Text>
                <Text style={styles.dataValue}>{reading.timestamp}</Text>
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#e0f2fe',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
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
  stationSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
    gap: 8,
  },
  stationButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#f8fafc',
  },
  stationButtonActive: {
    backgroundColor: '#2563eb',
  },
  stationButtonText: {
    fontSize: 12,
    color: '#64748b',
  },
  stationButtonTextActive: {
    color: '#ffffff',
    fontWeight: '600',
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
  errorContainer: {
    alignItems: 'center',
    padding: 40,
  },
  errorText: {
    color: '#ef4444',
    marginBottom: 16,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#2563eb',
    borderRadius: 8,
  },
  retryButtonText: {
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
    marginBottom: 8,
  },
  temperature: {
    fontSize: 48,
    fontWeight: '700',
    color: '#0ea5e9',
  },
  timestamp: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 8,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  smallCard: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  smallLabel: {
    fontSize: 14,
    color: '#64748b',
  },
  smallValue: {
    fontSize: 24,
    fontWeight: '600',
    color: '#0f172a',
    marginTop: 4,
  },
  dataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  dataLabel: {
    fontSize: 14,
    color: '#64748b',
  },
  dataValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#0f172a',
  },
});
