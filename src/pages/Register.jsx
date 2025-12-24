import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { register, clearError } from '../features/authSlice';

export default function Register() {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        role: 'BUYER',
    });
    const [passwordError, setPasswordError] = useState('');
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { loading, error, isAuthenticated } = useSelector((state) => state.auth);

    useEffect(() => {
        if (isAuthenticated) {
            navigate('/');
        }
        return () => dispatch(clearError());
    }, [isAuthenticated, navigate, dispatch]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        if (e.target.name === 'confirmPassword' || e.target.name === 'password') {
            setPasswordError('');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (formData.password !== formData.confirmPassword) {
            setPasswordError('Passwords do not match');
            return;
        }

        const { confirmPassword, ...registerData } = formData;
        await dispatch(register(registerData));
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-900 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
            {/* Background Decorations */}
            <div className="absolute top-0 left-0 -ml-20 -mt-20 w-[600px] h-[600px] bg-primary-600/20 rounded-full blur-[120px]"></div>
            <div className="absolute bottom-0 right-0 -mr-20 -mb-20 w-[400px] h-[400px] bg-blue-600/10 rounded-full blur-[100px]"></div>

            <div className="max-w-md w-full space-y-12 relative z-10">
                <div className="text-center">
                    <h2 className="text-5xl font-black text-white tracking-tighter mb-4">
                        Join the <span className="gradient-text">Elite.</span>
                    </h2>
                    <p className="text-slate-400 font-medium">
                        Create your premium BikeBid profile
                    </p>
                </div>

                <form className="card !bg-white/80 backdrop-blur-xl border-white/20 p-10 space-y-8" onSubmit={handleSubmit}>
                    {error && (
                        <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-2xl text-sm font-bold animate-shake">
                            ⚠️ {error}
                        </div>
                    )}

                    <div className="space-y-6">
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 mb-2">
                                Full Name
                            </label>
                            <input
                                name="name"
                                type="text"
                                required
                                className="input-field !bg-slate-50/50"
                                placeholder="John Doe"
                                value={formData.name}
                                onChange={handleChange}
                            />
                        </div>

                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 mb-2">
                                Email Address
                            </label>
                            <input
                                name="email"
                                type="email"
                                required
                                className="input-field !bg-slate-50/50"
                                placeholder="name@company.com"
                                value={formData.email}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 mb-2">
                                    Password
                                </label>
                                <input
                                    name="password"
                                    type="password"
                                    required
                                    className="input-field !bg-slate-50/50"
                                    placeholder="••••••••"
                                    value={formData.password}
                                    onChange={handleChange}
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 mb-2">
                                    Confirm
                                </label>
                                <input
                                    name="confirmPassword"
                                    type="password"
                                    required
                                    className="input-field !bg-slate-50/50"
                                    placeholder="••••••••"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                        {passwordError && (
                            <p className="text-xs text-red-500 font-bold ml-4">{passwordError}</p>
                        )}

                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 mb-2">
                                Account Type
                            </label>
                            <div className="flex bg-slate-100 p-1.5 rounded-2xl">
                                {['BUYER', 'SELLER'].map((r) => (
                                    <button
                                        key={r}
                                        type="button"
                                        onClick={() => setFormData({ ...formData, role: r })}
                                        className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${formData.role === r ? 'bg-white text-primary-600 shadow-md' : 'text-slate-500 hover:text-slate-700'}`}
                                    >
                                        {r}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full btn-primary !rounded-2xl !py-4 shadow-2xl shadow-primary-500/30"
                    >
                        {loading ? 'CREATING PROFILE...' : 'SIGN UP'}
                    </button>

                    <div className="text-center pt-4">
                        <p className="text-sm text-slate-500 font-medium">
                            Joined before?{' '}
                            <Link to="/login" className="font-black text-primary-600 hover:text-primary-500 underline underline-offset-4">
                                Sign In
                            </Link>
                        </p>
                    </div>
                </form>
            </div>
        </div>
    );
}
