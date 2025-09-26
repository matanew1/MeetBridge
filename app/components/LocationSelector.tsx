import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { MapPin, Navigation, RefreshCw } from 'lucide-react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import LocationService from '../../services/locationService';

interface LocationSelectorProps {
  onLocationUpdate?: (
    location: string,
    coordinates: { latitude: number; longitude: number }
  ) => void;
  showCurrentLocation?: boolean;
  style?: any;
}

const LocationSelector: React.FC<LocationSelectorProps> = ({
  onLocationUpdate,
  showCurrentLocation = true,
  style,
}) => {
  const { isDarkMode } = useTheme();
  const theme = isDarkMode
    ? require('../../constants/theme').darkTheme
    : require('../../constants/theme').lightTheme;
  const { user, updateLocationLive, requestLocationPermission } = useAuth();

  const [isLoading, setIsLoading] = useState(false);
  const [hasLocationPermission, setHasLocationPermission] = useState(false);

  useEffect(() => {
    checkLocationPermission();
  }, []);

  const checkLocationPermission = async () => {
    const hasPermission = await LocationService.hasLocationPermissions();
    setHasLocationPermission(hasPermission);
  };

  const handleRequestPermission = async () => {
    const granted = await requestLocationPermission();
    setHasLocationPermission(granted);

    if (!granted) {
      Alert.alert(
        'Location Permission Required',
        'Please enable location access in your device settings to use this feature.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleUpdateLocation = async () => {
    if (!hasLocationPermission) {
      handleRequestPermission();
      return;
    }

    setIsLoading(true);
    try {
      const result = await updateLocationLive();

      if (result.success && result.location) {
        Alert.alert(
          'Location Updated',
          `Your location has been updated to: ${result.location}`,
          [{ text: 'OK' }]
        );

        // Call the callback if provided
        if (onLocationUpdate && user?.coordinates) {
          onLocationUpdate(result.location, {
            latitude: user.coordinates.latitude,
            longitude: user.coordinates.longitude,
          });
        }
      } else {
        Alert.alert(
          'Location Error',
          result.message || 'Could not update location',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      Alert.alert(
        'Location Error',
        'An error occurred while updating your location. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleGetCurrentLocation = async () => {
    if (!hasLocationPermission) {
      handleRequestPermission();
      return;
    }

    setIsLoading(true);
    try {
      const locationData = await LocationService.updateUserLocation();

      if (locationData) {
        const { coordinates, address } = locationData;
        Alert.alert(
          'Current Location',
          `You are currently at: ${address}\n\nLatitude: ${coordinates.latitude.toFixed(
            6
          )}\nLongitude: ${coordinates.longitude.toFixed(6)}`,
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Use This Location',
              onPress: () => {
                if (onLocationUpdate) {
                  onLocationUpdate(address, {
                    latitude: coordinates.latitude,
                    longitude: coordinates.longitude,
                  });
                }
              },
            },
          ]
        );
      }
    } catch (error) {
      Alert.alert(
        'Location Error',
        'Could not get your current location. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={[styles.container, style]}>
      {/* Current Location Display */}
      {showCurrentLocation && user?.location && (
        <View
          style={[
            styles.currentLocationCard,
            { backgroundColor: theme.surface },
          ]}
        >
          <View style={styles.currentLocationHeader}>
            <MapPin size={20} color={theme.primary} />
            <Text style={[styles.currentLocationTitle, { color: theme.text }]}>
              Current Location
            </Text>
          </View>
          <Text
            style={[styles.currentLocationText, { color: theme.textSecondary }]}
          >
            {user.location}
          </Text>
          {user.coordinates && (
            <Text
              style={[styles.coordinatesText, { color: theme.textSecondary }]}
            >
              {user.coordinates.latitude.toFixed(6)},{' '}
              {user.coordinates.longitude.toFixed(6)}
            </Text>
          )}
        </View>
      )}

      {/* Location Actions */}
      <View style={styles.actionsContainer}>
        {!hasLocationPermission ? (
          <TouchableOpacity
            style={[
              styles.actionButton,
              styles.permissionButton,
              { backgroundColor: theme.primaryVariant },
            ]}
            onPress={handleRequestPermission}
            disabled={isLoading}
          >
            <Navigation size={20} color={theme.primary} />
            <Text style={[styles.actionButtonText, { color: theme.primary }]}>
              Enable Location Access
            </Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[
                styles.actionButton,
                styles.primaryButton,
                { backgroundColor: theme.primary },
              ]}
              onPress={handleUpdateLocation}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <RefreshCw size={20} color="white" />
              )}
              <Text style={[styles.actionButtonText, { color: 'white' }]}>
                {isLoading ? 'Updating...' : 'Update Location'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.actionButton,
                styles.secondaryButton,
                { backgroundColor: theme.surface },
              ]}
              onPress={handleGetCurrentLocation}
              disabled={isLoading}
            >
              <Navigation size={20} color={theme.primary} />
              <Text style={[styles.actionButtonText, { color: theme.primary }]}>
                Get Current
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {!hasLocationPermission && (
        <Text style={[styles.permissionHint, { color: theme.textSecondary }]}>
          Location access is required to show nearby matches and update your
          position.
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  currentLocationCard: {
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  currentLocationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  currentLocationTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  currentLocationText: {
    fontSize: 14,
    lineHeight: 20,
  },
  coordinatesText: {
    fontSize: 12,
    fontFamily: 'monospace',
    opacity: 0.7,
  },
  actionsContainer: {
    gap: 12,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
    flex: 1,
  },
  permissionButton: {
    borderWidth: 2,
  },
  primaryButton: {
    flex: 2,
  },
  secondaryButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  permissionHint: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 16,
  },
});

export default LocationSelector;
