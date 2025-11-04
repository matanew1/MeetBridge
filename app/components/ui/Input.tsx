import React, { useState } from 'react';
import {
  TextInput,
  View,
  Text,
  StyleSheet,
  ViewStyle,
  TextInputProps,
  TouchableOpacity,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
} from 'react-native-reanimated';
import { THEME, lightTheme, darkTheme } from '../../../constants/theme';
import { useTheme } from '../../../contexts/ThemeContext';
import {
  scale,
  verticalScale,
  moderateScale,
  spacing,
  borderRadius,
  fontScale,
} from '../../../utils/responsive';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerStyle?: ViewStyle;
}

const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  leftIcon,
  rightIcon,
  containerStyle,
  style,
  secureTextEntry,
  ...props
}) => {
  const { isDarkMode } = useTheme();
  const theme = isDarkMode ? darkTheme : lightTheme;
  const [isFocused, setIsFocused] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const isPassword = secureTextEntry;
  const showPasswordToggle = isPassword && rightIcon === undefined;

  // Animations
  const borderWidth = useSharedValue(1);
  const labelScale = useSharedValue(1);

  const handleFocus = () => {
    setIsFocused(true);
    borderWidth.value = withTiming(2, { duration: 150 });
    if (label) {
      labelScale.value = withSpring(0.85, { damping: 15 });
    }
  };

  const handleBlur = () => {
    setIsFocused(false);
    borderWidth.value = withTiming(1, { duration: 150 });
    if (label && !props.value) {
      labelScale.value = withSpring(1, { damping: 15 });
    }
  };

  const animatedBorderStyle = useAnimatedStyle(() => ({
    borderWidth: borderWidth.value,
  }));

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Text
          style={[
            styles.label,
            {
              color: error
                ? theme.error
                : isFocused
                ? theme.primary
                : theme.textSecondary,
              fontWeight: isFocused ? '600' : '500',
            },
          ]}
        >
          {label}
        </Text>
      )}

      <Animated.View
        style={[
          styles.inputContainer,
          animatedBorderStyle,
          {
            backgroundColor: theme.surface,
            borderColor: error
              ? theme.error
              : isFocused
              ? theme.primary
              : theme.border,
          },
        ]}
      >
        {leftIcon && <View style={styles.iconLeft}>{leftIcon}</View>}

        <TextInput
          style={[
            styles.input,
            {
              color: theme.text,
              flex: 1,
            },
            style,
          ]}
          placeholderTextColor={theme.textTertiary}
          onFocus={handleFocus}
          onBlur={handleBlur}
          secureTextEntry={isPassword && !isPasswordVisible}
          {...props}
        />

        {showPasswordToggle && (
          <TouchableOpacity
            onPress={() => setIsPasswordVisible(!isPasswordVisible)}
            style={styles.iconRight}
          >
            <Text style={{ color: theme.textSecondary }}>
              {isPasswordVisible ? '👁️' : '👁️‍🗨️'}
            </Text>
          </TouchableOpacity>
        )}

        {rightIcon && !showPasswordToggle && (
          <View style={styles.iconRight}>{rightIcon}</View>
        )}
      </Animated.View>

      {(error || helperText) && (
        <Text
          style={[
            styles.helperText,
            {
              color: error ? theme.error : theme.textSecondary,
              ...theme.typography.caption,
            },
          ]}
        >
          {error || helperText}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: fontScale(14),
    fontWeight: '500',
    marginBottom: spacing.xs,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: borderRadius.lg,
    minHeight: verticalScale(50),
    paddingHorizontal: spacing.lg,
  },
  input: {
    fontSize: fontScale(16),
    paddingVertical: spacing.sm,
    lineHeight: fontScale(24),
  },
  iconLeft: {
    marginRight: spacing.sm,
  },
  iconRight: {
    marginLeft: spacing.sm,
  },
  helperText: {
    fontSize: THEME.fonts.small,
    marginTop: THEME.spacing.xs,
  },
});

export default Input;
