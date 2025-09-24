import React, { useState, useRef, useEffect } from "react";
import { IoMenu, IoClose } from "react-icons/io5";
import { Link, useNavigate } from "react-router-dom";
import { motion } from 'framer-motion'

const Navbar = ({ user, onLogout }) => {
    const [menu, setMenu] = useState(false);
    const [profileMenuOpen, setProfileMenuOpen] = useState(false);
    const [searchFocused, setSearchFocused] = useState(false);
    const profileRef = useRef(null);
    const mobileMenuRef = useRef(null);
    const navigate = useNavigate();

    const items = [
        { id: 1, text: "Home", path: "/" },
        { id: 2, text: "About Us", path: "/about" },
        { id: 3, text: "Events", path: "/events" },
      
    ];

    const toggleProfileMenu = () => {
        setProfileMenuOpen(!profileMenuOpen);
    };

    const toggleMobileMenu = () => {
        setMenu(!menu);
    };

    const handleSearch = (e) => {
        e.preventDefault();
        console.log("Search term:", e.target.search.value);
    };

    // Close menus when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (profileRef.current && !profileRef.current.contains(event.target)) {
                setProfileMenuOpen(false);
            }
            if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target)) {
                setMenu(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    return (
        <>
            <motion.nav
                className="hidden md:flex text-white bg-black/70 backdrop-blur-xl shadow-2xl fixed z-50 top-6 left-1/2 transform -translate-x-1/2 items-center justify-between rounded-full px-12 py-5 w-auto min-w-fit mx-auto border border-white/10">
                
                <div className="flex items-center justify-between w-full space-x-8">
                    {/* Logo Section */}
                    <Link to={"/"} className="flex items-center gap-3 flex-shrink-0">
                        <div className="h-10 w-10 bg-gradient-to-r from-[#eba016] to-[#f4b942] rounded-full flex items-center justify-center shadow-lg">
                            <img src="https://res.cloudinary.com/dnnl72vrp/image/upload/v1740333339/MeetKats_trv9cv.jpg" alt="Logo" className="h-8 w-8 rounded-full" />
                        </div>
                        <h2 className="text-2xl font-heading font-bold text-[#eba016] whitespace-nowrap">Meetkats</h2>
                    </Link>

                    {/* Navigation Menu */}
                    <div className="flex-1 flex justify-center">
                        <ul className="flex space-x-8 list-none text-base items-center">
                            {items.map(({ id, text, path }) => (
                                <li
                                    key={id}
                                    className="hover:text-[#eba016] duration-300 hover:cursor-pointer transition-colors relative group whitespace-nowrap"
                                >
                                    <Link to={path} className="relative">
                                        {text}
                                        <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#eba016] transition-all duration-300 group-hover:w-full"></span>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Search Bar */}
                    <div className="hidden lg:flex relative flex-shrink-0">
                        <form onSubmit={handleSearch} className="w-full">
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <svg
                                        className={`h-4 w-4 transition-colors duration-200 ${searchFocused ? "text-[#eba016]" : "text-gray-400"}`}
                                        xmlns="http://www.w3.org/2000/svg"
                                        viewBox="0 0 20 20"
                                        fill="currentColor"
                                    >
                                        <path
                                            fillRule="evenodd"
                                            d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                                            clipRule="evenodd"
                                        />
                                    </svg>
                                </div>
                                <input
                                    type="search"
                                    name="search"
                                    id="search"
                                    className="w-64 bg-white/10 border border-white/20 rounded-full py-2.5 pl-10 pr-4 text-sm placeholder-gray-300 focus:outline-none focus:bg-white/20 focus:border-[#eba016]/50 focus:ring-2 focus:ring-[#eba016]/20 transition-all duration-200 text-white"
                                    placeholder="Search..."
                                    onFocus={() => setSearchFocused(true)}
                                    onBlur={() => setSearchFocused(false)}
                                />
                            </div>
                        </form>
                    </div>

                    {/* Right Actions */}
                    <div className="flex items-center space-x-4 flex-shrink-0">
                        {!user ? (
                            <>
                                <div className="hidden lg:flex items-center">
                                    <Link
                                        to="/login"
                                        className="hover:text-[#eba016] duration-300 hover:cursor-pointer transition-colors whitespace-nowrap">
                                        Login
                                    </Link>
                                    <span className="mx-3 text-gray-400">/</span>
                                    <Link
                                        to="/signup"
                                        className="hover:text-[#eba016] duration-300 hover:cursor-pointer transition-colors whitespace-nowrap">
                                        Signup
                                    </Link>
                                </div>

                                <button
                                    onClick={() => navigate("/signup")}
                                    className="px-6 py-3 bg-gradient-to-r from-[#eba016] to-[#f4b942] hover:from-[#d4941a] hover:to-[#eba016] text-white rounded-full transition-all duration-300 transform hover:scale-105 shadow-lg whitespace-nowrap">
                                    Join Now
                                </button>
                            </>
                        ) : (
                            <>
                                {/* Messages */}
                                <Link
                                    to="/messages"
                                    className="p-2.5 rounded-full text-white hover:text-[#eba016] hover:bg-white/10 transition-all duration-200"
                                >
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="h-5 w-5"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                                        />
                                    </svg>
                                </Link>

                                {/* Notifications */}
                                <Link
                                    to="/notifications"
                                    className="p-2.5 rounded-full text-white hover:text-[#eba016] hover:bg-white/10 transition-all duration-200 relative"
                                >
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="h-5 w-5"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                                        />
                                    </svg>
                                </Link>

                                {/* Profile Dropdown */}
                                <div ref={profileRef} className="relative">
                                    <button
                                        onClick={toggleProfileMenu}
                                        className="flex items-center space-x-2 p-1.5 rounded-full hover:bg-white/10 transition-all duration-200 group"
                                    >
                                        <div className="flex-shrink-0">
                                            {user?.profilePicture ? (
                                                <img
                                                    className="h-9 w-9 rounded-full border-2 border-[#eba016]/50 group-hover:border-[#eba016] transition-colors"
                                                    src={user.profilePicture}
                                                    alt=""
                                                />
                                            ) : (
                                                <div className="h-9 w-9 rounded-full bg-gradient-to-r from-[#eba016] to-[#f4b942] flex items-center justify-center border-2 border-[#eba016]/50 group-hover:border-[#eba016] transition-colors">
                                                    <span className="text-sm font-semibold text-white">
                                                        {user?.firstName?.charAt(0)}
                                                        {user?.lastName?.charAt(0)}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            className="h-4 w-4 text-gray-400 group-hover:text-[#eba016] transition-colors"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </button>

                                    {profileMenuOpen && (
                                        <div className="absolute right-0 top-full mt-2 w-80 rounded-2xl shadow-xl bg-white ring-1 ring-black ring-opacity-5 overflow-hidden z-50">
                                            <div className="px-6 py-5 bg-gradient-to-r from-[#eba016] to-[#f4b942] text-white">
                                                <div className="flex items-center space-x-4">
                                                    {user?.profilePicture ? (
                                                        <img
                                                            className="h-14 w-14 rounded-xl border-3 border-white shadow-lg"
                                                            src={user.profilePicture}
                                                            alt=""
                                                        />
                                                    ) : (
                                                        <div className="h-14 w-14 rounded-xl bg-white/20 flex items-center justify-center border-3 border-white shadow-lg">
                                                            <span className="text-lg font-bold text-white">
                                                                {user?.firstName?.charAt(0)}
                                                                {user?.lastName?.charAt(0)}
                                                            </span>
                                                        </div>
                                                    )}
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-lg font-bold truncate">
                                                            {user?.firstName} {user?.lastName}
                                                        </p>
                                                        <p className="text-sm text-orange-100 truncate">{user?.headline || "Update your headline"}</p>
                                                    </div>
                                                </div>
                                                <Link
                                                    to={`/profile/${user.id}`}
                                                    className="mt-4 block text-center bg-white/20 text-white text-sm font-medium py-2.5 rounded-xl hover:bg-white/30 transition-colors"
                                                >
                                                    View Profile
                                                </Link>
                                            </div>

                                            <div className="py-2">
                                                <Link
                                                    to="/settings"
                                                    className="flex items-center px-6 py-3 text-sm text-gray-700 hover:bg-orange-50 hover:text-[#eba016] transition-colors"
                                                >
                                                    <svg
                                                        xmlns="http://www.w3.org/2000/svg"
                                                        className="h-5 w-5 mr-3"
                                                        fill="none"
                                                        viewBox="0 0 24 24"
                                                        stroke="currentColor"
                                                    >
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            strokeWidth={2}
                                                            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                                                        />
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            strokeWidth={2}
                                                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                                        />
                                                    </svg>
                                                    Settings
                                                </Link>
                                                <div className="border-t border-gray-100 my-2"></div>
                                                <button
                                                    onClick={onLogout}
                                                    className="flex items-center w-full px-6 py-3 text-sm text-gray-700 hover:bg-orange-50 hover:text-[#eba016] transition-colors"
                                                >
                                                    <svg
                                                        xmlns="http://www.w3.org/2000/svg"
                                                        className="h-5 w-5 mr-3"
                                                        fill="none"
                                                        viewBox="0 0 24 24"
                                                        stroke="currentColor"
                                                    >
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            strokeWidth={2}
                                                            d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                                                        />
                                                    </svg>
                                                    Sign out
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </motion.nav>

            {/* Mobile navbar */}
            <div className="flex md:hidden justify-between items-center bg-black/80 backdrop-blur-xl text-white px-6 py-4 fixed top-0 left-0 w-full z-50 border-b border-white/10">
                <div className="flex items-center gap-2">
                    <div className="h-8 w-8 bg-gradient-to-r from-[#eba016] to-[#f4b942] rounded-full flex items-center justify-center">
                        <img src="https://res.cloudinary.com/dnnl72vrp/image/upload/v1740333339/MeetKats_trv9cv.jpg" alt="Logo" className="h-6 w-6 rounded-full" />
                    </div>
                    <h2 className="text-lg font-heading font-bold text-[#eba016]">Meetkats</h2>
                </div>

                <button onClick={toggleMobileMenu} className="text-2xl p-2 hover:bg-white/10 rounded-full transition-colors">
                    <IoMenu />
                </button>

                <div
                    className={`fixed top-0 right-0 h-screen w-3/4 bg-black/95 backdrop-blur-xl text-white transform ${menu ? "translate-x-0" : "translate-x-full"
                        } transition-transform duration-300 ease-in-out z-40 border-l border-white/10`}
                >
                    <button
                        onClick={toggleMobileMenu}
                        className="absolute top-6 right-6 text-2xl p-2 hover:bg-white/10 rounded-full transition-colors"
                    >
                        <IoClose />
                    </button>

                    <div className="flex flex-col items-center mt-24 space-y-8">
                        <ul className="space-y-8 text-center">
                            {items.map(({ id, text, path }) => (
                                <li
                                    key={id}
                                    className="hover:text-[#eba016] duration-300 cursor-pointer text-lg transition-colors"
                                    onClick={toggleMobileMenu}
                                >
                                    <Link to={path}>{text}</Link>
                                </li>
                            ))}
                        </ul>

                        {!user ? (
                            <>
                                <div className="flex items-center space-x-2 text-sm">
                                    <Link to="/login" className="hover:text-[#eba016] duration-300 cursor-pointer transition-colors">Login</Link>
                                    <span className="text-gray-400">/</span>
                                    <Link to="/signup" className="hover:text-[#eba016] duration-300 cursor-pointer transition-colors">Signup</Link>
                                </div>
                                <button
                                    onClick={() => { navigate("/signup"); setMenu(false); }}
                                    className="px-6 py-3 bg-gradient-to-r from-[#eba016] to-[#f4b942] hover:from-[#d4941a] hover:to-[#eba016] text-white rounded-full transition-all duration-300 transform hover:scale-105 shadow-lg">
                                    Join Now
                                </button>
                            </>
                        ) : (
                            <div className="space-y-4 text-center">
                                <div className="flex items-center justify-center space-x-3">
                                    {user?.profilePicture ? (
                                        <img
                                            className="h-12 w-12 rounded-full border-2 border-[#eba016]"
                                            src={user.profilePicture}
                                            alt=""
                                        />
                                    ) : (
                                        <div className="h-12 w-12 rounded-full bg-gradient-to-r from-[#eba016] to-[#f4b942] flex items-center justify-center">
                                            <span className="text-sm font-semibold text-white">
                                                {user?.firstName?.charAt(0)}
                                                {user?.lastName?.charAt(0)}
                                            </span>
                                        </div>
                                    )}
                                    <div>
                                        <p className="text-lg font-semibold">{user?.firstName} {user?.lastName}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => { onLogout(); setMenu(false); }}
                                    className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-full transition-colors">
                                    Sign out
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
};

export default Navbar;