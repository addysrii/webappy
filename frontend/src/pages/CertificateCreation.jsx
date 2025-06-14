// ✅ PART 1: Imports and Constants
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Download, Award, QrCode, Eye, RefreshCw, Upload, Image, Move, RotateCcw, Trash2, TestTube, User, Building } from 'lucide-react';
import QRCode from 'react-qr-code';
import html2canvas from 'html2canvas';
import { useAuth } from '../context/AuthContext';
import api, { testConnection, checkServerConnection } from '../services/api';

// ✅ Define API_URL constant to fix import issue
const API_URL = process.env.REACT_APP_API_URL || 'https://meetkats-backend.onrender.com';

// ✅ Color Compatibility System - Enhanced for all browsers
const createColorCompatibilityLayer = () => {
  return {
    // Tailwind color mappings
    'rgb(37, 99, 235)': '#2563eb', // blue-600
    'rgb(16, 185, 129)': '#10b981', // green-500
    'rgb(147, 51, 234)': '#9333ea', // purple-600
    'rgb(220, 38, 38)': '#dc2626',  // red-600
    'rgb(75, 85, 99)': '#4b5563',   // gray-600
    'rgb(55, 65, 81)': '#374151',   // gray-700
    'rgb(31, 41, 55)': '#1f2937',   // gray-800
    'rgb(249, 250, 251)': '#f9fafb', // gray-50
    'rgb(255, 255, 255)': '#ffffff', // white
    'rgb(0, 0, 0)': '#000000',      // black
    'rgb(59, 130, 246)': '#3b82f6', // blue-500
    'rgb(34, 197, 94)': '#22c55e',  // green-500
    'rgb(168, 85, 247)': '#a855f7', // purple-500
    'rgb(239, 68, 68)': '#ef4444',  // red-500
    'rgb(107, 114, 128)': '#6b7280', // gray-500
    'rgb(156, 163, 175)': '#9ca3af', // gray-400
    'rgb(209, 213, 219)': '#d1d5db', // gray-300
    'rgb(229, 231, 235)': '#e5e7eb', // gray-200
    'rgb(243, 244, 246)': '#f3f4f6', // gray-100
    
    // Modern color function fallbacks
    'oklch(0.7 0.15 200)': '#3b82f6',
    'oklch(0.6 0.2 150)': '#10b981',
    'oklch(0.65 0.25 300)': '#9333ea',
    'lab(70% -20 30)': '#10b981',
    'lch(70% 50 200)': '#3b82f6',
    'color(display-p3 0.2 0.6 0.9)': '#3b82f6',
    
    // CSS named colors
    'transparent': 'rgba(0,0,0,0)',
    'currentColor': '#000000',
    'inherit': '#000000'
  };
};

// ✅ Advanced Color Detection and Conversion
const isColorValue = (value) => {
  if (!value || typeof value !== 'string') return false;
  
  return value.startsWith('#') ||
         value.startsWith('rgb') ||
         value.startsWith('hsl') ||
         value.startsWith('oklch') ||
         value.startsWith('lab') ||
         value.startsWith('lch') ||
         value.startsWith('color(') ||
         ['transparent', 'inherit', 'currentColor'].includes(value.toLowerCase());
};

const rgbToHex = (rgb) => {
  try {
    const rgbMatch = rgb.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
    if (!rgbMatch) return '#000000';
    
    const r = parseInt(rgbMatch[1]);
    const g = parseInt(rgbMatch[2]);
    const b = parseInt(rgbMatch[3]);
    
    // Ensure values are within valid range
    const clampedR = Math.max(0, Math.min(255, r));
    const clampedG = Math.max(0, Math.min(255, g));
    const clampedB = Math.max(0, Math.min(255, b));
    
    return `#${((1 << 24) + (clampedR << 16) + (clampedG << 8) + clampedB).toString(16).slice(1).padStart(6, '0')}`;
  } catch (error) {
    console.warn('RGB to hex conversion failed:', error);
    return '#000000';
  }
};

const hslToHex = (hsl) => {
  try {
    const hslMatch = hsl.match(/hsla?\((\d+),\s*(\d+)%,\s*(\d+)%(?:,\s*([\d.]+))?\)/);
    if (!hslMatch) return '#000000';
    
    let h = parseInt(hslMatch[1]) / 360;
    let s = parseInt(hslMatch[2]) / 100;
    let l = parseInt(hslMatch[3]) / 100;
    
    // Clamp values
    h = Math.max(0, Math.min(1, h));
    s = Math.max(0, Math.min(1, s));
    l = Math.max(0, Math.min(1, l));
    
    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };
    
    let r, g, b;
    if (s === 0) {
      r = g = b = l;
    } else {
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1/3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1/3);
    }
    
    const hexR = Math.round(r * 255);
    const hexG = Math.round(g * 255);
    const hexB = Math.round(b * 255);
    
    return `#${((1 << 24) + (hexR << 16) + (hexG << 8) + hexB).toString(16).slice(1).padStart(6, '0')}`;
  } catch (error) {
    console.warn('HSL to hex conversion failed:', error);
    return '#000000';
  }
};
// ✅ PART 2: Advanced Color Conversion Functions

const convertModernColorToHex = (colorValue) => {
  // Direct mapping for known problematic colors
  const modernColorMap = createColorCompatibilityLayer();
  
  if (modernColorMap[colorValue]) {
    return modernColorMap[colorValue];
  }
  
  // Try to extract color information from modern color functions
  try {
    // Handle oklch() function
    if (colorValue.includes('oklch')) {
      const oklchMatch = colorValue.match(/oklch\(([\d.]+)\s+([\d.]+)\s+([\d.]+)\)/);
      if (oklchMatch) {
        const l = parseFloat(oklchMatch[1]);
        const c = parseFloat(oklchMatch[2]);
        const h = parseFloat(oklchMatch[3]);
        
        // Simple approximation - map to common colors based on hue
        if (h >= 0 && h < 60) return '#ef4444';    // red-ish
        if (h >= 60 && h < 120) return '#22c55e';  // green-ish
        if (h >= 120 && h < 180) return '#06b6d4'; // cyan-ish
        if (h >= 180 && h < 240) return '#3b82f6'; // blue-ish
        if (h >= 240 && h < 300) return '#a855f7'; // purple-ish
        if (h >= 300 && h < 360) return '#ec4899'; // pink-ish
      }
    }
    
    // Handle lab() function
    if (colorValue.includes('lab')) {
      const labMatch = colorValue.match(/lab\(([\d.]+)%?\s+([-\d.]+)\s+([-\d.]+)\)/);
      if (labMatch) {
        const l = parseFloat(labMatch[1]);
        const a = parseFloat(labMatch[2]);
        const b = parseFloat(labMatch[3]);
        
        // Simple approximation based on a and b values
        if (a > 0 && b > 0) return '#ef4444';  // red-ish
        if (a < 0 && b > 0) return '#22c55e';  // green-ish
        if (a < 0 && b < 0) return '#3b82f6';  // blue-ish
        if (a > 0 && b < 0) return '#a855f7';  // purple-ish
      }
    }
    
    // Handle color() function
    if (colorValue.includes('color(')) {
      // Extract color space and values
      if (colorValue.includes('display-p3')) {
        const p3Match = colorValue.match(/color\(display-p3\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)\)/);
        if (p3Match) {
          const r = Math.round(parseFloat(p3Match[1]) * 255);
          const g = Math.round(parseFloat(p3Match[2]) * 255);
          const b = Math.round(parseFloat(p3Match[3]) * 255);
          return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).padStart(6, '0')}`;
        }
      }
    }
    
    // Try DOM-based conversion as fallback
    const tempDiv = document.createElement('div');
    tempDiv.style.color = colorValue;
    tempDiv.style.display = 'none';
    document.body.appendChild(tempDiv);
    
    const computed = window.getComputedStyle(tempDiv).color;
    document.body.removeChild(tempDiv);
    
    if (computed && computed !== colorValue && computed.startsWith('rgb')) {
      return rgbToHex(computed);
    }
    
  } catch (error) {
    console.warn('Modern color conversion failed:', error);
  }
  
  // Ultimate fallback
  return '#000000';
};

const convertToSafeColor = (colorValue, colorMap) => {
  if (!colorValue || typeof colorValue !== 'string') {
    return '#000000';
  }
  
  // Remove whitespace and normalize
  const normalizedColor = colorValue.trim().toLowerCase();
  
  // Direct mapping lookup
  if (colorMap[colorValue] || colorMap[normalizedColor]) {
    return colorMap[colorValue] || colorMap[normalizedColor];
  }
  
  // Handle modern color functions
  if (normalizedColor.includes('oklch') || 
      normalizedColor.includes('lab(') || 
      normalizedColor.includes('lch(') ||
      normalizedColor.includes('color(')) {
    return convertModernColorToHex(colorValue);
  }
  
  // Handle RGB/RGBA
  if (normalizedColor.startsWith('rgb')) {
    return rgbToHex(colorValue);
  }
  
  // Handle HSL/HSLA
  if (normalizedColor.startsWith('hsl')) {
    return hslToHex(colorValue);
  }
  
  // If it's already a hex color, validate and return
  if (normalizedColor.startsWith('#')) {
    const hexPattern = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;
    if (hexPattern.test(normalizedColor)) {
      return normalizedColor.length === 4 
        ? `#${normalizedColor[1]}${normalizedColor[1]}${normalizedColor[2]}${normalizedColor[2]}${normalizedColor[3]}${normalizedColor[3]}`
        : normalizedColor;
    }
  }
  
  // Handle named colors
  const namedColors = {
    'black': '#000000',
    'white': '#ffffff',
    'red': '#ff0000',
    'green': '#008000',
    'blue': '#0000ff',
    'yellow': '#ffff00',
    'cyan': '#00ffff',
    'magenta': '#ff00ff',
    'silver': '#c0c0c0',
    'gray': '#808080',
    'grey': '#808080',
    'maroon': '#800000',
    'olive': '#808000',
    'lime': '#00ff00',
    'aqua': '#00ffff',
    'teal': '#008080',
    'navy': '#000080',
    'fuchsia': '#ff00ff',
    'purple': '#800080',
    'orange': '#ffa500',
    'transparent': 'rgba(0,0,0,0)',
    'inherit': '#000000',
    'currentcolor': '#000000',
    'initial': '#000000',
    'unset': '#000000'
  };
  
  if (namedColors[normalizedColor]) {
    return namedColors[normalizedColor];
  }
  
  // If all else fails, return black
  console.warn(`Could not convert color: ${colorValue}, using fallback #000000`);
  return '#000000';
};

// ✅ Enhanced Color Preprocessing - Works across all browsers
const preprocessElementColors = (element) => {
  const colorMap = createColorCompatibilityLayer();
  const originalStyles = new Map();
  
  try {
    // Get all elements including the root
    const walker = document.createTreeWalker(
      element,
      NodeFilter.SHOW_ELEMENT,
      null,
      false
    );
    
    const elementsToProcess = [element]; // Include root element
    let node = walker.nextNode();
    while (node) {
      elementsToProcess.push(node);
      node = walker.nextNode();
    }
    
    console.log(`🎨 Processing ${elementsToProcess.length} elements for color compatibility`);
    
    elementsToProcess.forEach((el, index) => {
      try {
        // Store original style for restoration
        originalStyles.set(index, {
          element: el,
          originalStyle: el.style.cssText,
          originalClassName: el.className
        });
        
        const computedStyle = window.getComputedStyle(el);
        
        // Process all color-related properties
        const colorProperties = [
          'color',
          'backgroundColor', 
          'borderColor',
          'borderTopColor',
          'borderRightColor', 
          'borderBottomColor',
          'borderLeftColor',
          'outlineColor',
          'textDecorationColor',
          'caretColor',
          'columnRuleColor',
          'floodColor',
          'lightingColor',
          'stopColor'
        ];
        
        colorProperties.forEach(prop => {
          try {
            const value = computedStyle[prop];
            if (value && 
                value !== 'rgba(0, 0, 0, 0)' && 
                value !== 'transparent' && 
                value !== 'inherit' &&
                value !== 'initial' &&
                value !== 'unset') {
              
              const safeColor = convertToSafeColor(value, colorMap);
              if (safeColor !== value) {
                el.style.setProperty(prop, safeColor, 'important');
              }
            }
          } catch (propError) {
            console.warn(`Failed to process property ${prop}:`, propError);
          }
        });
        
        // Handle CSS custom properties (CSS variables)
        try {
          const allStyles = el.style;
          for (let i = 0; i < allStyles.length; i++) {
            const property = allStyles[i];
            if (property.startsWith('--')) {
              const value = allStyles.getPropertyValue(property);
              if (isColorValue(value)) {
                const safeColor = convertToSafeColor(value, colorMap);
                el.style.setProperty(property, safeColor, 'important');
              }
            }
          }
        } catch (cssVarError) {
          console.warn('CSS variable processing failed:', cssVarError);
        }
        
        // Remove problematic CSS classes
        if (el.className && typeof el.className === 'string') {
          const classList = el.className.split(' ');
          const safeClasses = classList.filter(cls => 
            cls &&
            !cls.includes('gradient') && 
            !cls.includes('shadow-') &&
            !cls.includes('ring-') &&
            !cls.includes('backdrop-') &&
            !cls.includes('filter')
          );
          if (safeClasses.length !== classList.length) {
            el.className = safeClasses.join(' ');
          }
        }
        
      } catch (elementError) {
        console.warn(`Failed to process element at index ${index}:`, elementError);
      }
    });
    
    console.log('✅ Color preprocessing completed successfully');
    return originalStyles;
    
  } catch (error) {
    console.error('❌ Color preprocessing failed:', error);
    return new Map(); // Return empty map to avoid errors
  }
};
// ✅ PART 3: Main Component Setup and State

