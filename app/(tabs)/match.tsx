import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export default function MatchScreen() {
  return (
    <LinearGradient colors={['#4A148C', '#7B1FA2', '#8E24AA']} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          <View style={styles.matchContainer}>
            <View style={styles.profileImageContainer}>
              <Image 
                source={{ uri: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=300' }}
                style={styles.profileImage}
              />
            </View>
            
            <View style={styles.matchInfo}>
              <Text style={styles.matchAge}>26</Text>
              <Text style={styles.matchName}>, דנה</Text>
            </View>
            
            <Text style={styles.matchSubtitle}>איפכת את הקריצה שלך</Text>
          </View>
          
          <View style={styles.chatPreview}>
            <LinearGradient 
              colors={['#4FC3F7', '#29B6F6']} 
              style={styles.chatButton}
            >
              <Text style={styles.chatButtonText}>פתח צ'ט</Text>
            </LinearGradient>
          </View>
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
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  matchContainer: {
    alignItems: 'center',
    marginBottom: 60,
  },
  profileImageContainer: {
    width: 200,
    height: 200,
    borderRadius: 100,
    overflow: 'hidden',
    borderWidth: 4,
    borderColor: '#FFF',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    marginBottom: 32,
  },
  profileImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  matchInfo: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 12,
  },
  matchAge: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FFF',
    marginRight: 8,
  },
  matchName: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FFF',
  },
  matchSubtitle: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginBottom: 8,
  },
  chatPreview: {
    width: '100%',
    maxWidth: 280,
  },
  chatButton: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 28,
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  chatButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '600',
  },
});