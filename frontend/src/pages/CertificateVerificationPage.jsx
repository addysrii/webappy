import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  CheckCircle, 
  AlertCircle, 
  Award, 
  User, 
  Calendar, 
  Download,
  Share2,
  Copy,
  ArrowLeft,
  ExternalLink,
  Wrench,
  Eye,
  MapPin,
  Hash,
  Building
} from 'lucide-react';
import certificateService from '../services/certificateService.js';

const CertificateVerificationPage = () => {
  const { certificateId } = useParams();
  const navigate = useNavigate();
  const [verificationResult, setVerificationResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [debugMode, setDebugMode] = useState(false);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    if (certificateId) {
      verifyCertificate();
    }
  }, [certificateId]);

  const verifyCertificate = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Verifying certificate:', certificateId);
      
      const result = await certificateService.verifyCertificate(certificateId);
      console.log('Verification result:', result);
      setVerificationResult(result);
    } catch (error) {
      console.error('Verification error:', error);
      
      // Check if it's a 404 error (certificate not found)
      if (error.message.includes('404') || error.message.includes('not found')) {
        setVerificationResult({
          valid: false,
          message: 'Certificate not found. Please check the certificate ID and try again.'
        });
      } else {
        setError('Failed to verify certificate. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    try {
      await certificateService.downloadCertificate(certificateId);
    } catch (error) {
      console.error('Download error:', error);
      alert('Failed to download certificate. Please try again.');
    }
  };

  const handleShare = async () => {
    const currentUrl = window.location.href;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Certificate Verification - MeetKats',
          text: `Certificate verification for ${verificationResult?.certificate?.recipient}`,
          url: currentUrl
        });
      } catch (error) {
        console.error('Share error:', error);
        copyToClipboard(currentUrl);
      }
    } else {
      copyToClipboard(currentUrl);
    }
  };

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      alert('Link copied to clipboard!');
    } catch (error) {
      console.error('Copy error:', error);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      alert('Link copied to clipboard!');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const testWithKnownCertificate = () => {
    navigate('/verify-certificate/TEST-CERT-123');
  };

  const handleImageError = () => {
    setImageError(true);
  };

  const openImageModal = (imageUrl) => {
    window.open(imageUrl, '_blank', 'width=800,height=600');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-2xl shadow-xl">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Verifying certificate...</p>
          <p className="text-sm text-gray-500 mt-2">Certificate ID: {certificateId}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-12">
        <div className="max-w-4xl mx-auto px-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-white hover:text-blue-200 mb-6 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back
          </button>
          
          <div className="flex items-center justify-center mb-4">
            <Award className="w-10 h-10 mr-3" />
            <h1 className="text-3xl md:text-4xl font-bold">Certificate Verification</h1>
          </div>
          <p className="text-xl opacity-90 text-center max-w-2xl mx-auto">
            Verify the authenticity of digital certificates issued through MeetKats
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          {/* Certificate ID Display */}
          <div className="bg-gradient-to-r from-gray-50 to-blue-50 px-8 py-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Certificate ID</p>
                <p className="text-xl font-mono font-bold text-gray-900 bg-white px-3 py-1 rounded-lg inline-block mt-1">
                  {certificateId}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleShare}
                  className="flex items-center px-4 py-2 text-gray-600 hover:text-white hover:bg-blue-600 rounded-lg transition-all duration-200"
                  title="Share certificate"
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  Share
                </button>
                <button
                  onClick={() => copyToClipboard(window.location.href)}
                  className="flex items-center px-4 py-2 text-gray-600 hover:text-white hover:bg-purple-600 rounded-lg transition-all duration-200"
                  title="Copy link"
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copy
                </button>
              </div>
            </div>
          </div>

          {/* Verification Result */}
          <div className="p-8">
            {error ? (
              <div className="text-center">
                <AlertCircle className="w-20 h-20 text-red-500 mx-auto mb-6" />
                <h3 className="text-2xl font-bold text-red-900 mb-4">Verification Error</h3>
                <p className="text-red-700 mb-8 text-lg">{error}</p>
                <div className="flex gap-4 justify-center">
                  <button
                    onClick={verifyCertificate}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-medium transition-colors"
                  >
                    Retry Verification
                  </button>
                  <button
                    onClick={testWithKnownCertificate}
                    className="bg-gray-600 hover:bg-gray-700 text-white px-8 py-3 rounded-lg font-medium transition-colors"
                  >
                    Test with Sample Certificate
                  </button>
                </div>
              </div>
            ) : verificationResult ? (
              <div>
                {/* Verification Status */}
                <div className={`rounded-xl p-8 mb-8 border-2 ${
                  verificationResult.valid 
                    ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200' 
                    : 'bg-gradient-to-r from-red-50 to-pink-50 border-red-200'
                }`}>
                  <div className="flex items-center">
                    {verificationResult.valid ? (
                      <CheckCircle className="w-16 h-16 text-green-600 mr-6" />
                    ) : (
                      <AlertCircle className="w-16 h-16 text-red-600 mr-6" />
                    )}
                    
                    <div className="flex-1">
                      <h2 className={`text-3xl font-bold mb-3 ${
                        verificationResult.valid ? 'text-green-900' : 'text-red-900'
                      }`}>
                        {verificationResult.valid ? 'Certificate Verified ✓' : 'Certificate Invalid ✗'}
                      </h2>
                      
                      {verificationResult.valid ? (
                        <p className="text-green-800 text-lg">
                          This certificate is authentic and has been verified successfully against our secure database.
                        </p>
                      ) : (
                        <div className="text-red-800">
                          <p className="mb-3 text-lg">
                            {verificationResult.message || 'This certificate could not be verified.'}
                          </p>
                          {verificationResult.message?.includes('not found') && (
                            <div className="text-sm bg-red-100 p-4 rounded-lg mt-3">
                              <p className="font-medium mb-2">Possible reasons:</p>
                              <ul className="list-disc list-inside space-y-1">
                                <li>The certificate ID was typed incorrectly</li>
                                <li>The certificate has not been issued yet</li>
                                <li>The certificate has been revoked</li>
                                <li>The QR code may be damaged or outdated</li>
                              </ul>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Certificate Details */}
                {verificationResult.valid && verificationResult.certificate && (
                  <div className="space-y-8">
                    <h3 className="text-2xl font-bold text-gray-900 mb-6">Certificate Details</h3>
                    
                    {/* Certificate Image Display */}
                    {verificationResult.certificate.certificateImage && !imageError && (
                      <div className="bg-gray-50 rounded-xl p-6 text-center">
                        <h4 className="text-lg font-semibold text-gray-900 mb-4">Certificate Image</h4>
                        <div className="relative inline-block">
                          <img 
                            src={verificationResult.certificate.certificateImage}
                            alt="Certificate"
                            className="max-w-full h-auto rounded-lg shadow-lg cursor-pointer hover:shadow-xl transition-shadow"
                            onClick={() => openImageModal(verificationResult.certificate.certificateImage)}
                            onError={handleImageError}
                            style={{ maxHeight: '400px' }}
                          />
                          <button
                            onClick={() => openImageModal(verificationResult.certificate.certificateImage)}
                            className="absolute top-2 right-2 bg-white bg-opacity-90 hover:bg-opacity-100 p-2 rounded-full shadow-md transition-all"
                            title="View full size"
                          >
                            <Eye className="w-4 h-4 text-gray-700" />
                          </button>
                        </div>
                        <p className="text-sm text-gray-600 mt-2">Click image to view full size</p>
                      </div>
                    )}
                    
                    <div className="grid gap-6">
                      {/* Recipient */}
                      <div className="flex items-start p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                        <User className="w-8 h-8 text-blue-600 mr-4 mt-1" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-blue-600 mb-1">Recipient</p>
                          <p className="text-2xl font-bold text-blue-900">
                            {verificationResult.certificate.recipient}
                          </p>
                        </div>
                      </div>

                      {/* Event */}
                      {verificationResult.certificate.event && (
                        <div className="flex items-start p-6 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-200">
                          <Award className="w-8 h-8 text-purple-600 mr-4 mt-1" />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-purple-600 mb-1">Event/Course</p>
                            <p className="text-2xl font-bold text-purple-900">
                              {verificationResult.certificate.event}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Event ID */}
                      {verificationResult.certificate.eventId && (
                        <div className="flex items-start p-6 bg-gradient-to-r from-orange-50 to-yellow-50 rounded-xl border border-orange-200">
                          <Hash className="w-8 h-8 text-orange-600 mr-4 mt-1" />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-orange-600 mb-1">Event ID</p>
                            <p className="text-xl font-mono font-bold text-orange-900 bg-white px-3 py-1 rounded-lg inline-block">
                              {verificationResult.certificate.eventId}
                            </p>
                          </div>
                        </div>
                      )}

                      <div className="grid md:grid-cols-2 gap-6">
                        {/* Issue Date */}
                        <div className="flex items-start p-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200">
                          <Calendar className="w-8 h-8 text-green-600 mr-4 mt-1" />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-green-600 mb-1">Issued Date</p>
                            <p className="text-lg font-bold text-green-900">
                              {formatDate(verificationResult.certificate.issuedAt)}
                            </p>
                          </div>
                        </div>

                        {/* Issued By */}
                        {verificationResult.certificate.issuedBy && (
                          <div className="flex items-start p-6 bg-gradient-to-r from-gray-50 to-slate-50 rounded-xl border border-gray-200">
                            <Building className="w-8 h-8 text-gray-600 mr-4 mt-1" />
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-600 mb-1">Issued By</p>
                              <p className="text-lg font-bold text-gray-900">
                                {verificationResult.certificate.issuedBy}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Template Information */}
                      {verificationResult.certificate.template && (
                        <div className="flex items-start p-6 bg-gradient-to-r from-indigo-50 to-blue-50 rounded-xl border border-indigo-200">
                          <Award className="w-8 h-8 text-indigo-600 mr-4 mt-1" />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-indigo-600 mb-1">Certificate Template</p>
                            <p className="text-lg font-semibold text-indigo-900">
                              {verificationResult.certificate.template}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-4 justify-center pt-8 border-t border-gray-200">
                      <button
                        onClick={handleDownload}
                        className="flex items-center px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
                      >
                        <Download className="w-5 h-5 mr-3" />
                        Download Certificate
                      </button>
                      
                      {verificationResult.certificate.verificationUrl && (
                        <a
                          href={verificationResult.certificate.verificationUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center px-8 py-4 border-2 border-gray-300 hover:border-purple-400 text-gray-700 hover:text-purple-700 rounded-xl font-medium transition-all duration-200 bg-white hover:bg-purple-50"
                        >
                          <ExternalLink className="w-5 h-5 mr-3" />
                          View Full Details
                        </a>
                      )}
                      
                      <button
                        onClick={handleShare}
                        className="flex items-center px-8 py-4 border-2 border-green-300 hover:border-green-400 text-green-700 hover:text-green-800 rounded-xl font-medium transition-all duration-200 bg-white hover:bg-green-50"
                      >
                        <Share2 className="w-5 h-5 mr-3" />
                        Share Certificate
                      </button>
                    </div>

                    {/* Security Notice */}
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-8 mt-8">
                      <div className="flex items-start">
                        <CheckCircle className="w-8 h-8 text-blue-600 mr-4 mt-1" />
                        <div>
                          <h4 className="font-bold text-blue-900 mb-3 text-lg">Security & Authenticity Verified</h4>
                          <p className="text-blue-800 mb-4">
                            This certificate has been verified against our secure MeetKats database. 
                            The verification confirms that this certificate was issued by the 
                            stated organization and has not been tampered with.
                          </p>
                          <div className="grid md:grid-cols-2 gap-4 text-sm">
                            <div>
                              <p className="font-medium text-blue-900 mb-1">Verification Details:</p>
                              <ul className="text-blue-800 space-y-1">
                                <li>✓ Certificate ID authenticated</li>
                                <li>✓ Issuer identity confirmed</li>
                                <li>✓ Issue date verified</li>
                                <li>✓ Certificate status: Active</li>
                              </ul>
                            </div>
                            <div>
                              <p className="font-medium text-blue-900 mb-1">Verification Time:</p>
                              <p className="text-blue-800">{new Date().toLocaleString()}</p>
                              <p className="font-medium text-blue-900 mb-1 mt-2">Verified by:</p>
                              <p className="text-blue-800">MeetKats Certificate Authority</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Invalid Certificate Actions */}
                {!verificationResult.valid && (
                  <div className="flex flex-wrap gap-4 justify-center pt-6 border-t border-gray-200">
                    <button
                      onClick={verifyCertificate}
                      className="flex items-center px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors"
                    >
                      Try Again
                    </button>
                    <button
                      onClick={testWithKnownCertificate}
                      className="flex items-center px-8 py-3 border-2 border-gray-300 hover:border-gray-400 text-gray-700 hover:text-gray-900 rounded-xl font-medium transition-colors"
                    >
                      Test with Sample Certificate
                    </button>
                    <button
                      onClick={() => navigate('/certificate-generator')}
                      className="flex items-center px-8 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-medium transition-colors"
                    >
                      Create New Certificate
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12">
                <AlertCircle className="w-20 h-20 text-gray-400 mx-auto mb-6" />
                <h3 className="text-2xl font-medium text-gray-900 mb-4">No certificate found</h3>
                <p className="text-gray-600 mb-8 text-lg">The certificate ID provided could not be found in our database.</p>
                <div className="flex gap-4 justify-center">
                  <button
                    onClick={testWithKnownCertificate}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-medium transition-colors"
                  >
                    Test with Sample Certificate
                  </button>
                  <button
                    onClick={() => navigate('/certificate-generator')}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 rounded-xl font-medium transition-colors"
                  >
                    Create New Certificate
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Help Section */}
        <div className="mt-12 bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">Need Help?</h3>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-blue-50 p-6 rounded-xl">
              <h4 className="font-bold text-blue-900 mb-3">How to verify a certificate</h4>
              <p className="text-sm text-blue-800">
                You can verify a certificate by entering its unique ID in the URL or scanning 
                the QR code found on the certificate document. All certificates issued through 
                MeetKats contain a unique verification URL.
              </p>
            </div>
            <div className="bg-green-50 p-6 rounded-xl">
              <h4 className="font-bold text-green-900 mb-3">Certificate not found?</h4>
              <p className="text-sm text-green-800">
                If you're having trouble verifying a certificate, please check that 
                you've entered the correct certificate ID. The ID is case-sensitive and 
                usually follows the format CERT-XXXXXXXXX.
              </p>
            </div>
            <div className="bg-purple-50 p-6 rounded-xl">
              <h4 className="font-bold text-purple-900 mb-3">Create certificates</h4>
              <p className="text-sm text-purple-800">
                You can create and issue certificates through our certificate generator. 
                Each certificate will have a unique ID and QR code for easy verification.
              </p>
            </div>
          </div>
          
          {/* QR Code Information */}
          <div className="mt-8 p-6 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl border border-gray-200">
            <h4 className="font-bold text-gray-900 mb-3">QR Code Verification</h4>
            <p className="text-sm text-gray-700 mb-3">
              When you scan a QR code from a MeetKats certificate, it will automatically redirect you to this verification page. 
              The QR code contains the verification URL in the format: <span className="font-mono bg-white px-2 py-1 rounded">https://meetkats.com/certificates/{certificateId}</span>
            </p>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="font-medium text-gray-800 mb-1">Supported QR Scanners:</p>
                <ul className="text-gray-700 space-y-1">
                  <li>• iOS Camera app</li>
                  <li>• Android Camera app</li>
                  <li>• Google Lens</li>
                  <li>• Third-party QR scanner apps</li>
                </ul>
              </div>
              <div>
                <p className="font-medium text-gray-800 mb-1">Scanning Tips:</p>
                <ul className="text-gray-700 space-y-1">
                  <li>• Hold device 6-12 inches from QR code</li>
                  <li>• Ensure good lighting</li>
                  <li>• Keep QR code flat and stable</li>
                  <li>• Wait for auto-focus to complete</li>
                </ul>
              </div>
            </div>
          </div>
          
          {/* Debug Info */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <details className="cursor-pointer">
              <summary className="text-sm font-medium text-gray-700 hover:text-gray-900 flex items-center">
                <Wrench className="w-4 h-4 mr-2" />
                Debug Information (for developers)
              </summary>
              <div className="mt-4 text-xs text-gray-600 bg-gray-50 p-4 rounded-lg">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <p><strong>Backend URL:</strong> https://new-backend-w86d.onrender.com</p>
                    <p><strong>API Endpoint:</strong> /api/certificates/verify/{certificateId}</p>
                    <p><strong>Certificate ID:</strong> {certificateId}</p>
                    <p><strong>Verification Time:</strong> {new Date().toISOString()}</p>
                  </div>
                  <div>
                    <p><strong>Test URL:</strong> <a href="https://new-backend-w86d.onrender.com/api/certificates/test" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Test Certificate API</a></p>
                    <p><strong>QR Format:</strong> meetkats.com/certificates/{certificateId}</p>
                    <p><strong>Status:</strong> {verificationResult?.valid ? 'Valid' : 'Invalid'}</p>
                    <p><strong>Response Time:</strong> {loading ? 'Loading...' : 'Completed'}</p>
                  </div>
                </div>
              </div>
            </details>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CertificateVerificationPage;