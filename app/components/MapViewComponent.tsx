// app/components/MapViewComponent.tsx
// Professional, accurate & performant Leaflet map for React Native (100% free – no API keys)
import React, {
  useRef,
  useMemo,
  useEffect,
  useState,
  useCallback,
} from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  Dimensions,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { MapPin, Navigation } from 'lucide-react-native';
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
  isVisible?: boolean;
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
  const [mapReady, setMapReady] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  // Use real location if available, fallback to user's stored coordinates
  const userLocation = useMemo(() => {
    return (
      currentLocation ||
      (currentUser?.coordinates
        ? {
            latitude: currentUser.coordinates.latitude,
            longitude: currentUser.coordinates.longitude,
          }
        : null)
    );
  }, [currentLocation, currentUser]);

  // Filter only profiles with valid coordinates
  const validProfiles = useMemo(() => {
    return profiles.filter(
      (p) =>
        p.coordinates &&
        typeof p.coordinates.latitude === 'number' &&
        typeof p.coordinates.longitude === 'number' &&
        !isNaN(p.coordinates.latitude) &&
        !isNaN(p.coordinates.longitude)
    );
  }, [profiles]);

  // Request permissions + watch location
  useEffect(() => {
    let subscription: Location.LocationSubscription | null = null;

    const initLocation = async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;

      // Initial position
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      setCurrentLocation({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });

      // Continuous updates - live watch mode
      subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 5000, // More frequent updates (5 seconds)
          distanceInterval: 10, // Smaller distance threshold (10 meters)
        },
        (position) => {
          setCurrentLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        }
      );
    };

    initLocation();

    return () => {
      subscription?.remove();
    };
  }, []);

  // Recenter map to user location with smart zoom based on maxDistance
  const handleRecenter = useCallback(() => {
    webViewRef.current?.injectJavaScript(`
      if (window.recenterMap) window.recenterMap();
    `);
  }, []);

  // Handle messages from WebView
  const handleMessage = useCallback(
    (event: any) => {
      try {
        const data = JSON.parse(event.nativeEvent.data);
        if (data.type === 'profileSelect') {
          const profile = validProfiles.find((p) => p.id === data.profileId);
          if (profile) onProfileSelect(profile);
        } else if (data.type === 'mapReady') {
          setMapReady(true);
        }
      } catch (e) {
        // Ignore invalid messages
      }
    },
    [validProfiles, onProfileSelect]
  );

  // Generate Leaflet HTML – fully optimized, dark-mode aware, clean UI
  const html = useMemo(() => {
    if (!userLocation) return '<div></div>';

    const isDark = theme.isDark ?? false;

    const markers = validProfiles
      .map((p) => {
        const dist =
          p.distance != null
            ? p.distance >= 1000
              ? `${(p.distance / 1000).toFixed(1)} km`
              : p.distance < 100
              ? `${p.distance.toFixed(0)} m`
              : `${Math.round(p.distance)} m`
            : '';

        const safe = (str: string) => str.replace(/"/g, '&quot;');

        return `{
          lat: ${p.coordinates!.latitude},
          lng: ${p.coordinates!.longitude},
          id: "${p.id}",
          name: "${safe(p.name)}",
          age: ${p.age},
          distance: "${dist}",
          image: "${p.image || ''}"
        }`;
      })
      .join(',');

    // Smart zoom level based on maxDistance
    let zoom = 16;
    if (maxDistance <= 50) zoom = 19;
    else if (maxDistance <= 100) zoom = 18;
    else if (maxDistance <= 250) zoom = 17;
    else if (maxDistance <= 500) zoom = 16;
    else zoom = 15;

    return `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <style>
    * { margin:0; padding:0; }
    html, body, #map { height:100%; width:100%; background:${
      isDark ? '#0f0f0f' : '#f5f5f5'
    }; }
    .leaflet-container { background:${
      isDark ? '#0f0f0f' : '#f5f5f5'
    } !important; }
    .leaflet-control-attribution { display:none !important; }
    .leaflet-bar { box-shadow:0 2px 10px rgba(0,0,0,${
      isDark ? '0.6' : '0.2'
    }) !important; border:none !important; }
    .leaflet-bar a { background:${
      isDark ? '#1f1f1f' : '#fff'
    } !important; color:${isDark ? '#ddd' : '#333'} !important; }
    
    .marker-cluster { background-clip: padding-box; border-radius: 20px; }
    .marker-cluster div { background-color: ${
      theme.primary
    }CC; color:white; font-weight:bold; }
    
    .custom-marker {
      width: 64px;
      text-align: center;
      margin-left: -32px;
      margin-top: -80px;
    }
    .avatar {
      width: 52px;
      height: 52px;
      border-radius: 26px;
      border: 3.5px solid ${theme.primary};
      overflow: hidden;
      background: white;
      box-shadow: 0 4px 12px rgba(0,0,0,0.4);
    }
    .avatar img { width:100%; height:100%; object-fit:cover; }
    .distance {
      background: ${theme.primary};
      color: white;
      padding: 3px 9px;
      border-radius: 12px;
      font-size: 11px;
      font-weight: 700;
      margin: 6px auto 4px;
      min-width: 44px;
      box-shadow: 0 2px 6px rgba(0,0,0,0.3);
    }
    .pin {
      width: 0;
      height: 0;
      border-left: 9px solid transparent;
      border-right: 9px solid transparent;
      border-top: 14px solid ${theme.primary};
      margin: 0 auto;
    }
    .me {
      width: 24px;
      height: 24px;
      background: ${theme.primary};
      border: 4px solid white;
      border-radius: 50%;
      box-shadow: 0 0 0 4px ${theme.primary}44, 0 4px 12px rgba(0,0,0,0.4);
      animation: pulse 2s infinite;
    }
    @keyframes pulse {
      0% { box-shadow: 0 0 0 0 ${theme.primary}88; }
      70% { box-shadow: 0 0 0 12px ${theme.primary}00; }
      100% { box-shadow: 0 0 0 0 ${theme.primary}00; }
    }
    .leaflet-popup-content-wrapper {
      background: ${isDark ? '#1f1f1f' : '#fff'};
      color: ${isDark ? '#eee' : '#222'};
      border-radius: 16px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.3);
    }
    .leaflet-popup-content {
      margin: 12px !important;
      text-align: center;
      font-family: -apple-system, system-ui, sans-serif;
    }
    .popup-name { font-size:16px; font-weight:600; margin-bottom:4px; }
    .popup-distance { font-size:14px; color:${theme.primary}; font-weight:500; }
    .leaflet-popup-tip { background: ${isDark ? '#1f1f1f' : '#fff'}; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script>
    const map = L.map('map', {
      zoomControl: false,
      attributionControl: false,
      zoomSnap: 0.25,
      zoomDelta: 0.75,
      wheelPxPerZoomLevel: 100,
      maxZoom: 19,
      minZoom: 13
    }).setView([${userLocation.latitude}, ${userLocation.longitude}], ${zoom});

    L.tileLayer(${isDark}
      ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
      : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19
    }).addTo(map);

    // Search radius
    L.circle([${userLocation.latitude}, ${userLocation.longitude}], {
      radius: ${maxDistance},
      color: '${theme.primary}',
      weight: 2,
      opacity: 0.8,
      fillColor: '${theme.primary}',
      fillOpacity: 0.08
    }).addTo(map);

    // Current user pulsing dot
    L.marker([${userLocation.latitude}, ${userLocation.longitude}], {
      icon: L.divIcon({ className: 'custom-marker', html: '<div class="me"></div>', iconSize: [24,24], iconAnchor: [12,12] }),
      zIndexOffset: 1000
    }).addTo(map);

    // Profiles
    const profiles = [${markers}];
    profiles.forEach(p => {
      const html = \`
        <div>
          \${p.distance ? '<div class="distance">' + p.distance + '</div>' : ''}
          <div class="avatar"><img src="\${p.image}" onerror="this.style.background='#ccc'" /></div>
          <div class="pin"></div>
        </div>\`;

      const icon = L.divIcon({ className: 'custom-marker', html, iconSize: [64,80], iconAnchor: [32,80], popupAnchor: [0,-70] });

      L.marker([p.lat, p.lng], { icon })
        .bindPopup('<div class="popup-name">' + p.name + ', ' + p.age + '</div>' +
                   (p.distance ? '<div class="popup-distance">' + p.distance + ' away</div>' : ''))
        .addTo(map)
        .on('click', () => {
          window.ReactNativeWebView?.postMessage(JSON.stringify({ type: 'profileSelect', profileId: p.id }));
        });
    });

    window.recenterMap = () => {
      map.setView([${userLocation.latitude}, ${
      userLocation.longitude
    }], ${zoom}, { animate: true });
    };

    setTimeout(() => {
      map.invalidateSize();
      window.recenterMap();
      window.ReactNativeWebView?.postMessage(JSON.stringify({ type: 'mapReady' }));
    }, 150);
  </script>
</body>
</html>
    `.trim();
  }, [userLocation, validProfiles, maxDistance, theme]);

  if (!userLocation) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.placeholder}>
          <MapPin size={56} color={theme.textSecondary} />
          <Text style={[styles.placeholderTitle, { color: theme.text }]}>
            Waiting for location…
          </Text>
          <Text
            style={[styles.placeholderSubtitle, { color: theme.textSecondary }]}
          >
            Enable location services to see people nearby
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: theme.background },
        !isVisible && { opacity: 0 },
      ]}
    >
      <WebView
        ref={webViewRef}
        source={{ html }}
        style={styles.webview}
        onMessage={handleMessage}
        javaScriptEnabled
        domStorageEnabled
        startInLoadingState={true}
        renderLoading={() => (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={theme.primary} />
            <Text style={[styles.loadingText, { color: theme.text }]}>
              Loading map…
            </Text>
          </View>
        )}
        // Better performance on Android
        {...(Platform.OS === 'android'
          ? { setBuiltInZoomControls: false, setDisplayZoomControls: false }
          : {})}
      />

      {/* Controls – only visible when map is active */}
      {isVisible && (
        <>
          {/* Recenter */}
          <TouchableOpacity
            style={[styles.controlBtn(theme), styles.recenterBtn]}
            onPress={handleRecenter}
            activeOpacity={0.8}
          >
            <Navigation size={24} color={theme.primary} />
          </TouchableOpacity>

          {/* Count badge */}
          <View style={[styles.badge, { backgroundColor: theme.surface }]}>
            <MapPin size={16} color={theme.primary} />
            <Text style={[styles.badgeText, { color: theme.text }]}>
              {validProfiles.length} nearby
            </Text>
          </View>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  webview: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  placeholderTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 20,
    textAlign: 'center',
  },
  placeholderSubtitle: {
    fontSize: 15,
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 22,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '500',
  },
  controlBtn: (theme: Theme) => ({
    position: 'absolute',
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.surface,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: theme.border,
  }),
  recenterBtn: {
    bottom: 180,
    right: 16,
  },
  badge: {
    position: 'absolute',
    top: 20,
    left: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 8,
  },
  badgeText: {
    fontSize: 14,
    fontWeight: '600',
  },
});

export default MapViewComponent;
