/**
 * Admin Authentication Utilities
 * Provides functions to verify admin authentication and prevent unauthorized edits
 * Supports admin login via email/password OR Google OAuth
 */

export function isAdminAuthenticated(): boolean {
  // Check multiple auth sources
  const adminToken = localStorage.getItem('adminToken');
  const adminEmail = localStorage.getItem('adminEmail');
  const isAdminAuth = localStorage.getItem('isAdminAuthenticated') === 'true';
  const googleUser = localStorage.getItem('googleUser');
  const adminAuthenticated = localStorage.getItem('adminAuthenticated') === 'true';
  
  // Admin is authenticated if any of these are true:
  // 1. Admin token exists
  // 2. Admin email exists (from email/password login)
  // 3. isAdminAuthenticated flag is true
  // 4. Google user is logged in
  // 5. Legacy adminAuthenticated flag is true
  
  return !!(adminToken || adminEmail || isAdminAuth || googleUser || adminAuthenticated);
}

export function requireAdminAuth(action: string = 'edit settings'): boolean {
  if (!isAdminAuthenticated()) {
    console.warn(`[ADMIN_AUTH] Unauthorized attempt to ${action}`);
    alert(`You are not authorized to ${action}. Please login to admin panel first with your credentials.`);
    return false;
  }
  return true;
}

export function getAdminAuthMetadata() {
  const adminEmail = localStorage.getItem('adminEmail') || 'admin';
  return {
    updated_at: new Date().toISOString(),
    updated_by: adminEmail,
    authenticated: true
  };
}
