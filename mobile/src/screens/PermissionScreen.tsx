import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../theme';
import { Button } from '../components/Button';
import * as Location from 'expo-location';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';

type NavProp = NativeStackNavigationProp<RootStackParamList, 'Permission'>;

const PermissionScreen = () => {
    const navigation = useNavigation<NavProp>();

    useEffect(() => {
        const checkPermission = async () => {
            const { status } = await Location.getForegroundPermissionsAsync();
            if (status === 'granted') {
                navigation.replace('MainTabs');
            }
        };
        checkPermission();
    }, [navigation]);

    const requestLocationPermission = async () => {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
            navigation.replace('MainTabs');
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
