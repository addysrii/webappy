import React, { useState, useEffect } from 'react';
import { 
  User, Calendar, Upload, Settings, BarChart3, MapPin, FileText, 
  CheckCircle, XCircle, Search, Plus, Edit3, Trash2, Eye, Phone, 
  Mail, Globe, Camera, Building2, Users, TrendingUp, Clock, Award, 
  Link as LinkIcon, Unlink, Shield, AlertCircle, Save, X, 
  Star, Filter, Download, Share2, Bell, Menu
} from 'lucide-react';

// Import the actual organizer service
import organizerService from '../services/organizerService';

const OrganizerManagementSystem = () => {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [organizers, setOrganizers] = useState([]);
  const [selectedOrganizer, setSelectedOrganizer] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({});
  const [pagination, setPagination] = useState({ page: 1, limit: 10 });

  // Dashboard Overview Component
  const Dashboard = () => {
    const [dashboardData, setDashboardData] = useState({
      totalOrganizers: 0,
      verifiedOrganizers: 0,
      pendingVerifications: 0,
      totalEvents: 0
    });
    const [recentOrganizers, setRecentOrganizers] = useState([]);

    useEffect(() => {
      loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
      setLoading(true);
      try {
        const response = await organizerService.getAllOrganizers({ 
          page: 1, 
          limit: 5,
          sortBy: 'createdAt',
          sortOrder: 'desc'
        });
        setRecentOrganizers(response.data || response.organizers || []);
        setDashboardData({
          totalOrganizers: response.totalCount || 0,
          verifiedOrganizers: response.verifiedCount || 0,
          pendingVerifications: response.pendingCount || 0,
          totalEvents: response.totalEvents || 0
        });
      } catch (error) {
        setError('Failed to load dashboard data');
        console.error('Dashboard error:', error);
      } finally {
        setLoading(false);
      }
    };

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Organizer Dashboard</h1>
          <button
            onClick={() => setCurrentPage('create')}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700"
          >
            <Plus size={16} />
            Add Organizer
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Organizers</p>
                <p className="text-2xl font-semibold text-gray-900">{dashboardData.totalOrganizers}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Verified</p>
                <p className="text-2xl font-semibold text-green-600">{dashboardData.verifiedOrganizers}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-semibold text-yellow-600">{dashboardData.pendingVerifications}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Events</p>
                <p className="text-2xl font-semibold text-purple-600">{dashboardData.totalEvents}</p>
              </div>
              <Calendar className="h-8 w-8 text-purple-600" />
            </div>
          </div>
        </div>

        {/* Recent Organizers */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b">
            <h2 className="text-lg font-semibold text-gray-900">Recent Organizers</h2>
          </div>
          <div className="p-6">
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : recentOrganizers.length > 0 ? (
              <div className="space-y-4">
                {recentOrganizers.map((organizer) => (
                  <div key={organizer._id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                        {organizer.profileImage ? (
                          <img src={organizer.profileImage} alt="" className="w-10 h-10 rounded-full object-cover" />
                        ) : (
                          <User size={20} className="text-gray-500" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{organizer.organizerName || organizer.name}</p>
                        <p className="text-sm text-gray-500">{organizer.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {organizer.isVerified ? (
                        <CheckCircle size={16} className="text-green-500" />
                      ) : (
                        <Clock size={16} className="text-yellow-500" />
                      )}
                      <button
                        onClick={() => {
                          setSelectedOrganizer(organizer);
                          setCurrentPage('details');
                        }}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <Eye size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No organizers found</p>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Organizers List Component
  const OrganizersList = () => {
    useEffect(() => {
      loadOrganizers();
    }, [pagination, searchQuery, filters]);

    const loadOrganizers = async () => {
      setLoading(true);
      try {
        const params = {
          page: pagination.page,
          limit: pagination.limit,
          ...filters
        };
        
        if (searchQuery) {
          const response = await organizerService.searchOrganizers({ 
            query: searchQuery,
            ...params 
          });
          setOrganizers(response.organizers || response.data || []);
        } else {
          const response = await organizerService.getAllOrganizers(params);
          setOrganizers(response.organizers || response.data || []);
        }
      } catch (error) {
        setError('Failed to load organizers');
        console.error('Error loading organizers:', error);
      } finally {
        setLoading(false);
      }
    };

    const handleDelete = async (organizerId) => {
      if (window.confirm('Are you sure you want to delete this organizer?')) {
        try {
          await organizerService.deleteOrganizer(organizerId);
          loadOrganizers();
        } catch (error) {
          setError('Failed to delete organizer');
        }
      }
    };

    const handleSearch = (e) => {
      e.preventDefault();
      loadOrganizers();
    };

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">All Organizers</h1>
          <button
            onClick={() => setCurrentPage('create')}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700"
          >
            <Plus size={16} />
            Add New
          </button>
        </div>

        {/* Search and Filters */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <form onSubmit={handleSearch} className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name, email, or location..."
                  className="pl-10 w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="w-48">
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select
                value={filters.organizationType || ''}
                onChange={(e) => setFilters({ ...filters, organizationType: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Types</option>
                <option value="individual">Individual</option>
                <option value="Cultural">Cultural</option>
                <option value="Educational">Educational</option>
                <option value="Sports">Sports</option>
                <option value="Entertainment">Entertainment</option>
              </select>
            </div>
            <div className="w-32">
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={filters.isVerified || ''}
                onChange={(e) => setFilters({ ...filters, isVerified: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Status</option>
                <option value="true">Verified</option>
                <option value="false">Pending</option>
              </select>
            </div>
            <button
              type="submit"
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
            >
              Search
            </button>
          </form>
        </div>

        {/* Organizers Table */}
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : organizers.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Organizer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Events
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {organizers.map((organizer) => (
                    <tr key={organizer._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 flex-shrink-0">
                            {organizer.profileImage ? (
                              <img 
                                className="h-10 w-10 rounded-full object-cover" 
                                src={organizer.profileImage} 
                                alt="" 
                              />
                            ) : (
                              <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                                <User className="h-5 w-5 text-gray-500" />
                              </div>
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {organizer.organizerName || organizer.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {organizer.location}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{organizer.email}</div>
                        <div className="text-sm text-gray-500">{organizer.phone}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                          {organizer.organizationType || 'General'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          organizer.isVerified 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {organizer.isVerified ? 'Verified' : 'Pending'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {organizer.totalEvents || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => {
                              setSelectedOrganizer(organizer);
                              setCurrentPage('details');
                            }}
                            className="text-blue-600 hover:text-blue-900"
                            title="View Details"
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedOrganizer(organizer);
                              setCurrentPage('edit');
                            }}
                            className="text-green-600 hover:text-green-900"
                            title="Edit"
                          >
                            <Edit3 size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(organizer._id)}
                            className="text-red-600 hover:text-red-900"
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500">No organizers found</p>
            </div>
          )}
        </div>

        {/* Pagination */}
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-700">Show</span>
            <select
              value={pagination.limit}
              onChange={(e) => setPagination({ ...pagination, limit: parseInt(e.target.value), page: 1 })}
              className="border border-gray-300 rounded px-2 py-1 text-sm"
            >
              <option value="10">10</option>
              <option value="25">25</option>
              <option value="50">50</option>
            </select>
            <span className="text-sm text-gray-700">entries</span>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setPagination({ ...pagination, page: Math.max(1, pagination.page - 1) })}
              disabled={pagination.page === 1}
              className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="px-3 py-1 text-sm">Page {pagination.page}</span>
            <button
              onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
              className="px-3 py-1 border border-gray-300 rounded text-sm"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Create/Edit Organizer Form
  const OrganizerForm = ({ isEdit = false }) => {
    const [formData, setFormData] = useState({
      organizerName: '',
      email: '',
      phone: '',
      organizationType: '',
      description: '',
      location: '',
      website: '',
      address: {
        street: '',
        city: '',
        state: '',
        zipCode: '',
        country: 'India'
      },
      socialLinks: {
        facebook: '',
        twitter: '',
        instagram: '',
        linkedin: ''
      },
      businessInfo: {
        registrationNumber: '',
        gstNumber: '',
        panNumber: ''
      }
    });
    const [profileImage, setProfileImage] = useState(null);
    const [documents, setDocuments] = useState({});
    const [submitting, setSubmitting] = useState(false);
    const [checkingAvailability, setCheckingAvailability] = useState(false);
    const [availability, setAvailability] = useState({});

    useEffect(() => {
      if (isEdit && selectedOrganizer) {
        setFormData({
          organizerName: selectedOrganizer.organizerName || '',
          email: selectedOrganizer.email || '',
          phone: selectedOrganizer.phone || '',
          organizationType: selectedOrganizer.organizationType || '',
          description: selectedOrganizer.description || '',
          location: selectedOrganizer.location || '',
          website: selectedOrganizer.website || '',
          address: selectedOrganizer.address || {
            street: '',
            city: '',
            state: '',
            zipCode: '',
            country: 'India'
          },
          socialLinks: selectedOrganizer.socialLinks || {
            facebook: '',
            twitter: '',
            instagram: '',
            linkedin: ''
          },
          businessInfo: selectedOrganizer.businessInfo || {
            registrationNumber: '',
            gstNumber: '',
            panNumber: ''
          }
        });
      }
    }, [isEdit, selectedOrganizer]);

    const checkAvailability = async (field, value) => {
      if (!value) return;
      
      setCheckingAvailability(true);
      try {
        const response = await organizerService.checkAvailability(field, value);
        setAvailability({ ...availability, [field]: response.available });
      } catch (error) {
        console.error('Error checking availability:', error);
      } finally {
        setCheckingAvailability(false);
      }
    };

    const handleInputChange = (e) => {
      const { name, value } = e.target;
      if (name.includes('.')) {
        const [parent, child] = name.split('.');
        setFormData({
          ...formData,
          [parent]: {
            ...formData[parent],
            [child]: value
          }
        });
      } else {
        setFormData({ ...formData, [name]: value });
      }
    };

    const handleFileChange = (e, type) => {
      const file = e.target.files[0];
      if (type === 'profile') {
        setProfileImage(file);
      } else {
        setDocuments({ ...documents, [type]: file });
      }
    };

    const handleSubmit = async (e) => {
      e.preventDefault();
      setSubmitting(true);
      
      try {
        let organizerData;
        
        if (isEdit) {
          organizerData = await organizerService.updateOrganizer(selectedOrganizer._id, formData);
        } else {
          organizerData = await organizerService.createOrganizer(formData);
        }

        // Upload profile image if provided
        if (profileImage && organizerData.organizer) {
          await organizerService.uploadProfilePicture(organizerData.organizer._id, profileImage);
        }

        // Upload documents if provided
        if (Object.keys(documents).length > 0 && organizerData.organizer) {
          await organizerService.uploadDocuments(organizerData.organizer._id, documents);
        }

        // Update social links if provided
        if (formData.socialLinks && organizerData.organizer) {
          await organizerService.updateSocialLinks(organizerData.organizer._id, formData.socialLinks);
        }

        setCurrentPage('list');
      } catch (error) {
        setError(isEdit ? 'Failed to update organizer' : 'Failed to create organizer');
        console.error('Error submitting form:', error);
      } finally {
        setSubmitting(false);
      }
    };

    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">
            {isEdit ? 'Edit Organizer' : 'Create New Organizer'}
          </h1>
          <button
            onClick={() => setCurrentPage('list')}
            className="text-gray-600 hover:text-gray-800"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information */}
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Organizer Name *
                </label>
                <input
                  type="text"
                  name="organizerName"
                  value={formData.organizerName}
                  onChange={handleInputChange}
                  onBlur={() => checkAvailability('organizerName', formData.organizerName)}
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {availability.organizerName === false && (
                  <p className="text-red-500 text-sm mt-1">This name is already taken</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  onBlur={() => checkAvailability('email', formData.email)}
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {availability.email === false && (
                  <p className="text-red-500 text-sm mt-1">This email is already registered</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Organization Type *
                </label>
                <select
                  name="organizationType"
                  value={formData.organizationType}
                  onChange={handleInputChange}
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select Type</option>
                  <option value="individual">Individual</option>
                  <option value="Cultural">Cultural</option>
                  <option value="Educational">Educational</option>
                  <option value="Sports">Sports</option>
                  <option value="Entertainment">Entertainment</option>
                  <option value="Non-Profit">Non-Profit</option>
                  <option value="Government">Government</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Website
                </label>
                <input
                  type="url"
                  name="website"
                  value={formData.website}
                  onChange={handleInputChange}
                  placeholder="https://www.example.com"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows="4"
                  placeholder="Tell us about your organization..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                ></textarea>
              </div>
            </div>
          </div>

          {/* Address Information */}
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Address Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Street Address
                </label>
                <input
                  type="text"
                  name="address.street"
                  value={formData.address.street}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  City
                </label>
                <input
                  type="text"
                  name="address.city"
                  value={formData.address.city}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  State
                </label>
                <input
                  type="text"
                  name="address.state"
                  value={formData.address.state}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ZIP Code
                </label>
                <input
                  type="text"
                  name="address.zipCode"
                  value={formData.address.zipCode}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Country
                </label>
                <select
                  name="address.country"
                  value={formData.address.country}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="India">India</option>
                  <option value="USA">USA</option>
                  <option value="UK">UK</option>
                  <option value="Canada">Canada</option>
                  <option value="Australia">Australia</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Location (for search)
                </label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  placeholder="e.g., Mumbai, Maharashtra"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Business Information */}
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Business Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Registration Number
                </label>
                <input
                  type="text"
                  name="businessInfo.registrationNumber"
                  value={formData.businessInfo.registrationNumber}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  GST Number
                </label>
                <input
                  type="text"
                  name="businessInfo.gstNumber"
                  value={formData.businessInfo.gstNumber}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  PAN Number
                </label>
                <input
                  type="text"
                  name="businessInfo.panNumber"
                  value={formData.businessInfo.panNumber}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Social Links */}
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Social Media Links</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Facebook
                </label>
                <input
                  type="url"
                  name="socialLinks.facebook"
                  value={formData.socialLinks.facebook}
                  onChange={handleInputChange}
                  placeholder="https://facebook.com/yourpage"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Twitter
                </label>
                <input
                  type="url"
                  name="socialLinks.twitter"
                  value={formData.socialLinks.twitter}
                  onChange={handleInputChange}
                  placeholder="https://twitter.com/youraccount"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Instagram
                </label>
                <input
                  type="url"
                  name="socialLinks.instagram"
                  value={formData.socialLinks.instagram}
                  onChange={handleInputChange}
                  placeholder="https://instagram.com/youraccount"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  LinkedIn
                </label>
                <input
                  type="url"
                  name="socialLinks.linkedin"
                  value={formData.socialLinks.linkedin}
                  onChange={handleInputChange}
                  placeholder="https://linkedin.com/company/yourcompany"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* File Uploads */}
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Profile & Documents</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Profile Picture
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileChange(e, 'profile')}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Business Registration Certificate
                </label>
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => handleFileChange(e, 'businessCertificate')}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  PAN Card
                </label>
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => handleFileChange(e, 'panCard')}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  GST Certificate
                </label>
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => handleFileChange(e, 'gstCertificate')}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => setCurrentPage('list')}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || checkingAvailability}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  {isEdit ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                <>
                  <Save size={16} />
                  {isEdit ? 'Update Organizer' : 'Create Organizer'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    );
  };

  // Organizer Details Component
  const OrganizerDetails = () => {
    const [organizerData, setOrganizerData] = useState(null);
    const [analytics, setAnalytics] = useState(null);
    const [events, setEvents] = useState([]);
    const [verificationStatus, setVerificationStatus] = useState(null);
    const [activeTab, setActiveTab] = useState('overview');

    useEffect(() => {
      if (selectedOrganizer) {
        loadOrganizerDetails();
        loadAnalytics();
        loadEvents();
        loadVerificationStatus();
      }
    }, [selectedOrganizer]);

    const loadOrganizerDetails = async () => {
      try {
        const response = await organizerService.getOrganizerById(selectedOrganizer._id);
        setOrganizerData(response.data || response);
      } catch (error) {
        setError('Failed to load organizer details');
      }
    };

    const loadAnalytics = async () => {
      try {
        const response = await organizerService.getAnalytics(selectedOrganizer._id);
        setAnalytics(response.data || response);
      } catch (error) {
        console.error('Error loading analytics:', error);
      }
    };

    const loadEvents = async () => {
      try {
        const response = await organizerService.getHostedEvents(selectedOrganizer._id);
        setEvents(response.events || response.data || []);
      } catch (error) {
        console.error('Error loading events:', error);
      }
    };

    const loadVerificationStatus = async () => {
      try {
        const response = await organizerService.getVerificationStatus(selectedOrganizer._id);
        setVerificationStatus(response.data || response);
      } catch (error) {
        console.error('Error loading verification status:', error);
      }
    };

    const handleSubmitForApproval = async () => {
      try {
        await organizerService.submitForApproval(selectedOrganizer._id);
        loadVerificationStatus();
        alert('Submitted for approval successfully!');
      } catch (error) {
        setError('Failed to submit for approval');
      }
    };

    const organizer = organizerData || selectedOrganizer;

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setCurrentPage('list')}
              className="text-gray-600 hover:text-gray-800"
            >
              ← Back
            </button>
            <h1 className="text-3xl font-bold text-gray-900">Organizer Details</h1>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => {
                setSelectedOrganizer(organizer);
                setCurrentPage('edit');
              }}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700"
            >
              <Edit3 size={16} />
              Edit
            </button>
            {!organizer.isVerified && (
              <button
                onClick={handleSubmitForApproval}
                className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-green-700"
              >
                <CheckCircle size={16} />
                Submit for Approval
              </button>
            )}
          </div>
        </div>

        {/* Header Card */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-6">
              <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center">
                {organizer.profileImage ? (
                  <img 
                    src={organizer.profileImage} 
                    alt="" 
                    className="w-20 h-20 rounded-full object-cover" 
                  />
                ) : (
                  <User size={32} className="text-gray-500" />
                )}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{organizer.organizerName}</h2>
                <p className="text-gray-600">{organizer.organizationType}</p>
                <div className="flex items-center space-x-4 mt-2">
                  <div className="flex items-center space-x-1">
                    <Mail size={16} className="text-gray-400" />
                    <span className="text-sm text-gray-600">{organizer.email}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Phone size={16} className="text-gray-400" />
                    <span className="text-sm text-gray-600">{organizer.phone}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <MapPin size={16} className="text-gray-400" />
                    <span className="text-sm text-gray-600">{organizer.location}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${
                organizer.isVerified 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-yellow-100 text-yellow-800'
              }`}>
                {organizer.isVerified ? (
                  <><CheckCircle size={16} className="mr-1" /> Verified</>
                ) : (
                  <><Clock size={16} className="mr-1" /> Pending</>
                )}
              </div>
              {organizer.rating && (
                <div className="flex items-center mt-2">
                  <Star size={16} className="text-yellow-400 fill-current" />
                  <span className="ml-1 text-sm font-medium">{organizer.rating}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="border-b">
            <nav className="flex space-x-8 px-6">
              {['overview', 'events', 'analytics', 'documents', 'verification'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm capitalize ${
                    activeTab === tab
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-blue-600">Total Events</p>
                        <p className="text-2xl font-semibold text-blue-900">{organizer.totalEvents || 0}</p>
                      </div>
                      <Calendar className="h-8 w-8 text-blue-600" />
                    </div>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-green-600">Attendees</p>
                        <p className="text-2xl font-semibold text-green-900">{analytics?.totalAttendees || 0}</p>
                      </div>
                      <Users className="h-8 w-8 text-green-600" />
                    </div>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-purple-600">Revenue</p>
                        <p className="text-2xl font-semibold text-purple-900">₹{analytics?.revenue || 0}</p>
                      </div>
                      <TrendingUp className="h-8 w-8 text-purple-600" />
                    </div>
                  </div>
                  <div className="bg-orange-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-orange-600">Rating</p>
                        <p className="text-2xl font-semibold text-orange-900">{organizer.rating || 'N/A'}</p>
                      </div>
                      <Star className="h-8 w-8 text-orange-600" />
                    </div>
                  </div>
                </div>

                {/* Basic Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Organization Type</p>
                        <p className="text-gray-900">{organizer.organizationType || 'Not specified'}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600">Website</p>
                        {organizer.website ? (
                          <a 
                            href={organizer.website} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                          >
                            <Globe size={16} />
                            {organizer.website}
                          </a>
                        ) : (
                          <p className="text-gray-500">Not provided</p>
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600">Description</p>
                        <p className="text-gray-900">{organizer.description || 'No description provided'}</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Address</p>
                        {organizer.address ? (
                          <p className="text-gray-900">
                            {[
                              organizer.address.street,
                              organizer.address.city,
                              organizer.address.state,
                              organizer.address.zipCode,
                              organizer.address.country
                            ].filter(Boolean).join(', ')}
                          </p>
                        ) : (
                          <p className="text-gray-500">Not provided</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Social Links */}
                {organizer.socialLinks && Object.values(organizer.socialLinks).some(Boolean) && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Social Media</h3>
                    <div className="flex space-x-4">
                      {organizer.socialLinks.facebook && (
                        <a 
                          href={organizer.socialLinks.facebook}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800"
                        >
                          Facebook
                        </a>
                      )}
                      {organizer.socialLinks.twitter && (
                        <a 
                          href={organizer.socialLinks.twitter}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:text-blue-600"
                        >
                          Twitter
                        </a>
                      )}
                      {organizer.socialLinks.instagram && (
                        <a 
                          href={organizer.socialLinks.instagram}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-pink-600 hover:text-pink-800"
                        >
                          Instagram
                        </a>
                      )}
                      {organizer.socialLinks.linkedin && (
                        <a 
                          href={organizer.socialLinks.linkedin}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-700 hover:text-blue-900"
                        >
                          LinkedIn
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'events' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Hosted Events</h3>
                {events.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {events.map((event) => (
                      <div key={event._id} className="border rounded-lg p-4">
                        <h4 className="font-medium text-gray-900">{event.title}</h4>
                        <p className="text-sm text-gray-600 mt-1">{event.description}</p>
                        <div className="mt-2 flex justify-between items-center">
                          <span className={`px-2 py-1 rounded text-xs ${
                            event.status === 'active' ? 'bg-green-100 text-green-800' :
                            event.status === 'completed' ? 'bg-gray-100 text-gray-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {event.status}
                          </span>
                          <span className="text-sm text-gray-500">{event.attendees || 0} attendees</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">No events found</p>
                )}
              </div>
            )}

            {activeTab === 'analytics' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Analytics</h3>
                {analytics ? (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-sm font-medium text-gray-600">Total Events</p>
                        <p className="text-2xl font-semibold text-gray-900">{analytics.totalEvents}</p>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-sm font-medium text-gray-600">Total Attendees</p>
                        <p className="text-2xl font-semibold text-gray-900">{analytics.totalAttendees}</p>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-sm font-medium text-gray-600">Upcoming Events</p>
                        <p className="text-2xl font-semibold text-gray-900">{analytics.upcomingEvents}</p>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                        <p className="text-2xl font-semibold text-gray-900">₹{analytics.revenue}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">Analytics data not available</p>
                )}
              </div>
            )}

            {activeTab === 'documents' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Documents</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {organizer.documents ? (
                    Object.entries(organizer.documents).map(([docType, docUrl]) => (
                      <div key={docType} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <FileText size={20} className="text-gray-400" />
                            <span className="font-medium capitalize">{docType.replace(/([A-Z])/g, ' $1')}</span>
                          </div>
                          <button
                            onClick={() => window.open(docUrl, '_blank')}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            <Eye size={16} />
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 col-span-2 text-center py-8">No documents uploaded</p>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'verification' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Verification Status</h3>
                {verificationStatus ? (
                  <div className="space-y-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">Overall Status</span>
                        <span className={`px-3 py-1 rounded-full text-sm ${
                          verificationStatus.isVerified 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {verificationStatus.isVerified ? 'Verified' : 'Pending'}
                        </span>
                      </div>
                    </div>
                    
                    {verificationStatus.checks && (
                      <div className="space-y-2">
                        {Object.entries(verificationStatus.checks).map(([check, status]) => (
                          <div key={check} className="flex items-center justify-between p-3 border rounded">
                            <span className="capitalize">{check.replace(/([A-Z])/g, ' $1')}</span>
                            {status ? (
                              <CheckCircle size={20} className="text-green-500" />
                            ) : (
                              <XCircle size={20} className="text-red-500" />
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">Verification status not available</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Navigation
  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />;
      case 'list':
        return <OrganizersList />;
      case 'create':
        return <OrganizerForm />;
      case 'edit':
        return <OrganizerForm isEdit={true} />;
      case 'details':
        return <OrganizerDetails />;
      default:
        return <Dashboard />;
    }
  };

  // Login Component
  const LoginForm = () => {
    const [credentials, setCredentials] = useState({ email: '', password: '' });
    const [loginLoading, setLoginLoading] = useState(false);

    const handleLogin = async (e) => {
      e.preventDefault();
      setLoginLoading(true);
      
      try {
        const response = await organizerService.loginOrganizer(credentials);
        localStorage.setItem('organizerToken', response.token);
        localStorage.setItem('organizerId', response.organizer._id);
        // Redirect or update app state
        alert('Login successful!');
      } catch (error) {
        setError('Invalid credentials');
      } finally {
        setLoginLoading(false);
      }
    };

    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full space-y-8">
          <div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              Organizer Login
            </h2>
          </div>
          <form className="mt-8 space-y-6" onSubmit={handleLogin}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input
                  type="email"
                  value={credentials.email}
                  onChange={(e) => setCredentials({...credentials, email: e.target.value})}
                  required
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Password</label>
                <input
                  type="password"
                  value={credentials.password}
                  onChange={(e) => setCredentials({...credentials, password: e.target.value})}
                  required
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loginLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loginLoading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>
        </div>
      </div>
    );
  };

  // Search & Nearby Component
  const SearchAndNearby = () => {
    const [searchResults, setSearchResults] = useState([]);
    const [nearbyOrganizers, setNearbyOrganizers] = useState([]);
    const [searchParams, setSearchParams] = useState({
      query: '',
      location: '',
      organizationType: '',
      radius: 10
    });
    const [locationParams, setLocationParams] = useState({
      lat: '',
      lng: '',
      radius: 10
    });

    const handleSearch = async (e) => {
      e.preventDefault();
      setLoading(true);
      
      try {
        const response = await organizerService.searchOrganizers(searchParams);
        setSearchResults(response.organizers || response.data || []);
      } catch (error) {
        setError('Search failed');
      } finally {
        setLoading(false);
      }
    };

    const handleNearbySearch = async (e) => {
      e.preventDefault();
      setLoading(true);
      
      try {
        const response = await organizerService.getNearbyOrganizers(locationParams);
        setNearbyOrganizers(response.organizers || response.data || []);
      } catch (error) {
        setError('Nearby search failed');
      } finally {
        setLoading(false);
      }
    };

    const getCurrentLocation = () => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((position) => {
          setLocationParams({
            ...locationParams,
            lat: position.coords.latitude.toString(),
            lng: position.coords.longitude.toString()
          });
        });
      }
    };

    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-900">Search Organizers</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Advanced Search */}
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Advanced Search</h2>
            <form onSubmit={handleSearch} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Search Query</label>
                <input
                  type="text"
                  value={searchParams.query}
                  onChange={(e) => setSearchParams({...searchParams, query: e.target.value})}
                  placeholder="Search by name, type, or keywords..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <input
                  type="text"
                  value={searchParams.location}
                  onChange={(e) => setSearchParams({...searchParams, location: e.target.value})}
                  placeholder="City, State"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Organization Type</label>
                <select
                  value={searchParams.organizationType}
                  onChange={(e) => setSearchParams({...searchParams, organizationType: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Types</option>
                  <option value="Corporate">Corporate</option>
                  <option value="Cultural">Cultural</option>
                  <option value="Educational">Educational</option>
                  <option value="Sports">Sports</option>
                  <option value="Entertainment">Entertainment</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
              >
                <Search size={16} />
                Search
              </button>
            </form>
          </div>

          {/* Nearby Search */}
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Find Nearby Organizers</h2>
            <form onSubmit={handleNearbySearch} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Latitude</label>
                  <input
                    type="number"
                    step="any"
                    value={locationParams.lat}
                    onChange={(e) => setLocationParams({...locationParams, lat: e.target.value})}
                    placeholder="26.8467"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Longitude</label>
                  <input
                    type="number"
                    step="any"
                    value={locationParams.lng}
                    onChange={(e) => setLocationParams({...locationParams, lng: e.target.value})}
                    placeholder="80.9462"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Radius (km)</label>
                <input
                  type="number"
                  value={locationParams.radius}
                  onChange={(e) => setLocationParams({...locationParams, radius: parseInt(e.target.value)})}
                  min="1"
                  max="100"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <button
                type="button"
                onClick={getCurrentLocation}
                className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 flex items-center justify-center gap-2"
              >
                <MapPin size={16} />
                Use My Location
              </button>

              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
              >
                <Search size={16} />
                Find Nearby
              </button>
            </form>
          </div>
        </div>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-6 border-b">
              <h2 className="text-lg font-semibold text-gray-900">Search Results ({searchResults.length})</h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {searchResults.map((organizer) => (
                  <div key={organizer._id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                        {organizer.profileImage ? (
                          <img src={organizer.profileImage} alt="" className="w-10 h-10 rounded-full object-cover" />
                        ) : (
                          <User size={20} className="text-gray-500" />
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">{organizer.organizerName}</h3>
                        <p className="text-sm text-gray-500">{organizer.organizationType}</p>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{organizer.location}</p>
                    <div className="flex justify-between items-center">
                      <span className={`px-2 py-1 rounded text-xs ${
                        organizer.isVerified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {organizer.isVerified ? 'Verified' : 'Pending'}
                      </span>
                      <button
                        onClick={() => {
                          setSelectedOrganizer(organizer);
                          setCurrentPage('details');
                        }}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Nearby Results */}
        {nearbyOrganizers.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-6 border-b">
              <h2 className="text-lg font-semibold text-gray-900">Nearby Organizers ({nearbyOrganizers.length})</h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {nearbyOrganizers.map((organizer) => (
                  <div key={organizer._id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                        {organizer.profileImage ? (
                          <img src={organizer.profileImage} alt="" className="w-10 h-10 rounded-full object-cover" />
                        ) : (
                          <User size={20} className="text-gray-500" />
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">{organizer.organizerName}</h3>
                        <p className="text-sm text-gray-500">{organizer.organizationType}</p>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{organizer.location}</p>
                    <p className="text-sm text-gray-500 mb-2">Distance: {organizer.distance}km</p>
                    <div className="flex justify-between items-center">
                      <span className={`px-2 py-1 rounded text-xs ${
                        organizer.isVerified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {organizer.isVerified ? 'Verified' : 'Pending'}
                      </span>
                      <button
                        onClick={() => {
                          setSelectedOrganizer(organizer);
                          setCurrentPage('details');
                        }}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Account Linking Component
  const AccountLinking = () => {
    const [linkingData, setLinkingData] = useState({ organizerId: '', userId: '' });
    const [unlinkingId, setUnlinkingId] = useState('');

    const handleLinkAccount = async (e) => {
      e.preventDefault();
      try {
        await organizerService.linkUserAccount(linkingData.organizerId, linkingData.userId);
        alert('Account linked successfully!');
        setLinkingData({ organizerId: '', userId: '' });
      } catch (error) {
        setError('Failed to link account');
      }
    };

    const handleUnlinkAccount = async (e) => {
      e.preventDefault();
      try {
        await organizerService.unlinkUserAccount(unlinkingId);
        alert('Account unlinked successfully!');
        setUnlinkingId('');
      } catch (error) {
        setError('Failed to unlink account');
      }
    };

    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-900">Account Linking</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Link Account */}
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <LinkIcon size={20} />
              Link User Account
            </h2>
            <form onSubmit={handleLinkAccount} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Organizer ID</label>
                <input
                  type="text"
                  value={linkingData.organizerId}
                  onChange={(e) => setLinkingData({...linkingData, organizerId: e.target.value})}
                  required
                  placeholder="Enter organizer ID"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">User ID</label>
                <input
                  type="text"
                  value={linkingData.userId}
                  onChange={(e) => setLinkingData({...linkingData, userId: e.target.value})}
                  required
                  placeholder="Enter user ID to link"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
              >
                <LinkIcon size={16} />
                Link Account
              </button>
            </form>
          </div>

          {/* Unlink Account */}
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Unlink size={20} />
              Unlink User Account
            </h2>
            <form onSubmit={handleUnlinkAccount} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Organizer ID</label>
                <input
                  type="text"
                  value={unlinkingId}
                  onChange={(e) => setUnlinkingId(e.target.value)}
                  required
                  placeholder="Enter organizer ID"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 flex items-center justify-center gap-2"
              >
                <Unlink size={16} />
                Unlink Account
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  };

  // Main Navigation
  const Navigation = () => (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <h1 className="text-xl font-bold text-gray-900">Organizer Management</h1>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <button
                onClick={() => setCurrentPage('dashboard')}
                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                  currentPage === 'dashboard' 
                    ? 'border-blue-500 text-gray-900' 
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Dashboard
              </button>
              <button
                onClick={() => setCurrentPage('list')}
                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                  currentPage === 'list' 
                    ? 'border-blue-500 text-gray-900' 
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                All Organizers
              </button>
              <button
                onClick={() => setCurrentPage('search')}
                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                  currentPage === 'search' 
                    ? 'border-blue-500 text-gray-900' 
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Search & Nearby
              </button>
              <button
                onClick={() => setCurrentPage('linking')}
                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                  currentPage === 'linking' 
                    ? 'border-blue-500 text-gray-900' 
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Account Linking
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );

  // Error Alert Component
  const ErrorAlert = () => error && (
    <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
      <div className="flex">
        <AlertCircle className="h-5 w-5 text-red-400" />
        <div className="ml-3">
          <p className="text-sm text-red-800">{error}</p>
        </div>
        <div className="ml-auto">
          <button
            onClick={() => setError(null)}
            className="text-red-400 hover:text-red-600"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  );

  // Main App Component
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <ErrorAlert />
        
        {currentPage === 'search' && <SearchAndNearby />}
        {currentPage === 'linking' && <AccountLinking />}
        {['dashboard', 'list', 'create', 'edit', 'details'].includes(currentPage) && renderCurrentPage()}
      </main>
    </div>
  );
};

export default OrganizerManagementSystem;

