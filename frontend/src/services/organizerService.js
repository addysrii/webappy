// src/services/organizerService.js
import api from './api';

/**
 * Service for managing organizer profiles and operations
 */
const organizerService = {
  /**
   * Create a new organizer profile
   * @param {Object} organizerData - The organizer data including profile information
   * @returns {Promise} - Promise resolving to the created organizer
   */
  createOrganizer: async (organizerData) => {
    try {
      const response = await api.post('/api/organizer', organizerData);
      return response.data;
    } catch (error) {
      console.error('Error creating organizer:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Get all organizers with optional query parameters
   * @param {Object} params - Query parameters like page, limit, search, etc.
   * @returns {Promise} - Promise resolving to the organizers list
   */
  getAllOrganizers: async (params = {}) => {
    try {
      const response = await api.get('/api/organizer', { params });
      return response.data;
    } catch (error) {
      console.error('Error getting all organizers:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Get a single organizer by ID
   * @param {string} organizerId - The ID of the organizer
   * @returns {Promise} - Promise resolving to the organizer data
   */
  getOrganizerById: async (organizerId) => {
    try {
      const response = await api.get(`/api/organizer/${organizerId}`);
      
      if (response.headers.get('content-type')?.includes('application/json')) {
        return response.data;
      } else {
        const errorText = await response.text();
        throw new Error(`Invalid response format: ${errorText.substring(0, 100)}`);
      }
    } catch (error) {
      console.error('Error getting organizer by ID:', error);
      throw new Error(error.response?.data?.error || 'Failed to load organizer data');
    }
  },

  /**
   * Update an existing organizer profile
   * @param {string} organizerId - The ID of the organizer to update
   * @param {Object} organizerData - The updated organizer data
   * @returns {Promise} - Promise resolving to the updated organizer
   */
  updateOrganizer: async (organizerId, organizerData) => {
    try {
      const response = await api.put(`/api/organizer/${organizerId}`, organizerData);
      return response.data;
    } catch (error) {
      console.error('Error updating organizer:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Delete an organizer profile
   * @param {string} organizerId - The ID of the organizer to delete
   * @returns {Promise} - Promise resolving to the deletion result
   */
  deleteOrganizer: async (organizerId) => {
    try {
      const response = await api.delete(`/api/organizer/${organizerId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting organizer:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Organizer login
   * @param {Object} credentials - Login credentials (email/phone and password)
   * @returns {Promise} - Promise resolving to the login result with token
   */
  loginOrganizer: async (credentials) => {
    try {
      const response = await api.post('/api/organizer/login', credentials);
      return response.data;
    } catch (error) {
      console.error('Error during organizer login:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Search organizers based on query parameters
   * @param {Object} searchParams - Search parameters like query, location, organizationType, etc.
   * @returns {Promise} - Promise resolving to the search results
   */
  searchOrganizers: async (searchParams) => {
    try {
      const response = await api.get('/api/organizer/search/query', { params: searchParams });
      return response.data;
    } catch (error) {
      console.error('Error searching organizers:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Upload organizer profile picture
   * @param {string} organizerId - The ID of the organizer
   * @param {File} profileImage - The profile image file to upload
   * @returns {Promise} - Promise resolving to the upload result
   */
  uploadProfilePicture: async (organizerId, profileImage) => {
    try {
      const formData = new FormData();
      formData.append('profileImage', profileImage);
      
      const response = await api.post(`/api/organizer/upload/${organizerId}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      return response.data;
    } catch (error) {
      console.error('Error uploading profile picture:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Upload multiple documents for organizer (KYC, certificates, etc.)
   * @param {string} organizerId - The ID of the organizer
   * @param {Object} documents - Object containing different document files
   * @returns {Promise} - Promise resolving to the upload result
   */
  uploadDocuments: async (organizerId, documents) => {
    try {
      const formData = new FormData();
      
      // Add different types of documents to FormData
      Object.keys(documents).forEach(docType => {
        if (documents[docType]) {
          formData.append(docType, documents[docType]);
        }
      });
      
      const response = await api.post(`/api/organizer/${organizerId}/documents`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      return response.data;
    } catch (error) {
      console.error('Error uploading documents:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Update KYC information for organizer
   * @param {string} organizerId - The ID of the organizer
   * @param {Object} kycData - KYC information including PAN, GST, Aadhaar details
   * @returns {Promise} - Promise resolving to the updated KYC data
   */
  updateKYC: async (organizerId, kycData) => {
    try {
      const response = await api.put(`/api/organizer/${organizerId}/kyc`, kycData);
      return response.data;
    } catch (error) {
      console.error('Error updating KYC:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Get organizer's hosted events
   * @param {string} organizerId - The ID of the organizer
   * @param {Object} params - Query parameters like status, page, limit
   * @returns {Promise} - Promise resolving to the hosted events
   */
  getHostedEvents: async (organizerId, params = {}) => {
    try {
      const response = await api.get(`/api/organizer/${organizerId}/events`, { params });
      return response.data;
    } catch (error) {
      console.error('Error getting hosted events:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Get organizer verification status
   * @param {string} organizerId - The ID of the organizer
   * @returns {Promise} - Promise resolving to the verification status
   */
  getVerificationStatus: async (organizerId) => {
    try {
      const response = await api.get(`/api/organizer/${organizerId}/verification-status`);
      return response.data;
    } catch (error) {
      console.error('Error getting verification status:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Submit organizer for approval
   * @param {string} organizerId - The ID of the organizer
   * @returns {Promise} - Promise resolving to the submission result
   */
  submitForApproval: async (organizerId) => {
    try {
      const response = await api.post(`/api/organizer/${organizerId}/submit-approval`);
      return response.data;
    } catch (error) {
      console.error('Error submitting for approval:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Get organizer analytics and statistics
   * @param {string} organizerId - The ID of the organizer
   * @param {Object} params - Query parameters like dateRange, metrics
   * @returns {Promise} - Promise resolving to the analytics data
   */
  getAnalytics: async (organizerId, params = {}) => {
    try {
      const response = await api.get(`/api/organizer/${organizerId}/analytics`, { params });
      return response.data;
    } catch (error) {
      console.error('Error getting organizer analytics:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Update organizer's social links
   * @param {string} organizerId - The ID of the organizer
   * @param {Object} socialLinks - Object containing social media links
   * @returns {Promise} - Promise resolving to the updated organizer
   */
  updateSocialLinks: async (organizerId, socialLinks) => {
    try {
      const response = await api.put(`/api/organizer/${organizerId}/social-links`, socialLinks);
      return response.data;
    } catch (error) {
      console.error('Error updating social links:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Get organizer profile summary
   * @param {string} organizerId - The ID of the organizer
   * @returns {Promise} - Promise resolving to the profile summary
   */
  getProfileSummary: async (organizerId) => {
    try {
      const response = await api.get(`/api/organizer/${organizerId}/summary`);
      return response.data;
    } catch (error) {
      console.error('Error getting profile summary:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Check if organizer name or email is available
   * @param {string} field - Field to check ('organizerName' or 'email')
   * @param {string} value - Value to check
   * @returns {Promise} - Promise resolving to availability status
   */
  checkAvailability: async (field, value) => {
    try {
      const response = await api.get(`/api/organizer/check-availability`, {
        params: { field, value }
      });
      return response.data;
    } catch (error) {
      console.error('Error checking availability:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Get nearby organizers based on location
   * @param {Object} locationParams - Location parameters including lat, lng, radius
   * @returns {Promise} - Promise resolving to nearby organizers
   */
  getNearbyOrganizers: async (locationParams) => {
    try {
      const response = await api.get('/api/organizer/nearby', { params: locationParams });
      return response.data;
    } catch (error) {
      console.error('Error getting nearby organizers:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Link organizer account with user account
   * @param {string} organizerId - The ID of the organizer
   * @param {string} userId - The ID of the user account to link
   * @returns {Promise} - Promise resolving to the linking result
   */
  linkUserAccount: async (organizerId, userId) => {
    try {
      const response = await api.post(`/api/organizer/${organizerId}/link-user`, { userId });
      return response.data;
    } catch (error) {
      console.error('Error linking user account:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Unlink organizer account from user account
   * @param {string} organizerId - The ID of the organizer
   * @returns {Promise} - Promise resolving to the unlinking result
   */
  unlinkUserAccount: async (organizerId) => {
    try {
      const response = await api.delete(`/api/organizer/${organizerId}/unlink-user`);
      return response.data;
    } catch (error) {
      console.error('Error unlinking user account:', error.response?.data || error.message);
      throw error;
    }
  }
};

export default organizerService;