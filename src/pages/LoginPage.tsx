import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { BookOpen, Lock, Mail } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json().catch(() => ({ message: 'Login failed' }));
            if (response.ok) {
                login(data.token, data.user);
                navigate('/dashboard');
            } else {
                setError(data.message || 'Login failed');
            }
        } catch (err) {
            setError('Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#F8F7FF] flex items-center justify-center p-6">
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md bg-white rounded-[40px] p-10 shadow-2xl shadow-purple-100 border border-white"
            >
                <div className="flex flex-col items-center mb-10">
                    <div className="w-16 h-16 bg-[#7C3AED] rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-purple-200">
                        <BookOpen className="text-white w-8 h-8" />
                    </div>
                    <h1 className="text-3xl font-bold text-[#1F2937]">Welcome Back</h1>
                    <p className="text-[#6B7280] mt-2">Login to access your campus portal</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-semibold text-[#374151] mb-2 ml-1">Email Address</label>
                        <div className="relative">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#9CA3AF]" />
                            <input 
                                type="email" 
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full pl-12 pr-4 py-4 bg-[#F9FAFB] border border-[#E5E7EB] rounded-2xl focus:ring-2 focus:ring-[#7C3AED] focus:border-transparent outline-none transition-all"
                                placeholder="name@college.edu"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-[#374151] mb-2 ml-1">Password</label>
                        <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#9CA3AF]" />
                            <input 
                                type="password" 
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full pl-12 pr-4 py-4 bg-[#F9FAFB] border border-[#E5E7EB] rounded-2xl focus:ring-2 focus:ring-[#7C3AED] focus:border-transparent outline-none transition-all"
                                placeholder="••••••••"
                            />
                        </div>
                    </div>

                    {error && (
                        <p className="text-red-500 text-sm text-center font-medium bg-red-50 py-2 rounded-xl">{error}</p>
                    )}

                    <button 
                        type="submit"
                        disabled={loading}
                        className="w-full py-4 bg-[#7C3AED] text-white rounded-2xl font-bold text-lg hover:bg-[#6D28D9] transition-all shadow-lg shadow-purple-200 disabled:opacity-50"
                    >
                        {loading ? 'Logging in...' : 'Login'}
                    </button>
                </form>

                <div className="mt-8 text-center text-sm text-[#6B7280]">
                    Don't have an account? <span className="text-[#7C3AED] font-bold cursor-pointer hover:underline">Contact Admin</span>
                </div>
            </motion.div>
        </div>
    );
}
