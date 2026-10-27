/**
 * GeofenceService Test/Verification Script
 *
 * This file can be used to test geofencing functionality.
 * Run with: npx expo install jest-expo && npx jest mobile/src/services/geofenceService.test.ts
 * Or manually call functions from React Native debugger console.
 */

import { geofenceService, FriendForGeofencing } from './geofenceService';
import { api } from './api';
import { logger } from '../utils/logger';

// Mock data for testing
const mockFriends: FriendForGeofencing[] = [
  {
    id: 'friend-1',
    name: 'Alice',
    picture: 'https://example.com/alice.jpg',
    latitude: 37.7749,
    longitude: -122.4194,
    radius: 1000,
    lastUpdated: new Date().toISOString(),
  },
  {
    id: 'friend-2',
    name: 'Bob',
    picture: 'https://example.com/bob.jpg',
    latitude: 37.7849,
    longitude: -122.4094,
    radius: 2000,
    lastUpdated: new Date().toISOString(),
  },
];

/**
 * Test 1: Initialize geofence service
 */
export async function testInitialize(): Promise<void> {
  logger.info('[Test] Testing GeofenceService initialization...');

  try {
    await geofenceService.initialize();
    logger.info('[Test] ✅ GeofenceService initialized successfully');

    const status = geofenceService.getStatus();
    logger.info('[Test] Status:', status);
  } catch (error) {
    logger.error('[Test] ❌ Initialization failed:', error);
    throw error;
  }
}

/**
 * Test 2: Setup geofences with mock data
 */
export async function testSetupGeofences(token: string): Promise<void> {
  logger.info('[Test] Testing geofence setup with mock data...');

  try {
    // Manually call the private setupGeofences method via reflection for testing
    // @ts-ignore - accessing private method for testing
    await geofenceService.setupGeofences(mockFriends);

    logger.info('[Test] ✅ Geofences set up successfully');

    const status = geofenceService.getStatus();
    logger.info('[Test] Status after setup:', status);
  } catch (error) {
    logger.error('[Test] ❌ Setup failed:', error);
    throw error;
  }
}

/**
 * Test 3: Simulate geofence enter event
 */
export async function testGeofenceEnter(): Promise<void> {
  logger.info('[Test] Testing geofence enter simulation...');

  try {
    // @ts-ignore - accessing private method for testing
    await geofenceService.onGeofenceEnter('friend-1', 'Alice');

    logger.info('[Test] ✅ Geofence enter handled');

    const status = geofenceService.getStatus();
    logger.info('[Test] Status after enter:', status);
  } catch (error) {
    logger.error('[Test] ❌ Enter simulation failed:', error);
    throw error;
  }
}

/**
 * Test 4: Simulate geofence exit event
 */
export async function testGeofenceExit(): Promise<void> {
  logger.info('[Test] Testing geofence exit simulation...');

  try {
    // @ts-ignore - accessing private method for testing
    await geofenceService.onGeofenceExit('friend-1');

    logger.info('[Test] ✅ Geofence exit handled');

    const status = geofenceService.getStatus();
    logger.info('[Test] Status after exit:', status);
  } catch (error) {
    logger.error('[Test] ❌ Exit simulation failed:', error);
    throw error;
  }
}

/**
 * Test 4: Full integration test
 */
export async function runFullTest(token: string): Promise<void> {
  logger.info('[Test] === Starting Full Geofence Integration Test ===');

  try {
    // 1. Initialize
    await testInitialize();

    // 2. Setup geofences
    await testSetupGeofences(token);

    // 3. Simulate enter
    await testGeofenceEnter();

    // 4. Wait a bit
    await new Promise(resolve => setTimeout(resolve, 2000));

    // 5. Simulate exit
    await testGeofenceExit();

    // 6. Cleanup
    await geofenceService.stop();

    logger.info('[Test] === All Tests Passed ===');
  } catch (error) {
    logger.error('[Test] === Test Suite Failed ===', error);
    throw error;
  }
}

/**
 * Debug: Get current geofence status
 */
export function getDebugStatus(): void {
  const status = geofenceService.getStatus();
  logger.info('[Debug] Geofence Status:', status);
}

/**
 * Manual test function to call from React Native debugger console:
 *
 * import { runFullTest } from './services/geofenceService.test';
 * import { useAuthStore } from './store/authStore';
 * const token = useAuthStore.getState().token;
 * runFullTest(token);
 */

export default {
  testInitialize,
  testSetupGeofences,
  testGeofenceEnter,
  testGeofenceExit,
  runFullTest,
  getDebugStatus,
};