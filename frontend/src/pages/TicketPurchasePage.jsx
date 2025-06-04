import React, { useState, useEffect, Suspense } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  CreditCard,
  Smartphone,
  CheckCircle,
  XCircle,
  Ticket,
  Calendar,
  Clock,
  Tag,
  AlertCircle,
  MapPin,
  Copy,
} from "lucide-react";
import eventService from "../services/eventService";
import ticketService from "../services/ticketService";

// Use dynamic import for Cashfree component to avoid loading it unnecessarily
const CashfreePayment = React.lazy(() =>
  import("../components/payment/CashfreeButton")
);

const TicketPurchasePage = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();

  const [event, setEvent] = useState(null);
  const [ticketTypes, setTicketTypes] = useState([]);
  const [selectedTickets, setSelectedTickets] = useState([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [originalAmount, setOriginalAmount] = useState(0);
  const [serviceFee, setServiceFee] = useState(0); // Added service fee state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [checkoutStep, setCheckoutStep] = useState("select"); // select, payment, confirmation
  const [customerInfo, setCustomerInfo] = useState({
    email: "",
    phone: "",
    name: "",
  });
  const [paymentMethod, setPaymentMethod] = useState("cashfree_sdk");
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [bookingId, setBookingId] = useState(null);

  // State variables for coupon functionality
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [discount, setDiscount] = useState(0);

  // State for additional user preferences
  const [specialRequests, setSpecialRequests] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showTicketDetails, setShowTicketDetails] = useState(true);
  const [transactionId, setTransactionId] = useState(null);
  const [paymentPolling, setPaymentPolling] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [selectedTier, setSelectedTier] = useState(null);

  // Update the ticketTiers to use actual ticket type IDs
  const [ticketTiers, setTicketTiers] = useState([]);

  // Check for successful payment on initial load or when returning from payment gateway
  useEffect(() => {
    const checkPaymentStatus = async () => {
      // Get stored order ID and booking ID from localStorage
      const storedOrderId = localStorage.getItem("pendingOrderId");
      const storedBookingId = localStorage.getItem("pendingBookingId");

      if (storedOrderId && storedBookingId) {
        try {
          setPaymentPolling(true);
          console.log("Checking payment status for order:", storedOrderId);

          // Check payment status with the API
          const status = await ticketService.checkCashfreeFormPaymentStatus(
            storedOrderId,
            "cashfree_sdk"
          );

          if (
            status &&
            (status.status === "PAYMENT_SUCCESS" ||
              status.status === "completed")
          ) {
            console.log("Payment successful for order:", storedOrderId);
            setPaymentStatus("success");
            setSuccessMessage(
              "Payment successful! Redirecting to confirmation page..."
            );

            // Clear localStorage
            localStorage.removeItem("pendingOrderId");
            localStorage.removeItem("pendingBookingId");
            localStorage.removeItem("cashfreeOrderToken");

            // Redirect to confirmation page
            setTimeout(() => {
              navigate(`/tickets/confirmation/${storedBookingId}`);
            }, 1500);
          }
        } catch (err) {
          console.error("Error checking payment status:", err);
        } finally {
          setPaymentPolling(false);
        }
      }
    };

    checkPaymentStatus();
  }, [navigate]);

  // Update the useEffect that fetches event data
  useEffect(() => {
    const fetchEventData = async () => {
      try {
        setLoading(true);

        // Fetch event details
        const eventData = await eventService.getEvent(eventId);
        setEvent(eventData);

        // Fetch available ticket types
        const ticketsData = await ticketService.getEventTicketTypes(eventId);

        // Filter out inactive or sold out tickets
        const availableTickets =
          ticketsData?.data?.filter(
            (ticket) =>
              ticket.isActive &&
              (ticket.quantity > ticket.quantitySold || ticket.quantity === -1)
          ) || [];

        setTicketTypes(availableTickets);

        // Map the ticket types to our tiers
        const mappedTiers = availableTickets.map((ticket, index) => ({
          id: ticket._id, // Use the actual MongoDB ID
          name: ticket.name,
          price: ticket.price,
          features: [
            { text: "All Keynote Speaker Session", enabled: true },
            { text: "All Keynote Speaker Session", enabled: true },
            { text: "All Keynote Speaker Session", enabled: true },
            { text: "All Keynote Speaker Session", enabled: true },
            { text: "All Keynote Speaker Session", enabled: index >= 1 },
            { text: "All Keynote Speaker Session", enabled: index >= 1 },
            { text: "All Keynote Speaker Session", enabled: index >= 2 },
          ],
          isPopular: index === 1, // Make the second tier (Professional) the most popular
        }));

        setTicketTiers(mappedTiers);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching event data:", err);
        setError("Failed to load event data. Please try again.");
        setLoading(false);
      }
    };

    fetchEventData();
  }, [eventId]);

  // Update the useEffect that calculates total amount
  useEffect(() => {
    if (!selectedTier) {
      setTotalAmount(0);
      setOriginalAmount(0);
      setServiceFee(0);
      return;
    }

    // Get the selected tier
    const selectedTierData = ticketTiers.find(
      (tier) => tier.id === selectedTier
    );

    if (!selectedTierData) {
      setTotalAmount(0);
      setOriginalAmount(0);
      setServiceFee(0);
      return;
    }

    // Calculate subtotal (ticket price)
    const subtotal = selectedTierData.price;
    setOriginalAmount(subtotal);

    // Calculate service fee (20% of subtotal)
    const calculatedServiceFee = subtotal * 0.2;
    setServiceFee(calculatedServiceFee);

    // Calculate the total before discount (subtotal + service fee)
    const totalBeforeDiscount = subtotal + calculatedServiceFee;

    // Apply discount if coupon is active
    if (appliedCoupon) {
      if (appliedCoupon.discountType === "percentage") {
        // Apply percentage discount to the total (subtotal + service fee)
        const discountValue =
          totalBeforeDiscount * (appliedCoupon.discountValue / 100);
        setDiscount(discountValue);
        setTotalAmount(totalBeforeDiscount - discountValue);
      } else if (appliedCoupon.discountType === "fixed") {
        setDiscount(appliedCoupon.discountValue);
        // Apply fixed discount to the total (ensure total doesn't go negative)
        setTotalAmount(
          Math.max(0, totalBeforeDiscount - appliedCoupon.discountValue)
        );
      } else {
        setTotalAmount(totalBeforeDiscount);
        setDiscount(0);
      }
    } else {
      // No coupon
      setTotalAmount(totalBeforeDiscount);
      setDiscount(0);
    }
  }, [selectedTier, ticketTiers, appliedCoupon]);

  // Continuous payment status check
  useEffect(() => {
    let intervalId;

    if (paymentPolling && transactionId) {
      intervalId = setInterval(async () => {
        try {
          console.log("Polling payment status for transaction:", transactionId);

          const status = await ticketService.checkPaymentStatus(
            transactionId,
            paymentMethod
          );

          if (
            status &&
            (status.status === "PAYMENT_SUCCESS" ||
              status.status === "completed")
          ) {
            clearInterval(intervalId);
            setPaymentPolling(false);
            setPaymentStatus("success");
            setSuccessMessage(
              "Payment successful! Redirecting to confirmation page..."
            );

            // Redirect to confirmation page
            if (bookingId) {
              // Clear localStorage first
              localStorage.removeItem("pendingOrderId");
              localStorage.removeItem("pendingBookingId");
              localStorage.removeItem("cashfreeOrderToken");

              setTimeout(() => {
                navigate(`/tickets/confirmation/${bookingId}`);
              }, 1500);
            }
          } else if (
            status &&
            (status.status === "PAYMENT_FAILED" || status.status === "failed")
          ) {
            clearInterval(intervalId);
            setPaymentPolling(false);
            setPaymentStatus("failed");
            setError("Payment failed. Please try again.");
          }
        } catch (err) {
          console.error("Error checking payment status:", err);
        }
      }, 3000); // Check every 3 seconds
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [paymentPolling, transactionId, bookingId, navigate, paymentMethod]);

  // Update ticket quantity
  const handleQuantityChange = (index, quantity) => {
    const updatedTickets = [...selectedTickets];
    updatedTickets[index].quantity = quantity;
    setSelectedTickets(updatedTickets);
  };

  // Handle customer info change
  const handleInfoChange = (e) => {
    const { name, value } = e.target;
    setCustomerInfo((prev) => ({ ...prev, [name]: value }));
    const { phone, values } = e.target;
    setCustomerInfo((prev) => ({ ...prev, [phone]: values }));
  };

  // Apply coupon code
  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      setCouponError("Please enter a coupon code");
      return;
    }

    try {
      setCouponLoading(true);
      setCouponError(null);

      // Call the API to validate the coupon
      const couponResult = await ticketService.validateCoupon(
        eventId,
        couponCode
      );

      if (couponResult && couponResult.valid) {
        setAppliedCoupon({
          code: couponCode,
          discountType: couponResult.coupon?.discountPercentage
            ? "percentage"
            : "fixed",
          discountValue: couponResult.coupon?.discountPercentage || 0,
          name: couponResult.coupon?.name || couponCode,
        });
        setCouponCode("");
      } else {
        setCouponError(couponResult.error || "Invalid coupon code");
      }
    } catch (err) {
      console.error("Error validating coupon:", err);
      setCouponError(err.message || "Failed to validate coupon");
    } finally {
      setCouponLoading(false);
    }
  };

  // Remove applied coupon
  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponError(null);
  };

  // Update the proceedToPayment function
  const proceedToPayment = async () => {
    // Validate ticket selection
    if (!selectedTier) {
      setError("Please select a ticket tier");
      return;
    }

    if (!customerInfo.email || !customerInfo.phone) {
      setError("Please provide your contact information");
      return;
    }

    if (!acceptedTerms) {
      setError("Please accept the terms and conditions");
      return;
    }

    // Clear any previous errors
    setError(null);

    try {
      setPaymentProcessing(true);

      // Get the selected tier
      const selectedTierData = ticketTiers.find(
        (tier) => tier.id === selectedTier
      );

      if (!selectedTierData) {
        throw new Error("Selected ticket type not found");
      }

      // Create booking object to send
      const bookingData = {
        ticketSelections: [
          {
            ticketTypeId: selectedTierData.id, // Use the actual MongoDB ID
            quantity: 1,
          },
        ],
        paymentMethod: "cashfree_sdk",
        contactInformation: customerInfo,
        specialRequests: specialRequests || "",
        serviceFee: serviceFee,
      };

      // Add coupon if applied
      if (appliedCoupon) {
        bookingData.promoCode = appliedCoupon.code;
      }

      // Create booking with the API
      const booking = await ticketService.bookEventTickets(
        eventId,
        bookingData
      );

      if (booking && booking.booking && booking.booking.id) {
        // Store booking ID
        setBookingId(booking.booking.id);

        // Move to payment step
        setCheckoutStep("payment");
      } else {
        throw new Error("Failed to create booking");
      }
    } catch (err) {
      console.error("Error creating booking:", err);
      setError(err.message || "Failed to create booking. Please try again.");
    } finally {
      setPaymentProcessing(false);
    }
  };

  // Go back to previous step
  const goBack = () => {
    if (checkoutStep === "payment") {
      setCheckoutStep("select");
    } else if (checkoutStep === "confirmation") {
      setCheckoutStep("payment");
    } else {
      navigate(`/events/${eventId}`);
    }
  };

  // Handle successful payment
  const handlePaymentSuccess = (paymentResult) => {
    console.log("Payment successful:", paymentResult);
    setPaymentProcessing(false);
    setPaymentStatus("success");
    setSuccessMessage(
      "Payment successful! Redirecting to confirmation page..."
    );

    // Redirect to confirmation page
    if (bookingId) {
      // Clear localStorage first
      localStorage.removeItem("pendingOrderId");
      localStorage.removeItem("pendingBookingId");
      localStorage.removeItem("cashfreeOrderToken");

      setTimeout(() => {
        navigate(`/tickets/confirmation/${bookingId}`);
      }, 1500);
    }
  };

  // Handle payment failure
  const handlePaymentFailure = (error) => {
    console.error("Payment failed:", error);
    setError("Payment could not be completed. Please try again.");
    setPaymentProcessing(false);
    setPaymentStatus("failed");
  };

  // Handle payment cancellation
  const handlePaymentCancel = () => {
    setPaymentProcessing(false);
    setPaymentStatus("cancelled");
  };

  // Initiate UPI payment
  const handleUpiPayment = async () => {
    try {
      setPaymentProcessing(true);
      setError(null);

      // Create UPI payment request
      const paymentData = {
        bookingId,
        amount: totalAmount,
        eventName: event?.name || "Event Tickets",
        customerName: customerInfo.name,
        customerPhone: customerInfo.phone,
        customerEmail: customerInfo.email,
      };

      const result = await ticketService.initiateUpiPayment(
        eventId,
        paymentData
      );

      if (result && result.success) {
        // Set transaction ID for polling
        setTransactionId(result.orderId);
        setPaymentPolling(true);

        // Store in localStorage for recovery if page is closed/refreshed
        localStorage.setItem("pendingOrderId", result.orderId);
        localStorage.setItem("pendingBookingId", bookingId);

        // Open payment link in new tab if available
        if (result.paymentLink) {
          window.open(result.paymentLink, "_blank");
        }
      } else {
        throw new Error("Failed to initiate UPI payment");
      }
    } catch (err) {
      console.error("Error initiating UPI payment:", err);
      setError(
        err.message || "Failed to initiate UPI payment. Please try again."
      );
      setPaymentProcessing(false);
    }
  };

  // Format currency for display
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount);
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return "";

    const options = {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    };
    return new Date(dateString).toLocaleDateString("en-US", options);
  };

  // Format time for display
  const formatTime = (dateString) => {
    if (!dateString) return "";

    const options = { hour: "2-digit", minute: "2-digit", hour12: true };
    return new Date(dateString).toLocaleTimeString("en-US", options);
  };

  // Copy booking ID to clipboard
  const copyBookingId = () => {
    if (bookingId) {
      navigator.clipboard.writeText(bookingId);
      setSuccessMessage("Booking ID copied to clipboard!");
      setTimeout(() => setSuccessMessage(""), 2000);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="w-10 h-10 border-t-4 border-b-4 border-blue-500 rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  // Error state - when the event cannot be loaded
  if (error && !event) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <XCircle className="w-5 h-5 text-red-500 mr-2" />
            <p className="text-red-600">{error}</p>
          </div>
        </div>
        <button
          onClick={() => navigate("/events")}
          className="mt-4 inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Browse Events
        </button>
      </div>
    );
  }

  // If payment was successful, show success message and redirection
  if (paymentStatus === "success" && successMessage) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="bg-green-50 border border-green-200 rounded-md p-8 text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-green-800 mb-2">
            Payment Successful!
          </h2>
          <p className="text-green-700 mb-4">{successMessage}</p>
          <div className="w-8 h-8 border-t-4 border-b-4 border-green-500 rounded-full animate-spin mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={goBack}
          className="inline-flex items-center text-blue-600 hover:text-blue-700"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {checkoutStep === "select" ? "Back to Event" : "Back"}
        </button>

        <h1 className="text-2xl font-bold mt-2">
          {checkoutStep === "select"
            ? "Select Tickets"
            : checkoutStep === "payment"
            ? "Complete Payment"
            : "Payment Confirmation"}
        </h1>
      </div>

      {/* Checkout Progress Indicator */}
      <div className="mb-8 hidden md:block">
        <div className="flex justify-between">
          <div className="relative w-full">
            <div className="h-1 bg-gray-200 absolute w-full top-3"></div>
            <div className="flex justify-between relative">
              <div className="flex flex-col items-center">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center z-10 ${
                    checkoutStep === "select"
                      ? "bg-blue-600 text-white"
                      : "bg-green-500 text-white"
                  }`}
                >
                  {checkoutStep === "select" ? (
                    "1"
                  ) : (
                    <CheckCircle className="w-4 h-4" />
                  )}
                </div>
                <span className="text-sm mt-1 font-medium">Select</span>
              </div>

              <div className="flex flex-col items-center">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center z-10 ${
                    checkoutStep === "select"
                      ? "bg-gray-300"
                      : checkoutStep === "payment"
                      ? "bg-blue-600 text-white"
                      : "bg-green-500 text-white"
                  }`}
                >
                  {checkoutStep === "confirmation" ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : (
                    "2"
                  )}
                </div>
                <span className="text-sm mt-1 font-medium">Payment</span>
              </div>

              <div className="flex flex-col items-center">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center z-10 ${
                    checkoutStep === "confirmation"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-300"
                  }`}
                >
                  3
                </div>
                <span className="text-sm mt-1 font-medium">Confirmation</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Success message */}
      {successMessage && paymentStatus !== "success" && (
        <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-6">
          <div className="flex">
            <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
            <p className="text-green-600">{successMessage}</p>
          </div>
        </div>
      )}

      {/* Error display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
          <div className="flex">
            <XCircle className="w-5 h-5 text-red-500 mr-2" />
            <p className="text-red-600">{error}</p>
          </div>
        </div>
      )}

      {/* Payment status display */}
      {paymentStatus === "failed" && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
          <div className="flex">
            <XCircle className="w-5 h-5 text-red-500 mr-2" />
            <p className="text-red-600">
              Payment failed. Please try again or choose a different payment
              method.
            </p>
          </div>
        </div>
      )}

      {paymentStatus === "cancelled" && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-6">
          <div className="flex">
            <AlertCircle className="w-5 h-5 text-yellow-500 mr-2" />
            <p className="text-yellow-600">
              Payment was cancelled. Please try again when you're ready.
            </p>
          </div>
        </div>
      )}

      {/* Payment polling indicator */}
      {paymentPolling && (
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-6">
          <div className="flex items-center">
            <div className="w-5 h-5 border-t-2 border-b-2 border-blue-500 rounded-full animate-spin mr-2"></div>
            <p className="text-blue-600">
              Checking payment status... Please keep this page open.
            </p>
          </div>
        </div>
      )}

      {/* Event Details */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="flex flex-col md:flex-row">
          {event?.coverImage?.url && (
            <div className="md:w-1/3 mb-4 md:mb-0 md:pr-4">
              <img
                src={event.coverImage.url}
                alt={event.name}
                className="w-full h-48 object-cover rounded-md"
              />
            </div>
          )}

          <div className="md:w-2/3">
            <h2 className="text-xl font-semibold">{event?.name}</h2>

            <div className="flex flex-col space-y-2 mt-3">
              <div className="flex items-center text-gray-600">
                <Calendar className="w-4 h-4 mr-2 text-blue-500" />
                <span>{formatDate(event?.startDateTime)}</span>
              </div>

              <div className="flex items-center text-gray-600">
                <Clock className="w-4 h-4 mr-2 text-blue-500" />
                <span>
                  {formatTime(event?.startDateTime)} -{" "}
                  {event?.endDateTime
                    ? formatTime(event?.endDateTime)
                    : "Until Conclusion"}
                </span>
              </div>

              {event?.venue && (
                <div className="flex items-center text-gray-600">
                  <MapPin className="w-4 h-4 mr-2 text-blue-500" />
                  <span>{event.venue}</span>
                </div>
              )}

              <div className="flex items-center text-gray-600">
                <Ticket className="w-4 h-4 mr-2 text-blue-500" />
                <span>
                  {ticketTypes.length === 0
                    ? "No tickets available"
                    : `${ticketTypes.length} ticket type${
                        ticketTypes.length !== 1 ? "s" : ""
                      } available`}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Ticket Selection Step */}
      {checkoutStep === "select" && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {ticketTiers.map((tier) => (
              <div
                key={tier.id}
                className={`relative border rounded-xl p-6 transition-all duration-200 cursor-pointer ${
                  selectedTier === tier.id
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-blue-300"
                }`}
                onClick={() => setSelectedTier(tier.id)}
              >
                {tier.isPopular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-blue-500 text-white text-xs font-medium px-3 py-1 rounded-full">
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="text-center mb-6">
                  <h3 className="text-xl font-bold text-gray-900">
                    {tier.name}
                  </h3>
                  <div className="mt-2 text-3xl font-bold text-blue-600">
                    ₹{tier.price}
                  </div>
                </div>

                <div className="space-y-4">
                  {tier.features.map((feature, index) => (
                    <div key={index} className="flex items-center">
                      {feature.enabled ? (
                        <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                      ) : (
                        <XCircle className="w-5 h-5 text-gray-300 mr-2" />
                      )}
                      <span
                        className={`text-sm ${
                          feature.enabled ? "text-gray-700" : "text-gray-400"
                        }`}
                      >
                        {feature.text}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="mt-6">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={selectedTier === tier.id}
                      onChange={() => setSelectedTier(tier.id)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-600">
                      Have a coupon code?
                    </span>
                  </label>
                </div>
              </div>
            ))}
          </div>

          {/* Customer Info */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">
              Contact Information
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Full Name
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  value={customerInfo.name}
                  onChange={handleInfoChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="Your full name"
                />
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={customerInfo.email}
                  onChange={handleInfoChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  required
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <label
                  htmlFor="phone"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={customerInfo.phone}
                  onChange={handleInfoChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  required
                  placeholder="10-digit mobile number"
                />
              </div>
            </div>

            {/* Special Requests */}
            <div className="mt-6">
              <label
                htmlFor="specialRequests"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Special Requests (optional)
              </label>
              <textarea
                id="specialRequests"
                name="specialRequests"
                value={specialRequests}
                onChange={(e) => setSpecialRequests(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                rows="3"
                placeholder="Any special accommodations or requests"
              />
            </div>

            {/* Add this after the Customer Info section */}
            <div className="mt-6 flex justify-between items-center">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="terms"
                  checked={acceptedTerms}
                  onChange={(e) => setAcceptedTerms(e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="terms" className="ml-2 text-sm text-gray-600">
                  I agree to the{" "}
                  <a href="/terms" className="text-blue-600 hover:underline">
                    Terms and Conditions
                  </a>
                </label>
              </div>

              <button
                onClick={proceedToPayment}
                disabled={
                  !selectedTier ||
                  !customerInfo.email ||
                  !customerInfo.phone ||
                  !acceptedTerms ||
                  paymentProcessing
                }
                className={`px-6 py-3 rounded-lg text-white font-medium transition-colors ${
                  !selectedTier ||
                  !customerInfo.email ||
                  !customerInfo.phone ||
                  !acceptedTerms ||
                  paymentProcessing
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700"
                }`}
              >
                {paymentProcessing ? (
                  <div className="flex items-center">
                    <div className="w-5 h-5 border-t-2 border-white rounded-full animate-spin mr-2"></div>
                    Processing...
                  </div>
                ) : (
                  "Proceed to Payment"
                )}
              </button>
            </div>
          </div>
        </>
      )}

      {/* Payment Step */}
      {checkoutStep === "payment" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">
                Select Payment Method
              </h3>

              <div className="space-y-4 mb-8">
                <label className="flex items-center p-4 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="cashfree_sdk"
                    checked={paymentMethod === "cashfree_sdk"}
                    onChange={() => setPaymentMethod("cashfree_sdk")}
                    className="w-5 h-5 text-blue-600 border-gray-300 focus:ring-blue-500"
                  />
                  <div className="ml-4">
                    <div className="flex items-center">
                      <CreditCard className="w-5 h-5 text-blue-500 mr-2" />
                      <span className="font-medium">Cashfree Payment</span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      Pay using Credit/Debit Cards, UPI, Netbanking
                    </p>
                  </div>
                </label>
              </div>

              {/* Pricing Information */}
              <div className="bg-gray-50 rounded-xl p-6 mb-8">
                <h4 className="font-medium text-gray-900 mb-4">
                  Payment Summary
                </h4>
                <div className="space-y-3">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal</span>
                    <span>{formatCurrency(originalAmount)}</span>
                  </div>

                  <div className="flex justify-between text-gray-600">
                    <span>Service Fee (20%)</span>
                    <span>{formatCurrency(serviceFee)}</span>
                  </div>

                  {discount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount</span>
                      <span>-{formatCurrency(discount)}</span>
                    </div>
                  )}

                  <div className="flex justify-between border-t border-gray-200 pt-3 font-bold text-lg">
                    <span>Total Amount</span>
                    <span className="text-blue-600">
                      {formatCurrency(totalAmount)}
                    </span>
                  </div>
                </div>
              </div>

              {paymentMethod === "cashfree_sdk" && (
                <Suspense
                  fallback={
                    <div className="flex justify-center my-8">
                      <div className="w-10 h-10 border-t-4 border-b-4 border-blue-500 rounded-full animate-spin"></div>
                    </div>
                  }
                >
                  <CashfreePayment
                    amount={totalAmount}
                    bookingId={bookingId || "pending"}
                    eventName={event?.name || "Event Tickets"}
                    onSuccess={handlePaymentSuccess}
                    onFailure={handlePaymentFailure}
                    onCancel={handlePaymentCancel}
                  />
                </Suspense>
              )}

              <div className="mt-6 text-center">
                <p className="text-sm text-gray-600">
                  By proceeding with payment, you agree to our{" "}
                  <a
                    href="/termsandconditons"
                    className="text-blue-600 hover:underline"
                  >
                    Terms and Conditions
                  </a>{" "}
                  and{" "}
                  <a
                    href="/refundpolicy"
                    className="text-blue-600 hover:underline"
                  >
                    Refund Policy
                  </a>
                  .
                </p>
              </div>
            </div>
          </div>
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 sticky top-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">
                Booking Details
              </h3>

              {/* Event Summary */}
              <div className="mb-6 pb-6 border-b border-gray-200">
                <h4 className="font-medium text-gray-900 mb-3">
                  {event?.name}
                </h4>
                <div className="space-y-2">
                  <div className="flex items-center text-gray-600">
                    <Calendar className="w-4 h-4 mr-2 text-blue-500" />
                    <span>{formatDate(event?.startDateTime)}</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <Clock className="w-4 h-4 mr-2 text-blue-500" />
                    <span>{formatTime(event?.startDateTime)}</span>
                  </div>
                  {event?.venue && (
                    <div className="flex items-center text-gray-600">
                      <MapPin className="w-4 h-4 mr-2 text-blue-500" />
                      <span>{event.venue}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Ticket Summary */}
              <div className="mb-6">
                <h4 className="font-medium text-gray-900 mb-3">Your Tickets</h4>
                <div className="space-y-3">
                  {selectedTickets
                    .filter((ticket) => ticket.quantity > 0)
                    .map((ticket, index) => (
                      <div
                        key={index}
                        className="flex justify-between items-center"
                      >
                        <div className="flex items-center">
                          <Ticket className="w-4 h-4 mr-2 text-blue-500" />
                          <span className="text-gray-700">
                            {ticket.name} x {ticket.quantity}
                          </span>
                        </div>
                        <span className="font-medium text-gray-900">
                          {formatCurrency(ticket.price * ticket.quantity)}
                        </span>
                      </div>
                    ))}
                </div>
              </div>

              {/* Applied Coupon */}
              {appliedCoupon && (
                <div className="mb-6 pb-6 border-b border-gray-200">
                  <div className="flex items-center mb-3">
                    <Tag className="w-4 h-4 mr-2 text-blue-500" />
                    <h4 className="font-medium text-gray-900">
                      Applied Coupon
                    </h4>
                  </div>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="flex justify-between items-center">
                      <div className="text-sm font-medium text-blue-900">
                        {appliedCoupon.name}
                      </div>
                      <div className="text-sm text-blue-600">
                        {appliedCoupon.discountType === "percentage"
                          ? `${appliedCoupon.discountValue}% off`
                          : formatCurrency(appliedCoupon.discountValue)}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Payment Details */}
              <div className="space-y-3">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Subtotal</span>
                  <span>{formatCurrency(originalAmount)}</span>
                </div>

                <div className="flex justify-between text-sm text-gray-600">
                  <span>Service Fee (20%)</span>
                  <span>{formatCurrency(serviceFee)}</span>
                </div>

                {discount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Discount</span>
                    <span>-{formatCurrency(discount)}</span>
                  </div>
                )}

                <div className="flex justify-between border-t border-gray-200 pt-3 font-bold">
                  <span>Total</span>
                  <span className="text-blue-600">
                    {formatCurrency(totalAmount)}
                  </span>
                </div>
              </div>

              {/* Booking ID */}
              {bookingId && (
                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <div className="flex justify-between items-center">
                    <div className="text-sm text-gray-600">Booking ID:</div>
                    <div className="flex items-center">
                      <span className="text-sm font-mono bg-white px-2 py-1 rounded border border-gray-200">
                        {bookingId.substring(0, 8)}...
                      </span>
                      <button
                        onClick={copyBookingId}
                        className="ml-2 text-blue-600 hover:text-blue-700"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TicketPurchasePage;
