/**
 * Scan type constants
 */

export const SCAN_TYPES = {
    ENTRY: 'entry',
    EXIT: 'exit',
    EMERGENCY: 'emergency',
};

export const SCAN_TYPE_LABELS = {
    [SCAN_TYPES.ENTRY]: {
        es: 'Entrada',
        en: 'Entry',
    },
    [SCAN_TYPES.EXIT]: {
        es: 'Salida',
        en: 'Exit',
    },
    [SCAN_TYPES.EMERGENCY]: {
        es: 'Emergencia',
        en: 'Emergency',
    },
};

/**
 * Get scan type label in specified language
 * @param {string} scanType - Scan type from SCAN_TYPES
 * @param {string} lang - Language code ('es' or 'en')
 * @returns {string} Localized scan type label
 */
export const getScanTypeLabel = (scanType, lang = 'es') => {
    const label = SCAN_TYPE_LABELS[scanType];
    if (!label) return scanType;
    return label[lang] || label.es;
};
