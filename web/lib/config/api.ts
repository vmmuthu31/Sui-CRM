// API Configuration
export const API_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000',
} as const;

// Helper function to build API URLs
export const buildApiUrl = (endpoint: string): string => {
  // Remove leading slash if present to avoid double slashes
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  return `${API_CONFIG.BASE_URL}/${cleanEndpoint}`;
};

// Common API endpoints for CRM
export const API_ENDPOINTS = {
  // Organization endpoints
  ORGS_LIST: '/api/organizations',
  ORG_CREATE: '/api/organizations/create',
  ORG_DETAILS: (orgId: string) => `/api/organizations/${orgId}`,
  ORG_MEMBERS: (orgId: string) => `/api/organizations/${orgId}/members`,
  ORG_ADD_MEMBER: (orgId: string) => `/api/organizations/${orgId}/members/add`,
  ORG_UPDATE_MEMBER: (orgId: string, memberAddress: string) => 
    `/api/organizations/${orgId}/members/${memberAddress}`,
  
  // Profile/Contact endpoints
  PROFILES_LIST: '/api/profiles',
  PROFILE_CREATE: '/api/profiles/create',
  PROFILE_DETAILS: (profileId: string) => `/api/profiles/${profileId}`,
  PROFILE_UPDATE: (profileId: string) => `/api/profiles/${profileId}`,
  PROFILE_DELETE: (profileId: string) => `/api/profiles/${profileId}`,
  PROFILE_ONCHAIN_ACTIVITY: (profileId: string) => `/api/profiles/${profileId}/onchain`,
  
  // Notes endpoints (encrypted)
  NOTES_LIST: (profileId: string) => `/api/profiles/${profileId}/notes`,
  NOTE_CREATE: (profileId: string) => `/api/profiles/${profileId}/notes/create`,
  NOTE_DETAILS: (profileId: string, noteId: string) => `/api/profiles/${profileId}/notes/${noteId}`,
  NOTE_DELETE: (profileId: string, noteId: string) => `/api/profiles/${profileId}/notes/${noteId}`,
  
  // Files endpoints (encrypted)
  FILES_LIST: (profileId: string) => `/api/profiles/${profileId}/files`,
  FILE_UPLOAD: (profileId: string) => `/api/profiles/${profileId}/files/upload`,
  FILE_DOWNLOAD: (profileId: string, fileId: string) => `/api/profiles/${profileId}/files/${fileId}`,
  FILE_DELETE: (profileId: string, fileId: string) => `/api/profiles/${profileId}/files/${fileId}`,
  
  // Interaction endpoints
  INTERACTIONS_LIST: (profileId: string) => `/api/profiles/${profileId}/interactions`,
  INTERACTION_LOG: '/api/interactions/log',
  
  // Encryption/Decryption endpoints (Seal + Walrus)
  ENCRYPT_NOTE: '/api/encryption/note',
  DECRYPT_NOTE: '/api/encryption/note/decrypt',
  ENCRYPT_FILE: '/api/encryption/file',
  DECRYPT_FILE: '/api/encryption/file/decrypt',
  
  // Analytics endpoints
  ANALYTICS_OVERVIEW: '/api/analytics/overview',
  ANALYTICS_SEGMENTS: '/api/analytics/segments',
  ANALYTICS_ENGAGEMENT: '/api/analytics/engagement',
} as const;