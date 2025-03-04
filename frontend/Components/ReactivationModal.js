import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ActivityIndicator,
  Keyboard,
  Animated,
} from 'react-native';
import { verifyReactivationOTP } from '../API/user_api';
import Toast from 'react-native-toast-message';
import { LinearGradient } from 'expo-linear-gradient';

const ReactivationModal = ({ visible, onClose, email }) => {
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [focusedInput, setFocusedInput] = useState(null);
  
  const otpInputs = useRef([]);
  const animatedValues = useRef(otpDigits.map(() => new Animated.Value(0)));
  const scaleAnimations = useRef(otpDigits.map(() => new Animated.Value(1)));

  const showToast = (message, type) => {
    const backgroundColors = {
      success: '#1B5E20',
      error: '#D32F2F',
      info: '#1B5E20',
    };

    Toast.show({
      type: type,
      position: 'top',
      text1: message,
      visibilityTime: type === 'info' ? 10000 : 2000,
      autoHide: type !== 'info',
      topOffset: 60,
      props: {
        style: {
          backgroundColor: backgroundColors[type],
          borderRadius: 8,
          padding: 16,
        },
        text1Style: {
          fontSize: 16,
          fontWeight: 'bold',
          color: '#ffffff',
        },
      },
    });
  };

  const handleVerifyOtp = async () => {
    setError('');
    setIsLoading(true);
    showToast('Verifying OTP... ⏳', 'info');

    const otpString = otpDigits.join('');
    
    try {
      const response = await verifyReactivationOTP({ email, otp: otpString });
      console.log('OTP verification success:', response);
      Toast.hide();
      showToast('Account reactivated successfully! 🎉', 'success');
      onClose();
    } catch (err) {
      console.log('OTP verification error:', err);
      const errorMessage =
        typeof err === 'object' && err.msg
          ? err.msg
          : 'Invalid OTP. Please try again.';
      setError(errorMessage);
      Toast.hide();
      showToast(errorMessage, 'error');
      setIsLoading(false);
    }
  };

  const handleOtpChange = (value, index) => {
    const newOtpDigits = [...otpDigits];
    
    newOtpDigits[index] = value.slice(0, 1);
    setOtpDigits(newOtpDigits);
    
    if (value) {
      Animated.sequence([
        Animated.timing(scaleAnimations.current[index], {
          toValue: 1.1,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnimations.current[index], {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start();
      
      if (index < otpDigits.length - 1) {
        otpInputs.current[index + 1].focus();
      } else {
        Keyboard.dismiss();
      }
    }
  };

  const handleKeyPress = (event, index) => {
    if (event.nativeEvent.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpInputs.current[index - 1].focus();
    }
  };

  const handleFocus = (index) => {
    setFocusedInput(index);
    Animated.timing(animatedValues.current[index], {
      toValue: 1,
      duration: 200,
      useNativeDriver: false,
    }).start();
  };

  const handleBlur = (index) => {
    setFocusedInput(null);
    Animated.timing(animatedValues.current[index], {
      toValue: 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  };

  useEffect(() => {
    if (visible && otpInputs.current[0]) {
      setTimeout(() => {
        otpInputs.current[0].focus();
      }, 100);
    }
  }, [visible]);

  const isOtpComplete = otpDigits.every(digit => digit !== '');

  return (
    <Modal visible={visible} transparent={true} animationType="slide">
      <LinearGradient 
        colors={['rgba(0, 0, 0, 0.8)', 'rgba(0, 0, 0, 0.6)']} 
        style={styles.modalContainer}
      >
        <View style={styles.modalContent}>
          <Text style={styles.header}>Account Verification</Text>
          
          <View style={styles.iconContainer}>
            <View style={styles.iconCircle}>
              <Text style={styles.iconText}>🔐</Text>
            </View>
          </View>
          
          <Text style={styles.infoText}>
            Your account was disabled. Enter the verification code sent to your email to reactivate.
          </Text>
          
          <Text style={styles.otpLabel}>Verification Code</Text>
          <View style={styles.otpContainer}>
            {otpDigits.map((digit, index) => {
              const inputBorderColor = animatedValues.current[index].interpolate({
                inputRange: [0, 1],
                outputRange: ['#4189E5', '#8EBBFF']
              });

              return (
                <Animated.View 
                  key={index} 
                  style={[
                    styles.otpInputContainer,
                    {
                      transform: [{ scale: scaleAnimations.current[index] }],
                    }
                  ]}
                >
                  <Animated.View 
                    style={[
                      styles.otpInputBorder,
                      { borderColor: inputBorderColor }
                    ]}
                  >
                    <TextInput
                      ref={ref => otpInputs.current[index] = ref}
                      style={[
                        styles.otpInput,
                        digit && styles.otpInputFilled
                      ]}
                      value={digit}
                      onChangeText={(value) => handleOtpChange(value, index)}
                      onKeyPress={(e) => handleKeyPress(e, index)}
                      onFocus={() => handleFocus(index)}
                      onBlur={() => handleBlur(index)}
                      keyboardType="numeric"
                      maxLength={1}
                      selectTextOnFocus
                      selectionColor="#8EBBFF"
                    />
                  </Animated.View>
                </Animated.View>
              );
            })}
          </View>
          
          {error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.error}>{error}</Text>
            </View>
          ) : null}
          
          <TouchableOpacity
            style={[
              styles.button,
              isOtpComplete ? styles.buttonActive : styles.buttonInactive
            ]}
            onPress={handleVerifyOtp}
            disabled={isLoading || !isOtpComplete}
            activeOpacity={0.7}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Text style={styles.buttonText}>
                VERIFY ACCOUNT
              </Text>
            )}
          </TouchableOpacity>
          
          <TouchableOpacity 
            onPress={onClose}
            style={styles.closeButton}
            activeOpacity={0.6}
          >
            <Text style={styles.closeText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
      <Toast />
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContent: {
    width: '50%',
    backgroundColor: '#1E2A3A',
    padding: 30,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  header: {
    fontSize: 26,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 16,
    textAlign: 'center',
  },
  iconContainer: {
    marginVertical: 20,
  },
  iconCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(65, 137, 229, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconText: {
    fontSize: 32,
  },
  infoText: {
    color: '#BCC5D0',
    fontSize: 15,
    marginBottom: 30,
    textAlign: 'center',
    lineHeight: 22,
  },
  otpLabel: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    alignSelf: 'flex-start',
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 30,
  },
  otpInputContainer: {
    width: '14%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  otpInputBorder: {
    width: '100%',
    height: '100%',
    borderWidth: 2,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  otpInput: {
    width: '100%',
    height: '100%',
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    color: '#FFFFFF',
    backgroundColor: 'rgba(65, 137, 229, 0.1)',
  },
  otpInputFilled: {
    backgroundColor: 'rgba(65, 137, 229, 0.2)',
  },
  errorContainer: {
    backgroundColor: 'rgba(231, 76, 60, 0.1)',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    marginBottom: 20,
    width: '100%',
  },
  error: {
    color: '#e74c3c',
    textAlign: 'center',
    fontSize: 14,
  },
  button: {
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: 'center',
    width: '100%',
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
  },
  buttonActive: {
    backgroundColor: '#4189E5',
  },
  buttonInactive: {
    backgroundColor: 'rgba(127, 140, 141, 0.6)',
  },
  buttonText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 16,
    letterSpacing: 0.5,
  },
  closeButton: {
    paddingVertical: 10,
    paddingHorizontal: 15,
  },
  closeText: {
    color: '#BCC5D0',
    fontSize: 15,
    fontWeight: '600',
  },
});

export default ReactivationModal;
