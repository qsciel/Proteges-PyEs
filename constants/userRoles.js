/**
 * User role constants
 */

export const USER_ROLES = {
    DIRECTOR: 'Director',
    OPERATOR: 'Operador',
    TEACHER: 'Docente',
    PREFECT: 'Prefecto',
    DOCTOR: 'Doctor',
};

export const ROLE_PERMISSIONS = {
    [USER_ROLES.DIRECTOR]: {
        canAccessAdmin: true,
        canCreateUsers: true,
        canCreateGroups: true,
        canManageEmergency: true,
        canScan: true,
    },
    [USER_ROLES.OPERATOR]: {
        canAccessAdmin: true,
        canCreateUsers: true,
        canCreateGroups: true,
        canManageEmergency: true,
        canScan: true,
    },
    [USER_ROLES.TEACHER]: {
        canAccessAdmin: false,
        canCreateUsers: false,
        canCreateGroups: false,
        canManageEmergency: false,
        canScan: true,
    },
    [USER_ROLES.PREFECT]: {
        canAccessAdmin: false,
        canCreateUsers: false,
        canCreateGroups: false,
        canManageEmergency: false,
        canScan: true,
    },
    [USER_ROLES.DOCTOR]: {
        canAccessAdmin: false,
        canCreateUsers: false,
        canCreateGroups: false,
        canManageEmergency: false,
        canScan: true,
    },
};

/**
 * Check if user has specific permission
 * @param {Object} user - User object with role property
 * @param {string} permission - Permission to check
 * @returns {boolean} Whether user has permission
 */
export const hasPermission = (user, permission) => {
    if (!user || !user.role) return false;
    const permissions = ROLE_PERMISSIONS[user.role];
    return permissions ? permissions[permission] === true : false;
};

/**
 * Check if user is admin or super user (Director or Operator)
 * @param {Object} user - User object with role property
 * @returns {boolean} Whether user is Director or Operator
 */
export const isAdminUser = (user) => {
    if (!user || !user.role) return false;
    return user.role === USER_ROLES.DIRECTOR || user.role === USER_ROLES.OPERATOR;
};
