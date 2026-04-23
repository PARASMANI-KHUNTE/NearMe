import * as Location from 'expo-location';
import { emitLocation } from './socket';
import { useAppStore } from '../store/useAppStore';

let locationInterval: NodeJS.Timeout | null = null;

export const startLocationUpdates = () => {
    if (locationInterval) return;

    locationInterval = setInterval(async () => {
        const { shareLocation, radius, invisibleMode } = useAppStore.getState();

        if (shareLocation && !invisibleMode) {
            let { status } = await Location.getForegroundPermissionsAsync();
            if (status === 'granted') {
                try {
                    let loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
                    emitLocation(loc.coords.latitude, loc.coords.longitude, radius);
                } catch (e) {
                    console.error('Error fetching location:', e);
                }
            }
        }
    }, 30000); // 30 seconds
};

export const stopLocationUpdates = () => {
    if (locationInterval) {
        clearInterval(locationInterval);
        locationInterval = null;
    }
};