import React from 'react';
import { motion } from 'motion/react';
import { ArrowRight, BookOpen, Calendar, Search, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function LandingPage() {
    return (
        <div className="min-h-screen bg-[#F8F7FF] overflow-hidden">
            {/* Navigation */}
            <nav className="flex items-center justify-between px-8 py-6 max-w-7xl mx-auto">
                <div className="flex items-center gap-2">
                    <div className="w-10 h-10 bg-[#7C3AED] rounded-xl flex items-center justify-center">
                        <BookOpen className="text-white w-6 h-6" />
                    </div>
                    <span className="text-xl font-bold tracking-tight text-[#1F2937]">CampusFlow</span>
                </div>
                <div className="hidden md:flex items-center gap-8 text-sm font-medium text-[#4B5563]">
                    <a href="#features" className="hover:text-[#7C3AED] transition-colors">Features</a>
                    <a href="#about" className="hover:text-[#7C3AED] transition-colors">About</a>
                    <Link to="/login" className="px-6 py-2.5 bg-[#7C3AED] text-white rounded-full hover:bg-[#6D28D9] transition-all shadow-lg shadow-purple-200">
                        Get Started
                    </Link>
                </div>
            </nav>

            {/* Hero Section */}
            <main className="max-w-7xl mx-auto px-8 pt-12 pb-24 flex flex-col items-center text-center">
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                >
                    <h1 className="text-6xl md:text-7xl font-bold text-[#1F2937] leading-[1.1] tracking-tight mb-8">
                        Manage Your <br />
                        <span className="text-[#7C3AED]">Campus Life</span> <br />
                        with Ease.
                    </h1>
                    <p className="text-lg text-[#6B7280] max-w-2xl mx-auto mb-10 leading-relaxed">
                        The all-in-one centralized ERP platform for students and faculty. 
                        Streamline academics, events, and utilities in one unified, modern workspace.
                    </p>
                    <div className="flex items-center justify-center gap-4">
                        <Link to="/login" className="px-8 py-4 bg-[#7C3AED] text-white rounded-full font-semibold flex items-center gap-2 hover:bg-[#6D28D9] transition-all group shadow-xl shadow-purple-200">
                            Get Started <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </Link>
                    </div>

                    <div className="mt-16 flex flex-col items-center gap-4">
                        <div className="flex -space-x-3">
                            {[1, 2, 3, 4].map((i) => (
                                <div key={i} className="w-12 h-12 rounded-full border-4 border-white bg-gray-200 overflow-hidden">
                                    <img src={`https://picsum.photos/seed/user${i}/100/100`} alt="user" referrerPolicy="no-referrer" />
                                </div>
                            ))}
                        </div>
                        <p className="text-sm text-[#6B7280]">
                            <span className="font-bold text-[#1F2937]">2+</span> Students already joined
                        </p>
                    </div>
                </motion.div>

            </main>

            {/* Features Grid */}
            <section id="features" className="bg-white py-24 px-8">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-20">
                        <h2 className="text-4xl font-bold text-[#1F2937] mb-4">Everything you need</h2>
                        <p className="text-[#6B7280]">Powerful features to help you manage your academic journey.</p>
                    </div>
                    <div className="grid md:grid-cols-3 gap-8">
                        <FeatureCard 
                            icon={<ShieldCheck className="w-6 h-6 text-green-500" />}
                            title="Secure Auth"
                            description="Role-based access control for students, faculty, and administrators."
                        />
                        <FeatureCard 
                            icon={<Calendar className="w-6 h-6 text-blue-500" />}
                            title="Event Management"
                            description="Stay updated with club auditions, hackathons, and cultural events."
                        />
                        <FeatureCard 
                            icon={<Search className="w-6 h-6 text-orange-500" />}
                            title="Lost & Found"
                            description="A centralized system to report and claim lost items on campus."
                        />
                    </div>
                </div>
            </section>
        </div>
    );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
    return (
        <div className="p-8 rounded-[32px] bg-[#F9FAFB] border border-gray-100 hover:shadow-xl transition-all group">
            <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 transition-transform">
                {icon}
            </div>
            <h3 className="text-xl font-bold text-[#1F2937] mb-3">{title}</h3>
            <p className="text-[#6B7280] leading-relaxed">{description}</p>
        </div>
    );
}
