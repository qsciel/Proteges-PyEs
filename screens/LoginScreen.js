import React, { useState, useContext } from 'react';
import { View, Text, StyleSheet, Image, KeyboardAvoidingView, Platform, ScrollView, Dimensions, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { AuthContext } from '../context/AuthContext';
import Card from '../components/Card';
import Input from '../components/Input';
import Button from '../components/Button';
import { COLORS, SPACING, FONTS, GRADIENTS, LAYOUT } from '../theme';
import { APP_INFO } from '../constants/appConstants';
import { validateLoginForm } from '../utils/validators';
import { handleError } from '../utils/errorHandler';
import api from '../services/api';

const { width } = Dimensions.get('window');

export default function LoginScreen() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const { login } = useContext(AuthContext);

    const handleLogin = async () => {
        // Validate form
        const validation = validateLoginForm(username, password);
        if (!validation.valid) {
            const firstError = Object.values(validation.errors)[0];
            setError(firstError);
            return;
        }

        setLoading(true);
        setError('');

        try {
            const user = await api.login(username, password);
            await login(user);
        } catch (e) {
            const errorMessage = handleError(e, 'Login');
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
            >
                <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                    <ScrollView
                        contentContainerStyle={styles.scrollContent}
                        keyboardShouldPersistTaps="handled"
                        showsVerticalScrollIndicator={false}
                    >
                        <View style={styles.header}>
                            <View style={styles.logoContainer}>
                                <Image
                                    source={require('../assets/icon.png')}
                                    style={styles.logo}
                                    resizeMode="contain"
                                />
                            </View>
                            <Text style={styles.title}>{APP_INFO.NAME}</Text>
                            <Text style={styles.subtitle}>Acceso Seguro al Plantel</Text>
                        </View>

                        <Card style={styles.formCard}>
                            <Text style={styles.cardHeader}>Bienvenido</Text>
                            <Input
                                label="Usuario"
                                value={username}
                                onChangeText={setUsername}
                                autoCapitalize="none"
                                placeholder="Ingrese su usuario"
                                returnKeyType="next"
                            />
                            <Input
                                label="Contraseña"
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry
                                placeholder="Ingrese su contraseña"
                                returnKeyType="done"
                                onSubmitEditing={handleLogin}
                            />

                            {error ? <Text style={styles.errorText}>{error}</Text> : null}

                            <Button
                                title="Iniciar Sesión"
                                onPress={handleLogin}
                                loading={loading}
                                style={styles.loginButton}
                            />
                        </Card>

                        <Text style={styles.footerText}>{APP_INFO.COPYRIGHT}</Text>
                    </ScrollView>
                </TouchableWithoutFeedback>
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    keyboardView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: SPACING.l,
        paddingBottom: SPACING.xxl * 2,
    },
    header: {
        alignItems: 'center',
        marginBottom: SPACING.xl,
    },
    logoContainer: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: COLORS.surface,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: SPACING.m,
        borderWidth: 2,
        borderColor: COLORS.border,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    logo: {
        width: 80,
        height: 80,
    },
    title: {
        fontSize: 36,
        color: COLORS.text,
        ...FONTS.h1,
        marginBottom: SPACING.xs,
    },
    subtitle: {
        fontSize: 16,
        color: COLORS.textSecondary,
        ...FONTS.medium,
        letterSpacing: 1,
    },
    formCard: {
        width: '100%',
        maxWidth: 400,
        alignSelf: 'center',
        padding: SPACING.xl,
    },
    cardHeader: {
        fontSize: 24,
        color: COLORS.text,
        ...FONTS.h2,
        marginBottom: SPACING.l,
        textAlign: 'center',
    },
    loginButton: {
        marginTop: SPACING.m,
    },
    errorText: {
        color: COLORS.danger,
        textAlign: 'center',
        marginBottom: SPACING.m,
        ...FONTS.medium,
    },
    footerText: {
        textAlign: 'center',
        color: COLORS.textLight,
        marginTop: SPACING.xl,
        fontSize: 12,
    },
});
