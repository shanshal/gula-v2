const axios = require('axios');

class AuthClient {
  constructor() {
    this.authServiceUrl = process.env.AUTH_SERVICE_URL;
    this.internalToken = process.env.INTERNAL_ACCESS_TOKEN;
    
    if (!this.authServiceUrl) {
      throw new Error('AUTH_SERVICE_URL environment variable is required');
    }
    
    if (!this.internalToken) {
      throw new Error('INTERNAL_ACCESS_TOKEN environment variable is required');
    }

    this.client = axios.create({
      baseURL: this.authServiceUrl,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.internalToken}`
      }
    });
  }

  /**
   * Get user by ID from auth service
   * @param {string} userId - The user ID
   * @returns {Promise<Object|null>} User object or null if not found
   */
  async getUserById(userId) {
    try {
      if (!userId) {
        return null;
      }

      const response = await this.client.get(`/api/auth/internal/users/${encodeURIComponent(userId)}`);
      return response.data?.user || null;
    } catch (error) {
      // Return null for 404 (user not found) but log other errors
      if (error.response?.status === 404) {
        return null;
      }
      
      console.error('AuthClient: Error fetching user by ID:', error.message);
      throw new Error(`Failed to fetch user: ${error.message}`);
    }
  }

  /**
   * Validate if user exists
   * @param {string} userId - The user ID to validate
   * @returns {Promise<boolean>} True if user exists, false otherwise
   */
  async userExists(userId) {
    try {
      const user = await this.getUserById(userId);
      return user !== null;
    } catch (error) {
      console.error('AuthClient: Error checking if user exists:', error.message);
      return false;
    }
  }
}

// Singleton instance
const authClient = new AuthClient();

module.exports = authClient;