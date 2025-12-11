/**
 * Style Utilities
 * Helper functions for creating and manipulating styles
 */

import { SPACING, COLORS, LAYOUT, SHADOWS } from './index';

/**
 * Combine multiple style objects
 * @param {...Object} styles - Style objects to combine
 * @returns {Object} Combined style object
 */
export const combineStyles = (...styles) => {
    return Object.assign({}, ...styles.filter(Boolean));
};

/**
 * Create conditional style
 * @param {boolean} condition - Condition to check
 * @param {Object} trueStyle - Style when condition is true
 * @param {Object} falseStyle - Style when condition is false
 * @returns {Object} Conditional style
 */
export const conditionalStyle = (condition, trueStyle, falseStyle = {}) => {
    return condition ? trueStyle : falseStyle;
};

/**
 * Create margin styles
 * @param {number|Object} value - Margin value or object with specific sides
 * @returns {Object} Margin style object
 */
export const margin = (value) => {
    if (typeof value === 'number') {
        return { margin: value };
    }

    const { top, right, bottom, left, horizontal, vertical, all } = value;

    return {
        ...(all !== undefined && { margin: all }),
        ...(top !== undefined && { marginTop: top }),
        ...(right !== undefined && { marginRight: right }),
        ...(bottom !== undefined && { marginBottom: bottom }),
        ...(left !== undefined && { marginLeft: left }),
        ...(horizontal !== undefined && { marginHorizontal: horizontal }),
        ...(vertical !== undefined && { marginVertical: vertical }),
    };
};

/**
 * Create padding styles
 * @param {number|Object} value - Padding value or object with specific sides
 * @returns {Object} Padding style object
 */
export const padding = (value) => {
    if (typeof value === 'number') {
        return { padding: value };
    }

    const { top, right, bottom, left, horizontal, vertical, all } = value;

    return {
        ...(all !== undefined && { padding: all }),
        ...(top !== undefined && { paddingTop: top }),
        ...(right !== undefined && { paddingRight: right }),
        ...(bottom !== undefined && { paddingBottom: bottom }),
        ...(left !== undefined && { paddingLeft: left }),
        ...(horizontal !== undefined && { paddingHorizontal: horizontal }),
        ...(vertical !== undefined && { paddingVertical: vertical }),
    };
};

/**
 * Create flex container styles
 * @param {Object} options - Flex options
 * @returns {Object} Flex style object
 */
export const flexContainer = ({
    direction = 'row',
    justify = 'flex-start',
    align = 'stretch',
    wrap = 'nowrap',
} = {}) => {
    return {
        display: 'flex',
        flexDirection: direction,
        justifyContent: justify,
        alignItems: align,
        flexWrap: wrap,
    };
};

/**
 * Create centered container styles
 * @returns {Object} Center style object
 */
export const center = () => {
    return {
        justifyContent: 'center',
        alignItems: 'center',
    };
};

/**
 * Create card-like container styles
 * @param {Object} options - Card options
 * @returns {Object} Card style object
 */
export const cardStyle = ({
    padding: paddingValue = SPACING.m,
    radius = LAYOUT.radius.m,
    shadow = true,
    background = COLORS.surface,
} = {}) => {
    return {
        backgroundColor: background,
        borderRadius: radius,
        padding: paddingValue,
        ...(shadow && SHADOWS.medium),
    };
};

/**
 * Add transparency to hex color
 * @param {string} hexColor - Hex color code
 * @param {number} opacity - Opacity value (0-1)
 * @returns {string} RGBA color string
 */
export const addOpacity = (hexColor, opacity) => {
    const hex = hexColor.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

/**
 * Create responsive size based on screen width
 * @param {number} baseSize - Base size
 * @param {number} screenWidth - Screen width
 * @returns {number} Responsive size
 */
export const responsiveSize = (baseSize, screenWidth) => {
    const baseWidth = 375; // iPhone SE width
    return (screenWidth / baseWidth) * baseSize;
};
