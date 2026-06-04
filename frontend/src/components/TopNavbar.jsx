import { useState, useRef, useEffect } from 'react'
import { NavLink } from 'react-router-dom'
import { Search, User, LogOut, LogIn } from 'lucide-react'
import LanguageSwitcher from './LanguageSwitcher'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'

export default function TopNavbar() {
    const { user, logout } = useAuth()
    const { t } = useLanguage()
    const [isProfileOpen, setIsProfileOpen] = useState(false)
    const [isSearchOpen, setIsSearchOpen] = useState(false)
    const profileRef = useRef(null)
    const searchRef = useRef(null)

    const handleLogout = (e) => {
        e.preventDefault()
        logout()
        setIsProfileOpen(false)
    }

    // Close dropdowns on outside click
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (profileRef.current && !profileRef.current.contains(event.target)) {
                setIsProfileOpen(false)
            }
            if (searchRef.current && !searchRef.current.contains(event.target)) {
                setIsSearchOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    return (
        <header className="fixed w-full left-0 top-0 z-[1000] bg-white/85 backdrop-blur-[10px] border-b border-black/5 h-[72px] flex items-center justify-center">
            <div className="w-full max-w-[1280px] px-[20px] flex items-center justify-between">
                {/* Left */}
                <NavLink to="/landing" className="flex items-center gap-12 transition-opacity hover:opacity-80">
                    <div className="w-[32px] h-[32px] bg-[#4ade80] rounded-[8px] flex items-center justify-center shadow-sm shrink-0">
                        <span className="text-white text-[16px] leading-none">🌱</span>
                    </div>
                    <div className="flex flex-col justify-center">
                        <span className="font-bold text-[24px] tracking-tight text-appDarkText leading-none mt-2">XCI</span>
                        <span className="text-[12px] font-medium text-appSecondaryText hidden sm:block mt-2 leading-none">{t('landing.tagline') || 'Explainable Crop Intelligence'}</span>
                    </div>
                </NavLink>

                {/* Right */}
                <div className="flex items-center gap-24">
                    <nav className="hidden md:flex items-center gap-24">
                        <NavLink to={user ? "/dashboard" : "/"} className={({ isActive }) => `relative text-[15px] font-medium transition-colors duration-200 hover:text-primary-600 ${isActive ? 'text-primary-600' : 'text-appSecondaryText'} after:content-[''] after:absolute after:bottom-[-4px] after:left-0 after:h-[2px] after:bg-primary-600 after:transition-all after:duration-300 ${isActive ? 'after:w-full' : 'after:w-0 hover:after:w-full'}`}>
                            {t('nav.home') || 'Home'}
                        </NavLink>
                        <NavLink to="/features" className={({ isActive }) => `relative text-[15px] font-medium transition-colors duration-200 hover:text-primary-600 ${isActive ? 'text-primary-600' : 'text-appSecondaryText'} after:content-[''] after:absolute after:bottom-[-4px] after:left-0 after:h-[2px] after:bg-primary-600 after:transition-all after:duration-300 ${isActive ? 'after:w-full' : 'after:w-0 hover:after:w-full'}`}>
                            {t('nav.features') || 'Features'}
                        </NavLink>
                        <NavLink to="/recommend" className={({ isActive }) => `relative text-[15px] font-medium transition-colors duration-200 hover:text-primary-600 ${isActive ? 'text-primary-600' : 'text-appSecondaryText'} after:content-[''] after:absolute after:bottom-[-4px] after:left-0 after:h-[2px] after:bg-primary-600 after:transition-all after:duration-300 ${isActive ? 'after:w-full' : 'after:w-0 hover:after:w-full'}`}>
                            {t('nav.recommendation')}
                        </NavLink>
                    </nav>

                    {/* Search Bar */}
                    <div className="relative flex items-center" ref={searchRef}>
                        <div
                            className={`flex items-center bg-[#f8fafc]/80 border border-gray-200/50 rounded-pill transition-all duration-300 ease-in-out shadow-sm overflow-hidden ${isSearchOpen ? 'w-[250px] px-12 py-6' : 'w-[36px] h-[36px] justify-center cursor-pointer hover:bg-white/80'}`}
                            onClick={() => {
                                if (!isSearchOpen) setIsSearchOpen(true)
                            }}
                        >
                            <Search size={16} className={`text-appSecondaryText shrink-0 ${isSearchOpen ? 'mr-8' : ''}`} />
                            {isSearchOpen && (
                                <input
                                    type="text"
                                    placeholder={t('nav.search') || "Search crops, metrics..."}
                                    className="bg-transparent border-none outline-none text-[13px] text-appDarkText placeholder:text-appSecondaryText w-full animate-fade-in"
                                    autoFocus
                                />
                            )}
                        </div>
                    </div>

                    <LanguageSwitcher />

                    {/* Profile Section */}
                    <div className="relative" ref={profileRef}>
                        <button
                            onClick={() => setIsProfileOpen(!isProfileOpen)}
                            className="w-[36px] h-[36px] bg-primary-100 rounded-full flex items-center justify-center text-primary-700 hover:bg-primary-200 transition-colors border border-primary-200/50 shadow-sm"
                        >
                            <User size={18} />
                        </button>

                        {/* Dropdown Card */}
                        {isProfileOpen && (
                            <div className="absolute right-0 top-[115%] w-[210px] bg-white/95 backdrop-blur-[12px] rounded-[18px] shadow-[0_8px_30px_rgba(0,0,0,0.08)] border border-white z-50 animate-fade-in flex flex-col p-6">
                                {user ? (
                                    <>
                                        <div className="flex items-center gap-10 px-8 py-8 mb-4 bg-[#f8fafc]/50 rounded-[12px]">
                                            <div className="w-[36px] h-[36px] bg-[#dcfce7] rounded-full flex items-center justify-center text-[#15803d] font-bold text-[14px] shrink-0 border border-[#bbf7d0]">
                                                {user.name ? user.name.charAt(0).toUpperCase() : <User size={18} />}
                                            </div>
                                            <div className="flex flex-col min-w-0">
                                                <span className="text-[13.5px] font-bold text-appDarkText truncate leading-tight">{user.name || 'User'}</span>
                                                <span className="text-[11px] font-medium text-appSecondaryText truncate mt-1 leading-tight">{user.role || 'Farmer'}</span>
                                            </div>
                                        </div>
                                        <div className="px-2">
                                            <button
                                                onClick={handleLogout}
                                                className="w-full flex items-center gap-8 px-10 py-6 text-[13px] font-bold text-red-500 hover:bg-red-50 hover:text-red-600 rounded-[10px] transition-all duration-200"
                                            >
                                                <LogOut size={14} /> {t('nav.logout') || 'Logout'}
                                            </button>
                                        </div>
                                    </>
                                ) : (
                                    <div className="px-2">
                                        <NavLink
                                            to="/login"
                                            onClick={() => setIsProfileOpen(false)}
                                            className="w-full flex items-center gap-8 px-10 py-6 text-[13px] font-bold text-primary-700 hover:bg-primary-50 rounded-[10px] transition-colors"
                                        >
                                            <LogIn size={14} /> {t('auth.login') || 'Login'}
                                        </NavLink>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </header>
    )
}
