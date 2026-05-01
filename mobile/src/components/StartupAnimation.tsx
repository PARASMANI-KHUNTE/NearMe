import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { theme } from '../theme';

interface StartupAnimationProps {
  onFinish: () => void;
}

const StartupAnimation: React.FC<StartupAnimationProps> = ({ onFinish }) => {
  const scale = useRef(new Animated.Value(0.75)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const glow = useRef(new Animated.Value(0)).current;
  const hasFinishedRef = useRef(false);

  useEffect(() => {
    const finishSafely = () => {
      if (hasFinishedRef.current) {
        return;
      }
      hasFinishedRef.current = true;
      onFinish();
    };

    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(glow, {
          toValue: 1,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(glow, {
          toValue: 0.4,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );

    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 500,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        friction: 7,
        tension: 55,
        useNativeDriver: true,
      }),
    ]).start(() => pulse.start());

    const finishTimer = setTimeout(() => {
      pulse.stop();
      Animated.timing(opacity, {
        toValue: 0,
        duration: 280,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }).start(() => finishSafely());
    }, 1800);

    // Hard fallback: never allow startup screen to block app boot.
    const hardFallbackTimer = setTimeout(() => {
      console.log('[Startup] Hard fallback triggered');
      finishSafely();
    }, 2000);

    return () => {
      clearTimeout(finishTimer);
      clearTimeout(hardFallbackTimer);
      pulse.stop();
    };
  }, [glow, onFinish, opacity, scale]);

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.logoWrap,
          {
            opacity,
            transform: [{ scale }],
          },
        ]}
      >
        <Animated.View
          style={[
            styles.glow,
            {
              opacity: glow,
              transform: [
                {
                  scale: glow.interpolate({
                    inputRange: [0, 1],
                    outputRange: [1, 1.12],
                  }),
                },
              ],
            },
          ]}
        />
        <Text style={styles.logoN}>N</Text>
      </Animated.View>

      <Animated.Text style={[styles.title, { opacity }]}>NearMe</Animated.Text>
      <Animated.Text style={[styles.subtitle, { opacity }]}>Privacy-First Proximity</Animated.Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoWrap: {
    width: 108,
    height: 108,
    borderRadius: 26,
    backgroundColor: 'rgba(79, 70, 229, 0.16)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.4)',
    overflow: 'visible',
  },
  glow: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 30,
    backgroundColor: 'rgba(56, 189, 248, 0.22)',
  },
  logoN: {
    fontSize: 54,
    fontWeight: '800',
    color: theme.colors.text,
  },
  title: {
    fontSize: 34,
    fontWeight: '800',
    color: theme.colors.text,
    letterSpacing: 0.6,
  },
  subtitle: {
    marginTop: theme.spacing.sm,
    fontSize: 14,
    color: theme.colors.accent,
    opacity: 0.9,
    letterSpacing: 0.5,
  },
});

export default StartupAnimation;
