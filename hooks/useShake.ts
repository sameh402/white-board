import { useState, useEffect } from 'react';
import { Accelerometer } from 'expo-sensors';

const THRESHOLD = 1.8; // Lower threshold for Expo sensors

export const useShake = (onShake: () => void) => {
  const [data, setData] = useState({ x: 0, y: 0, z: 0 });
  const [lastShake, setLastShake] = useState(0);

  useEffect(() => {
    Accelerometer.setUpdateInterval(100);

    const subscription = Accelerometer.addListener(accelerometerData => {
      setData(accelerometerData);
    });

    return () => subscription.remove();
  }, []);

  useEffect(() => {
    const { x, y, z } = data;
    // Calculate total acceleration
    const acceleration = Math.sqrt(x * x + y * y + z * z);

    // If acceleration exceeds threshold (simple shake detection)
    // 1.0 is roughly gravity (stationary). > 1.8 implies movement.
    if (acceleration > THRESHOLD) {
      const now = Date.now();
      if (now - lastShake > 1000) {
        setLastShake(now);
        onShake();
      }
    }
  }, [data, onShake, lastShake]);

  return { 
    requestPermission: async () => {}, // Expo handles permissions usually, or returns promise
    permissionGranted: true 
  };
};