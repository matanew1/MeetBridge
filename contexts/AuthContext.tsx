// contexts/AuthContext.tsx
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';
import { Platform, AppState, AppStateStatus } from 'react-native';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { auth, db } from '../services/firebase/config';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { services } from '../services';
import { User } from '../store/types';
import LocationService from '../services/locationService';
import notificationService from '../services/notificationService';
import * as Location from 'expo-location';

interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (
    email: string,
    password: string
  ) => Promise<{ success: boolean; message: string }>;
  register: (
    userData: Partial<User> & { email: string; password: string }
  ) => Promise<{ success: boolean; message: string }>;
  logout: () => Promise<void>;
  forgotPassword: (
    email: string
  ) => Promise<{ success: boolean; message: string }>;
  resetPassword: (
    token: string,
    newPassword: string
  ) => Promise<{ success: boolean; message: string }>;
  refreshUserProfile: () => Promise<void>;
  updateProfile: (
    userData: Partial<User>
  ) => Promise<{ success: boolean; message: string }>;
  updateLocationLive: () => Promise<{
    success: boolean;
    message: string;
    location?: string;
  }>;
  requestLocationPermission: () => Promise<boolean>;
  cleanupOrphanedAuth: () => Promise<{ success: boolean; message: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const convertTimestamp = (timestamp: any) => {
    if (timestamp?.toDate) return timestamp.toDate();
    if (timestamp?.seconds) return new Date(timestamp.seconds * 1000);
    return timestamp;
  };

  const refreshUserProfile = async () => {
    if (!firebaseUser) return;

    try {
      const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const fullUser: User = {
          id: userDoc.id,
          ...userData,
          lastSeen: convertTimestamp(userData.lastSeen),
        } as User;
        setUser(fullUser);
      }
    } catch (error) {
      console.error('Error refreshing user profile:', error);
    }
  };

  // Initialize notifications and start location tracking when user is authenticated
  useEffect(() => {
    if (!firebaseUser) return;

    const initializeServices = async () => {
      // Initialize push notifications
      console.log('🔔 Initializing push notifications...');
      try {
        await notificationService.initialize(firebaseUser.uid);
        console.log('✅ Notifications initialized');
      } catch (error) {
        console.error('Error initializing notifications:', error);
      }

      // Start location tracking
      const hasPermission = await LocationService.hasLocationPermissions();

      if (!hasPermission) {
        console.log('📍 Requesting location permissions for tracking...');
        const permissionResult =
          await LocationService.requestLocationPermissions();
        if (!permissionResult.granted) {
          console.warn('📍 Location permission denied, tracking disabled');
          return;
        }
      }

      console.log('📍 Starting continuous location tracking...');

      const success = await LocationService.startLocationWatcher(
        async (location) => {
          try {
            // Update Firebase with new location
            const geohash = LocationService.generateGeohash(
              location.latitude,
              location.longitude
            );

            const userRef = doc(db, 'users', firebaseUser.uid);
            await updateDoc(userRef, {
              coordinates: {
                latitude: location.latitude,
                longitude: location.longitude,
                lastUpdated: new Date(),
              },
              geohash,
              lastLocationUpdate: serverTimestamp(),
            });

            console.log('✅ Location updated in Firebase:', {
              lat: location.latitude.toFixed(4),
              lon: location.longitude.toFixed(4),
            });

            // Update local user state
            if (user) {
              setUser((prev) => ({
                ...prev!,
                coordinates: {
                  latitude: location.latitude,
                  longitude: location.longitude,
                  lastUpdated: new Date(),
                },
                geohash,
              }));
            }
          } catch (error) {
            console.error('Error updating location in Firebase:', error);
          }
        },
        {
          accuracy: Location.Accuracy.Balanced,
          timeInterval: 60000, // Every 60 seconds
          distanceInterval: 100, // Every 100 meters
        }
      );

      if (success) {
        console.log('✅ Location tracking started');
      } else {
        console.warn('⚠️ Failed to start location tracking');
      }
    };

    initializeServices();

    // Cleanup on unmount or when user logs out
    return () => {
      console.log('🛑 Stopping location tracking...');
      LocationService.stopLocationWatcher();
      console.log('🔕 Cleaning up notification listeners...');
      notificationService.cleanup();
    };
  }, [firebaseUser]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setIsLoading(true);

      if (firebaseUser) {
        setFirebaseUser(firebaseUser);

        try {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));

          if (userDoc.exists()) {
            const userData = userDoc.data();
            const fullUser: User = {
              id: userDoc.id,
              ...userData,
              lastSeen: convertTimestamp(userData.lastSeen),
            } as User;

            setUser(fullUser);

            try {
              await updateDoc(doc(db, 'users', firebaseUser.uid), {
                lastSeen: serverTimestamp(),
                isOnline: true,
              });
            } catch (updateError) {
              console.warn('Failed to update user online status:', updateError);
            }
          } else {
            console.warn(
              '⚠️ User exists in Firebase Auth but not in Firestore database'
            );
            setUser(null);
          }
        } catch (error) {
          console.error('Error loading user profile:', error);
          setUser(null);
        }
      } else {
        setFirebaseUser(null);
        setUser(null);
      }

      setIsLoading(false);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    const handleAppStateChange = async () => {
      if (firebaseUser && user) {
        try {
          await updateDoc(doc(db, 'users', firebaseUser.uid), {
            lastSeen: serverTimestamp(),
            isOnline: false,
          });
        } catch (error) {
          console.warn('Failed to update offline status:', error);
        }
      }
    };

    let subscription: any = null;

    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined') {
        window.addEventListener('beforeunload', handleAppStateChange);
      }
    } else {
      subscription = AppState.addEventListener(
        'change',
        (nextAppState: AppStateStatus) => {
          if (nextAppState === 'background' || nextAppState === 'inactive') {
            handleAppStateChange();
          }
        }
      );
    }

    return () => {
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.removeEventListener('beforeunload', handleAppStateChange);
      } else if (subscription) {
        subscription.remove();
      }
      handleAppStateChange();
    };
  }, [firebaseUser, user]);

  const login = async (email: string, password: string) => {
    try {
      const response = await services.auth.login(email, password);
      return {
        success: response.success,
        message:
          response.message ||
          (response.success ? 'Login successful' : 'Login failed'),
      };
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Login failed',
      };
    }
  };

  const register = async (
    userData: Partial<User> & { email: string; password: string }
  ) => {
    try {
      const response = await services.auth.register(userData);
      return {
        success: response.success,
        message:
          response.message ||
          (response.success
            ? 'Registration successful'
            : 'Registration failed'),
      };
    } catch (error) {
      console.error('Registration error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Registration failed',
      };
    }
  };

  const logout = async () => {
    try {
      if (firebaseUser) {
        try {
          await updateDoc(doc(db, 'users', firebaseUser.uid), {
            lastSeen: serverTimestamp(),
            isOnline: false,
          });
        } catch (updateError) {
          console.warn(
            'Failed to update offline status on logout:',
            updateError
          );
        }
      }

      await services.auth.logout();
      setUser(null);
      setFirebaseUser(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const forgotPassword = async (email: string) => {
    try {
      const response = await services.auth.forgotPassword(email);
      return {
        success: response.success,
        message:
          response.message ||
          (response.success
            ? 'Reset email sent'
            : 'Failed to send reset email'),
      };
    } catch (error) {
      console.error('Forgot password error:', error);
      return {
        success: false,
        message:
          error instanceof Error ? error.message : 'Failed to send reset email',
      };
    }
  };

  const resetPassword = async (token: string, newPassword: string) => {
    try {
      const response = await services.auth.resetPassword(token, newPassword);
      return {
        success: response.success,
        message:
          response.message ||
          (response.success
            ? 'Password reset successful'
            : 'Failed to reset password'),
      };
    } catch (error) {
      console.error('Reset password error:', error);
      return {
        success: false,
        message:
          error instanceof Error ? error.message : 'Failed to reset password',
      };
    }
  };

  const cleanupOrphanedAuth = async () => {
    try {
      if (!firebaseUser) {
        return {
          success: false,
          message: 'No user currently authenticated',
        };
      }

      const response = await services.auth.cleanupOrphanedAuth(firebaseUser);

      if (response.success) {
        setUser(null);
        setFirebaseUser(null);
      }

      return {
        success: response.success,
        message:
          response.message ||
          (response.success ? 'Cleanup successful' : 'Cleanup failed'),
      };
    } catch (error) {
      console.error('Manual cleanup error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Cleanup failed',
      };
    }
  };

  const updateProfile = async (userData: Partial<User>) => {
    try {
      if (!firebaseUser) {
        return {
          success: false,
          message: 'No user currently authenticated',
        };
      }

      // Use the Firebase service which now handles image upload internally
      const response = await services.userProfile.updateProfile(userData);

      if (response.success) {
        setUser(response.data);
        return {
          success: true,
          message: 'Profile updated successfully',
        };
      }

      return {
        success: false,
        message: response.message || 'Failed to update profile',
      };
    } catch (error) {
      console.error('Update profile error:', error);
      return {
        success: false,
        message:
          error instanceof Error ? error.message : 'Failed to update profile',
      };
    }
  };

  const updateLocationLive = async () => {
    try {
      if (!firebaseUser) {
        return { success: false, message: 'No user authenticated' };
      }

      const locationData = await LocationService.updateUserLocation();
      if (!locationData) {
        return { success: false, message: 'Could not get current location' };
      }

      const { coordinates, address } = locationData;

      // Generate geohash for efficient location-based queries
      const geohash = LocationService.generateGeohash(
        coordinates.latitude,
        coordinates.longitude
      );

      const userRef = doc(db, 'users', firebaseUser.uid);
      await updateDoc(userRef, {
        location: address,
        coordinates: {
          latitude: coordinates.latitude,
          longitude: coordinates.longitude,
          lastUpdated: new Date(),
        },
        geohash,
        updatedAt: serverTimestamp(),
      });

      if (user) {
        setUser((prev) => ({
          ...prev!,
          location: address,
          coordinates: {
            latitude: coordinates.latitude,
            longitude: coordinates.longitude,
            lastUpdated: new Date(),
          },
          geohash,
        }));
      }

      return {
        success: true,
        message: 'Location updated successfully',
        location: address,
      };
    } catch (error) {
      console.error('Update location error:', error);
      return { success: false, message: 'Failed to update location' };
    }
  };

  const requestLocationPermission = async () => {
    try {
      const permission = await LocationService.requestLocationPermissions();
      return permission.granted;
    } catch (error) {
      console.error('Location permission error:', error);
      return false;
    }
  };

  const value: AuthContextType = {
    user,
    firebaseUser,
    isLoading,
    isAuthenticated: !!user && !!firebaseUser,
    login,
    register,
    logout,
    forgotPassword,
    resetPassword,
    refreshUserProfile,
    updateProfile,
    updateLocationLive,
    requestLocationPermission,
    cleanupOrphanedAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
