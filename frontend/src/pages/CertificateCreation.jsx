// Updated CertificateCreation.jsx - Simplified for direct certificate upload
import React, { useState, useRef } from 'react';
import { Upload, Award, Eye, Download, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const CertificateUploader = () => {
  const { user, token } = useAuth();
  
  // Form state
  const [formData, setFormData] = useState({
    certificateId: '',
    recipientName: '',
    eventName: '',
    completionDate: '',
    issuerName: user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : '',
    description: ''
  });

  // File and UI state
  const [certificateFile, setCertificateFile] = useState(null);
  const [certificatePreview, setCertificatePreview] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [errors, setErrors] = useState({});
  
  const fileInputRef = useRef(null);

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Handle file upload
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    // Validate file
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/pdf'];
    
    if (!allowedTypes.includes(file.type)) {
      setErrors({ file: 'Please upload a valid certificate file (PNG, JPG, JPEG, PDF)' });
      return;
    }
    
    if (file.size > maxSize) {
      setErrors({ file: 'File size must be less than 10MB' });
      return;
    }
    
    setCertificateFile(file);
    setErrors({ file: '' });
    
    // Create preview for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => setCertificatePreview(e.target.result);
      reader.readAsDataURL(file);
    } else {
      setCertificatePreview(null);
    }
  };

  // Generate certificate ID
  const generateCertificateId = () => {
    const timestamp = Date.now();
    const randomPart = Math.random().toString(36).substr(2, 6).toUpperCase();
    const userPart = user?.id ? user.id.slice(-4).toUpperCase() : 'USER';
    const id = `CERT-${userPart}-${timestamp}-${randomPart}`;
    setFormData(prev => ({ ...prev, certificateId: id }));
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.certificateId.trim()) {
      newErrors.certificateId = 'Certificate ID is required';
    }
    
    if (!formData.recipientName.trim()) {
      newErrors.recipientName = 'Recipient name is required';
    }
    
    if (!formData.eventName.trim()) {
      newErrors.eventName = 'Event/Course name is required';
    }
    
    if (!formData.issuerName.trim()) {
      newErrors.issuerName = 'Issuer name is required';
    }
    
    if (!certificateFile) {
      newErrors.file = 'Please upload a certificate file';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Upload certificate
  const uploadCertificate = async () => {
    if (!user || !token) {
      alert('Please log in to upload certificates');
      return;
    }
    
    if (!validateForm()) {
      return;
    }

    setIsUploading(true);
    
    try {
      // Create FormData
      const uploadData = new FormData();
      uploadData.append('certificateFile', certificateFile);
      uploadData.append('certificateId', formData.certificateId);
      uploadData.append('recipientName', formData.recipientName);
      uploadData.append('eventName', formData.eventName);
      uploadData.append('completionDate', formData.completionDate || new Date().toISOString());
      uploadData.append('issuerName', formData.issuerName);
      uploadData.append('description', formData.description);

      console.log('📤 Uploading certificate...');
      
      const response = await api.postData('/api/certificates/upload', uploadData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      console.log('✅ Certificate uploaded successfully:', response);
      
      setUploadResult({
        success: true,
        certificate: response.certificate,
        verificationUrl: response.certificate.verificationUrl
      });

    } catch (error) {
      console.error('❌ Certificate upload failed:', error);
      setUploadResult({
        success: false,
        error: error.message || 'Failed to upload certificate'
      });
    } finally {
      setIsUploading(false);
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      certificateId: '',
      recipientName: '',
      eventName: '',
      completionDate: '',
      issuerName: user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : '',
      description: ''
    });
    setCertificateFile(null);
    setCertificatePreview(null);
    setUploadResult(null);
    setErrors({});
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-16">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <div className="flex items-center justify-center mb-4">
            <Upload className="w-12 h-12 mr-4" />
            <h1 className="text-4xl md:text-5xl font-bold">Upload Certificate</h1>
          </div>
          <p className="text-xl opacity-90 max-w-2xl mx-auto">
            Upload pre-made certificates with unique IDs for verification
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Success Message */}
        {uploadResult?.success && (
          <div className="mb-8 p-6 bg-green-50 border border-green-200 rounded-xl">
            <div className="flex items-center mb-4">
              <CheckCircle className="w-6 h-6 text-green-600 mr-3" />
              <h3 className="text-lg font-semibold text-green-800">Certificate Uploaded Successfully!</h3>
            </div>
            <div className="space-y-2 text-green-700">
              <p><strong>Certificate ID:</strong> {uploadResult.certificate.certificateId}</p>
              <p><strong>Recipient:</strong> {uploadResult.certificate.certificateData.recipientName}</p>
              <p><strong>Verification URL:</strong></p>
              <p className="font-mono text-sm bg-green-100 p-2 rounded break-all">
                {uploadResult.verificationUrl}
              </p>
            </div>
            <div className="mt-4 flex gap-3">
              <a
                href={uploadResult.verificationUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Eye className="w-4 h-4 mr-2" />
                View Certificate
              </a>
              <button
                onClick={resetForm}
                className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Upload Another
              </button>
            </div>
          </div>
        )}

        {/* Error Message */}
        {uploadResult?.success === false && (
          <div className="mb-8 p-6 bg-red-50 border border-red-200 rounded-xl">
            <div className="flex items-center mb-2">
              <AlertCircle className="w-6 h-6 text-red-600 mr-3" />
              <h3 className="text-lg font-semibold text-red-800">Upload Failed</h3>
            </div>
            <p className="text-red-700">{uploadResult.error}</p>
          </div>
        )}

        {/* Upload Form */}
        {!uploadResult?.success && (
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
            <div className="grid lg:grid-cols-2 gap-8">
              {/* Left Column - Form */}
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Certificate Details</h2>

                {/* Certificate ID */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Certificate ID *
                  </label>
                  <div className="flex gap-3">
                    <input
                      type="text"
                      name="certificateId"
                      value={formData.certificateId}
                      onChange={handleInputChange}
                      disabled={isUploading}
                      className={`flex-1 px-4 py-3 border-2 rounded-xl focus:outline-none transition-colors ${
                        errors.certificateId ? 'border-red-400' : 'border-gray-200 focus:border-blue-500'
                      }`}
                      placeholder="Enter unique certificate ID"
                    />
                    <button
                      onClick={generateCertificateId}
                      disabled={isUploading}
                      className="px-4 py-3 bg-blue-100 hover:bg-blue-200 rounded-xl transition-colors"
                      title="Generate ID"
                    >
                      Generate
                    </button>
                  </div>
                  {errors.certificateId && (
                    <p className="text-red-600 text-sm mt-1">{errors.certificateId}</p>
                  )}
                </div>

                {/* Recipient Name */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Recipient Name *
                  </label>
                  <input
                    type="text"
                    name="recipientName"
                    value={formData.recipientName}
                    onChange={handleInputChange}
                    disabled={isUploading}
                    className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none transition-colors ${
                      errors.recipientName ? 'border-red-400' : 'border-gray-200 focus:border-blue-500'
                    }`}
                    placeholder="Enter recipient's full name"
                  />
                  {errors.recipientName && (
                    <p className="text-red-600 text-sm mt-1">{errors.recipientName}</p>
                  )}
                </div>

                {/* Event Name */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Event/Course Name *
                  </label>
                  <input
                    type="text"
                    name="eventName"
                    value={formData.eventName}
                    onChange={handleInputChange}
                    disabled={isUploading}
                    className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none transition-colors ${
                      errors.eventName ? 'border-red-400' : 'border-gray-200 focus:border-blue-500'
                    }`}
                    placeholder="e.g., React Development Course"
                  />
                  {errors.eventName && (
                    <p className="text-red-600 text-sm mt-1">{errors.eventName}</p>
                  )}
                </div>

                {/* Issuer Name */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Issuer Name *
                  </label>
                  <input
                    type="text"
                    name="issuerName"
                    value={formData.issuerName}
                    onChange={handleInputChange}
                    disabled={isUploading}
                    className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none transition-colors ${
                      errors.issuerName ? 'border-red-400' : 'border-gray-200 focus:border-blue-500'
                    }`}
                    placeholder="Your name or organization"
                  />
                  {errors.issuerName && (
                    <p className="text-red-600 text-sm mt-1">{errors.issuerName}</p>
                  )}
                </div>

                {/* Completion Date */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Completion Date
                  </label>
                  <input
                    type="date"
                    name="completionDate"
                    value={formData.completionDate}
                    onChange={handleInputChange}
                    disabled={isUploading}
                    className="w-full px-4 py-3 border-2 border-gray-200 focus:border-blue-500 rounded-xl focus:outline-none transition-colors"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Description (Optional)
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    disabled={isUploading}
                    rows="3"
                    className="w-full px-4 py-3 border-2 border-gray-200 focus:border-blue-500 rounded-xl focus:outline-none transition-colors resize-none"
                    placeholder="Additional details about the certificate..."
                  />
                </div>
              </div>

              {/* Right Column - File Upload */}
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Upload Certificate</h2>

                {/* File Upload Area */}
                <div 
                  className={`border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer ${
                    errors.file 
                      ? 'border-red-300 bg-red-50' 
                      : certificateFile 
                      ? 'border-green-300 bg-green-50' 
                      : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'
                  }`}
                  onClick={() => !isUploading && fileInputRef.current?.click()}
                >
                  <Upload className={`w-12 h-12 mx-auto mb-4 ${
                    errors.file ? 'text-red-400' : certificateFile ? 'text-green-500' : 'text-gray-400'
                  }`} />
                  <h3 className={`text-lg font-semibold mb-2 ${
                    errors.file ? 'text-red-700' : certificateFile ? 'text-green-700' : 'text-gray-700'
                  }`}>
                    {certificateFile ? 'Certificate Uploaded' : 'Upload Certificate File'}
                  </h3>
                  <p className={`mb-4 ${
                    errors.file ? 'text-red-600' : certificateFile ? 'text-green-600' : 'text-gray-500'
                  }`}>
                    {certificateFile 
                      ? `${certificateFile.name} (${Math.round(certificateFile.size / 1024)}KB)`
                      : 'Click to upload or drag and drop your certificate'
                    }
                  </p>
                  <p className="text-sm text-gray-400">
                    Supports PNG, JPG, JPEG, PDF • Max 10MB
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,.pdf"
                    onChange={handleFileUpload}
                    disabled={isUploading}
                    className="hidden"
                  />
                </div>

                {errors.file && (
                  <p className="text-red-600 text-sm">{errors.file}</p>
                )}

                {/* Preview */}
                {certificatePreview && (
                  <div className="mt-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-3">Preview</h3>
                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                      <img 
                        src={certificatePreview} 
                        alt="Certificate Preview"
                        className="w-full h-auto max-h-64 object-contain"
                      />
                    </div>
                  </div>
                )}

                {/* Upload Button */}
                <button
                  onClick={uploadCertificate}
                  disabled={isUploading || !certificateFile}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-xl font-medium transition-colors flex items-center justify-center"
                >
                  {isUploading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Award className="w-5 h-5 mr-2" />
                      Upload Certificate
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CertificateUploader;
