export const COLORS = {
    primary: '#316C59', // Green (Brand)
    primaryDark: '#235041', // Darker Green
    primaryLight: '#4B8C73', // Lighter Green
    secondary: '#CBB27C', // Gold (Accent)
    secondaryDark: '#A8925B', // Darker Gold
    background: '#FFFFFE', // White (Light Background)
    surface: '#FFFFFF', // Pure White
    surfaceLight: '#F5F5F0', // Slight warm gray/white
    text: '#111827', // Gray 900
    textSecondary: '#6B7280', // Gray 500
    textLight: '#374151', // Gray 700
    success: '#059669', // Emerald 600 (Keep for success state)
    danger: '#DC2626', // Red 600
    warning: '#CBB27C', // Use Gold for warning/accent
    info: '#2563EB', // Blue 600
    border: '#E5E7EB', // Gray 200
    borderDark: '#D1D5DB', // Gray 300
    white: '#FFFFFF',
    black: '#000000',
    overlay: 'rgba(0, 0, 0, 0.5)',
    transparent: 'transparent',
    surfaceWithOpacity: 'rgba(255, 255, 255, 0.9)',
    card: '#FFFFFF',
    gray: '#9CA3AF', // Gray 400
};

export const GRADIENTS = {
    primary: ['#316C59', '#235041'], // Green Gradient
    secondary: ['#CBB27C', '#B59D65'], // Gold Gradient
    danger: ['#DC2626', '#B91C1C'], // Red Gradient
    surface: ['#FFFFFF', '#FFFFFE'], // Subtle White
    lightOverlay: ['transparent', 'rgba(255, 255, 254, 0.9)'],
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
