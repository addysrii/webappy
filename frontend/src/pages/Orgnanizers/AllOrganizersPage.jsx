import React, { useState, useEffect } from 'react';
import { Search, MapPin, Users, Calendar, Star, Filter, Grid, List, ChevronLeft, ChevronRight } from 'lucide-react';
import organizerService from '../../services/organizerService';

const AllOrganizersPage = () => {
  const [organizers, setOrganizers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    location: '',
    organizerType: '',
    verified: ''
  });
  const [showFilters, setShowFilters] = useState(false);

  const itemsPerPage = 12;

  useEffect(() => {
    fetchOrganizers();
  }, [currentPage, searchQuery, filters]);

 const fetchOrganizers = async () => {
  try {
    setLoading(true);
    const params = {
      page: currentPage,
      limit: itemsPerPage,
      search: searchQuery,
      ...filters
    };

    // Remove empty filters
    Object.keys(params).forEach(key => {
      if (params[key] === '') {
        delete params[key];
      }
    });

    // Get raw API response
    const response = await organizerService.getAllOrganizers(params);
    
    // Transform the data to match frontend expectations
    const transformedOrganizers = response.map(org => ({
      _id: org._id,
      organizerName: org.organizerName,
      email: org.email,
      profileImage: org.profileImage || 'https://via.placeholder.com/100',
      location: `${org.address?.city}, ${org.address?.state}`,
      organizerType: org.organizationType,
      rating: org.rating || 0, // Default if not available
      eventsHosted: org.eventsHosted?.length || 0,
      isVerified: org.approved, // Using 'approved' field as verification status
      description: org.about || 'No description provided',
      contactPerson: org.contactPerson
    }));

    setOrganizers(transformedOrganizers);
    setTotalPages(Math.ceil(response.length / itemsPerPage) || 1);
    
  } catch (error) {
    console.error('Error fetching organizers:', error);
  } finally {
    setLoading(false);
  }
};
  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const handleFilterChange = (filterKey, value) => {
    setFilters(prev => ({
      ...prev,
      [filterKey]: value
    }));
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters({
      location: '',
      organizerType: '',
      verified: ''
    });
    setSearchQuery('');
    setCurrentPage(1);
  };
