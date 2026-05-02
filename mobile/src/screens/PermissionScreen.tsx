import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../theme';
import { Button } from '../components/Button';
import * as Location from 'expo-location';
import { logger } from '../utils/logger';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { LocationService } from '../services/locationService';
import { useAppStore } from '../store/useAppStore';

type NavProp = NativeStackNavigationProp<RootStackParamList, 'Permission'>;

const PermissionScreen = () => {
    const navigation = useNavigation<NavProp>();
    const shareLocation = useAppStore((state) => state.shareLocation);

    const enterApp = async () => {
        if (shareLocation) {
            try {
                await LocationService.startLocationUpdates();
            } catch (error) {
                logger.info('[Permission] Deferred location updates:', (error as Error).message);
            }
        }

        navigation.replace('MainTabs');
    };

    useEffect(() => {
        const checkPermission = async () => {
            const { status } = await Location.getForegroundPermissionsAsync();
            if (status === 'granted') {
                await enterApp();
            }
        };
        checkPermission();
    }, [navigation, shareLocation]);

    const requestLocationPermission = async () => {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
            await enterApp();
        } else {
            alert('Location permission is required for NearMe to function.');
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Enable Location</Text>
            <Text style={styles.description}>
                NearMe needs your location to notify you when friends are nearby.
                Your exact location is never shared with anyone, only your relative proximity.
            </Text>

            <View style={styles.buttonContainer}>
                <Button
                    title="Enable Location"
                    onPress={requestLocationPermission}
                />
                <Button
                    title="Continue Without Location"
                    onPress={() => navigation.replace('MainTabs')}
                    variant="outline"
                    style={{ marginTop: theme.spacing.md }}
                />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
        padding: theme.spacing.lg,
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        fontSize: theme.typography.h1.fontSize,
        fontWeight: theme.typography.h1.fontWeight as any,
        color: theme.colors.text,
        marginBottom: theme.spacing.md,
    },
    description: {
        fontSize: theme.typography.body.fontSize,
        color: theme.colors.text,
        textAlign: 'center',
        marginBottom: theme.spacing.xl,
        lineHeight: 24,
    },
    buttonContainer: {
        width: '100%',
    }
});

export default PermissionScreen;
