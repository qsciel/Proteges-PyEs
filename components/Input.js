import React, { useState } from 'react';
import { TextInput, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, FONTS, LAYOUT } from '../theme';

export default function Input({ label, error, secureTextEntry, ...props }) {
    const [isFocused, setIsFocused] = useState(false);
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);

    const togglePasswordVisibility = () => {
        setIsPasswordVisible(!isPasswordVisible);
    };

    return (
        <View style={styles.container}>
            {label && <Text style={[styles.label, isFocused && styles.labelFocused]}>{label}</Text>}
            <View style={styles.inputContainer}>
                <TextInput
                    style={[
                        styles.input,
                        isFocused && styles.inputFocused,
                        error && styles.inputError,
                        secureTextEntry && styles.inputWithIcon
                    ]}
                    placeholderTextColor={COLORS.textSecondary}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    secureTextEntry={secureTextEntry && !isPasswordVisible}
                    {...props}
                />
                {secureTextEntry && (
                    <TouchableOpacity
                        style={styles.iconButton}
                        onPress={togglePasswordVisibility}
                        activeOpacity={0.7}
                    >
                        <Ionicons
                            name={isPasswordVisible ? "eye-off-outline" : "eye-outline"}
                            size={24}
                            color={isFocused ? COLORS.primary : COLORS.textSecondary}
                        />
                    </TouchableOpacity>
                )}
            </View>
            {error && <Text style={styles.errorText}>{error}</Text>}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginBottom: SPACING.m,
    },
    label: {
        color: COLORS.textLight,
        marginBottom: SPACING.s,
        ...FONTS.medium,
        fontSize: 14,
    },
    labelFocused: {
        color: COLORS.primary,
    },
    inputContainer: {
        position: 'relative',
    },
    input: {
        backgroundColor: COLORS.surface,
        borderWidth: 1.5,
        borderColor: COLORS.border,
        borderRadius: LAYOUT.radius.m,
        padding: SPACING.m,
        color: COLORS.text,
        fontSize: 16,
        minHeight: 56,
    },
    inputWithIcon: {
        paddingRight: 50,
    },
    inputFocused: {
        borderColor: COLORS.primary,
        backgroundColor: `${COLORS.primary}10`, // 10% opacity
    },
    inputError: {
        borderColor: COLORS.danger,
    },
    iconButton: {
        position: 'absolute',
        right: 12,
        top: 16,
        padding: 4,
    },
    errorText: {
        color: COLORS.danger,
        fontSize: 12,
        marginTop: 4,
        marginLeft: 4,
    },
});