const OrganizerCard = ({ organizer }) => (
  <div className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden border border-gray-100">
    <div className="relative p-6">
      {/* Verification Badge - using 'approved' field */}
      {organizer.approved && (
        <div className="absolute top-4 right-4">
          <div className="bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded-full">
            Verified
          </div>
        </div>
      )}

      {/* Banned Notice */}
      {organizer.banned && (
        <div className="absolute top-4 left-4 bg-red-100 text-red-800 text-xs font-medium px-2 py-1 rounded-full">
          Banned
        </div>
      )}

      {/* Organizer Header */}
      <div className="flex items-center space-x-4 mb-4">
        <img
          src={organizer.profileImage || 'https://via.placeholder.com/100?text=' + encodeURIComponent(organizer.organizerName.charAt(0))}
          alt={organizer.organizerName}
          className="w-16 h-16 rounded-full object-cover border border-gray-200"
        />
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-gray-900 truncate">
            {organizer.organizerName}
          </h3>
          <p className="text-sm text-gray-500 flex items-center mt-1">
            <MapPin className="w-4 h-4 mr-1" />
            {organizer.address?.city ? `${organizer.address.city}, ${organizer.address.state}` : 'Location not specified'}
          </p>
        </div>
      </div>

      {/* Organizer Details */}
      <div className="space-y-3 mb-4">
        <div className="flex items-center text-sm text-gray-600">
          <Users className="w-4 h-4 mr-2 flex-shrink-0" />
          <span className="truncate">Contact: {organizer.contactPerson?.name || 'Not specified'}</span>
        </div>
        
        <div className="flex items-center text-sm text-gray-600">
          <Calendar className="w-4 h-4 mr-2 flex-shrink-0" />
          <span>Events hosted: {organizer.eventsHosted?.length || 0}</span>
        </div>

        <div className="flex items-center text-sm text-gray-600">
          <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          <span>Type: {organizer.organizationType || 'Not specified'}</span>
        </div>
      </div>

      {/* Social Links */}
      {organizer.socialLinks && (
        <div className="flex space-x-3 mb-4">
          {organizer.socialLinks.website && (
            <a href={organizer.socialLinks.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm-2 17.5a.5.5 0 01-.5.5h-1a.5.5 0 01-.5-.5v-11a.5.5 0 01.5-.5h1a.5.5 0 01.5.5v11zm5.5-.5h-1a.5.5 0 01-.5-.5v-11a.5.5 0 01.5-.5h1a.5.5 0 01.5.5v11a.5.5 0 01-.5.5z" />
              </svg>
            </a>
          )}
          {organizer.socialLinks.facebook && (
            <a href={organizer.socialLinks.facebook} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
              </svg>
            </a>
          )}
          {organizer.socialLinks.instagram && (
            <a href={organizer.socialLinks.instagram} target="_blank" rel="noopener noreferrer" className="text-pink-600 hover:text-pink-800">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
              </svg>
            </a>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex space-x-2">
        <button className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center justify-center">
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          View
        </button>
        <button className="flex-1 bg-gray-100 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors duration-200 flex items-center justify-center">
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          Message
        </button>
      </div>
    </div>
  </div>
);

  const OrganizerListItem = ({ organizer }) => (
    <div className="bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100">
      <div className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 flex-1">
            <img
              src={organizer.profileImage || 'https://via.placeholder.com/100'}
              alt={organizer.organizerName}
              className="w-12 h-12 rounded-full object-cover"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2">
                <h3 className="text-lg font-semibold text-gray-900 truncate">
                  {organizer.organizerName}
                </h3>
                {organizer.isVerified && (
                  <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded-full">
                    Verified
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-500 flex items-center mt-1">
                <MapPin className="w-4 h-4 mr-1" />
                {organizer.location || 'Location not specified'}
              </p>
              <p className="text-sm text-gray-600 mt-2 line-clamp-1">
                {organizer.description || 'No description provided'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-6 ml-4">
            <div className="text-center">
              <p className="text-sm font-medium text-gray-900">{organizer.eventsHosted || 0}</p>
              <p className="text-xs text-gray-500">Events</p>
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-gray-900 flex items-center">
                <Star className="w-4 h-4 mr-1 text-yellow-400 fill-current" />
                {organizer.rating || 'N/A'}
              </p>
              <p className="text-xs text-gray-500">Rating</p>
            </div>
            {organizer.organizerType && (
              <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                {organizer.organizerType}
              </span>
            )}
            <button className="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors duration-200">
              View Profile
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  if (loading && organizers.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="bg-white rounded-xl p-6">
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="w-16 h-16 bg-gray-200 rounded-full"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>
                  <div className="h-3 bg-gray-200 rounded mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">All Organizers</h1>
              <p className="text-gray-600 mt-2">Discover event organizers from across the country</p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg ${viewMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
              >
                <Grid className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg ${viewMode === 'list' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
              >
                <List className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search organizers by name, location, or type..."
                value={searchQuery}
                onChange={handleSearch}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center space-x-2 px-4 py-3 border border-gray-200 rounded-lg hover:bg-gray-50"
            >
              <Filter className="w-5 h-5" />
              <span>Filters</span>
            </button>
          </div>

          {/* Filter Panel */}
          {showFilters && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Organizer Type
                  </label>
                  <select
                    value={filters.organizerType}
                    onChange={(e) => handleFilterChange('organizerType', e.target.value)}
                    className="w-full p-2 border border-gray-200 rounded-lg"
                  >
                    <option value="">All Types</option>
                    <option value="Corporate">Corporate</option>
                    <option value="Wedding">Wedding</option>
                    <option value="Entertainment">Entertainment</option>
                    <option value="Technology">Technology</option>
                    <option value="Community">Community</option>
                    <option value="Sports">Sports</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Verification Status
                  </label>
                  <select
                    value={filters.verified}
                    onChange={(e) => handleFilterChange('verified', e.target.value)}
                    className="w-full p-2 border border-gray-200 rounded-lg"
                  >
                    <option value="">All</option>
                    <option value="true">Verified Only</option>
                    <option value="false">Unverified Only</option>
                  </select>
                </div>
                
                <div className="flex items-end">
                  <button
                    onClick={clearFilters}
                    className="w-full px-4 py-2 text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    Clear Filters
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {loading && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 mt-4">Loading organizers...</p>
          </div>
        )}

        {!loading && organizers.length === 0 && (
          <div className="text-center py-12">
            <Users className="w-24 h-24 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No organizers found</h3>
            <p className="text-gray-600">Try adjusting your search or filter criteria.</p>
          </div>
        )}

        {!loading && organizers.length > 0 && (
          <>
            <div className="mb-6">
              <p className="text-gray-600">
                Showing {organizers.length} organizer{organizers.length !== 1 ? 's' : ''}
              </p>
            </div>

            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {organizers.map((organizer) => (
                  <OrganizerCard key={organizer._id} organizer={organizer} />
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {organizers.map((organizer) => (
                  <OrganizerListItem key={organizer._id} organizer={organizer} />
                ))}
              </div>
            )}
          </>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center space-x-2 mt-8">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            
            {[...Array(totalPages)].map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentPage(i + 1)}
                className={`px-4 py-2 rounded-lg ${
                  currentPage === i + 1
                    ? 'bg-blue-600 text-white'
                    : 'border border-gray-200 hover:bg-gray-50'
                }`}
              >
                {i + 1}
              </button>
            ))}
            
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AllOrganizersPage;
