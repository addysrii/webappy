import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/common/Navbar';
import api from '../services/api';
import { 
  PlusCircle, Check, Calendar, X, User, AlertTriangle, MapPin,
  Users, ChevronRight, Search, Filter, UserPlus, Rss, 
  Home, ArrowUpDown, RefreshCw, Phone, ArrowRight, Sparkles,
  TrendingUp, Clock, Star
} from 'lucide-react';
import { useToast } from '../components/common/Toast';
import defaultProfilePic from '../assets/default-avatar.png';
import eventService from '../services/eventService';
import networkService from '../services/networkService';
import nearbyUsersService from '../services/nearbyUsersService';
import userService from '../services/userService';

import LocationPermissionIcon from '../components/LocationPermissionIcon';
import Footer from '../components/footer/Footer';

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
  const [filter, setFilter] = useState('upcoming');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [categories, setCategories] = useState([
    "All", "Business", "Technology", "Social", "Education", "Health"
  ]);


  
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

  const fetchUserData = useCallback(async () => {
    try {
      setLoadings(true);
      setError(null); 
      const userInfo = await userService.getCurrentUser();
      
      if (!userInfo.phone) {
        setShowPhoneModal(true);
      }
      
      setLoadings(false);
    } catch (err) {
      console.error('Unexpected error in fetchUserData:', err);
      setError('An unexpected error occurred');
      setLoadings(false);
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchUserData();
    }
  }, [user, fetchUserData]);

  

  // Fetch events
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const apiFilters = { 
          filter: filter,
          limit: 6
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
      } catch (error) {
        console.error('Error fetching events:', error);
        setEvents([]);
      } finally {
        setLoadingData(false);
      }
    };
    
    fetchEvents();
  }, [filter, categoryFilter, searchQuery]);

  // Get user's location and fetch nearby users
  useEffect(() => {
    const getUserLocation = () => {
      if (navigator.geolocation) {
        const options = {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 5000
        };
        
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            
            setUserLocation({ 
              latitude, 
              longitude,
              timestamp: new Date().toISOString()
            });
            
            fetchNearbyUsers(latitude, longitude, 10);
            setLocationEnabled(true);
          },
          (error) => {
            console.error('Error getting location:', error);
            let errorMessage = "Location access denied. Please enable location services.";
            
            setLocationError(errorMessage);
            setLocationEnabled(false);
          },
          options
        );
      } else {
        setLocationError("Geolocation is not supported by your browser.");
        setLocationEnabled(false);
      }
    };

    if (user) {
      getUserLocation();
    }
  }, [user]);



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

  // Connection management functions


 

  // Handle connecting with a nearby user


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
          {/* Hero Section */}
          <div className="relative h-screen flex items-center justify-center">
            <div 
              className="absolute inset-0 bg-cover bg-center"
              style={{ 
                backgroundImage: `url("https://res.cloudinary.com/dnnl72vrp/image/upload/v1758710258/back-view-crowd-fans-watching-live-performance-music-concert-night-copy-space_1_akcaep.jpg")`,
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/70" />
            
            {/* Hero Content */}
            <div className="relative z-10 text-center px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
              <div className="transition-all duration-1000 opacity-100 translate-y-0">
                <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold mb-6 leading-tight">
                  Welcome back,
                  <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400 bg-clip-text text-transparent block">
                    {user?.firstName || 'User'}!
                  </span>
                </h1>
                
                <p className="text-lg sm:text-xl md:text-2xl text-white/90 mb-8 max-w-4xl mx-auto leading-relaxed">
                  Ready to connect, create unforgettable moments, and build meaningful professional relationships through amazing events.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
                  <Link to="/events/create" className="group bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-4 px-8 rounded-full transition-all duration-300 transform hover:scale-105 shadow-2xl">
                    Host an Event
                    <ArrowRight className="inline-block ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                  
                  <Link to="/events" className="group flex items-center justify-center bg-white/10 backdrop-blur-sm border border-white/20 text-white font-semibold py-4 px-8 rounded-full hover:bg-white/20 transition-all duration-300">
                    <Calendar className="mr-2 h-5 w-5 group-hover:scale-110 transition-transform" />
                    Browse Events
                  </Link>
                </div>
                
                {/* Quick Stats */}
             
              </div>
            </div>
          </div>

          <main className="max-w-7xl mx-auto p-4 md:p-6">
            {/* Content Tabs Navigation */}
            <div className="mb-6 bg-gray-900/80 backdrop-blur-sm rounded-xl shadow-xl overflow-hidden border border-gray-700">
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
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - Task Planner */}
                <div className="lg:col-span-1">
                  <div className="bg-gray-900/80 backdrop-blur-sm rounded-xl shadow-xl overflow-hidden h-full border border-gray-700">
                    <div className="border-b border-gray-700 px-4 md:px-6 py-4 flex justify-between items-center">
                      <h3 className="font-semibold text-white flex items-center">
                        <Clock className="h-5 w-5 mr-2 text-purple-400" />
                        My Planner
                      </h3>
                      <div className="text-purple-400 hover:text-purple-300 text-sm cursor-pointer">
                        <Calendar className="h-4 w-4 md:h-5 md:w-5" />
                      </div>
                    </div>
                    <div className="p-4 md:p-6">
                      {/* Add new task */}
                      <div className="flex mb-4">
                        <input
                          type="text"
                          value={newTask}
                          onChange={(e) => setNewTask(e.target.value)}
                          placeholder="Add a new task..."
                          className="flex-1 bg-gray-800 border border-gray-600 rounded-l-md py-2 px-3 text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 text-white"
                          onKeyPress={(e) => e.key === 'Enter' && addTask()}
                        />
                        <button
                          onClick={addTask}
                          className="bg-purple-600 text-white rounded-r-md px-3 md:px-4 py-2 text-xs md:text-sm hover:bg-purple-700 transition"
                        >
                          <PlusCircle className="h-4 w-4 md:h-5 md:w-5" />
                        </button>
                      </div>

                      {/* Task list */}
                      <div className="space-y-2 max-h-60 md:max-h-72 overflow-y-auto">
                        {planner.length === 0 ? (
                          <div className="text-center py-4 md:py-6">
                            <p className="text-gray-400 text-xs md:text-sm">No tasks yet. Add your first task above.</p>
                          </div>
                        ) : (
                          planner.map(task => (
                            <div 
                              key={task.id} 
                              className={`flex items-center justify-between p-2 md:p-3 border rounded-md transition-all duration-200 ${
                                task.completed 
                                  ? 'bg-purple-900/20 border-purple-700/50' 
                                  : 'bg-gray-800/50 border-gray-600 hover:bg-gray-800/80'
                              }`}
                            >
                              <div className="flex items-center flex-1 min-w-0">
                                <button
                                  onClick={() => toggleTaskCompletion(task.id)}
                                  className={`flex-shrink-0 h-4 w-4 md:h-5 md:w-5 rounded-full border ${
                                    task.completed ? 'bg-purple-500 border-purple-500' : 'border-gray-500 hover:border-purple-400'
                                  } mr-2 md:mr-3 flex items-center justify-center transition-all duration-200`}
                                >
                                  {task.completed && <Check className="h-2 w-2 md:h-3 md:w-3 text-white" />}
                                </button>
                                <div className="flex-1 min-w-0">
                                  <p className={`text-xs md:text-sm truncate ${task.completed ? 'line-through text-gray-500' : 'text-gray-200'}`}>
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
                                <X className="h-3 w-3 md:h-4 md:w-4" />
                              </button>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Center and Right Columns - Events Preview and Stats */}
                <div className="lg:col-span-2">
                  <div className="grid grid-cols-1 gap-6">
                    {/* Upcoming Events Preview */}
                    <div className="bg-gray-900/80 backdrop-blur-sm rounded-xl shadow-xl overflow-hidden border border-gray-700">
                      <div className="border-b border-gray-700 px-4 md:px-6 py-4 flex justify-between items-center">
                        <h3 className="font-semibold text-white flex items-center">
                          <Star className="h-5 w-5 mr-2 text-purple-400" />
                          Upcoming Events
                        </h3>
                        <div className="flex items-center space-x-2">
                          <Link to="/events/create" className="text-white bg-purple-600 hover:bg-purple-700 rounded-md px-2 py-1 text-xs flex items-center transition-colors">
                            <PlusCircle className="h-3 w-3 mr-1" />
                            Host Event
                          </Link>
                          <Link to="/events" className="text-purple-400 hover:text-purple-300 text-xs md:text-sm">View All</Link>
                        </div>
                      </div>
                      <div className="p-4 md:p-6">
                        {loadingData ? (
                          <div className="text-center py-6">
                            <div className="w-8 h-8 border-t-2 border-purple-500 border-solid rounded-full animate-spin mx-auto mb-2"></div>
                            <p className="text-gray-400 text-sm">Loading events...</p>
                          </div>
                        ) : events.length > 0 ? (
                          <div className="space-y-4">
                            {events.slice(0, 2).map(event => (
                              <div key={event._id || event.id} className="flex bg-gray-800/40 border border-gray-600 rounded-lg overflow-hidden shadow-sm hover:shadow-lg hover:border-purple-500/50 transition-all duration-300">
                                <div className="w-24 md:w-32 bg-purple-900/20 flex-shrink-0">
                                  <img 
                                    src={event.coverImage?.url || "/api/placeholder/400/200"} 
                                    alt={event.name || "Event"}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                                <div className="p-3 md:p-4 flex-1">
                                  <h4 className="font-semibold text-sm md:text-base text-white mb-1">{event.name || "Untitled Event"}</h4>
                                  <div className="flex items-center text-gray-400 mb-1">
                                    <Calendar className="w-3 h-3 md:w-4 md:h-4 mr-1" />
                                    <span className="text-xs md:text-sm">{formatDate(event.startDateTime)}</span>
                                  </div>
                                  <div className="flex items-center text-gray-400 mb-2">
                                    <MapPin className="w-3 h-3 md:w-4 md:h-4 mr-1" />
                                    <span className="text-xs md:text-sm">{event.virtual ? "Virtual Event" : (event.location?.name || "Location TBA")}</span>
                                  </div>
                                  <Link to={`/events/${event._id || event.id}`} className="text-purple-400 hover:text-purple-300 text-xs md:text-sm font-medium transition-colors">
                                    View Details →
                                  </Link>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-6">
                            <div className="w-16 h-16 bg-purple-900/20 rounded-full flex items-center justify-center mx-auto mb-3">
                              <Calendar className="w-8 h-8 text-purple-400" />
                            </div>
                            <p className="text-gray-400 text-sm mb-2">No upcoming events found.</p>
                            <Link to="/events" className="text-purple-400 hover:text-purple-300 text-sm font-medium">
                              Browse All Events →
                            </Link>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Quick Actions & Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Connection Requests */}
                      
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'events' && (
              <div className="bg-gray-900/80 backdrop-blur-sm rounded-xl shadow-xl overflow-hidden border border-gray-700">
                <div className="p-4 md:p-6">
                  <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between">
                    <div>
                      <h2 className="text-lg md:text-xl font-bold text-white mb-2 flex items-center">
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
                  
                  {/* Events Grid */}
                  {loadingData ? (
                    <div className="text-center py-10">
                      <div className="w-12 h-12 border-t-4 border-purple-500 border-solid rounded-full animate-spin mx-auto"></div>
                      <p className="mt-4 text-gray-400">Loading events...</p>
                    </div>
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
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {events.map((event) => (
                        <div key={event._id || event.id} className="bg-gray-800/40 rounded-lg overflow-hidden shadow-md hover:shadow-xl border border-gray-600 hover:border-purple-500/50 transition-all duration-300 transform hover:scale-105">
                          <div className="relative">
                            <img 
                              src={event.coverImage?.url || "/api/placeholder/400/200"} 
                              alt={event.name || "Event"}
                              className="w-full h-48 object-cover"
                            />
                            {event.category && (
                              <span className="absolute top-4 right-4 bg-purple-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                                {typeof event.category === 'string' ? event.category : 'Other'}
                              </span>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                          </div>
                          
                          <div className="p-5">
                            <h3 className="text-xl font-bold text-white mb-2">{event.name || "Untitled Event"}</h3>
                            
                            <div className="flex items-center text-gray-400 mb-2">
                              <Calendar className="w-4 h-4 mr-2" />
                              <span className="text-sm">{formatDate(event.startDateTime)}</span>
                            </div>
                            
                            <div className="flex items-center text-gray-400 mb-4">
                              <MapPin className="w-4 h-4 mr-2" />
                              <span className="text-sm">
                                {event.virtual 
                                  ? "Virtual Event" 
                                  : (event.location?.name || "Location TBA")}
                              </span>
                            </div>
                            
                            <div className="flex justify-end">
                              <Link to={`/events/${event._id || event.id}`}>
                                <button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 transform hover:scale-105">
                                  View Details →
                                </button>
                              </Link>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <div className="mt-6 text-center">
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