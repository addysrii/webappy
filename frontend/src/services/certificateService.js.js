// src/services/certificateService.js - FIXED VERSION
import api, { API_URL } from './api';

const API_BASE = `${API_URL}/api/certificates`;

const certificateService = {
  // Certificate Verification (Public)
  verifyCertificate: async (certificateId) => {
    try {
      console.log('Verifying certificate:', certificateId);
      console.log('API endpoint:', `${API_BASE}/verify/${certificateId}`);
      
      const response = await api.getData(`${API_BASE}/verify/${certificateId}`);
      
      console.log('Verification result:', response);
      return response;
    } catch (error) {
      console.error('Error verifying certificate:', error);
      
      if (error.response?.status === 404) {
        return {
          valid: false,
          message: 'Certificate not found'
        };
      }

      if (error.message.includes('JSON')) {
        throw new Error('API endpoint not configured properly. Please check your backend routes.');
      }
      
      throw error;
    }
  },

  // Template Management - FIXED
  getTemplates: async (filters = {}) => {
    try {
      console.log('Fetching templates with filters:', filters);
      
      // Build query parameters properly
      const params = new URLSearchParams();
      
      // Extract eventId properly - handle both string and object
      let eventId = filters.eventId;
      if (typeof eventId === 'object' && eventId !== null) {
        eventId = eventId._id || eventId.id;
      }
      
      if (eventId) {
        params.append('eventId', eventId);
        console.log('Added eventId to query:', eventId);
      }
      if (filters.isDefault !== undefined) {
        params.append('isDefault', filters.isDefault.toString());
      }
      if (filters.page) {
        params.append('page', filters.page.toString());
      }
      if (filters.limit) {
        params.append('limit', filters.limit.toString());
      }
      
      const queryString = params.toString();
      const endpoint = queryString ? `/api/certificates/templates?${queryString}` : '/api/certificates/templates';
      
      console.log('Template fetch endpoint:', endpoint);
      console.log('Query params:', Object.fromEntries(params));
      
      const response = await api.getData(endpoint);
      console.log('Templates response:', response);
      
      // Handle different response formats
      if (response.templates) {
        return { data: response.templates, pagination: response.pagination };
      } else if (Array.isArray(response)) {
        return { data: response };
      } else if (response.data) {
        return response;
      } else {
        return { data: [] };
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
      console.error('Error details:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      throw error;
    }
  },

  getTemplate: async (templateId) => {
    try {
      return await api.getData(`/api/certificates/templates/${templateId}`);
    } catch (error) {
      console.error('Error fetching template:', error);
      throw error;
    }
  },

  createTemplate: async (templateData) => {
    try {
      console.log('Creating template with data:', templateData);
      
      // Determine if templateData is FormData or a regular object
      if (templateData instanceof FormData) {
        // Handle FormData directly
        console.log('Sending FormData to server...');
        
        // Log FormData contents for debugging
        for (let [key, value] of templateData.entries()) {
          console.log(`FormData ${key}:`, value);
        }
        
        return await api.postData('/api/certificates/templates', templateData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
      } else {
        // Convert regular object to FormData
        const formData = new FormData();
        
        // Add basic fields
        formData.append('name', templateData.name);
        if (templateData.description) {
          formData.append('description', templateData.description);
        }
        
        // Handle eventId properly
        let eventId = templateData.eventId;
        if (typeof eventId === 'object' && eventId !== null) {
          eventId = eventId._id || eventId.id;
        }
        if (eventId) {
          formData.append('eventId', eventId);
          console.log('Added eventId to form:', eventId);
        }
        
        if (templateData.isDefault !== undefined) {
          formData.append('isDefault', templateData.isDefault.toString());
        }
        
        // Add complex objects as JSON
        if (templateData.design) {
          formData.append('design', JSON.stringify(templateData.design));
        }
        if (templateData.layout) {
          formData.append('layout', JSON.stringify(templateData.layout));
        }
        if (templateData.customFields) {
          formData.append('customFields', JSON.stringify(templateData.customFields));
        }

        // Add file uploads
        if (templateData.backgroundImage) {
          formData.append('backgroundImage', templateData.backgroundImage);
        }
        if (templateData.logo) {
          formData.append('logo', templateData.logo);
        }

        console.log('Sending converted FormData to server...');
        return await api.postData('/api/certificates/templates', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
      }
    } catch (error) {
      console.error('Error creating template:', error);
      throw error;
    }
  },

  updateTemplate: async (templateId, templateData) => {
    try {
      const formData = new FormData();
      
      // Add updated fields
      Object.keys(templateData).forEach(key => {
        if (key === 'backgroundImage' || key === 'logo') {
          if (templateData[key]) {
            formData.append(key, templateData[key]);
          }
        } else if (key === 'eventId') {
          // Handle eventId properly
          let eventId = templateData[key];
          if (typeof eventId === 'object' && eventId !== null) {
            eventId = eventId._id || eventId.id;
          }
          if (eventId) {
            formData.append(key, eventId);
          }
        } else if (typeof templateData[key] === 'object') {
          formData.append(key, JSON.stringify(templateData[key]));
        } else {
          formData.append(key, templateData[key]);
        }
      });

      return await api.putData(`/api/certificates/templates/${templateId}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
    } catch (error) {
      console.error('Error updating template:', error);
      throw error;
    }
  },

  deleteTemplate: async (templateId) => {
    try {
      return await api.deleteData(`/api/certificates/templates/${templateId}`);
    } catch (error) {
      console.error('Error deleting template:', error);
      throw error;
    }
  },

  // Certificate Management - FIXED
  issueCertificates: async (data) => {
    try {
      console.log('=== CERTIFICATE SERVICE DEBUG ===');
      console.log('1. Input data received:', data);
      
      // Handle eventId properly
      let eventId = data.eventId;
      if (typeof eventId === 'object' && eventId !== null) {
        eventId = eventId._id || eventId.id;
      }
      console.log('2. Processed eventId:', eventId, typeof eventId);
      
      // Handle templateId properly
      let templateId = data.templateId;
      if (typeof templateId === 'object' && templateId !== null) {
        templateId = templateId._id || templateId.id;
      }
      console.log('3. Processed templateId:', templateId, typeof templateId);
      
      // Handle recipients properly
      let attendeeIds = data.recipients || data.attendeeIds;
      if (Array.isArray(attendeeIds)) {
        attendeeIds = attendeeIds.map(id => {
          if (typeof id === 'object' && id !== null) {
            return id._id || id.id || id;
          }
          return id;
        });
      }
      console.log('4. Processed attendeeIds:', attendeeIds);
      
      const requestData = {
        eventId,
        templateId,
        attendeeIds,
        customMessage: data.message || data.customMessage,
        sendEmail: data.sendEmail !== false // Default to true
      };
      
      console.log('5. Final request data to send:', requestData);
      console.log('6. Request data JSON:', JSON.stringify(requestData, null, 2));
      
      // Check if all required fields are present
      if (!requestData.eventId) {
        throw new Error('EventId is missing or invalid');
      }
      if (!requestData.templateId) {
        throw new Error('TemplateId is missing or invalid');
      }
      if (!requestData.attendeeIds || requestData.attendeeIds.length === 0) {
        throw new Error('AttendeeIds are missing or empty');
      }
      
      console.log('7. Validation passed, making API call...');
      console.log('8. API endpoint: /api/certificates/issue');
      
      // Make the API call with debugging
      const response = await api.postData('/api/certificates/issue', requestData);
      
      console.log('9. API Response received:');
      console.log('   - Response type:', typeof response);
      console.log('   - Response keys:', Object.keys(response));
      console.log('   - Full response:', response);
      console.log('   - Response JSON:', JSON.stringify(response, null, 2));
      
      // Check response structure
      if (response.success === false) {
        console.log('10. API returned success: false');
        throw new Error(response.error || 'API returned failure status');
      }
      
      if (response.error) {
        console.log('10. API returned error:', response.error);
        throw new Error(response.error);
      }
      
      // Log success details
      const issuedCount = response.issued || response.data?.issued || 0;
      const errorCount = response.errors || response.data?.errors || 0;
      
      console.log('10. Success details:');
      console.log('   - Issued count:', issuedCount);
      console.log('   - Error count:', errorCount);
      console.log('   - Certificates:', response.certificates?.length || 0);
      
      if (issuedCount === 0) {
        console.warn('11. WARNING: No certificates were issued!');
        console.warn('   - Check backend logs for detailed error information');
        console.warn('   - Response data:', response.data);
        console.warn('   - Error details:', response.errorDetails);
      }
      
      console.log('=== CERTIFICATE SERVICE DEBUG END ===');
      
      return response;
    } catch (error) {
      console.error('=== CERTIFICATE SERVICE ERROR ===');
      console.error('Error type:', error.constructor.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      
      if (error.response) {
        console.error('HTTP Response Error:');
        console.error('- Status:', error.response.status);
        console.error('- Status Text:', error.response.statusText);
        console.error('- Headers:', error.response.headers);
        console.error('- Data:', error.response.data);
        
        // Log specific error details
        if (error.response.status === 403) {
          console.error('PERMISSION DENIED:');
          console.error('- Make sure you are the event creator or a host');
          console.error('- Check user permissions in the event attendees list');
        } else if (error.response.status === 400) {
          console.error('BAD REQUEST:');
          console.error('- Check if all required fields are provided');
          console.error('- Verify ObjectId formats');
        } else if (error.response.status === 404) {
          console.error('NOT FOUND:');
          console.error('- Event or template might not exist');
          console.error('- Check if IDs are correct');
        }
      } else if (error.request) {
        console.error('Network Error:');
        console.error('- Request was made but no response received');
        console.error('- Check network connection and server status');
        console.error('- Request details:', error.request);
      } else {
        console.error('Client Error:');
        console.error('- Error occurred before request was sent');
        console.error('- Check input data and validation');
      }
      
      console.error('=== CERTIFICATE SERVICE ERROR END ===');
      throw error;
    }
  },

  getEventCertificates: async (filters = {}) => {
    try {
      // Handle eventId properly from filters
      let eventId = filters.eventId;
      if (typeof eventId === 'object' && eventId !== null) {
        eventId = eventId._id || eventId.id;
      }
      
      console.log('Fetching certificates for event:', eventId);
      
      const params = new URLSearchParams();
      if (filters.status) {
        params.append('status', filters.status);
      }
      if (filters.page) {
        params.append('page', filters.page.toString());
      }
      if (filters.limit) {
        params.append('limit', filters.limit.toString());
      }
      
      const queryString = params.toString();
      const endpoint = queryString ? 
        `/api/certificates/event/${eventId}?${queryString}` : 
        `/api/certificates/event/${eventId}`;
      
      console.log('Certificate fetch endpoint:', endpoint);
      
      const response = await api.getData(endpoint);
      console.log('Certificates response:', response);
      
      // Handle different response formats
      if (response.certificates) {
        return { data: response.certificates, pagination: response.pagination };
      } else if (Array.isArray(response)) {
        return { data: response };
      } else if (response.data) {
        return response;
      } else {
        return { data: [] };
      }
    } catch (error) {
      console.error('Error fetching event certificates:', error);
      throw error;
    }
  },

  getMyCertificates: async (page = 1, limit = 10) => {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString()
      });
      
      const response = await api.getData(`/api/certificates/my?${params}`);
      
      // Handle different response formats
      if (response.certificates) {
        return { data: response.certificates, pagination: response.pagination };
      } else if (Array.isArray(response)) {
        return { data: response };
      } else if (response.data) {
        return response;
      } else {
        return { data: [] };
      }
    } catch (error) {
      console.error('Error fetching certificates:', error);
      throw error;
    }
  },

  // Certificate Download (Public)
  downloadCertificate: async (certificateId) => {
    try {
      const response = await api.getData(`/api/certificates/${certificateId}/download`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(response);
      const a = document.createElement('a');
      a.href = url;
      a.download = `certificate-${certificateId}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      return { success: true };
    } catch (error) {
      console.error('Error downloading certificate:', error);
      throw error;
    }
  },

  // Certificate Revocation
  revokeCertificate: async (certificateId, reason = '') => {
    try {
      return await api.putData(`/api/certificates/${certificateId}/revoke`, { reason });
    } catch (error) {
      console.error('Error revoking certificate:', error);
      throw error;
    }
  },

  // Generate certificate with proper URL handling
  generateCertificate: async (data) => {
    try {
      // For demo purposes, create a mock certificate
      const certificateId = data.certificateId || 'CERT-' + Math.random().toString(36).substr(2, 9).toUpperCase();
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return {
        id: certificateId,
        verifyUrl: `${window.location.origin}/verify-certificate/${certificateId}`
      };
    } catch (error) {
      console.error('Error in generateCertificate:', error);
      throw error;
    }
  },

  // Utility functions
  generateCertificateUrl: (certificateId) => {
    return `${window.location.origin}/verify-certificate/${certificateId}`;
  },

  generateQRData: (certificate) => {
    return JSON.stringify({
      certificateId: certificate.certificateId,
      verificationUrl: certificate.verificationUrl,
      recipient: certificate.certificateData?.recipientName,
      event: certificate.certificateData?.eventName,
      issuedAt: certificate.issuedAt
    });
  },

  // Validate certificate URL
  validateCertificateUrl: (url) => {
    try {
      const urlObj = new URL(url);
      return urlObj.pathname.includes('/verify-certificate/');
    } catch (error) {
      return false;
    }
  },

  // Extract certificate ID from URL
  extractCertificateIdFromUrl: (url) => {
    try {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split('/');
      const index = pathParts.indexOf('verify-certificate');
      if (index !== -1 && pathParts[index + 1]) {
        return pathParts[index + 1];
      }
      return null;
    } catch (error) {
      return null;
    }
  }
};

export default certificateService;