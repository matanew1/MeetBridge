// app/components/MapViewComponent.tsx
// Using Leaflet (OpenStreetMap) - 100% FREE, No API keys needed!
import React, { useRef, useMemo } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { MapPin, Navigation } from 'lucide-react-native';
import { Theme } from '../../constants/theme';

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
}

const MapViewComponent: React.FC<MapViewComponentProps> = ({
  profiles,
  currentUser,
  onProfileSelect,
  maxDistance,
  theme,
}) => {
  const webViewRef = useRef<WebView>(null);

  // User's current location
  const userLocation = useMemo(() => {
    if (currentUser?.coordinates) {
      return {
        latitude: currentUser.coordinates.latitude,
        longitude: currentUser.coordinates.longitude,
      };
    }
    return null;
  }, [currentUser]);

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
  </style>
</head>
<body>
  <div id="map"></div>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script>
    // Initialize map with higher accuracy
    const map = L.map('map', {
      zoomControl: false,
      attributionControl: false,
      zoomSnap: 0.1,
      zoomDelta: 0.5,
      wheelPxPerZoomLevel: 120,
      maxBoundsViscosity: 1.0
    }).setView([${userLocation.latitude}, ${userLocation.longitude}], 16);

    // Add OpenStreetMap tiles with dark mode support (FREE!)
    const tileLayerUrl = ${isDark} 
      ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
      : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
    
    L.tileLayer(tileLayerUrl, {
      maxZoom: 19,
      minZoom: 10,
      attribution: '' // Hide attribution
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
      map.setView([${userLocation.latitude}, ${userLocation.longitude}], 16, {
        animate: true,
        duration: 0.5
      });
    };
    
    // Improve accuracy by forcing map to recalculate
    setTimeout(() => {
      map.invalidateSize();
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
    <View style={styles.container}>
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

      {/* Recenter button */}
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

      {/* Profile count badge */}
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
});

export default MapViewComponent;
