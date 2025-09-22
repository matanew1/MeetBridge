import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Image, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowDown, MessageCircle, Heart } from 'lucide-react-native';

const InterestTag = ({ title, emoji }: { title: string; emoji: string }) => (
  <View style={styles.interestTag}>
    <Text style={styles.interestEmoji}>{emoji}</Text>
    <Text style={styles.interestText}>{title}</Text>
  </View>
);

const SocialIcon = ({ platform }: { platform: string }) => (
  <TouchableOpacity style={styles.socialButton}>
    <Text style={styles.socialText}>{platform}</Text>
  </TouchableOpacity>
);

export default function ProfileScreen() {
  const interests = [
    { title: 'אמפתיים', emoji: '👥' },
    { title: 'בעלי חיים', emoji: '🐕' },
    { title: 'פיצה', emoji: '🍕' },
    { title: 'כדורגל', emoji: '⚽' },
    { title: 'קריאה', emoji: '📖' },
    { title: 'נסיעות', emoji: '✈️' },
  ];

  return (
    <LinearGradient colors={['#FF6B9D', '#C44FAF', '#8E44AD']} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity>
            <ArrowDown size={24} color="#FFF" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.profileCard}>
            <Image 
              source={{ uri: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=400' }}
              style={styles.profileImage}
            />
            
            <View style={styles.distanceContainer}>
              <Text style={styles.distanceText}>n25</Text>
            </View>

            <View style={styles.profileInfo}>
              <View style={styles.profileHeader}>
                <Text style={styles.profileAge}>26</Text>
                <Text style={styles.profileName}>דנה,</Text>
              </View>

              <Text style={styles.profileLocation}>אורטה</Text>
              <Text style={styles.profileDescription}>
                אני אוהבת חיות וטיולי
              </Text>
              <Text style={styles.profileInterestsTitle}>תחומי עניין</Text>

              <View style={styles.interestsGrid}>
                {interests.map((interest, index) => (
                  <InterestTag key={index} title={interest.title} emoji={interest.emoji} />
                ))}
              </View>

              <View style={styles.socialSection}>
                <Text style={styles.socialTitle}>רשתות חברתיות</Text>
                <View style={styles.socialButtons}>
                  <SocialIcon platform="TikTok" />
                  <SocialIcon platform="Instagram" />
                  <SocialIcon platform="Facebook" />
                </View>
              </View>
            </View>
          </View>
        </ScrollView>

        <View style={styles.bottomActions}>
          <TouchableOpacity style={styles.actionButton}>
            <ArrowDown size={24} color="#FFF" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.messageButton}>
            <MessageCircle size={24} color="#FFF" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.likeButton}>
            <Heart size={24} color="#FFF" fill="#FFF" />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
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
  header: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  content: {
    flex: 1,
  },
  profileCard: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: 20,
    overflow: 'hidden',
    minHeight: '100%',
  },
  profileImage: {
    width: '100%',
    height: 300,
    resizeMode: 'cover',
  },
  distanceContainer: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: 'rgba(139, 69, 167, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  distanceText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  profileInfo: {
    padding: 24,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 4,
  },
  profileAge: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    marginRight: 8,
  },
  profileName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
  },
  profileLocation: {
    fontSize: 18,
    color: '#666',
    marginBottom: 8,
  },
  profileDescription: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
    lineHeight: 22,
  },
  profileInterestsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  interestsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 32,
  },
  interestTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  interestEmoji: {
    fontSize: 16,
  },
  interestText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  socialSection: {
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
    paddingTop: 24,
  },
  socialTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  socialButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  socialButton: {
    backgroundColor: '#333',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  socialText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '500',
  },
  bottomActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingBottom: 40,
    paddingTop: 20,
  },
  actionButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageButton: {
    backgroundColor: '#8E44AD',
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  likeButton: {
    backgroundColor: '#E91E63',
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
});