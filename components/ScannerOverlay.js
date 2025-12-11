import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { COLORS } from '../theme';

const { width } = Dimensions.get('window');
const SIZE = width * 0.7;

export default function ScannerOverlay() {
    return (
        <View style={styles.container}>
            <View style={styles.overlay} />
            <View style={styles.row}>
                <View style={styles.overlay} />
                <View style={styles.scanner}>
                    <View style={[styles.corner, styles.topLeft]} />
                    <View style={[styles.corner, styles.topRight]} />
                    <View style={[styles.corner, styles.bottomLeft]} />
                    <View style={[styles.corner, styles.bottomRight]} />
                </View>
                <View style={styles.overlay} />
            </View>
            <View style={styles.overlay} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
    },
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        width: '100%',
    },
    row: {
        flexDirection: 'row',
        height: SIZE,
    },
    scanner: {
        width: SIZE,
        height: SIZE,
        backgroundColor: 'transparent',
    },
    corner: {
        position: 'absolute',
        width: 40,
        height: 40,
        borderColor: COLORS.success,
        borderWidth: 4,
    },
    topLeft: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0 },
    topRight: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0 },
    bottomLeft: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0 },
    bottomRight: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0 },
});
