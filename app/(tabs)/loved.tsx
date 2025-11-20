import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
} from 'react-native';
import { Heart } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, Layout, ZoomOut } from 'react-native-reanimated';
import { useUserStore } from '../../store';
import ProfileDetail from '../components/ProfileDetail';
import { EnhancedEmptyState } from '../components/ui';
import { useTheme } from '../../contexts/ThemeContext';
import { lightTheme, darkTheme } from '../../constants/theme';
import {
  verticalScale,
  moderateScale,
  spacing,
  borderRadius,
} from '../../utils/responsive';

// --- Components ---

const SegmentedControl = ({ activeTab, onTabChange, theme, counts }: any) => {
  return (
    <View style={[styles.segmentContainer, { backgroundColor: theme.surface }]}>
      {['loved', 'matches'].map((tab) => {
        const isActive = activeTab === tab;
        return (
          <TouchableOpacity
            key={tab}
            style={[
              styles.segmentButton,
              isActive && {
                backgroundColor: theme.cardBackground,
                shadowColor: theme.shadow,
                shadowOpacity: 0.1,
                shadowRadius: 4,
                elevation: 2,
              },
            ]}
            onPress={() => onTabChange(tab)}
          >
            <Text
              style={[
                styles.segmentText,
                {
                  color: isActive ? theme.primary : theme.textSecondary,
                  fontWeight: isActive ? '700' : '500',
                },
              ]}
            >
              {tab === 'loved' ? 'Likes' : 'Matches'}
              {counts[tab] > 0 && ` (${counts[tab]})`}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const ProfileGridItem = React.memo(
  ({ user, theme, onPress, isMatch, index }: any) => {
    return (
      <Animated.View
        entering={FadeInDown.delay(index * 50).springify()}
        layout={Layout.springify()}
        exiting={ZoomOut}
        style={styles.gridItemContainer}
      >
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => onPress(user)}
          style={[styles.card, { backgroundColor: theme.cardBackground }]}
        >
          <View style={styles.imageContainer}>
            <Image
              source={{ uri: user.image }}
              style={styles.cardImage}
              resizeMode="cover"
            />
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.7)']}
              style={styles.gradientOverlay}
            />
            {isMatch && (
              <View style={styles.matchBadge}>
                <Heart size={12} color="#FFF" fill="#FFF" />
              </View>
            )}
            <Text style={styles.cardName} numberOfLines={1}>
              {user.name}, {user.age}
            </Text>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  }
);

export default function LovedScreen() {
  const { t } = useTranslation();
  const { isDarkMode } = useTheme();
  const theme = isDarkMode ? darkTheme : lightTheme;
  const router = useRouter();
  const { likedProfilesData, matchedProfilesData, createConversation } =
    useUserStore();

  const [activeTab, setActiveTab] = useState<'loved' | 'matches'>('loved');
  const [selectedProfile, setSelectedProfile] = useState<any>(null);
  const [showProfileDetail, setShowProfileDetail] = useState(false);

  // Deduplication & Filtering
  const displayData = useMemo(() => {
    const data =
      activeTab === 'loved' ? likedProfilesData : matchedProfilesData;
    const unique = new Map();
    data.forEach((item) => unique.set(item.id, item));
    return Array.from(unique.values());
  }, [activeTab, likedProfilesData, matchedProfilesData]);

  const handleProfilePress = (user: any) => {
    setSelectedProfile(user);
    setShowProfileDetail(true);
  };

  const handleMessage = async () => {
    if (selectedProfile) {
      await createConversation(selectedProfile.id);
      setShowProfileDetail(false);
      router.push('/chat');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: theme.text }]}>
          {t('loved.title')}
        </Text>
        <SegmentedControl
          activeTab={activeTab}
          onTabChange={setActiveTab}
          theme={theme}
          counts={{
            loved: likedProfilesData.length,
            matches: matchedProfilesData.length,
          }}
        />
      </View>

      {/* Content */}
      <FlatList
        data={displayData}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <ProfileGridItem
            user={item}
            theme={theme}
            index={index}
            isMatch={activeTab === 'matches'}
            onPress={handleProfilePress}
          />
        )}
        numColumns={2}
        columnWrapperStyle={styles.columnWrapper}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <EnhancedEmptyState
            type={activeTab === 'loved' ? 'loved' : 'matches'}
            onAction={() => router.push('/(tabs)/search')}
            actionLabel={t('common.startSwiping')}
          />
        }
      />

      {/* Detail Modal */}
      {showProfileDetail && selectedProfile && (
        <View style={StyleSheet.absoluteFill}>
          <ProfileDetail
            user={selectedProfile}
            onClose={() => setShowProfileDetail(false)}
            onLike={() => {}}
            onDislike={() => {}}
            onMessage={activeTab === 'matches' ? handleMessage : undefined}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: verticalScale(10), // Match 10pt top padding
    paddingBottom: spacing.md,
  },
  // SYNCED TITLE
  headerTitle: {
    fontSize: moderateScale(22),
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: spacing.md,
  },
  segmentContainer: {
    flexDirection: 'row',
    padding: 4,
    borderRadius: borderRadius.lg,
  },
  segmentButton: {
    flex: 1,
    paddingVertical: verticalScale(8),
    alignItems: 'center',
    borderRadius: borderRadius.md,
  },
  segmentText: { fontSize: moderateScale(14) },

  // Grid
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: verticalScale(100),
  },
  columnWrapper: {
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  gridItemContainer: {
    width: '48%',
    marginBottom: spacing.md,
  },
  card: {
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    aspectRatio: 0.75, // Portrait
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  imageContainer: { flex: 1, position: 'relative' },
  cardImage: { width: '100%', height: '100%' },
  gradientOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '45%',
  },
  cardName: {
    position: 'absolute',
    bottom: spacing.md,
    left: spacing.md,
    right: spacing.md,
    color: '#FFF',
    fontSize: moderateScale(16),
    fontWeight: '700',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowRadius: 4,
  },
  matchBadge: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    backgroundColor: '#E11D48',
    padding: 6,
    borderRadius: 20,
  },
});
