import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { 
  BarChart3, 
  Users, 
  Calendar, 
  Clock, 
  MapPin, 
  Edit3, 
  Settings, 
  Ticket, 
  MessageSquare,
  ChevronRight,
  Download,
  Mail,
  Share2,
  Bell,
  AlertTriangle,
  CheckCircle,
  User,
  DollarSign,
  Eye,
  List,
  Image,
  Plus
} from 'lucide-react';
import eventService from '../services/eventService';

const EventDashboardPage = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  
  // State variables
  const [event, setEvent] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [ticketStats, setTicketStats] = useState(null);
  
  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return "Date TBA";
    
    try {
      const options = { weekday: 'short', month: 'short', day: 'numeric' };
      return new Date(dateString).toLocaleDateString('en-US', options);
    } catch (err) {
      console.error("Date formatting error:", err);
      return "Invalid date";
    }
  };
  
  // Format time for display
  const formatTime = (dateString) => {
    if (!dateString) return "Time TBA";
    
    try {
      const options = { hour: '2-digit', minute: '2-digit' };
      return new Date(dateString).toLocaleTimeString('en-US', options);
    } catch (err) {
      console.error("Time formatting error:", err);
      return "Invalid time";
    }
  };
  
  // Safely get the attendee count
  const getAttendeeCount = (attendeeCounts, type) => {
    if (!attendeeCounts) return 0;
    
    const count = attendeeCounts[type];
    
    if (typeof count === 'number') {
      return count;
    }
    
    if (count && typeof count === 'object' && count.count !== undefined) {
      return count.count;
    }
    
    return 0;
  };
  
  // Format currency
  const formatCurrency = (amount, currencyCode = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode
    }).format(amount);
  };
  
  // Fetch event and analytics data
  useEffect(() => {
    const fetchEventData = async () => {
      try {
        setLoading(true);
        
        if (!eventId) {
          setError('Invalid event ID');
          setLoading(false);
          return;
        }
        
        // Fetch event details
        const eventResponse = await eventService.getEvent(eventId);
        setEvent(eventResponse.data);
        
        try {
          // Fetch analytics
          const analyticsResponse = await eventService.getEventAnalytics(eventId);
          setAnalytics(analyticsResponse);
          
          // Fetch ticket stats
          const ticketStatsResponse = await eventService.getEventBookingStats(eventId);
          setTicketStats(ticketStatsResponse);
        } catch (analyticsError) {
          console.error('Error fetching analytics:', analyticsError);
          // Continue without analytics
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching event data:', err);
        setError('Failed to load event data. Please try again later.');
        setLoading(false);
      }
    };
    
    fetchEventData();
  }, [eventId]);
  
  // Generate check-in code
  const handleGenerateCheckInCode = async () => {
    try {
      const response = await eventService.generateCheckInCode(eventId);
      console.log('Check-in code generated:', response);
      
      // Update event state with new code
      setEvent(prev => ({
        ...prev,
        checkInCode: response.code
      }));
      
      alert(`Check-in code: ${response.code}`);
    } catch (err) {
      console.error('Error generating check-in code:', err);
      alert('Failed to generate check-in code. Please try again later.');
    }
  };
  
  // Generate event report
  const handleGenerateReport = async (format = 'csv') => {
    try {
      const response = await eventService.generateEventReport(eventId, format);
      
      if (format === 'csv') {
        // Create a blob and download it
        const blob = new Blob([response], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `event-${eventId}-report.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        // For JSON, just log it to console
        console.log('Event report:', response);
        alert('Report generated successfully!');
      }
    } catch (err) {
      console.error('Error generating report:', err);
      alert('Failed to generate report. Please try again later.');
    }
  };
  
  // Get event status
  const getEventStatus = () => {
    if (!event) return { label: 'Unknown', colorClass: 'bg-gray-100 text-gray-800' };
    
    const now = new Date();
    const startDate = new Date(event.startDateTime);
    const endDate = event.endDateTime ? new Date(event.endDateTime) : null;
    
    if (event.status === 'cancelled') {
      return { label: 'Cancelled', colorClass: 'bg-red-100 text-red-800' };
    }
    
    if (now < startDate) {
      return { label: 'Upcoming', colorClass: 'bg-blue-100 text-blue-800' };
    }
    
    if (!endDate || now <= endDate) {
      return { label: 'In Progress', colorClass: 'bg-green-100 text-green-800' };
    }
    
    return { label: 'Ended', colorClass: 'bg-gray-100 text-gray-800' };
  };
  
  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <div className="w-16 h-16 border-t-4 border-blue-500 border-solid rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading event dashboard...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6" role="alert">
            <strong className="font-bold">Error: </strong>
            <span className="block sm:inline">{error}</span>
          </div>
          <button 
            onClick={() => navigate('/events')} 
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
          >
            Back to Events
          </button>
        </div>
      </div>
    );
  }
  
  if (!event) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <p className="text-gray-600">Event not found</p>
          <button 
            onClick={() => navigate('/events')} 
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
          >
            Back to Events
          </button>
        </div>
      </div>
    );
  }
  
  const eventStatus = getEventStatus();
  const goingCount = getAttendeeCount(event.attendeeCounts, 'going');
  const maybeCount = getAttendeeCount(event.attendeeCounts, 'maybe');
  const invitedCount = getAttendeeCount(event.attendeeCounts, 'invited');
  
  return (
 <div className="bg-gray-50 min-h-screen pb-12">
  {/* Header */}
  <div className="bg-white shadow-sm">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div className="flex items-center">
          <button 
            onClick={() => navigate('/events')} 
            className="mr-4 text-gray-600 hover:text-green-700 transition-colors"
          >
            &larr; Back to Events
          </button>
          <h1 className="text-xl font-bold text-gray-900 truncate">
            Event Dashboard: {event.name}
          </h1>
          <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${eventStatus.colorClass}`}>
            {eventStatus.label}
          </span>
        </div>
        
        <div className="mt-4 md:mt-0 flex flex-wrap gap-2">
          <Link
            to={`/events/${eventId}/edit`}
            className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-green-50 hover:text-green-700 transition-colors"
          >
            <Edit3 className="w-4 h-4 mr-1" />
            Edit Event
          </Link>
          
          <Link
            to={`/events/${eventId}`}
            className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-green-50 hover:text-green-700 transition-colors"
          >
            <Eye className="w-4 h-4 mr-1" />
            View Event
          </Link>
        </div>
      </div>
    </div>
  </div>
  
  {/* Event Summary - Enhanced with subtle green accents */}
  <div className="bg-white shadow-sm mt-6 border-t-2 border-green-100">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* ... rest of the event summary content ... */}
    </div>
  </div>
  
  {/* Navigation Tabs - Enhanced active state */}
  <div className="bg-white shadow-sm mt-1 border-b border-gray-200">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <nav className="flex -mb-px space-x-8 overflow-x-auto">
        <button
          onClick={() => setActiveTab('overview')}
          className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
            activeTab === 'overview'
              ? 'border-green-600 text-green-700 font-semibold'
              : 'border-transparent text-gray-500 hover:text-green-600 hover:border-green-200 transition-colors'
          }`}
        >
          Overview
        </button>
        {/* ... other tab buttons with same styling ... */}
      </nav>
    </div>
  </div>

  {/* Stats Grid - Enhanced cards */}
  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mb-8">
    <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-green-400 hover:shadow-md transition-shadow">
      <div className="flex items-center">
        <div className="p-3 rounded-full bg-green-50 text-green-600 mr-4">
          <Users className="h-6 w-6" />
        </div>
        {/* ... rest of card content ... */}
      </div>
    </div>
    {/* ... other stat cards ... */}
  </div>

  {/* Quick Actions - More prominent buttons */}
  <div className="bg-white rounded-lg shadow-sm p-6 mb-8 border border-green-50">
    <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h3>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <Link 
        to={`/events/${eventId}/attendees`}
        className="inline-flex flex-col items-center justify-center p-4 border border-green-100 rounded-lg hover:bg-green-50 hover:border-green-200 transition-all"
      >
        <Users className="h-6 w-6 text-green-600 mb-2" />
        <span className="text-sm font-medium">Manage Attendees</span>
      </Link>
      {/* ... other action buttons ... */}
    </div>
  </div>

  {/* Primary Buttons - More consistent green styling */}
  <Link 
    to={`/events/${eventId}/checkin/scan`}
    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
  >
    Launch Scanner
  </Link>

  {/* Secondary Buttons */}
  <button 
    onClick={handleGenerateCheckInCode}
    className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-green-50 hover:text-green-700 transition-colors"
  >
    Generate New Code
  </button>
</div>
  );
};

export default EventDashboardPage;
