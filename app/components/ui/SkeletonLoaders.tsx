// app/components/ui/SkeletonLoaders.tsx
import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Skeleton, { SkeletonAvatar, SkeletonText } from './Skeleton';
import { THEME, lightTheme, darkTheme } from '../../../constants/theme';
import { useTheme } from '../../../contexts/ThemeContext';

const { width } = Dimensions.get('window');

/**
 * Profile Card Skeleton - for discovery/search screen
 */
export const ProfileCardSkeleton: React.FC = () => {
  const { isDarkMode } = useTheme();
  const theme = isDarkMode ? darkTheme : lightTheme;

  return (
    <View
      style={[styles.profileCard, { backgroundColor: theme.cardBackground }]}
    >
      {/* Main image */}
      <Skeleton
        width={width - 32}
        height={480}
        borderRadius={THEME.borderRadius.xl}
        style={styles.mainImage}
      />

      {/* User info overlay */}
      <View style={styles.userInfo}>
        <SkeletonText lines={1} width="60%" />
        <View style={{ height: 8 }} />
        <SkeletonText lines={2} width="80%" />
        <View style={{ height: 12 }} />

        {/* Interest tags */}
        <View style={styles.tagsRow}>
          <Skeleton width={60} height={28} borderRadius={14} />
          <Skeleton
            width={80}
            height={28}
            borderRadius={14}
            style={{ marginLeft: 8 }}
          />
          <Skeleton
            width={70}
            height={28}
            borderRadius={14}
            style={{ marginLeft: 8 }}
          />
        </View>
      </View>
    </View>
  );
};

/**
 * Chat List Item Skeleton
 */
export const ChatListItemSkeleton: React.FC = () => {
  const { isDarkMode } = useTheme();
  const theme = isDarkMode ? darkTheme : lightTheme;

  return (
    <View style={[styles.chatItem, { backgroundColor: theme.cardBackground }]}>
      <SkeletonAvatar size={56} />
      <View style={styles.chatContent}>
        <View style={styles.chatHeader}>
          <Skeleton width={120} height={18} />
          <Skeleton width={40} height={14} />
        </View>
        <View style={{ height: 6 }} />
        <Skeleton width="80%" height={14} />
      </View>
    </View>
  );
};

/**
 * Connection Card Skeleton
 */
export const ConnectionCardSkeleton: React.FC = () => {
  const { isDarkMode } = useTheme();
  const theme = isDarkMode ? darkTheme : lightTheme;

  return (
    <View
      style={[styles.connectionCard, { backgroundColor: theme.cardBackground }]}
    >
      <Skeleton
        width={(width - 48) / 2}
        height={220}
        borderRadius={THEME.borderRadius.lg}
      />
      <View style={styles.connectionInfo}>
        <Skeleton width="70%" height={16} />
        <View style={{ height: 4 }} />
        <Skeleton width="50%" height={14} />
      </View>
    </View>
  );
};

/**
 * Message Skeleton
 */
export const MessageSkeleton: React.FC<{ isFromCurrentUser?: boolean }> = ({
  isFromCurrentUser = false,
}) => {
  const { isDarkMode } = useTheme();
  const theme = isDarkMode ? darkTheme : lightTheme;

  return (
    <View
      style={[
        styles.message,
        isFromCurrentUser ? styles.messageRight : styles.messageLeft,
      ]}
    >
      <Skeleton width={200} height={48} borderRadius={THEME.borderRadius.lg} />
    </View>
  );
};

/**
 * Profile Detail Skeleton
 */
