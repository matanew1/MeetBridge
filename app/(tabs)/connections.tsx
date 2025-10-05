// app/(tabs)/connections.tsx - Simplified version matching chat screen style
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  FlatList,
  Animated,
  TextInput,
  Modal,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  I18nManager,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Sparkles,
  Plus,
  MapPin,
  Clock,
  Heart,
  MessageCircle,
  Navigation,
  X,
  RefreshCw,
  Zap,
  Eye,
  TrendingUp,
  Edit2,
  Trash2,
  MoreVertical,
  Bookmark,
} from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../contexts/ThemeContext';
import { lightTheme, darkTheme } from '../../constants/theme';
import { useAuth } from '../../contexts/AuthContext';
import LocationService from '../../services/locationService';
import missedConnectionsService, {
  MissedConnection,
} from '../../services/firebase/missedConnectionsService';

// Helper function
function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
}

// Connection Item Component (similar to ChatItem)
interface ConnectionItemProps {
  connection: MissedConnection;
  theme: any;
  index: number;
  onPress: () => void;
  onLike: () => void;
  onClaim: () => void;
  onComment: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onSave: () => void;
  isLiked: boolean;
  isSaved: boolean;
  currentUserId: string | undefined;
}

const ConnectionItem: React.FC<ConnectionItemProps> = ({
  connection,
  theme,
  index,
  onPress,
  onLike,
  onClaim,
  onComment,
  onEdit,
  onDelete,
  onSave,
  isLiked,
  isSaved,
  currentUserId,
}) => {
  const slideAnim = React.useRef(new Animated.Value(50)).current;
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const scaleAnim = React.useRef(new Animated.Value(0.95)).current;
  const [showOptions, setShowOptions] = useState(false);

  const isOwner = connection.userId === currentUserId;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        delay: index * 50,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        delay: index * 50,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 80,
        friction: 8,
        delay: index * 100,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={[
        {
          transform: [{ translateX: slideAnim }, { scale: scaleAnim }],
          opacity: fadeAnim,
        },
      ]}
    >
      <TouchableOpacity
        style={[
          styles.connectionItem,
          {
            backgroundColor: theme.cardBackground,
            borderColor: theme.borderLight,
            shadowColor: theme.shadow,
          },
        ]}
        activeOpacity={0.7}
        onPress={onPress}
      >
        {/* Accent Bar */}
        <View
          style={[
            styles.accentBar,
            { backgroundColor: theme.primary, opacity: 0.6 },
          ]}
        />

        {/* Content */}
        <View style={styles.connectionContent}>
          {/* User Profile Section */}
          <View style={styles.userSection}>
            <Image
              source={
                connection.userImage
                  ? { uri: connection.userImage }
                  : require('../../assets/images/placeholder.png')
              }
              style={styles.userAvatar}
            />
            <View style={styles.userInfo}>
              <Text style={[styles.userName, { color: theme.text }]}>
                {connection.userName || 'Anonymous'}
              </Text>
              <View style={styles.locationRow}>
                <Text
                  style={[
                    styles.locationNameSmall,
                    { color: theme.textSecondary },
                  ]}
                >
                  {connection.location.landmark}
                </Text>
              </View>
            </View>
            <View style={styles.rightColumn}>
              <View style={styles.timeContainer}>
                <Clock size={11} color={theme.textSecondary} />
                <Text
                  style={[styles.timeTextSmall, { color: theme.textSecondary }]}
                >
                  {formatRelativeTime(connection.createdAt)}
                  {connection.isEdited && ' (edited)'}
                </Text>
              </View>
              {connection.likes > 5 && (
                <View
                  style={[
                    styles.hotBadgeInline,
                    { backgroundColor: theme.error },
                  ]}
                >
                  <Zap size={10} color="#FFF" />
                  <Text style={styles.hotBadgeText}>Hot</Text>
                </View>
              )}
            </View>
          </View>

          {/* Tags - First */}
          {connection.tags && connection.tags.length > 0 && (
            <View style={styles.tagsRow}>
              {connection.tags.slice(0, 3).map((tag: string) => (
                <View
                  key={tag}
                  style={[
                    styles.tagSmall,
                    { backgroundColor: `${theme.primary}15` },
                  ]}
                >
                  <Text style={[styles.tagSmallText, { color: theme.primary }]}>
                    #{tag}
                  </Text>
                </View>
              ))}
              {connection.tags.length > 3 && (
                <Text
                  style={[styles.moreTagsText, { color: theme.textSecondary }]}
                >
                  +{connection.tags.length - 3}
                </Text>
              )}
            </View>
          )}

          {/* Popularity Stats - Second (sorted as tags above) */}
          <View style={styles.popularityRow}>
            <View style={styles.statItem}>
              <Eye size={12} color={theme.textSecondary} />
              <Text style={[styles.statText, { color: theme.textSecondary }]}>
                {connection.views || 0}
              </Text>
            </View>
            <View style={styles.statItem}>
              <TrendingUp size={12} color={theme.textSecondary} />
              <Text style={[styles.statText, { color: theme.textSecondary }]}>
                {connection.likes + (connection.comments || 0)}
              </Text>
            </View>
          </View>

          {/* Description with emojis - Third */}
          <Text
            style={[styles.descriptionText, { color: theme.text }]}
            numberOfLines={3}
          >
            {connection.description}
          </Text>

          {/* Actions */}
          <View
            style={[
              styles.actions,
              I18nManager.isRTL ? styles.actionsRTL : styles.actionsLTR,
            ]}
          >
            <TouchableOpacity
              style={[
                styles.actionButton,
                {
                  backgroundColor: isLiked
                    ? `${theme.primary}20`
                    : `${theme.primary}10`,
                },
              ]}
              onPress={(e) => {
                e.stopPropagation();
                onLike();
              }}
            >
              <Heart
                size={16}
                color={theme.primary}
                fill={isLiked ? theme.primary : 'none'}
              />
              <Text style={[styles.actionText, { color: theme.text }]}>
                {connection.likes}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.actionButton,
                { backgroundColor: `${theme.textSecondary}10` },
              ]}
              onPress={(e) => {
                e.stopPropagation();
                onComment();
              }}
            >
              <MessageCircle size={16} color={theme.textSecondary} />
              <Text style={[styles.actionText, { color: theme.text }]}>
                {connection.comments || 0}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.actionButton,
                {
                  backgroundColor: isSaved
                    ? `${theme.primary}20`
                    : `${theme.textSecondary}10`,
                },
              ]}
              onPress={(e) => {
                e.stopPropagation();
                onSave();
              }}
            >
              <Bookmark
                size={16}
                color={isSaved ? theme.primary : theme.textSecondary}
                fill={isSaved ? theme.primary : 'none'}
              />
            </TouchableOpacity>

            {/* Options Menu for Owner */}
            {isOwner && (
              <View style={styles.optionsMenuInline}>
                <TouchableOpacity
                  style={[
                    styles.actionButton,
                    { backgroundColor: `${theme.textSecondary}10` },
                  ]}
                  onPress={(e) => {
                    e.stopPropagation();
                    setShowOptions(!showOptions);
                  }}
                >
                  <MoreVertical size={16} color={theme.textSecondary} />
                </TouchableOpacity>

                {showOptions && (
                  <View
                    style={[
                      styles.optionsMenu,
                      {
                        backgroundColor: theme.cardBackground,
                        borderColor: theme.border,
                      },
                    ]}
                  >
                    <TouchableOpacity
                      style={styles.optionItem}
                      onPress={(e) => {
                        e.stopPropagation();
                        setShowOptions(false);
                        onEdit();
                      }}
                    >
                      <Edit2 size={16} color={theme.primary} />
                      <Text style={[styles.optionText, { color: theme.text }]}>
                        Edit
                      </Text>
                    </TouchableOpacity>
                    <View
                      style={[
                        styles.optionDivider,
                        { backgroundColor: theme.border },
                      ]}
                    />
                    <TouchableOpacity
                      style={styles.optionItem}
                      onPress={(e) => {
                        e.stopPropagation();
                        setShowOptions(false);
                        onDelete();
                      }}
                    >
                      <Trash2 size={16} color={theme.error} />
                      <Text style={[styles.optionText, { color: theme.error }]}>
                        Delete
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}

            <TouchableOpacity
              style={[
                styles.claimButton,
                {
                  backgroundColor: theme.success,
                  shadowColor: theme.success,
                },
              ]}
              onPress={(e) => {
                e.stopPropagation();
                onClaim();
              }}
            >
              <Sparkles size={14} color="#FFF" />
              <Text style={styles.claimButtonText}>That's Me!</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

// Memoize ConnectionItem to prevent unnecessary re-renders
const MemoizedConnectionItem = React.memo(
  ConnectionItem,
  (prevProps, nextProps) => {
    return (
      prevProps.connection.id === nextProps.connection.id &&
      prevProps.isLiked === nextProps.isLiked &&
      prevProps.isSaved === nextProps.isSaved &&
      prevProps.connection.likes === nextProps.connection.likes &&
      prevProps.connection.comments === nextProps.connection.comments &&
      prevProps.connection.views === nextProps.connection.views &&
      prevProps.theme === nextProps.theme // IMPORTANT: Check theme changes for dark/light mode
    );
  }
);

// Create Connection Modal
interface CreateModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  theme: any;
}

const CreateConnectionModal: React.FC<CreateModalProps> = ({
  visible,
  onClose,
  onSubmit,
  theme,
}) => {
  const [description, setDescription] = useState('');
  const [detectedLocation, setDetectedLocation] = useState<any>(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);

  // Auto-detect location when modal opens
  useEffect(() => {
    if (visible && !detectedLocation) {
      detectLocation();
    }
  }, [visible]);

  const detectLocation = async () => {
    setIsDetecting(true);
    try {
      const location = await LocationService.getCurrentLocation();
      if (location) {
        // Get actual address from coordinates
        const address = await LocationService.getAddressFromCoordinates(
          location.latitude,
          location.longitude
        );

        // Determine category and icon based on time or random
        const hour = new Date().getHours();
        let category = 'general';
        let icon = '📍';

        // Smart icon selection based on time of day
        if (hour >= 6 && hour < 11) {
          category = 'morning';
          icon = '☕'; // Morning/breakfast time
        } else if (hour >= 11 && hour < 14) {
          category = 'lunch';
          icon = '🍽️'; // Lunch time
        } else if (hour >= 14 && hour < 18) {
          category = 'afternoon';
          icon = '📚'; // Afternoon/study time
        } else if (hour >= 18 && hour < 22) {
          category = 'evening';
          icon = '🌆'; // Evening/dinner time
        } else {
          category = 'night';
          icon = '🌙'; // Night time
        }

        setDetectedLocation({
          lat: location.latitude,
          lng: location.longitude,
          landmark: address || 'Current Location',
          name: address || 'Current Location',
          category: category,
          icon: icon,
        });
      } else {
        Alert.alert(
          'Location Not Available',
          'Please enable location permissions in your device settings to use this feature.'
        );
      }
    } catch (error) {
      console.log('Location detection error:', error);
      Alert.alert(
        'Location Not Available',
        'Location services are not configured. Please select a location manually or enable location permissions in your device settings.'
      );
    } finally {
      setIsDetecting(false);
    }
  };

  const handleAddTag = () => {
    const trimmedTag = tagInput.trim().replace(/^#/, ''); // Remove # if present
    if (trimmedTag && tags.length < 5 && !tags.includes(trimmedTag)) {
      setTags([...tags, trimmedTag]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  const handleSubmit = () => {
    if (!description.trim() || !detectedLocation) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }

    onSubmit({
      location: detectedLocation,
      description: description.trim(),
      tags: tags,
      timeOccurred: new Date(),
      isAnonymous: isAnonymous,
    });

    setDescription('');
    setDetectedLocation(null);
    setTags([]);
    setIsAnonymous(false);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[styles.modalContent, { backgroundColor: theme.surface }]}
          >
            {/* Header */}
            <View
              style={[styles.modalHeader, { borderBottomColor: theme.border }]}
            >
              <Text style={[styles.modalTitle, { color: theme.text }]}>
                Share Your Story
              </Text>
              <TouchableOpacity onPress={onClose}>
                <X size={24} color={theme.text} />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.modalBody}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {/* Location */}
              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: theme.text }]}>
                  Location
                </Text>
                {!detectedLocation ? (
                  <TouchableOpacity
                    style={[
                      styles.detectButton,
                      { backgroundColor: theme.primary },
                    ]}
                    onPress={detectLocation}
                    disabled={isDetecting}
                  >
                    <Navigation size={20} color={theme.surface} />
                    <Text style={styles.detectButtonText}>
                      {isDetecting ? 'Detecting...' : 'Detect My Location'}
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <View
                    style={[
                      styles.detectedLocation,
                      { backgroundColor: theme.background },
                    ]}
                  >
                    <Text style={styles.detectedIcon}>
                      {detectedLocation.icon}
                    </Text>
                    <Text style={[styles.detectedName, { color: theme.text }]}>
                      {detectedLocation.name}
                    </Text>
                    <TouchableOpacity onPress={detectLocation}>
                      <Text style={{ color: theme.primary }}>Change</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              {/* Description */}
              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: theme.text }]}>
                  What happened?
                </Text>
                <TextInput
                  style={[
                    styles.descriptionInput,
                    { backgroundColor: theme.background, color: theme.text },
                  ]}
                  placeholder="Describe what happened... Use emojis to express yourself! 😊"
                  placeholderTextColor={theme.textSecondary}
                  value={description}
                  onChangeText={setDescription}
                  multiline
                  maxLength={500}
                  textAlignVertical="top"
                />
                <Text
                  style={[styles.charCount, { color: theme.textSecondary }]}
                >
                  {description.length}/500
                </Text>
              </View>

              {/* Tags */}
              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: theme.text }]}>
                  Tags (Optional)
                </Text>
                <View style={styles.tagInputContainer}>
                  <TextInput
                    style={[
                      styles.tagInput,
                      { backgroundColor: theme.background, color: theme.text },
                    ]}
                    placeholder="Add tag (e.g., coffee, bookworm)..."
                    placeholderTextColor={theme.textSecondary}
                    value={tagInput}
                    onChangeText={setTagInput}
                    onSubmitEditing={handleAddTag}
                    returnKeyType="done"
                  />
                  <TouchableOpacity
                    style={[
                      styles.addTagButton,
                      { backgroundColor: theme.primary },
                    ]}
                    onPress={handleAddTag}
                    disabled={!tagInput.trim() || tags.length >= 5}
                  >
                    <Plus size={16} color="#FFF" />
                  </TouchableOpacity>
                </View>
                {tags.length > 0 && (
                  <View style={styles.tagsContainer}>
                    {tags.map((tag) => (
                      <View
                        key={tag}
                        style={[
                          styles.tag,
                          { backgroundColor: `${theme.primary}20` },
                        ]}
                      >
                        <Text
                          style={[styles.tagText, { color: theme.primary }]}
                        >
                          #{tag}
                        </Text>
                        <TouchableOpacity onPress={() => handleRemoveTag(tag)}>
                          <X size={14} color={theme.primary} />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                )}
                <Text
                  style={[styles.helperText, { color: theme.textSecondary }]}
                >
                  {tags.length}/5 tags
                </Text>
              </View>

              {/* Anonymous Toggle */}
              <View style={styles.formGroup}>
                <View style={styles.toggleContainer}>
                  <View style={styles.toggleLabel}>
                    <Text
                      style={[
                        styles.formLabel,
                        { color: theme.text, marginBottom: 0 },
                      ]}
                    >
                      Post Anonymously
                    </Text>
                    <Text
                      style={[
                        styles.helperText,
                        { color: theme.textSecondary },
                      ]}
                    >
                      Your name and photo won't be shown
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={[
                      styles.toggleSwitch,
                      {
                        backgroundColor: isAnonymous
                          ? theme.primary
                          : theme.border,
                      },
                    ]}
                    onPress={() => setIsAnonymous(!isAnonymous)}
                  >
                    <View
                      style={[
                        styles.toggleThumb,
                        { backgroundColor: theme.surface },
                        isAnonymous && styles.toggleThumbActive,
                      ]}
                    />
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>

            {/* Submit */}
            <TouchableOpacity
              style={[
                styles.submitButton,
                { backgroundColor: theme.primary },
                (!description.trim() || !detectedLocation) &&
                  styles.disabledButton,
              ]}
              onPress={handleSubmit}
              disabled={!description.trim() || !detectedLocation}
            >
              <Text style={styles.submitButtonText}>Post Connection</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

// Edit Connection Modal
interface EditModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  connection: MissedConnection;
  theme: any;
}

const EditConnectionModal: React.FC<EditModalProps> = ({
  visible,
  onClose,
  onSubmit,
  connection,
  theme,
}) => {
  const [description, setDescription] = useState(connection.description);
  const [tags, setTags] = useState<string[]>(connection.tags || []);
  const [tagInput, setTagInput] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(
    connection.isAnonymous || false
  );

  useEffect(() => {
    if (visible) {
      setDescription(connection.description);
      setTags(connection.tags || []);
      setIsAnonymous(connection.isAnonymous || false);
    }
  }, [visible, connection]);

  const handleAddTag = () => {
    const trimmedTag = tagInput.trim().replace(/^#/, '');
    if (trimmedTag && tags.length < 5 && !tags.includes(trimmedTag)) {
      setTags([...tags, trimmedTag]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  const handleSubmit = () => {
    if (!description.trim()) {
      Alert.alert('Error', 'Please enter a description');
      return;
    }

    onSubmit({
      description: description.trim(),
      tags: tags,
      isAnonymous: isAnonymous,
    });
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[styles.modalContent, { backgroundColor: theme.surface }]}
          >
            {/* Header */}
            <View
              style={[styles.modalHeader, { borderBottomColor: theme.border }]}
            >
              <Text style={[styles.modalTitle, { color: theme.text }]}>
                Edit Your Story
              </Text>
              <TouchableOpacity onPress={onClose}>
                <X size={24} color={theme.text} />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.modalBody}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {/* Description */}
              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: theme.text }]}>
                  What happened?
                </Text>
                <TextInput
                  style={[
                    styles.descriptionInput,
                    { backgroundColor: theme.background, color: theme.text },
                  ]}
                  placeholder="Describe what happened... Use emojis to express yourself! 😊"
                  placeholderTextColor={theme.textSecondary}
                  value={description}
                  onChangeText={setDescription}
                  multiline
                  maxLength={500}
                  textAlignVertical="top"
                />
                <Text
                  style={[styles.charCount, { color: theme.textSecondary }]}
                >
                  {description.length}/500
                </Text>
              </View>

              {/* Tags */}
              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: theme.text }]}>
                  Tags (Optional)
                </Text>
                <View style={styles.tagInputContainer}>
                  <TextInput
                    style={[
                      styles.tagInput,
                      { backgroundColor: theme.background, color: theme.text },
                    ]}
                    placeholder="Add tag (e.g., coffee, bookworm)..."
                    placeholderTextColor={theme.textSecondary}
                    value={tagInput}
                    onChangeText={setTagInput}
                    onSubmitEditing={handleAddTag}
                    returnKeyType="done"
                  />
                  <TouchableOpacity
                    style={[
                      styles.addTagButton,
                      { backgroundColor: theme.primary },
                    ]}
                    onPress={handleAddTag}
                    disabled={!tagInput.trim() || tags.length >= 5}
                  >
                    <Plus size={16} color="#FFF" />
                  </TouchableOpacity>
                </View>
                {tags.length > 0 && (
                  <View style={styles.tagsContainer}>
                    {tags.map((tag) => (
                      <View
                        key={tag}
                        style={[
                          styles.tag,
                          { backgroundColor: `${theme.primary}20` },
                        ]}
                      >
                        <Text
                          style={[styles.tagText, { color: theme.primary }]}
                        >
                          #{tag}
                        </Text>
                        <TouchableOpacity onPress={() => handleRemoveTag(tag)}>
                          <X size={14} color={theme.primary} />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                )}
                <Text
                  style={[styles.helperText, { color: theme.textSecondary }]}
                >
                  {tags.length}/5 tags
                </Text>
              </View>

              {/* Anonymous Toggle */}
              <View style={styles.formGroup}>
                <View style={styles.toggleContainer}>
                  <View style={styles.toggleLabel}>
                    <Text
                      style={[
                        styles.formLabel,
                        { color: theme.text, marginBottom: 0 },
                      ]}
                    >
                      Post Anonymously
                    </Text>
                    <Text
                      style={[
                        styles.helperText,
                        { color: theme.textSecondary },
                      ]}
                    >
                      Your name and photo won't be shown
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={[
                      styles.toggleSwitch,
                      {
                        backgroundColor: isAnonymous
                          ? theme.primary
                          : theme.border,
                      },
                    ]}
                    onPress={() => setIsAnonymous(!isAnonymous)}
                  >
                    <View
                      style={[
                        styles.toggleThumb,
                        { backgroundColor: theme.surface },
                        isAnonymous && styles.toggleThumbActive,
                      ]}
                    />
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>

            {/* Submit */}
            <TouchableOpacity
              style={[
                styles.submitButton,
                { backgroundColor: theme.primary },
                !description.trim() && styles.disabledButton,
              ]}
              onPress={handleSubmit}
              disabled={!description.trim()}
            >
              <Text style={styles.submitButtonText}>Update Connection</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

// Main Component
export default function ConnectionsScreen() {
  const { t } = useTranslation();
  const { isDarkMode } = useTheme();
  const theme = isDarkMode ? darkTheme : lightTheme;
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();

  const [connections, setConnections] = useState<MissedConnection[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingConnection, setEditingConnection] =
    useState<MissedConnection | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'my' | 'saved'>('all');

  // Animations
  const headerSlideAnim = React.useRef(new Animated.Value(-50)).current;
  const headerFadeAnim = React.useRef(new Animated.Value(0)).current;
  const contentSlideAnim = React.useRef(new Animated.Value(30)).current;
  const contentFadeAnim = React.useRef(new Animated.Value(0)).current;
  const emptyIconAnim = React.useRef(new Animated.Value(0)).current;
  const emptyTextAnim = React.useRef(new Animated.Value(50)).current;
  const emptyFadeAnim = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Start header animations
    Animated.parallel([
      Animated.timing(headerSlideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(headerFadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();

    loadConnections();

    // Set up real-time subscription for live updates ONLY for "All Posts" tab
    let unsubscribe: (() => void) | null = null;

    if (activeTab === 'all') {
      unsubscribe = missedConnectionsService.subscribeToConnections(
        (updatedConnections) => {
          console.log(
            '🔄 Real-time update:',
            updatedConnections.length,
            'posts'
          );
          setConnections(updatedConnections);
          setIsLoading(false);
        },
        { limitCount: 50 }
      );
    }

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [activeTab]); // Added activeTab dependency - also calls loadConnections

  const loadConnections = async (isRefresh = false) => {
    if (isRefresh) {
      setIsRefreshing(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } else {
      setIsLoading(true);
    }

    // Request location permission for better results (optional)
    try {
      await LocationService.requestLocationPermissions();
    } catch (error) {
      // Location permissions not available or not configured
      // This is okay - the app will still work without location
    }

    let result;
    if (activeTab === 'my') {
      console.log('🔍 Loading My Posts for user:', user?.id);

      // ALWAYS use fallback for My Posts to ensure it works
      console.log('⚠️ Using fallback to ensure My Posts works...');
      const allPostsResult = await missedConnectionsService.getConnections({
        limitCount: 100,
      });
      console.log(
        '📦 All posts fetched:',
        allPostsResult.data?.length || 0,
        'posts'
      );

      if (allPostsResult.success) {
        const myPosts = allPostsResult.data.filter((post) => {
          console.log(
            `Comparing post.userId: ${post.userId} with user.id: ${user?.id}`
          );
          return post.userId === user?.id;
        });
        console.log('✅ Filtered to', myPosts.length, 'of my posts');
        result = {
          success: true,
          data: myPosts,
          message: 'My posts retrieved successfully',
        };
      } else {
        result = allPostsResult;
      }
    } else if (activeTab === 'saved') {
      console.log('🔍 Loading Saved Posts for user:', user?.id);

      // ALWAYS use fallback for Saved Posts to ensure it works
      console.log('⚠️ Using fallback to ensure Saved Posts works...');
      const allPostsResult = await missedConnectionsService.getConnections({
        limitCount: 100,
      });
      console.log(
        '📦 All posts fetched:',
        allPostsResult.data?.length || 0,
        'posts'
      );

      if (allPostsResult.success) {
        const savedPosts = allPostsResult.data.filter((post) =>
          post.savedBy?.includes(user?.id || '')
        );
        console.log('✅ Filtered to', savedPosts.length, 'saved posts');
        result = {
          success: true,
          data: savedPosts,
          message: 'Saved posts retrieved successfully',
        };
      } else {
        result = allPostsResult;
      }
    } else {
      result = await missedConnectionsService.getConnections({
        limitCount: 50,
      });
    }

    if (result.success) {
      console.log('✅ Setting connections:', result.data.length, 'posts');
      setConnections(result.data);
      // Animate content
      Animated.parallel([
        Animated.timing(contentSlideAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(contentFadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ]).start();

      if (isRefresh) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } else {
      console.log('❌ Query failed, showing error');
      Alert.alert('Error', result.message);
      setConnections([]);
    }
    setIsLoading(false);
    setIsRefreshing(false);
  };

  const handleCreatePost = () => {
    if (!isAuthenticated) {
      Alert.alert('Sign In Required', 'Please sign in to create a post.');
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setShowCreateModal(true);
  };

  const handleRefresh = () => {
    loadConnections(true);
  };

  const handleSubmitPost = async (data: any) => {
    console.log('📝 Creating post for user:', user?.id);
    console.log('📝 User authenticated:', isAuthenticated);

    const result = await missedConnectionsService.createConnection(data);

    console.log(
      '📝 Post creation result:',
      result.success ? 'Success' : 'Failed'
    );
    console.log('📝 Post ID:', result.connectionId);

    if (result.success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setShowCreateModal(false);

      // Switch to My Posts tab to show the newly created post
      console.log('📝 Switching to My Posts tab');
      setActiveTab('my');

      // Small delay to ensure state update, then reload
      setTimeout(() => {
        console.log('📝 Reloading connections for My Posts tab');
        loadConnections();
      }, 100);
    } else {
      Alert.alert('Error', result.message);
    }
  };

  const handleViewConnection = async (connectionId: string) => {
    if (user?.id) {
      await missedConnectionsService.viewConnection(connectionId, user.id);
      // Update local state immediately for better UX
      setConnections((prevConnections) =>
        prevConnections.map((conn) =>
          conn.id === connectionId
            ? {
                ...conn,
                views:
                  (conn.views || 0) +
                  (conn.viewedBy?.includes(user.id) ? 0 : 1),
                viewedBy: [...(conn.viewedBy || []), user.id],
              }
            : conn
        )
      );
    }
  };

  const handleLike = async (connectionId: string) => {
    if (!isAuthenticated) {
      Alert.alert('Sign In Required', 'Please sign in to like a post.');
      return;
    }

    const connection = connections.find((c) => c.id === connectionId);
    const isCurrentlyLiked = connection?.likedBy?.includes(user?.id || '');

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // Optimistic update - toggle like/unlike immediately
    setConnections((prevConnections) =>
      prevConnections.map((conn) => {
        if (conn.id === connectionId) {
          if (isCurrentlyLiked) {
            // Unlike: remove user from likedBy array and decrement count
            return {
              ...conn,
              likes: Math.max(0, conn.likes - 1),
              likedBy: (conn.likedBy || []).filter((id) => id !== user?.id),
            };
          } else {
            // Like: add user to likedBy array and increment count
            return {
              ...conn,
              likes: conn.likes + 1,
              likedBy: [...(conn.likedBy || []), user?.id || ''],
            };
          }
        }
        return conn;
      })
    );

    const result = await missedConnectionsService.toggleLike(
      connectionId,
      user?.id || ''
    );

    if (!result.success) {
      // Revert optimistic update on error
      Alert.alert('Error', result.message);
      loadConnections();
    }
  };

  const handleComment = async (connectionId: string) => {
    if (!isAuthenticated) {
      Alert.alert('Sign In Required', 'Please sign in to comment.');
      return;
    }

    // Navigate to comments page
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/connections/comments/${connectionId}`);
  };

  const handleSave = async (connectionId: string) => {
    if (!isAuthenticated) {
      Alert.alert('Sign In Required', 'Please sign in to save posts.');
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // Optimistic update
    setConnections((prevConnections) =>
      prevConnections.map((conn) => {
        if (conn.id === connectionId) {
          const isSaved = conn.savedBy?.includes(user?.id || '');
          return {
            ...conn,
            savedBy: isSaved
              ? (conn.savedBy || []).filter((id) => id !== user?.id)
              : [...(conn.savedBy || []), user?.id || ''],
          };
        }
        return conn;
      })
    );

    const result = await missedConnectionsService.toggleSave(
      connectionId,
      user?.id || ''
    );

    if (!result.success) {
      Alert.alert('Error', result.message);
      loadConnections();
    }
  };

  const handleEdit = (connection: MissedConnection) => {
    setEditingConnection(connection);
    setShowEditModal(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const handleDelete = async (connectionId: string) => {
    Alert.alert(
      'Delete Post',
      'Are you sure you want to delete this post? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            const result = await missedConnectionsService.deleteConnection(
              connectionId
            );
            if (result.success) {
              Haptics.notificationAsync(
                Haptics.NotificationFeedbackType.Success
              );
              loadConnections();
            } else {
              Alert.alert('Error', result.message);
            }
          },
        },
      ]
    );
  };

  const handleUpdatePost = async (data: any) => {
    if (!editingConnection) return;

    const result = await missedConnectionsService.updateConnection(
      editingConnection.id,
      data
    );

    if (result.success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setShowEditModal(false);
      setEditingConnection(null);
      loadConnections();
    } else {
      Alert.alert('Error', result.message);
    }
  };

  const handleClaim = async (connectionId: string) => {
    if (!isAuthenticated) {
      Alert.alert('Sign In Required', 'Please sign in to claim a connection.');
      return;
    }

    Alert.alert("That's You?", 'Were you at this location?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Yes, verify',
        onPress: async () => {
          const result = await missedConnectionsService.claimConnection(
            connectionId
          );
          if (result.success) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            Alert.alert('Success!', 'Your claim has been submitted!');
            loadConnections();
          } else {
            Alert.alert('Error', result.message);
          }
        },
      },
    ]);
  };

  const renderEmptyState = () => (
    <Animated.View
      style={[
        styles.emptyState,
        {
          opacity: emptyFadeAnim,
          transform: [{ translateY: emptyTextAnim }],
        },
      ]}
    >
      <Animated.View
        style={[
          styles.emptyIconWrapper,
          { transform: [{ scale: emptyIconAnim }] },
        ]}
      >
        <View
          style={[
            styles.emptyIconBackground,
            { backgroundColor: `${theme.primary}15` },
          ]}
        >
          <Sparkles size={48} color={theme.primary} />
        </View>
      </Animated.View>
      <Text style={[styles.emptyTitle, { color: theme.text }]}>
        No Missed Connections Yet
      </Text>
      <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
        See someone interesting? Had a moment?{'\n'}
        Share your story and maybe they'll find you!
      </Text>
      <TouchableOpacity
        style={[styles.emptyButton, { backgroundColor: theme.primary }]}
        onPress={handleCreatePost}
      >
        <Plus size={18} color="#FFF" />
        <Text style={styles.emptyButtonText}>Create Your First Post</Text>
      </TouchableOpacity>
    </Animated.View>
  );

  useEffect(() => {
    if (connections.length === 0 && !isLoading) {
      Animated.sequence([
        Animated.timing(emptyFadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.parallel([
          Animated.spring(emptyIconAnim, {
            toValue: 1,
            tension: 50,
            friction: 7,
            useNativeDriver: true,
          }),
          Animated.timing(emptyTextAnim, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
          }),
        ]),
      ]).start();
    }
  }, [connections.length, isLoading]);

  return (
    <LinearGradient
      colors={[theme.background, theme.surfaceVariant]}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <Animated.View
          style={[
            styles.headerContainer,
            {
              transform: [{ translateY: headerSlideAnim }],
              opacity: headerFadeAnim,
            },
          ]}
        >
          {/* Title and Action Buttons in Same Row */}
          <View style={styles.titleActionRow}>
            <Text style={[styles.title, { color: theme.text }]}>
              Board ({connections.length})
            </Text>

            <View style={styles.headerIcons}>
              <TouchableOpacity
                style={[
                  styles.iconButton,
                  {
                    backgroundColor: theme.surface,
                    borderColor: theme.border,
                  },
                ]}
                onPress={handleRefresh}
                disabled={isRefreshing}
              >
                <Animated.View
                  style={{
                    transform: [
                      {
                        rotate: isRefreshing
                          ? headerSlideAnim.interpolate({
                              inputRange: [-50, 0],
                              outputRange: ['0deg', '360deg'],
                            })
                          : '0deg',
                      },
                    ],
                  }}
                >
                  <RefreshCw size={20} color={theme.primary} />
                </Animated.View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.iconButton,
                  {
                    backgroundColor: theme.surface,
                    borderColor: theme.border,
                  },
                ]}
                onPress={handleCreatePost}
              >
                <Plus size={20} color={theme.primary} />
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>

        {/* Content */}
        <Animated.View
          style={[
            styles.content,
            {
              backgroundColor: theme.surface,
              transform: [{ translateY: contentSlideAnim }],
              opacity: contentFadeAnim,
            },
          ]}
        >
          {/* Tabs */}
          <View style={styles.tabsContainer}>
            <TouchableOpacity
              style={[
                styles.tab,
                activeTab === 'all' && [
                  styles.activeTab,
                  { borderBottomColor: theme.primary },
                ],
              ]}
              onPress={() => setActiveTab('all')}
            >
              <Text
                style={[
                  styles.tabText,
                  {
                    color:
                      activeTab === 'all' ? theme.primary : theme.textSecondary,
                  },
                ]}
              >
                All Posts
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.tab,
                activeTab === 'my' && [
                  styles.activeTab,
                  { borderBottomColor: theme.primary },
                ],
              ]}
              onPress={() => setActiveTab('my')}
            >
              <Text
                style={[
                  styles.tabText,
                  {
                    color:
                      activeTab === 'my' ? theme.primary : theme.textSecondary,
                  },
                ]}
              >
                My Posts
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.tab,
                activeTab === 'saved' && [
                  styles.activeTab,
                  { borderBottomColor: theme.primary },
                ],
              ]}
              onPress={() => setActiveTab('saved')}
            >
              <Text
                style={[
                  styles.tabText,
                  {
                    color:
                      activeTab === 'saved'
                        ? theme.primary
                        : theme.textSecondary,
                  },
                ]}
              >
                Saved
              </Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={connections}
            renderItem={({ item: connection, index }) => (
              <MemoizedConnectionItem
                connection={connection}
                theme={theme}
                index={index}
                onPress={() => handleViewConnection(connection.id)}
                onLike={() => handleLike(connection.id)}
                onClaim={() => handleClaim(connection.id)}
                onComment={() => handleComment(connection.id)}
                onEdit={() => handleEdit(connection)}
                onDelete={() => handleDelete(connection.id)}
                onSave={() => handleSave(connection.id)}
                isLiked={connection.likedBy?.includes(user?.id || '') || false}
                isSaved={connection.savedBy?.includes(user?.id || '') || false}
                currentUserId={user?.id}
              />
            )}
            keyExtractor={(item) => item.id}
            extraData={theme}
            ListEmptyComponent={renderEmptyState()}
            style={styles.connectionList}
            showsVerticalScrollIndicator={false}
            removeClippedSubviews={true}
            maxToRenderPerBatch={5}
            updateCellsBatchingPeriod={50}
            initialNumToRender={5}
            windowSize={5}
            getItemLayout={(data, index) => ({
              length: 200,
              offset: 200 * index,
              index,
            })}
          />
        </Animated.View>
      </SafeAreaView>

      {/* Create Modal */}
      <CreateConnectionModal
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleSubmitPost}
        theme={theme}
      />

      {/* Edit Modal */}
      {editingConnection && (
        <EditConnectionModal
          visible={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setEditingConnection(null);
          }}
          onSubmit={handleUpdatePost}
          connection={editingConnection}
          theme={theme}
        />
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    paddingTop: 20,
  },
  headerContainer: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    gap: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    flex: 1,
  },
  titleActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerIcons: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  content: {
    flex: 1,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingTop: 20,
  },
  connectionList: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 100,
    marginBottom: 55,
  },
  connectionItem: {
    flexDirection: 'row',
    paddingVertical: 16,
    paddingHorizontal: 12,
    paddingLeft: 0,
    borderWidth: 1,
    borderRadius: 16,
    marginVertical: 6,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'visible',
  },
  accentBar: {
    width: 4,
    borderTopRightRadius: 2,
    borderBottomRightRadius: 2,
    marginRight: 8,
  },
  connectionContent: {
    flex: 1,
    paddingRight: 4,
    overflow: 'visible',
  },
  userSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 10,
  },
  avatarContainer: {
    position: 'relative',
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  userInfo: {
    flex: 1,
    gap: 3,
  },
  userName: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexWrap: 'wrap',
    maxWidth: '70%',
  },
  locationIconSmall: {
    fontSize: 14,
  },
  locationNameSmall: {
    fontSize: 12,
    fontWeight: '500',
    flexShrink: 1,
  },
  rightColumn: {
    alignItems: 'flex-end',
    gap: 4,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  timeTextSmall: {
    fontSize: 10,
    fontWeight: '500',
  },
  hotBadgeTop: {
    position: 'absolute',
    top: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  hotBadge: {
    position: 'absolute',
    bottom: -5,
    right: -8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#2C2C2E',
  },
  hotBadgeInline: {
    flexDirection: 'row',
    alignItems: 'end',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  hotBadgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '700',
  },
  descriptionText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 10,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
    position: 'relative',
    zIndex: 1,
  },
  actionsLTR: {
    direction: 'ltr',
  },
  actionsRTL: {
    direction: 'rtl',
  },
  popularityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 12,
    fontWeight: '600',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  actionText: {
    fontSize: 13,
    fontWeight: '600',
  },
  claimButton: {
    marginLeft: 'auto',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  claimButtonText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '700',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyIconWrapper: {
    marginBottom: 24,
  },
  emptyIconBackground: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  emptyButtonText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  modalBody: {
    padding: 20,
  },
  formGroup: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  detectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 12,
    gap: 8,
  },
  detectButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  detectedLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    gap: 8,
  },
  detectedIcon: {
    fontSize: 24,
  },
  detectedName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
  },
  descriptionInput: {
    borderRadius: 12,
    padding: 12,
    minHeight: 100,
    fontSize: 15,
  },
  charCount: {
    textAlign: 'right',
    fontSize: 12,
    marginTop: 4,
  },
  emojiRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  emojiButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emojiText: {
    fontSize: 24,
  },
  tagInputContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  tagInput: {
    flex: 1,
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
  },
  addTagButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  tagText: {
    fontSize: 13,
    fontWeight: '600',
  },
  helperText: {
    fontSize: 12,
    marginTop: 6,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  tagSmall: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  tagSmallText: {
    fontSize: 11,
    fontWeight: '600',
  },
  moreTagsText: {
    fontSize: 11,
    fontWeight: '600',
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  submitButton: {
    margin: 20,
    marginTop: 0,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  disabledButton: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  optionsMenuContainer: {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 10,
  },
  optionsMenuInline: {
    position: 'relative',
    zIndex: 999,
  },
  optionsButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  optionsMenu: {
    position: 'absolute',
    bottom: 45,
    right: -10,
    minWidth: 140,
    borderRadius: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 10,
    overflow: 'hidden',
    zIndex: 9999,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  optionText: {
    fontSize: 14,
    fontWeight: '600',
  },
  optionDivider: {
    height: 1,
  },
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
  },
  toggleLabel: {
    flex: 1,
  },
  toggleSwitch: {
    width: 52,
    height: 30,
    borderRadius: 15,
    padding: 2,
    justifyContent: 'center',
  },
  toggleThumb: {
    width: 26,
    height: 26,
    borderRadius: 13,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  toggleThumbActive: {
    alignSelf: 'flex-end',
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginTop: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomWidth: 2,
  },
  tabText: {
    fontSize: 15,
    fontWeight: '600',
  },
});
