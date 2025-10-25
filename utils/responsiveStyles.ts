// utils/responsiveStyles.ts
import { StyleSheet } from 'react-native';
import {
  scale,
  verticalScale,
  moderateScale,
  spacing,
  borderRadius,
  fontScale,
} from './responsive';

export const createResponsiveStyles = (theme: any) =>
  StyleSheet.create({
    // Container styles
    container: {
      flex: 1,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
    },

    screenContainer: {
      flex: 1,
      backgroundColor: theme.background,
    },

    centeredContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: spacing.lg,
    },

    // Card styles
    card: {
      backgroundColor: theme.cardBackground,
      borderRadius: borderRadius.lg,
      padding: spacing.md,
      marginVertical: spacing.xs,
      shadowColor: theme.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 4,
    },

    // Button styles
    button: {
      borderRadius: borderRadius.md,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.lg,
      minHeight: verticalScale(44),
      alignItems: 'center',
      justifyContent: 'center',
    },

    buttonText: {
      fontSize: fontScale(16),
      fontWeight: '600',
    },

    // Input styles
    input: {
      borderRadius: borderRadius.md,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      minHeight: verticalScale(44),
      fontSize: fontScale(16),
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.border,
    },

    // Text styles
    heading1: {
      fontSize: fontScale(32),
      fontWeight: '700',
      lineHeight: fontScale(40),
      color: theme.text,
    },

    heading2: {
      fontSize: fontScale(28),
      fontWeight: '600',
      lineHeight: fontScale(36),
      color: theme.text,
    },

    heading3: {
      fontSize: fontScale(24),
      fontWeight: '600',
      lineHeight: fontScale(32),
      color: theme.text,
    },

    body: {
      fontSize: fontScale(16),
      fontWeight: '400',
      lineHeight: fontScale(24),
      color: theme.text,
    },

    caption: {
      fontSize: fontScale(14),
      fontWeight: '400',
      lineHeight: fontScale(20),
      color: theme.textSecondary,
    },

    // Layout styles
    row: {
      flexDirection: 'row',
      alignItems: 'center',
    },

    column: {
      flexDirection: 'column',
    },

    spaceBetween: {
      justifyContent: 'space-between',
    },

    centered: {
      justifyContent: 'center',
      alignItems: 'center',
    },

    // Spacing utilities
    marginXs: { margin: spacing.xs },
    marginSm: { margin: spacing.sm },
    marginMd: { margin: spacing.md },
    marginLg: { margin: spacing.lg },

    paddingXs: { padding: spacing.xs },
    paddingSm: { padding: spacing.sm },
    paddingMd: { padding: spacing.md },
    paddingLg: { padding: spacing.lg },

    // Modal styles
    modalOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },

    modalContent: {
      backgroundColor: theme.surface,
      borderRadius: borderRadius.xl,
      padding: spacing.lg,
      marginHorizontal: spacing.lg,
      maxHeight: verticalScale(500),
      width: '90%',
      maxWidth: scale(400),
    },
  });