export const ProfileDetailSkeleton: React.FC = () => {
  const { isDarkMode } = useTheme();
  const theme = isDarkMode ? darkTheme : lightTheme;

  return (
    <View style={[styles.profileDetail, { backgroundColor: theme.background }]}>
      {/* Cover image */}
      <Skeleton width={width} height={400} borderRadius={0} />

      {/* Profile info */}
      <View style={styles.profileDetailContent}>
        <View style={styles.profileHeader}>
          <View>
            <Skeleton width={200} height={32} />
            <View style={{ height: 8 }} />
            <Skeleton width={150} height={18} />
          </View>
        </View>

        <View style={{ height: 24 }} />

        {/* Bio section */}
        <Skeleton width={80} height={20} style={{ marginBottom: 12 }} />
        <SkeletonText lines={3} />

        <View style={{ height: 24 }} />

        {/* Details section */}
        <Skeleton width={100} height={20} style={{ marginBottom: 12 }} />
        <View style={styles.detailRow}>
          <Skeleton width={80} height={16} />
          <Skeleton width={120} height={16} />
        </View>
        <View style={{ height: 12 }} />
        <View style={styles.detailRow}>
          <Skeleton width={80} height={16} />
          <Skeleton width={100} height={16} />
        </View>

        <View style={{ height: 24 }} />

        {/* Interests */}
        <Skeleton width={90} height={20} style={{ marginBottom: 12 }} />
        <View style={styles.tagsRow}>
          <Skeleton width={70} height={32} borderRadius={16} />
          <Skeleton
            width={90}
            height={32}
            borderRadius={16}
            style={{ marginLeft: 8 }}
          />
          <Skeleton
            width={80}
            height={32}
            borderRadius={16}
            style={{ marginLeft: 8 }}
          />
        </View>
      </View>
    </View>
  );
};

/**
 * Full Screen Loading - Multiple cards for discovery
 */
export const DiscoveryScreenSkeleton: React.FC = () => {
  return (
    <View style={styles.fullScreen}>
      <ProfileCardSkeleton />
    </View>
  );
};

/**
 * Chat Screen Skeleton
 */
export const ChatScreenSkeleton: React.FC = () => {
  return (
    <View style={styles.fullScreen}>
      {Array.from({ length: 5 }).map((_, index) => (
        <ChatListItemSkeleton key={index} />
      ))}
    </View>
  );
};

/**
 * Connections Grid Skeleton
 */
export const ConnectionsGridSkeleton: React.FC = () => {
  return (
    <View style={styles.connectionsGrid}>
      {Array.from({ length: 6 }).map((_, index) => (
        <ConnectionCardSkeleton key={index} />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  profileCard: {
    borderRadius: THEME.borderRadius.xl,
    padding: THEME.spacing.md,
    marginHorizontal: THEME.spacing.md,
    ...THEME.shadows.medium,
  },
  mainImage: {
    marginBottom: THEME.spacing.md,
  },
  userInfo: {
    marginTop: THEME.spacing.sm,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  chatItem: {
    flexDirection: 'row',
    padding: THEME.spacing.md,
    borderRadius: THEME.borderRadius.lg,
    marginBottom: THEME.spacing.sm,
    ...THEME.shadows.small,
  },
  chatContent: {
    flex: 1,
    marginLeft: THEME.spacing.md,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  connectionCard: {
    width: (width - 48) / 2,
    borderRadius: THEME.borderRadius.lg,
    marginBottom: THEME.spacing.md,
    ...THEME.shadows.small,
  },
  connectionInfo: {
    padding: THEME.spacing.sm,
  },
  message: {
    marginVertical: THEME.spacing.xs,
  },
  messageRight: {
    alignSelf: 'flex-end',
  },
  messageLeft: {
    alignSelf: 'flex-start',
  },
  profileDetail: {
    flex: 1,
  },
  profileDetailContent: {
    padding: THEME.spacing.lg,
  },
  profileHeader: {
    marginTop: -THEME.spacing.xxl,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  fullScreen: {
    flex: 1,
    padding: THEME.spacing.md,
  },
  connectionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    padding: THEME.spacing.md,
  },
});

export default {
  ProfileCardSkeleton,
  ChatListItemSkeleton,
  ConnectionCardSkeleton,
  MessageSkeleton,
  ProfileDetailSkeleton,
  DiscoveryScreenSkeleton,
  ChatScreenSkeleton,
  ConnectionsGridSkeleton,
};
