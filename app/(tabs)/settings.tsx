import React, { useState } from 'react';
import {
    Pressable,
    StyleSheet,
    Switch,
    Text,
    View,
} from 'react-native';
import {
    SafeAreaView,
} from 'react-native-safe-area-context';

export default function SettingsScreen() {
  const [useMetric, setUseMetric] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Settings</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Units</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Metric (°C, km/h)</Text>
          <Switch value={useMetric} onValueChange={setUseMetric} />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Appearance</Text>
        <View className="row">
          <View style={styles.row}>
            <Text style={styles.label}>Dark mode</Text>
            <Switch value={darkMode} onValueChange={setDarkMode} />
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Data</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Auto refresh</Text>
          <Switch
            value={autoRefresh}
            onValueChange={setAutoRefresh}
          />
        </View>

        <Pressable style={styles.button}>
          <Text style={styles.buttonText}>Change refresh interval</Text>
        </Pressable>
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
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 16,
  },
  section: {
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    color: '#1f2937',
  },
  button: {
    marginTop: 8,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#2563eb',
    alignItems: 'center',
  },
  buttonText: {
    color: '#f9fafb',
    fontWeight: '600',
  },
});
