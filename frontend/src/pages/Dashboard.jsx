import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/common/Navbar';
import api from '../services/api';
import { 
  PlusCircle, Check, Calendar, X, User, AlertTriangle, MapPin,
  Users, ChevronRight, Search, Filter, UserPlus, Rss, 
  Home, ArrowUpDown, RefreshCw, Phone, ArrowRight, Sparkles,
  TrendingUp, Clock, Star, ChevronLeft
} from 'lucide-react';
import { useToast } from '../components/common/Toast';
import eventService from '../services/eventService';
import userService from '../services/userService';

const MergedDashboard = () => {
  // Auth and navigation
  const { user, loading, logout, updateUser } = useAuth();
  const navigate = useNavigate();
  const toastContext = useToast();
  const toast = toastContext?.toast;
  const [loadings, setLoadings] = useState(true);
 
  // State management
  const [activeSection, setActiveSection] = useState('overview');
  const [loadingData, setLoadingData] = useState(true);
  const [events, setEvents] = useState([]);
  const [categorizedEvents, setCategorizedEvents] = useState({});
  const [recommendedEvents, setRecommendedEvents] = useState([]);
  const [filter, setFilter] = useState('upcoming');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [categories, setCategories] = useState([
    "All", "Business", "Technology", "Social", "Education", "Health"
  ]);

  // Carousel state
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const carouselImages = [
    "https://res.cloudinary.com/dnnl72vrp/image/upload/v1758710258/back-view-crowd-fans-watching-live-performance-music-concert-night-copy-space_1_akcaep.jpg",
    "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=1920&h=800&fit=crop",
    "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1920&h=800&fit=crop",
    "https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?w=1920&h=800&fit=crop",
    "https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=1920&h=800&fit=crop",
    "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1920&h=800&fit=crop"
  ];
  
  // Phone verification state
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [updatingPhone, setUpdatingPhone] = useState(false);

  // Tasks state
  const [planner, setPlanner] = useState([]);
  const [newTask, setNewTask] = useState('');

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    const savedPlanner = JSON.parse(localStorage.getItem('userPlanner') || '[]');
    setPlanner(savedPlanner);
  }, []);

  // Carousel auto-rotate
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % carouselImages.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const fetchUserData = useCallback(async () => {
    try {
      setLoadings(true);
      const userInfo = await userService.getCurrentUser();
      
      if (!userInfo.phone) {
        setShowPhoneModal(true);
      }
      
      setLoadings(false);
    } catch (err) {
      console.error('Unexpected error in fetchUserData:', err);
      setLoadings(false);
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchUserData();
    }
  }, [user, fetchUserData]);

  // Fetch events and categorize them
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const apiFilters = { 
          filter: filter,
          limit: 20
        };
        
        if (categoryFilter && categoryFilter !== 'All') {
          apiFilters.category = categoryFilter.toLowerCase();
        }
        
        if (searchQuery) {
          apiFilters.search = searchQuery;
        }
        
        const response = await eventService.getEvents(apiFilters);
        
        if (response.categories && response.categories.length > 0) {
          const extractedCategories = ['All', ...response.categories.map(cat => 
            typeof cat === 'string' ? cat : (cat._id || 'Other')
          )];
          setCategories(extractedCategories);
        }
        
        const eventsData = response.events || response.data || [];
        setEvents(eventsData);

        // Categorize events
        const categorized = {};
        eventsData.forEach(event => {
          const category = typeof event.category === 'string' ? event.category : 'Other';
          if (!categorized[category]) {
            categorized[category] = [];
          }
          categorized[category].push(event);
        });
        setCategorizedEvents(categorized);

        // Set recommended events (first 6 events for now)
        setRecommendedEvents(eventsData.slice(0, 6));
      } catch (error) {
        console.error('Error fetching events:', error);
        setEvents([]);
      } finally {
        setLoadingData(false);
      }
    };
    
    fetchEvents();
  }, [filter, categoryFilter, searchQuery]);

  const handlePhoneSubmit = async (e) => {
    e.preventDefault();
    if (!phoneNumber.trim()) {
      if (toast) {
        toast({
          title: "Phone number required",
          description: "Please enter a valid phone number",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
      }
      return;
    }
    
    setUpdatingPhone(true);
    
    try {
      const updatedUser = await userService.updateProfile({ phone: phoneNumber });
      
      if (updateUser) {
        updateUser(updatedUser);
      }
      
      setShowPhoneModal(false);
      
      if (toast) {
        toast({
          title: "Phone number updated",
          description: "Your phone number has been successfully added",
          status: "success",
          duration: 5000,
          isClosable: true,
        });
      }
    } catch (error) {
      console.error('Error updating phone number:', error);
      
      let errorMessage = "Please try again later";
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      if (toast) {
        toast({
          title: "Failed to update phone number",
          description: errorMessage,
          status: "error",
          duration: 5000,
          isClosable: true,
        });
      }
    } finally {
      setUpdatingPhone(false);
    }
  };

  // Task management functions
  const addTask = () => {
    if (!newTask.trim()) return;
    
    const task = {
      id: Date.now(),
      text: newTask,
      completed: false,
      date: new Date().toISOString()
    };
    
    const updatedPlanner = [...planner, task];
    setPlanner(updatedPlanner);
    
    try {
      localStorage.setItem('userPlanner', JSON.stringify(updatedPlanner));
    } catch (error) {
      console.error('Error saving planner to localStorage:', error);
    }
    
    setNewTask('');
  };

  const toggleTaskCompletion = (taskId) => {
    const updatedPlanner = planner.map(task => 
      task.id === taskId ? { ...task, completed: !task.completed } : task
    );
    setPlanner(updatedPlanner);
    
    try {
      localStorage.setItem('userPlanner', JSON.stringify(updatedPlanner));
    } catch (error) {
      console.error('Error saving planner to localStorage:', error);
    }
  };

  const deleteTask = (taskId) => {
    const updatedPlanner = planner.filter(task => task.id !== taskId);
    setPlanner(updatedPlanner);
    
    try {
      localStorage.setItem('userPlanner', JSON.stringify(updatedPlanner));
    } catch (error) {
      console.error('Error saving planner to localStorage:', error);
    }
  };

  // Utility functions
  const formatDate = (dateString) => {
    if (!dateString) return '';
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return '';
      }
      
      const options = { weekday: 'short', month: 'short', day: 'numeric' };
      return date.toLocaleDateString(undefined, options);
    } catch (error) {
      console.error('Error formatting date:', error);
      return '';
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
  };

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % carouselImages.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + carouselImages.length) % carouselImages.length);
  };

  // Event Card Component
  const EventCard = ({ event, size = 'normal' }) => (
    <div className={`bg-gray-800/40 rounded-lg overflow-hidden shadow-md hover:shadow-xl border border-gray-600 hover:border-purple-500/50 transition-all duration-300 transform hover:scale-105 ${size === 'small' ? 'h-64' : 'h-80'}`}>
      <div className="relative">
        <img 
          src={event.coverImage?.url || "/api/placeholder/400/200"} 
          alt={event.name || "Event"}
          className={`w-full object-cover ${size === 'small' ? 'h-32' : 'h-48'}`}
        />
        {event.category && (
          <span className="absolute top-2 right-2 bg-purple-600 text-white text-xs font-bold px-2 py-1 rounded-full">
            {typeof event.category === 'string' ? event.category : 'Other'}
          </span>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
      </div>
      
      <div className="p-4">
        <h3 className={`font-bold text-white mb-2 ${size === 'small' ? 'text-sm' : 'text-lg'}`}>
          {(event.name || "Untitled Event").length > 30 
            ? `${event.name.substring(0, 30)}...` 
            : event.name || "Untitled Event"}
        </h3>
        
        <div className="flex items-center text-gray-400 mb-2">
          <Calendar className="w-3 h-3 mr-2" />
          <span className="text-xs">{formatDate(event.startDateTime)}</span>
        </div>
        
        <div className="flex items-center text-gray-400 mb-3">
          <MapPin className="w-3 h-3 mr-2" />
          <span className="text-xs">
            {event.virtual 
              ? "Virtual Event" 
              : ((event.location?.name || "Location TBA").length > 25
                ? `${(event.location?.name || "Location TBA").substring(0, 25)}...`
                : (event.location?.name || "Location TBA"))}
          </span>
        </div>
        
        <div className="flex justify-end">
          <Link to={`/events/${event._id || event.id}`}>
            <button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-300">
              View Details
            </button>
          </Link>
        </div>
      </div>
    </div>
  );

  // Loading state for main dashboard
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-black">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen text-white overflow-x-hidden bg-black">
      {/* Phone Number Modal */}
      {showPhoneModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center mb-4">
              <div className="bg-purple-100 p-3 rounded-full mr-3">
                <Phone className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-white">Phone Number Required</h3>
            </div>
            
            <p className="text-gray-300 mb-6">
              Please add your phone number to continue using our services. This helps us keep your account secure.
            </p>
            
            <form onSubmit={handlePhoneSubmit}>
              <div className="mb-4">
                <label htmlFor="phone" className="block text-sm font-medium text-gray-300 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  id="phone"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="Enter your phone number"
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-white"
                  required
                />
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowPhoneModal(false)}
                  className="px-4 py-2 text-gray-400 hover:text-white"
                  disabled={updatingPhone}
                >
                  Maybe Later
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
                  disabled={updatingPhone}
                >
                  {updatingPhone ? 'Updating...' : 'Save Phone Number'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Sidebar - hidden on mobile, visible on md and up */}
      <div className="hidden md:block">
        <Sidebar user={user} onLogout={logout} />
      </div>
      
      {/* Mobile Navbar - visible only on small screens */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-700 shadow-lg z-10">
        <div className="flex justify-around items-center h-16 px-2">
          <button 
            onClick={() => setActiveSection('overview')}
            className={`flex flex-col items-center justify-center p-2 ${activeSection === 'overview' ? 'text-purple-400' : 'text-gray-400'}`}
          >
            <Home className="h-6 w-6" />
            <span className="text-xs">Home</span>
          </button>
          <button 
            onClick={() => setActiveSection('events')}
            className={`flex flex-col items-center justify-center p-2 ${activeSection === 'events' ? 'text-purple-400' : 'text-gray-400'}`}
          >
            <Calendar className="h-6 w-6" />
            <span className="text-xs">Events</span>
          </button>
          <Link
            to="/profile"
            className="flex flex-col items-center justify-center p-2 text-gray-400"
          >
            <User className="h-6 w-6" />
            <span className="text-xs">Profile</span>
          </Link>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="flex-1 overflow-auto pb-16 md:pb-0 ">
        <div className="md:pl-0 pl-0">
          {/* Hero Section with Carousel */}
          <div className="relative h-96 flex items-center justify-center">
            <div 
              className="absolute inset-0 bg-cover bg-center transition-all duration-1000"
              style={{ 
                backgroundImage: `url("${carouselImages[currentImageIndex]}")`,
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/70" />
            
            {/* Carousel Controls */}
            <button
              onClick={prevImage}
              className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/75 text-white p-2 rounded-full transition-all duration-300 z-10"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <button
              onClick={nextImage}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/75 text-white p-2 rounded-full transition-all duration-300 z-10"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
            
            {/* Carousel Indicators */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2 z-10">
              {carouselImages.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentImageIndex(index)}
                  className={`w-3 h-3 rounded-full transition-all duration-300 ${
                    index === currentImageIndex ? 'bg-white' : 'bg-white/50'
                  }`}
                />
              ))}
            </div>
            
            {/* Hero Content */}
            <div className="relative z-10 text-center px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
              <div className="transition-all duration-1000 opacity-100 translate-y-0">
                <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold mb-4 leading-tight">
                  Welcome back,
                  <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400 bg-clip-text text-transparent block">
                    {user?.firstName || 'User'}!
                  </span>
                </h1>
                
                <p className="text-lg sm:text-xl md:text-xl text-white/90 mb-6 max-w-3xl mx-auto leading-relaxed">
                  Ready to connect, create unforgettable moments, and build meaningful professional relationships.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                  <Link to="/events/create" className="group bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-3 px-6 rounded-full transition-all duration-300 transform hover:scale-105 shadow-2xl">
                    Host an Event
                    <ArrowRight className="inline-block ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                  
                  <Link to="/events" className="group flex items-center justify-center bg-white/10 backdrop-blur-sm border border-white/20 text-white font-semibold py-3 px-6 rounded-full hover:bg-white/20 transition-all duration-300">
                    <Calendar className="mr-2 h-4 w-4 group-hover:scale-110 transition-transform" />
                    Browse Events
                  </Link>
                </div>
              </div>
            </div>
          </div>

          <main className="max-w-7xl mx-auto p-4 md:p-6">
            {/* Content Tabs Navigation */}
            <div className="mb-6 bg-transparent backdrop-blur-sm rounded-xl shadow-xl overflow-hidden border border-gray-700">
              <div className="flex overflow-x-auto scrollbar-hide">
                <button
                  onClick={() => setActiveSection('overview')}
                  className={`flex-none text-center py-4 px-6 font-medium text-sm focus:outline-none transition-all duration-300 ${
                    activeSection === 'overview'
                      ? 'text-purple-400 border-b-2 border-purple-400 bg-purple-500/10'
                      : 'text-gray-300 hover:text-purple-400 hover:bg-purple-500/5'
                  }`}
                >
                  <Sparkles className="h-4 w-4 mx-auto mb-1" />
                  Overview
                </button>
                <button
                  onClick={() => setActiveSection('events')}
                  className={`flex-none text-center py-4 px-6 font-medium text-sm focus:outline-none transition-all duration-300 ${
                    activeSection === 'events'
                      ? 'text-purple-400 border-b-2 border-purple-400 bg-purple-500/10'
                      : 'text-gray-300 hover:text-purple-400 hover:bg-purple-500/5'
                  }`}
                >
                  <Calendar className="h-4 w-4 mx-auto mb-1" />
                  Events
                </button>
              </div>
            </div>

            {/* Dashboard Content - Based on active section */}
            {activeSection === 'overview' && (
              <div className="space-y-8">
                {/* Recommended Events Section */}
                <div className="bg-gray-900/80 backdrop-blur-sm rounded-xl shadow-xl overflow-hidden border border-gray-700">
                  <div className="border-b border-gray-700 px-6 py-4 flex justify-between items-center">
                    <h3 className="font-semibold text-white flex items-center">
                      <Star className="h-5 w-5 mr-2 text-purple-400" />
                      Recommended for You
                    </h3>
                    <Link to="/events" className="text-purple-400 hover:text-purple-300 text-sm">View All</Link>
                  </div>
                  <div className="p-6">
                    {loadingData ? (
                      <div className="text-center py-6">
                        <div className="w-8 h-8 border-t-2 border-purple-500 border-solid rounded-full animate-spin mx-auto mb-2"></div>
                        <p className="text-gray-400 text-sm">Loading recommendations...</p>
                      </div>
                    ) : recommendedEvents.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {recommendedEvents.map(event => (
                          <EventCard key={event._id || event.id} event={event} size="small" />
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-6">
                        <div className="w-16 h-16 bg-purple-900/20 rounded-full flex items-center justify-center mx-auto mb-3">
                          <Star className="w-8 h-8 text-purple-400" />
                        </div>
                        <p className="text-gray-400 text-sm mb-2">No recommendations available yet.</p>
                        <Link to="/events" className="text-purple-400 hover:text-purple-300 text-sm font-medium">
                          Browse All Events →
                        </Link>
                      </div>
                    )}
                  </div>
                </div>

                {/* Events by Categories */}
                {Object.keys(categorizedEvents).length > 0 && (
                  <div className="space-y-6">
                    {Object.entries(categorizedEvents).slice(0, 3).map(([category, categoryEvents]) => (
                      <div key={category} className="bg-gray-900/80 backdrop-blur-sm rounded-xl shadow-xl overflow-hidden border border-gray-700">
                        <div className="border-b border-gray-700 px-6 py-4 flex justify-between items-center">
                          <h3 className="font-semibold text-white flex items-center">
                            <TrendingUp className="h-5 w-5 mr-2 text-purple-400" />
                            {category} Events
                          </h3>
                          <Link to={`/events?category=${category}`} className="text-purple-400 hover:text-purple-300 text-sm">
                            View All {category}
                          </Link>
                        </div>
                        <div className="p-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {categoryEvents.slice(0, 3).map(event => (
                              <EventCard key={event._id || event.id} event={event} size="small" />
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Task Planner */}
                <div className="bg-gray-900/80 backdrop-blur-sm rounded-xl shadow-xl overflow-hidden border border-gray-700">
                  <div className="border-b border-gray-700 px-6 py-4 flex justify-between items-center">
                    <h3 className="font-semibold text-white flex items-center">
                      <Clock className="h-5 w-5 mr-2 text-purple-400" />
                      My Planner
                    </h3>
                  </div>
                  <div className="p-6">
                    {/* Add new task */}
                    <div className="flex mb-4">
                      <input
                        type="text"
                        value={newTask}
                        onChange={(e) => setNewTask(e.target.value)}
                        placeholder="Add a new task..."
                        className="flex-1 bg-gray-800 border border-gray-600 rounded-l-md py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 text-white"
                        onKeyPress={(e) => e.key === 'Enter' && addTask()}
                      />
                      <button
                        onClick={addTask}
                        className="bg-purple-600 text-white rounded-r-md px-4 py-2 text-sm hover:bg-purple-700 transition"
                      >
                        <PlusCircle className="h-4 w-4" />
                      </button>
                    </div>

                    {/* Task list */}
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {planner.length === 0 ? (
                        <div className="text-center py-6">
                          <p className="text-gray-400 text-sm">No tasks yet. Add your first task above.</p>
                        </div>
                      ) : (
                        planner.map(task => (
                          <div 
                            key={task.id} 
                            className={`flex items-center justify-between p-3 border rounded-md transition-all duration-200 ${
                              task.completed 
                                ? 'bg-purple-900/20 border-purple-700/50' 
                                : 'bg-gray-800/50 border-gray-600 hover:bg-gray-800/80'
                            }`}
                          >
                            <div className="flex items-center flex-1 min-w-0">
                              <button
                                onClick={() => toggleTaskCompletion(task.id)}
                                className={`flex-shrink-0 h-5 w-5 rounded-full border ${
                                  task.completed ? 'bg-purple-500 border-purple-500' : 'border-gray-500 hover:border-purple-400'
                                } mr-3 flex items-center justify-center transition-all duration-200`}
                              >
                                {task.completed && <Check className="h-3 w-3 text-white" />}
                              </button>
                              <div className="flex-1 min-w-0">
                                <p className={`text-sm truncate ${task.completed ? 'line-through text-gray-500' : 'text-gray-200'}`}>
                                  {task.text}
                                </p>
                                <p className="text-xs text-gray-500 truncate">
                                  Added {formatDate(task.date)}
                                </p>
                              </div>
                            </div>
                            <button
                              onClick={() => deleteTask(task.id)}
                              className="ml-2 text-gray-500 hover:text-red-400 flex-shrink-0 transition-colors duration-200"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'events' && (
              <div className="bg-gray-900/80 backdrop-blur-sm rounded-xl shadow-xl overflow-hidden border border-gray-700">
                <div className="p-6">
                  <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between">
                    <div>
                      <h2 className="text-xl font-bold text-white mb-2 flex items-center">
                        <TrendingUp className="h-6 w-6 mr-2 text-purple-400" />
                        Discover Events
                      </h2>
                      <p className="text-sm text-gray-400">Find events that match your interests and network</p>
                    </div>
                    <Link to="/events/create" className="mt-3 md:mt-0">
                      <button className="w-full md:w-auto bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-medium rounded-lg px-4 py-2 flex items-center justify-center transition-all duration-300 transform hover:scale-105">
                        <PlusCircle className="w-4 h-4 mr-2" />
                        Host an Event
                      </button>
                    </Link>
                  </div>
                  
                  <div className="mb-6">
                    {/* Search Bar */}
                    <form onSubmit={handleSearch} className="flex items-center mb-4">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Search events..."
                          className="pl-10 w-full p-2 bg-gray-800 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-white"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                        />
                      </div>
                      <button 
                        type="submit"
                        className="ml-2 px-4 py-2 bg-purple-600 text-white font-medium rounded-md hover:bg-purple-700 transition-colors"
                      >
                        Search
                      </button>
                    </form>
                    
                    {/* Filters */}
                    <div className="flex flex-wrap gap-3 mb-4">
                      <button 
                        className={`px-3 py-1.5 rounded-full text-sm transition-all duration-200 ${filter === 'upcoming' ? 'bg-purple-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
                        onClick={() => setFilter('upcoming')}
                      >
                        Upcoming
                      </button>
                      <button 
                        className={`px-3 py-1.5 rounded-full text-sm transition-all duration-200 ${filter === 'all' ? 'bg-purple-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
                        onClick={() => setFilter('all')}
                      >
                        All Events
                      </button>
                      <button 
                        className={`px-3 py-1.5 rounded-full text-sm transition-all duration-200 ${filter === 'past' ? 'bg-purple-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
                        onClick={() => setFilter('past')}
                      >
                        Past
                      </button>
                      
                      <div className="relative ml-auto">
                        <select
                          className="appearance-none bg-gray-700 border border-gray-600 rounded-md pl-3 pr-10 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 text-white"
                          value={categoryFilter}
                          onChange={(e) => setCategoryFilter(e.target.value)}
                        >
                          <option value="">Category</option>
                          {categories.map((category, index) => (
                            <option key={`category-${index}`} value={category}>{category}</option>
                          ))}
                        </select>
                        <Filter className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                      </div>
                    </div>
                  </div>
                  
                  {/* All Events Display */}
                  {loadingData ? (
                    <div className="text-center py-10">
                      <div className="w-12 h-12 border-t-4 border-purple-500 border-solid rounded-full animate-spin mx-auto"></div>
                      <p className="mt-4 text-gray-400">Loading events...</p>
                    </div>
                  ) : (
                    <div className="space-y-8">
                      {/* Recommended Events in Events Tab */}
                      {recommendedEvents.length > 0 && (
                        <div>
                          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                            <Star className="h-5 w-5 mr-2 text-purple-400" />
                            Recommended for You
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {recommendedEvents.map((event) => (
                              <EventCard key={event._id || event.id} event={event} />
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Events by Category */}
                      {Object.keys(categorizedEvents).length > 0 ? (
                        Object.entries(categorizedEvents).map(([category, categoryEvents]) => (
                          <div key={category}>
                            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                              <TrendingUp className="h-5 w-5 mr-2 text-purple-400" />
                              {category} Events ({categoryEvents.length})
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                              {categoryEvents.slice(0, 6).map((event) => (
                                <EventCard key={event._id || event.id} event={event} />
                              ))}
                            </div>
                            {categoryEvents.length > 6 && (
                              <div className="mt-4 text-center">
                                <Link to={`/events?category=${category}`} className="text-purple-400 hover:text-purple-300 font-medium">
                                  View All {category} Events →
                                </Link>
                              </div>
                            )}
                          </div>
                        ))
                      ) : events.length === 0 ? (
                        <div className="text-center py-10">
                          <div className="w-16 h-16 bg-purple-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Calendar className="w-8 h-8 text-purple-400" />
                          </div>
                          <p className="text-gray-400 mb-4">No events found matching your criteria.</p>
                          {(searchQuery || categoryFilter !== 'All') && (
                            <button 
                              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-md text-white transition-colors"
                              onClick={() => {
                                setSearchQuery('');
                                setCategoryFilter('All');
                              }}
                            >
                              Clear Filters
                            </button>
                          )}
                        </div>
                      ) : (
                        <div>
                          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                            <Calendar className="h-5 w-5 mr-2 text-purple-400" />
                            All Events ({events.length})
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {events.map((event) => (
                              <EventCard key={event._id || event.id} event={event} />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  
                  <div className="mt-8 text-center">
                    <Link to="/events" className="inline-block text-purple-400 font-medium hover:text-purple-300 transition-colors">
                      View All Events →
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default MergedDashboard;