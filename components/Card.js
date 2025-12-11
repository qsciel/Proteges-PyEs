import React from 'react';
import { StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SPACING, SHADOWS, LAYOUT, GRADIENTS } from '../theme';

export default function Card({ children, style, variant = 'surface' }) {
    const getColors = () => {
        if (variant === 'primary') return GRADIENTS.primary;
        return GRADIENTS.surface;
    };

    return (
        <LinearGradient
            colors={getColors()}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={[styles.card, style]}
        >
            {children}
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    card: {
        borderRadius: LAYOUT.radius.m,
        padding: SPACING.m,
        ...SHADOWS.medium,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
});
