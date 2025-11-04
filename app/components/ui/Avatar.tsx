import React, { useState } from 'react';
import {
  Image,
  View,
  Text,
  StyleSheet,
  ViewStyle,
  ImageStyle,
  ActivityIndicator,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { THEME } from '../../../constants/theme';
import { useTheme } from '../../../contexts/ThemeContext';
import { lightTheme, darkTheme } from '../../../constants/theme';
import { scale, verticalScale } from '../../../utils/responsive';

export type AvatarSize = 'small' | 'medium' | 'large' | 'xlarge';

interface AvatarProps {
  source?: string;
  name?: string;
  size?: AvatarSize;
  style?: ViewStyle;
  showOnline?: boolean;
  statusRing?: boolean;
  statusRingColor?: string;
}

const Avatar: React.FC<AvatarProps> = ({
  source,
  name,
  size = 'medium',
  style,
  showOnline = false,
  statusRing = false,
  statusRingColor,
}) => {
  const { isDarkMode } = useTheme();
  const theme = isDarkMode ? darkTheme : lightTheme;
  const [loading, setLoading] = useState(!!source);
  const [error, setError] = useState(false);

  // Animation for online pulse
  const pulseScale = useSharedValue(1);

  React.useEffect(() => {
    if (showOnline) {
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.2, {
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
          }),
          withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        false
      );
    }
  }, [showOnline]);

  const pulseAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  const sizeMap: Record<AvatarSize, number> = {
    small: scale(40),
    medium: scale(56),
    large: scale(80),
    xlarge: scale(120),
  };

  const fontSize: Record<AvatarSize, number> = {
    small: THEME.fonts.small,
    medium: THEME.fonts.medium,
    large: THEME.fonts.large,
    xlarge: THEME.fonts.xlarge,
  };

  const onlineBadgeSize: Record<AvatarSize, number> = {
    small: scale(10),
    medium: scale(14),
    large: scale(18),
    xlarge: scale(24),
  };

  const avatarSize = sizeMap[size];
  const initials = name
    ? name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : '?';

  const containerStyle: ViewStyle = {
    width: avatarSize,
    height: avatarSize,
    borderRadius: avatarSize / 2,
    backgroundColor: theme.primaryVariant,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  };

  const statusRingContainerStyle: ViewStyle = {
    width: avatarSize + scale(8),
    height: avatarSize + scale(8),
    borderRadius: (avatarSize + scale(8)) / 2,
    justifyContent: 'center',
    alignItems: 'center',
  };

  const imageStyle: ImageStyle = {
    width: avatarSize,
    height: avatarSize,
    borderRadius: avatarSize / 2,
  };

  const onlineBadgeStyle: ViewStyle = {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: onlineBadgeSize[size],
    height: onlineBadgeSize[size],
    borderRadius: onlineBadgeSize[size] / 2,
    backgroundColor: theme.success,
    borderWidth: scale(2),
    borderColor: theme.background,
    zIndex: 10,
  };

  const renderAvatar = () => (
    <View style={[containerStyle, !statusRing && style]}>
      {source && !error ? (
        <>
          <Image
            source={{ uri: source }}
            style={imageStyle}
            onLoadStart={() => setLoading(true)}
            onLoadEnd={() => setLoading(false)}
            onError={() => {
              setLoading(false);
              setError(true);
            }}
          />
          {loading && (
            <View
              style={[
                StyleSheet.absoluteFill,
                {
                  backgroundColor: theme.primaryVariant,
                  justifyContent: 'center',
                  alignItems: 'center',
                },
              ]}
            >
              <ActivityIndicator size="small" color={theme.primary} />
            </View>
          )}
        </>
      ) : (
        <Text
          style={{
            color: theme.primary,
            fontSize: fontSize[size],
            fontWeight: '600',
          }}
        >
          {initials}
        </Text>
      )}

      {showOnline && (
        <Animated.View style={[onlineBadgeStyle, pulseAnimatedStyle]} />
      )}
    </View>
  );

  if (statusRing) {
    return (
      <View style={[statusRingContainerStyle, style]}>
        <LinearGradient
          colors={
            statusRingColor
              ? [statusRingColor, statusRingColor]
              : (theme.primaryGradient as any)
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            StyleSheet.absoluteFill,
            { borderRadius: (avatarSize + scale(8)) / 2 },
          ]}
        />
        {renderAvatar()}
      </View>
    );
  }

  return renderAvatar();
};

export default Avatar;
