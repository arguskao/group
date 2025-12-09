import { ADMIN_PASSWORD } from './constants.js';

/**
 * AuthManager class for handling admin authentication
 */
export class AuthManager {
  constructor(adminPassword = ADMIN_PASSWORD) {
    this.adminPassword = adminPassword;
  }

  /**
   * Authenticate admin password
   * @param {string} inputPassword - The password to verify
   * @returns {boolean} - True if password is correct
   */
  authenticate(inputPassword) {
    return inputPassword === this.adminPassword;
  }
}
