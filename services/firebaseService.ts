import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  Timestamp,
  where,
} from 'firebase/firestore';
import { db } from '../firebaseConfig';

// Types based on your Firestore structure
export type Reading = {
  temperatura: number;
  humidade: number;
  particulas: number;
  timestamp: number;
};

export type StationMetadata = {
  varNames: string[];
};

export type CollectionsMetadata = {
  name: string[];
};

// Get list of available stations from metadados/collections
export async function getAvailableStations(): Promise<string[]> {
  try {
    const collectionsDoc = await getDoc(doc(db, 'metadados', 'collections'));
    if (collectionsDoc.exists()) {
      const data = collectionsDoc.data() as CollectionsMetadata;
      return data.name || [];
    }
    return [];
  } catch (error) {
    console.error('Error fetching stations:', error);
    return [];
  }
}

// Get metadata for a specific station (variable names)
export async function getStationMetadata(stationId: string): Promise<StationMetadata | null> {
  try {
    const metadataDoc = await getDoc(doc(db, stationId, 'metadados'));
    if (metadataDoc.exists()) {
      return metadataDoc.data() as StationMetadata;
    }
    return null;
  } catch (error) {
    console.error('Error fetching station metadata:', error);
    return null;
  }
}

// Get the latest reading from a station
export async function getLatestReading(stationId: string): Promise<Reading | null> {
  try {
    const stationRef = collection(db, stationId);
    // Query all documents, order by timestamp descending, get first one
    const q = query(
      stationRef,
      orderBy('timestamp', 'desc'),
      limit(1)
    );
    
    const snapshot = await getDocs(q);
    
    if (!snapshot.empty) {
      const docData = snapshot.docs[0].data();
      // Skip metadata document
      if (snapshot.docs[0].id === 'metadados') {
        // If we got metadata, try to get the next one
        const q2 = query(
          stationRef,
          orderBy('timestamp', 'desc'),
          limit(2)
        );
        const snapshot2 = await getDocs(q2);
        for (const doc of snapshot2.docs) {
          if (doc.id !== 'metadados') {
            return doc.data() as Reading;
          }
        }
        return null;
      }
      return docData as Reading;
    }
    return null;
  } catch (error) {
    console.error('Error fetching latest reading:', error);
    return null;
  }
}

// Get readings for a time range
export async function getReadings(
  stationId: string,
  hoursBack: number = 24
): Promise<Reading[]> {
  try {
    const stationRef = collection(db, stationId);
    const cutoffTime = Math.floor(Date.now() / 1000) - (hoursBack * 3600);
    
    const q = query(
      stationRef,
      where('timestamp', '>=', cutoffTime),
      orderBy('timestamp', 'asc')
    );
    
    const snapshot = await getDocs(q);
    const readings: Reading[] = [];
    
    snapshot.forEach((doc) => {
      // Skip metadata document
      if (doc.id !== 'metadados') {
        readings.push(doc.data() as Reading);
      }
    });
    
    return readings;
  } catch (error) {
    console.error('Error fetching readings:', error);
    return [];
  }
}

// Get all readings (useful if timestamp filtering doesn't work)
export async function getAllReadings(
  stationId: string,
  maxCount: number = 100
): Promise<Reading[]> {
  try {
    const stationRef = collection(db, stationId);
    const q = query(
      stationRef,
      orderBy('timestamp', 'desc'),
      limit(maxCount)
    );
    
    const snapshot = await getDocs(q);
    const readings: Reading[] = [];
    
    snapshot.forEach((doc) => {
      // Skip metadata document
      if (doc.id !== 'metadados') {
        readings.push(doc.data() as Reading);
      }
    });
    
    // Reverse to get chronological order
    return readings.reverse();
  } catch (error) {
    console.error('Error fetching all readings:', error);
    return [];
  }
}

// Calculate statistics from readings
export function calculateStats(readings: Reading[]) {
  if (readings.length === 0) {
    return {
      avgTemp: 0,
      avgHumidity: 0,
      avgParticulas: 0,
      minTemp: 0,
      maxTemp: 0,
      minHumidity: 0,
      maxHumidity: 0,
    };
  }
  
  const temps = readings.map(r => r.temperatura);
  const humidities = readings.map(r => r.humidade);
  const particulas = readings.map(r => r.particulas);
  
  return {
    avgTemp: temps.reduce((a, b) => a + b, 0) / temps.length,
    avgHumidity: humidities.reduce((a, b) => a + b, 0) / humidities.length,
    avgParticulas: particulas.reduce((a, b) => a + b, 0) / particulas.length,
    minTemp: Math.min(...temps),
    maxTemp: Math.max(...temps),
    minHumidity: Math.min(...humidities),
    maxHumidity: Math.max(...humidities),
  };
}

// Format timestamp to readable date/time
export function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp * 1000);
  return date.toLocaleString('pt-PT', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}
