import { useEffect, useState, useCallback } from 'react';

const THRESHOLD = 15;
const TIMEOUT = 1000;

export const useShake = (onShake: () => void) => {
  const [permissionGranted, setPermissionGranted] = useState(false);

  const requestPermission = useCallback(async () => {
    if (typeof (DeviceMotionEvent as any).requestPermission === 'function') {
      try {
        const response = await (DeviceMotionEvent as any).requestPermission();
        if (response === 'granted') {
          setPermissionGranted(true);
        }
      } catch (error) {
        console.error('Error requesting device motion permission:', error);
      }
    } else {
      setPermissionGranted(true);
    }
  }, []);

  useEffect(() => {
    if (!permissionGranted) return;

    let lastX: number | null = null;
    let lastY: number | null = null;
    let lastZ: number | null = null;
    let lastUpdate = 0;

    const handleMotion = (event: DeviceMotionEvent) => {
      const current = event.accelerationIncludingGravity;
      if (!current) return;

      const { x, y, z } = current;
      if (x === null || y === null || z === null) return;

      const now = Date.now();
      if (now - lastUpdate > 100) {
        const diffTime = now - lastUpdate;
        lastUpdate = now;

        if (lastX !== null && lastY !== null && lastZ !== null) {
          const speed = Math.abs(x + y + z - lastX - lastY - lastZ) / diffTime * 10000;
          if (speed > THRESHOLD * 100) { // Multiplied for sensitivity adjustment
             onShake();
          }
        }

        lastX = x;
        lastY = y;
        lastZ = z;
      }
    };

    window.addEventListener('devicemotion', handleMotion);
    return () => {
      window.removeEventListener('devicemotion', handleMotion);
    };
  }, [permissionGranted, onShake]);

  return { requestPermission, permissionGranted };
};