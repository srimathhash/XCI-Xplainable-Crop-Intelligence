import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { GoogleLogin, useGoogleLogin } from '@react-oauth/google'
import { useLanguage } from '../context/LanguageContext'
import { useAuth } from '../context/AuthContext'
import { loginUser, registerUser, googleAuth } from '../services/api'
import LanguageSwitcher from '../components/LanguageSwitcher'

export default function AuthPage({ isLoginRoute = true }) {
    const { t } = useLanguage()
    const navigate = useNavigate()
    const { login } = useAuth()

    const [isLogin, setIsLogin] = useState(isLoginRoute)

    // Sync state if deep-linked route changes
    useEffect(() => {
        setIsLogin(isLoginRoute)
    }, [isLoginRoute])

    const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'Farmer' })
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    const handleGoogleSuccess = async (credentialResponse) => {
        try {
            setLoading(true)
            setError('')
            const res = await googleAuth({
                token: credentialResponse.credential,
                role: formData.role // Defaults to Farmer if not set
            })
            // Google users are automatically verified in backend
            login(res.data.access_token, res.data.user)
            navigate('/recommend')
        } catch (err) {
            setError(err.response?.data?.detail || "Google authentication failed")
        } finally {
            setLoading(false)
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setLoading(true)

        try {
            if (isLogin) {
                const res = await loginUser({ email: formData.email, password: formData.password })
                login(res.data.access_token, res.data.user)
                navigate('/recommend')
            } else {
                await registerUser(formData)
                // Redirect to OTP page passing the email
                navigate('/otp', { state: { email: formData.email } })
            }
        } catch (err) {
            if (err.response?.status === 403) {
                // Not verified error, redirect to OTP page
                navigate('/otp', { state: { email: formData.email } })
            } else {
                let msg = isLogin ? t('errors.loginFailed') : t('errors.signupFailed')
                if (err.response?.data?.detail) {
                    if (typeof err.response.data.detail === 'string') {
                        msg = err.response.data.detail
                    } else if (Array.isArray(err.response.data.detail)) {
                        msg = err.response.data.detail[0]?.msg || msg
                    }
                }
                setError(msg)
            }
        } finally {
            setLoading(false)
        }
    }

    return (
        <div
            className="w-full min-h-screen flex items-center justify-center p-16 relative"
            style={{
                backgroundImage: `linear-gradient(rgba(10,40,20,0.55), rgba(10,40,20,0.55)), url('/farmer-bg.jpg')`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat'
            }}
        >
            <div
                className="flex flex-col items-center text-center mx-auto"
                style={{
                    width: '100%',
                    maxWidth: '420px', // slightly wider than 380 for better inner padding on desktop
                    padding: '40px',
                    borderRadius: '24px',
                    background: 'rgba(255,255,255,0.12)',
                    backdropFilter: 'blur(18px)',
                    WebkitBackdropFilter: 'blur(18px)',
                    boxShadow: '0 20px 60px rgba(0,0,0,0.2)'
                }}
            >
                <div style={{ fontSize: '24px', fontWeight: 700, color: '#ffffff', marginBottom: '24px', letterSpacing: '1px' }}>
                    🌱 XCI
                </div>

                <h2 style={{ color: 'white', marginBottom: '32px', fontSize: '24px', fontWeight: 600 }}>
                    {isLogin ? (t('auth.login') || 'Login') : (t('auth.signup') || 'Sign Up')}
                </h2>

                {error && (
                    <div className="w-full mb-24 p-16 rounded-[12px] text-center" style={{ backgroundColor: 'rgba(239,68,68,0.2)', color: '#fca5a5', border: '1px solid rgba(239,68,68,0.3)' }}>
                        {error}
                    </div>
                )}

                {/* Role Selector - Ultra-compact premium design */}
                <div className="w-full mb-16 flex justify-center">
                    <div className="w-[200px] flex gap-4 p-[2px] rounded-[10px]" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
                        {['Farmer', 'Researcher'].map(r => (
                            <button
                                key={r} type="button"
                                onClick={() => setFormData({ ...formData, role: r })}
                                className="flex-1 py-[3px] text-[11px] font-bold rounded-[8px] transition-all duration-300"
                                style={{
                                    background: formData.role === r ? 'rgba(255,255,255,0.15)' : 'transparent',
                                    color: formData.role === r ? 'white' : 'rgba(255,255,255,0.4)',
                                    boxShadow: formData.role === r ? '0 1px 4px rgba(0,0,0,0.1)' : 'none'
                                }}
                            >
                                {r}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="w-full mb-20 flex justify-center scale-[1.05]">
                    <GoogleLogin
                        onSuccess={handleGoogleSuccess}
                        onError={() => setError('Google sign in failed')}
                        theme="outline"
                        shape="pill"
                        size="large"
                        text={isLogin ? 'signin_with' : 'signup_with'}
                        width="300"
                    />
                </div>

                <div className="w-full relative mb-24 flex items-center">
                    <div className="flex-1 border-t" style={{ borderColor: 'rgba(255,255,255,0.2)' }}></div>
                    <span className="px-16 text-[12px] font-medium tracking-widest" style={{ color: 'rgba(255,255,255,0.6)' }}>
                        OR
                    </span>
                    <div className="flex-1 border-t" style={{ borderColor: 'rgba(255,255,255,0.2)' }}></div>
                </div>

                <form onSubmit={handleSubmit} className="w-full space-y-16">
                    {!isLogin && (
                        <div className="w-full">
                            <input
                                required type="text" placeholder={t('auth.name') || "Full Name"}
                                value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })}
                                style={{
                                    background: 'rgba(255,255,255,0.2)',
                                    border: '1px solid rgba(255,255,255,0.3)',
                                    borderRadius: '12px',
                                    padding: '12px 16px',
                                    color: 'white',
                                    width: '100%',
                                    outline: 'none',
                                    transition: 'border-color 0.2s'
                                }}
                                onFocus={(e) => e.target.style.borderColor = '#3FAE5A'}
                                onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.3)'}
                                className="placeholder-white/60"
                            />
                        </div>
                    )}

                    <div className="w-full">
                        <input
                            required type="email" placeholder={t('auth.email') || "Email Address"}
                            value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })}
                            style={{
                                background: 'rgba(255,255,255,0.2)',
                                border: '1px solid rgba(255,255,255,0.3)',
                                borderRadius: '12px',
                                padding: '12px 16px',
                                color: 'white',
                                width: '100%',
                                outline: 'none',
                                transition: 'border-color 0.2s'
                            }}
                            onFocus={(e) => e.target.style.borderColor = '#3FAE5A'}
                            onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.3)'}
                            className="placeholder-white/60"
                        />
                    </div>

                    <div className="w-full">
                        <input
                            required type="password" minLength="6" placeholder={t('auth.password') || "Password"}
                            value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })}
                            style={{
                                background: 'rgba(255,255,255,0.2)',
                                border: '1px solid rgba(255,255,255,0.3)',
                                borderRadius: '12px',
                                padding: '12px 16px',
                                color: 'white',
                                width: '100%',
                                outline: 'none',
                                transition: 'border-color 0.2s'
                            }}
                            onFocus={(e) => e.target.style.borderColor = '#3FAE5A'}
                            onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.3)'}
                            className="placeholder-white/60"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full mt-8 transition-transform transform hover:-translate-y-[2px]"
                        style={{
                            padding: '14px 24px',
                            borderRadius: '12px',
                            background: 'rgba(255,255,255,0.25)',
                            color: 'white',
                            fontSize: '16px',
                            fontWeight: 600,
                            border: '1px solid rgba(255,255,255,0.4)',
                            boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
                        }}
                    >
                        {loading ? <span className="spinner" style={{ borderColor: 'white', borderTopColor: 'transparent' }} /> : (isLogin ? (t('auth.loginBtn') || 'Login') : (t('auth.signupBtn') || 'Sign Up'))}
                    </button>
                </form>

                <div className="mt-24 text-center text-[14px]">
                    <span style={{ color: 'rgba(255,255,255,0.7)' }}>
                        {isLogin ? "Don't have an account? " : "Already have an account? "}
                    </span>
                    <button
                        type="button"
                        onClick={() => { setIsLogin(!isLogin); setError('') }}
                        className="font-semibold transition-colors ml-[4px] hover:underline"
                        style={{ color: 'white' }}
                    >
                        {isLogin ? "Sign Up" : "Log In"}
                    </button>
                </div>
            </div>
        </div>
    )
}
