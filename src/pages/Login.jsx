import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { login, clearError } from '../features/authSlice';
import toast from 'react-hot-toast';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { loading, error, isAuthenticated } = useSelector((state) => state.auth);

    useEffect(() => {
        if (isAuthenticated) {
            toast.success('Successfully logged in!', { id: 'login-success' });
            navigate('/');
        }
        if (error) {
            toast.error(error, { id: 'login-error' });
            dispatch(clearError());
        }
    }, [isAuthenticated, error, navigate, dispatch]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        await dispatch(login({ email, password }));
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-900 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
            {/* Background Decorations */}
            <div className="absolute top-0 right-0 -mr-20 -mt-20 w-[600px] h-[600px] bg-primary-600/20 rounded-full blur-[120px]"></div>
            <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-[400px] h-[400px] bg-blue-600/10 rounded-full blur-[100px]"></div>

            <div className="max-w-md w-full space-y-12 relative z-10">
                <div className="text-center">
                    <h2 className="text-5xl font-black text-white tracking-tighter mb-4">
                        Welcome <span className="gradient-text">Back.</span>
                    </h2>
                    <p className="text-slate-400 font-medium">
                        Log in to your premium BikeBid account
                    </p>
                </div>

                <form className="card !bg-white/80 backdrop-blur-xl border-white/20 p-10 space-y-8" onSubmit={handleSubmit}>

                    <div className="space-y-6">
                        <div>
                            <label htmlFor="email" className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 mb-2">
                                Email Address
                            </label>
                            <input
                                id="email"
                                type="email"
                                required
                                className="input-field !bg-slate-50/50"
                                placeholder="name@company.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 mb-2">
                                Password
                            </label>
                            <input
                                id="password"
                                type="password"
                                required
                                className="input-field !bg-slate-50/50"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full btn-primary !rounded-2xl !py-4 shadow-2xl shadow-primary-500/30"
                    >
                        {loading ? 'AUTHENTICATING...' : 'SIGN IN'}
                    </button>

                    <div className="text-center pt-4">
                        <p className="text-sm text-slate-500 font-medium">
                            First time here?{' '}
                            <Link to="/register" className="font-black text-primary-600 hover:text-primary-500 underline underline-offset-4">
                                Create Account
                            </Link>
                        </p>
                    </div>
                </form>
            </div>
        </div>
    );
}
