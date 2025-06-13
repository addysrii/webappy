import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Download, Award, QrCode, Eye, RefreshCw, Upload, Image, Move, RotateCcw, Trash2, TestTube, User, Building } from 'lucide-react';
import html2canvas from 'html2canvas';
import { useAuth } from '../context/AuthContext';
import api, { testConnection, checkServerConnection } from '../services/api';

// Safe color conversion fallbacks
const COLOR_FALLBACKS = {
  'oklch(70% 0.15 240)': '#4a86e8',
  'oklch(80% 0.1 120)': '#7fdb8f',
  'lab(75 20 45)': '#e67c7c',
  // Add more mappings as needed
};

const API_URL = process.env.REACT_APP_API_URL || 'https://new-backend-w86d.onrender.com';
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
  const [downloadQuality, setDownloadQuality] = useState('high');
  
  const fileInputRef = useRef(null);
  const certificateRef = useRef(null);
  const originalStyles = useRef([]);
    // Convert modern color formats to browser-safe formats
  const convertColorToSafe = (color) => {
    if (!color) return '#000000';
    
    // Return if already safe
    if (color.startsWith('#') || color.startsWith('rgb(')) return color;
    
    // Check fallback mappings
    if (COLOR_FALLBACKS[color]) return COLOR_FALLBACKS[color];
    
    // Handle oklch() and lab() formats
    if (color.includes('oklch(') || color.includes('lab(')) {
      return '#4a86e8'; // Default fallback
    }
    
    return color;
  };

  // Process all colors in the certificate before rendering
  const processColorsForCompatibility = () => {
    originalStyles.current = [];
    const elements = certificateRef.current.querySelectorAll('*');
    
    elements.forEach(el => {
      const computedStyle = window.getComputedStyle(el);
      const styleData = {
        element: el,
        originalStyles: {
          color: el.style.color,
          backgroundColor: el.style.backgroundColor,
          borderColor: el.style.borderColor
        },
        computedStyles: {
          color: computedStyle.color,
          backgroundColor: computedStyle.backgroundColor,
          borderColor: computedStyle.borderColor
        }
      };
      
      originalStyles.current.push(styleData);
      
      // Convert colors to safe formats
      if (computedStyle.color) {
        el.style.color = convertColorToSafe(computedStyle.color);
      }
      if (computedStyle.backgroundColor) {
        el.style.backgroundColor = convertColorToSafe(computedStyle.backgroundColor);
      }
      if (computedStyle.borderColor) {
        el.style.borderColor = convertColorToSafe(computedStyle.borderColor);
      }
    });
  };

  // Restore original colors after rendering
  const restoreOriginalColors = () => {
    originalStyles.current.forEach(styleData => {
      if (styleData && styleData.element) {
        styleData.element.style.color = styleData.originalStyles.color;
        styleData.element.style.backgroundColor = styleData.originalStyles.backgroundColor;
        styleData.element.style.borderColor = styleData.originalStyles.borderColor;
      }
    });
    originalStyles.current = [];
  };
    // Handle file upload with image validation
  const handleFileUpload = useCallback((event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
      alert('Please upload a valid image file (PNG, JPG, JPEG)');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      alert('Image size should be less than 10MB');
      return;
    }

    setDesignImage(file);
    const reader = new FileReader();
    reader.onload = (e) => setImagePreview(e.target.result);
    reader.readAsDataURL(file);
  }, []);

  // Initialize user data
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        issuerName: user.firstName && user.lastName 
          ? `${user.firstName} ${user.lastName}` 
          : user.email || 'Certificate Authority',
        completionDate: new Date().toISOString().split('T')[0]
      }));
    }
  }, [user]);

  // Test backend connection
  useEffect(() => {
    const initialBackendTest = async () => {
      if (token) await testBackendConnection();
    };
    initialBackendTest();
  }, [token]);
    // Generate random certificate ID
  const generateCertificateId = () => {
    const timestamp = Date.now();
    const randomPart = Math.random().toString(36).substr(2, 6).toUpperCase();
    const id = `CERT-${timestamp}-${randomPart}`;
    setFormData(prev => ({ ...prev, certificateId: id }));
    return id;
  };

  // Validate form data
  const validateFormData = () => {
    const errors = [];
    if (!formData.recipientName?.trim()) errors.push('Recipient name is required');
    if (!designImage) errors.push('Please upload a certificate design');
    if (errors.length > 0) {
      alert('Please fix the following errors:\n' + errors.join('\n'));
      return false;
    }
    return true;
  };

  // Generate certificate with QR code
  const generateCertificate = async () => {
    if (!validateFormData()) return;
    if (!user || !token) {
      alert('Please log in to generate certificates');
      return;
    }

    setIsProcessing(true);
    try {
      const certificateId = formData.certificateId || generateCertificateId();
      const verificationUrl = `${window.location.origin}/verify/${certificateId}`;
      
      setQrData(verificationUrl);
      setShowPreview(true);
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.error('Certificate generation error:', error);
      alert('Failed to generate certificate');
    } finally {
      setIsProcessing(false);
    }
  };
    // Download certificate as PNG
  const downloadCertificate = async () => {
    if (!certificateRef.current) {
      alert('Please generate certificate first');
      return;
    }

    setIsProcessing(true);
    try {
      // Process colors before capture
      processColorsForCompatibility();
      
      // Wait for images to load
      const images = certificateRef.current.querySelectorAll('img');
      await Promise.all(Array.from(images).map(img => 
        img.complete ? Promise.resolve() : new Promise(resolve => {
          img.onload = resolve;
          img.onerror = resolve;
          setTimeout(resolve, 2000);
        })
      ));

      // Capture options
      const scale = downloadQuality === 'high' ? 3 : 
                   downloadQuality === 'medium' ? 2 : 1;
      
      const canvas = await html2canvas(certificateRef.current, {
        scale,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
        allowTaint: false,
        ignoreElements: el => el.classList.contains('ignore-html2canvas')
      });

      // Trigger download
      const link = document.createElement('a');
      link.href = canvas.toDataURL('image/png');
      link.download = `${formData.recipientName || 'certificate'}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Save to backend if authenticated
      if (user && token) {
        await saveCertificateToBackend(canvas.toDataURL('image/png'));
      }
    } catch (error) {
      console.error('Download error:', error);
      alert('Failed to download certificate');
    } finally {
      restoreOriginalColors();
      setIsProcessing(false);
    }
  };

  // Save certificate to backend
  const saveCertificateToBackend = async (imageData) => {
    try {
      const certificateData = {
        recipientName: formData.recipientName,
        courseName: formData.courseName,
        completionDate: formData.completionDate,
        issuerName: formData.issuerName,
        certificateId: formData.certificateId,
        certificateImage: imageData,
        description: formData.description,
        eventId: formData.eventId
      };

      await api.postData('/certificates', certificateData);
      alert('Certificate saved successfully!');
    } catch (error) {
      console.error('Save error:', error);
      alert('Certificate downloaded but failed to save to backend');
    }
  };
    // Test QR code functionality
  const testQRCode = () => {
    if (!qrData) {
      alert('Please generate certificate first');
      return;
    }
    window.open(qrData, '_blank');
  };

  // Test backend connection
  const testBackendConnection = async () => {
    try {
      setBackendStatus('testing');
      const result = await testConnection();
      setBackendStatus(result.success ? 'connected' : 'error');
      return result.success;
    } catch (error) {
      setBackendStatus('error');
      return false;
    }
  };

  // Reset design
  const resetDesign = () => {
    setDesignImage(null);
    setImagePreview(null);
    setShowPreview(false);
    setQrData('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };
    // Status indicator component
  const StatusIndicator = () => (
    <div className="flex items-center mb-4">
      <div className={`w-3 h-3 rounded-full mr-2 ${
        !user ? 'bg-red-500' : 
        isProcessing ? 'bg-yellow-500' : 
        !designImage ? 'bg-gray-500' : 
        !showPreview ? 'bg-blue-500' : 
        'bg-green-500'
      }`}></div>
      <span className="text-sm font-medium text-gray-700">
        {!user ? 'Not Authenticated' : 
         isProcessing ? 'Processing...' : 
         !designImage ? 'Upload Design' : 
         !showPreview ? 'Ready to Generate' : 
         'Certificate Ready'}
      </span>
    </div>
  );

  // Authentication status component
  const AuthenticationStatus = () => (
    <div className={`mb-6 p-4 rounded-xl ${
      user ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
    }`}>
      <div className="flex items-center">
        <User className={`w-5 h-5 mr-2 ${user ? 'text-green-600' : 'text-red-600'}`} />
        <h4 className={`font-semibold ${user ? 'text-green-800' : 'text-red-800'}`}>
          {user ? 'Authenticated User' : 'Authentication Required'}
        </h4>
      </div>
      <p className={`text-sm mt-2 ${user ? 'text-green-700' : 'text-red-700'}`}>
        {user ? `Logged in as ${user.email}` : 'Please log in to save certificates'}
      </p>
    </div>
  );
    // Certificate preview component
  const CertificatePreview = () => {
    const getTextContent = (elementId) => {
      switch(elementId) {
        case 'recipient': return formData.recipientName || 'Recipient Name';
        case 'course': return formData.courseName || 'Course Name';
        case 'date': return formData.completionDate || '';
        case 'issuer': return formData.issuerName || '';
        case 'certId': return formData.certificateId || '';
        default: return '';
      }
    };

    return (
      <div 
        ref={certificateRef}
        className="relative w-full border border-gray-200 rounded-lg overflow-hidden"
        style={{ 
          aspectRatio: '4/3',
          backgroundColor: '#ffffff',
          minHeight: '400px'
        }}
      >
        {imagePreview && (
          <img 
            src={imagePreview} 
            alt="Certificate Design" 
            className="absolute inset-0 w-full h-full object-cover"
            crossOrigin="anonymous"
          />
        )}

        {showPreview && textElements.map((element) => (
          <div
            key={element.id}
            className="absolute pointer-events-none"
            style={{
              left: `${element.x}%`,
              top: `${element.y}%`,
              transform: 'translate(-50%, -50%)',
              fontSize: `${element.fontSize}px`,
              color: convertColorToSafe(element.color),
              fontWeight: element.fontWeight,
              textAlign: element.textAlign,
              maxWidth: '80%'
            }}
          >
            {getTextContent(element.id)}
          </div>
        ))}

        {showPreview && qrData && (
          <div
            className="absolute pointer-events-none"
            style={{
              left: `${qrSettings.x}%`,
              top: `${qrSettings.y}%`,
              transform: 'translate(-50%, -50%)'
            }}
          >
            <div className="bg-white p-2 rounded">
              <QRCode 
                value={qrData} 
                size={qrSettings.size - 16} 
                fgColor={convertColorToSafe(qrSettings.color)}
                bgColor="#ffffff"
              />
            </div>
          </div>
        )}
      </div>
    );
  };
    // Quality selector component
  const QualitySelector = () => (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Download Quality
      </label>
      <select 
        value={downloadQuality}
        onChange={(e) => setDownloadQuality(e.target.value)}
        className="px-3 py-2 border border-gray-300 rounded-lg"
      >
        <option value="high">High Quality (3x)</option>
        <option value="medium">Medium Quality (2x)</option>
        <option value="low">Fast Download (1x)</option>
      </select>
    </div>
  );

  // Debug panel component
  const DebugPanel = () => (
    <div className="mt-8 p-6 bg-gray-50 rounded-xl border border-gray-200">
      <h4 className="font-semibold text-gray-800 mb-3">
        Debug Information
      </h4>
      <div className="space-y-2 text-sm text-gray-600">
        <div><strong>Certificate ID:</strong> {formData.certificateId || 'Not generated'}</div>
        <div><strong>QR Data:</strong> {qrData || 'Not generated'}</div>
        <div><strong>Backend Status:</strong> {backendStatus}</div>
        <div className="flex gap-2 mt-3">
          <button
            onClick={testQRCode}
            className="bg-blue-500 text-white px-3 py-1 rounded text-xs"
          >
            Test QR Code
          </button>
          <button
            onClick={testBackendConnection}
            className="bg-purple-500 text-white px-3 py-1 rounded text-xs"
          >
            Test Backend
          </button>
        </div>
      </div>
    </div>
  );
    return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-blue-600 text-white py-16">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <h1 className="text-4xl font-bold mb-4">Certificate Generator</h1>
          <StatusIndicator />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12">
        <AuthenticationStatus />

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {/* Tab content would go here */}
            {/* Upload, Content, and Position tabs */}
            {/* ... */}
            
            <DebugPanel />
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 sticky top-6">
              <h2 className="text-xl font-bold text-gray-800 mb-6">Live Preview</h2>
              
              {imagePreview ? (
                <>
                  <CertificatePreview />
                  <div className="mt-4 flex gap-2">
                    <button
                      onClick={generateCertificate}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg"
                    >
                      Update Preview
                    </button>
                    <button
                      onClick={downloadCertificate}
                      className="bg-green-600 text-white px-4 py-2 rounded-lg"
                    >
                      Download
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-64 text-gray-500 border-2 border-dashed border-gray-300 rounded-lg">
                  <Image className="w-16 h-16 mb-4 opacity-20" />
                  <p>Upload design to see preview</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QRCertificateGenerator;

     
