import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Dimensions,
  ScrollView,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Search,
  Heart,
  MessageCircle,
  Users,
  MapPin,
  Sparkles,
  ArrowRight,
  X,
} from 'lucide-react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { lightTheme, darkTheme } from '../../constants/theme';

interface OnboardingTutorialProps {
  visible: boolean;
  onComplete: () => void;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface TutorialStep {
  icon: React.ReactNode;
  title: string;
  description: string;
  gradient: [string, string];
}

export const OnboardingTutorial: React.FC<OnboardingTutorialProps> = ({
  visible,
  onComplete,
}) => {
  const { isDarkMode } = useTheme();
  const theme = isDarkMode ? darkTheme : lightTheme;
  const [currentStep, setCurrentStep] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const tutorialSteps: TutorialStep[] = [
    {
      icon: <Sparkles size={60} color="#fff" />,
      title: 'Welcome to MeetBridge! 🎉',
      description:
        'Find meaningful connections with people nearby. Let us show you how it works!',
      gradient: ['#667eea', '#764ba2'],
    },
    {
      icon: <Search size={60} color="#fff" />,
      title: 'Discover Matches',
      description:
        "Browse through profiles of people near you. Use filters to find exactly who you're looking for.",
      gradient: ['#f093fb', '#f5576c'],
    },
    {
      icon: <Heart size={60} color="#fff" />,
      title: 'Like & Connect',
      description:
        "Like profiles that interest you. When they like you back, it's a match! Your matches appear in the Loved tab.",
      gradient: ['#4facfe', '#00f2fe'],
    },
    {
      icon: <MessageCircle size={60} color="#fff" />,
      title: 'Start Chatting',
      description:
        'Once matched, start a conversation! Send messages, share your interests, and get to know each other.',
      gradient: ['#43e97b', '#38f9d7'],
    },
    {
      icon: <MapPin size={60} color="#fff" />,
      title: 'Location-Based',
      description:
        'We use your location to show you people nearby. You can adjust the distance in your preferences.',
      gradient: ['#fa709a', '#fee140'],
    },
    {
      icon: <Users size={60} color="#fff" />,
      title: 'Manage Connections',
      description:
        'View all your connections, see who liked you, and keep track of your conversations in one place.',
      gradient: ['#30cfd0', '#330867'],
    },
  ];

  const handleNext = () => {
    if (currentStep < tutorialSteps.length - 1) {
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  const step = tutorialSteps[currentStep];

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={false}
      statusBarTranslucent
    >
      <LinearGradient
        colors={step.gradient}
        style={styles.container}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {/* Skip Button */}
        <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
          <X size={24} color="#fff" />
        </TouchableOpacity>

        {/* Content */}
        <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
          <View style={styles.iconContainer}>{step.icon}</View>

          <Text style={styles.title}>{step.title}</Text>
          <Text style={styles.description}>{step.description}</Text>

          {/* Progress Dots */}
          <View style={styles.dotsContainer}>
            {tutorialSteps.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.dot,
                  index === currentStep && styles.activeDot,
                  index < currentStep && styles.completedDot,
                ]}
              />
            ))}
          </View>

          {/* Next Button */}
          <TouchableOpacity
            style={styles.nextButton}
            onPress={handleNext}
            activeOpacity={0.8}
          >
            <Text style={styles.nextButtonText}>
              {currentStep === tutorialSteps.length - 1
                ? 'Get Started'
                : 'Next'}
            </Text>
            <ArrowRight size={20} color="#fff" style={styles.nextIcon} />
          </TouchableOpacity>

          {/* Step Counter */}
          <Text style={styles.stepCounter}>
            {currentStep + 1} of {tutorialSteps.length}
          </Text>
        </Animated.View>
      </LinearGradient>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  skipButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    padding: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  content: {
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  iconContainer: {
    marginBottom: 40,
    padding: 30,
    borderRadius: 100,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 40,
    opacity: 0.95,
  },
  dotsContainer: {
    flexDirection: 'row',
    marginBottom: 40,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    marginHorizontal: 4,
  },
  activeDot: {
    width: 24,
    backgroundColor: '#fff',
  },
  completedDot: {
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 30,
    minWidth: 200,
    borderWidth: 2,
    borderColor: '#fff',
  },
  nextButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginRight: 8,
  },
  nextIcon: {
    marginTop: 2,
  },
  stepCounter: {
    marginTop: 20,
    fontSize: 14,
    color: '#fff',
    opacity: 0.8,
  },
});

export default OnboardingTutorial;
