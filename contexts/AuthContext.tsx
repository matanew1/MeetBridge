import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';
import { Platform, AppState, AppStateStatus } from 'react-native';
import {
  onAuthStateChanged,
  User as FirebaseUser,
  signOut,
} from 'firebase/auth';
import { auth, db } from '../services/firebase/config';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { services } from '../services';
import { User } from '../store/types';

interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (
    email: string,
    password: string
  ) => Promise<{ success: boolean; message: string }>;
  loginWithGoogle: () => Promise<{ success: boolean; message: string }>;
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
    if (timestamp?.toDate) {
      return timestamp.toDate();
    }
    if (timestamp?.seconds) {
      return new Date(timestamp.seconds * 1000);
    }
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

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setIsLoading(true);

      if (firebaseUser) {
        setFirebaseUser(firebaseUser);

        try {
          // Get user profile from Firestore
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));

          if (userDoc.exists()) {
            const userData = userDoc.data();
            const fullUser: User = {
              id: userDoc.id,
              ...userData,
              lastSeen: convertTimestamp(userData.lastSeen),
            } as User;

            setUser(fullUser);

            // Update user's online status and last seen
            try {
              await updateDoc(doc(db, 'users', firebaseUser.uid), {
                lastSeen: serverTimestamp(),
                isOnline: true,
              });
            } catch (updateError) {
              console.warn('Failed to update user online status:', updateError);
            }
          } else {
            // User exists in Auth but not in Firestore - this could be:
            // 1. A race condition during Google OAuth signup (document creation in progress)
            // 2. A genuinely orphaned auth record
            console.warn(
              '⚠️ User exists in Firebase Auth but not in Firestore database'
            );

            // Wait a moment to allow for document creation during OAuth signup
            console.log('⏳ Waiting for potential user document creation...');
            setTimeout(async () => {
              // Check again after a short delay
              try {
                const retryUserDoc = await getDoc(
                  doc(db, 'users', firebaseUser.uid)
                );

                if (retryUserDoc.exists()) {
                  // Document was created during OAuth signup, load the user
                  console.log(
                    '✅ User document found after delay - loading user'
                  );
                  const userData = retryUserDoc.data();
                  const fullUser: User = {
                    id: retryUserDoc.id,
                    ...userData,
                    lastSeen: convertTimestamp(userData.lastSeen),
                  } as User;

                  setUser(fullUser);

                  // Update user's online status
                  try {
                    await updateDoc(doc(db, 'users', firebaseUser.uid), {
                      lastSeen: serverTimestamp(),
                      isOnline: true,
                    });
                  } catch (updateError) {
                    console.warn(
                      'Failed to update user online status:',
                      updateError
                    );
                  }
                } else {
                  // Still no document - this is a genuine orphaned auth record
                  console.log(
                    '🔄 Signing out user to maintain data consistency'
                  );
                  try {
                    await signOut(auth);
                    setFirebaseUser(null);
                    setUser(null);
                  } catch (signOutError) {
                    console.error(
                      'Error signing out orphaned user:',
                      signOutError
                    );
                    // Fallback: just clear local state
                    setFirebaseUser(null);
                    setUser(null);
                  }
                }
              } catch (retryError) {
                console.error('Error during retry check:', retryError);
                // On error, sign out for safety
                setFirebaseUser(null);
                setUser(null);
              }
            }, 2000); // Wait 2 seconds for document creation
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

  // Update user's offline status when app is backgrounded
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

    // Handle app state changes for both web and mobile
    let subscription: any = null;

    if (Platform.OS === 'web') {
      // Web platform - use window events
      if (typeof window !== 'undefined') {
        window.addEventListener('beforeunload', handleAppStateChange);
      }
    } else {
      // Mobile platform - use AppState
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
      handleAppStateChange(); // Update offline status when component unmounts
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

  const loginWithGoogle = async () => {
    try {
      const response = await services.auth.loginWithGoogle();
      return {
        success: response.success,
        message:
          response.message ||
          (response.success
            ? 'Google login successful'
            : 'Google login failed'),
      };
    } catch (error) {
      console.error('Google login error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Google login failed',
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
      // Update offline status before logging out
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
        // If cleanup was successful, the user was signed out
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

  const value: AuthContextType = {
    user,
    firebaseUser,
    isLoading,
    isAuthenticated: !!user && !!firebaseUser,
    login,
    loginWithGoogle,
    register,
    logout,
    forgotPassword,
    resetPassword,
    refreshUserProfile,
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
