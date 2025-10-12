// contexts/AuthContext.tsx
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from 'react';
import { Platform, AppState, AppStateStatus } from 'react-native';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { auth, db } from '../services/firebase/config';
import {
  doc,
  getDoc,
  updateDoc,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';
import { services } from '../services';
import { User } from '../store/types';
import LocationService from '../services/locationService';
import notificationService from '../services/notificationService';
import presenceService from '../services/presenceService';
import firebaseApp from '../services/firebase/config';
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

  const refreshUserProfile = useCallback(async () => {
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
  }, [firebaseUser]);

  // Initialize notifications and start location tracking when user is authenticated
  useEffect(() => {
    if (!firebaseUser) return;

    const initializeServices = async () => {
      // Initialize presence service with Realtime Database
      console.log('👁️ Initializing presence service...');
      try {
        await presenceService.initialize(firebaseUser.uid, firebaseApp);
        console.log('✅ Presence service initialized');
      } catch (error) {
        console.error('Error initializing presence service:', error);
      }

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
              },
              geohash,
              lastLocationUpdate: serverTimestamp(),
            });

            console.log('✅ Location updated in Firebase (ULTRA-PRECISE):', {
              lat: location.latitude.toFixed(9), // 9 decimals for ±1m precision
              lon: location.longitude.toFixed(9),
              accuracy: location.accuracy
                ? `±${Math.round(location.accuracy)}m`
                : 'unknown',
              geohash,
            });

            // Update local user state
            if (user) {
              setUser((prev) => ({
                ...prev!,
                coordinates: {
                  latitude: location.latitude,
                  longitude: location.longitude,
                },
                geohash,
              }));
            }
          } catch (error) {
            console.error('Error updating location in Firebase:', error);
          }
        },
        {
          // ULTRA-PRECISE settings for 5-500m range
          accuracy: Location.Accuracy.BestForNavigation, // Maximum GPS precision
          timeInterval: 15000, // Every 15 seconds for fresh data
          distanceInterval: 5, // Every 5 meters - critical for nearby detection!
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
      console.log('👁️ Cleaning up presence service...');
      presenceService.cleanup();
    };
  }, [firebaseUser]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setIsLoading(true);

      if (firebaseUser) {
        setFirebaseUser(firebaseUser);

        try {
          console.log('🔍 Fetching user document for UID:', firebaseUser.uid);
          const userDocRef = doc(db, 'users', firebaseUser.uid);
          const userDoc = await getDoc(userDocRef);

          console.log('📄 Document fetch result:', {
            exists: userDoc.exists(),
            id: userDoc.id,
            ref_path: userDocRef.path,
          });

          if (userDoc.exists()) {
            console.log('✅ User document found in Firestore');
            const userData = userDoc.data();
            const fullUser: User = {
              id: userDoc.id,
              ...userData,
              lastSeen: convertTimestamp(userData.lastSeen),
            } as User;

            setUser(fullUser);

            // Note: User online status will be set by presenceService initialization
            // which happens in the separate useEffect
          } else {
            // User exists in Firebase Auth but not in Firestore
            // This should ONLY happen in rare cases - DO NOT auto-create defaults for existing users
            console.error(
              '❌ CRITICAL: User exists in Firebase Auth but not in Firestore:',
              firebaseUser.uid
            );
            console.error('📍 Document path attempted:', userDocRef.path);
            console.error(
              '❌ User should register properly. Not creating default profile to prevent data loss.'
            );

            // Sign out the user to force proper registration
            await auth.signOut();
            setUser(null);
            setFirebaseUser(null);
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
    const handleAppStateChange = async (nextAppState: AppStateStatus) => {
      if (firebaseUser && user) {
        try {
          const isGoingOnline = nextAppState === 'active';
          const isGoingOffline =
            nextAppState === 'background' || nextAppState === 'inactive';

          if (isGoingOnline) {
            console.log('👁️ App became active - setting user online');
            // Reinitialize presence service to set user online
            await presenceService.initialize(firebaseUser.uid, firebaseApp);
          } else if (isGoingOffline) {
            console.log('👁️ App going to background - setting user offline');
            await presenceService.setUserOffline();
          }
        } catch (error) {
          console.warn('Failed to update presence status:', error);
        }
      }
    };

    const handleBeforeUnload = async () => {
      if (firebaseUser && user) {
        try {
          await presenceService.setUserOffline();
        } catch (error) {
          console.warn('Failed to update offline status:', error);
        }
      }
    };

    let subscription: any = null;

    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined') {
        window.addEventListener('beforeunload', handleBeforeUnload);
      }
    } else {
      subscription = AppState.addEventListener('change', handleAppStateChange);
    }

    return () => {
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.removeEventListener('beforeunload', handleBeforeUnload);
      } else if (subscription) {
        subscription.remove();
      }
      handleBeforeUnload();
    };
  }, [firebaseUser, user]);

  // Note: Presence heartbeat is now handled by presenceService internally
  // The service manages sync between Realtime Database and Firestore

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
          // Set user offline in presence service
          await presenceService.setUserOffline();
          await presenceService.cleanup();
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
        console.log('🔄 AuthContext: Setting updated user data:', {
          preferences: response.data.preferences,
        });
        setUser(response.data);
        console.log('✅ AuthContext: User state updated');
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
        },
        geohash,
        lastLocationUpdate: serverTimestamp(),
      });

      if (user) {
        setUser((prev) => ({
          ...prev!,
          location: address,
          coordinates: {
            latitude: coordinates.latitude,
            longitude: coordinates.longitude,
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
