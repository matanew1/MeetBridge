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
import { THEME } from '../../../constants/theme';
import { useTheme } from '../../../contexts/ThemeContext';

export type AvatarSize = 'small' | 'medium' | 'large' | 'xlarge';

interface AvatarProps {
  source?: string;
  name?: string;
  size?: AvatarSize;
  style?: ViewStyle;
  showOnline?: boolean;
}

const Avatar: React.FC<AvatarProps> = ({
  source,
  name,
  size = 'medium',
  style,
  showOnline = false,
}) => {
  const { theme } = useTheme();
  const [loading, setLoading] = useState(!!source);
  const [error, setError] = useState(false);

  const sizeMap: Record<AvatarSize, number> = {
    small: 40,
    medium: 56,
    large: 80,
    xlarge: 120,
  };

  const fontSize: Record<AvatarSize, number> = {
    small: THEME.fonts.small,
    medium: THEME.fonts.medium,
    large: THEME.fonts.large,
    xlarge: THEME.fonts.xlarge,
  };

  const onlineBadgeSize: Record<AvatarSize, number> = {
    small: 10,
    medium: 14,
    large: 18,
    xlarge: 24,
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
    borderWidth: 2,
    borderColor: theme.background,
  };

  return (
    <View style={[containerStyle, style]}>
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

      {showOnline && <View style={onlineBadgeStyle} />}
    </View>
  );
};

export default Avatar;
