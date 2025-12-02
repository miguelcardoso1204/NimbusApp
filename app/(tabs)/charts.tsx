import React, { useState } from 'react';
import {
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type Mode = 'overview' | 'analysis';
type Range = '24h' | '7d' | '30d';

export default function ChartsScreen() {
  const [mode, setMode] = useState<Mode>('overview');
  const [range, setRange] = useState<Range>('24h');

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
        {/* Station */}
        <View style={styles.header}>
          <Text style={styles.stationLabel}>Weather Station</Text>
          <Text style={styles.stationName}>Porto, Portugal</Text>
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

        {/* Charts / Cards */}
        {mode === 'overview' ? (
          <>
            <ChartCard title="Temperature">
              <FakeChart />
            </ChartCard>
            <ChartCard title="Humidity">
              <FakeChart />
            </ChartCard>
          </>
        ) : (
          <>
            <ChartCard title="Average Values">
              <Text style={styles.textLine}>Temperature: 15.3°C</Text>
              <Text style={styles.textLine}>Humidity: 66%</Text>
              <Text style={styles.textLine}>Wind: 14.6 km/h</Text>
            </ChartCard>

            <ChartCard title="Temperature vs Average">
              <FakeChart showAvgLine />
            </ChartCard>
          </>
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
      style={[
        styles.segmentButton,
        active && styles.segmentButtonActive,
      ]}
    >
      <Text
        style={[
          styles.segmentLabel,
          active && styles.segmentLabelActive,
        ]}
      >
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

function FakeChart({ showAvgLine }: { showAvgLine?: boolean }) {
  return (
    <View style={styles.fakeChart}>
      {showAvgLine && <View style={styles.avgLine} />}
      <Text style={styles.fakeChartLabel}>[chart placeholder]</Text>
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
    marginBottom: 12,
  },
  stationLabel: {
    fontSize: 14,
    color: '#64748b',
  },
  stationName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0f172a',
  },
  segmentRow: {
    flexDirection: 'row',
    backgroundColor: '#bfdbfe',
    borderRadius: 999,
    padding: 4,
    marginBottom: 12,
  },
  segmentButton: {
    flex: 1,
    borderRadius: 999,
    paddingVertical: 6,
    alignItems: 'center',
  },
  segmentButtonActive: {
    backgroundColor: '#f8fafc',
  },
  segmentLabel: {
    fontSize: 14,
    color: '#0f172a',
  },
  segmentLabelActive: {
    fontWeight: '600',
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
  fakeChart: {
    height: 160,
    borderRadius: 12,
    backgroundColor: '#dbeafe',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avgLine: {
    position: 'absolute',
    height: 2,
    backgroundColor: '#0f172a55',
    width: '90%',
  },
  fakeChartLabel: {
    color: '#64748b',
    fontSize: 12,
  },
  textLine: {
    fontSize: 14,
    color: '#1f2933',
    marginBottom: 4,
  },
});
