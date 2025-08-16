import React, { useState, useEffect } from 'react';
import { Search, MapPin, Users, Calendar, Star, Filter, Grid, List, ChevronLeft, ChevronRight } from 'lucide-react';
import organizerService from '../services/organizerService';

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
    // const params = {
    //   page: currentPage,
    //   limit: itemsPerPage,
    //   search: searchQuery,
    //   ...filters
    // };

    // console.log("API Params:", params); // Add this line
    
    const response = await organizerService.getAllOrganizers();
    console.log("API Response:", response); // Add this line
    
    setOrganizers(response.organizers || []);
    setTotalPages(response.totalPages || 1);
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
        {organizer.isVerified && (
          <div className="absolute top-4 right-4">
            <div className="bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded-full">
              Verified
            </div>
          </div>
        )}
        
        <div className="flex items-center space-x-4 mb-4">
          <img
            src={organizer.profileImage || 'https://via.placeholder.com/100'}
            alt={organizer.organizerName}
            className="w-16 h-16 rounded-full object-cover"
          />
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 truncate">
              {organizer.organizerName}
            </h3>
            <p className="text-sm text-gray-500 flex items-center mt-1">
              <MapPin className="w-4 h-4 mr-1" />
              {organizer.location || 'Location not specified'}
            </p>
          </div>
        </div>
        
        <p className="text-sm text-gray-600 mb-4 line-clamp-2">
          {organizer.description || 'No description provided'}
        </p>
        
        <div className="flex items-center justify-between text-sm text-gray-500">
          <div className="flex items-center space-x-4">
            <span className="flex items-center">
              <Calendar className="w-4 h-4 mr-1" />
              {organizer.eventsHosted || 0} events
            </span>
            <span className="flex items-center">
              <Star className="w-4 h-4 mr-1 text-yellow-400 fill-current" />
              {organizer.rating || 'N/A'}
            </span>
          </div>
          {organizer.organizerType && (
            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
              {organizer.organizerType}
            </span>
          )}
        </div>
        
        <button className="w-full mt-4 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors duration-200">
          View Profile
        </button>
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
