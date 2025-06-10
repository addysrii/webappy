import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Download, Award, QrCode, Eye, RefreshCw, Upload, Image, Move, RotateCcw, Trash2, TestTube, User, Building } from 'lucide-react';
import QRCode from 'react-qr-code';
import html2canvas from 'html2canvas';
import { useAuth } from '../context/AuthContext';
import api, { testConnection, checkServerConnection, API_URL } from '../services/api';

const QRCertificateGenerator = () => {
  const { user, token } = useAuth();
  
  const [formData, setFormData] = useState({
    recipientName: '',
    courseName: '',
    completionDate: '',
    issuerName: '',
    certificateId: '',
    description: '',
    eventId: ''
  });

  const [designImage, setDesignImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  
  const [textElements, setTextElements] = useState([
    { id: 'recipient', label: 'Recipient Name', x: 50, y: 40, fontSize: 24, color: '#1f2937', fontWeight: 'bold', textAlign: 'center' },
    { id: 'course', label: 'Course Name', x: 50, y: 55, fontSize: 18, color: '#374151', fontWeight: 'normal', textAlign: 'center' },
    { id: 'date', label: 'Date', x: 20, y: 80, fontSize: 14, color: '#6b7280', fontWeight: 'normal', textAlign: 'left' },
    { id: 'issuer', label: 'Issuer', x: 80, y: 80, fontSize: 14, color: '#6b7280', fontWeight: 'normal', textAlign: 'right' },
    { id: 'certId', label: 'Certificate ID', x: 20, y: 85, fontSize: 12, color: '#9ca3af', fontWeight: 'normal', textAlign: 'left' }
  ]);

  const [qrSettings, setQrSettings] = useState({
    x: 85,
    y: 15,
    size: 120,
    color: '#000000'
  });

  const [showPreview, setShowPreview] = useState(false);
  const [qrData, setQrData] = useState('');
  const [dragElement, setDragElement] = useState(null);
  const [activeTab, setActiveTab] = useState('upload');
  const [isProcessing, setIsProcessing] = useState(false);
  const [backendStatus, setBackendStatus] = useState('unknown');
  
  const fileInputRef = useRef(null);
  const certificateRef = useRef(null);

  // ✅ Initialize user data when component mounts
  useEffect(() => {
    if (user) {
      console.log('🔐 User authenticated:', user);
      setFormData(prev => ({
        ...prev,
        issuerName: user.firstName && user.lastName 
          ? `${user.firstName} ${user.lastName}` 
          : user.email || 'Certificate Authority',
        completionDate: new Date().toISOString().split('T')[0]
      }));
    }
  }, [user]);

  // ✅ Test backend connection on mount
  useEffect(() => {
    const initialBackendTest = async () => {
      if (token) {
        await testBackendConnection();
      }
    };
    initialBackendTest();
  }, [token]);

  // Handle file upload
  const handleFileUpload = useCallback((event) => {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
      setDesignImage(file);
      
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
      };
      reader.readAsDataURL(file);
    } else {
      alert('Please upload a valid image file (PNG, JPG, JPEG, SVG)');
    }
  }, []);

  // Generate random certificate ID
  const generateCertificateId = () => {
    const timestamp = Date.now();
    const randomPart = Math.random().toString(36).substr(2, 6).toUpperCase();
    const id = `CERT-${timestamp}-${randomPart}`;
    setFormData({ ...formData, certificateId: id });
    return id;
  };

  // Handle input changes
  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  // Update text element properties
  const updateTextElement = (id, property, value) => {
    setTextElements(prev => 
      prev.map(element => 
        element.id === id ? { ...element, [property]: value } : element
      )
    );
  };

  // Update QR settings
  const updateQRSettings = (property, value) => {
    setQrSettings(prev => ({ ...prev, [property]: value }));
  };

  // Get text content for each element
  const getTextContent = (elementId) => {
    switch(elementId) {
      case 'recipient': return formData.recipientName || 'John Doe';
      case 'course': return formData.courseName || '';
      case 'date': return formData.completionDate || '';
      case 'issuer': return formData.issuerName || '';
      case 'certId': return formData.certificateId || '';
      default: return '';
    }
  };
  // ✅ Enhanced validation with eventId checking
  const validateAndFixFormData = () => {
    console.log('🔍 Validating form data...');
    
    const errors = [];
    const fixes = [];
    
    if (!formData.recipientName?.trim()) {
      errors.push('Recipient name is required');
    }
    
    if (!designImage) {
      errors.push('Please upload a certificate design');
    }
    
    // Check for invalid eventId format
    if (formData.eventId === 'manual-certificate') {
      setFormData(prev => ({ ...prev, eventId: '' }));
      fixes.push('Cleared invalid eventId format');
    }
    
    if (!formData.certificateId?.trim()) {
      const newId = generateCertificateId();
      fixes.push(`Generated certificate ID: ${newId}`);
    }
    
    if (!formData.issuerName?.trim() && user) {
      const defaultIssuer = user.firstName && user.lastName 
        ? `${user.firstName} ${user.lastName}` 
        : user.email || 'Certificate Authority';
      setFormData(prev => ({ ...prev, issuerName: defaultIssuer }));
      fixes.push(`Set issuer to authenticated user: ${defaultIssuer}`);
    }
    
    if (!formData.courseName?.trim()) {
      const defaultCourse = 'Certificate of Achievement';
      setFormData(prev => ({ ...prev, courseName: defaultCourse }));
      fixes.push(`Set default course name: ${defaultCourse}`);
    }
    
    if (!formData.completionDate) {
      const today = new Date().toISOString().split('T')[0];
      setFormData(prev => ({ ...prev, completionDate: today }));
      fixes.push(`Set completion date to today: ${today}`);
    }
    
    if (fixes.length > 0) {
      console.log('🔧 Auto-fixes applied:', fixes);
    }
    
    if (errors.length > 0) {
      alert('Please fix the following errors:\n' + errors.join('\n'));
      return false;
    }
    
    return true;
  };

  // ✅ Test backend connection using API service
  const testBackendConnection = async () => {
    try {
      console.log('🧪 Testing backend connection to:', API_URL);
      setBackendStatus('testing');
      
      if (!token) {
        console.warn('⚠️ No authentication token available');
        setBackendStatus('error');
        return false;
      }
      
      const result = await testConnection();
      console.log('🧪 Backend test result:', result);
      
      if (result.success) {
        console.log('✅ Backend connection successful');
        setBackendStatus('connected');
        return true;
      } else {
        console.warn('⚠️ Backend connection issue:', result.error);
        setBackendStatus('error');
        return false;
      }
    } catch (error) {
      console.error('❌ Backend connection test failed:', error);
      setBackendStatus('error');
      return false;
    }
  };

  // ✅ Generate certificate with auth validation
  const generateCertificate = async () => {
    console.log('🎯 Starting certificate generation...');
    
    if (!user || !token) {
      alert('Please log in to generate certificates');
      return;
    }
    
    if (!validateAndFixFormData()) {
      return;
    }

    setIsProcessing(true);
    
    try {
      const backendOk = await testBackendConnection();
      if (!backendOk) {
        console.warn('⚠️ Backend connection failed, continuing with local generation only');
      }

      const certificateId = formData.certificateId || generateCertificateId();
      
      if (!formData.certificateId) {
        setFormData(prev => ({ ...prev, certificateId: certificateId }));
      }

      const verificationUrl = `https://meetkats.com/certificates/${certificateId}`;
      
      setQrData(verificationUrl);
      setShowPreview(true);
      
      console.log('✅ Certificate generated with QR code:', verificationUrl);
      
    } catch (error) {
      console.error('❌ Certificate generation error:', error);
      alert('Failed to generate certificate. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  // ✅ Helper function to handle successful saves
  const handleSuccessfulSave = (result) => {
    let actualCertificateId, actualVerificationUrl;
    
    if (result.certificate) {
      actualCertificateId = result.certificate.certificateId;
      actualVerificationUrl = result.certificate.verificationUrl;
    } else if (result.certificates && result.certificates.length > 0) {
      const cert = result.certificates[0];
      actualCertificateId = cert.certificateId;
      actualVerificationUrl = cert.verificationUrl;
    } else if (result.success) {
      actualCertificateId = formData.certificateId;
      actualVerificationUrl = `https://meetkats.com/certificates/${formData.certificateId}`;
    }
    
    if (actualCertificateId && actualVerificationUrl) {
      console.log('🔄 Updating QR code with actual certificate data');
      setQrData(actualVerificationUrl);
      setFormData(prev => ({ ...prev, certificateId: actualCertificateId }));
    }
    
    alert(`✅ Certificate saved successfully!\n\nCertificate ID: ${actualCertificateId || formData.certificateId}\nCreated by: ${user.email}\nBackend: ${API_URL}`);
  };

  // ✅ Helper function to handle save errors
  const handleSaveError = (saveError) => {
    let errorMessage = '⚠️ Certificate downloaded but failed to save to backend.\n\n';
    errorMessage += `User: ${user.email}\nBackend URL: ${API_URL}\n\n`;
    
    if (saveError.message?.includes('Network Error')) {
      errorMessage += 'Network error: Cannot connect to backend server.';
    } else if (saveError.message?.includes('timeout')) {
      errorMessage += 'Timeout error: Backend server took too long to respond.';
    } else if (saveError.response?.status === 401) {
      errorMessage += 'Authentication error: Please log in again.';
    } else if (saveError.response?.status === 403) {
      errorMessage += 'Permission error: You may not have permission to create certificates.';
    } else if (saveError.response?.status === 400) {
      errorMessage += 'Validation error: Check your form data and try again.';
    } else if (saveError.response?.status >= 500) {
      errorMessage += 'Server error: Backend server is experiencing issues.';
    } else {
      errorMessage += `Error details: ${saveError.message}`;
    }
    
    errorMessage += '\n\nYou can still use the downloaded certificate locally.';
    alert(errorMessage);
  };

  // ✅ FIXED: Download and save certificate with proper eventId handling
  const downloadCertificate = async () => {
    if (!certificateRef.current) {
      alert('Certificate preview not available. Please generate the certificate first.');
      return;
    }

    if (!user || !token) {
      alert('Please log in to save certificates');
      return;
    }

    setIsProcessing(true);
    
    try {
      console.log('🎯 Starting certificate download process...');
      
      const canvas = await html2canvas(certificateRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        allowTaint: true,
        foreignObjectRendering: true
      });
      const dataURL = canvas.toDataURL('image/png');

      // Download the certificate immediately
      const link = document.createElement('a');
      link.href = dataURL;
      link.download = `${formData.recipientName?.replace(/[^a-z0-9]/gi, '_') || 'certificate'}.png`;
      link.rel = 'noopener noreferrer';
      link.click();

      console.log('✅ Certificate downloaded locally');

      // ✅ FIXED: Save to backend with proper eventId handling
      try {
        console.log('💾 Attempting to save certificate to backend:', API_URL);
        console.log('🔐 Using authenticated user:', user.id);
        
        const certificateData = {
          recipientName: formData.recipientName,
          eventName: formData.courseName || 'Certificate Achievement',
          completionDate: formData.completionDate || new Date().toISOString(),
          issuerName: formData.issuerName || `${user.firstName} ${user.lastName}`,
          certificateId: formData.certificateId,
          certificateImage: dataURL,
          description: formData.description || '',
          createdBy: user.id,
          createdByEmail: user.email
        };

        console.log('📤 Certificate data prepared for authenticated backend');

        // ✅ FIXED: Determine the correct approach based on eventId
        const hasValidEventId = formData.eventId && 
                                formData.eventId.trim() !== '' && 
                                formData.eventId !== 'manual-certificate' &&
                                formData.eventId.length > 5;

        let saveSuccessful = false;
        let lastError = null;

        if (hasValidEventId) {
          // Try event-based certificate creation
          console.log('📅 Attempting event-based certificate creation');
          
          try {
            const eventRequestData = {
              eventId: formData.eventId,
              templateId: 'default-template',
              attendeeIds: [],
              certificateImage: dataURL,
              customMessage: formData.description || '',
              manualCertificate: {
                ...certificateData,
                eventId: formData.eventId
              }
            };

            const result = await api.postData('/api/certificates/issue', eventRequestData);
            
            if (result && (result.success || result.certificate || result.certificates)) {
              console.log('✅ Event-based certificate saved successfully');
              handleSuccessfulSave(result);
              saveSuccessful = true;
            }
          } catch (eventError) {
            console.log('❌ Event-based creation failed:', eventError.message);
            lastError = eventError.message;
          }
        }

        // If event-based failed or no valid eventId, try manual endpoints
        if (!saveSuccessful) {
          console.log('📋 Attempting manual certificate creation');
          
          const manualEndpoints = [
            '/api/certificates/manual',
            '/api/certificates/create',
            '/api/certificates'
          ];

          for (const endpoint of manualEndpoints) {
            try {
              console.log(`📤 Trying manual endpoint: ${API_URL}${endpoint}`);
              
              const result = await api.postData(endpoint, certificateData);
              
              if (result && (result.success || result.certificate || result.certificates)) {
                console.log(`✅ Manual certificate saved via ${endpoint}`);
                handleSuccessfulSave(result);
                saveSuccessful = true;
                break;
              }
            } catch (endpointError) {
              console.log(`❌ Error with ${endpoint}:`, endpointError.message);
              lastError = endpointError.message;
              continue;
            }
          }
        }

        if (!saveSuccessful) {
          console.error('❌ All endpoints failed. Last error:', lastError);
          alert(`⚠️ Certificate downloaded successfully but could not save to backend.\n\nUser: ${user.email}\nBackend URL: ${API_URL}\nLast error: ${lastError}\n\nPossible issues:\n- Backend validation requirements\n- Server configuration\n- Network connectivity\n\nYou can still use the downloaded certificate locally.`);
        }
        
      } catch (saveError) {
        console.error('❌ Error saving certificate to backend:', saveError);
        handleSaveError(saveError);
      }
      
    } catch (error) {
      console.error('❌ Download error:', error);
      alert('Failed to download the certificate. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };
  // ✅ Check backend status using API service
  const checkBackendStatus = async () => {
    try {
      console.log('🔍 Checking authenticated backend status:', API_URL);
      
      if (!token) {
        return { available: false, endpoint: null, error: 'Not authenticated' };
      }
      
      const result = await checkServerConnection();
      
      if (result.success) {
        console.log('✅ Authenticated backend server is reachable');
        
        const endpoints = ['/api/health', '/api/certificates', '/api/status'];
        
        for (const endpoint of endpoints) {
          try {
            console.log(`🧪 Testing authenticated endpoint: ${API_URL}${endpoint}`);
            
            const response = await api.getData(endpoint);
            console.log(`✅ Found working authenticated endpoint: ${API_URL}${endpoint}`);
            return { available: true, endpoint: `${API_URL}${endpoint}` };
          } catch (e) {
            console.log(`❌ Authenticated endpoint ${endpoint} not available:`, e.message);
            continue;
          }
        }
        
        return { available: true, endpoint: `${API_URL} (server reachable but no specific endpoints found)` };
      } else {
        console.log('❌ Authenticated backend server not reachable:', result.error);
        return { available: false, endpoint: null, error: result.error };
      }
    } catch (error) {
      console.error('❌ Authenticated backend status check failed:', error);
      return { available: false, endpoint: null, error: error.message };
    }
  };

  // ✅ Test QR code function
  const testQRCode = () => {
    if (!qrData) {
      alert('Please generate a certificate first');
      return;
    }
    
    console.log('🧪 Testing QR Code:', qrData);
    console.log('🌐 API Service URL:', API_URL);
    console.log('🔐 User:', user?.email);
    
    const testWindow = window.open(qrData, '_blank');
    
    if (!testWindow) {
      alert(`QR Code URL: ${qrData}\n\nAPI Service: ${API_URL}\nUser: ${user?.email}\n\nYou can copy this URL and test it manually.`);
    } else {
      console.log('✅ QR Code test window opened');
    }
  };

  // Reset design
  const resetDesign = () => {
    setDesignImage(null);
    setImagePreview(null);
    setShowPreview(false);
    setQrData('');
    setBackendStatus('unknown');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // ✅ QR Code component without includeMargin prop
  const QRCodeDisplay = ({ data, size, color }) => {
    const [qrError, setQrError] = useState(false);
    
    if (!data) {
      return (
        <div className="bg-gray-100 p-3 rounded-lg shadow-lg flex items-center justify-center" style={{ width: size, height: size }}>
          <span className="text-gray-500 text-sm">No QR Data</span>
        </div>
      );
    }

    if (qrError) {
      return (
        <div className="bg-red-100 p-3 rounded-lg shadow-lg flex items-center justify-center" style={{ width: size, height: size }}>
          <span className="text-red-500 text-sm">QR Error</span>
        </div>
      );
    }

    return (
      <div className="bg-white p-4 rounded-lg shadow-lg" style={{ display: 'inline-block' }}>
        <QRCode
          value={data}
          size={size - 32}
          level="M"
          style={{ 
            height: "auto", 
            maxWidth: "100%", 
            width: "100%",
            display: "block"
          }}
          bgColor="#ffffff"
          fgColor={color}
          onError={() => {
            console.error('❌ QR Code generation error for data:', data);
            setQrError(true);
          }}
        />
      </div>
    );
  };

  // ✅ Enhanced Debug Panel with auth and API service info
  const EnhancedDebugPanel = () => {
    const [backendCheck, setBackendCheck] = useState(null);
    const [apiInfo, setApiInfo] = useState(null);
    
    const runBackendCheck = async () => {
      const result = await checkBackendStatus();
      setBackendCheck(result);
    };
    
    const getApiInfo = async () => {
      try {
        const connectionTest = await testConnection();
        setApiInfo({
          apiUrl: API_URL,
          connected: connectionTest.success,
          networkState: connectionTest.networkState,
          error: connectionTest.error,
          details: connectionTest.details
        });
      } catch (error) {
        setApiInfo({
          apiUrl: API_URL,
          connected: false,
          error: error.message
        });
      }
    };
    
    useEffect(() => {
      if (token) {
        getApiInfo();
      }
    }, [token]);
    
    if (!qrData && backendStatus === 'unknown' && !apiInfo) return null;
    
    return (
      <div className="mt-8 p-6 bg-gray-50 rounded-xl border border-gray-200">
        <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
          <TestTube className="w-4 h-4 mr-2" />
          Debug Information
        </h4>
        <div className="space-y-2 text-sm text-gray-600">
          {/* Auth Information */}
          <div className="border-b pb-2 mb-3">
            <div><strong>🔐 Authentication:</strong></div>
            <div className="ml-4">
              <div><strong>User:</strong> {user ? `${user.email} (${user.id})` : 'Not authenticated'}</div>
              <div><strong>Token:</strong> {token ? 'Present ✓' : 'Missing ✗'}</div>
              <div><strong>Role:</strong> {user?.role || 'N/A'}</div>
            </div>
          </div>
          
          <div><strong>Certificate ID:</strong> {formData.certificateId || 'Not generated'}</div>
          <div><strong>QR Data:</strong> <code className="bg-white px-2 py-1 rounded break-all">{qrData || 'Not generated'}</code></div>
          <div><strong>Event ID:</strong> {formData.eventId || 'Not set (Manual Certificate)'}</div>
          <div><strong>Certificate Type:</strong> {formData.eventId ? 'Event-based' : 'Manual'}</div>
          
          {/* API Service Information */}
          <div className="border-t pt-2 mt-3">
            <div><strong>API Service URL:</strong> <code className="bg-white px-2 py-1 rounded text-xs">{API_URL}</code></div>
            {apiInfo && (
              <>
                <div><strong>API Connection:</strong> 
                  <span className={`ml-2 px-2 py-1 rounded text-xs ${
                    apiInfo.connected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {apiInfo.connected ? 'Connected ✓' : 'Disconnected ✗'}
                  </span>
                </div>
                {apiInfo.networkState && (
                  <div><strong>Network State:</strong> <span className="text-xs">{apiInfo.networkState}</span></div>
                )}
                {apiInfo.error && (
                  <div><strong>API Error:</strong> <span className="text-red-600 text-xs">{apiInfo.error}</span></div>
                )}
              </>
            )}
          </div>
          
          <div><strong>Backend Status:</strong> 
            <span className={`ml-2 px-2 py-1 rounded text-xs ${
              backendStatus === 'connected' ? 'bg-green-100 text-green-800' :
              backendStatus === 'error' ? 'bg-red-100 text-red-800' :
              backendStatus === 'testing' ? 'bg-yellow-100 text-yellow-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {backendStatus === 'connected' ? 'Connected ✓' :
               backendStatus === 'error' ? 'Error ✗' :
               backendStatus === 'testing' ? 'Testing...' :
               'Unknown'}
            </span>
          </div>
          
          {backendCheck && (
            <div><strong>Available Endpoints:</strong> 
              <span className={`ml-2 px-2 py-1 rounded text-xs ${
                backendCheck.available ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {backendCheck.available ? `Found: ${backendCheck.endpoint}` : `None found: ${backendCheck.error || 'Unknown error'}`}
              </span>
            </div>
          )}
          
          <div><strong>Generated At:</strong> {new Date().toISOString()}</div>
          
          <div className="flex gap-2 mt-3 flex-wrap">
            <button
              onClick={() => qrData && navigator.clipboard.writeText(qrData)}
              disabled={!qrData}
              className="bg-blue-500 disabled:bg-gray-400 text-white px-3 py-1 rounded text-xs hover:bg-blue-600 transition-colors"
            >
              Copy QR URL
            </button>
            <button
              onClick={testQRCode}
              disabled={!qrData}
              className="bg-green-500 disabled:bg-gray-400 text-white px-3 py-1 rounded text-xs hover:bg-green-600 transition-colors"
            >
              Test QR Code
            </button>
            <button
              onClick={testBackendConnection}
              className="bg-purple-500 text-white px-3 py-1 rounded text-xs hover:bg-purple-600 transition-colors"
            >
              Test Backend
            </button>
            <button
              onClick={runBackendCheck}
              className="bg-orange-500 text-white px-3 py-1 rounded text-xs hover:bg-orange-600 transition-colors"
            >
              Check Endpoints
            </button>
            <button
              onClick={getApiInfo}
              className="bg-indigo-500 text-white px-3 py-1 rounded text-xs hover:bg-indigo-600 transition-colors"
            >
              Refresh API Info
            </button>
          </div>
        </div>
      </div>
    );
  };
  // ✅ Status indicator component
  const StatusIndicator = () => {
    const getStatusInfo = () => {
      if (!user || !token) {
        return { color: 'bg-red-500', text: 'Not Authenticated', icon: '🔐' };
      }
      if (isProcessing) {
        return { color: 'bg-yellow-500', text: 'Processing...', icon: '⏳' };
      }
      if (!designImage) {
        return { color: 'bg-gray-500', text: 'Upload Design', icon: '📁' };
      }
      if (!showPreview) {
        return { color: 'bg-blue-500', text: 'Ready to Generate', icon: '🎯' };
      }
      if (qrData) {
        return { color: 'bg-green-500', text: 'Certificate Ready', icon: '✅' };
      }
      return { color: 'bg-gray-500', text: 'Unknown Status', icon: '❓' };
    };

    const status = getStatusInfo();

    return (
      <div className="flex items-center mb-4">
        <div className={`w-3 h-3 rounded-full ${status.color} mr-2`}></div>
        <span className="text-sm font-medium text-gray-700">
          {status.icon} {status.text}
        </span>
        {user && (
          <span className="ml-4 text-xs text-gray-500">
            Logged in as: {user.email}
          </span>
        )}
      </div>
    );
  };

  // ✅ Enhanced Event ID input with validation
  const EventIdInput = () => {
    const isValidEventId = !formData.eventId || 
                          (formData.eventId.trim() !== '' && 
                           formData.eventId !== 'manual-certificate' &&
                           formData.eventId.length > 5);

    return (
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Event ID (Optional)
        </label>
        <input
          type="text"
          name="eventId"
          value={formData.eventId}
          onChange={handleInputChange}
          disabled={isProcessing}
          className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none transition-colors disabled:opacity-50 ${
            formData.eventId && !isValidEventId 
              ? 'border-yellow-400 focus:border-yellow-500 bg-yellow-50' 
              : 'border-gray-200 focus:border-blue-500'
          }`}
          placeholder="Enter valid event ID (leave empty for manual certificate)"
        />
        {formData.eventId && !isValidEventId && (
          <p className="text-xs text-yellow-600 mt-1">
            ⚠️ Invalid event ID format. Leave empty for manual certificates or enter a valid event ID.
          </p>
        )}
        {formData.eventId && isValidEventId && (
          <p className="text-xs text-green-600 mt-1">
            ✓ Valid event ID - will attempt event-based certificate creation
          </p>
        )}
      </div>
    );
  };

  // ✅ Enhanced form validation indicator
  const FormValidationIndicator = () => {
    const validations = [
      { field: 'auth', label: 'User Authentication', valid: !!(user && token) },
      { field: 'recipientName', label: 'Recipient Name', valid: !!formData.recipientName?.trim() },
      { field: 'courseName', label: 'Course/Event Name', valid: !!formData.courseName?.trim(), optional: true },
      { field: 'issuerName', label: 'Issuer Name', valid: !!formData.issuerName?.trim(), optional: true },
      { field: 'certificateId', label: 'Certificate ID', valid: !!formData.certificateId?.trim(), optional: true },
      { field: 'design', label: 'Design Upload', valid: !!designImage },
      { 
        field: 'eventId', 
        label: 'Event ID (Optional)', 
        valid: !formData.eventId || (formData.eventId.trim() !== '' && formData.eventId !== 'manual-certificate'),
        optional: true,
        warning: formData.eventId === 'manual-certificate' ? 'Invalid eventId format' : null
      }
    ];

    const requiredValidations = validations.filter(v => !v.optional);
    const validCount = requiredValidations.filter(v => v.valid).length;
    const totalRequired = requiredValidations.length;
    const hasWarnings = validations.some(v => v.warning);

    return (
      <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-blue-800">
            Form Completion: {validCount}/{totalRequired} Required Fields
          </span>
          <div className="w-16 bg-blue-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(validCount / totalRequired) * 100}%` }}
            />
          </div>
        </div>
        
        {hasWarnings && (
          <div className="mb-2 p-2 bg-yellow-50 border border-yellow-200 rounded">
            <p className="text-xs text-yellow-800 font-medium">⚠️ Warnings:</p>
            {validations.filter(v => v.warning).map(validation => (
              <p key={validation.field} className="text-xs text-yellow-700">
                • {validation.label}: {validation.warning}
              </p>
            ))}
          </div>
        )}
        
        <div className="space-y-1">
          {validations.map(validation => (
            <div key={validation.field} className="flex items-center text-xs">
              <span className={`mr-2 ${
                validation.warning ? 'text-yellow-600' :
                validation.valid ? 'text-green-600' : 
                validation.optional ? 'text-yellow-600' : 'text-red-600'
              }`}>
                {validation.warning ? '⚠' :
                 validation.valid ? '✓' : 
                 validation.optional ? '○' : '✗'}
              </span>
              <span className={`${
                validation.warning ? 'text-yellow-700' :
                validation.valid ? 'text-green-700' : 
                validation.optional ? 'text-yellow-700' : 'text-red-700'
              }`}>
                {validation.label} {validation.optional && '(Optional)'}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // ✅ Authentication check component
  const AuthenticationStatus = () => {
    if (!user || !token) {
      return (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
          <div className="flex items-center">
            <User className="w-5 h-5 text-red-600 mr-2" />
            <h4 className="font-semibold text-red-800">Authentication Required</h4>
          </div>
          <p className="text-red-700 text-sm mt-2">
            Please log in to generate and save certificates. You can still preview certificates without authentication.
          </p>
        </div>
      );
    }

    return (
      <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <User className="w-5 h-5 text-green-600 mr-2" />
            <h4 className="font-semibold text-green-800">Authenticated User</h4>
          </div>
          <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
            {user.role || 'user'}
          </span>
        </div>
        <div className="text-green-700 text-sm mt-2">
          <p><strong>Email:</strong> {user.email}</p>
          {user.firstName && user.lastName && (
            <p><strong>Name:</strong> {user.firstName} {user.lastName}</p>
          )}
        </div>
      </div>
    );
  };
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-16">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <div className="flex items-center justify-center mb-4">
            <Upload className="w-12 h-12 mr-4" />
            <h1 className="text-4xl md:text-5xl font-bold">Certificate Generator</h1>
          </div>
          <p className="text-xl opacity-90 max-w-2xl mx-auto">
            Create professional certificates with scannable QR codes for verification
          </p>
          <StatusIndicator />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Authentication Status */}
        <AuthenticationStatus />

        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-2 mb-8 bg-white rounded-xl p-2 shadow-lg">
          <button
            onClick={() => setActiveTab('upload')}
            className={`flex items-center px-4 py-2 rounded-lg font-medium transition-all ${
              activeTab === 'upload' 
                ? 'bg-blue-600 text-white shadow-md' 
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Upload className="w-4 h-4 mr-2" />
            Upload Design
          </button>
          <button
            onClick={() => setActiveTab('content')}
            className={`flex items-center px-4 py-2 rounded-lg font-medium transition-all ${
              activeTab === 'content' 
                ? 'bg-blue-600 text-white shadow-md' 
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Award className="w-4 h-4 mr-2" />
            Certificate Content
          </button>
          <button
            onClick={() => setActiveTab('position')}
            className={`flex items-center px-4 py-2 rounded-lg font-medium transition-all ${
              activeTab === 'position' 
                ? 'bg-blue-600 text-white shadow-md' 
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Move className="w-4 h-4 mr-2" />
            Position Elements
          </button>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Panel - Controls */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Upload Design Tab */}
            {activeTab === 'upload' && (
              <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center">
                    <Image className="w-8 h-8 text-blue-600 mr-3" />
                    <h2 className="text-2xl font-bold text-gray-800">Upload Certificate Design</h2>
                  </div>
                  <button
                    onClick={resetDesign}
                    disabled={isProcessing}
                    className="text-gray-500 hover:text-gray-700 px-3 py-1 rounded-lg hover:bg-gray-100 transition-colors text-sm flex items-center disabled:opacity-50"
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Clear
                  </button>
                </div>

                <FormValidationIndicator />

                <div className="space-y-6">
                  {/* File Upload Area */}
                  <div 
                    className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center hover:border-blue-400 transition-colors cursor-pointer"
                    onClick={() => !isProcessing && fileInputRef.current?.click()}
                  >
                    <Upload className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-700 mb-2">
                      Upload Your Certificate Design
                    </h3>
                    <p className="text-gray-500 mb-4">
                      Click to upload or drag and drop your certificate template
                    </p>
                    <p className="text-sm text-gray-400">
                      Supports PNG, JPG, JPEG, SVG • Max 10MB
                    </p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      disabled={isProcessing}
                      className="hidden"
                    />
                  </div>

                  {/* Design Tips */}
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                    <h4 className="font-semibold text-blue-800 mb-3">Design Tips for Better QR Scanning:</h4>
                    <ul className="space-y-2 text-blue-700 text-sm">
                      <li>• Use high-resolution images (300 DPI recommended)</li>
                      <li>• Leave adequate white space around QR code area</li>
                      <li>• Ensure QR code area has good contrast (white background recommended)</li>
                      <li>• QR code should be at least 1cm x 1cm when printed</li>
                      <li>• Test QR code scanning before finalizing design</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Certificate Content Tab */}
            {activeTab === 'content' && (
              <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
                <div className="flex items-center mb-8">
                  <Award className="w-8 h-8 text-blue-600 mr-3" />
                  <h2 className="text-2xl font-bold text-gray-800">Certificate Content</h2>
                </div>

                <FormValidationIndicator />

                <div className="grid md:grid-cols-2 gap-6">
                  <EventIdInput />

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Recipient Name *
                    </label>
                    <input
                      type="text"
                      name="recipientName"
                      value={formData.recipientName}
                      onChange={handleInputChange}
                      disabled={isProcessing}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors disabled:opacity-50"
                      placeholder="Enter recipient's full name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Course/Achievement Name
                    </label>
                    <input
                      type="text"
                      name="courseName"
                      value={formData.courseName}
                      onChange={handleInputChange}
                      disabled={isProcessing}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors disabled:opacity-50"
                      placeholder="e.g., React Development Bootcamp"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Completion Date
                    </label>
                    <input
                      type="date"
                      name="completionDate"
                      value={formData.completionDate}
                      onChange={handleInputChange}
                      disabled={isProcessing}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors disabled:opacity-50"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Issuing Organization
                    </label>
                    <input
                      type="text"
                      name="issuerName"
                      value={formData.issuerName}
                      onChange={handleInputChange}
                      disabled={isProcessing}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors disabled:opacity-50"
                      placeholder={user ? `Default: ${user.firstName} ${user.lastName}` : "Your organization name"}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Certificate ID
                    </label>
                    <div className="flex gap-3">
                      <input
                        type="text"
                        name="certificateId"
                        value={formData.certificateId}
                        onChange={handleInputChange}
                        disabled={isProcessing}
                        className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors disabled:opacity-50"
                        placeholder="Auto-generated if empty"
                      />
                      <button
                        onClick={generateCertificateId}
                        disabled={isProcessing}
                        className="px-4 py-3 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors disabled:opacity-50"
                        title="Generate Random ID"
                      >
                        <RefreshCw className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Description (Optional)
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      disabled={isProcessing}
                      rows="3"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors resize-none disabled:opacity-50"
                      placeholder="Additional details about the achievement..."
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Position Elements Tab */}
            {activeTab === 'position' && (
              <div className="space-y-6">
                {/* Text Elements Positioning */}
                <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
                  <div className="flex items-center mb-6">
                    <Move className="w-6 h-6 text-blue-600 mr-3" />
                    <h3 className="text-xl font-bold text-gray-800">Text Positioning</h3>
                  </div>
                  
                  <div className="space-y-6">
                    {textElements.map((element) => (
                      <div key={element.id} className="border border-gray-200 rounded-lg p-4">
                        <h4 className="font-semibold text-gray-700 mb-3">{element.label}</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">X Position (%)</label>
                            <input
                              type="range"
                              min="0"
                              max="100"
                              value={element.x}
                              onChange={(e) => updateTextElement(element.id, 'x', parseInt(e.target.value))}
                              disabled={isProcessing}
                              className="w-full"
                            />
                            <span className="text-xs text-gray-500">{element.x}%</span>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Y Position (%)</label>
                            <input
                              type="range"
                              min="0"
                              max="100"
                              value={element.y}
                              onChange={(e) => updateTextElement(element.id, 'y', parseInt(e.target.value))}
                              disabled={isProcessing}
                              className="w-full"
                            />
                            <span className="text-xs text-gray-500">{element.y}%</span>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Font Size</label>
                            <input
                              type="range"
                              min="8"
                              max="48"
                              value={element.fontSize}
                              onChange={(e) => updateTextElement(element.id, 'fontSize', parseInt(e.target.value))}
                              disabled={isProcessing}
                              className="w-full"
                            />
                            <span className="text-xs text-gray-500">{element.fontSize}px</span>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Color</label>
                            <input
                              type="color"
                              value={element.color}
                              onChange={(e) => updateTextElement(element.id, 'color', e.target.value)}
                              disabled={isProcessing}
                              className="w-full h-8 border border-gray-300 rounded"
                            />
                          </div>
                        </div>
                        <div className="flex gap-4 mt-3">
                          <select
                            value={element.textAlign}
                            onChange={(e) => updateTextElement(element.id, 'textAlign', e.target.value)}
                            disabled={isProcessing}
                            className="px-3 py-1 border border-gray-300 rounded text-sm"
                          >
                            <option value="left">Left</option>
                            <option value="center">Center</option>
                            <option value="right">Right</option>
                          </select>
                          <select
                            value={element.fontWeight}
                            onChange={(e) => updateTextElement(element.id, 'fontWeight', e.target.value)}
                            disabled={isProcessing}
                            className="px-3 py-1 border border-gray-300 rounded text-sm"
                          >
                            <option value="normal">Normal</option>
                            <option value="bold">Bold</option>
                          </select>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* QR Code Positioning */}
                <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
                  <div className="flex items-center mb-6">
                    <QrCode className="w-6 h-6 text-blue-600 mr-3" />
                    <h3 className="text-xl font-bold text-gray-800">QR Code Positioning & Testing</h3>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-2">X Position (%)</label>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={qrSettings.x}
                        onChange={(e) => updateQRSettings('x', parseInt(e.target.value))}
                        disabled={isProcessing}
                        className="w-full"
                      />
                      <span className="text-sm text-gray-500">{qrSettings.x}%</span>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-2">Y Position (%)</label>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={qrSettings.y}
                        onChange={(e) => updateQRSettings('y', parseInt(e.target.value))}
                        disabled={isProcessing}
                        className="w-full"
                      />
                      <span className="text-sm text-gray-500">{qrSettings.y}%</span>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-2">Size (px)</label>
                      <input
                        type="range"
                        min="60"
                        max="200"
                        value={qrSettings.size}
                        onChange={(e) => updateQRSettings('size', parseInt(e.target.value))}
                        disabled={isProcessing}
                        className="w-full"
                      />
                      <span className="text-sm text-gray-500">{qrSettings.size}px</span>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-2">Color</label>
                      <input
                        type="color"
                        value={qrSettings.color}
                        onChange={(e) => updateQRSettings('color', e.target.value)}
                        disabled={isProcessing}
                        className="w-full h-10 border border-gray-300 rounded"
                      />
                    </div>
                  </div>

                  {/* QR Code Testing */}
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
                    <h4 className="font-semibold text-amber-800 mb-3">QR Code Testing:</h4>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-amber-700 text-sm mb-3">
                          Current QR Code URL: <span className="font-mono bg-white px-2 py-1 rounded text-xs break-all">{qrData || 'Generate certificate first'}</span>
                        </p>
                        <ul className="text-amber-700 text-sm space-y-1">
                          <li>• Size should be at least 100px for good scanning</li>
                          <li>• Use black (#000000) for best contrast</li>
                          <li>• Ensure white background around QR code</li>
                          <li>• Test with multiple camera apps</li>
                        </ul>
                      </div>
                      <div className="text-center">
                        <button
                          onClick={testQRCode}
                          disabled={!qrData || isProcessing}
                          className="bg-amber-600 hover:bg-amber-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-medium flex items-center mx-auto transition-colors"
                        >
                          <TestTube className="w-4 h-4 mr-2" />
                          Test QR Code
                        </button>
                        <p className="text-xs text-amber-600 mt-2">Opens test window with QR details</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Enhanced Debug Panel */}
            <EnhancedDebugPanel />
          </div>

          {/* Right Panel - Preview */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 sticky top-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-800">Live Preview</h2>
                <div className="flex gap-2">
                  <button
                    onClick={generateCertificate}
                    disabled={!designImage || isProcessing || !user}
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg font-medium flex items-center transition-colors text-sm"
                    title={!user ? "Login required" : ""}
                  >
                    {isProcessing ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-1 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Eye className="w-4 h-4 mr-1" />
                        Update
                      </>
                    )}
                  </button>
                  {showPreview && (
                    <button
                      onClick={downloadCertificate}
                      disabled={isProcessing || !user}
                     className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-medium flex items-center transition-colors text-sm"
                      title={!user ? "Login required to save" : ""}
                    >
                      <Download className="w-4 h-4 mr-1" />
                      Save
                    </button>
                  )}
                </div>
              </div>

              {imagePreview ? (
                <div className="w-full">
                  <div 
                    ref={certificateRef}
                    className="w-full relative overflow-hidden rounded-lg shadow-lg"
                    style={{ aspectRatio: '4/3' }}
                  >
                    {/* Background Image */}
                    <img 
                      src={imagePreview} 
                      alt="Certificate Design"
                      className="w-full h-full object-cover"
                    />
                    
                    {/* Text Overlays */}
                    {showPreview && textElements.map((element) => (
                      <div
                        key={element.id}
                        className="absolute"
                        style={{
                          left: `${element.x}%`,
                          top: `${element.y}%`,
                          transform: 'translate(-50%, -50%)',
                          fontSize: `${element.fontSize}px`,
                          color: element.color,
                          fontWeight: element.fontWeight,
                          textAlign: element.textAlign,
                          whiteSpace: 'nowrap',
                          maxWidth: '90%',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}
                      >
                        {getTextContent(element.id)}
                      </div>
                    ))}

                    {/* QR Code Overlay */}
                    {showPreview && qrData && (
                      <div
                        className="absolute"
                        style={{
                          left: `${qrSettings.x}%`,
                          top: `${qrSettings.y}%`,
                          transform: 'translate(-50%, -50%)'
                        }}
                      >
                        <QRCodeDisplay 
                          data={qrData} 
                          size={qrSettings.size} 
                          color={qrSettings.color} 
                        />
                      </div>
                    )}
                  </div>

                  {/* Design Info */}
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600 mb-2">
                      <strong>Design Status:</strong> {designImage ? 'Uploaded ✓' : 'Not uploaded'}
                    </p>
                    <p className="text-sm text-gray-600 mb-2">
                      <strong>QR Code:</strong> {qrData ? 'Generated ✓' : 'Click Update to generate'}
                    </p>
                    <p className="text-sm text-gray-600 mb-2">
                      <strong>Authentication:</strong> {user ? `Logged in as ${user.email} ✓` : 'Not authenticated ✗'}
                    </p>
                    {qrData && (
                      <p className="text-sm text-gray-600 mb-2">
                        <strong>QR URL:</strong> <span className="font-mono text-xs break-all">{qrData}</span>
                      </p>
                    )}
                    {formData.eventId && (
                      <p className="text-sm text-gray-600">
                        <strong>Event ID:</strong> {formData.eventId}
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-64 text-gray-500 border-2 border-dashed border-gray-300 rounded-lg">
                  <Image className="w-16 h-16 mb-4 opacity-20" />
                  <p className="text-lg mb-2">No Design Uploaded</p>
                  <p className="text-sm text-center max-w-xs">
                    Upload your certificate design to see the preview
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* QR Code Scanning Tips */}
        {qrData && (
          <div className="mt-12 bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-8 border border-green-200">
            <div className="flex items-center mb-4">
              <QrCode className="w-8 h-8 text-green-600 mr-3" />
              <h3 className="text-2xl font-bold text-gray-800">QR Code Scanning Guide</h3>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <h4 className="font-semibold text-gray-700 mb-3">📱 Mobile Camera Apps:</h4>
                <ul className="text-gray-600 space-y-1 text-sm">
                  <li>• iOS: Built-in Camera app</li>
                  <li>• Android: Google Camera</li>
                  <li>• Samsung: Samsung Camera</li>
                  <li>• Third-party: QR Code Reader apps</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-gray-700 mb-3">✅ Scanning Tips:</h4>
                <ul className="text-gray-600 space-y-1 text-sm">
                  <li>• Hold phone 6-12 inches away</li>
                  <li>• Ensure good lighting</li>
                  <li>• Keep QR code flat and stable</li>
                  <li>• Wait for auto-focus</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-gray-700 mb-3">🔧 Troubleshooting:</h4>
                <ul className="text-gray-600 space-y-1 text-sm">
                  <li>• Increase QR code size if scanning fails</li>
                  <li>• Use black color for better contrast</li>
                  <li>• Ensure white background around QR</li>
                  <li>• Test with "Test QR Code" button</li>
                </ul>
              </div>
            </div>
            <div className="mt-6 p-4 bg-white rounded-lg border-l-4 border-green-500">
              <p className="text-gray-700">
                <strong>Current QR Code redirects to:</strong> 
                <span className="font-mono bg-gray-100 px-2 py-1 rounded ml-2 text-sm break-all">{qrData}</span>
              </p>
              {user && (
                <p className="text-gray-700 mt-2">
                  <strong>Created by:</strong> {user.email} ({user.firstName} {user.lastName})
                </p>
              )}
            </div>
          </div>
        )}

        {/* Usage Instructions */}
        <div className="mt-12 bg-white rounded-xl p-8 shadow-lg border border-gray-100">
          <h3 className="text-2xl font-bold text-gray-800 mb-6 text-center">How to Create Authenticated Certificates</h3>
          <div className="grid md:grid-cols-5 gap-6">
            <div className="text-center">
              <div className="bg-red-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-red-600">1</span>
              </div>
              <h4 className="font-semibold mb-2">Login</h4>
              <p className="text-gray-600 text-sm">Authenticate with your account to save certificates to the database</p>
            </div>
            
            <div className="text-center">
              <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-blue-600">2</span>
              </div>
              <h4 className="font-semibold mb-2">Upload Design</h4>
              <p className="text-gray-600 text-sm">Upload your certificate template with adequate white space for QR code</p>
            </div>
            
            <div className="text-center">
              <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-green-600">3</span>
              </div>
              <h4 className="font-semibold mb-2">Fill Content</h4>
              <p className="text-gray-600 text-sm">Enter recipient details (your info auto-populated as issuer)</p>
            </div>
            
            <div className="text-center">
              <div className="bg-purple-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-purple-600">4</span>
              </div>
              <h4 className="font-semibold mb-2">Position & Test</h4>
              <p className="text-gray-600 text-sm">Position QR code (min 100px size) and test scanning</p>
            </div>
            
            <div className="text-center">
              <div className="bg-orange-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-orange-600">5</span>
              </div>
              <h4 className="font-semibold mb-2">Save & Verify</h4>
              <p className="text-gray-600 text-sm">Download and save to database with automatic verification URL</p>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="mt-16 grid md:grid-cols-4 gap-8">
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
            <User className="w-12 h-12 text-blue-600 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Authenticated Creation</h3>
            <p className="text-gray-600">Secure certificate creation with user authentication and automatic issuer assignment.</p>
          </div>
          
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
            <Upload className="w-12 h-12 text-green-600 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Custom Design Upload</h3>
            <p className="text-gray-600">Upload your own certificate design and automatically place content with precise positioning.</p>
          </div>
          
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
            <Move className="w-12 h-12 text-purple-600 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Drag & Position</h3>
            <p className="text-gray-600">Easily position text elements and QR codes anywhere on your design with intuitive controls.</p>
          </div>
          
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
            <QrCode className="w-12 h-12 text-orange-600 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Scannable QR Codes</h3>
            <p className="text-gray-600">Generate optimized QR codes that work with all mobile apps and link to verification pages.</p>
          </div>
        </div>

        {/* Event Integration Info */}
        {formData.eventId && (
          <div className="mt-12 bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-8 border border-purple-200">
            <div className="flex items-center mb-4">
              <Building className="w-8 h-8 text-purple-600 mr-3" />
              <h3 className="text-2xl font-bold text-gray-800">Event Integration Active</h3>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-gray-700 mb-2">Event Details:</h4>
                <p className="text-gray-600 mb-1"><strong>Event ID:</strong> {formData.eventId}</p>
                <p className="text-gray-600 mb-1"><strong>QR Redirect:</strong> meetkats.com/certificates/{formData.certificateId || 'CERT-XXXXX'}</p>
                <p className="text-gray-600 mb-1"><strong>Backend Storage:</strong> {backendStatus === 'connected' ? 'Enabled ✓' : 'Checking...'}</p>
                {user && (
                  <p className="text-gray-600"><strong>Created By:</strong> {user.email}</p>
                )}
              </div>
              <div>
                <h4 className="font-semibold text-gray-700 mb-2">Features Available:</h4>
                <ul className="text-gray-600 space-y-1">
                  <li>• {user ? '✓' : '✗'} Authenticated certificate creation</li>
                  <li>• {backendStatus === 'connected' ? '✓' : '?'} Certificate saved to database</li>
                  <li>• ✓ QR code verification</li>
                  <li>• ✓ Event attendance tracking</li>
                  <li>• ? Automatic email delivery</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Authentication Notice */}
        {!user && (
          <div className="mt-12 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-8 border border-yellow-200">
            <div className="flex items-center mb-4">
              <User className="w-8 h-8 text-yellow-600 mr-3" />
              <h3 className="text-2xl font-bold text-gray-800">Authentication Required</h3>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-gray-700 mb-2">Why Login?</h4>
                <ul className="text-gray-600 space-y-1">
                  <li>• Save certificates to secure database</li>
                  <li>• Automatic issuer information assignment</li>
                  <li>• Certificate ownership tracking</li>
                  <li>• Access to advanced features</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-gray-700 mb-2">Available Without Login:</h4>
                <ul className="text-gray-600 space-y-1">
                  <li>• Certificate design and preview</li>
                  <li>• Local certificate download</li>
                  <li>• QR code generation</li>
                  <li>• Basic certificate creation</li>
                </ul>
              </div>
            </div>
            <div className="mt-6 text-center">
              <button
                onClick={() => window.location.href = '/login'}
                className="bg-yellow-600 hover:bg-yellow-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors"
              >
                Login to Save Certificates
              </button>
            </div>
          </div>
        )}

        {/* API Status Footer */}
        <div className="mt-12 bg-gray-100 rounded-xl p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-semibold text-gray-700">System Status</h4>
              <p className="text-gray-600 text-sm">Backend: {API_URL}</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center">
                <div className={`w-3 h-3 rounded-full mr-2 ${
                  backendStatus === 'connected' ? 'bg-green-500' :
                  backendStatus === 'error' ? 'bg-red-500' :
                  backendStatus === 'testing' ? 'bg-yellow-500' :
                  'bg-gray-500'
                }`}></div>
                <span className="text-sm text-gray-600">
                  Backend: {backendStatus === 'connected' ? 'Connected' :
                           backendStatus === 'error' ? 'Error' :
                           backendStatus === 'testing' ? 'Testing' :
                           'Unknown'}
                </span>
              </div>
              <div className="flex items-center">
                <div className={`w-3 h-3 rounded-full mr-2 ${
                  user ? 'bg-green-500' : 'bg-red-500'
                }`}></div>
                <span className="text-sm text-gray-600">
                  Auth: {user ? 'Logged In' : 'Not Logged In'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QRCertificateGenerator;
