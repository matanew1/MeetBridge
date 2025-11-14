// app/components/MapViewComponent.tsx
// Using Leaflet (OpenStreetMap) - 100% FREE, No API keys needed!
import React, { useRef, useMemo, useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  Dimensions,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { MapPin, Navigation, RefreshCw } from 'lucide-react-native';
import { Theme } from '../../constants/theme';
import * as Location from 'expo-location';

const { width, height } = Dimensions.get('window');

interface User {
  id: string;
  name: string;
  age: number;
  distance?: number | null;
  image: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

interface MapViewComponentProps {
  profiles: User[];
  currentUser: any;
  onProfileSelect: (profile: User) => void;
  maxDistance: number; // in meters
  theme: Theme;
  isVisible?: boolean; // Optional prop to control visibility for preloading
}

const MapViewComponent: React.FC<MapViewComponentProps> = ({
  profiles,
  currentUser,
  onProfileSelect,
  maxDistance,
  theme,
  isVisible = true,
}) => {
  const webViewRef = useRef<WebView>(null);
  const spinValue = useRef(new Animated.Value(0)).current;
  const spinAnimationRef = useRef<Animated.CompositeAnimation | null>(null);
  const [isMapReady, setIsMapReady] = React.useState(false);
  const [currentLocation, setCurrentLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [isRefreshingLocation, setIsRefreshingLocation] = useState(false);

  // Spinning animation for refresh button
  useEffect(() => {
    if (isRefreshingLocation) {
      // Start spinning animation
      spinAnimationRef.current = Animated.loop(
        Animated.timing(spinValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        })
      );
      spinAnimationRef.current.start();
    } else {
      // Stop spinning animation and reset to 0
      if (spinAnimationRef.current) {
        spinAnimationRef.current.stop();
        spinAnimationRef.current = null;
      }
      spinValue.setValue(0);
    }

    // Cleanup on unmount
    return () => {
      if (spinAnimationRef.current) {
        spinAnimationRef.current.stop();
      }
    };
  }, [isRefreshingLocation, spinValue]);

  // Get current location on mount and set up location watching
  useEffect(() => {
    let locationSubscription: Location.LocationSubscription | null = null;

    const getCurrentLocation = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          console.warn('Location permission denied');
          return;
        }

        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });

        setCurrentLocation({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
      } catch (error) {
        console.error('Error getting current location:', error);
      }
    };

    const watchLocation = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') return;

        locationSubscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            timeInterval: 10000, // Update every 10 seconds
            distanceInterval: 10, // Update when moved 10 meters
          },
          (location) => {
            setCurrentLocation({
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
            });
          }
        );

        return () => {
          // No heading subscription to remove
        };
      } catch (error) {
        console.error('Error watching location:', error);
      }
    };

    getCurrentLocation();
    watchLocation();

    return () => {
      if (locationSubscription) {
        locationSubscription.remove();
      }
    };
  }, []);

  // Refresh current location
  const refreshLocation = async () => {
    setIsRefreshingLocation(true);
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      setCurrentLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
    } catch (error) {
      console.error('Error refreshing location:', error);
    } finally {
      setIsRefreshingLocation(false);
    }
  };

  // User's current location - prioritize real-time location over cached
  const userLocation = useMemo(() => {
    if (currentLocation) {
      return currentLocation;
    }
    if (currentUser?.coordinates) {
      return {
        latitude: currentUser.coordinates.latitude,
        longitude: currentUser.coordinates.longitude,
      };
    }
    return null;
  }, [currentLocation, currentUser]);

  // Filter profiles with valid coordinates
  const validProfiles = useMemo(() => {
    return profiles.filter(
      (profile) =>
        profile.coordinates &&
        profile.coordinates.latitude &&
        profile.coordinates.longitude &&
        !isNaN(profile.coordinates.latitude) &&
        !isNaN(profile.coordinates.longitude)
    );
  }, [profiles]);

  // Generate HTML for Leaflet map
  const generateMapHTML = useMemo(() => {
    if (!userLocation) return '';

    const isDark = theme.isDark;
    const markers = validProfiles
      .map((profile) => {
        const distance =
          profile.distance !== null && profile.distance !== undefined
            ? profile.distance >= 1000
              ? `${(profile.distance / 1000).toFixed(1)}km`
              : profile.distance < 100
              ? `${profile.distance.toFixed(1)}m`
              : `${Math.round(profile.distance)}m`
            : '';

        // Escape quotes in name to prevent JS errors
        const escapedName = (profile.name || '').replace(/"/g, '\\"');
        const escapedImage = (profile.image || '').replace(/"/g, '\\"');

        return `
        {
          lat: ${profile.coordinates!.latitude},
          lng: ${profile.coordinates!.longitude},
          id: "${profile.id}",
          name: "${escapedName}",
          age: ${profile.age},
          distance: "${distance}",
          image: "${escapedImage}"
        }`;
      })
      .join(',');

    return `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <style>
    body, html, #map { 
      margin: 0; 
      padding: 0; 
      height: 100%; 
      width: 100%;
      background: ${isDark ? '#0A0A0A' : '#FAFAFA'};
      overflow: hidden;
    }
    /* Hide all Leaflet attribution and branding */
    .leaflet-control-attribution,
    .leaflet-attribution-flag,
    .leaflet-control-container .leaflet-control-attribution {
      display: none !important;
      visibility: hidden !important;
      opacity: 0 !important;
    }
    /* Ensure map fills container */
    .leaflet-container {
      background: ${isDark ? '#0A0A0A' : '#FAFAFA'} !important;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    /* Dark mode map controls */
    .leaflet-bar {
      background: ${isDark ? '#1C1C1E' : '#FFFFFF'} !important;
      border: 1px solid ${isDark ? '#3A3A3C' : '#E5E7EB'} !important;
      box-shadow: 0 2px 8px rgba(0,0,0,${isDark ? '0.5' : '0.15'}) !important;
    }
    .leaflet-bar a {
      background: ${isDark ? '#1C1C1E' : '#FFFFFF'} !important;
      color: ${isDark ? '#E5E5E5' : '#1A1A1A'} !important;
      border-bottom: 1px solid ${isDark ? '#3A3A3C' : '#E5E7EB'} !important;
    }
    .leaflet-bar a:hover {
      background: ${isDark ? '#2C2C2E' : '#F5F5F7'} !important;
    }
    .custom-marker {
      text-align: center;
      width: 70px !important;
      height: 90px !important;
      margin-left: -35px !important;
      margin-top: -90px !important;
    }
    .marker-avatar {
      width: 50px;
      height: 50px;
      border-radius: 25px;
      border: 3px solid ${theme.primary};
      overflow: hidden;
      margin: 0 auto;
      background: white;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    }
    .marker-avatar img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .marker-distance {
      background: ${theme.primary};
      color: white;
      padding: 4px 8px;
      border-radius: 12px;
      font-size: 11px;
      font-weight: bold;
      display: inline-block;
      margin-bottom: 4px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.2);
    }
    .marker-pin {
      width: 0;
      height: 0;
      border-left: 8px solid transparent;
      border-right: 8px solid transparent;
      border-top: 12px solid ${theme.primary};
      margin: -2px auto 0;
    }
    .current-user-marker {
      width: 20px;
      height: 20px;
      background: ${theme.primary};
      border: 3px solid white;
      border-radius: 50%;
      box-shadow: 0 0 20px ${theme.primary}80;
      animation: pulse 2s infinite;
    }
    @keyframes pulse {
      0%, 100% { transform: scale(1); opacity: 1; }
      50% { transform: scale(1.2); opacity: 0.8; }
    }
    .leaflet-popup-content-wrapper {
      background: ${isDark ? '#1C1C1E' : '#FFFFFF'};
      color: ${isDark ? '#E5E5E5' : '#1A1A1A'};
      border-radius: 16px;
      padding: 0;
      overflow: hidden;
    }
    .popup-content {
      padding: 12px;
      text-align: center;
      min-width: 150px;
    }
    .popup-name {
      font-size: 16px;
      font-weight: 600;
      margin-bottom: 4px;
    }
    .popup-distance {
      color: ${theme.primary};
      font-size: 14px;
      font-weight: 500;
    }
    .leaflet-popup-tip {
      background: ${isDark ? '#1C1C1E' : '#FFFFFF'};
    }
    .leaflet-popup-close-button {
      color: ${isDark ? '#A1A1A1' : '#6B7280'} !important;
      font-size: 24px !important;
      padding: 8px 12px !important;
    }
    .leaflet-popup-close-button:hover {
      color: ${theme.primary} !important;
      background: ${isDark ? '#2C2C2E' : '#F5F5F7'} !important;
    }
    /* Scale indicator */
    .scale-indicator {
      position: absolute;
      bottom: 20px;
      left: 20px;
      background: ${
        isDark ? 'rgba(28, 28, 30, 0.95)' : 'rgba(255, 255, 255, 0.95)'
      };
      color: ${isDark ? '#E5E5E5' : '#1A1A1A'};
      padding: 8px 12px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 600;
      box-shadow: 0 2px 8px rgba(0,0,0,${isDark ? '0.5' : '0.15'});
      border: 1px solid ${isDark ? '#3A3A3C' : '#E5E7EB'};
      z-index: 1000;
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <div class="scale-indicator" id="scaleIndicator">~100m</div>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script>
    // Initialize map with higher accuracy for 5m-500m range
    const map = L.map('map', {
      zoomControl: false,
      attributionControl: false,
      zoomSnap: 0.25,        // Finer zoom increments for precision
      zoomDelta: 0.5,        // Smoother zoom transitions
      wheelPxPerZoomLevel: 80, // More responsive wheel zoom
      maxBoundsViscosity: 1.0,
      trackResize: true,
      worldCopyJump: false,
      maxZoom: 20,           // Allow higher zoom for close range (5m)
      minZoom: 13            // Reasonable minimum for 500m range
    }).setView([${userLocation.latitude}, ${userLocation.longitude}], 17);

    // Add OpenStreetMap tiles with dark mode support (FREE!)
    const tileLayerUrl = ${isDark} 
      ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
      : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
    
    L.tileLayer(tileLayerUrl, {
      maxZoom: 20,          // Support high zoom levels
      minZoom: 13,
      attribution: '', // Hide attribution
      updateWhenZooming: false, // Improve performance
      keepBuffer: 2        // Keep more tiles loaded for smoother panning
    }).addTo(map);

    // Add distance radius circle
    L.circle([${userLocation.latitude}, ${userLocation.longitude}], {
      radius: ${maxDistance},
      color: '${theme.primary}',
      fillColor: '${theme.primary}',
      fillOpacity: 0.1,
      weight: 2
    }).addTo(map);

    // Add current user marker
    const currentUserIcon = L.divIcon({
      className: 'custom-marker',
      html: '<div class="current-user-marker"></div>',
      iconSize: [20, 20],
      iconAnchor: [10, 10]
    });
    L.marker([${userLocation.latitude}, ${userLocation.longitude}], { 
      icon: currentUserIcon,
      zIndexOffset: 1000 
    }).addTo(map);

    // Add profile markers
    const profiles = [${markers}];
    
    profiles.forEach(profile => {
      const markerIcon = L.divIcon({
        className: 'custom-marker',
        html: \`
          <div>
            \${profile.distance ? '<div class="marker-distance">' + profile.distance + '</div>' : ''}
            <div class="marker-avatar">
              <img src="\${profile.image}" onerror="this.src='https://via.placeholder.com/50'" />
            </div>
            <div class="marker-pin"></div>
          </div>
        \`,
        iconSize: [70, 90],
        iconAnchor: [35, 90],
        popupAnchor: [0, -90]
      });

      const marker = L.marker([profile.lat, profile.lng], { 
        icon: markerIcon,
        riseOnHover: true
      })
        .addTo(map)
        .bindPopup(\`
          <div class="popup-content">
            <div class="popup-name">\${profile.name}, \${profile.age}</div>
            \${profile.distance ? '<div class="popup-distance">' + profile.distance + ' away</div>' : ''}
          </div>
        \`, {
          closeButton: true,
          className: 'custom-popup',
          maxWidth: 250,
          offset: [0, 0]
        });

      marker.on('click', () => {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'profileSelect',
          profileId: profile.id
        }));
      });
    });

    // Handle recenter command from React Native with better accuracy
    window.recenterMap = function() {
      // Calculate optimal zoom based on maxDistance
      let optimalZoom = 17; // Default for close range
      if (${maxDistance} <= 50) {
        optimalZoom = 19;     // Very close range (5-50m)
      } else if (${maxDistance} <= 100) {
        optimalZoom = 18;     // Close range (50-100m)
      } else if (${maxDistance} <= 250) {
        optimalZoom = 17;     // Medium-close range (100-250m)
      } else if (${maxDistance} <= 500) {
        optimalZoom = 16;     // Medium range (250-500m)
      } else {
        optimalZoom = 15;     // Wider range (500m+)
      }
      
      map.setView([${userLocation.latitude}, ${
      userLocation.longitude
    }], optimalZoom, {
        animate: true,
        duration: 0.5
      });
    };
    
    // Update scale indicator based on zoom level
    function updateScaleIndicator() {
      const zoom = map.getZoom();
      const scaleIndicator = document.getElementById('scaleIndicator');
      let scaleText = '';
      
      if (zoom >= 19) {
        scaleText = '~10-25m';
      } else if (zoom >= 18) {
        scaleText = '~25-50m';
      } else if (zoom >= 17) {
        scaleText = '~50-100m';
      } else if (zoom >= 16) {
        scaleText = '~100-250m';
      } else if (zoom >= 15) {
        scaleText = '~250-500m';
      } else {
        scaleText = '~500m+';
      }
      
      if (scaleIndicator) {
        scaleIndicator.textContent = scaleText;
      }
    }
    
    // Update scale on zoom
    map.on('zoomend', updateScaleIndicator);
    
    // Improve accuracy by forcing map to recalculate and set optimal zoom
    setTimeout(() => {
      map.invalidateSize();
      window.recenterMap(); // Apply optimal zoom on load
      updateScaleIndicator(); // Update scale indicator
      
      // Notify React Native that map is ready
      window.ReactNativeWebView?.postMessage(JSON.stringify({
        type: 'mapReady'
      }));
    }, 100);
  </script>
</body>
</html>`;
  }, [userLocation, validProfiles, maxDistance, theme]);

  const handleRecenterMap = () => {
    webViewRef.current?.injectJavaScript('window.recenterMap();');
  };

  const handleWebViewMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'profileSelect') {
        const profile = validProfiles.find((p) => p.id === data.profileId);
        if (profile) {
          onProfileSelect(profile);
        }
      } else if (data.type === 'mapReady') {
        setIsMapReady(true);
      }
    } catch (error) {
      console.error('Error parsing WebView message:', error);
    }
  };

  if (!userLocation) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.errorContainer}>
          <MapPin size={48} color={theme.textSecondary} />
          <Text style={[styles.errorText, { color: theme.text }]}>
            Location not available
          </Text>
          <Text style={[styles.errorSubtext, { color: theme.textSecondary }]}>
            Please enable location services to view the map
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, !isVisible && styles.hidden]}>
      <WebView
        ref={webViewRef}
        source={{ html: generateMapHTML }}
        style={styles.map}
        onMessage={handleWebViewMessage}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        renderLoading={() => (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.primary} />
            <Text style={[styles.loadingText, { color: theme.text }]}>
              Loading map...
            </Text>
          </View>
        )}
      />

      {/* Recenter button - only show when visible */}
      {isVisible && (
        <TouchableOpacity
          style={[
            styles.recenterButton,
            {
              backgroundColor: theme.surface,
              shadowColor: theme.shadow,
            },
          ]}
          onPress={handleRecenterMap}
          activeOpacity={0.8}
        >
          <Navigation size={24} color={theme.primary} />
        </TouchableOpacity>
      )}

      {/* Refresh location button - only show when visible */}
      {isVisible && (
        <TouchableOpacity
          style={[
            styles.refreshButton,
            {
              backgroundColor: theme.surface,
              shadowColor: theme.shadow,
            },
          ]}
          onPress={refreshLocation}
          disabled={isRefreshingLocation}
          activeOpacity={0.8}
        >
          <Animated.View
            style={{
              transform: [
                {
                  rotate: spinValue.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0deg', '360deg'],
                  }),
                },
              ],
            }}
          >
            <RefreshCw
              size={24}
              color={isRefreshingLocation ? theme.textSecondary : theme.primary}
            />
          </Animated.View>
        </TouchableOpacity>
      )}

      {/* Profile count badge - only show when visible */}
      {isVisible && (
        <View
          style={[
            styles.countBadge,
            {
              backgroundColor: theme.surface,
              shadowColor: theme.shadow,
            },
          ]}
        >
          <MapPin size={16} color={theme.primary} />
          <Text style={[styles.countText, { color: theme.text }]}>
            {validProfiles.length} nearby
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  hidden: {
    position: 'absolute',
    left: -10000, // Move offscreen to keep loaded but hidden
    width: width,
    height: height,
  },
  map: {
    flex: 1,
    width: width,
    height: height,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  errorText: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  errorSubtext: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  recenterButton: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 16, // Add margin bottom
  },
  countBadge: {
    position: 'absolute',
    top: 20,
    left: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  countText: {
    fontSize: 14,
    fontWeight: '600',
  },
  refreshButton: {
    position: 'absolute',
    bottom: 170,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 16, // Add margin bottom
  },
});

export default MapViewComponent;
