import * as Updates from 'expo-updates';
import { logger } from '../utils/logger';

export const checkAndApplyOtaUpdate = async () => {
  // In Expo Go this can throw or be unavailable; keep it non-blocking.
  try {
    if (__DEV__ || !Updates.isEnabled) {
      return;
    }

    const update = await Updates.checkForUpdateAsync();
    if (update.isAvailable) {
      await Updates.fetchUpdateAsync();
      await Updates.reloadAsync();
    }
  } catch (error) {
    logger.info('OTA check skipped:', error);
  }
};
