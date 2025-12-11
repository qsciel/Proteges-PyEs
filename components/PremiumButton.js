import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { COLORS, SHADOWS, SPACING, FONTS } from '../theme';

export default function Button({ title, onPress, loading, disabled, variant = 'primary' }) {
    const backgroundColor = disabled
        ? COLORS.border
        : variant === 'danger'
            ? COLORS.danger
            : COLORS.primary;

    return (
        <TouchableOpacity
            onPress={onPress}
            disabled={disabled || loading}
            activeOpacity={0.8}
            style={[styles.button, { backgroundColor }]}
        >
            {loading ? (
                <ActivityIndicator color={COLORS.textLight} />
            ) : (
                <Text style={styles.text}>{title}</Text>
            )}
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    button: {
        paddingVertical: SPACING.m,
        paddingHorizontal: SPACING.l,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        ...SHADOWS.small,
    },
    text: {
        color: COLORS.white,
        fontSize: 16,
        ...FONTS.bold,
        letterSpacing: 0.5,
    },
});
