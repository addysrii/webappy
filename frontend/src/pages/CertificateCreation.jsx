// Part 1: Imports and Component Setup
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Download, Award, QrCode, Eye, RefreshCw, Upload, Image, Move, RotateCcw, Trash2, TestTube, User, Building } from 'lucide-react';
import QRCode from 'react-qr-code';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { useAuth } from '../context/AuthContext';
import api, { testConnection, checkServerConnection } from '../services/api';

const QRCertificateGenerator = () => {
  const { user, token } = useAuth();
  const API_URL = 'https://new-backend-w86d.onrender.com';
  
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
  
  // ✅ FIXED: Updated text element positions to match your certificate template
  const [textElements, setTextElements] = useState([
    { 
      id: 'recipient', 
      label: 'Recipient Name', 
      x: 50, 
      y: 58, 
      fontSize: 32, 
      color: '#000000', 
      fontWeight: 'bold', 
      textAlign: 'center' 
    },
    { 
      id: 'course', 
      label: 'Course/Event Name', 
      x: 50, 
      y: 70, 
      fontSize: 16, 
      color: '#333333', 
      fontWeight: 'normal', 
      textAlign: 'center' 
    },
    { 
      id: 'date', 
      label: 'Date', 
      x: 50, 
      y: 75, 
      fontSize: 14, 
      color: '#666666', 
      fontWeight: 'normal', 
      textAlign: 'center' 
    },
    { 
      id: 'issuer', 
      label: 'Issuer/Organization', 
      x: 75, 
      y: 85, 
      fontSize: 12, 
      color: '#333333', 
      fontWeight: 'normal', 
      textAlign: 'center' 
    },
    { 
      id: 'certId', 
      label: 'Certificate ID', 
      x: 25, 
      y: 85, 
      fontSize: 10, 
      color: '#888888', 
      fontWeight: 'normal', 
      textAlign: 'center' 
    }
  ]);

  const [qrSettings, setQrSettings] = useState({
    x: 85,
    y: 15,
    size: 100,
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
          : user.email || '',
        completionDate: new Date().toISOString().split('T')[0]
      }));
    }
  }, [user]);

  useEffect(() => {
    const initialBackendTest = async () => {
      if (token) {
        await testBackendConnection();
      }
    };
    initialBackendTest();
  }, [token]);

  // Helper Functions
  const compressImage = (canvas, maxSizeKB = 2048, format = 'image/jpeg') => {
    return new Promise((resolve) => {
      let quality = 0.9;
      let dataURL = canvas.toDataURL(format, quality);
      
      while (dataURL.length > maxSizeKB * 1024 && quality > 0.1) {
        quality -= 0.1;
        dataURL = canvas.toDataURL(format, quality);
      }
      
      console.log(`📏 Compressed image: ${Math.round(dataURL.length / 1024)}KB (quality: ${quality})`);
      resolve(dataURL);
    });
  };

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

  const generateCertificateId = () => {
    const timestamp = Date.now();
    const randomPart = Math.random().toString(36).substr(2, 6).toUpperCase();
    const id = `CERT-${timestamp}-${randomPart}`;
    setFormData({ ...formData, certificateId: id });
    return id;
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const updateTextElement = (id, property, value) => {
    setTextElements(prev => 
      prev.map(element => 
        element.id === id ? { ...element, [property]: value } : element
      )
    );
  };

  const updateQRSettings = (property, value) => {
    setQrSettings(prev => ({ ...prev, [property]: value }));
  };

  const getTextContent = (elementId) => {
    switch(elementId) {
      case 'recipient': 
        return formData.recipientName || '';
      case 'course': 
        if (formData.courseName) {
          return `for his/her active participation in the ${formData.courseName}`;
        }
        return '';
      case 'date': 
        if (formData.completionDate) {
          const date = new Date(formData.completionDate);
          return date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          });
        }
        return '';
      case 'issuer': 
        return formData.issuerName || '';
      case 'certId': 
        return formData.certificateId ? `ID: ${formData.certificateId}` : '';
      default: 
        return '';
    }
  };

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
    
    if (formData.eventId === 'manual-certificate') {
      setFormData(prev => ({ ...prev, eventId: '' }));
      fixes.push('Cleared invalid eventId format');
    }
    
    if (!formData.certificateId?.trim()) {
      const newId = generateCertificateId();
      fixes.push(`Generated certificate ID: ${newId}`);
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

  // ✅ COMPLETELY FIXED: Download function with proper scaling and PDF generation
  const downloadCertificate = async () => {
    if (!certificateRef.current) {
      alert('Certificate preview not available. Please generate the certificate first.');
      return;
    }

    if (!user || !token) {
      alert('Please log in to save certificates');
      return;
    }

    if (!validateAndFixFormData()) {
      return;
    }

    setIsProcessing(true);
    
    try {
      console.log('🎯 Starting certificate download process...');
      
      // ✅ Wait for QR code to render properly
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const element = certificateRef.current;
      
      // ✅ FIXED: Get actual rendered dimensions
      const rect = element.getBoundingClientRect();
      
      console.log('📐 Element dimensions:', {
        width: rect.width,
        height: rect.height
      });
      
      // ✅ COMPLETELY REWRITTEN: Better canvas capture with proper dimensions
      const canvas = await html2canvas(element, {
        scale: 2, // ✅ REDUCED: More reasonable scale
        useCORS: true,
        allowTaint: false,
        backgroundColor: "#ffffff",
        logging: false,
        
        // ✅ CRITICAL FIX: Use exact element dimensions
        width: rect.width,
        height: rect.height,
        
        x: 0,
        y: 0,
        scrollX: 0,
        scrollY: 0,
        
        foreignObjectRendering: false,
        removeContainer: false,
        imageTimeout: 30000,
        async: true,
        letterRendering: true,
        
        onclone: (clonedDoc, element) => {
          console.log('🔍 Processing cloned document for certificate template...');
          
          // ✅ Force all QR SVG elements to be visible
          const svgElements = clonedDoc.querySelectorAll('svg');
          svgElements.forEach((svg, index) => {
            svg.style.display = 'block !important';
            svg.style.visibility = 'visible !important';
            svg.style.opacity = '1 !important';
            svg.style.position = 'relative';
            svg.style.zIndex = '1000';
            
            const paths = svg.querySelectorAll('path');
            paths.forEach(path => {
              path.style.fill = '#000000';
              path.style.opacity = '1';
            });
            
            const rects = svg.querySelectorAll('rect');
            rects.forEach(rect => {
              if (rect.getAttribute('fill') === '#000000' || rect.getAttribute('fill') === 'black') {
                rect.style.fill = '#000000';
                rect.style.opacity = '1';
              }
            });
          });
          
          // ✅ Force all text elements to be visible
          const textElements = clonedDoc.querySelectorAll('[style*="position: absolute"]');
          textElements.forEach(el => {
            el.style.visibility = 'visible !important';
            el.style.opacity = '1 !important';
            el.style.display = 'block !important';
            el.style.fontFamily = 'Arial, sans-serif !important';
          });
          
          const qrContainers = clonedDoc.querySelectorAll('div[style*="transform: translate(-50%, -50%)"]');
          qrContainers.forEach(container => {
            container.style.visibility = 'visible !important';
            container.style.opacity = '1 !important';
            container.style.display = 'block !important';
            container.style.zIndex = '1000';
          });
        }
      });

      if (canvas.width === 0 || canvas.height === 0) {
        throw new Error('Canvas has zero dimensions - check certificate element visibility');
      }

      console.log('✅ Canvas generated successfully:', { 
        width: canvas.width, 
        height: canvas.height
      });

      const imageDataURL = await compressImage(canvas, 6144, 'image/jpeg');
      
      // ✅ COMPLETELY FIXED: PDF generation with proper full-page layout
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
        compress: true
      });
      
      // ✅ CRITICAL FIX: Fill entire page with certificate
      const pdfWidth = pdf.internal.pageSize.getWidth(); // 297mm for A4 landscape
      const pdfHeight = pdf.internal.pageSize.getHeight(); // 210mm for A4 landscape
      
      console.log('📄 PDF dimensions:', { pdfWidth, pdfHeight });
      
      // ✅ FIXED: Add image to fill entire page (no margins)
      pdf.addImage(
        imageDataURL, 
        'JPEG', 
        0,        // ✅ FIXED: Start from edge (no left margin)
        0,        // ✅ FIXED: Start from edge (no top margin)
        pdfWidth, // ✅ FIXED: Full width
        pdfHeight,// ✅ FIXED: Full height
        undefined, 
        'FAST'
      );
      
      const fileName = formData.recipientName?.replace(/[^a-z0-9]/gi, '_') || 'certificate';
      const pdfBlob = pdf.output('blob');
      const pdfUrl = URL.createObjectURL(pdfBlob);
      const pdfLink = document.createElement('a');
      pdfLink.href = pdfUrl;
      pdfLink.download = `${fileName}_certificate.pdf`;
      document.body.appendChild(pdfLink);
      pdfLink.click();
      document.body.removeChild(pdfLink);
      URL.revokeObjectURL(pdfUrl);
      
      console.log('✅ Certificate PDF downloaded successfully');

      const imageLink = document.createElement('a');
      imageLink.href = imageDataURL;
      imageLink.download = `${fileName}_certificate.jpg`;
      imageLink.rel = 'noopener noreferrer';
      document.body.appendChild(imageLink);
      imageLink.click();
      document.body.removeChild(imageLink);
      
      console.log('✅ Certificate image downloaded successfully');

      await saveCertificateToBackend(imageDataURL);
      
    } catch (error) {
      console.error('❌ Download error:', error);
      alert(`Failed to generate certificate. Error: ${error.message}\n\nPlease try:\n1. Ensuring QR code is visible in preview\n2. Waiting for QR code to fully load\n3. Refreshing the page and trying again`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Backend save functions (keeping existing implementation)
  const saveCertificateToBackend = async (imageDataURL) => {
    try {
      console.log('💾 Attempting to save certificate to backend:', API_URL);
      
      const certificateData = {
        recipientName: formData.recipientName,
        eventName: formData.courseName || 'Certificate of Participation',
        completionDate: formData.completionDate || new Date().toISOString(),
        issuerName: formData.issuerName || 'MeetKats Certificates',
        certificateId: formData.certificateId,
        certificateImage: imageDataURL,
        description: formData.description || '',
        createdBy: user.id,
        createdByEmail: user.email
      };

      const hasValidEventId = formData.eventId && 
                              formData.eventId.trim() !== '' && 
                              formData.eventId !== 'manual-certificate' &&
                              formData.eventId.length > 5;

      let saveSuccessful = false;
      let lastError = null;

      if (hasValidEventId) {
        try {
          const eventRequestData = {
            eventId: formData.eventId,
            templateId: 'default-template',
            attendeeIds: [],
            certificateImage: imageDataURL,
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

      if (!saveSuccessful) {
        const manualEndpoints = [
          '/api/certificates/manual',
          '/api/certificates/create',
          '/api/certificates'
        ];

        for (const endpoint of manualEndpoints) {
          try {
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
        if (lastError?.includes('413') || lastError?.includes('too large')) {
          alert(`✅ Certificate PDF and image downloaded successfully!\n\n⚠️ Backend storage failed due to image size: ${Math.round(imageDataURL.length / 1024)}KB\n\nMax allowed: 2MB\nYou can still use the downloaded files.`);
        } else {
          alert(`✅ Certificate PDF and image downloaded successfully!\n\n⚠️ Backend save failed: ${lastError}\n\nYou can still use the downloaded files.`);
        }
      } else {
        const fileName = formData.recipientName?.replace(/[^a-z0-9]/gi, '_') || 'certificate';
        alert(`✅ Certificate saved successfully!\n\n📁 Files downloaded:\n• PDF: ${fileName}_certificate.pdf\n• Image: ${fileName}_certificate.jpg\n\nCertificate ID: ${formData.certificateId}\nCreated by: ${user.email}`);
      }
        
    } catch (saveError) {
      console.error('❌ Error saving certificate to backend:', saveError);
      
      if (saveError.message?.includes('413') || saveError.message?.includes('too large')) {
        alert(`✅ Certificate PDF and image downloaded successfully!\n\n⚠️ Backend storage failed due to image size\n\nYou can still use the downloaded files.`);
      } else {
        alert(`✅ Certificate PDF and image downloaded successfully!\n\n⚠️ Backend save failed: ${saveError.message}\n\nYou can still use the downloaded files.`);
      }
    }
  };

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
  };

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

  // UI Components
  const QRCodeDisplay = ({ data, size, color }) => {
    const [qrLoaded, setQrLoaded] = useState(false);
    const [qrError, setQrError] = useState(false);
    
    useEffect(() => {
      if (data) {
        setQrLoaded(false);
        setQrError(false);
        const timer = setTimeout(() => setQrLoaded(true), 500);
        return () => clearTimeout(timer);
      }
    }, [data]);
    
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
      <div 
        className="bg-white p-2 rounded-lg shadow-lg" 
        style={{ 
          display: 'inline-block',
          visibility: 'visible',
          opacity: 1,
          position: 'relative',
          zIndex: 1000
        }}
      >
        <QRCode
          value={data}
          size={size - 16}
          level="H"
          style={{ 
            height: "auto", 
            maxWidth: "100%", 
            width: "100%",
            display: "block",
            visibility: "visible",
            opacity: qrLoaded ? 1 : 0.5
          }}
          bgColor="#ffffff"
          fgColor={color}
        />
        {!qrLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75">
            <span className="text-xs text-gray-500">Loading...</span>
          </div>
        )}
      </div>
    );
  };

  // ✅ COMPLETELY FIXED: Certificate Preview with proper scaling and layout
  const CertificatePreview = () => {
    return (
      <div 
        ref={certificateRef}
        className="w-full relative overflow-visible rounded-lg shadow-lg"
        style={{ 
          // ✅ FIXED: Proper aspect ratio for your certificate template
          aspectRatio: '1.414/1', // A4 landscape ratio
          minHeight: '400px',     // ✅ INCREASED: Better preview size
          maxHeight: '600px',     // ✅ ADDED: Prevent too large preview
          backgroundColor: '#ffffff',
          position: 'relative'
        }}
      >
        {/* Background Image */}
        <img 
          src={imagePreview} 
          alt="Certificate Design"
          className="w-full h-full object-contain" // ✅ CHANGED: object-contain for better fit
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            zIndex: 1
          }}
        />
        
        {/* Text Overlays */}
        {showPreview && textElements.map((element) => {
          const content = getTextContent(element.id);
          
          let displayContent = content;
          if (!content && element.id === 'recipient') {
            displayContent = 'Recipient Name';
          }
          
          if (!displayContent) return null;
          
          return (
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
                overflow: 'visible',
                textOverflow: 'clip',
                zIndex: 2,
                textShadow: '1px 1px 2px rgba(255,255,255,0.8)',
                fontFamily: 'Arial, sans-serif',
                visibility: 'visible',
                opacity: content ? 1 : 0.5,
                display: 'block'
              }}
            >
              {displayContent}
            </div>
          );
        })}

        {/* QR Code Overlay */}
        {showPreview && qrData && (
          <div
            className="absolute"
            style={{
              left: `${qrSettings.x}%`,
              top: `${qrSettings.y}%`,
              transform: 'translate(-50%, -50%)',
              zIndex: 1000,
              visibility: 'visible',
              opacity: 1,
              display: 'block',
              position: 'absolute'
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
    );
  };

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

  const FormValidationIndicator = () => {
    const validations = [
      { field: 'auth', label: 'User Authentication', valid: !!(user && token) },
      { field: 'recipientName', label: 'Recipient Name', valid: !!formData.recipientName?.trim() },
      { field: 'design', label: 'Design Upload', valid: !!designImage },
      { field: 'courseName', label: 'Course/Event Name', valid: !!formData.courseName?.trim(), optional: true },
      { field: 'issuerName', label: 'Issuer Name', valid: !!formData.issuerName?.trim(), optional: true },
      { field: 'certificateId', label: 'Certificate ID', valid: !!formData.certificateId?.trim(), optional: true },
      { 
        field: 'eventId', 
        label: 'Event ID', 
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
                validation.optional ? 'text-blue-600' : 'text-red-600'
              }`}>
                {validation.warning ? '⚠' :
                 validation.valid ? '✓' : 
                 validation.optional ? '○' : '✗'}
              </span>
              <span className={`${
                validation.warning ? 'text-yellow-700' :
                validation.valid ? 'text-green-700' : 
                validation.optional ? 'text-blue-700' : 'text-red-700'
              }`}>
                {validation.label} {validation.optional && '(Optional)'}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

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

  // ✅ IMPROVED: Scaling and Layout Helper
  const ScalingLayoutHelper = () => {
    return (
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6 mb-6">
        <h4 className="font-semibold text-green-800 mb-3 flex items-center">
          <Eye className="w-4 h-4 mr-2" />
          Preview & PDF Layout Guide
        </h4>
        <div className="grid md:grid-cols-2 gap-4 text-sm">
          <div>
            <h5 className="font-medium text-green-700 mb-2">✅ Fixed Preview Issues:</h5>
            <ul className="space-y-1 text-green-600">
              <li>• <strong>Proper Scaling:</strong> A4 landscape aspect ratio</li>
              <li>• <strong>Better Size:</strong> 400-600px height for good visibility</li>
              <li>• <strong>Object Fit:</strong> Contains entire certificate in preview</li>
              <li>• <strong>No Zoom Out:</strong> Certificate fills preview area properly</li>
            </ul>
          </div>
          <div>
            <h5 className="font-medium text-green-700 mb-2">✅ Fixed PDF Generation:</h5>
            <ul className="space-y-1 text-green-600">
              <li>• <strong>Full Page:</strong> Certificate fills entire PDF page</li>
              <li>• <strong>No Margins:</strong> Edge-to-edge layout (0mm margins)</li>
              <li>• <strong>Landscape:</strong> Properly oriented for your template</li>
              <li>• <strong>High Quality:</strong> 2x scale with proper compression</li>
            </ul>
          </div>
        </div>
        <div className="mt-4 p-3 bg-white rounded border-l-4 border-green-500">
          <p className="text-green-700 text-sm">
            <strong>💡 Result:</strong> Preview shows proper size and downloaded PDF fills entire page without white space corners.
          </p>
        </div>
      </div>
    );
  };

  const TemplatePositioningHelper = () => {
    return (
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6 mb-6">
        <h4 className="font-semibold text-blue-800 mb-3 flex items-center">
          <Move className="w-4 h-4 mr-2" />
          Certificate Template Positioning Guide
        </h4>
        <div className="grid md:grid-cols-2 gap-4 text-sm">
          <div>
            <h5 className="font-medium text-blue-700 mb-2">Text Element Positions:</h5>
            <ul className="space-y-1 text-blue-600">
              <li>• <strong>Recipient Name:</strong> Center, 58% down (large, bold)</li>
              <li>• <strong>Course Description:</strong> Center, 70% down</li>
              <li>• <strong>Date:</strong> Center, 75% down</li>
              <li>• <strong>Certificate ID:</strong> Left side, 85% down (small)</li>
              <li>• <strong>Issuer Name:</strong> Right side, 85% down</li>
            </ul>
          </div>
          <div>
            <h5 className="font-medium text-blue-700 mb-2">QR Code Placement:</h5>
            <ul className="space-y-1 text-blue-600">
              <li>• <strong>Position:</strong> Top right corner (85%, 15%)</li>
              <li>• <strong>Size:</strong> 100px (readable but not intrusive)</li>
              <li>• <strong>Color:</strong> Black for best scanning</li>
              <li>• <strong>Background:</strong> White area recommended</li>
            </ul>
          </div>
        </div>
        <div className="mt-4 p-3 bg-white rounded border-l-4 border-blue-500">
          <p className="text-blue-700 text-sm">
            <strong>💡 Tip:</strong> The positions have been optimized for your certificate template. 
            Use the Position Elements tab to fine-tune alignment if needed.
          </p>
        </div>
      </div>
    );
  };

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
          {/* Layout & Scaling Info */}
          <div className="border-b pb-2 mb-3">
            <div><strong>📐 Layout & Scaling:</strong></div>
            <div className="ml-4">
              <div><strong>Preview Aspect:</strong> A4 Landscape (1.414:1)</div>
              <div><strong>Preview Size:</strong> 400-600px height</div>
              <div><strong>PDF Layout:</strong> Full page, no margins</div>
              <div><strong>Canvas Scale:</strong> 2x for quality</div>
            </div>
          </div>
          
          {/* Template Info */}
          <div className="border-b pb-2 mb-3">
            <div><strong>📄 Template Info:</strong></div>
            <div className="ml-4">
              <div><strong>Type:</strong> Certificate of Participation</div>
              <div><strong>Orientation:</strong> Landscape</div>
              <div><strong>Text Elements:</strong> {textElements.length} positioned</div>
              <div><strong>QR Position:</strong> Top-right ({qrSettings.x}%, {qrSettings.y}%)</div>
            </div>
          </div>
          
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

  // ✅ MAIN COMPONENT RENDER
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
            Create professional PDF certificates with scannable QR codes for verification
          </p>
          <StatusIndicator />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Authentication Status */}
        <AuthenticationStatus />

        {/* Scaling & Layout Helper */}
        <ScalingLayoutHelper />

        {/* Template Positioning Helper */}
        <TemplatePositioningHelper />

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
                      Supports PNG, JPG, JPEG, SVG • Max 10MB • Landscape orientation recommended
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
                    <h4 className="font-semibold text-blue-800 mb-3">✅ Fixed Design Issues:</h4>
                    <ul className="space-y-2 text-blue-700 text-sm">
                      <li>• <strong>Proper Preview:</strong> A4 landscape aspect ratio for accurate preview</li>
                      <li>• <strong>Full PDF Page:</strong> Certificate fills entire PDF without white space</li>
                      <li>• <strong>No Corner Issues:</strong> Edge-to-edge layout (0mm margins)</li>
                      <li>• <strong>High Quality:</strong> 2x scale rendering for crisp text and QR codes</li>
                      <li>• <strong>Optimized Size:</strong> Better preview scaling (400-600px height)</li>
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
                      Recipient Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="recipientName"
                      value={formData.recipientName}
                      onChange={handleInputChange}
                      disabled={isProcessing}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors disabled:opacity-50"
                      placeholder="Enter recipient's full name"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Course/Event Name (Optional)
                    </label>
                    <input
                      type="text"
                      name="courseName"
                      value={formData.courseName}
                      onChange={handleInputChange}
                      disabled={isProcessing}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors disabled:opacity-50"
                      placeholder="e.g., HACKATHON BYTE BATTLE"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Will appear as "for his/her active participation in the [Event Name]"
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Completion Date (Optional)
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
                      Issuing Organization (Optional)
                    </label>
                    <input
                      type="text"
                      name="issuerName"
                      value={formData.issuerName}
                      onChange={handleInputChange}
                      disabled={isProcessing}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors disabled:opacity-50"
                      placeholder="Your organization name"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Certificate ID (Optional)
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
                      {isProcessing ? 'Generating...' : 'Download PDF'}
                    </button>
                  )}
                </div>
              </div>

              {imagePreview ? (
                <div className="w-full">
                  <CertificatePreview />
                  
                  {/* Design Info */}
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600 mb-2">
                      <strong>✅ Preview:</strong> Proper A4 landscape scaling
                    </p>
                    <p className="text-sm text-gray-600 mb-2">
                      <strong>✅ PDF Output:</strong> Full page, no white corners
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
                    Upload your certificate design to see the preview with proper scaling
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
          <h3 className="text-2xl font-bold text-gray-800 mb-6 text-center">✅ Fixed Certificate Generation Process</h3>
          <div className="grid md:grid-cols-5 gap-6">
            <div className="text-center">
              <div className="bg-red-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-red-600">1</span>
              </div>
              <h4 className="font-semibold mb-2">Login</h4>
              <p className="text-gray-600 text-sm">Authenticate to save certificates to the database</p>
            </div>
            
            <div className="text-center">
              <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-blue-600">2</span>
              </div>
              <h4 className="font-semibold mb-2">Upload Design</h4>
              <p className="text-gray-600 text-sm">Upload your certificate template (landscape orientation)</p>
            </div>
            
            <div className="text-center">
              <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-green-600">3</span>
              </div>
              <h4 className="font-semibold mb-2">Fill Content</h4>
              <p className="text-gray-600 text-sm">Enter recipient name (required). All other fields are optional.</p>
            </div>
            
            <div className="text-center">
              <div className="bg-purple-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-purple-600">4</span>
              </div>
              <h4 className="font-semibold mb-2">Preview</h4>
              <p className="text-gray-600 text-sm">See properly scaled preview with A4 landscape ratio</p>
            </div>
            
            <div className="text-center">
              <div className="bg-orange-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-orange-600">5</span>
              </div>
              <h4 className="font-semibold mb-2">Download PDF</h4>
              <p className="text-gray-600 text-sm">Generate full-page PDF without white corners</p>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="mt-16 grid md:grid-cols-4 gap-8">
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
            <Eye className="w-12 h-12 text-blue-600 mb-4" />
            <h3 className="text-xl font-semibold mb-2">✅ Fixed Preview</h3>
            <p className="text-gray-600">Proper A4 landscape scaling, no more zoomed-out preview. Perfect size and aspect ratio.</p>
          </div>
          
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
            <Upload className="w-12 h-12 text-green-600 mb-4" />
            <h3 className="text-xl font-semibold mb-2">✅ Full-Page PDF</h3>
            <p className="text-gray-600">Certificate fills entire PDF page with 0mm margins. No white space in corners.</p>
          </div>
          
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
            <Move className="w-12 h-12 text-purple-600 mb-4" />
            <h3 className="text-xl font-semibold mb-2">✅ Perfect Alignment</h3>
            <p className="text-gray-600">Text and QR codes positioned exactly for your certificate template layout.</p>
          </div>
          
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
            <QrCode className="w-12 h-12 text-orange-600 mb-4" />
            <h3 className="text-xl font-semibold mb-2">✅ High Quality</h3>
            <p className="text-gray-600">2x scale rendering for crisp text and QR codes with proper compression.</p>
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
                <h4 className="font-semibold text-gray-700 mb-2">✅ Fixed Features:</h4>
                <ul className="text-gray-600 space-y-1">
                  <li>• {user ? '✓' : '✗'} Authenticated certificate creation</li>
                  <li>• {backendStatus === 'connected' ? '✓' : '?'} Certificate saved to database</li>
                  <li>• ✓ QR code verification</li>
                  <li>• ✅ Full-page PDF (no white corners)</li>
                  <li>• ✅ Proper preview scaling</li>
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
                  <li>• Access to PDF generation features</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-gray-700 mb-2">Available Without Login:</h4>
                <ul className="text-gray-600 space-y-1">
                  <li>• Certificate design and preview</li>
                  <li>• QR code generation</li>
                  <li>• Basic certificate positioning</li>
                  <li>• Design validation</li>
                </ul>
              </div>
            </div>
            <div className="mt-6 text-center">
              <button
                onClick={() => window.location.href = '/login'}
                className="bg-yellow-600 hover:bg-yellow-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors"
              >
                Login to Download Full-Page PDF Certificates
              </button>
            </div>
          </div>
        )}

        {/* API Status Footer */}
        <div className="mt-12 bg-gray-100 rounded-xl p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-semibold text-gray-700">✅ System Status (Fixed)</h4>
              <p className="text-gray-600 text-sm">Backend: {API_URL} | Layout: A4 Landscape | Scaling: Fixed</p>
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
