// app/components/VoiceMessageRecorder.tsx
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Modal,
  Platform,
} from 'react-native';
import { Audio } from 'expo-audio';
import { Mic, X, Send, Trash2 } from 'lucide-react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { lightTheme, darkTheme } from '../../constants/theme';
import toastService from '../../services/toastService';

export interface VoiceMessageRecorderProps {
  visible: boolean;
  onClose: () => void;
  onSend: (audioUri: string, duration: number) => void;
}

export const VoiceMessageRecorder: React.FC<VoiceMessageRecorderProps> = ({
  visible,
  onClose,
  onSend,
}) => {
  const { isDarkMode } = useTheme();
  const theme = isDarkMode ? darkTheme : lightTheme;

  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [audioUri, setAudioUri] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [sound, setSound] = useState<Audio.Sound | null>(null);

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isRecording) {
      // Start pulse animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.3,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Start duration counter
      durationIntervalRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } else {
      pulseAnim.setValue(1);
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
    }

    return () => {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
    };
  }, [isRecording]);

  useEffect(() => {
    if (visible) {
      startRecording();
    } else {
      cleanup();
    }

    return () => {
      cleanup();
    };
  }, [visible]);

  const cleanup = async () => {
    try {
      if (recording) {
        try {
          await recording.stopAndUnloadAsync();
        } catch (error) {
          console.error('Error stopping recording:', error);
        }
      }
      if (sound) {
        try {
          await sound.unloadAsync();
        } catch (error) {
          console.error('Error unloading sound:', error);
        }
      }
    } catch (error) {
      console.error('Error during cleanup:', error);
    } finally {
      setRecording(null);
      setIsRecording(false);
      setRecordingDuration(0);
      setAudioUri(null);
      setSound(null);
      setIsPlaying(false);
    }
  };

  const startRecording = async () => {
    try {
      // Voice recording is not supported on web
      if (Platform.OS === 'web') {
        toastService.show(
          'Voice messages are not supported on web. Please use the mobile app.',
          'error'
        );
        onClose();
        return;
      }

      // Check if Audio module is available
      if (!Audio || typeof Audio.requestPermissionsAsync !== 'function') {
        console.error('Audio module is not available');
        toastService.show(
          'Voice recording is not available on this platform',
          'error'
        );
        onClose();
        return;
      }

      console.log('🎤 Requesting permissions...');
      const permission = await Audio.requestPermissionsAsync();

      if (permission.status !== 'granted') {
        toastService.show('Microphone permission is required', 'error');
        onClose();
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      console.log('🎤 Starting recording...');
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      setRecording(recording);
      setIsRecording(true);
      setRecordingDuration(0);
      console.log('🎤 Recording started');
    } catch (error) {
      console.error('Failed to start recording:', error);
      toastService.show('Failed to start recording', 'error');
      onClose();
    }
  };

  const stopRecording = async () => {
    console.log('🎤 Stopping recording...');
    if (!recording) return;

    try {
      setIsRecording(false);
      await recording.stopAndUnloadAsync();

      // Check if Audio module is available before calling setAudioModeAsync
      if (Audio && typeof Audio.setAudioModeAsync === 'function') {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
        });
      }

      const uri = recording.getURI();
      console.log('🎤 Recording stopped. URI:', uri);
      setAudioUri(uri);
      setRecording(null);
    } catch (error) {
      console.error('Failed to stop recording:', error);
      toastService.show('Failed to stop recording', 'error');
    }
  };

  const playRecording = async () => {
    if (!audioUri) return;

    try {
      if (isPlaying && sound) {
        await sound.stopAsync();
        setIsPlaying(false);
        return;
      }

      // Check if Audio module is available
      if (!Audio || typeof Audio.Sound?.createAsync !== 'function') {
        console.error('Audio.Sound module is not available');
        toastService.show('Audio playback is not available', 'error');
        return;
      }

      console.log('🔊 Playing recording...');
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: audioUri },
        { shouldPlay: true }
      );

      setSound(newSound);
      setIsPlaying(true);

      newSound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          setIsPlaying(false);
        }
      });
    } catch (error) {
      console.error('Failed to play recording:', error);
      toastService.show('Failed to play recording', 'error');
    }
  };

  const handleSend = () => {
    if (audioUri && recordingDuration > 0) {
      onSend(audioUri, recordingDuration);
      cleanup();
      onClose();
    }
  };

  const handleCancel = () => {
    cleanup();
    onClose();
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleCancel}
    >
      <View style={styles.overlay}>
        <View style={[styles.container, { backgroundColor: theme.surface }]}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: theme.text }]}>
              {isRecording ? 'Recording...' : 'Voice Message'}
            </Text>
            <TouchableOpacity onPress={handleCancel}>
              <X size={24} color={theme.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.content}>
            <Animated.View
              style={[
                styles.micContainer,
                {
                  backgroundColor: isRecording
                    ? theme.error + '20'
                    : theme.primary + '20',
                  transform: [{ scale: pulseAnim }],
                },
              ]}
            >
              <Mic
                size={48}
                color={isRecording ? theme.error : theme.primary}
              />
            </Animated.View>

            <Text style={[styles.duration, { color: theme.text }]}>
              {formatDuration(recordingDuration)}
            </Text>

            {isRecording && (
              <Text style={[styles.hint, { color: theme.textSecondary }]}>
                Tap to stop recording
              </Text>
            )}

            {!isRecording && audioUri && (
              <Text style={[styles.hint, { color: theme.textSecondary }]}>
                Tap play to preview your message
              </Text>
            )}
          </View>

          <View style={styles.actions}>
            {isRecording ? (
              <TouchableOpacity
                style={[styles.button, { backgroundColor: theme.error }]}
                onPress={stopRecording}
              >
                <Text style={styles.buttonText}>Stop Recording</Text>
              </TouchableOpacity>
            ) : audioUri ? (
              <>
                <TouchableOpacity
                  style={[
                    styles.button,
                    styles.secondaryButton,
                    { borderColor: theme.border },
                  ]}
                  onPress={playRecording}
                >
                  <Text
                    style={[styles.secondaryButtonText, { color: theme.text }]}
                  >
                    {isPlaying ? 'Stop' : 'Play'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, { backgroundColor: theme.success }]}
                  onPress={handleSend}
                >
                  <Send size={20} color="#FFF" style={{ marginRight: 8 }} />
                  <Text style={styles.buttonText}>Send</Text>
                </TouchableOpacity>
              </>
            ) : null}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 24,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  content: {
    padding: 40,
    alignItems: 'center',
  },
  micContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  duration: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 8,
  },
  hint: {
    fontSize: 14,
    textAlign: 'center',
  },
  actions: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default VoiceMessageRecorder;
