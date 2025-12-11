import React, { useRef } from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SPACING, FONTS, LAYOUT, GRADIENTS, SHADOWS } from '../theme';

export default function Button({ title, onPress, variant = 'primary', loading = false, disabled = false, style, icon }) {
    const scaleAnim = useRef(new Animated.Value(1)).current;

    const handlePressIn = () => {
        Animated.spring(scaleAnim, {
            toValue: 0.95,
            useNativeDriver: true,
        }).start();
    };

    const handlePressOut = () => {
        Animated.spring(scaleAnim, {
            toValue: 1,
            useNativeDriver: true,
        }).start();
    };

    const getGradientColors = () => {
        if (disabled) return [COLORS.surfaceLight, COLORS.surfaceLight];
        switch (variant) {
            case 'secondary': return GRADIENTS.secondary;
            case 'danger': return GRADIENTS.danger;
            case 'outline': return ['transparent', 'transparent'];
            default: return GRADIENTS.primary;
        }
    };

    const getTextColor = () => {
        if (disabled) return COLORS.textSecondary;
        if (variant === 'outline') return COLORS.primary;
        return COLORS.white;
    };

    const Content = () => (
        <>
            {loading ? (
                <ActivityIndicator color={getTextColor()} />
            ) : (
                <Text style={[styles.text, { color: getTextColor() }]}>{title}</Text>
            )}
        </>
    );

    return (
        <Animated.View style={[{ transform: [{ scale: scaleAnim }] }, style]}>
            <TouchableOpacity
                onPress={onPress}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                disabled={disabled || loading}
                activeOpacity={0.9}
            >
                <LinearGradient
                    colors={getGradientColors()}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={[
                        styles.button,
                        variant === 'outline' && styles.outlineButton,
                        !disabled && variant !== 'outline' && SHADOWS.medium,
                    ]}
                >
                    <Content />
                </LinearGradient>
            </TouchableOpacity>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    button: {
        paddingVertical: SPACING.m,
        paddingHorizontal: SPACING.l,
        borderRadius: LAYOUT.radius.l,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 56,
        flexDirection: 'row',
    },
    outlineButton: {
        borderWidth: 2,
        borderColor: COLORS.primary,
    },
    text: {
        fontSize: 16,
        ...FONTS.bold,
        letterSpacing: 0.5,
    },
});
