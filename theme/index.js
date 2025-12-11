export const COLORS = {
    primary: '#2563EB', // Professional Blue 600
    primaryDark: '#1E40AF', // Blue 800
    primaryLight: '#3B82F6', // Blue 500
    secondary: '#059669', // Emerald 600
    background: '#F9FAFB', // Gray 50
    surface: '#FFFFFF', // White
    surfaceLight: '#F3F4F6', // Gray 100
    text: '#111827', // Gray 900
    textSecondary: '#6B7280', // Gray 500
    textLight: '#374151', // Gray 700
    success: '#059669', // Emerald 600
    danger: '#DC2626', // Red 600
    warning: '#D97706', // Amber 600
    info: '#2563EB', // Blue 600
    border: '#E5E7EB', // Gray 200
    borderDark: '#D1D5DB', // Gray 300
    white: '#FFFFFF',
    black: '#000000',
    overlay: 'rgba(0, 0, 0, 0.5)',
    transparent: 'transparent',
    card: '#FFFFFF',
    gray: '#9CA3AF', // Gray 400
};

export const GRADIENTS = {
    primary: ['#2563EB', '#2563EB'], // Solid primary (no gradient)
    secondary: ['#059669', '#059669'], // Solid secondary
    danger: ['#DC2626', '#DC2626'], // Solid danger
    surface: ['#FFFFFF', '#F9FAFB'], // Very subtle gradient
    lightOverlay: ['transparent', 'rgba(255, 255, 255, 0.9)'],
};

export const SPACING = {
    xs: 4,
    s: 8,
    m: 16,
    l: 24,
    xl: 32,
    xxl: 48,
};

export const FONTS = {
    // Font weights
    regular: { fontWeight: '400' },
    medium: { fontWeight: '500' },
    semiBold: { fontWeight: '600' },
    bold: { fontWeight: '700' },
    extraBold: { fontWeight: '800' },

    // Headings
    h1: { fontSize: 32, fontWeight: '800', letterSpacing: -1 },
    h2: { fontSize: 24, fontWeight: '700', letterSpacing: -0.5 },
    h3: { fontSize: 20, fontWeight: '600' },
    h4: { fontSize: 18, fontWeight: '600' },

    // Body text
    body: { fontSize: 16, fontWeight: '400' },
    body2: { fontSize: 14, fontWeight: '400' },

    // Small text
    caption: { fontSize: 14, fontWeight: '400', color: '#6B7280' },
    caption2: { fontSize: 12, fontWeight: '400', color: '#6B7280' },

    // Button text
    button: { fontSize: 16, fontWeight: '600', letterSpacing: 0.5 },
};

export const SHADOWS = {
    small: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    medium: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 2,
    },
    large: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
};

export const LAYOUT = {
    radius: {
        s: 8,
        m: 16,
        l: 24,
        xl: 32,
        full: 9999,
    },
};

// Animation Configuration
export const ANIMATIONS = {
    duration: {
        fast: 150,
        normal: 300,
        slow: 500,
    },
    easing: {
        linear: 'linear',
        easeIn: 'ease-in',
        easeOut: 'ease-out',
        easeInOut: 'ease-in-out',
    },
};

// Z-Index System
export const Z_INDEX = {
    base: 1,
    dropdown: 100,
    sticky: 200,
    overlay: 300,
    modal: 400,
    popover: 500,
    toast: 600,
};
