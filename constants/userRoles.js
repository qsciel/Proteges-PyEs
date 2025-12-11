/**
 * User role constants
 */

export const USER_ROLES = {
    ADMIN: 'Admin',
    SUPER_USER: 'SuperUser',
    USER: 'User',
};

export const ROLE_PERMISSIONS = {
    [USER_ROLES.SUPER_USER]: {
        canAccessAdmin: true,
        canCreateUsers: true,
        canCreateGroups: true,
        canManageEmergency: true,
        canScan: true,
    },
    [USER_ROLES.ADMIN]: {
        canAccessAdmin: true,
        canCreateUsers: true,
        canCreateGroups: true,
        canManageEmergency: true,
        canScan: true,
    },
    [USER_ROLES.USER]: {
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
 * Check if user is admin or super user
 * @param {Object} user - User object with role property
 * @returns {boolean} Whether user is admin or super user
 */
export const isAdminUser = (user) => {
    if (!user || !user.role) return false;
    return user.role === USER_ROLES.ADMIN || user.role === USER_ROLES.SUPER_USER;
};
