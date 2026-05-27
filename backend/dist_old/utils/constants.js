"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: Object.getOwnPropertyDescriptor(all, name).get
    });
}
_export(exports, {
    get ACCESS_TOKEN_EXPIRE_TIME () {
        return ACCESS_TOKEN_EXPIRE_TIME;
    },
    get ACTION_TYPE () {
        return ACTION_TYPE;
    },
    get AUDIT_LOG_KEY () {
        return AUDIT_LOG_KEY;
    },
    get MAX_DEVICES () {
        return MAX_DEVICES;
    },
    get PERMISSIONS () {
        return PERMISSIONS;
    },
    get PERMISSIONS_KEY () {
        return PERMISSIONS_KEY;
    },
    get REFRESH_TOKEN_EXPIRE_TIME () {
        return REFRESH_TOKEN_EXPIRE_TIME;
    },
    get ROLE_NAME () {
        return ROLE_NAME;
    },
    get thresholdOustanding () {
        return thresholdOustanding;
    }
});
const MAX_DEVICES = 3;
const PERMISSIONS_KEY = 'permissions';
const AUDIT_LOG_KEY = 'audit_log_action';
const ROLE_NAME = {
    ADMIN: 'ADMIN',
    PATIENT: 'PATIENT',
    DOCTOR: 'DOCTOR'
};
const ACTION_TYPE = {
    CREATE: 'CREATE',
    UPDATE: 'UPDATE',
    DELETE: 'DELETE'
};
const PERMISSIONS = {
    AUTH_LOGIN: 'auth:login',
    AUTH_LOGOUT: 'auth:logout',
    AUTH_REFRESH: 'auth:refresh',
    AUTH_REGISTER: 'auth:register',
    AUTH_GOOGLE_LOGIN: 'auth:google-login',
    AUTH_SET_PASSWORD: 'auth:set-password',
    USER_CREATE: 'user:create',
    USER_READ: 'user:read',
    USER_UPDATE: 'user:update',
    USER_DELETE: 'user:delete',
    USER_LOCK: 'user:lock',
    USER_UNLOCK: 'user:unlock',
    USER_ACTIVATE: 'user:activate',
    USER_DEACTIVATE: 'user:deactivate',
    USER_UPDATE_ROLE: 'user:update-role',
    USER_MANAGE: 'user:manage',
    PATIENT_CREATE: 'patient:create',
    PATIENT_READ: 'patient:read',
    PATIENT_UPDATE: 'patient:update',
    PATIENT_DELETE: 'patient:delete',
    PATIENT_MANAGE: 'patient:manage',
    DOCTOR_CREATE: 'doctor:create',
    DOCTOR_READ: 'doctor:read',
    DOCTOR_UPDATE: 'doctor:update',
    DOCTOR_DELETE: 'doctor:delete',
    DOCTOR_MANAGE: 'doctor:manage',
    APPOINTMENT_CREATE: 'appointment:create',
    APPOINTMENT_READ: 'appointment:read',
    APPOINTMENT_UPDATE: 'appointment:update',
    APPOINTMENT_DELETE: 'appointment:delete',
    APPOINTMENT_CANCEL: 'appointment:cancel',
    APPOINTMENT_UPDATE_STATUS: 'appointment:update-status',
    APPOINTMENT_MANAGE: 'appointment:manage',
    DOCTOR_SCHEDULE_CREATE: 'doctor-schedule:create',
    DOCTOR_SCHEDULE_READ: 'doctor-schedule:read',
    DOCTOR_SCHEDULE_UPDATE: 'doctor-schedule:update',
    DOCTOR_SCHEDULE_DELETE: 'doctor-schedule:delete',
    DOCTOR_SCHEDULE_UPDATE_STATUS: 'doctor-schedule:update-status',
    DOCTOR_SCHEDULE_MANAGE: 'doctor-schedule:manage',
    ROLE_CREATE: 'role:create',
    ROLE_READ: 'role:read',
    ROLE_UPDATE: 'role:update',
    ROLE_DELETE: 'role:delete',
    ROLE_MANAGE: 'role:manage',
    PERMISSION_CREATE: 'permission:create',
    PERMISSION_READ: 'permission:read',
    PERMISSION_UPDATE: 'permission:update',
    PERMISSION_DELETE: 'permission:delete',
    PERMISSION_MANAGE: 'permission:manage',
    ROLE_PERMISSION_READ: 'role-permission:read',
    ROLE_PERMISSION_UPDATE: 'role-permission:update',
    ROLE_PERMISSION_MANAGE: 'role-permission:manage',
    SPECIALTY_CREATE: 'specialty:create',
    SPECIALTY_READ: 'specialty:read',
    SPECIALTY_UPDATE: 'specialty:update',
    SPECIALTY_DELETE: 'specialty:delete',
    SPECIALTY_MANAGE: 'specialty:manage',
    TOPIC_CREATE: 'topic:create',
    TOPIC_READ: 'topic:read',
    TOPIC_UPDATE: 'topic:update',
    TOPIC_DELETE: 'topic:delete',
    TOPIC_MANAGE: 'topic:manage',
    TAG_CREATE: 'tag:create',
    TAG_READ: 'tag:read',
    TAG_UPDATE: 'tag:update',
    TAG_DELETE: 'tag:delete',
    TAG_MANAGE: 'tag:manage',
    ARTICLE_CREATE: 'article:create',
    ARTICLE_READ: 'article:read',
    ARTICLE_UPDATE: 'article:update',
    ARTICLE_DELETE: 'article:delete',
    ARTICLE_APPROVE: 'article:approve',
    ARTICLE_MANAGE: 'article:manage',
    MESSAGE_CREATE: 'message:create',
    MESSAGE_READ: 'message:read',
    MESSAGE_UPDATE: 'message:update',
    MESSAGE_DELETE: 'message:delete',
    MESSAGE_MANAGE: 'message:manage',
    CHANNEL_CREATE: 'channel:create',
    CHANNEL_READ: 'channel:read',
    CHANNEL_UPDATE: 'channel:update',
    CHANNEL_DELETE: 'channel:delete',
    CHANNEL_MANAGE: 'channel:manage',
    RELATIVE_CREATE: 'relative:create',
    RELATIVE_READ: 'relative:read',
    RELATIVE_UPDATE: 'relative:update',
    RELATIVE_DELETE: 'relative:delete',
    RELATIVE_MANAGE: 'relative:manage',
    RELATIONSHIP_CREATE: 'relationship:create',
    RELATIONSHIP_READ: 'relationship:read',
    RELATIONSHIP_UPDATE: 'relationship:update',
    RELATIONSHIP_DELETE: 'relationship:delete',
    RELATIONSHIP_MANAGE: 'relationship:manage',
    HEALTH_PROFILE_CREATE: 'health-profile:create',
    HEALTH_PROFILE_READ: 'health-profile:read',
    HEALTH_PROFILE_UPDATE: 'health-profile:update',
    HEALTH_PROFILE_DELETE: 'health-profile:delete',
    HEALTH_PROFILE_MANAGE: 'health-profile:manage',
    EXAMINATION_RESULT_CREATE: 'examination-result:create',
    EXAMINATION_RESULT_READ: 'examination-result:read',
    EXAMINATION_RESULT_UPDATE: 'examination-result:update',
    EXAMINATION_RESULT_DELETE: 'examination-result:delete',
    EXAMINATION_RESULT_MANAGE: 'examination-result:manage',
    SATISFACTION_RATING_CREATE: 'satisfaction-rating:create',
    SATISFACTION_RATING_READ: 'satisfaction-rating:read',
    SATISFACTION_RATING_UPDATE: 'satisfaction-rating:update',
    SATISFACTION_RATING_DELETE: 'satisfaction-rating:delete',
    SATISFACTION_RATING_MANAGE: 'satisfaction-rating:manage',
    AUDIT_LOG_READ: 'audit-log:read',
    AUDIT_LOG_MANAGE: 'audit-log:manage',
    COMPLAINT_CREATE: 'complaint:create',
    COMPLAINT_READ: 'complaint:read',
    COMPLAINT_UPDATE: 'complaint:update',
    COMPLAINT_DELETE: 'complaint:delete',
    COMPLAINT_MANAGE: 'complaint:manage',
    NOTIFICATION_CREATE: 'notification:create',
    NOTIFICATION_READ: 'notification:read',
    NOTIFICATION_UPDATE: 'notification:update',
    NOTIFICATION_DELETE: 'notification:delete',
    NOTIFICATION_SEND: 'notification:send',
    NOTIFICATION_MANAGE: 'notification:manage',
    DASHBOARD_PATIENT: 'dashboard:patient',
    DASHBOARD_DOCTOR: 'dashboard:doctor',
    DASHBOARD_ADMIN: 'dashboard:admin',
    SETTING_READ: 'setting:read',
    SETTING_UPDATE: 'setting:update',
    SETTING_MANAGE: 'setting:manage',
    PATIENT_RECORD_READ: 'patient-record:read',
    PATIENT_RECORD_MANAGE: 'patient-record:manage',
    CHATBOT_CHAT: 'chatbot:chat'
};
const ACCESS_TOKEN_EXPIRE_TIME = 15 * 60 * 1000;
const REFRESH_TOKEN_EXPIRE_TIME = 7 * 24 * 60 * 60 * 1000;
const thresholdOustanding = 0.8;

//# sourceMappingURL=constants.js.map