const QRCertificateGenerator = () => {
  const { user, token } = useAuth();
  
  // ✅ Form state
  const [formData, setFormData] = useState({
    recipientName: '',
    courseName: '',
    completionDate: '',
    issuerName: '',
    certificateId: '',
    description: '',
    eventId: ''
  });

  // ✅ Design and preview state
  const [designImage, setDesignImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [qrData, setQrData] = useState('');
  
  // ✅ Text positioning state
  const [textElements, setTextElements] = useState([
    { id: 'recipient', label: 'Recipient Name', x: 50, y: 40, fontSize: 24, color: '#1f2937', fontWeight: 'bold', textAlign: 'center' },
    { id: 'course', label: 'Course Name', x: 50, y: 55, fontSize: 18, color: '#374151', fontWeight: 'normal', textAlign: 'center' },
    { id: 'date', label: 'Date', x: 20, y: 80, fontSize: 14, color: '#6b7280', fontWeight: 'normal', textAlign: 'left' },
    { id: 'issuer', label: 'Issuer', x: 80, y: 80, fontSize: 14, color: '#6b7280', fontWeight: 'normal', textAlign: 'right' },
    { id: 'certId', label: 'Certificate ID', x: 20, y: 85, fontSize: 12, color: '#9ca3af', fontWeight: 'normal', textAlign: 'left' }
  ]);

  // ✅ QR code settings
  const [qrSettings, setQrSettings] = useState({
    x: 85,
    y: 15,
    size: 120,
    color: '#000000'
  });

  // ✅ UI state
  const [dragElement, setDragElement] = useState(null);
  const [activeTab, setActiveTab] = useState('upload');
  const [isProcessing, setIsProcessing] = useState(false);
  const [backendStatus, setBackendStatus] = useState('unknown');
  const [downloadQuality, setDownloadQuality] = useState('high');
  
  // ✅ Refs
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

  console.log('🌐 API_URL resolved to:', API_URL);

  // ✅ Handle file upload with enhanced validation
  const handleFileUpload = useCallback((event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    // Enhanced file validation
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml', 'image/webp'];
    
    if (!allowedTypes.includes(file.type)) {
      alert('Please upload a valid image file (PNG, JPG, JPEG, SVG, WebP)');
      return;
    }
    
    if (file.size > maxSize) {
      alert('File size must be less than 10MB');
      return;
    }
    
    setDesignImage(file);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target.result);
      console.log('✅ Image preview loaded successfully');
    };
    reader.onerror = (e) => {
      console.error('❌ Failed to read image file:', e);
      alert('Failed to read the image file. Please try a different file.');
    };
    reader.readAsDataURL(file);
  }, []);

  // ✅ Generate random certificate ID with better format
  const generateCertificateId = () => {
    const timestamp = Date.now();
    const randomPart = Math.random().toString(36).substr(2, 6).toUpperCase();
    const userPart = user?.id ? user.id.slice(-4).toUpperCase() : 'USER';
    const id = `CERT-${userPart}-${timestamp}-${randomPart}`;
    setFormData(prev => ({ ...prev, certificateId: id }));
    return id;
  };

  // ✅ Handle input changes with validation
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Special handling for specific fields
    if (name === 'recipientName') {
      // Only allow letters, spaces, hyphens, and apostrophes
      const sanitizedValue = value.replace(/[^a-zA-Z\s\-'\.]/g, '');
      setFormData(prev => ({ ...prev, [name]: sanitizedValue }));
    } else if (name === 'certificateId') {
      // Only allow alphanumeric, hyphens, and underscores
      const sanitizedValue = value.replace(/[^a-zA-Z0-9\-_]/g, '').toUpperCase();
      setFormData(prev => ({ ...prev, [name]: sanitizedValue }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  // ✅ Update text element properties with validation
  const updateTextElement = (id, property, value) => {
    setTextElements(prev => 
      prev.map(element => {
        if (element.id === id) {
          // Validate numeric properties
          if (['x', 'y', 'fontSize'].includes(property)) {
            const numValue = Math.max(0, Math.min(property === 'fontSize' ? 72 : 100, value));
            return { ...element, [property]: numValue };
          }
          // Validate color property
          if (property === 'color') {
            const safeColor = convertToSafeColor(value, createColorCompatibilityLayer());
            return { ...element, [property]: safeColor };
          }
          return { ...element, [property]: value };
        }
        return element;
      })
    );
  };

  // ✅ Update QR settings with validation
  const updateQRSettings = (property, value) => {
    setQrSettings(prev => {
      if (property === 'color') {
        const safeColor = convertToSafeColor(value, createColorCompatibilityLayer());
        return { ...prev, [property]: safeColor };
      }
      if (['x', 'y'].includes(property)) {
        const numValue = Math.max(0, Math.min(100, value));
        return { ...prev, [property]: numValue };
      }
      if (property === 'size') {
        const numValue = Math.max(60, Math.min(300, value));
        return { ...prev, [property]: numValue };
      }
      return { ...prev, [property]: value };
    });
  };

  // ✅ Get text content for each element
  const getTextContent = (elementId) => {
    switch(elementId) {
      case 'recipient': return formData.recipientName || 'John Doe';
      case 'course': return formData.courseName || 'Certificate of Achievement';
      case 'date': return formData.completionDate || new Date().toISOString().split('T')[0];
      case 'issuer': return formData.issuerName || 'Certificate Authority';
      case 'certId': return formData.certificateId || 'CERT-ID-PLACEHOLDER';
      default: return '';
    }
  };

  // ✅ Style restoration function
  const restoreOriginalStyles = (originalStylesMap) => {
    if (!originalStylesMap || typeof originalStylesMap.forEach !== 'function') {
      console.warn('Invalid originalStylesMap provided to restoreOriginalStyles');
      return;
    }
    
    try {
      originalStylesMap.forEach((styleData, index) => {
        if (styleData && styleData.element && styleData.element.parentNode) {
          try {
            styleData.element.style.cssText = styleData.originalStyle;
            if (styleData.originalClassName !== undefined) {
              styleData.element.className = styleData.originalClassName;
            }
          } catch (elementError) {
            console.warn(`Failed to restore style for element at index ${index}:`, elementError);
          }
        }
      });
      console.log('✅ Original styles restored successfully');
    } catch (error) {
      console.error('❌ Error restoring original styles:', error);
    }
  };
  // ✅ PART 4: Form Validation and QR Code Generation

  // ✅ Enhanced validation with comprehensive checks
  const validateAndFixFormData = () => {
    console.log('🔍 Validating form data...');
    
    const errors = [];
    const fixes = [];
    
    // Required field validation
    if (!formData.recipientName?.trim()) {
      errors.push('Recipient name is required');
    } else if (formData.recipientName.trim().length < 2) {
      errors.push('Recipient name must be at least 2 characters');
    }
    
    if (!designImage) {
      errors.push('Please upload a certificate design');
    }
    
    // Auto-fixes for optional fields
    if (formData.eventId === 'manual-certificate') {
      setFormData(prev => ({ ...prev, eventId: '' }));
      fixes.push('Cleared invalid eventId format');
    }
    
    if (!formData.certificateId?.trim()) {
      const newId = generateCertificateId();
      fixes.push(`Generated certificate ID: ${newId}`);
    } else if (formData.certificateId.length < 8) {
      const newId = generateCertificateId();
      setFormData(prev => ({ ...prev, certificateId: newId }));
      fixes.push(`Regenerated certificate ID (too short): ${newId}`);
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

  // ✅ Enhanced QR Code generation with multiple fallbacks
  const generateQRAsDataURL = async (data, size, color) => {
    if (!data) {
      console.warn('No QR data provided');
      return null;
    }
    
    try {
      console.log('🔄 Generating QR code with external API...');
      
      // Clean the color value (remove # if present)
      const cleanColor = color.replace('#', '');
      
      // ✅ Method 1: QR Server API (most reliable)
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(data)}&color=${cleanColor}&bgcolor=ffffff&format=png&ecc=M&margin=10`;
      
      try {
        const response = await fetch(qrUrl, {
          method: 'GET',
          mode: 'cors',
          cache: 'no-cache'
        });
        
        if (response.ok) {
          const blob = await response.blob();
          
          return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = () => reject(new Error('FileReader failed'));
            reader.readAsDataURL(blob);
          });
        } else {
          throw new Error(`QR API returned status: ${response.status}`);
        }
      } catch (apiError) {
        console.warn('QR Server API failed:', apiError);
        throw apiError;
      }
      
    } catch (error) {
      console.error('External QR generation failed:', error);
      
      // ✅ Method 2: Fallback to canvas-based generation
      console.log('🔄 Trying fallback QR generation...');
      return generateQRCanvas(data, size, color);
    }
  };

  // ✅ Fallback QR generation using canvas with better pattern
  const generateQRCanvas = (data, size, color) => {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      
      // White background with padding
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, size, size);
      
      // Calculate inner area for QR pattern
      const padding = Math.floor(size * 0.1); // 10% padding
      const innerSize = size - (padding * 2);
      const gridSize = Math.floor(innerSize / 25);
      const offsetX = padding;
      const offsetY = padding;
      
      ctx.fillStyle = color;
      
      // Create a more realistic QR-like pattern
      const pattern = [
        // Top-left finder pattern
        [0, 0, 7, 7], [1, 1, 5, 5], [2, 2, 3, 3],
        // Top-right finder pattern  
        [18, 0, 7, 7], [19, 1, 5, 5], [20, 2, 3, 3],
        // Bottom-left finder pattern
        [0, 18, 7, 7], [1, 19, 5, 5], [2, 20, 3, 3],
        // Timing patterns
        ...Array.from({length: 9}, (_, i) => [8, 6 + i * 2, 1, 1]),
        ...Array.from({length: 9}, (_, i) => [6 + i * 2, 8, 1, 1]),
        // Data pattern (simplified)
        ...Array.from({length: 50}, () => {
          const x = Math.floor(Math.random() * 25);
          const y = Math.floor(Math.random() * 25);
          // Avoid finder patterns and timing patterns
          if ((x < 9 && y < 9) || (x > 15 && y < 9) || (x < 9 && y > 15) || x === 8 || y === 8) {
            return null;
          }
          return [x, y, 1, 1];
        }).filter(Boolean)
      ];
      
      // Draw the pattern
      pattern.forEach(([x, y, w, h]) => {
        ctx.fillRect(
          offsetX + x * gridSize,
          offsetY + y * gridSize,
          w * gridSize,
          h * gridSize
        );
      });
      
      console.log('✅ Fallback QR canvas generated');
      return canvas.toDataURL('image/png', 1.0);
      
    } catch (canvasError) {
      console.error('Canvas QR generation failed:', canvasError);
      
      // ✅ Final fallback: Simple placeholder
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      
      // White background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, size, size);
      
      // Black border
      ctx.fillStyle = color;
      ctx.fillRect(0, 0, size, 10);
      ctx.fillRect(0, 0, 10, size);
      ctx.fillRect(size-10, 0, 10, size);
      ctx.fillRect(0, size-10, size, 10);
      
      // QR placeholder text
      ctx.fillStyle = color;
      ctx.font = `${Math.floor(size/8)}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('QR', size/2, size/2);
      
      return canvas.toDataURL('image/png', 1.0);
    }
  };

  // ✅ Enhanced QR Code Display Component
  const QRCodeDisplay = ({ data, size, color }) => {
    const [qrDataUrl, setQrDataUrl] = useState('');
    const [qrError, setQrError] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    
    useEffect(() => {
      if (!data) {
        setQrDataUrl('');
        setQrError(false);
        return;
      }
      
      const generateQRDataUrl = async () => {
        setIsLoading(true);
        setQrError(false);
        
        try {
          console.log(`🔄 Generating QR code for: ${data.substring(0, 50)}...`);
          const dataUrl = await generateQRAsDataURL(data, size, color);
          
          if (dataUrl) {
            setQrDataUrl(dataUrl);
            console.log('✅ QR code generated successfully');
          } else {
            throw new Error('QR generation returned null');
          }
        } catch (error) {
          console.error('❌ QR generation error:', error);
          setQrError(true);
        } finally {
          setIsLoading(false);
        }
      };
      
      generateQRDataUrl();
    }, [data, size, color]);
    
    if (!data) {
      return (
        <div 
          className="bg-gray-100 flex items-center justify-center rounded border-2 border-dashed border-gray-300"
          style={{ width: size, height: size }}
        >
          <span className="text-gray-500 text-sm text-center px-2">No QR Data</span>
        </div>
      );
    }

    if (isLoading) {
      return (
        <div 
          className="bg-blue-50 flex items-center justify-center rounded border border-blue-200"
          style={{ width: size, height: size }}
        >
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <span className="text-blue-600 text-xs">Generating...</span>
          </div>
        </div>
      );
    }

    if (qrError || !qrDataUrl) {
      return (
        <div 
          className="bg-red-100 flex items-center justify-center rounded border border-red-200"
          style={{ width: size, height: size }}
        >
          <div className="text-center px-2">
            <span className="text-red-500 text-sm">QR Error</span>
            <div className="text-xs text-red-400 mt-1">Generation Failed</div>
          </div>
        </div>
      );
    }

    return (
      <div 
        className="bg-white rounded shadow-sm border border-gray-200"
        style={{ 
          padding: '8px',
          display: 'inline-block',
          width: size,
          height: size,
          boxSizing: 'border-box'
        }}
      >
        <img 
          src={qrDataUrl}
          alt="QR Code"
          style={{
            width: size - 16,
            height: size - 16,
            imageRendering: 'pixelated',
            display: 'block',
            objectFit: 'contain'
          }}
          crossOrigin="anonymous"
          onLoad={() => console.log('✅ QR image loaded for display')}
          onError={(e) => {
            console.error('❌ QR image failed to load');
            setQrError(true);
          }}
        />
      </div>
    );
  };
  // ✅ PART 5: Backend Connection and Testing Functions

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

  // ✅ Generate certificate with enhanced error handling
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
      // Test backend connection first
      const backendOk = await testBackendConnection();
      if (!backendOk) {
        console.warn('⚠️ Backend connection failed, continuing with local generation only');
      }

      // Ensure certificate ID exists
      const certificateId = formData.certificateId || generateCertificateId();
      
      if (!formData.certificateId) {
        setFormData(prev => ({ ...prev, certificateId: certificateId }));
      }

      // Generate verification URL
      const verificationUrl = `https://meetkats.com/certificates/${certificateId}`;
      
      console.log('🔄 Setting QR data and enabling preview...');
      setQrData(verificationUrl);
      setShowPreview(true);
      
      // Wait for React to update the DOM and QR code to generate
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log('✅ Certificate generated successfully with QR code:', verificationUrl);
      
    } catch (error) {
      console.error('❌ Certificate generation error:', error);
      alert(`Failed to generate certificate: ${error.message}\n\nPlease try again or check your connection.`);
    } finally {
      setIsProcessing(false);
    }
  };

  // ✅ Test QR code functionality
  const testQRCode = () => {
    if (!qrData) {
      alert('Please generate a certificate first to test the QR code');
      return;
    }
    
    console.log('🧪 Testing QR Code:', qrData);
    console.log('🌐 API Service URL:', API_URL);
    console.log('🔐 User:', user?.email);
    
    // Try to open in new window
    try {
      const testWindow = window.open(qrData, '_blank', 'width=600,height=400,scrollbars=yes');
      
      if (!testWindow) {
        // Popup blocked, show manual URL
        const message = `QR Code URL: ${qrData}\n\nAPI Service: ${API_URL}\nUser: ${user?.email}\n\nPopup was blocked. You can copy this URL and test it manually in a new tab.`;
        
        // Try to copy to clipboard
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(qrData).then(() => {
            alert(message + '\n\nURL has been copied to clipboard!');
          }).catch(() => {
            alert(message);
          });
        } else {
          alert(message);
        }
      } else {
        console.log('✅ QR Code test window opened successfully');
        
        // Set a timeout to check if the window was closed quickly (might indicate an error)
        setTimeout(() => {
          if (testWindow.closed) {
            console.log('ℹ️ Test window was closed');
          } else {
            console.log('✅ Test window is still open');
          }
        }, 2000);
      }
    } catch (error) {
      console.error('❌ Error opening test window:', error);
      alert(`QR Code URL: ${qrData}\n\nCould not open test window. Please copy the URL above and test manually.`);
    }
  };

  // ✅ Reset design with confirmation
  const resetDesign = () => {
    const confirmReset = window.confirm(
      'Are you sure you want to reset the design? This will clear:\n\n' +
      '• Uploaded design image\n' +
      '• Certificate preview\n' +
      '• Generated QR code\n\n' +
      'Your form data will be preserved.'
    );
    
    if (!confirmReset) return;
    
    setDesignImage(null);
    setImagePreview(null);
    setShowPreview(false);
    setQrData('');
    setBackendStatus('unknown');
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    
    console.log('🔄 Design reset completed');
  };

  // ✅ Test canvas capture for debugging
  const testCanvasCapture = async () => {
    if (!certificateRef.current) {
      alert('No certificate element to capture. Please generate a certificate first.');
      return;
    }
    
    try {
      console.log('🧪 Testing canvas capture capabilities...');
      
      // Log element information
      const element = certificateRef.current;
      const elementInfo = {
        offsetWidth: element.offsetWidth,
        offsetHeight: element.offsetHeight,
        scrollWidth: element.scrollWidth,
        scrollHeight: element.scrollHeight,
        clientWidth: element.clientWidth,
        clientHeight: element.clientHeight
      };
      console.log('📐 Element dimensions:', elementInfo);
      
      // Test if html2canvas is available
      if (typeof html2canvas !== 'function') {
        throw new Error('html2canvas is not available');
      }
      
      console.log('🔄 Attempting test canvas capture...');
      
      // Simple test capture with minimal options
      const canvas = await html2canvas(element, {
        scale: 1,
        logging: true,
        useCORS: true,
        allowTaint: false,
        backgroundColor: '#ffffff',
        width: element.offsetWidth,
        height: element.offsetHeight
      });
      
      const canvasInfo = {
        width: canvas.width,
        height: canvas.height,
        dataLength: canvas.toDataURL('image/png').length
      };
      console.log('📊 Canvas info:', canvasInfo);
      
      if (canvas.width === 0 || canvas.height === 0) {
        throw new Error('Canvas has zero dimensions');
      }
      
      const dataURL = canvas.toDataURL('image/png', 0.8);
      
      if (dataURL.length < 1000) {
        throw new Error('Generated image appears to be blank or too small');
      }
      
      // Open in new tab for inspection
      const newTab = window.open();
      if (newTab) {
        newTab.document.write(`
          <html>
            <head><title>Canvas Test Result</title></head>
            <body style="margin: 20px; font-family: Arial, sans-serif;">
              <h2>Canvas Capture Test Results</h2>
              <div style="background: #f5f5f5; padding: 15px; margin: 10px 0; border-radius: 5px;">
                <h3>Element Info:</h3>
                <pre>${JSON.stringify(elementInfo, null, 2)}</pre>
              </div>
              <div style="background: #f5f5f5; padding: 15px; margin: 10px 0; border-radius: 5px;">
                <h3>Canvas Info:</h3>
                <pre>${JSON.stringify(canvasInfo, null, 2)}</pre>
              </div>
              <h3>Captured Image:</h3>
              <img src="${dataURL}" style="max-width: 100%; height: auto; border: 1px solid #ddd;" />
            </body>
          </html>
        `);
      } else {
        alert('✅ Canvas test successful!\n\nCanvas dimensions: ' + canvas.width + 'x' + canvas.height + '\nData size: ' + Math.round(dataURL.length / 1024) + 'KB\n\nPopup blocked - could not show test result window.');
      }
      
      console.log('✅ Canvas test completed successfully');
      
    } catch (error) {
      console.error('❌ Canvas test failed:', error);
      
      let errorMessage = '❌ Canvas Test Failed\n\n';
      errorMessage += `Error: ${error.message}\n\n`;
      
      if (error.message.includes('html2canvas')) {
        errorMessage += 'Issue: html2canvas library problem\n';
        errorMessage += 'Solution: Check if html2canvas is properly loaded\n';
      } else if (error.message.includes('zero dimensions')) {
        errorMessage += 'Issue: Certificate element has no size\n';
        errorMessage += 'Solution: Make sure certificate preview is visible\n';
      } else if (error.message.includes('blank')) {
        errorMessage += 'Issue: Generated image is blank\n';
        errorMessage += 'Solution: Check for CSS or styling issues\n';
      } else {
        errorMessage += 'Check browser console for detailed error information\n';
      }
      
      alert(errorMessage);
    }
  };
  // ✅ PART 6: Enhanced Download Function with Complete Color Fix

  // ✅ MAIN DOWNLOAD FUNCTION - Fixed for all browsers and color issues
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
    let originalStylesMap = null;
    
    try {
      console.log('🎯 Starting certificate download with enhanced color compatibility...');
      
      // ✅ STEP 1: Enhanced color preprocessing
      console.log('🎨 Preprocessing colors for maximum browser compatibility...');
      originalStylesMap = preprocessElementColors(certificateRef.current);
      
      // ✅ STEP 2: Force layout recalculation and wait for changes
      certificateRef.current.offsetHeight; // Trigger reflow
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // ✅ STEP 3: Ensure all images are fully loaded
      console.log('🖼️ Verifying all images are loaded...');
      const images = certificateRef.current.querySelectorAll('img');
      const imagePromises = Array.from(images).map((img, index) => {
        return new Promise((resolve) => {
          if (img.complete && img.naturalWidth > 0) {
            console.log(`✅ Image ${index + 1} already loaded`);
            resolve();
          } else {
            console.log(`⏳ Waiting for image ${index + 1} to load...`);
            const timeout = setTimeout(() => {
              console.warn(`⚠️ Image ${index + 1} load timeout`);
              resolve(); // Don't fail on timeout
            }, 5000);
            
            img.onload = () => {
              clearTimeout(timeout);
              console.log(`✅ Image ${index + 1} loaded successfully`);
              resolve();
            };
            img.onerror = () => {
              clearTimeout(timeout);
              console.warn(`⚠️ Image ${index + 1} failed to load`);
              resolve(); // Don't fail on error
            };
          }
        });
      });
      
      await Promise.all(imagePromises);
      console.log('✅ All images processed');
      
      // ✅ STEP 4: Configure html2canvas with safe, compatible options
      const getScaleForQuality = () => {
        switch(downloadQuality) {
          case 'high': return 2; // Reduced from 3 for stability
          case 'medium': return 1.5;
          case 'low': return 1;
          default: return 1.5;
        }
      };

      const safeOptions = {
        // Basic options
        scale: getScaleForQuality(),
        backgroundColor: "#ffffff",
        
        // Dimensions
        width: certificateRef.current.offsetWidth,
        height: certificateRef.current.offsetHeight,
        
        // Cross-origin and security
        useCORS: true,
        allowTaint: false,
        
        // Rendering options for maximum compatibility
        foreignObjectRendering: false,
        logging: false,
        imageTimeout: 15000,
        
        // Scroll and positioning
        scrollX: 0,
        scrollY: 0,
        x: 0,
        y: 0,
        
        // Element filtering
        ignoreElements: (element) => {
          const tagName = element.tagName?.toLowerCase();
          const classList = Array.from(element.classList || []);
          
          return (
            classList.includes('html2canvas-ignore') ||
            tagName === 'script' ||
            tagName === 'style' ||
            tagName === 'noscript' ||
            element.style?.display === 'none' ||
            element.style?.visibility === 'hidden' ||
            element.style?.opacity === '0'
          );
        },
        
        // ✅ Enhanced clone processing for color compatibility
        onclone: (clonedDoc, element) => {
          try {
            console.log('🔄 Processing cloned document for color compatibility...');
            
            // Apply color-safe stylesheet to cloned document
            const style = clonedDoc.createElement('style');
            style.textContent = `
              /* Force safe colors for html2canvas */
              * {
                -webkit-print-color-adjust: exact !important;
                color-adjust: exact !important;
              }
              
              /* Override problematic color functions */
              *[style*="oklch"], *[style*="lab("], *[style*="lch("] {
                color: #000000 !important;
                background-color: #ffffff !important;
                border-color: #000000 !important;
              }
              
              /* Ensure QR code visibility */
              img[alt*="QR"], img[src*="qr"], [data-qr] img {
                background-color: #ffffff !important;
                border: 1px solid #000000 !important;
              }
              
              /* Force visible text colors */
              .text-gray-800, .text-gray-700 { color: #1f2937 !important; }
              .text-gray-600 { color: #4b5563 !important; }
              .text-blue-600 { color: #2563eb !important; }
              .text-green-600 { color: #16a34a !important; }
              .text-purple-600 { color: #9333ea !important; }
              
              /* Force safe backgrounds */
              .bg-white { background-color: #ffffff !important; }
              .bg-gray-50 { background-color: #f9fafb !important; }
            `;
            clonedDoc.head.appendChild(style);
            
            // Process all elements in cloned document
            const allElements = clonedDoc.querySelectorAll('*');
            allElements.forEach(el => {
              try {
                // Remove CSS custom properties that might cause issues
                const style = el.style;
                for (let i = style.length - 1; i >= 0; i--) {
                  const prop = style[i];
                  if (prop.startsWith('--')) {
                    style.removeProperty(prop);
                  }
                }
                
                // Force safe colors for critical elements
                const computedStyle = clonedDoc.defaultView.getComputedStyle(el);
                
                // Ensure text is visible
                if (computedStyle.color && 
                    (computedStyle.color.includes('oklch') || 
                     computedStyle.color.includes('lab') ||
                     computedStyle.color === 'rgba(0, 0, 0, 0)')) {
                  el.style.setProperty('color', '#000000', 'important');
                }
                
                // Ensure backgrounds are visible
                if (computedStyle.backgroundColor && 
                    (computedStyle.backgroundColor.includes('oklch') || 
                     computedStyle.backgroundColor.includes('lab'))) {
                  el.style.setProperty('background-color', '#ffffff', 'important');
                }
                
                // Ensure borders are visible
                if (computedStyle.borderColor && 
                    (computedStyle.borderColor.includes('oklch') || 
                     computedStyle.borderColor.includes('lab'))) {
                  el.style.setProperty('border-color', '#000000', 'important');
                }
                
              } catch (elemError) {
                console.warn('Element processing warning:', elemError);
              }
            });
            
            console.log('✅ Cloned document processed successfully');
            
          } catch (cloneError) {
            console.warn('⚠️ Clone processing warning (non-critical):', cloneError);
          }
        }
      };

      console.log('📸 Capturing canvas with enhanced compatibility options...');
      const canvas = await html2canvas(certificateRef.current, safeOptions);
      
      // ✅ STEP 5: Verify canvas validity
      if (!canvas || canvas.width === 0 || canvas.height === 0) {
        throw new Error('Canvas capture failed - zero dimensions');
      }
      
      console.log('✅ Canvas captured successfully:', { 
        width: canvas.width, 
        height: canvas.height,
        quality: downloadQuality
      });

      // ✅ STEP 6: Generate high-quality data URL
      const dataURL = canvas.toDataURL('image/png', 0.95);
      
      if (dataURL.length < 2000) {
        throw new Error('Generated image appears to be blank or corrupted');
      }

      console.log('✅ Data URL generated:', Math.round(dataURL.length / 1024) + 'KB');

      // ✅ STEP 7: Download the file
      const fileName = `${formData.recipientName?.replace(/[^a-z0-9\s]/gi, '').replace(/\s+/g, '_') || 'certificate'}_${Date.now()}.png`;
      
      const link = document.createElement('a');
      link.href = dataURL;
      link.download = fileName;
      link.rel = 'noopener noreferrer';
      link.style.display = 'none';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      console.log('✅ Certificate downloaded successfully as:', fileName);

      // ✅ STEP 8: Save to backend with comprehensive error handling
      await saveCertificateToBackend(dataURL, fileName);
      
    } catch (error) {
      console.error('❌ Download error:', error);
      await handleDownloadError(error, certificateRef);
      
    } finally {
      // ✅ STEP 9: Always restore original styles
      if (originalStylesMap) {
        try {
          restoreOriginalStyles(originalStylesMap);
          console.log('✅ Original styles restored successfully');
        } catch (restoreError) {
          console.warn('⚠️ Style restoration warning:', restoreError);
        }
      }
      
      setIsProcessing(false);
    }
  };

  // ✅ Save certificate to backend with multiple endpoint attempts
  const saveCertificateToBackend = async (dataURL, fileName) => {
    try {
      console.log('💾 Attempting to save certificate to backend...');
      
      const certificateData = {
        recipientName: formData.recipientName,
        eventName: formData.courseName || 'Certificate Achievement',
        completionDate: formData.completionDate || new Date().toISOString(),
        issuerName: formData.issuerName || `${user.firstName} ${user.lastName}`,
        certificateId: formData.certificateId,
        certificateImage: dataURL,
        description: formData.description || '',
        createdBy: user.id,
        createdByEmail: user.email,
        fileName: fileName
      };

      console.log('📤 Certificate data prepared for backend');

      // Determine save strategy based on eventId
      const hasValidEventId = formData.eventId && 
                              formData.eventId.trim() !== '' && 
                              formData.eventId !== 'manual-certificate' &&
                              formData.eventId.length > 5;

      let saveSuccessful = false;
      let lastError = null;

      // Strategy 1: Event-based certificate creation
      if (hasValidEventId) {
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

      // Strategy 2: Manual certificate endpoints
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
        throw new Error(lastError || 'All backend endpoints failed');
      }
      
    } catch (saveError) {
      console.error('❌ Backend save failed:', saveError);
      handleSaveError(saveError);
    }
  };

  // ✅ Handle download errors with fallback strategies
  const handleDownloadError = async (error, certificateRef) => {
    console.error('❌ Download process failed:', error);
    
    if (error.message.includes('oklch') || 
        error.message.includes('lab') || 
        error.message.includes('color') ||
        error.message.includes('Attempting to parse')) {
      
      console.log('🔄 Color-related error detected, trying fallback approach...');
      
      try {
        // Ultra-safe fallback capture
        const fallbackCanvas = await html2canvas(certificateRef.current, {
          scale: 1,
          backgroundColor: "#ffffff",
          logging: false,
          useCORS: false,
          allowTaint: true,
          foreignObjectRendering: false,
          removeContainer: true,
          onclone: (clonedDoc) => {
            // Force all text to black and all backgrounds to white
            const style = clonedDoc.createElement('style');
            style.textContent = `
              * { 
                color: #000000 !important; 
                background-color: transparent !important;
                border-color: #000000 !important;
              }
              img { background-color: #ffffff !important; }
            `;
            clonedDoc.head.appendChild(style);
          }
        });
        
        if (fallbackCanvas && fallbackCanvas.width > 0 && fallbackCanvas.height > 0) {
          const fallbackDataURL = fallbackCanvas.toDataURL('image/png', 0.8);
          const fallbackFileName = `${formData.recipientName?.replace(/[^a-z0-9\s]/gi, '').replace(/\s+/g, '_') || 'certificate'}_fallback_${Date.now()}.png`;
          
          const link = document.createElement('a');
          link.href = fallbackDataURL;
          link.download = fallbackFileName;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          
          console.log('✅ Fallback download completed successfully');
          alert('✅ Certificate downloaded successfully using fallback method!\n\nNote: Some styling may be simplified due to browser compatibility issues.');
          return;
        }
      } catch (fallbackError) {
        console.error('❌ Fallback download also failed:', fallbackError);
      }
    }
    
    // Final error message
    let errorMessage = '❌ Certificate download failed\n\n';
    errorMessage += `Error: ${error.message}\n\n`;
    
    if (error.message.includes('zero dimensions')) {
      errorMessage += 'Issue: Certificate preview is not visible or has no size\n';
      errorMessage += 'Solution: Make sure the certificate is generated and visible\n';
    } else if (error.message.includes('html2canvas')) {
      errorMessage += 'Issue: Browser compatibility or canvas rendering problem\n';
      errorMessage += 'Solutions:\n';
      errorMessage += '• Try a different browser (Chrome/Firefox recommended)\n';
      errorMessage += '• Disable browser extensions temporarily\n';
      errorMessage += '• Refresh the page and try again\n';
    } else if (error.message.includes('color') || error.message.includes('oklch')) {
      errorMessage += 'Issue: CSS color compatibility problem\n';
      errorMessage += 'Solutions:\n';
      errorMessage += '• Update your browser to the latest version\n';
      errorMessage += '• Try using Chrome or Firefox\n';
      errorMessage += '• Disable hardware acceleration in browser settings\n';
    } else {
      errorMessage += 'Solutions:\n';
      errorMessage += '• Check browser console for detailed errors\n';
      errorMessage += '• Try refreshing the page\n';
      errorMessage += '• Ensure stable internet connection\n';
    }
    
    alert(errorMessage);
  };
  // ✅ PART 7: Save Handlers and UI Components

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
    
    alert(`✅ Certificate saved successfully!\n\nCertificate ID: ${actualCertificateId || formData.certificateId}\nCreated by: ${user.email}\nBackend: ${API_URL}\n\nThe certificate is now available for verification.`);
  };

  // ✅ Helper function to handle save errors
  const handleSaveError = (saveError) => {
    let errorMessage = '⚠️ Certificate downloaded successfully but could not save to backend.\n\n';
    errorMessage += `User: ${user.email}\nBackend URL: ${API_URL}\n\n`;
    
    if (saveError.message?.includes('Network Error') || saveError.message?.includes('fetch')) {
      errorMessage += 'Network Error: Cannot connect to backend server.\n';
      errorMessage += 'Possible causes:\n';
      errorMessage += '• Server is down or unreachable\n';
      errorMessage += '• Internet connection issues\n';
      errorMessage += '• Firewall or proxy blocking the connection\n';
    } else if (saveError.message?.includes('timeout')) {
      errorMessage += 'Timeout Error: Backend server took too long to respond.\n';
      errorMessage += 'The server may be experiencing high load.\n';
    } else if (saveError.response?.status === 401) {
      errorMessage += 'Authentication Error: Your login session may have expired.\n';
      errorMessage += 'Please log out and log back in.\n';
    } else if (saveError.response?.status === 403) {
      errorMessage += 'Permission Error: You may not have permission to create certificates.\n';
      errorMessage += 'Please contact your administrator.\n';
    } else if (saveError.response?.status === 400) {
      errorMessage += 'Validation Error: The certificate data may be invalid.\n';
      errorMessage += 'Please check your form data and try again.\n';
    } else if (saveError.response?.status >= 500) {
      errorMessage += 'Server Error: The backend server is experiencing issues.\n';
      errorMessage += 'Please try again later or contact support.\n';
    } else {
      errorMessage += `Error Details: ${saveError.message}\n`;
    }
    
    errorMessage += '\nYou can still use the downloaded certificate locally.';
    alert(errorMessage);
  };

  // ✅ Enhanced Status Indicator Component
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
        <div className={`w-3 h-3 rounded-full ${status.color} mr-2 animate-pulse`}></div>
        <span className="text-sm font-medium text-white">
          {status.icon} {status.text}
        </span>
        {user && (
          <span className="ml-4 text-xs text-white/80">
            Logged in as: {user.email}
          </span>
        )}
      </div>
    );
  };

  // ✅ Enhanced Event ID Input with Real-time Validation
  const EventIdInput = () => {
    const isValidEventId = !formData.eventId || 
                          (formData.eventId.trim() !== '' && 
                           formData.eventId !== 'manual-certificate' &&
                           formData.eventId.length > 5);

    const getValidationMessage = () => {
      if (!formData.eventId) {
        return { type: 'info', message: 'Leave empty for manual certificates' };
      }
      if (formData.eventId === 'manual-certificate') {
        return { type: 'warning', message: 'Invalid eventId format - will be cleared automatically' };
      }
      if (formData.eventId.length <= 5) {
        return { type: 'warning', message: 'Event ID should be longer than 5 characters' };
      }
      return { type: 'success', message: 'Valid event ID - will attempt event-based certificate creation' };
    };

    const validation = getValidationMessage();

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
            validation.type === 'warning' 
              ? 'border-yellow-400 focus:border-yellow-500 bg-yellow-50' 
              : validation.type === 'success'
              ? 'border-green-400 focus:border-green-500 bg-green-50'
              : 'border-gray-200 focus:border-blue-500'
          }`}
          placeholder="Enter valid event ID (leave empty for manual certificate)"
        />
        <p className={`text-xs mt-1 ${
          validation.type === 'warning' ? 'text-yellow-600' :
          validation.type === 'success' ? 'text-green-600' :
          'text-gray-500'
        }`}>
          {validation.type === 'warning' && '⚠️ '}
          {validation.type === 'success' && '✓ '}
          {validation.type === 'info' && 'ℹ️ '}
          {validation.message}
        </p>
      </div>
    );
  };

  // ✅ Enhanced Form Validation Indicator with Progress
  const FormValidationIndicator = () => {
    const validations = [
      { field: 'auth', label: 'User Authentication', valid: !!(user && token), required: true },
      { field: 'recipientName', label: 'Recipient Name', valid: !!formData.recipientName?.trim(), required: true },
      { field: 'design', label: 'Design Upload', valid: !!designImage, required: true },
      { field: 'courseName', label: 'Course/Event Name', valid: !!formData.courseName?.trim(), required: false },
      { field: 'issuerName', label: 'Issuer Name', valid: !!formData.issuerName?.trim(), required: false },
      { field: 'certificateId', label: 'Certificate ID', valid: !!formData.certificateId?.trim(), required: false },
      { 
        field: 'eventId', 
        label: 'Event ID (Optional)', 
        valid: !formData.eventId || (formData.eventId.trim() !== '' && formData.eventId !== 'manual-certificate' && formData.eventId.length > 5),
        required: false,
        warning: formData.eventId && (formData.eventId === 'manual-certificate' || formData.eventId.length <= 5) ? 'Invalid format' : null
      }
    ];

    const requiredValidations = validations.filter(v => v.required);
    const validCount = requiredValidations.filter(v => v.valid).length;
    const totalRequired = requiredValidations.length;
    const hasWarnings = validations.some(v => v.warning);
    const isFormComplete = validCount === totalRequired && !hasWarnings;

    return (
      <div className={`mb-4 p-3 rounded-lg border ${
        isFormComplete ? 'bg-green-50 border-green-200' :
        hasWarnings ? 'bg-yellow-50 border-yellow-200' :
        'bg-blue-50 border-blue-200'
      }`}>
        <div className="flex items-center justify-between mb-2">
          <span className={`text-sm font-medium ${
            isFormComplete ? 'text-green-800' :
            hasWarnings ? 'text-yellow-800' :
            'text-blue-800'
          }`}>
            Form Completion: {validCount}/{totalRequired} Required Fields
            {isFormComplete && ' ✅'}
          </span>
          <div className="w-16 bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-300 ${
                isFormComplete ? 'bg-green-600' :
                hasWarnings ? 'bg-yellow-600' :
                'bg-blue-600'
              }`}
              style={{ width: `${(validCount / totalRequired) * 100}%` }}
            />
          </div>
        </div>
        
        {hasWarnings && (
          <div className="mb-2 p-2 bg-yellow-100 border border-yellow-300 rounded">
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
                validation.required ? 'text-red-600' : 'text-gray-500'
              }`}>
                {validation.warning ? '⚠' :
                 validation.valid ? '✓' : 
                 validation.required ? '✗' : '○'}
              </span>
              <span className={`${
                validation.warning ? 'text-yellow-700' :
                validation.valid ? 'text-green-700' : 
                validation.required ? 'text-red-700' : 'text-gray-600'
              }`}>
                {validation.label} {!validation.required && '(Optional)'}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // ✅ Authentication Status Component
  const AuthenticationStatus = () => {
    if (!user || !token) {
      return (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
          <div className="flex items-center">
            <User className="w-5 h-5 text-red-600 mr-2" />
            <h4 className="font-semibold text-red-800">Authentication Required</h4>
          </div>
          <p className="text-red-700 text-sm mt-2">
            Please log in to generate and save certificates. You can preview certificates without authentication, but saving requires login.
          </p>
          <div className="mt-3 p-2 bg-red-100 rounded">
            <p className="text-xs text-red-600">
              <strong>Note:</strong> Without authentication, certificates cannot be saved to the backend database for verification.
            </p>
          </div>
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
          <p><strong>User ID:</strong> {user.id}</p>
        </div>
        <div className="mt-2 p-2 bg-green-100 rounded">
          <p className="text-xs text-green-600">
            ✅ You can generate and save certificates to the backend database.
          </p>
        </div>
      </div>
    );
  };

  // ✅ Quality Selector Component with Descriptions
  const QualitySelector = () => (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Download Quality
      </label>
      <select 
        value={downloadQuality}
        onChange={(e) => setDownloadQuality(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
        disabled={isProcessing}
      >
        <option value="high">High Quality (2x Scale) - Best for printing</option>
        <option value="medium">Medium Quality (1.5x Scale) - Balanced</option>
        <option value="low">Fast Download (1x Scale) - Quick processing</option>
      </select>
      <p className="text-xs text-gray-500 mt-1">
        Higher quality takes longer to generate but produces better results for printing.
      </p>
    </div>
  );
  // ✅ PART 8: Enhanced Debug Panel and Certificate Preview

  // ✅ Comprehensive Debug Panel with all system information
  const EnhancedDebugPanel = () => {
    const [backendCheck, setBackendCheck] = useState(null);
    const [apiInfo, setApiInfo] = useState(null);
    const [isDebugExpanded, setIsDebugExpanded] = useState(false);
    
    const runBackendCheck = async () => {
      setBackendCheck({ checking: true });
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
          details: connectionTest.details,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        setApiInfo({
          apiUrl: API_URL,
          connected: false,
          error: error.message,
          timestamp: new Date().toISOString()
        });
      }
    };
    
    const copyDebugInfo = async () => {
      const debugInfo = {
        timestamp: new Date().toISOString(),
        user: user ? { id: user.id, email: user.email, role: user.role } : null,
        token: token ? 'Present' : 'Missing',
        formData: formData,
        apiUrl: API_URL,
        backendStatus: backendStatus,
        hasDesignImage: !!designImage,
        hasQrData: !!qrData,
        downloadQuality: downloadQuality,
        apiInfo: apiInfo,
        backendCheck: backendCheck,
        browserInfo: {
          userAgent: navigator.userAgent,
          language: navigator.language,
          platform: navigator.platform,
          cookieEnabled: navigator.cookieEnabled,
          onLine: navigator.onLine
        }
      };
      
      try {
        await navigator.clipboard.writeText(JSON.stringify(debugInfo, null, 2));
        alert('Debug information copied to clipboard!');
      } catch (error) {
        console.error('Failed to copy debug info:', error);
        alert('Failed to copy debug info. Check console for details.');
      }
    };
    
    useEffect(() => {
      if (token) {
        getApiInfo();
      }
    }, [token]);
    
    if (!qrData && backendStatus === 'unknown' && !apiInfo && !isDebugExpanded) {
      return (
        <div className="mt-8 p-4 bg-gray-50 rounded-xl border border-gray-200">
          <button
            onClick={() => setIsDebugExpanded(true)}
            className="flex items-center text-gray-600 hover:text-gray-800 text-sm"
          >
            <TestTube className="w-4 h-4 mr-2" />
            Show Debug Information
          </button>
        </div>
      );
    }
    
    return (
      <div className="mt-8 p-6 bg-gray-50 rounded-xl border border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-semibold text-gray-800 flex items-center">
            <TestTube className="w-4 h-4 mr-2" />
            Debug Information
          </h4>
          <button
            onClick={() => setIsDebugExpanded(!isDebugExpanded)}
            className="text-gray-500 hover:text-gray-700 text-sm"
          >
            {isDebugExpanded ? 'Collapse' : 'Expand'}
          </button>
        </div>
        
        <div className="space-y-2 text-sm text-gray-600">
          {/* Authentication Information */}
          <div className="border-b pb-2 mb-3">
            <div><strong>🔐 Authentication Status:</strong></div>
            <div className="ml-4 space-y-1">
              <div><strong>User:</strong> {user ? `${user.email} (ID: ${user.id})` : 'Not authenticated'}</div>
              <div><strong>Token:</strong> {token ? 'Present ✓' : 'Missing ✗'}</div>
              <div><strong>Role:</strong> {user?.role || 'N/A'}</div>
              <div><strong>Name:</strong> {user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : 'N/A'}</div>
            </div>
          </div>
          
          {/* Certificate Information */}
          <div className="border-b pb-2 mb-3">
            <div><strong>📜 Certificate Status:</strong></div>
            <div className="ml-4 space-y-1">
              <div><strong>Certificate ID:</strong> {formData.certificateId || 'Not generated'}</div>
              <div><strong>QR Data:</strong> <code className="bg-white px-2 py-1 rounded break-all text-xs">{qrData ? qrData.substring(0, 60) + (qrData.length > 60 ? '...' : '') : 'Not generated'}</code></div>
              <div><strong>Event ID:</strong> {formData.eventId || 'Not set (Manual Certificate)'}</div>
              <div><strong>Certificate Type:</strong> {formData.eventId ? 'Event-based' : 'Manual'}</div>
              <div><strong>Design Image:</strong> {designImage ? `✓ ${designImage.name} (${Math.round(designImage.size / 1024)}KB)` : 'Not uploaded'}</div>
              <div><strong>Download Quality:</strong> {downloadQuality}</div>
              <div><strong>Preview Status:</strong> {showPreview ? 'Generated ✓' : 'Not generated'}</div>
            </div>
          </div>

          {/* API Service Information */}
          <div className="border-b pb-2 mb-3">
            <div><strong>🌐 API Service:</strong></div>
            <div className="ml-4 space-y-1">
              <div><strong>API URL:</strong> <code className="bg-white px-2 py-1 rounded text-xs break-all">{API_URL}</code></div>
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
                    <div><strong>API Error:</strong> <span className="text-red-600 text-xs break-all">{apiInfo.error}</span></div>
                  )}
                  <div><strong>Last Check:</strong> <span className="text-xs">{new Date(apiInfo.timestamp).toLocaleString()}</span></div>
                </>
              )}
            </div>
          </div>
          
          {/* Backend Status */}
          <div className="border-b pb-2 mb-3">
            <div><strong>🖥️ Backend Status:</strong></div>
            <div className="ml-4 space-y-1">
              <div><strong>Connection:</strong> 
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
                <>
                  {backendCheck.checking ? (
                    <div><strong>Endpoint Check:</strong> <span className="text-yellow-600">Checking...</span></div>
                  ) : (
                    <div><strong>Available Endpoints:</strong> 
                      <span className={`ml-2 px-2 py-1 rounded text-xs ${
                        backendCheck.available ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {backendCheck.available ? `Found: ${backendCheck.endpoint}` : `None found: ${backendCheck.error || 'Unknown error'}`}
                      </span>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* System Information */}
          {isDebugExpanded && (
            <div className="border-b pb-2 mb-3">
              <div><strong>💻 System Information:</strong></div>
              <div className="ml-4 space-y-1">
                <div><strong>Browser:</strong> <span className="text-xs">{navigator.userAgent.split(' ').slice(-2).join(' ')}</span></div>
                <div><strong>Platform:</strong> {navigator.platform}</div>
                <div><strong>Language:</strong> {navigator.language}</div>
                <div><strong>Online:</strong> {navigator.onLine ? 'Yes' : 'No'}</div>
                <div><strong>Cookies:</strong> {navigator.cookieEnabled ? 'Enabled' : 'Disabled'}</div>
                <div><strong>Screen:</strong> {screen.width}x{screen.height}</div>
                <div><strong>Viewport:</strong> {window.innerWidth}x{window.innerHeight}</div>
              </div>
            </div>
          )}
          
          <div><strong>🕒 Generated At:</strong> {new Date().toLocaleString()}</div>
          
          {/* Action Buttons */}
          <div className="flex gap-2 mt-4 pt-3 border-t border-gray-300 flex-wrap">
            <button
              onClick={() => qrData && navigator.clipboard?.writeText(qrData)}
              disabled={!qrData}
              className="bg-blue-500 disabled:bg-gray-400 text-white px-3 py-1 rounded text-xs hover:bg-blue-600 transition-colors"
              title="Copy QR verification URL"
            >
              Copy QR URL
            </button>
            <button
              onClick={testQRCode}
              disabled={!qrData}
              className="bg-green-500 disabled:bg-gray-400 text-white px-3 py-1 rounded text-xs hover:bg-green-600 transition-colors"
              title="Test QR code in new window"
            >
              Test QR Code
            </button>
            <button
              onClick={testBackendConnection}
              className="bg-purple-500 text-white px-3 py-1 rounded text-xs hover:bg-purple-600 transition-colors"
              title="Test backend connection"
            >
              Test Backend
            </button>
            <button
              onClick={runBackendCheck}
              disabled={backendCheck?.checking}
              className="bg-orange-500 disabled:bg-gray-400 text-white px-3 py-1 rounded text-xs hover:bg-orange-600 transition-colors"
              title="Check available endpoints"
            >
              {backendCheck?.checking ? 'Checking...' : 'Check Endpoints'}
            </button>
            <button
              onClick={getApiInfo}
              className="bg-indigo-500 text-white px-3 py-1 rounded text-xs hover:bg-indigo-600 transition-colors"
              title="Refresh API connection info"
            >
              Refresh API Info
            </button>
            <button
              onClick={testCanvasCapture}
              className="bg-red-500 text-white px-3 py-1 rounded text-xs hover:bg-red-600 transition-colors"
              title="Test canvas capture functionality"
            >
              Test Canvas
            </button>
            <button
              onClick={copyDebugInfo}
              className="bg-gray-600 text-white px-3 py-1 rounded text-xs hover:bg-gray-700 transition-colors"
              title="Copy all debug info to clipboard"
            >
              Copy Debug Info
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ✅ Color Override Component for html2canvas compatibility
  const ColorCompatibilityStyles = () => {
    useEffect(() => {
      const style = document.createElement('style');
      style.id = 'certificate-color-override';
      style.textContent = `
        /* ✅ Color compatibility overrides for html2canvas */
        [data-certificate] {
          -webkit-print-color-adjust: exact !important;
          color-adjust: exact !important;
        }
        
        /* Force safe colors for certificate elements */
        [data-certificate] .text-blue-600 { color: #2563eb !important; }
        [data-certificate] .text-green-600 { color: #16a34a !important; }
        [data-certificate] .text-purple-600 { color: #9333ea !important; }
        [data-certificate] .text-red-600 { color: #dc2626 !important; }
        [data-certificate] .text-gray-600 { color: #4b5563 !important; }
        [data-certificate] .text-gray-700 { color: #374151 !important; }
        [data-certificate] .text-gray-800 { color: #1f2937 !important; }
        [data-certificate] .text-gray-500 { color: #6b7280 !important; }
        [data-certificate] .text-gray-400 { color: #9ca3af !important; }
        
        [data-certificate] .bg-white { background-color: #ffffff !important; }
        [data-certificate] .bg-gray-50 { background-color: #f9fafb !important; }
        [data-certificate] .bg-blue-50 { background-color: #eff6ff !important; }
        [data-certificate] .bg-green-50 { background-color: #f0fdf4 !important; }
        
        /* Ensure QR codes are always visible */
        [data-certificate] [data-qr] {
          background-color: #ffffff !important;
          border: 1px solid #e5e7eb !important;
        }
        
        /* Override any problematic modern color functions */
        [data-certificate] *[style*="oklch"],
        [data-certificate] *[style*="lab("],
        [data-certificate] *[style*="lch("],
        [data-certificate] *[style*="color("] {
          color: #000000 !important;
          background-color: transparent !important;
          border-color: #000000 !important;
        }
        
        /* Force visible borders and outlines */
        [data-certificate] * {
          outline-color: #000000 !important;
          border-color: inherit !important;
        }
      `;
      
      // Remove existing style if present
      const existingStyle = document.getElementById('certificate-color-override');
      if (existingStyle) {
        document.head.removeChild(existingStyle);
      }
      
      document.head.appendChild(style);
      
      return () => {
        const styleToRemove = document.getElementById('certificate-color-override');
        if (styleToRemove && styleToRemove.parentNode) {
          document.head.removeChild(styleToRemove);
        }
      };
    }, []);
    
    return null;
  };

  // ✅ Enhanced Certificate Preview with maximum compatibility
  const CertificatePreview = () => {
    return (
      <div 
        ref={certificateRef}
        data-certificate="true"
        className="relative w-full border border-gray-200 rounded-lg overflow-hidden"
        style={{ 
          aspectRatio: '4/3',
          backgroundColor: '#ffffff',
          minHeight: '400px',
          minWidth: '533px',
          // Force safe CSS properties
          color: '#000000',
          fontFamily: 'Arial, sans-serif'
        }}
      >
        {/* Include color compatibility styles */}
        <ColorCompatibilityStyles />
        
        {/* Background Image with enhanced loading */}
        {imagePreview && (
          <img 
            src={imagePreview} 
            alt="Certificate Design"
            className="absolute inset-0 w-full h-full object-cover"
            style={{ 
              imageRendering: 'auto',
              userSelect: 'none',
              backgroundColor: '#ffffff'
            }}
            crossOrigin="anonymous"
            onLoad={() => console.log('✅ Background image loaded for preview')}
            onError={(e) => {
              console.error('❌ Background image failed to load:', e);
              // Set a fallback background
              e.target.style.backgroundColor = '#f3f4f6';
              e.target.style.display = 'none';
            }}
          />
        )}
        
        {/* Text Overlays with safe rendering */}
        {showPreview && textElements.map((element) => {
          const content = getTextContent(element.id);
          if (!content) return null;
          
          return (
            <div
              key={element.id}
              className="absolute pointer-events-none"
              style={{
                left: `${element.x}%`,
                top: `${element.y}%`,
                transform: 'translate(-50%, -50%)',
                fontSize: `${element.fontSize}px`,
                color: element.color,
                fontWeight: element.fontWeight,
                textAlign: element.textAlign,
                fontFamily: 'Arial, sans-serif',
                lineHeight: '1.2',
                maxWidth: '80%',
                textShadow: element.color === '#ffffff' ? '1px 1px 2px rgba(0,0,0,0.5)' : 'none',
                // Enhanced text rendering
                textRendering: 'optimizeLegibility',
                WebkitFontSmoothing: 'antialiased',
                MozOsxFontSmoothing: 'grayscale',
                // Force safe CSS
                background: 'transparent',
                border: 'none',
                outline: 'none'
              }}
            >
              {content}
            </div>
          );
        })}

        {/* QR Code with enhanced compatibility */}
        {showPreview && qrData && (
          <div
            className="absolute pointer-events-none"
            data-qr="true"
            style={{
              left: `${qrSettings.x}%`,
              top: `${qrSettings.y}%`,
              transform: 'translate(-50%, -50%)',
              backgroundColor: '#ffffff',
              padding: '4px',
              borderRadius: '4px',
              border: '1px solid #e5e7eb'
            }}
          >
            <QRCodeDisplay 
              data={qrData} 
              size={qrSettings.size} 
              color={qrSettings.color} 
            />
          </div>
        )}
        
        {/* Fallback content when no image is loaded */}
        {!imagePreview && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
            <div className="text-center text-gray-500">
              <Image className="w-16 h-16 mx-auto mb-4 opacity-30" />
              <p className="text-lg mb-2">Certificate Preview</p>
              <p className="text-sm">Upload a design to see preview</p>
            </div>
          </div>
        )}
      </div>
    );
  };
  // ✅ PART 9: Main Component Return - Upload Design Tab

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
                    className={`border-2 border-dashed rounded-xl p-12 text-center transition-all cursor-pointer ${
                      isProcessing 
                        ? 'border-gray-200 bg-gray-50 cursor-not-allowed' 
                        : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'
                    }`}
                    onClick={() => !isProcessing && fileInputRef.current?.click()}
                  >
                    <Upload className={`w-16 h-16 mx-auto mb-4 ${
                      isProcessing ? 'text-gray-300' : 'text-gray-400'
                    }`} />
                    <h3 className={`text-xl font-semibold mb-2 ${
                      isProcessing ? 'text-gray-400' : 'text-gray-700'
                    }`}>
                      {isProcessing ? 'Processing...' : 'Upload Your Certificate Design'}
                    </h3>
                    <p className={`mb-4 ${
                      isProcessing ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      {isProcessing 
                        ? 'Please wait while processing...' 
                        : 'Click to upload or drag and drop your certificate template'
                      }
                    </p>
                    <p className={`text-sm ${
                      isProcessing ? 'text-gray-300' : 'text-gray-400'
                    }`}>
                      Supports PNG, JPG, JPEG, SVG, WebP • Max 10MB
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

                  {/* Current Design Info */}
                  {designImage && (
                    <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                            <Image className="w-5 h-5 text-green-600" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-green-800">{designImage.name}</h4>
                            <p className="text-sm text-green-600">
                              {Math.round(designImage.size / 1024)}KB • {designImage.type}
                            </p>
                          </div>
                        </div>
                        <span className="text-green-600 font-medium">✓ Uploaded</span>
                      </div>
                    </div>
                  )}

                  {/* Design Tips */}
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                    <h4 className="font-semibold text-blue-800 mb-3 flex items-center">
                      <Award className="w-5 h-5 mr-2" />
                      Design Tips for Professional Certificates:
                    </h4>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <h5 className="font-medium text-blue-700 mb-2">Quality Guidelines:</h5>
                        <ul className="space-y-1 text-blue-700 text-sm">
                          <li>• Use high-resolution images (300 DPI recommended)</li>
                          <li>• Minimum size: 800x600 pixels</li>
                          <li>• Use landscape orientation (4:3 or 16:9 ratio)</li>
                          <li>• Save in PNG format for best quality</li>
                        </ul>
                      </div>
                      <div>
                        <h5 className="font-medium text-blue-700 mb-2">QR Code Placement:</h5>
                        <ul className="space-y-1 text-blue-700 text-sm">
                          <li>• Leave white space for QR code (usually top-right)</li>
                          <li>• Ensure good contrast around QR area</li>
                          <li>• QR should be at least 1cm x 1cm when printed</li>
                          <li>• Avoid placing QR over dark backgrounds</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Browser Compatibility Notice */}
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                    <div className="flex items-start">
                      <div className="w-5 h-5 text-amber-600 mr-2 mt-0.5">⚠️</div>
                      <div>
                        <h4 className="font-semibold text-amber-800 mb-1">Browser Compatibility Notice</h4>
                        <p className="text-amber-700 text-sm mb-2">
                          For best results and to avoid color issues during download:
                        </p>
                        <ul className="text-amber-700 text-sm space-y-1">
                          <li>• Use Chrome, Firefox, or Safari latest versions</li>
                          <li>• Disable browser extensions that modify CSS</li>
                          <li>• Ensure hardware acceleration is enabled</li>
                          <li>• Use standard colors (avoid experimental CSS functions)</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            // ✅ PART 10: Certificate Content Tab

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
                      className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none transition-colors disabled:opacity-50 ${
                        formData.recipientName?.trim() 
                          ? 'border-green-200 focus:border-green-500 bg-green-50' 
                          : 'border-gray-200 focus:border-blue-500'
                      }`}
                      placeholder="Enter recipient's full name"
                      maxLength="100"
                    />
                    {formData.recipientName && (
                      <p className="text-xs text-green-600 mt-1">
                        ✓ {formData.recipientName.length}/100 characters
                      </p>
                    )}
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
                      className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none transition-colors disabled:opacity-50 ${
                        formData.courseName?.trim() 
                          ? 'border-green-200 focus:border-green-500 bg-green-50' 
                          : 'border-gray-200 focus:border-blue-500'
                      }`}
                      placeholder="e.g., React Development Bootcamp"
                      maxLength="150"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {formData.courseName?.length || 0}/150 characters
                    </p>
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
                      max={new Date().toISOString().split('T')[0]}
                      className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none transition-colors disabled:opacity-50 ${
                        formData.completionDate 
                          ? 'border-green-200 focus:border-green-500 bg-green-50' 
                          : 'border-gray-200 focus:border-blue-500'
                      }`}
                    />
                    {formData.completionDate && (
                      <p className="text-xs text-green-600 mt-1">
                        ✓ {new Date(formData.completionDate).toLocaleDateString()}
                      </p>
                    )}
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
                      className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none transition-colors disabled:opacity-50 ${
                        formData.issuerName?.trim() 
                          ? 'border-green-200 focus:border-green-500 bg-green-50' 
                          : 'border-gray-200 focus:border-blue-500'
                      }`}
                      placeholder={user ? `Default: ${user.firstName} ${user.lastName}` : "Your organization name"}
                      maxLength="100"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {formData.issuerName?.length || 0}/100 characters
                    </p>
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
                        className={`flex-1 px-4 py-3 border-2 rounded-xl focus:outline-none transition-colors disabled:opacity-50 ${
                          formData.certificateId?.trim() 
                            ? 'border-green-200 focus:border-green-500 bg-green-50' 
                            : 'border-gray-200 focus:border-blue-500'
                        }`}
                        placeholder="Auto-generated if empty"
                        maxLength="50"
                      />
                      <button
                        onClick={generateCertificateId}
                        disabled={isProcessing}
                        className="px-4 py-3 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-300 rounded-xl transition-colors disabled:opacity-50"
                        title="Generate Random ID"
                      >
                        <RefreshCw className={`w-5 h-5 ${isProcessing ? 'animate-spin' : ''}`} />
                      </button>
                    </div>
                    {formData.certificateId && (
                      <p className="text-xs text-green-600 mt-1">
                        ✓ Certificate ID: {formData.certificateId}
                      </p>
                    )}
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
                      maxLength="500"
                      className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none transition-colors resize-none disabled:opacity-50 ${
                        formData.description?.trim() 
                          ? 'border-green-200 focus:border-green-500 bg-green-50' 
                          : 'border-gray-200 focus:border-blue-500'
                      }`}
                      placeholder="Additional details about the achievement, course objectives, or special recognition..."
                    />
                    <div className="flex justify-between items-center mt-1">
                      <p className="text-xs text-gray-500">
                        {formData.description?.length || 0}/500 characters
                      </p>
                      {formData.description && formData.description.length > 400 && (
                        <p className="text-xs text-amber-600">
                          Approaching character limit
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Quality and Download Settings */}
                <div className="mt-8 pt-6 border-t border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Download Settings</h3>
                  <div className="grid md:grid-cols-2 gap-6">
                    <QualitySelector />
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Certificate Format
                      </label>
                      <select 
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                        disabled={isProcessing}
                        defaultValue="png"
                      >
                        <option value="png">PNG (Recommended) - Best quality</option>
                        <option value="jpg" disabled>JPG - Smaller file size (Coming soon)</option>
                        <option value="pdf" disabled>PDF - Print ready (Coming soon)</option>
                      </select>
                      <p className="text-xs text-gray-500 mt-1">
                        PNG format provides the best quality for certificates with transparent backgrounds.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Form Summary */}
                <div className="mt-8 p-4 bg-gray-50 rounded-xl">
                  <h4 className="font-semibold text-gray-800 mb-3">Certificate Summary</h4>
                  <div className="grid md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="space-y-2">
                        <div><strong>Recipient:</strong> {formData.recipientName || 'Not specified'}</div>
                        <div><strong>Achievement:</strong> {formData.courseName || 'Certificate of Achievement'}</div>
                        <div><strong>Date:</strong> {formData.completionDate ? new Date(formData.completionDate).toLocaleDateString() : 'Today'}</div>
                      </div>
                    </div>
                    <div>
                      <div className="space-y-2">
                        <div><strong>Issuer:</strong> {formData.issuerName || (user ? `${user.firstName} ${user.lastName}` : 'Not specified')}</div>
                        <div><strong>Certificate ID:</strong> {formData.certificateId || 'Will be auto-generated'}</div>
                        <div><strong>Type:</strong> {formData.eventId ? 'Event-based' : 'Manual Certificate'}</div>
                      </div>
                    </div>
                  </div>
                  {formData.description && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <div><strong>Description:</strong></div>
                      <p className="text-gray-600 mt-1 italic">"{formData.description}"</p>
                    </div>
                  )}
                </div>

                {/* Quick Actions */}
                <div className="mt-6 flex gap-3 flex-wrap">
                  <button
                    onClick={() => setActiveTab('upload')}
                    className="flex items-center px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors text-sm"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Back to Upload
                  </button>
                  <button
                    onClick={() => setActiveTab('position')}
                    disabled={!designImage}
                    className="flex items-center px-4 py-2 bg-blue-100 hover:bg-blue-200 disabled:bg-gray-100 disabled:text-gray-400 rounded-lg transition-colors text-sm"
                  >
                    <Move className="w-4 h-4 mr-2" />
                    Position Elements
                  </button>
                  <button
                    onClick={generateCertificate}
                    disabled={!designImage || !formData.recipientName?.trim() || isProcessing || !user}
                    className="flex items-center px-4 py-2 bg-green-100 hover:bg-green-200 disabled:bg-gray-100 disabled:text-gray-400 rounded-lg transition-colors text-sm"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Generate Preview
                  </button>
                </div>
              </div>
            )}
            // ✅ PART 11: Position Elements Tab

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
                      <div key={element.id} className="border border-gray-200 rounded-lg p-6 hover:border-gray-300 transition-colors">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="font-semibold text-gray-700 flex items-center">
                            <span className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: element.color }}></span>
                            {element.label}
                          </h4>
                          <div className="text-xs bg-gray-100 px-2 py-1 rounded">
                            Preview: "{getTextContent(element.id)}"
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-2">
                              X Position ({element.x}%)
                            </label>
                            <input
                              type="range"
                              min="5"
                              max="95"
                              value={element.x}
                              onChange={(e) => updateTextElement(element.id, 'x', parseInt(e.target.value))}
                              disabled={isProcessing}
                              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                            />
                            <div className="flex justify-between text-xs text-gray-400 mt-1">
                              <span>Left</span>
                              <span>Center</span>
                              <span>Right</span>
                            </div>
                          </div>
                          
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-2">
                              Y Position ({element.y}%)
                            </label>
                            <input
                              type="range"
                              min="5"
                              max="95"
                              value={element.y}
                              onChange={(e) => updateTextElement(element.id, 'y', parseInt(e.target.value))}
                              disabled={isProcessing}
                              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                            />
                            <div className="flex justify-between text-xs text-gray-400 mt-1">
                              <span>Top</span>
                              <span>Middle</span>
                              <span>Bottom</span>
                            </div>
                          </div>
                          
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-2">
                              Font Size ({element.fontSize}px)
                            </label>
                            <input
                              type="range"
                              min="8"
                              max="48"
                              value={element.fontSize}
                              onChange={(e) => updateTextElement(element.id, 'fontSize', parseInt(e.target.value))}
                              disabled={isProcessing}
                              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                            />
                            <div className="flex justify-between text-xs text-gray-400 mt-1">
                              <span>Small</span>
                              <span>Large</span>
                            </div>
                          </div>
                          
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-2">
                              Text Color
                            </label>
                            <div className="flex gap-2">
                              <input
                                type="color"
                                value={element.color}
                                onChange={(e) => updateTextElement(element.id, 'color', e.target.value)}
                                disabled={isProcessing}
                                className="w-full h-10 border border-gray-300 rounded cursor-pointer"
                              />
                              <button
                                onClick={() => updateTextElement(element.id, 'color', '#000000')}
                                className="px-2 py-1 bg-black text-white rounded text-xs hover:bg-gray-800 transition-colors"
                                title="Reset to black"
                              >
                                Reset
                              </button>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex gap-4 items-center">
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Alignment</label>
                            <select
                              value={element.textAlign}
                              onChange={(e) => updateTextElement(element.id, 'textAlign', e.target.value)}
                              disabled={isProcessing}
                              className="px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-500"
                            >
                              <option value="left">Left</option>
                              <option value="center">Center</option>
                              <option value="right">Right</option>
                            </select>
                          </div>
                          
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Weight</label>
                            <select
                              value={element.fontWeight}
                              onChange={(e) => updateTextElement(element.id, 'fontWeight', e.target.value)}
                              disabled={isProcessing}
                              className="px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-500"
                            >
                              <option value="normal">Normal</option>
                              <option value="bold">Bold</option>
                            </select>
                          </div>
                          
                          <div className="flex-1">
                            <label className="block text-xs font-medium text-gray-600 mb-1">Live Preview</label>
                            <div 
                              className="px-3 py-2 bg-gray-50 border border-gray-200 rounded text-sm"
                              style={{
                                fontSize: `${Math.min(element.fontSize * 0.7, 14)}px`,
                                color: element.color,
                                fontWeight: element.fontWeight,
                                textAlign: element.textAlign
                              }}
                            >
                              {getTextContent(element.id) || 'Sample text'}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Preset Positions */}
                  <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
                    <h4 className="font-semibold text-blue-800 mb-3">Quick Position Presets</h4>
                    <div className="flex gap-2 flex-wrap">
                      <button
                        onClick={() => {
                          setTextElements(prev => prev.map(el => {
                            switch(el.id) {
                              case 'recipient': return { ...el, x: 50, y: 35, fontSize: 28, textAlign: 'center' };
                              case 'course': return { ...el, x: 50, y: 50, fontSize: 20, textAlign: 'center' };
                              case 'date': return { ...el, x: 25, y: 75, fontSize: 14, textAlign: 'left' };
                              case 'issuer': return { ...el, x: 75, y: 75, fontSize: 14, textAlign: 'right' };
                              case 'certId': return { ...el, x: 25, y: 85, fontSize: 12, textAlign: 'left' };
                              default: return el;
                            }
                          }));
                        }}
                        disabled={isProcessing}
                        className="px-3 py-2 bg-blue-100 hover:bg-blue-200 rounded text-sm transition-colors disabled:opacity-50"
                      >
                        Centered Layout
                      </button>
                      <button
                        onClick={() => {
                          setTextElements(prev => prev.map(el => {
                            switch(el.id) {
                              case 'recipient': return { ...el, x: 30, y: 40, fontSize: 24, textAlign: 'left' };
                              case 'course': return { ...el, x: 30, y: 55, fontSize: 18, textAlign: 'left' };
                              case 'date': return { ...el, x: 30, y: 70, fontSize: 14, textAlign: 'left' };
                              case 'issuer': return { ...el, x: 70, y: 80, fontSize: 14, textAlign: 'right' };
                              case 'certId': return { ...el, x: 30, y: 85, fontSize: 12, textAlign: 'left' };
                              default: return el;
                            }
                          }));
                        }}
                        disabled={isProcessing}
                        className="px-3 py-2 bg-blue-100 hover:bg-blue-200 rounded text-sm transition-colors disabled:opacity-50"
                      >
                        Left Aligned
                      </button>
                      <button
                        onClick={() => {
                          setTextElements(prev => prev.map(el => {
                            switch(el.id) {
                              case 'recipient': return { ...el, x: 70, y: 40, fontSize: 24, textAlign: 'right' };
                              case 'course': return { ...el, x: 70, y: 55, fontSize: 18, textAlign: 'right' };
                              case 'date': return { ...el, x: 20, y: 80, fontSize: 14, textAlign: 'left' };
                              case 'issuer': return { ...el, x: 70, y: 70, fontSize: 14, textAlign: 'right' };
                              case 'certId': return { ...el, x: 20, y: 85, fontSize: 12, textAlign: 'left' };
                              default: return el;
                            }
                          }));
                        }}
                        disabled={isProcessing}
                        className="px-3 py-2 bg-blue-100 hover:bg-blue-200 rounded text-sm transition-colors disabled:opacity-50"
                      >
                        Right Aligned
                      </button>
                    </div>
                  </div>
                </div>

                {/* QR Code Positioning */}
                <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
                  <div className="flex items-center mb-6">
                    <QrCode className="w-6 h-6 text-blue-600 mr-3" />
                    <h3 className="text-xl font-bold text-gray-800">QR Code Positioning & Testing</h3>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-2">
                        X Position ({qrSettings.x}%)
                      </label>
                      <input
                        type="range"
                        min="10"
                        max="90"
                        value={qrSettings.x}
                        onChange={(e) => updateQRSettings('x', parseInt(e.target.value))}
                        disabled={isProcessing}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      />
                      <div className="flex justify-between text-xs text-gray-400 mt-1">
                        <span>Left</span>
                        <span>Right</span>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-2">
                        Y Position ({qrSettings.y}%)
                      </label>
                      <input
                        type="range"
                        min="10"
                        max="90"
                        value={qrSettings.y}
                        onChange={(e) => updateQRSettings('y', parseInt(e.target.value))}
                        disabled={isProcessing}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      />
                      <div className="flex justify-between text-xs text-gray-400 mt-1">
                        <span>Top</span>
                        <span>Bottom</span>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-2">
                        Size ({qrSettings.size}px)
                      </label>
                      <input
                        type="range"
                        min="60"
                        max="200"
                        value={qrSettings.size}
                        onChange={(e) => updateQRSettings('size', parseInt(e.target.value))}
                        disabled={isProcessing}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      />
                      <div className="flex justify-between text-xs text-gray-400 mt-1">
                        <span>Small</span>
                        <span>Large</span>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-2">
                        QR Color
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          value={qrSettings.color}
                          onChange={(e) => updateQRSettings('color', e.target.value)}
                          disabled={isProcessing}
                          className="flex-1 h-10 border border-gray-300 rounded cursor-pointer"
                        />
                        <button
                          onClick={() => updateQRSettings('color', '#000000')}
                          className="px-2 py-1 bg-black text-white rounded text-xs hover:bg-gray-800 transition-colors"
                          title="Reset to black"
                        >
                          Reset
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* QR Code Testing Section */}
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
                    <h4 className="font-semibold text-amber-800 mb-3 flex items-center">
                      <TestTube className="w-5 h-5 mr-2" />
                      QR Code Testing & Guidelines:
                    </h4>
                    
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <h5 className="font-medium text-amber-700 mb-2">Current QR Settings:</h5>
                        <div className="text-amber-700 text-sm space-y-1">
                          <div>• Position: {qrSettings.x}% from left, {qrSettings.y}% from top</div>
                          <div>• Size: {qrSettings.size}px ({Math.round(qrSettings.size * 0.0264583)}cm when printed at 96 DPI)</div>
                          <div>• Color: {qrSettings.color}</div>
                          <div>• URL: <span className="font-mono text-xs break-all">{qrData || 'Generate certificate first'}</span></div>
                        </div>
                      </div>
                      
                      <div>
                        <h5 className="font-medium text-amber-700 mb-2">Best Practices:</h5>
                        <ul className="text-amber-700 text-sm space-y-1">
                          <li>• Size should be at least 100px for reliable scanning</li>
                          <li>• Use black (#000000) for maximum contrast</li>
                          <li>• Ensure white background around QR code</li>
                          <li>• Minimum 1cm x 1cm when printed</li>
                          <li>• Test with multiple smartphone camera apps</li>
                          <li>• Avoid placing over dark or busy backgrounds</li>
                        </ul>
                      </div>
                    </div>
                    
                    <div className="mt-4 flex gap-3 flex-wrap">
                      <button
                        onClick={testQRCode}
                        disabled={!qrData || isProcessing}
                        className="bg-amber-600 hover:bg-amber-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg font-medium flex items-center transition-colors"
                      >
                        <TestTube className="w-4 h-4 mr-2" />
                        Test QR Code
                      </button>
                      
                      <button
                        onClick={() => updateQRSettings('size', 120)}
                        disabled={isProcessing}
                        className="bg-blue-100 hover:bg-blue-200 text-blue-700 px-4 py-2 rounded-lg text-sm transition-colors"
                      >
                        Reset to Recommended Size
                      </button>
                      
                      <button
                        onClick={() => {
                          updateQRSettings('x', 85);
                          updateQRSettings('y', 15);
                          updateQRSettings('size', 120);
                          updateQRSettings('color', '#000000');
                        }}
                        disabled={isProcessing}
                        className="bg-green-100 hover:bg-green-200 text-green-700 px-4 py-2 rounded-lg text-sm transition-colors"
                      >
                        Reset to Default Position
                      </button>
                    </div>
                  </div>
                </div>

                {/* Navigation Actions */}
                <div className="flex gap-3 flex-wrap">
                  <button
                    onClick={() => setActiveTab('content')}
                    className="flex items-center px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors text-sm"
                  >
                    <Award className="w-4 h-4 mr-2" />
                    Back to Content
                  </button>
                  
                  <button
                    onClick={generateCertificate}
                    disabled={!designImage || !formData.recipientName?.trim() || isProcessing || !user}
                    className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg transition-colors text-sm"
                  >
                    {isProcessing ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      <>
                        <Eye className="w-4 h-4 mr-2" />
                        Update Preview
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
// ✅ PART 12: Right Panel, Debug Panel, and Footer

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
                    title={!user ? "Login required" : !designImage ? "Upload design first" : "Generate preview"}
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
                      title={!user ? "Login required to save" : "Download and save certificate"}
                    >
                      <Download className="w-4 h-4 mr-1" />
                      Download
                    </button>
                  )}
                </div>
              </div>

              {imagePreview ? (
                <div className="w-full">
                  <CertificatePreview />

                  {/* Download Progress Indicator */}
                  {isProcessing && (
                    <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-center">
                        <RefreshCw className="w-4 h-4 text-blue-600 mr-2 animate-spin" />
                        <span className="text-blue-800 text-sm font-medium">
                          {downloadQuality === 'high' ? 'Processing high quality...' :
                           downloadQuality === 'medium' ? 'Processing medium quality...' :
                           'Processing...'}
                        </span>
                      </div>
                      <div className="mt-2 w-full bg-blue-200 rounded-full h-2">
                        <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
                      </div>
                      <p className="text-xs text-blue-600 mt-1">
                        Please wait while your certificate is being processed...
                      </p>
                    </div>
                  )}

                  {/* Certificate Status Info */}
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-semibold text-gray-800 mb-3">Certificate Status</h4>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Design:</span>
                        <span className={designImage ? 'text-green-600 font-medium' : 'text-red-600'}>
                          {designImage ? `✓ ${designImage.name}` : '✗ Not uploaded'}
                        </span>
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="text-gray-600">Authentication:</span>
                        <span className={user ? 'text-green-600 font-medium' : 'text-red-600'}>
                          {user ? `✓ ${user.email}` : '✗ Not authenticated'}
                        </span>
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="text-gray-600">Preview:</span>
                        <span className={showPreview ? 'text-green-600 font-medium' : 'text-gray-500'}>
                          {showPreview ? '✓ Generated' : '○ Not generated'}
                        </span>
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="text-gray-600">QR Code:</span>
                        <span className={qrData ? 'text-green-600 font-medium' : 'text-gray-500'}>
                          {qrData ? '✓ Ready' : '○ Not generated'}
                        </span>
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="text-gray-600">Backend:</span>
                        <span className={`font-medium ${
                          backendStatus === 'connected' ? 'text-green-600' :
                          backendStatus === 'error' ? 'text-red-600' :
                          backendStatus === 'testing' ? 'text-yellow-600' :
                          'text-gray-500'
                        }`}>
                          {backendStatus === 'connected' ? '✓ Connected' :
                           backendStatus === 'error' ? '✗ Error' :
                           backendStatus === 'testing' ? '⏳ Testing' :
                           '○ Unknown'}
                        </span>
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="text-gray-600">Quality:</span>
                        <span className="text-blue-600 font-medium">
                          {downloadQuality} ({downloadQuality === 'high' ? '2x' : downloadQuality === 'medium' ? '1.5x' : '1x'} scale)
                        </span>
                      </div>
                    </div>
                    
                    {qrData && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className="text-gray-500">QR URL:</span>
                            <button
                              onClick={() => navigator.clipboard?.writeText(qrData)}
                              className="text-blue-600 hover:text-blue-800 underline"
                              title="Copy QR URL"
                            >
                              Copy
                            </button>
                          </div>
                          <p className="text-xs font-mono text-gray-600 break-all bg-white p-2 rounded border">
                            {qrData}
                          </p>
                        </div>
                      </div>
                    )}
                    
                    {formData.eventId && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Event ID:</span>
                          <span className="text-purple-600 font-medium font-mono">
                            {formData.eventId}
                          </span>
                        </div>
                        <p className="text-xs text-purple-600 mt-1">
                          Event-based certificate will be attempted
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Quick Actions */}
                  <div className="mt-4 flex gap-2 flex-wrap">
                    <button
                      onClick={testQRCode}
                      disabled={!qrData || isProcessing}
                      className="flex-1 bg-amber-100 hover:bg-amber-200 disabled:bg-gray-100 disabled:text-gray-400 text-amber-800 px-3 py-2 rounded-lg text-xs font-medium transition-colors"
                    >
                      Test QR
                    </button>
                    <button
                      onClick={testCanvasCapture}
                      disabled={!showPreview || isProcessing}
                      className="flex-1 bg-purple-100 hover:bg-purple-200 disabled:bg-gray-100 disabled:text-gray-400 text-purple-800 px-3 py-2 rounded-lg text-xs font-medium transition-colors"
                    >
                      Test Canvas
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-64 text-gray-500 border-2 border-dashed border-gray-300 rounded-lg">
                  <Image className="w-16 h-16 mb-4 opacity-20" />
                  <p className="text-lg mb-2">No Design Uploaded</p>
                  <p className="text-sm text-center max-w-xs">
                    Upload your certificate design to see the preview
                  </p>
                  <button
                    onClick={() => setActiveTab('upload')}
                    className="mt-3 bg-blue-100 hover:bg-blue-200 text-blue-700 px-4 py-2 rounded-lg text-sm transition-colors"
                  >
                    Go to Upload
                  </button>
                </div>
              )}
            </div>

            {/* Help Section */}
            <div className="mt-6 bg-blue-50 rounded-xl p-4 border border-blue-200">
              <h4 className="font-semibold text-blue-800 mb-2">Need Help?</h4>
              <div className="text-blue-700 text-sm space-y-1">
                <p>• Upload a certificate design template</p>
                <p>• Fill in the certificate content</p>
                <p>• Position text and QR code elements</p>
                <p>• Generate preview and download</p>
              </div>
              <div className="mt-3 pt-3 border-t border-blue-200">
                <p className="text-xs text-blue-600">
                  <strong>Tip:</strong> For best results, use Chrome or Firefox with the latest updates.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Status */}
        <div className="mt-12 bg-white rounded-xl p-6 border border-gray-200 shadow-lg">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h4 className="font-semibold text-gray-700 flex items-center">
                <Building className="w-5 h-5 mr-2 text-gray-600" />
                System Status
              </h4>
              <p className="text-gray-600 text-sm mt-1">
                Backend: <code className="bg-gray-100 px-2 py-1 rounded text-xs">{API_URL}</code>
              </p>
            </div>
            
            <div className="flex items-center gap-6">
              <div className="flex items-center">
                <div className={`w-3 h-3 rounded-full mr-2 ${
                  backendStatus === 'connected' ? 'bg-green-500 animate-pulse' :
                  backendStatus === 'error' ? 'bg-red-500' :
                  backendStatus === 'testing' ? 'bg-yellow-500 animate-pulse' :
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
                  Auth: {user ? 'Authenticated' : 'Not Authenticated'}
                </span>
              </div>
              
              <div className="flex items-center">
                <div className={`w-3 h-3 rounded-full mr-2 ${
                  designImage ? 'bg-green-500' : 'bg-gray-500'
                }`}></div>
                <span className="text-sm text-gray-600">
                  Design: {designImage ? 'Loaded' : 'Not Loaded'}
                </span>
              </div>
            </div>
          </div>
          
          <div className="mt-4 pt-4 border-t border-gray-200 text-center">
            <p className="text-xs text-gray-500">
              Certificate Generator v2.0 • Enhanced Color Compatibility • 
              Last updated: {new Date().toLocaleDateString()} • 
              For support, check browser console for detailed error information
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QRCertificateGenerator;
            
