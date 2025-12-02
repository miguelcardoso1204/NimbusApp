import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type WeatherMeasurement = {
  stationName: string;
  temperature: number;
  feelsLike: number;
  description: string;
  humidity: number;
  windSpeed: number;
};

const mockCurrent: WeatherMeasurement = {
  stationName: 'Porto, Portugal',
  temperature: 18.5,
  feelsLike: 17.8,
  description: 'Partly cloudy',
  humidity: 66,
  windSpeed: 14.6,
};

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.container}>
      {/* Station name */}
      <View style={styles.header}>
        <Text style={styles.stationLabel}>Weather Station</Text>
        <Text style={styles.stationName}>{mockCurrent.stationName}</Text>
      </View>

      {/* Current temperature card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Current Conditions</Text>
        <Text style={styles.temperature}>
          {mockCurrent.temperature.toFixed(1)}°C
        </Text>
        <Text style={styles.description}>{mockCurrent.description}</Text>
        <Text style={styles.feelsLike}>
          Feels like {mockCurrent.feelsLike.toFixed(1)}°C
        </Text>
      </View>

      {/* Extra details */}
      <View style={styles.row}>
        <View style={[styles.smallCard, { marginRight: 8 }]}>
          <Text style={styles.smallLabel}>Humidity</Text>
          <Text style={styles.smallValue}>{mockCurrent.humidity}%</Text>
        </View>
        <View style={[styles.smallCard, { marginLeft: 8 }]}>
          <Text style={styles.smallLabel}>Wind</Text>
          <Text style={styles.smallValue}>
            {mockCurrent.windSpeed.toFixed(1)} km/h
          </Text>
        </View>
      </View>
    </SafeAreaView>
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
  card: {
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 8,
  },
  temperature: {
    fontSize: 40,
    fontWeight: '700',
    color: '#0ea5e9',
  },
  description: {
    fontSize: 16,
    color: '#334155',
    marginTop: 4,
  },
  feelsLike: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 8,
  },
  row: {
    flexDirection: 'row',
  },
  smallCard: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 16,
    elevation: 2,
  },
  smallLabel: {
    fontSize: 14,
    color: '#64748b',
  },
  smallValue: {
    fontSize: 20,
    fontWeight: '600',
    color: '#0f172a',
    marginTop: 4,
  },
});
