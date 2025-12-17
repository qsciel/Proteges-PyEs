import { useState, useEffect, useRef } from 'react';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import api from '../services/api';

// Configurar comportamiento de notificaciones cuando la app está abierta
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
    }),
});

export const usePushNotifications = () => {
    const [expoPushToken, setExpoPushToken] = useState('');
    const [notification, setNotification] = useState(false);
    const notificationListener = useRef();
    const responseListener = useRef();

    // Registrar token al iniciar
    const registerForPushNotificationsAsync = async () => {
        let token;

        if (Platform.OS === 'android') {
            await Notifications.setNotificationChannelAsync('default', {
                name: 'default',
                importance: Notifications.AndroidImportance.MAX,
                vibrationPattern: [0, 250, 250, 250],
                lightColor: '#FF231F7C',
            });
        }

        if (Device.isDevice) {
            // Check for Expo Go on Android specifically to avoid the error
            if (Platform.OS === 'android' && Constants.appOwnership === 'expo') {
                console.log('Push Notifications not supported in Expo Go on Android');
                return;
            }

            const { status: existingStatus } = await Notifications.getPermissionsAsync();
            let finalStatus = existingStatus;

            if (existingStatus !== 'granted') {
                const { status } = await Notifications.requestPermissionsAsync();
                finalStatus = status;
            }

            if (finalStatus !== 'granted') {
                console.log('Permiso de notificaciones denegado');
                return;
            }

            try {
                // Obtener el token Project ID si está configurado en app.json (opcional en bare workflow pero recomendado)
                const projectId = Constants?.expoConfig?.extra?.eas?.projectId;
                token = (await Notifications.getExpoPushTokenAsync({
                    projectId,
                })).data;
                console.log('Expo Push Token:', token);
            } catch (error) {
                // Si falla (ej: sin cuenta expo logueada), manejar gracefully
                console.log('Error obteniendo token:', error);
                // token = "SIMULATED_TOKEN_" + Math.random().toString(36); // Fallback para test
            }

        } else {
            console.log('Debes usar un dispositivo físico para Push Notifications');
        }

        return token;
    };

    const registerTokenBackend = async (studentId, deviceName) => {
        if (!expoPushToken) return;
        try {
            await api.registerPushToken(studentId, expoPushToken, deviceName || Device.modelName);
            console.log("Token registrado en backend");
        } catch (error) {
            console.error("Error registrando token en backend:", error);
        }
    }

    useEffect(() => {
        registerForPushNotificationsAsync().then(token => setExpoPushToken(token));

        notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
            setNotification(notification);
        });

        responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
            console.log(response);
        });

        return () => {
            notificationListener.current && notificationListener.current.remove();
            responseListener.current && responseListener.current.remove();
        };
    }, []);

    return {
        expoPushToken,
        notification,
        registerTokenBackend
    };
};
