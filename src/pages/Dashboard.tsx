import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { io } from 'socket.io-client';
import { 
    LayoutDashboard, BookOpen, Calendar, Search, CreditCard, 
    Bell, LogOut, User, GraduationCap, Clock, AlertCircle,
    ChevronRight, BookMarked, ShieldCheck, Users, BarChart3, FileText,
    MapPin, Phone, Award, QrCode, UserCircle, ArrowLeft, Plus, Target, Music, Trophy, Star, Image, Download, CheckCircle, X, Camera, FileUp,
    Library, Trash2, Home, AlertTriangle, Menu
} from 'lucide-react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Subject, AttendanceStats, AttendanceRecord } from '../types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

const safeJson = async (res: Response) => {
    const text = await res.text();
    try {
        return text ? JSON.parse(text) : null;
    } catch (e) {
        return null;
    }
};

export default function Dashboard() {
    const { user, logout, token } = useAuth();
    const navigate = useNavigate();
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('Dashboard');
    const [globalSearch, setGlobalSearch] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    useEffect(() => {
        if (!token) {
            navigate('/login');
            return;
        }

        if (user?.role === 'librarian') {
            setLoading(false);
            return;
        }

        const endpoint = user?.role === 'student' ? '/api/student/dashboard' : '/api/faculty/analysis';
        fetch(endpoint, {
            headers: { 'Authorization': `Bearer ${token}` }
        })
        .then(async res => {
            const data = await safeJson(res);
            if (!res.ok) {
                throw new Error(data?.message || 'Request failed');
            }
            return data;
        })
        .then(setData)
        .catch(err => console.error("Dashboard fetch error:", err))
        .finally(() => setLoading(false));
    }, [token, navigate, user?.role]);

    useEffect(() => {
        if (globalSearch.length > 1) {
            const delayDebounceFn = setTimeout(() => {
                fetch(`/api/students/search?q=${globalSearch}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                })
                .then(res => res.json())
                .then(setSearchResults)
                .catch(() => setSearchResults([]));
            }, 300);
            return () => clearTimeout(delayDebounceFn);
        } else {
            setSearchResults([]);
        }
    }, [globalSearch, token]);

    if (loading) return <div className="flex items-center justify-center min-h-screen bg-[#F8F7FF]">Loading...</div>;

    const renderContent = () => {
        switch (activeTab) {
            case 'Dashboard':
                if (user?.role === 'student') return <StudentDashboard data={data} user={user} />;
                if (user?.role === 'faculty') return <FacultyDashboard data={data} user={user} />;
                if (user?.role === 'librarian') return <LibrarianDashboard token={token!} />;
                return <FacultyDashboard data={data} user={user} />; // Default
            case 'Academic':
                return <AcademicDashboardView token={token!} />;
            case 'Study Materials':
                return <StudyMaterialsView token={token!} user={user!} />;
            case 'Events':
                return <EventsView token={token!} user={user!} />;
            case 'Timetable':
                return <TimetableView token={token!} user={user!} />;
            case 'Lost & Found':
                return <LostFoundView token={token!} user={user!} />;
            case 'Fees':
                return user?.role === 'student' || user?.role === 'admin' ? <FeesView token={token!} /> : <div className="p-8 text-center text-gray-500">Access Denied: Fees are restricted to Students and Admins.</div>;
            case 'Admin Panel':
                return user?.role === 'admin' ? <AdminPanelView token={token!} /> : <div className="p-8 text-center text-gray-500">Access Denied: Admin only.</div>;
            case 'Alumni':
                return <AlumniView token={token!} user={user!} />;
            case 'Book Scanner':
                return <BookScannerView token={token!} />;
            case 'Admin Profile':
                return user?.role === 'admin' ? <AdminProfileView token={token!} setActiveTab={setActiveTab} /> : <div className="p-8 text-center text-gray-500">Access Denied: Admin only.</div>;
            case 'Library':
                return <LibraryView token={token!} user={user!} setActiveTab={setActiveTab} />;
            case 'Attendance':
                return <AttendanceView token={token!} user={user!} setActiveTab={setActiveTab} />;
            case 'Results':
                return <ResultsView token={token!} user={user!} setActiveTab={setActiveTab} />;
            case 'Profile':
                return <ProfileView token={token!} user={user!} />;
            default:
                return user?.role === 'student' ? <StudentDashboard data={data} user={user} /> : <FacultyDashboard data={data} user={user} />;
        }
    };

    return (
        <div className="min-h-screen bg-[#F8F7FF] flex relative overflow-x-hidden">
            {/* Mobile Backdrop */}
            {isMobileMenuOpen && (
                <div 
                    className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`
                fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-gray-100 flex flex-col p-6 transition-transform duration-300 ease-in-out lg:sticky lg:top-0 lg:translate-x-0 h-screen
                ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
            `}>
                <div className="flex items-center justify-between mb-10 px-2">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-[#7C3AED] rounded-xl flex items-center justify-center">
                            <BookOpen className="text-white w-6 h-6" />
                        </div>
                        <span className="text-xl font-bold text-[#1F2937]">CampusFlow</span>
                    </div>
                    <button 
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="lg:hidden p-2 text-gray-400 hover:bg-gray-50 rounded-xl transition-all"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <nav className="space-y-2 flex-1 overflow-y-auto">
                    <SidebarLink icon={<LayoutDashboard />} label="Dashboard" active={activeTab === 'Dashboard'} onClick={() => { setActiveTab('Dashboard'); setIsMobileMenuOpen(false); }} />
                    <SidebarLink icon={<GraduationCap />} label="Academic" active={activeTab === 'Academic'} onClick={() => { setActiveTab('Academic'); setIsMobileMenuOpen(false); }} />
                    <SidebarLink icon={<Clock />} label="Timetable" active={activeTab === 'Timetable'} onClick={() => { setActiveTab('Timetable'); setIsMobileMenuOpen(false); }} />
                    <SidebarLink icon={<User />} label="Profile" active={activeTab === 'Profile'} onClick={() => { setActiveTab('Profile'); setIsMobileMenuOpen(false); }} />
                    <SidebarLink icon={<BarChart3 />} label="Attendance" active={activeTab === 'Attendance'} onClick={() => { setActiveTab('Attendance'); setIsMobileMenuOpen(false); }} />
                    <SidebarLink icon={<FileText />} label="Results" active={activeTab === 'Results'} onClick={() => { setActiveTab('Results'); setIsMobileMenuOpen(false); }} />
                    <SidebarLink icon={<BookMarked />} label="Study Materials" active={activeTab === 'Study Materials'} onClick={() => { setActiveTab('Study Materials'); setIsMobileMenuOpen(false); }} />
                    <SidebarLink icon={<Calendar />} label="Events" active={activeTab === 'Events'} onClick={() => { setActiveTab('Events'); setIsMobileMenuOpen(false); }} />
                    <SidebarLink icon={<Search />} label="Lost & Found" active={activeTab === 'Lost & Found'} onClick={() => { setActiveTab('Lost & Found'); setIsMobileMenuOpen(false); }} />
                    <SidebarLink icon={<Award />} label="Alumni" active={activeTab === 'Alumni'} onClick={() => { setActiveTab('Alumni'); setIsMobileMenuOpen(false); }} />
                    <SidebarLink icon={<BookOpen />} label="Library" active={activeTab === 'Library'} onClick={() => { setActiveTab('Library'); setIsMobileMenuOpen(false); }} />
                    {(user?.role === 'student' || user?.role === 'admin') && (
                        <SidebarLink icon={<CreditCard />} label="Fees" active={activeTab === 'Fees'} onClick={() => { setActiveTab('Fees'); setIsMobileMenuOpen(false); }} />
                    )}
                    {user?.role === 'admin' && (
                        <>
                            <SidebarLink icon={<ShieldCheck />} label="Admin Panel" active={activeTab === 'Admin Panel'} onClick={() => { setActiveTab('Admin Panel'); setIsMobileMenuOpen(false); }} />
                            <SidebarLink icon={<UserCircle />} label="Admin Profile" active={activeTab === 'Admin Profile'} onClick={() => { setActiveTab('Admin Profile'); setIsMobileMenuOpen(false); }} />
                        </>
                    )}
                </nav>

                <div className="pt-6 border-t border-gray-100">
                    <button 
                        onClick={logout}
                        className="flex items-center gap-3 w-full px-4 py-3 text-red-500 font-medium hover:bg-red-50 rounded-2xl transition-all"
                    >
                        <LogOut className="w-5 h-5" /> Logout
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-4 md:p-8 lg:p-12 overflow-y-auto">
                <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
                    <div className="flex items-center justify-between w-full md:w-auto">
                        <div className="flex items-center gap-4">
                            <button 
                                onClick={() => setIsMobileMenuOpen(true)}
                                className="lg:hidden p-2 bg-white border border-gray-100 rounded-xl shadow-sm text-gray-500"
                            >
                                <Menu className="w-6 h-6" />
                            </button>
                            <div>
                                <h1 className="text-2xl md:text-3xl font-bold text-[#1F2937]">Welcome, {user?.name}</h1>
                                <p className="text-[#6B7280] mt-1 text-sm md:text-base">Role: <span className="capitalize font-semibold text-[#7C3AED]">{user?.role}</span></p>
                            </div>
                        </div>
                        
                        <div className="flex items-center gap-2 md:hidden">
                             <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center border border-purple-200 cursor-pointer" onClick={() => setActiveTab('Profile')}>
                                 <User className="text-[#7C3AED] w-5 h-5" />
                             </div>
                        </div>
                    </div>
                    
                    <div className="flex flex-1 max-w-2xl w-full items-center gap-4">
                        {(user?.role === 'admin' || user?.role === 'faculty') && (
                            <div className="relative flex-1">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                                    <Search className="w-5 h-5" />
                                </div>
                                <input 
                                    type="text"
                                    placeholder="Search student by name or roll number..."
                                    value={globalSearch}
                                    onChange={(e) => {
                                        setGlobalSearch(e.target.value);
                                        setIsSearching(true);
                                    }}
                                    onFocus={() => setIsSearching(true)}
                                    className="w-full pl-12 pr-4 py-4 bg-white border border-gray-100 rounded-[24px] shadow-sm outline-none focus:ring-2 focus:ring-purple-500 transition-all text-sm"
                                />
                                
                                {isSearching && globalSearch.length > 1 && (
                                    <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-3xl shadow-xl border border-gray-100 z-[100] overflow-hidden max-h-96 overflow-y-auto">
                                        <div className="p-4 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
                                            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Search Results</span>
                                            <button onClick={() => setIsSearching(false)} className="text-xs font-bold text-purple-600">Close</button>
                                        </div>
                                        {searchResults.length > 0 ? (
                                            <div className="divide-y divide-gray-50">
                                                {searchResults.map((s, i) => (
                                                    <div 
                                                        key={i} 
                                                        className="p-4 hover:bg-purple-50 cursor-pointer transition-colors group"
                                                        onClick={() => {
                                                            setGlobalSearch('');
                                                            setIsSearching(false);
                                                            // Optionally navigate to a student profile or show details
                                                            alert(`Student: ${s.name}\nRoll: ${s.roll_number}\nDept: ${s.department}\nCGPA: ${s.cgpa}`);
                                                        }}
                                                    >
                                                        <div className="flex justify-between items-center">
                                                            <div>
                                                                <p className="font-bold text-[#1F2937] group-hover:text-[#7C3AED]">{s.name}</p>
                                                                <p className="text-xs text-gray-500">Roll: {s.roll_number} • {s.department}</p>
                                                            </div>
                                                            <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-[#7C3AED]" />
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="p-8 text-center text-gray-400 italic text-sm">
                                                No students found matching "{globalSearch}"
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                            <div className="flex items-center gap-3">
                                <button className="w-12 h-12 bg-white border border-gray-100 rounded-2xl flex items-center justify-center relative shadow-sm hover:bg-gray-50 transition-all">
                                    <Bell className="w-6 h-6 text-[#4B5563]" />
                                    <span className="absolute top-3 right-3 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white" />
                                </button>
                                <div className="group relative">
                                    <div className="w-12 h-12 bg-purple-100 rounded-2xl flex items-center justify-center border border-purple-200 cursor-pointer">
                                        <User className="text-[#7C3AED] w-6 h-6" />
                                    </div>
                                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-gray-100 invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all z-50">
                                        <div className="p-2">
                                            <button 
                                                onClick={() => setActiveTab('Profile')}
                                                className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-gray-600 hover:bg-purple-50 rounded-xl transition-all"
                                            >
                                                <User className="w-4 h-4" /> My Profile
                                            </button>
                                            <button 
                                                onClick={logout}
                                                className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 rounded-xl transition-all font-medium"
                                            >
                                                <LogOut className="w-4 h-4" /> Logout
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                    </div>
                </header>

                {renderContent()}
            </main>
        </div>
    );
}

function StudentDashboard({ data, user }: { data: any, user: any }) {
    const { token } = useAuth();
    const totalAttendanceCount = data?.attendance?.length > 0 
        ? Math.round(data.attendance.reduce((acc: number, curr: any) => acc + (curr.percentage || 0), 0) / data.attendance.length) 
        : 0;

    const stats = [
        { label: 'CGPA', value: data?.student?.cgpa || '0.0', icon: <GraduationCap className="w-6 h-6 text-purple-500" />, color: 'bg-purple-50' },
        { label: 'Semester', value: data?.student?.semester || '1', icon: <BookOpen className="w-6 h-6 text-blue-500" />, color: 'bg-blue-50' },
        { label: 'Attendance', value: `${totalAttendanceCount}%`, icon: <Clock className="w-6 h-6 text-green-500" />, color: 'bg-green-50' },
        { label: 'Backlogs', value: data?.student?.backlogs || '0', icon: <AlertCircle className="w-6 h-6 text-red-500" />, color: 'bg-red-50' },
    ];

    const [currentCourses, setCurrentCourses] = useState<any[]>([]);

    useEffect(() => {
        if (data?.attendance) {
            const coursesWithProgress = data.attendance.map((a: any) => ({
                code: a.name.split(' ')[0],
                name: a.name,
                credits: 4,
                progress: Math.round(a.percentage || 0)
            }));
            setCurrentCourses(coursesWithProgress);
        } else if (token) {
            fetch('/api/academic/courses', {
                headers: { 'Authorization': `Bearer ${token}` }
            })
            .then(res => res.json())
            .then(d => {
                const coursesWithProgress = d.courses?.map((c: any) => ({
                    ...c,
                    progress: Math.floor(Math.random() * 20) + 75 // Fallback mock
                }));
                setCurrentCourses(coursesWithProgress || []);
            })
            .catch(console.error);
        }
    }, [data?.attendance, token]);

    return (
        <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                {stats.map((stat, i) => (
                    <motion.div 
                        key={i}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="bg-white p-6 rounded-[32px] shadow-sm border border-gray-50 flex items-center gap-5"
                    >
                        <div className={`w-14 h-14 ${stat.color} rounded-2xl flex items-center justify-center`}>
                            {stat.icon}
                        </div>
                        <div>
                            <p className="text-sm font-medium text-[#6B7280]">{stat.label}</p>
                            <p className="text-2xl font-bold text-[#1F2937]">{stat.value}</p>
                        </div>
                    </motion.div>
                ))}
            </div>

            <div className="grid lg:grid-cols-3 gap-10">
                <div className="lg:col-span-2 space-y-10">
                    <div className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-50">
                        <div className="flex justify-between items-center mb-8">
                            <h2 className="text-xl font-bold text-[#1F2937]">Academic Progress</h2>
                            <div className="flex gap-2">
                                <span className="px-3 py-1 bg-purple-50 text-purple-600 text-[10px] font-bold rounded-full uppercase tracking-wider">VTU 2022 Scheme</span>
                                <span className="px-3 py-1 bg-blue-50 text-blue-600 text-[10px] font-bold rounded-full uppercase tracking-wider">Semester {data?.student?.semester}</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {currentCourses.map((course, i) => (
                                <div key={i} className="p-6 bg-gray-50 rounded-3xl group hover:bg-[#7C3AED] transition-all duration-300">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1 group-hover:text-purple-200">{course.code}</p>
                                            <h3 className="font-bold text-[#1F2937] group-hover:text-white">{course.name}</h3>
                                        </div>
                                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm font-bold text-[#7C3AED]">
                                            {course.credits}
                                        </div>
                                    </div>
                                    <div className="w-full h-2 bg-gray-200 rounded-full mb-2 group-hover:bg-purple-400">
                                        <div 
                                            className="h-full bg-[#7C3AED] rounded-full group-hover:bg-white" 
                                            style={{ width: `${course.progress}%` }} 
                                        />
                                    </div>
                                    <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-[#9CA3AF] group-hover:text-purple-100">
                                        <span>Attendance: {course.progress}%</span>
                                        <span>Target: 85%</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-50">
                        <h2 className="text-xl font-bold text-[#1F2937] mb-8">Performance History</h2>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={[
                                    { name: 'Sem 1', val: 7.5 },
                                    { name: 'Sem 2', val: 8.2 },
                                    { name: 'Sem 3', val: 8.0 },
                                    { name: 'Sem 4', val: 8.5 },
                                ]}>
                                    <defs>
                                        <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#7C3AED" stopOpacity={0.1}/>
                                            <stop offset="95%" stopColor="#7C3AED" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 12 }} />
                                    <YAxis hide />
                                    <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                                    <Area type="monotone" dataKey="val" stroke="#7C3AED" strokeWidth={3} fillOpacity={1} fill="url(#colorVal)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                <div className="space-y-10">
                    <div className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-50">
                        <h2 className="text-xl font-bold text-[#1F2937] mb-6">Notifications</h2>
                        <div className="space-y-6">
                            {data?.notifications?.map((notif: any, i: number) => (
                                <div key={i} className="flex gap-4">
                                    <div className="w-10 h-10 bg-orange-50 rounded-xl flex-shrink-0 flex items-center justify-center">
                                        <Bell className="w-5 h-5 text-orange-500" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-[#1F2937]">{notif.title}</p>
                                        <p className="text-xs text-[#6B7280] mt-1">{notif.message}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-[#1F2937] p-8 rounded-[40px] text-white shadow-xl shadow-gray-200">
                        <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center mb-6">
                            <GraduationCap className="text-white w-6 h-6" />
                        </div>
                        <h3 className="text-lg font-bold mb-2">Degree Status</h3>
                        <p className="text-gray-400 text-sm mb-6 leading-relaxed">
                            You are currently in your 4th semester. Maintain 75%+ attendance to be eligible for IA-1 exams.
                        </p>
                        <div className="flex justify-between items-center bg-white/5 p-4 rounded-2xl border border-white/10">
                            <div>
                                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Total Credits</p>
                                <p className="text-2xl font-bold">82 / 160</p>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Earned</p>
                                <p className="text-2xl font-bold text-green-400">51%</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

function FacultyDashboard({ data, user }: { data: any, user: any }) {
    const stats = [
        { label: 'Excelling (9+)', value: data?.stats?.excelling || '0', icon: <GraduationCap className="w-6 h-6 text-green-500" />, color: 'bg-green-50' },
        { label: 'Good (7.5-9)', value: data?.stats?.good || '0', icon: <ShieldCheck className="w-6 h-6 text-blue-500" />, color: 'bg-blue-50' },
        { label: 'Average (6-7.5)', value: data?.stats?.average || '0', icon: <Users className="w-6 h-6 text-orange-500" />, color: 'bg-orange-50' },
        { label: 'Weak (< 6)', value: data?.stats?.weak || '0', icon: <AlertCircle className="w-6 h-6 text-red-500" />, color: 'bg-red-50' },
    ];

    return (
        <div className="space-y-10">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, i) => (
                    <div key={i} className="bg-white p-6 rounded-[32px] shadow-sm border border-gray-50 flex items-center gap-5">
                        <div className={`w-14 h-14 ${stat.color} rounded-2xl flex items-center justify-center`}>
                            {stat.icon}
                        </div>
                        <div>
                            <p className="text-sm font-medium text-[#6B7280]">{stat.label}</p>
                            <p className="text-2xl font-bold text-[#1F2937]">{stat.value}</p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid lg:grid-cols-2 gap-10">
                <div className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-50">
                    <h2 className="text-xl font-bold text-[#1F2937] mb-6">Top Performing Students</h2>
                    <div className="space-y-4">
                        {data?.topStudents?.map((s: any, i: number) => (
                            <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center font-bold text-[#7C3AED]">
                                        {i + 1}
                                    </div>
                                    <div>
                                        <p className="font-bold text-[#1F2937]">{s.name}</p>
                                        <p className="text-xs text-[#6B7280]">{s.department}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-[#7C3AED]">{s.cgpa}</p>
                                    <p className="text-[10px] uppercase tracking-wider text-[#9CA3AF] font-bold">CGPA</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="mt-10 bg-white p-8 rounded-[40px] shadow-sm border border-gray-50">
                <h2 className="text-xl font-bold text-[#1F2937] mb-6">Notifications & Alerts</h2>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {data?.notifications?.map((notif: any, i: number) => (
                        <div key={i} className="p-6 bg-gray-50 rounded-3xl border border-gray-100">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                                    <Bell className="w-5 h-5 text-orange-500" />
                                </div>
                                <p className="font-bold text-[#1F2937] text-sm">{notif.title}</p>
                            </div>
                            <p className="text-xs text-[#6B7280] leading-relaxed">{notif.message}</p>
                        </div>
                    ))}
                    {(!data?.notifications || data.notifications.length === 0) && (
                        <div className="col-span-full py-10 text-center text-gray-400 italic">
                            No new notifications.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function AttendanceModal({ token }: { token: string }) {
    const [isOpen, setIsOpen] = useState(false);
    const [status, setStatus] = useState<'present' | 'absent'>('present');
    const [studentId, setStudentId] = useState('');
    const [subjectId, setSubjectId] = useState('');
    const [loading, setLoading] = useState(false);
    const [students, setStudents] = useState<any[]>([]);
    const [subjects, setSubjects] = useState<any[]>([]);
    const [modalSearch, setModalSearch] = useState('');

    useEffect(() => {
        if (isOpen) {
            fetch('/api/admin/students', { headers: { 'Authorization': `Bearer ${token}` } })
                .then(async res => (res.ok ? await safeJson(res) : []) || [])
                .then(setStudents);
            fetch('/api/subjects', { headers: { 'Authorization': `Bearer ${token}` } })
                .then(async res => (res.ok ? await safeJson(res) : []) || [])
                .then(data => {
                    setSubjects(data);
                    if (data.length > 0) setSubjectId(data[0].id.toString());
                });
        }
    }, [isOpen, token]);

    const modalFilteredStudents = students.filter(s => 
        !modalSearch || 
        s.name?.toLowerCase().includes(modalSearch.toLowerCase()) ||
        s.roll_number?.toLowerCase().includes(modalSearch.toLowerCase())
    );

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await fetch('/api/faculty/attendance', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` 
                },
                body: JSON.stringify({
                    studentId: parseInt(studentId),
                    subjectId: parseInt(subjectId),
                    date: new Date().toISOString().split('T')[0],
                    status
                })
            });
            if (res.ok) {
                alert('Attendance marked successfully!');
                setIsOpen(false);
            }
        } catch (err) {
            alert('Error marking attendance');
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <motion.button 
                whileHover={{ scale: 1.05, boxShadow: "0 0 20px rgba(255,255,255,0.5)" }}
                onClick={() => setIsOpen(true)}
                className="px-8 py-4 bg-[#7C3AED] text-white rounded-2xl font-bold hover:bg-[#6D28D9] transition-all shadow-lg shadow-purple-100"
            >
                Open Attendance Portal
            </motion.button>

            {isOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-6 text-left">
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white w-full max-w-md rounded-[40px] p-10 relative"
                    >
                        <button onClick={() => setIsOpen(false)} className="absolute top-8 right-8 text-gray-400 hover:text-gray-600">
                            <LogOut className="w-6 h-6 rotate-180" />
                        </button>
                        <h3 className="text-2xl font-bold text-[#1F2937] mb-6">Mark Attendance</h3>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-400 uppercase">Search & Select Student</label>
                                <div className="relative">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input 
                                        type="text"
                                        placeholder="Type to filter..."
                                        value={modalSearch}
                                        onChange={(e) => setModalSearch(e.target.value)}
                                        className="w-full pl-10 pr-4 py-3 bg-gray-50 rounded-xl border-none outline-none text-sm"
                                    />
                                </div>
                                <select 
                                    value={studentId}
                                    onChange={(e) => setStudentId(e.target.value)}
                                    required 
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-purple-500"
                                >
                                    <option value="">Select Student ({modalFilteredStudents.length})</option>
                                    {modalFilteredStudents.map(s => <option key={s.id} value={s.id}>{s.name} ({s.roll_number})</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Subject</label>
                                <select 
                                    value={subjectId}
                                    onChange={(e) => setSubjectId(e.target.value)}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none"
                                >
                                    <option value="">Select Subject</option>
                                    {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </select>
                            </div>
                            <div className="flex gap-4">
                                <motion.button 
                                    whileHover={{ scale: 1.05 }}
                                    type="button"
                                    onClick={() => setStatus('present')}
                                    className={`flex-1 py-3 rounded-xl font-bold transition-all ${status === 'present' ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-500'}`}
                                >
                                    Present
                                </motion.button>
                                <motion.button 
                                    whileHover={{ scale: 1.05 }}
                                    type="button"
                                    onClick={() => setStatus('absent')}
                                    className={`flex-1 py-3 rounded-xl font-bold transition-all ${status === 'absent' ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-500'}`}
                                >
                                    Absent
                                </motion.button>
                            </div>
                            <motion.button 
                                whileHover={{ scale: 1.05, boxShadow: "0 0 20px rgba(255,255,255,0.5)" }}
                                type="submit"
                                disabled={loading}
                                className="w-full py-4 bg-[#7C3AED] text-white rounded-2xl font-bold hover:bg-[#6D28D9] transition-all disabled:opacity-50"
                            >
                                {loading ? 'Saving...' : 'Submit Attendance'}
                            </motion.button>
                        </form>
                    </motion.div>
                </div>
            )}
        </>
    );
}

// --- Sub-Views ---

function StudyMaterialsView({ token, user }: { token: string, user: any }) {
    const [materials, setMaterials] = useState<any[]>([]);
    const [subjects, setSubjects] = useState<any[]>([]);
    const [filter, setFilter] = useState({ semester: '', type: '', subject: '', department: '' });
    const [isUploadOpen, setIsUploadOpen] = useState(false);

    useEffect(() => {
        fetch('/api/materials', { headers: { 'Authorization': `Bearer ${token}` } })
            .then(async res => (res.ok ? await safeJson(res) : []) || [])
            .then(setMaterials);
        fetch('/api/subjects', { headers: { 'Authorization': `Bearer ${token}` } })
            .then(async res => (res.ok ? await safeJson(res) : []) || [])
            .then(setSubjects);
    }, [token]);

    const filtered = materials.filter(m => 
        (!filter.semester || m.semester.toString() === filter.semester) &&
        (!filter.type || m.type === filter.type) &&
        (!filter.department || m.department === filter.department)
    );

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget as HTMLFormElement);
        // Simulate file upload by creating a local URL
        const file = formData.get('file') as File;
        let fileUrl = '';
        if (file && file.size > 0) {
            fileUrl = URL.createObjectURL(file);
        }
        
        const payload = {
            title: formData.get('title'),
            type: formData.get('type'),
            semester: formData.get('semester'),
            subjectId: formData.get('subjectId'),
            url: fileUrl || 'https://example.com/placeholder.pdf'
        };

        const res = await fetch('/api/materials', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(payload)
        });
        if (res.ok) {
            setIsUploadOpen(false);
            fetch('/api/materials', { headers: { 'Authorization': `Bearer ${token}` } })
                .then(async res => (res.ok ? await safeJson(res) : []) || [])
                .then(setMaterials);
        }
    };

    const categories = [
        { id: 'model_paper', label: 'Model Papers' },
        { id: 'pyq', label: 'PYQs' },
        { id: 'question_bank', label: 'Question Bank' },
        { id: 'textbook', label: 'Textbooks' },
    ];

    return (
        <div className="space-y-8">
            <div className="flex flex-wrap gap-4 items-center justify-between">
                <div className="flex gap-4">
                    <select 
                        className="px-4 py-2 bg-white border border-gray-100 rounded-xl text-sm outline-none"
                        value={filter.department}
                        onChange={(e) => setFilter({...filter, department: e.target.value})}
                    >
                        <option value="">All Courses</option>
                        <option value="CSE">CSE</option>
                        <option value="ISE">ISE</option>
                        <option value="ECE">ECE</option>
                    </select>
                    <select 
                        className="px-4 py-2 bg-white border border-gray-100 rounded-xl text-sm outline-none"
                        value={filter.semester}
                        onChange={(e) => setFilter({...filter, semester: e.target.value})}
                    >
                        <option value="">All Semesters</option>
                        {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>Semester {s}</option>)}
                    </select>
                    <select 
                        className="px-4 py-2 bg-white border border-gray-100 rounded-xl text-sm outline-none"
                        value={filter.type}
                        onChange={(e) => setFilter({...filter, type: e.target.value})}
                    >
                        <option value="">All Types</option>
                        {categories.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                    </select>
                </div>
                {(user.role === 'admin' || user.role === 'faculty' || user.role === 'librarian') && (
                    <motion.button 
                        whileHover={{ scale: 1.05, boxShadow: "0 0 20px rgba(255,255,255,0.5)" }}
                        onClick={() => setIsUploadOpen(true)}
                        className="px-6 py-2.5 bg-[#7C3AED] text-white rounded-xl font-bold text-sm"
                    >
                        Upload Material
                    </motion.button>
                )}
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filtered.map((m, i) => (
                    <div key={i} className="bg-white p-6 rounded-[32px] shadow-sm border border-gray-50">
                        <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mb-4">
                            <BookMarked className="text-blue-500 w-6 h-6" />
                        </div>
                        <h3 className="font-bold text-[#1F2937] mb-1">{m.title}</h3>
                        <p className="text-xs text-[#6B7280] mb-2">{m.subject_name} • Sem {m.semester} • {m.type.replace('_', ' ')}</p>
                        <p className="text-[10px] text-[#9CA3AF] mb-4">Uploaded by: {m.uploader_name}</p>
                        <a 
                            href={m.url} 
                            target="_blank" 
                            rel="noreferrer"
                            className="block w-full py-3 bg-[#F3F4F6] text-[#1F2937] text-center rounded-xl font-bold text-sm hover:bg-gray-200 transition-all"
                        >
                            View / Download
                        </a>
                    </div>
                ))}
            </div>

            {isUploadOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-6">
                    <div className="bg-white w-full max-w-md rounded-[40px] p-10 relative">
                        <button onClick={() => setIsUploadOpen(false)} className="absolute top-8 right-8 text-gray-400 hover:text-gray-600">
                            <X className="w-6 h-6" />
                        </button>
                        <h3 className="text-2xl font-bold mb-6">Upload Material</h3>
                        <form className="space-y-4" onSubmit={handleUpload}>
                            <input name="title" placeholder="Title" required className="w-full px-4 py-3 bg-gray-50 rounded-xl border-none outline-none" />
                            <select name="type" required className="w-full px-4 py-3 bg-gray-50 rounded-xl border-none outline-none">
                                {categories.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                            </select>
                            <div className="grid grid-cols-2 gap-4">
                                <select name="semester" required className="w-full px-4 py-3 bg-gray-50 rounded-xl border-none outline-none">
                                    <option value="">Semester</option>
                                    {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                                <select name="subjectId" required className="w-full px-4 py-3 bg-gray-50 rounded-xl border-none outline-none">
                                    <option value="">Select Subject</option>
                                    {subjects.map(s => <option key={s.id} value={s.id}>{s.name} ({s.code})</option>)}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-400 uppercase">Select File</label>
                                <input name="file" type="file" required className="w-full px-4 py-3 bg-gray-50 rounded-xl border-none outline-none transition-all focus:ring-2 focus:ring-purple-100" />
                            </div>
                            <button type="submit" className="w-full py-4 bg-[#7C3AED] text-white rounded-2xl font-bold">Upload to Cloud</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

function EventsView({ user, token }: { user: any, token: string }) {
    const [events, setEvents] = useState<any[]>([]);
    const [viewMode, setViewMode] = useState<'dashboard' | 'category' | 'details'>('dashboard');
    const [selectedCategory, setSelectedCategory] = useState<string>('');
    const [selectedEvent, setSelectedEvent] = useState<any>(null);
    const [eventResources, setEventResources] = useState<any[]>([]);
    const [leaderboard, setLeaderboard] = useState<any[]>([]);
    
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [isRegisterOpen, setIsRegisterOpen] = useState(false);
    const [isAttendanceOpen, setIsAttendanceOpen] = useState(false);
    const [isRegistrationsModalOpen, setIsRegistrationsModalOpen] = useState(false);
    const [registrations, setRegistrations] = useState<any[]>([]);
    const [selectedStudentsForAttendance, setSelectedStudentsForAttendance] = useState<string[]>([]);
    const [loadingRegistrations, setLoadingRegistrations] = useState(false);
    const [registrationStatus, setRegistrationStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [registrationError, setRegistrationError] = useState('');
    const [regStep, setRegStep] = useState<'form' | 'confirm'>('form');

    const [isAddResourceOpen, setIsAddResourceOpen] = useState(false);
    const [isAddLeaderboardOpen, setIsAddLeaderboardOpen] = useState(false);

    const [facultyMembers, setFacultyMembers] = useState<any[]>([]);
    const [regName, setRegName] = useState('');
    const [regUSN, setRegUSN] = useState('');

    useEffect(() => {
        fetchEvents();
        fetchFaculty();
    }, []);

    const fetchFaculty = async () => {
        try {
            const res = await fetch("/api/users?role=faculty", {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setFacultyMembers(data || []);
            }
        } catch (err) {
            console.error("Error fetching faculty:", err);
        }
    };

    const fetchEvents = async () => {
        try {
            const res = await fetch("/api/events", {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setEvents(data || []);
            }
        } catch (err) {
            console.error("Error fetching events:", err);
        }
    };

    const openRegisterModal = (event: any) => {
        setSelectedEvent(event);
        const name = user?.name || '';
        const usn = (user as any)?.roll_number || (user as any)?.studentId || '';
        setRegName(name);
        setRegUSN(usn);
        setRegistrationStatus('idle');
        
        if (name && usn) {
            setRegStep('confirm');
        } else {
            setRegStep('form');
        }
        setIsRegisterOpen(true);
    };

    const fetchEventDetails = async (eventId: number) => {
        try {
            // Resources
            const resRes = await fetch(`/api/events/${eventId}/resources`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (resRes.ok) {
                const resData = await resRes.json();
                setEventResources(resData || []);
            }

            // Leaderboard
            const leadRes = await fetch(`/api/events/${eventId}/leaderboard`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (leadRes.ok) {
                const leadData = await leadRes.json();
                setLeaderboard(leadData || []);
            }
        } catch (err) {
            console.error("Error fetching event details:", err);
        }
    };

    const handleAddEvent = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const data = Object.fromEntries(formData.entries());
        
        const res = await fetch("/api/events", {
            method: "POST",
            headers: { 
                "Content-Type": "application/json",
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(data)
        });
        if (res.ok) {
            setIsAddOpen(false);
            fetchEvents();
        }
    };

    const handleRegister = async () => {
        if (!selectedEvent) return;
        setRegistrationStatus('loading');
        try {
            const res = await fetch("/api/events/register", {
                method: "POST",
                headers: { 
                    "Content-Type": "application/json",
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ 
                    eventId: selectedEvent.id,
                    name: regName,
                    usn: regUSN
                })
            });
            if (res.ok) {
                setRegistrationStatus('success');
            } else {
                const data = await res.json();
                setRegistrationStatus('error');
                setRegistrationError(data.message || 'Registration failed');
            }
        } catch (err) {
            setRegistrationStatus('error');
            setRegistrationError('Network error occurred');
        }
    };

    const handleMarkAttendance = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const rollNumbers = formData.get("rollNumbers");
        
        const res = await fetch("/api/events/attendance", {
            method: "POST",
            headers: { 
                "Content-Type": "application/json",
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ eventId: selectedEvent.id, rollNumbers })
        });
        if (res.ok) {
            setIsAttendanceOpen(false);
            alert("Attendance alert sent to faculty!");
        }
    };

    const handleAddResource = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const data = Object.fromEntries(formData.entries());
        
        const res = await fetch(`/api/events/${selectedEvent.id}/resources`, {
            method: "POST",
            headers: { 
                "Content-Type": "application/json",
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(data)
        });
        if (res.ok) {
            setIsAddResourceOpen(false);
            fetchEventDetails(selectedEvent.id);
        }
    };

    const handleAddLeaderboard = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const data = Object.fromEntries(formData.entries());
        
        const res = await fetch(`/api/events/${selectedEvent.id}/leaderboard`, {
            method: "POST",
            headers: { 
                "Content-Type": "application/json",
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(data)
        });
        if (res.ok) {
            setIsAddLeaderboardOpen(false);
            fetchEventDetails(selectedEvent.id);
        }
    };

    const fetchRegistrations = async (eventId: number) => {
        setLoadingRegistrations(true);
        setSelectedStudentsForAttendance([]);
        try {
            const res = await fetch(`/api/events/${eventId}/registrations`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (res.ok) {
                setRegistrations(data || []);
                setIsRegistrationsModalOpen(true);
            }
        } catch (err) {
            console.error("Error fetching registrations:", err);
        } finally {
            setLoadingRegistrations(false);
        }
    };

    const submitEventAttendance = async () => {
        if (selectedStudentsForAttendance.length === 0) {
            alert("No students selected");
            return;
        }

        const rollNumbers = selectedStudentsForAttendance.join(",");
        
        const res = await fetch("/api/events/attendance", {
            method: "POST",
            headers: { 
                "Content-Type": "application/json",
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ eventId: selectedEvent.id, rollNumbers })
        });

        if (res.ok) {
            alert("Attendance marked successfully and alerts sent to faculty!");
            setIsRegistrationsModalOpen(false);
        } else {
            alert("Failed to mark attendance");
        }
    };

    const toggleStudentAttendance = (rollNumber: string) => {
        setSelectedStudentsForAttendance(prev => 
            prev.includes(rollNumber) 
                ? prev.filter(r => r !== rollNumber) 
                : [...prev, rollNumber]
        );
    };

    const toggleAllAttendance = () => {
        if (selectedStudentsForAttendance.length === registrations.length) {
            setSelectedStudentsForAttendance([]);
        } else {
            setSelectedStudentsForAttendance(registrations.map(r => r.student_usn));
        }
    };

    const categories = [
        { id: 'technical', title: 'Technical Events', icon: <Target className="w-8 h-8" />, color: 'bg-blue-50 text-blue-600', examples: 'Hackathons, Coding, AI Workshops' },
        { id: 'cultural', title: 'Cultural Events', icon: <Music className="w-8 h-8" />, color: 'bg-purple-50 text-purple-600', examples: 'Dance, Singing, Drama, Fashion' },
        { id: 'sports', title: 'Sports Events', icon: <Trophy className="w-8 h-8" />, color: 'bg-orange-50 text-orange-600', examples: 'Cricket, Football, Badminton' },
        { id: 'college_fest', title: 'College Fest', icon: <Star className="w-8 h-8" />, color: 'bg-pink-50 text-pink-600', examples: 'Annual Day, Tech Fest' }
    ];

    const filteredEvents = events.filter(e => e.category === selectedCategory);

    return (
        <div className="space-y-8">
            {/* Header with Navigation */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    {viewMode !== 'dashboard' && (
                        <button 
                            onClick={() => {
                                if (viewMode === 'details') setViewMode('category');
                                else setViewMode('dashboard');
                            }}
                            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                        >
                            <ArrowLeft className="w-6 h-6 text-gray-500" />
                        </button>
                    )}
                    <h2 className="text-2xl font-bold text-[#1F2937]">
                        {viewMode === 'dashboard' ? 'Events & Activities' : 
                         viewMode === 'category' ? categories.find(c => c.id === selectedCategory)?.title : 
                         selectedEvent?.title}
                    </h2>
                </div>
                {(user.role === 'admin' || user.role === 'faculty') && (
                    <motion.button 
                        whileHover={{ scale: 1.05 }}
                        onClick={() => setIsAddOpen(true)} 
                        className="px-6 py-2.5 bg-[#7C3AED] text-white rounded-xl font-bold flex items-center gap-2"
                    >
                        <Plus className="w-5 h-5" />
                        Add Event
                    </motion.button>
                )}
            </div>

            {/* Dashboard View */}
            {viewMode === 'dashboard' && (
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {categories.map((cat) => (
                        <motion.button
                            key={cat.id}
                            whileHover={{ y: -5 }}
                            onClick={() => { setSelectedCategory(cat.id); setViewMode('category'); }}
                            className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-50 text-left group"
                        >
                            <div className={`w-16 h-16 ${cat.color} rounded-3xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                                {cat.icon}
                            </div>
                            <h3 className="text-xl font-bold text-[#1F2937] mb-2">{cat.title}</h3>
                            <p className="text-sm text-[#6B7280] leading-relaxed">{cat.examples}</p>
                        </motion.button>
                    ))}
                </div>
            )}

            {/* Category View */}
            {viewMode === 'category' && (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {filteredEvents.map((e, i) => (
                        <motion.div 
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="bg-white rounded-[40px] shadow-sm border border-gray-50 overflow-hidden flex flex-col"
                        >
                            <div className="h-48 bg-gray-100 relative">
                                <div className="absolute top-4 left-4 px-3 py-1 bg-white/90 backdrop-blur-sm rounded-full text-[10px] font-bold uppercase tracking-widest text-[#7C3AED]">
                                    {e.category}
                                </div>
                                <div className="w-full h-full flex items-center justify-center text-gray-300">
                                    <Calendar className="w-12 h-12" />
                                </div>
                            </div>
                            <div className="p-8 flex-1 flex flex-col">
                                <div className="flex items-start justify-between mb-4">
                                    <div>
                                        <h3 className="text-xl font-bold text-[#1F2937] mb-1">{e.title}</h3>
                                        <div className="flex items-center gap-2 text-[#6B7280] text-sm">
                                            <MapPin className="w-4 h-4" />
                                            <span>{e.venue}</span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-lg font-bold text-[#7C3AED]">{new Date(e.date).getDate()}</p>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase">{new Date(e.date).toLocaleString('default', { month: 'short' })}</p>
                                    </div>
                                </div>
                                <p className="text-sm text-[#6B7280] mb-4 line-clamp-2 flex-1">{e.description}</p>
                                
                                {e.registration_deadline && (
                                    <div className={`mb-6 p-3 rounded-2xl text-[10px] font-bold uppercase flex items-center gap-2 ${
                                        new Date() > new Date(e.registration_deadline) ? 'bg-red-50 text-red-500' : 'bg-green-50 text-green-600'
                                    }`}>
                                        <Clock className="w-4 h-4" />
                                        Reg. Deadline: {new Date(e.registration_deadline).toLocaleString()}
                                    </div>
                                )}

                                <div className="flex items-center gap-3">
                                    <button 
                                        onClick={() => { setSelectedEvent(e); setViewMode('details'); fetchEventDetails(e.id); }}
                                        className="flex-1 py-3 bg-gray-50 text-[#1F2937] rounded-2xl font-bold hover:bg-gray-100 transition-colors text-sm"
                                    >
                                        View
                                    </button>
                                    {user.role === 'student' && (
                                        <button 
                                            onClick={() => openRegisterModal(e)}
                                            disabled={e.registration_deadline && new Date() > new Date(e.registration_deadline)}
                                            className={`flex-1 py-3 rounded-2xl font-bold shadow-lg text-sm transition-all ${
                                                e.registration_deadline && new Date() > new Date(e.registration_deadline)
                                                ? 'bg-gray-100 text-gray-300 shadow-none'
                                                : 'bg-[#7C3AED] text-white shadow-purple-100'
                                            }`}
                                        >
                                            {e.registration_deadline && new Date() > new Date(e.registration_deadline) ? 'Closed' : 'Register'}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    ))}
                    {filteredEvents.length === 0 && (
                        <div className="col-span-full py-20 text-center">
                            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Calendar className="w-10 h-10 text-gray-300" />
                            </div>
                            <p className="text-gray-400 font-medium">No events found in this category.</p>
                        </div>
                    )}
                </div>
            )}

            {/* Details View */}
            {viewMode === 'details' && selectedEvent && (
                <div className="grid lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-8">
                        {/* Main Info */}
                        <div className="bg-white p-10 rounded-[40px] shadow-sm border border-gray-50">
                            <div className="h-64 bg-gray-50 rounded-3xl mb-8 flex items-center justify-center text-gray-200">
                                <Calendar className="w-20 h-20" />
                            </div>
                            <div className="flex flex-wrap items-center gap-4 mb-6">
                                <span className="px-4 py-1.5 bg-purple-50 text-[#7C3AED] rounded-full text-xs font-bold uppercase tracking-widest">
                                    {selectedEvent.category}
                                </span>
                                <div className="flex items-center gap-2 text-gray-400 text-sm font-medium">
                                    <Clock className="w-4 h-4" />
                                    <span>Starts: {new Date(selectedEvent.date).toLocaleString()}</span>
                                </div>
                                {selectedEvent.registration_deadline && (
                                    <div className={`flex items-center gap-2 text-sm font-medium ${
                                        new Date() > new Date(selectedEvent.registration_deadline) ? 'text-red-500' : 'text-green-500'
                                    }`}>
                                        <AlertTriangle className="w-4 h-4" />
                                        <span>Deadline: {new Date(selectedEvent.registration_deadline).toLocaleString()}</span>
                                    </div>
                                )}
                            </div>
                            <h1 className="text-3xl font-bold text-[#1F2937] mb-4">{selectedEvent.title}</h1>
                            <p className="text-[#6B7280] leading-relaxed mb-8">{selectedEvent.description}</p>
                            
                            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                <div className="p-6 bg-gray-50 rounded-3xl">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Venue</p>
                                    <div className="flex items-center gap-3">
                                        <MapPin className="w-5 h-5 text-[#7C3AED]" />
                                        <p className="font-bold text-[#1F2937]">{selectedEvent.venue}</p>
                                    </div>
                                </div>
                                <div className="p-6 bg-gray-50 rounded-3xl">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Organizer</p>
                                    <div className="flex items-center gap-3">
                                        <User className="w-5 h-5 text-[#7C3AED]" />
                                        <p className="font-bold text-[#1F2937]">{selectedEvent.organizer || 'N/A'}</p>
                                    </div>
                                </div>
                                <div className="p-6 bg-gray-50 rounded-3xl">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Faculty Coordinator</p>
                                    <div className="flex items-center gap-3">
                                        <ShieldCheck className="w-5 h-5 text-green-600" />
                                        <p className="font-bold text-[#1F2937]">{selectedEvent.coordinator_name || 'Assigned via Admin'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Resources */}
                        <div className="bg-white p-10 rounded-[40px] shadow-sm border border-gray-50">
                            <div className="flex items-center justify-between mb-8">
                                <h3 className="text-xl font-bold text-[#1F2937]">Event Resources</h3>
                                {(user.role === 'admin' || user.role === 'faculty') && (
                                    <button 
                                        onClick={() => setIsAddResourceOpen(true)}
                                        className="text-[#7C3AED] font-bold text-sm hover:underline"
                                    >
                                        Add Resource
                                    </button>
                                )}
                            </div>
                            <div className="grid sm:grid-cols-2 gap-4">
                                {eventResources.map((res, i) => (
                                    <a 
                                        key={i}
                                        href={res.file_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="p-4 bg-gray-50 rounded-2xl flex items-center gap-4 hover:bg-gray-100 transition-colors group"
                                    >
                                        <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm">
                                            {res.file_type === 'pdf' ? <FileText className="w-6 h-6 text-red-500" /> : <Image className="w-6 h-6 text-blue-500" />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-bold text-sm text-[#1F2937] truncate">{res.title || 'Untitled Resource'}</p>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase">{res.file_type}</p>
                                        </div>
                                        <Download className="w-4 h-4 text-gray-300 group-hover:text-[#7C3AED]" />
                                    </a>
                                ))}
                                {eventResources.length === 0 && (
                                    <p className="col-span-full text-center py-8 text-gray-400 italic text-sm">No resources available for this event.</p>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-8">
                        {/* Registration Card */}
                        <div className="bg-[#7C3AED] p-10 rounded-[40px] shadow-xl shadow-purple-100 text-white">
                            <h3 className="text-xl font-bold mb-2">Event Status</h3>
                            {selectedEvent.registration_deadline && (
                                <p className="text-purple-100 text-xs mb-4">
                                    Registration closes at: {new Date(selectedEvent.registration_deadline).toLocaleString()}
                                </p>
                            )}
                            <p className="text-purple-100 text-sm mb-8 leading-relaxed">
                                {selectedEvent.registration_deadline && new Date() > new Date(selectedEvent.registration_deadline) 
                                    ? "Registration is now closed for this event. You can still view details and resources."
                                    : "Be part of this amazing experience. Register now to secure your spot!"}
                            </p>
                            {user.role === 'student' && (
                                <button 
                                    onClick={() => openRegisterModal(selectedEvent)}
                                    disabled={selectedEvent.registration_deadline && new Date() > new Date(selectedEvent.registration_deadline)}
                                    className={`w-full py-4 rounded-2xl font-bold font-sans shadow-lg transition-colors mb-4 ${
                                        selectedEvent.registration_deadline && new Date() > new Date(selectedEvent.registration_deadline)
                                        ? 'bg-purple-300 text-purple-100 cursor-not-allowed shadow-none'
                                        : 'bg-white text-[#7C3AED] hover:bg-purple-50 shadow-purple-900/20'
                                    }`}
                                >
                                    {selectedEvent.registration_deadline && new Date() > new Date(selectedEvent.registration_deadline)
                                        ? 'Registration Closed'
                                        : 'Register Now'}
                                </button>
                            )}
                            {registrations.some(r => r.student_id === user.id) && (
                                <div className="flex items-center gap-2 text-green-300 font-bold bg-white/10 p-3 rounded-xl justify-center">
                                    <CheckCircle className="w-4 h-4" />
                                    <span>Successfully Registered</span>
                                </div>
                            )}
                        </div>

                        {/* Leaderboard */}
                        <div className="bg-white p-10 rounded-[40px] shadow-sm border border-gray-50">
                            <div className="flex items-center justify-between mb-8">
                                <h3 className="text-xl font-bold text-[#1F2937]">Leaderboard</h3>
                                {(user.role === 'admin' || user.role === 'faculty') && (
                                    <button 
                                        onClick={() => setIsAddLeaderboardOpen(true)}
                                        className="text-[#7C3AED] font-bold text-sm hover:underline"
                                    >
                                        Add Winner
                                    </button>
                                )}
                            </div>
                            <div className="space-y-4">
                                {leaderboard.map((item, i) => (
                                    <div key={i} className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg
                                            ${item.position === 1 ? 'bg-yellow-100 text-yellow-600' : 
                                              item.position === 2 ? 'bg-gray-100 text-gray-600' : 
                                              'bg-orange-100 text-orange-600'}`}
                                        >
                                            {item.position}
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-bold text-[#1F2937]">{item.student_name}</p>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase">{item.department}</p>
                                        </div>
                                        {item.position === 1 && <Trophy className="w-5 h-5 text-yellow-500" />}
                                    </div>
                                ))}
                                {leaderboard.length === 0 && (
                                    <div className="text-center py-10">
                                        <Award className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                                        <p className="text-gray-400 text-sm italic">Winners will be announced after completion.</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Admin Actions */}
                        {(user.role === 'admin' || user.role === 'faculty') && (
                            <div className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-50 space-y-3">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Admin Controls</p>
                                <button 
                                    onClick={() => fetchRegistrations(selectedEvent.id)}
                                    className="w-full py-3 bg-blue-50 text-blue-600 rounded-xl text-sm font-bold flex items-center justify-center gap-2"
                                >
                                    <Users className="w-4 h-4" />
                                    View Registrations
                                </button>
                                <button 
                                    onClick={() => setIsAttendanceOpen(true)}
                                    className="w-full py-3 bg-orange-50 text-orange-600 rounded-xl text-sm font-bold flex items-center justify-center gap-2"
                                >
                                    <CheckCircle className="w-4 h-4" />
                                    Mark Attendance
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Modals */}
            {isAddOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-6">
                    <div className="bg-white w-full max-w-md rounded-[40px] p-10 relative">
                        <h3 className="text-2xl font-bold mb-6">Add Event</h3>
                        <form className="space-y-4" onSubmit={handleAddEvent}>
                            <input name="title" placeholder="Event Title" required className="w-full px-4 py-3 bg-gray-50 rounded-xl border-none outline-none" />
                            <textarea name="description" placeholder="Description" className="w-full px-4 py-3 bg-gray-50 rounded-xl border-none outline-none" />
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-bold text-gray-400 px-1 uppercase">Event Date</p>
                                    <input name="date" type="datetime-local" required className="w-full px-4 py-3 bg-gray-50 rounded-xl border-none outline-none" />
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-bold text-gray-400 px-1 uppercase">Reg. Deadline</p>
                                    <input name="registrationDeadline" type="datetime-local" className="w-full px-4 py-3 bg-gray-50 rounded-xl border-none outline-none" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <select name="category" required className="w-full px-4 py-3 bg-gray-50 rounded-xl border-none outline-none">
                                    <option value="technical">Technical</option>
                                    <option value="cultural">Cultural</option>
                                    <option value="sports">Sports</option>
                                    <option value="college_fest">College Fest</option>
                                </select>
                                <select name="coordinatorId" className="w-full px-4 py-3 bg-gray-50 rounded-xl border-none outline-none">
                                    <option value="">Coordinator (Optional)</option>
                                    {facultyMembers.map(f => (
                                        <option key={f.id} value={f.id}>{f.name}</option>
                                    ))}
                                </select>
                            </div>
                            <input name="venue" placeholder="Venue / Location" required className="w-full px-4 py-3 bg-gray-50 rounded-xl border-none outline-none" />
                            <div className="grid grid-cols-2 gap-4">
                                <input name="organizer" placeholder="Organizer Name" className="w-full px-4 py-3 bg-gray-50 rounded-xl border-none outline-none" />
                                <input name="department" placeholder="Department" className="w-full px-4 py-3 bg-gray-50 rounded-xl border-none outline-none" />
                            </div>
                            <button type="submit" className="w-full py-4 bg-[#7C3AED] text-white rounded-2xl font-bold shadow-lg shadow-purple-100">Create Event</button>
                            <button type="button" onClick={() => setIsAddOpen(false)} className="w-full py-2 text-gray-500 font-bold">Cancel</button>
                        </form>
                    </div>
                </div>
            )}

            {isAddResourceOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-6">
                    <div className="bg-white w-full max-w-md rounded-[40px] p-10 relative">
                        <h3 className="text-2xl font-bold mb-6">Add Event Resource</h3>
                        <form className="space-y-4" onSubmit={handleAddResource}>
                            <input name="title" placeholder="Resource Title (e.g. Schedule, Rules)" required className="w-full px-4 py-3 bg-gray-50 rounded-xl border-none outline-none" />
                            <select name="fileType" required className="w-full px-4 py-3 bg-gray-50 rounded-xl border-none outline-none">
                                <option value="pdf">PDF Document</option>
                                <option value="image">Image / Poster</option>
                            </select>
                            <input name="fileUrl" placeholder="File URL" required className="w-full px-4 py-3 bg-gray-50 rounded-xl border-none outline-none" />
                            <button type="submit" className="w-full py-4 bg-[#7C3AED] text-white rounded-2xl font-bold shadow-lg shadow-purple-100">Add Resource</button>
                            <button type="button" onClick={() => setIsAddResourceOpen(false)} className="w-full py-2 text-gray-500 font-bold">Cancel</button>
                        </form>
                    </div>
                </div>
            )}

            {isAddLeaderboardOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-6">
                    <div className="bg-white w-full max-w-md rounded-[40px] p-10 relative">
                        <h3 className="text-2xl font-bold mb-6">Add Winner</h3>
                        <form className="space-y-4" onSubmit={handleAddLeaderboard}>
                            <input name="studentName" placeholder="Student Name" required className="w-full px-4 py-3 bg-gray-50 rounded-xl border-none outline-none" />
                            <select name="position" required className="w-full px-4 py-3 bg-gray-50 rounded-xl border-none outline-none">
                                <option value="1">1st Place</option>
                                <option value="2">2nd Place</option>
                                <option value="3">3rd Place</option>
                            </select>
                            <input name="department" placeholder="Department" className="w-full px-4 py-3 bg-gray-50 rounded-xl border-none outline-none" />
                            <button type="submit" className="w-full py-4 bg-[#7C3AED] text-white rounded-2xl font-bold shadow-lg shadow-purple-100">Announce Winner</button>
                            <button type="button" onClick={() => setIsAddLeaderboardOpen(false)} className="w-full py-2 text-gray-500 font-bold">Cancel</button>
                        </form>
                    </div>
                </div>
            )}

            {isAttendanceOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-6">
                    <div className="bg-white w-full max-w-md rounded-[40px] p-10 relative">
                        <h3 className="text-2xl font-bold mb-2">Event Attendance</h3>
                        <p className="text-sm text-gray-500 mb-6">Enter roll numbers of students who attended "{selectedEvent?.title}"</p>
                        <form className="space-y-4" onSubmit={handleMarkAttendance}>
                            <textarea 
                                name="rollNumbers" 
                                placeholder="CS2026001, CS2026005, CS2026010..." 
                                required 
                                className="w-full h-32 px-4 py-3 bg-gray-50 rounded-xl border-none outline-none resize-none" 
                            />
                            <button type="submit" className="w-full py-4 bg-orange-500 text-white rounded-2xl font-bold">Send Alert to Faculty</button>
                            <button type="button" onClick={() => setIsAttendanceOpen(false)} className="w-full py-2 text-gray-500">Cancel</button>
                        </form>
                    </div>
                </div>
            )}

            {isRegisterOpen && selectedEvent && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-6">
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white w-full max-w-md rounded-[40px] p-10 relative text-center"
                    >
                        {registrationStatus === 'idle' || registrationStatus === 'loading' ? (
                            <>
                                <div className="w-20 h-20 bg-purple-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <Calendar className="w-10 h-10 text-[#7C3AED]" />
                                </div>
                                <h3 className="text-2xl font-bold mb-2 text-[#1F2937]">Event Registration</h3>
                                <p className="text-[#6B7280] mb-6 text-sm">
                                    Registering for <span className="font-bold text-[#7C3AED]">{selectedEvent.title}</span>
                                </p>
                                
                                {regStep === 'form' ? (
                                    <div className="space-y-4 mb-8 text-left">
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-bold text-gray-400 px-1 uppercase">Your Name</p>
                                            <input 
                                                value={regName} 
                                                onChange={(e) => setRegName(e.target.value)}
                                                placeholder="Enter your full name" 
                                                className="w-full px-4 py-3 bg-gray-50 rounded-xl border-none outline-none text-sm" 
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-bold text-gray-400 px-1 uppercase">USN / Roll Number</p>
                                            <input 
                                                value={regUSN} 
                                                onChange={(e) => setRegUSN(e.target.value)}
                                                placeholder="e.g. 1RV20CS001" 
                                                className="w-full px-4 py-3 bg-gray-50 rounded-xl border-none outline-none text-sm" 
                                            />
                                        </div>
                                        <button 
                                            onClick={() => setRegStep('confirm')}
                                            disabled={!regName || !regUSN}
                                            className="w-full py-4 bg-[#7C3AED] text-white rounded-2xl font-bold hover:bg-[#6D28D9] transition-all shadow-lg shadow-purple-100 disabled:opacity-50 mt-4"
                                        >
                                            Next: Review Details
                                        </button>
                                    </div>
                                ) : (
                                    <div className="space-y-6 mb-8 text-left">
                                        <div className="bg-gray-50 p-6 rounded-3xl space-y-4">
                                            <div>
                                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Name</p>
                                                <p className="font-bold text-[#1F2937]">{regName}</p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">USN</p>
                                                <p className="font-bold text-[#7C3AED]">{regUSN}</p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Event</p>
                                                <p className="font-bold text-[#1F2937]">{selectedEvent.title}</p>
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            <button 
                                                onClick={handleRegister}
                                                disabled={registrationStatus === 'loading'}
                                                className="w-full py-4 bg-green-500 text-white rounded-2xl font-bold hover:bg-green-600 transition-all shadow-lg shadow-green-100 flex items-center justify-center gap-2"
                                            >
                                                {registrationStatus === 'loading' ? 'Processing...' : (
                                                    <>
                                                        <CheckCircle className="w-5 h-5" />
                                                        Confirm & Submit
                                                    </>
                                                )}
                                            </button>
                                            <button 
                                                onClick={() => setRegStep('form')}
                                                disabled={registrationStatus === 'loading'}
                                                className="w-full py-2 text-gray-400 font-medium hover:text-gray-600 transition-colors text-center"
                                            >
                                                Edit Details
                                            </button>
                                        </div>
                                    </div>
                                )}
                                
                                {regStep === 'form' && (
                                    <button 
                                        onClick={() => setIsRegisterOpen(false)} 
                                        className="w-full py-2 text-gray-400 font-medium hover:text-gray-600 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                )}
                            </>
                        ) : registrationStatus === 'success' ? (
                            <>
                                <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <ShieldCheck className="w-10 h-10 text-green-500" />
                                </div>
                                <h3 className="text-2xl font-bold mb-4 text-[#1F2937]">Registration Successful!</h3>
                                <p className="text-[#6B7280] mb-8 leading-relaxed">
                                    You have been successfully registered for <br/>
                                    <span className="font-bold text-green-600">{selectedEvent.title}</span>.
                                </p>
                                <button 
                                    onClick={() => {
                                        setIsRegisterOpen(false);
                                        setRegistrationStatus('idle');
                                    }}
                                    className="w-full py-4 bg-green-500 text-white rounded-2xl font-bold hover:bg-green-600 transition-all shadow-lg shadow-green-100"
                                >
                                    Done
                                </button>
                            </>
                        ) : (
                            <>
                                <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <AlertCircle className="w-10 h-10 text-red-500" />
                                </div>
                                <h3 className="text-2xl font-bold mb-4 text-[#1F2937]">Registration Failed</h3>
                                <p className="text-[#6B7280] mb-8 leading-relaxed">
                                    {registrationError || 'We encountered an error while processing your registration.'}
                                </p>
                                <div className="space-y-3">
                                    <button 
                                        onClick={() => setRegistrationStatus('idle')}
                                        className="w-full py-4 bg-red-500 text-white rounded-2xl font-bold hover:bg-red-600 transition-all shadow-lg shadow-red-100"
                                    >
                                        Try Again
                                    </button>
                                    <button 
                                        onClick={() => {
                                            setIsRegisterOpen(false);
                                            setRegistrationStatus('idle');
                                        }}
                                        className="w-full py-2 text-gray-400 font-medium hover:text-gray-600 transition-colors"
                                    >
                                        Close
                                    </button>
                                </div>
                            </>
                        )}
                    </motion.div>
                </div>
            )}

            {isRegistrationsModalOpen && selectedEvent && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-6">
                    <div className="bg-white w-full max-w-2xl rounded-[40px] p-10 relative max-h-[80vh] flex flex-col">
                        <button onClick={() => setIsRegistrationsModalOpen(false)} className="absolute top-8 right-8 text-gray-400 hover:text-gray-600">
                            <LogOut className="w-6 h-6 rotate-180" />
                        </button>
                        <h3 className="text-2xl font-bold text-[#1F2937] mb-2">Registered Students</h3>
                        <div className="flex justify-between items-center mb-6">
                            <p className="text-sm text-[#6B7280]">Total registrations for "{selectedEvent.title}": {registrations.length}</p>
                            {user?.role === 'admin' && registrations.length > 0 && (
                                <button 
                                    onClick={toggleAllAttendance}
                                    className="text-xs font-bold text-purple-600 hover:underline"
                                >
                                    {selectedStudentsForAttendance.length === registrations.length ? 'Deselect All' : 'Select All'}
                                </button>
                            )}
                        </div>
                        
                        <div className="overflow-y-auto flex-1 pr-2">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50 text-[10px] uppercase tracking-widest text-[#9CA3AF] font-bold sticky top-0">
                                    <tr>
                                        {user?.role === 'admin' && <th className="px-6 py-4 w-10">Mark</th>}
                                        <th className="px-6 py-4">Name (Registered)</th>
                                        <th className="px-6 py-4">USN (Entered)</th>
                                        <th className="px-6 py-4">Database Info</th>
                                        <th className="px-6 py-4">Email</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {registrations.map((reg, i) => (
                                        <tr key={i} className={`hover:bg-gray-50 transition-colors ${selectedStudentsForAttendance.includes(reg.student_usn) ? 'bg-purple-50/50' : ''}`}>
                                            {user?.role === 'admin' && (
                                                <td className="px-6 py-4">
                                                    <input 
                                                        type="checkbox"
                                                        checked={selectedStudentsForAttendance.includes(reg.student_usn)}
                                                        onChange={() => toggleStudentAttendance(reg.student_usn)}
                                                        className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                                                    />
                                                </td>
                                            )}
                                            <td className="px-6 py-4 font-bold text-[#1F2937] text-sm">{reg.student_name}</td>
                                            <td className="px-6 py-4 text-sm font-bold text-[#7C3AED]">{reg.student_usn}</td>
                                            <td className="px-6 py-4 text-[10px] text-[#6B7280]">
                                                <div className="flex flex-col">
                                                    <span>DB: {reg.db_name}</span>
                                                    <span>Roll: {reg.db_usn}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-[#6B7280]">{reg.email}</td>
                                        </tr>
                                    ))}
                                    {registrations.length === 0 && (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-10 text-center text-gray-400 italic">No registrations yet.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {user?.role === 'admin' && registrations.length > 0 && (
                            <div className="mt-8 pt-6 border-t border-gray-100 flex justify-between items-center">
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                                    {selectedStudentsForAttendance.length} students selected
                                </p>
                                <button 
                                    onClick={submitEventAttendance}
                                    disabled={selectedStudentsForAttendance.length === 0}
                                    className={`px-8 py-3 rounded-2xl font-bold transition-all shadow-lg ${selectedStudentsForAttendance.length > 0 ? 'bg-[#7C3AED] text-white hover:bg-[#6D28D9] transform hover:-translate-y-0.5' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
                                >
                                    Mark Attendance & Alert Faculty
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

function TimetableView({ token, user }: { token: string, user: any }) {
    const [slots, setSlots] = useState<any[]>([]);
    const [rooms, setRooms] = useState<any[]>([]);
    const [timetables, setTimetables] = useState<any[]>([]);
    const [selectedTimetable, setSelectedTimetable] = useState<any>(null);
    const [entries, setEntries] = useState<any[]>([]);
    const [isGenerationOpen, setIsGenerationOpen] = useState(false);
    const [isAddEntryOpen, setIsAddEntryOpen] = useState(false);
    const [isSubstitutionOpen, setIsSubstitutionOpen] = useState(false);
    const [selectedEntry, setSelectedEntry] = useState<any>(null);
    const [preSelectedSlot, setPreSelectedSlot] = useState<any>(null);
    const [facultyList, setFacultyList] = useState<any[]>([]);
    const [subjects, setSubjects] = useState<any[]>([]);
    const [subRequests, setSubRequests] = useState<any[]>([]);
    const [activeTimetableTab, setActiveTimetableTab] = useState<'grid' | 'requests'>('grid');
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    
    useEffect(() => {
        const socket = io();

        socket.on("connect", () => {
            console.log("Connected to WebSocket");
            if (user.role === 'admin') {
                socket.emit("join", "admin");
            }
        });

        socket.on("timetableChanged", (data) => {
            console.log("Timetable changed:", data);
            // Check if this change is relevant to the current user
            // For simplicity, we trigger a refresh for everyone if relevant fields match
            setRefreshTrigger(prev => prev + 1);
        });

        socket.on("substitutionRequested", () => {
            if (user.role === 'admin') {
                fetch('/api/admin/substitution-requests', { headers: { 'Authorization': `Bearer ${token}` } })
                    .then(res => res.json()).then(setSubRequests);
            }
        });

        return () => {
            socket.disconnect();
        };
    }, [token, user.role]);
    
    useEffect(() => {
        fetch('/api/timetable/slots', { headers: { 'Authorization': `Bearer ${token}` } })
            .then(res => res.json()).then(setSlots);
        fetch('/api/timetable/rooms', { headers: { 'Authorization': `Bearer ${token}` } })
            .then(res => res.json()).then(setRooms);
        
        if (user.role === 'admin') {
            fetch('/api/admin/timetables', { headers: { 'Authorization': `Bearer ${token}` } })
                .then(res => res.json()).then(setTimetables);
            fetch('/api/faculty', { headers: { 'Authorization': `Bearer ${token}` } })
                .then(res => res.json()).then(setFacultyList);
            fetch('/api/admin/substitution-requests', { headers: { 'Authorization': `Bearer ${token}` } })
                .then(res => res.json()).then(setSubRequests);
        } else if (user.role === 'faculty') {
            fetch('/api/faculty', { headers: { 'Authorization': `Bearer ${token}` } })
                .then(res => res.json()).then(setFacultyList);
        }
    }, [token, user.role, refreshTrigger]);

    useEffect(() => {
        let url = '/api/timetable';
        if (user.role === 'faculty') {
            url += `?facultyId=${user.id}`;
        } else if (user.role === 'student') {
            url += `?studentId=${user.id}`;
        } else if (selectedTimetable) {
            url += `?department=${selectedTimetable.department}&semester=${selectedTimetable.semester}&section=${selectedTimetable.section}`;
        }
        
        fetch(url, { headers: { 'Authorization': `Bearer ${token}` } })
            .then(res => res.json())
            .then(data => setEntries(Array.isArray(data) ? data : []));
    }, [token, user, selectedTimetable, refreshTrigger]);

    useEffect(() => {
        if (selectedTimetable) {
            fetch(`/api/subjects?semester=${selectedTimetable.semester}&department=${selectedTimetable.department}`, { 
                headers: { 'Authorization': `Bearer ${token}` } 
            }).then(res => res.json()).then(setSubjects);
        }
    }, [selectedTimetable, token]);

    const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
    const periodNumbers = Array.from({ length: 7 }, (_, i) => i + 1);

    const getEntries = (day: string, period: number) => {
        return entries.filter(e => e.day === day && e.period_number === period);
    };

    const handleCreateTimetable = async (e: React.FormEvent) => {
        e.preventDefault();
        const formData = new FormData(e.target as HTMLFormElement);
        const res = await fetch('/api/admin/timetable', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({
                department: formData.get('department'),
                semester: parseInt(formData.get('semester') as string),
                section: formData.get('section'),
                academicYear: formData.get('academicYear')
            })
        });
        if (res.ok) {
            const data = await res.json();
            setSelectedTimetable({ id: data.id, department: formData.get('department'), semester: parseInt(formData.get('semester') as string), section: formData.get('section') });
            fetch('/api/admin/timetables', { headers: { 'Authorization': `Bearer ${token}` } })
                .then(res => res.json()).then(setTimetables);
            setIsGenerationOpen(false);
        }
    };

    const handleManualEntry = async (e: React.FormEvent) => {
        e.preventDefault();
        const formData = new FormData(e.target as HTMLFormElement);
        const res = await fetch('/api/admin/timetable/entry', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({
                timetableId: selectedTimetable.id,
                subjectId: parseInt(formData.get('subjectId') as string),
                facultyId: parseInt(formData.get('facultyId') as string),
                roomId: parseInt(formData.get('roomId') as string),
                timeSlotId: parseInt(preSelectedSlot?.id || formData.get('timeSlotId'))
            })
        });
        if (res.ok) {
            setIsAddEntryOpen(false);
            setPreSelectedSlot(null);
            const url = `/api/timetable?timetableId=${selectedTimetable.id}`;
            fetch(url, { headers: { 'Authorization': `Bearer ${token}` } })
                .then(res => res.json()).then(setEntries);
        } else {
            const data = await res.json();
            alert(data.message);
        }
    };

    const handleDeleteEntry = async (entryId: number) => {
        const res = await fetch(`/api/admin/timetable/entry/${entryId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
            const url = `/api/timetable?timetableId=${selectedTimetable.id}`;
            fetch(url, { headers: { 'Authorization': `Bearer ${token}` } })
                .then(res => res.json()).then(setEntries);
        }
    };

    const handleGenerate = async () => {
        const res = await fetch('/api/admin/timetable/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ timetableId: selectedTimetable.id })
        });
        if (res.ok) {
            const url = `/api/timetable?timetableId=${selectedTimetable.id}`;
            fetch(url, { headers: { 'Authorization': `Bearer ${token}` } })
                .then(res => res.json()).then(setEntries);
        }
    };

    const handleSubstitution = async (e: React.FormEvent) => {
        e.preventDefault();
        const formData = new FormData(e.target as HTMLFormElement);
        const endpoint = user.role === 'admin' ? '/api/admin/substitution' : '/api/faculty/substitution-request';
        
        const res = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({
                entryId: selectedEntry.id,
                substituteFacultyId: parseInt(formData.get('substituteFacultyId') as string),
                reason: formData.get('reason')
            })
        });
        if (res.ok) {
            setIsSubstitutionOpen(false);
            alert(user.role === 'faculty' ? 'Request sent to admin' : 'Substitution assigned successfully');
            const url = user.role === 'admin' 
                ? `/api/timetable?timetableId=${selectedTimetable.id}`
                : `/api/timetable?facultyId=${user.id}`;
            fetch(url, { headers: { 'Authorization': `Bearer ${token}` } })
                .then(res => res.json()).then(setEntries);
        } else {
            const data = await res.json();
            alert(data.message);
        }
    };

    const handleApproveRequest = async (requestId: number, status: 'approved' | 'rejected') => {
        const res = await fetch('/api/admin/substitution/approve', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ requestId, status })
        });
        if (res.ok) {
            fetch('/api/admin/substitution-requests', { headers: { 'Authorization': `Bearer ${token}` } })
                .then(res => res.json()).then(setSubRequests);
            if (selectedTimetable) {
                const url = `/api/timetable?timetableId=${selectedTimetable.id}`;
                fetch(url, { headers: { 'Authorization': `Bearer ${token}` } })
                    .then(res => res.json()).then(setEntries);
            }
        }
    };

    return (
        <div className="space-y-8 pb-20">
            <div className="flex gap-4">
                <button 
                    onClick={() => setActiveTimetableTab('grid')}
                    className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${activeTimetableTab === 'grid' ? 'bg-[#7C3AED] text-white shadow-lg shadow-purple-100' : 'bg-white text-gray-400 hover:text-gray-600'}`}
                >
                    Weekly Grid
                </button>
                {user.role === 'admin' && (
                    <button 
                        onClick={() => setActiveTimetableTab('requests')}
                        className={`px-6 py-2 rounded-xl text-sm font-bold transition-all relative ${activeTimetableTab === 'requests' ? 'bg-[#7C3AED] text-white shadow-lg shadow-purple-100' : 'bg-white text-gray-400 hover:text-gray-600'}`}
                    >
                        Substitution Requests
                        {subRequests.length > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[8px] flex items-center justify-center rounded-full animate-pulse">{subRequests.length}</span>}
                    </button>
                )}
            </div>

            {activeTimetableTab === 'grid' ? (
                <>
                    <div className="bg-white rounded-[40px] shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-8 border-b border-gray-50 flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-bold text-[#1F2937]">
                                    {user.role === 'admin' ? (selectedTimetable ? `${selectedTimetable.department} Semester ${selectedTimetable.semester} Section ${selectedTimetable.section}` : 'General Grid') : 
                                     user.role === 'faculty' ? 'Your Teaching Schedule' : 'Your Class Timetable'}
                                </h3>
                                <p className="text-xs text-[#6B7280]">Weekly schedule view</p>
                            </div>
                            {user.role === 'admin' && selectedTimetable && (
                                <div className="flex gap-2">
                                     <button 
                                        onClick={handleGenerate}
                                        className="px-4 py-2 bg-green-50 text-green-600 rounded-xl text-xs font-bold hover:bg-green-100 transition-colors"
                                    >
                                        Auto-Fill
                                    </button>
                                     <button 
                                        onClick={() => setIsAddEntryOpen(true)}
                                        className="px-4 py-2 bg-purple-50 text-[#7C3AED] rounded-xl text-xs font-bold hover:bg-purple-100 transition-colors"
                                    >
                                        Manual Entry
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse">
                                <thead>
                                    <tr className="bg-gray-50/50">
                                        <th className="px-6 py-4 border-b border-gray-100 text-left text-[10px] uppercase tracking-widest text-[#9CA3AF] font-bold w-32">Day / Period</th>
                                        {periodNumbers.map(p => (
                                            <th key={p} className="px-6 py-4 border-b border-gray-100 text-center text-[10px] uppercase tracking-widest text-[#9CA3AF] font-bold">
                                                Period {p}
                                                <span className="block font-normal text-[8px] mt-1 text-gray-400">
                                                    {slots.find(s => s.period_number === p)?.start_time || '09:00'} - {slots.find(s => s.period_number === p)?.end_time || '10:00'}
                                                </span>
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {days.map(day => (
                                        <tr key={day} className="group hover:bg-gray-50/30 transition-colors">
                                            <td className="px-6 py-8 font-bold text-[#1F2937] border-r border-gray-50 bg-gray-50/20">{day}</td>
                                            {periodNumbers.map(p => {
                                                const slotEntries = getEntries(day, p);
                                                return (
                                                    <td key={p} className="p-3 border-r border-gray-100 relative min-w-[180px] h-40">
                                                        <div className="relative w-full h-full group/slot perspective-1000">
                                                            {slotEntries.length > 0 ? (
                                                                slotEntries.map((entry, idx) => (
                                                                    <motion.div 
                                                                        key={entry.id}
                                                                        initial={{ opacity: 0, y: 10 }}
                                                                        animate={{ 
                                                                            opacity: 1, 
                                                                            y: idx * -4,
                                                                            x: idx * -4,
                                                                            rotate: idx * -1.5,
                                                                            scale: 1 - (idx * 0.02)
                                                                        }}
                                                                        whileHover={{ 
                                                                            y: -10 - (idx * 4), 
                                                                            scale: 1.05,
                                                                            rotate: 0,
                                                                            zIndex: 50 
                                                                        }}
                                                                        className={`absolute inset-0 p-4 rounded-2xl border-l-4 shadow-md flex flex-col justify-between group/entry cursor-pointer bg-white border-none overflow-hidden transition-all duration-300 ring-1 ring-black/5 ${
                                                                            entry.room_type === 'lab' ? 'hover:shadow-orange-200/50' : 'hover:shadow-purple-200/50'
                                                                        } ${entry.is_substitution ? 'ring-2 ring-blue-400' : ''}`}
                                                                        style={{ zIndex: 10 - idx }}
                                                                        onClick={() => {
                                                                            if (user.role === 'admin' || user.role === 'faculty') {
                                                                                setSelectedEntry(entry);
                                                                                setIsSubstitutionOpen(true);
                                                                            }
                                                                        }}
                                                                    >
                                                                        <div className={`absolute left-0 top-0 bottom-0 w-1 ${entry.room_type === 'lab' ? 'bg-orange-500' : 'bg-[#7C3AED]'}`} />
                                                                        <div className="absolute top-0 right-0 p-2 opacity-0 group-hover/entry:opacity-100 transition-opacity z-10">
                                                                            {user.role === 'admin' && (
                                                                                <button 
                                                                                    onClick={(e) => {
                                                                                        e.stopPropagation();
                                                                                        handleDeleteEntry(entry.id);
                                                                                    }}
                                                                                    className="p-1.5 bg-red-50 text-red-500 rounded-lg hover:bg-red-100 transition-all hover:scale-110 active:scale-95 shadow-sm"
                                                                                    title="Remove Entry"
                                                                                >
                                                                                    <X className="w-3.5 h-3.5" />
                                                                                </button>
                                                                            )}
                                                                        </div>
                                                                        <div>
                                                                            <div className="flex items-center justify-between mb-1">
                                                                                <span className={`text-[8px] font-bold uppercase tracking-tighter px-1.5 py-0.5 rounded-full shadow-sm ${
                                                                                    entry.room_type === 'lab' ? 'bg-orange-50 text-orange-600' : 'bg-purple-50 text-[#7C3AED]'
                                                                                }`}>{entry.subject_code}</span>
                                                                                <span className="text-[7px] font-black text-gray-300 uppercase letter-spacing-1">{entry.department?.split(' ').map(w => w[0]).join('')} S{entry.semester}{entry.section}</span>
                                                                            </div>
                                                                            <h4 className="text-[10px] font-extrabold text-[#1F2937] leading-tight line-clamp-2">{entry.subject_name}</h4>
                                                                        </div>
                                                                        <div className="space-y-1 mt-2">
                                                                            <div className="flex items-center gap-1.5">
                                                                                <div className="w-3.5 h-3.5 rounded-full bg-gray-50 flex items-center justify-center">
                                                                                    <User className="w-2 h-2 text-gray-400" />
                                                                                </div>
                                                                                <span className={`text-[8px] font-bold truncate ${entry.is_substitution ? 'text-blue-600' : 'text-gray-500'}`}>
                                                                                    {entry.faculty_name}
                                                                                </span>
                                                                            </div>
                                                                            <div className="flex items-center gap-1.5">
                                                                                <div className="w-3.5 h-3.5 rounded-full bg-gray-50 flex items-center justify-center">
                                                                                    <Home className="w-2 h-2 text-gray-400" />
                                                                                </div>
                                                                                <span className="text-[8px] font-bold text-gray-500">{entry.room_name}</span>
                                                                            </div>
                                                                        </div>
                                                                    </motion.div>
                                                                ))
                                                            ) : (
                                                                <div 
                                                                    onClick={() => {
                                                                        if (user.role === 'admin' && selectedTimetable) {
                                                                            const slot = slots.find(s => s.day === day && s.period_number === p);
                                                                            if (slot) {
                                                                                setPreSelectedSlot(slot);
                                                                                setIsAddEntryOpen(true);
                                                                            }
                                                                        }
                                                                    }}
                                                                    className={`h-full w-full rounded-2xl border-2 border-dashed border-gray-100 flex items-center justify-center transition-all duration-300 ${
                                                                        user.role === 'admin' && selectedTimetable ? 'cursor-pointer hover:border-purple-200 hover:bg-purple-50/20' : 'opacity-20'
                                                                    }`}
                                                                >
                                                                    <Plus className={`w-4 h-4 text-gray-300 ${user.role === 'admin' && selectedTimetable ? 'group-hover:text-purple-400' : ''}`} />
                                                                </div>
                                                            )}
                                                        </div>
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            ) : (
                <div className="bg-white rounded-[40px] shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-8 border-b border-gray-50">
                        <h3 className="text-xl font-bold text-[#1F2937]">Substitution Requests</h3>
                        <p className="text-xs text-[#6B7280]">Approve or reject faculty absence requests</p>
                    </div>
                    {subRequests.length === 0 ? (
                        <div className="p-20 text-center">
                            <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4 grayscale opacity-50">
                                <FileText className="w-8 h-8 text-gray-400" />
                            </div>
                            <p className="text-gray-400 font-bold">No pending requests</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-50">
                            {subRequests.map(req => (
                                <div key={req.id} className="p-6 hover:bg-gray-50/50 transition-colors flex items-center justify-between">
                                    <div className="flex items-center gap-6">
                                        <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center">
                                            <User className="w-6 h-6 text-blue-500" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="font-bold text-[#1F2937]">{req.faculty_name}</span>
                                                <span className="text-[10px] text-gray-400 font-bold px-2 py-0.5 bg-gray-100 rounded-full">Requested Sub: {req.substitute_name}</span>
                                            </div>
                                            <p className="text-sm font-bold text-gray-600 mb-1">{req.subject_name} • {req.day} Period {req.period_number}</p>
                                            <p className="text-xs text-red-500 italic font-medium">"Letter of Absence": {req.reason}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button 
                                            onClick={() => handleApproveRequest(req.id, 'approved')}
                                            className="px-4 py-2 bg-green-500 text-white rounded-xl text-xs font-bold hover:bg-green-600 transition-colors"
                                        >
                                            Approve
                                        </button>
                                        <button 
                                            onClick={() => handleApproveRequest(req.id, 'rejected')}
                                            className="px-4 py-2 bg-red-50 text-red-500 rounded-xl text-xs font-bold hover:bg-red-100 transition-colors"
                                        >
                                            Reject
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Modals */}
            {isAddEntryOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] flex items-center justify-center p-6">
                    <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="bg-white w-full max-w-md rounded-[40px] p-10 shadow-2xl relative">
                        <button 
                            onClick={() => { setIsAddEntryOpen(false); setPreSelectedSlot(null); }} 
                            className="absolute top-6 right-6 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all z-[110]"
                        >
                            <X className="w-6 h-6" />
                        </button>
                        <h3 className="text-2xl font-bold text-[#1F2937] mb-6">Manual Slot Fill</h3>
                        {preSelectedSlot && (
                            <div className="p-4 bg-[#7C3AED]/5 rounded-2xl mb-4 flex items-center gap-3">
                                <div className="w-10 h-10 bg-[#7C3AED] rounded-xl flex items-center justify-center text-white font-bold">
                                    <Clock className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-[#7C3AED] uppercase tracking-widest">Selected Slot</p>
                                    <p className="font-bold text-[#1F2937]">{preSelectedSlot.day} - Period {preSelectedSlot.period_number}</p>
                                </div>
                            </div>
                        )}
                        <form className="space-y-4" onSubmit={handleManualEntry}>
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Subject</label>
                                <select 
                                    name="subjectId" 
                                    required 
                                    className="w-full px-4 py-3 bg-gray-50 rounded-xl border-2 border-transparent focus:border-[#7C3AED] focus:bg-white transition-all outline-none font-bold text-sm text-[#1F2937]"
                                >
                                    <option value="">Select Subject...</option>
                                    {subjects.map(s => <option key={s.id} value={s.id}>{s.name} ({s.code})</option>)}
                                </select>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Faculty</label>
                                <select 
                                    name="facultyId" 
                                    required 
                                    className="w-full px-4 py-3 bg-gray-50 rounded-xl border-2 border-transparent focus:border-[#7C3AED] focus:bg-white transition-all outline-none font-bold text-sm text-[#1F2937]"
                                >
                                    <option value="">Select Faculty...</option>
                                    {facultyList.length > 0 ? (
                                        facultyList.map(f => <option key={f.id} value={f.id}>{f.name} ({f.department})</option>)
                                    ) : (
                                        <option disabled>No faculty found</option>
                                    )}
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Room</label>
                                    <select 
                                        name="roomId" 
                                        required 
                                        className="w-full px-4 py-3 bg-gray-50 rounded-xl border-2 border-transparent focus:border-[#7C3AED] focus:bg-white transition-all outline-none font-bold text-sm text-[#1F2937]"
                                    >
                                        <option value="">Select Room...</option>
                                        {rooms.map(r => <option key={r.id} value={r.id}>{r.room_name}</option>)}
                                    </select>
                                </div>
                                {!preSelectedSlot && (
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Slot</label>
                                        <select name="timeSlotId" required className="w-full px-4 py-3 bg-gray-50 rounded-xl border-none font-bold text-sm">
                                            {slots.map(s => <option key={s.id} value={s.id}>{s.day} Period {s.period_number}</option>)}
                                        </select>
                                    </div>
                                )}
                            </div>
                            <button 
                                type="submit" 
                                className="w-full mt-4 py-4 bg-[#7C3AED] hover:bg-[#6D31D4] text-white rounded-2xl font-bold shadow-lg shadow-purple-100 transition-all active:scale-[0.98]"
                            >
                                Save Assignment
                            </button>
                        </form>
                    </motion.div>
                </div>
            )}

            {isGenerationOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] flex items-center justify-center p-6">
                    <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="bg-white w-full max-w-md rounded-[40px] p-10 shadow-2xl relative">
                        <button 
                            onClick={() => setIsGenerationOpen(false)} 
                            className="absolute top-6 right-6 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all z-[110]"
                        >
                            <X className="w-6 h-6" />
                        </button>
                        <h3 className="text-2xl font-bold text-[#1F2937] mb-6">New Timetable Schedule</h3>
                        <form className="space-y-4" onSubmit={handleCreateTimetable}>
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Department</label>
                                <input name="department" required className="w-full px-4 py-3 bg-gray-50 rounded-xl border-none font-bold text-sm" placeholder="e.g. Computer Science" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Semester</label>
                                    <input name="semester" type="number" required className="w-full px-4 py-3 bg-gray-50 rounded-xl border-none font-bold text-sm" placeholder="e.g. 4" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Section</label>
                                    <input name="section" required className="w-full px-4 py-3 bg-gray-50 rounded-xl border-none font-bold text-sm" placeholder="e.g. A" />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Academic Year</label>
                                <input name="academicYear" required className="w-full px-4 py-3 bg-gray-50 rounded-xl border-none font-bold text-sm" placeholder="e.g. 2023-24" />
                            </div>
                            <button type="submit" className="w-full mt-4 py-4 bg-[#7C3AED] text-white rounded-2xl font-bold shadow-lg shadow-purple-100">Create & Start Building</button>
                        </form>
                    </motion.div>
                </div>
            )}

            {isSubstitutionOpen && selectedEntry && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] flex items-center justify-center p-6">
                    <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="bg-white w-full max-w-md rounded-[40px] p-10 shadow-2xl relative">
                        <button 
                            onClick={() => setIsSubstitutionOpen(false)} 
                            className="absolute top-6 right-6 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all z-[110]"
                        >
                            <X className="w-6 h-6" />
                        </button>
                        <h3 className="text-xl font-bold text-[#1F2937] mb-6">
                            {user.role === 'admin' ? 'Assign Substitution' : 'Request Substitution'}
                        </h3>
                        <div className="p-4 bg-gray-50 rounded-2xl mb-6">
                            <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Session</p>
                            <p className="font-bold text-[#1F2937]">{selectedEntry.subject_name}</p>
                            <p className="text-xs text-gray-500">Regular: {selectedEntry.faculty_name} ({selectedEntry.day} P{selectedEntry.period_number})</p>
                        </div>
                        <form className="space-y-4" onSubmit={handleSubstitution}>
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Substitute Teacher (Optional for Admin, Recommended for Faculty)</label>
                                <select name="substituteFacultyId" required className="w-full px-4 py-3 bg-gray-50 rounded-xl border-none font-bold text-sm">
                                    <option value="">Select Substitute...</option>
                                    {facultyList.filter(f => f.id !== selectedEntry.faculty_id).map(f => (
                                        <option key={f.id} value={f.id}>{f.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Letter of Absence / Reason</label>
                                <textarea name="reason" rows={3} required placeholder="Explain the reason for absence..." className="w-full px-4 py-3 bg-gray-50 rounded-xl border-none font-bold text-sm" />
                            </div>
                            <button type="submit" className="w-full py-4 bg-[#7C3AED] text-white rounded-2xl font-bold shadow-lg">
                                {user.role === 'admin' ? 'Confirm Substitution' : 'Submit Request'}
                            </button>
                        </form>
                    </motion.div>
                </div>
            )}
        </div>
    );
}

function LostFoundView({ token, user }: { token: string, user: any }) {
    const [items, setItems] = useState<any[]>([]);
    const [tab, setTab] = useState<'lost' | 'found'>('lost');
    const [search, setSearch] = useState('');
    const [isReportOpen, setIsReportOpen] = useState(false);
    const [claimProof, setClaimProof] = useState({ itemId: 0, proof: '' });

    useEffect(() => {
        fetch('/api/lost-found', { headers: { 'Authorization': `Bearer ${token}` } })
            .then(async res => (res.ok ? await safeJson(res) : []) || [])
            .then(setItems);
    }, [token]);

    const filtered = items.filter(item => 
        item.type === tab && 
        item.item_name.toLowerCase().includes(search.toLowerCase())
    );

    const handleAction = async (itemId: number, action: string) => {
        const res = await fetch('/api/admin/lost-found/action', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ itemId, action })
        });
        if (res.ok) {
            const updatedItems = items.map(item => {
                if (item.id === itemId) {
                    if (action === 'approve') return { ...item, status: 'returned' };
                    if (action === 'reject') return { ...item, status: 'found', proof: null, claimed_by: null };
                }
                return item;
            }).filter(item => action !== 'delete' || item.id !== itemId);
            setItems(updatedItems);
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex flex-wrap gap-4 items-center justify-between">
                <div className="flex bg-white p-1 rounded-2xl border border-gray-100">
                    <button 
                        onClick={() => setTab('lost')}
                        className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${tab === 'lost' ? 'bg-[#7C3AED] text-white' : 'text-gray-500'}`}
                    >
                        Lost Items
                    </button>
                    <button 
                        onClick={() => setTab('found')}
                        className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${tab === 'found' ? 'bg-[#7C3AED] text-white' : 'text-gray-500'}`}
                    >
                        Found Items
                    </button>
                </div>
                <div className="flex gap-4 flex-1 max-w-md">
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input 
                            placeholder="Search items..."
                            className="w-full pl-10 pr-4 py-3 bg-white border border-gray-100 rounded-2xl outline-none"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <motion.button 
                        whileHover={{ scale: 1.05, boxShadow: "0 0 20px rgba(255,255,255,0.5)" }}
                        onClick={() => setIsReportOpen(true)} 
                        className="px-6 py-3 bg-[#7C3AED] text-white rounded-2xl font-bold text-sm"
                    >
                        Report
                    </motion.button>
                </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
                {filtered.map((item, i) => (
                    <div key={i} className="bg-white rounded-[32px] overflow-hidden shadow-sm border border-gray-50">
                        <div className="h-48 bg-gray-100 relative">
                            <img src={item.image_url || `https://picsum.photos/seed/${item.id}/400/300`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            <span className={`absolute top-4 right-4 px-3 py-1 rounded-full text-[10px] font-bold uppercase ${
                                item.status === 'returned' ? 'bg-blue-500 text-white' : item.status === 'claimed' ? 'bg-orange-500 text-white' : 'bg-gray-500 text-white'
                            }`}>
                                {item.status}
                            </span>
                        </div>
                        <div className="p-6">
                            <h3 className="font-bold text-[#1F2937] mb-1">{item.item_name}</h3>
                            <p className="text-xs text-[#6B7280] mb-2">{item.location} • {new Date(item.date_reported).toLocaleDateString()}</p>
                            <p className="text-xs text-[#6B7280] mb-4 line-clamp-2">{item.description}</p>
                            
                            <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                                <span className="text-[10px] text-[#9CA3AF] font-medium">By {item.reporter_name}</span>
                                {item.status === 'found' && user.role === 'student' && (
                                    <button 
                                        onClick={() => setClaimProof({ itemId: item.id, proof: '' })}
                                        className="text-xs font-bold text-[#7C3AED]"
                                    >
                                        Claim Item
                                    </button>
                                )}
                                {(user.role === 'admin' || user.role === 'faculty') && (
                                    <div className="flex gap-2">
                                        {item.status === 'claimed' && (
                                            <>
                                                <button onClick={() => handleAction(item.id, 'approve')} className="text-[10px] font-bold text-green-500">Approve</button>
                                                <button onClick={() => handleAction(item.id, 'reject')} className="text-[10px] font-bold text-red-500">Reject</button>
                                            </>
                                        )}
                                        <button onClick={() => handleAction(item.id, 'delete')} className="text-[10px] font-bold text-gray-400">Delete</button>
                                    </div>
                                )}
                            </div>
                            {item.status === 'claimed' && (user.role === 'admin') && (
                                <div className="mt-4 p-3 bg-orange-50 rounded-xl text-[10px] text-orange-700">
                                    <strong>Proof:</strong> {item.proof}
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {isReportOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-6">
                    <div className="bg-white w-full max-w-md rounded-[40px] p-10 relative">
                        <h3 className="text-2xl font-bold mb-6">Report Item</h3>
                        <form className="space-y-4" onSubmit={async (e) => {
                            e.preventDefault();
                            const formData = new FormData(e.currentTarget);
                            const payload = Object.fromEntries(formData.entries());
                            await fetch('/api/lost-found', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                                body: JSON.stringify(payload)
                            });
                            setIsReportOpen(false);
                            window.location.reload();
                        }}>
                            <select name="type" required className="w-full px-4 py-3 bg-gray-50 rounded-xl border-none outline-none">
                                <option value="lost">I lost something</option>
                                <option value="found">I found something</option>
                            </select>
                            <input name="itemName" placeholder="Item Name" required className="w-full px-4 py-3 bg-gray-50 rounded-xl border-none outline-none" />
                            <input name="location" placeholder="Location" required className="w-full px-4 py-3 bg-gray-50 rounded-xl border-none outline-none" />
                            <input name="dateReported" type="date" required className="w-full px-4 py-3 bg-gray-50 rounded-xl border-none outline-none" />
                            <textarea name="description" placeholder="Description" className="w-full px-4 py-3 bg-gray-50 rounded-xl border-none outline-none" />
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-400 uppercase">Upload Image</label>
                                <input name="file" type="file" className="w-full px-4 py-3 bg-gray-50 rounded-xl border-none outline-none" />
                            </div>
                            <button type="submit" className="w-full py-4 bg-[#7C3AED] text-white rounded-2xl font-bold">Submit Report</button>
                            <button type="button" onClick={() => setIsReportOpen(false)} className="w-full py-2 text-gray-500">Cancel</button>
                        </form>
                    </div>
                </div>
            )}

            {claimProof.itemId !== 0 && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-6">
                    <div className="bg-white w-full max-w-md rounded-[40px] p-10 relative">
                        <h3 className="text-2xl font-bold mb-4">Claim Item</h3>
                        <p className="text-sm text-gray-500 mb-6">Please upload proof of ownership or provide details.</p>
                        <div className="space-y-4">
                            <input type="file" className="w-full px-4 py-3 bg-gray-50 rounded-xl border-none outline-none" />
                            <textarea 
                                className="w-full px-4 py-3 bg-gray-50 rounded-xl border-none outline-none"
                                placeholder="Additional details..."
                                value={claimProof.proof}
                                onChange={(e) => setClaimProof({...claimProof, proof: e.target.value})}
                            />
                        </div>
                        <button 
                            onClick={async () => {
                                await fetch('/api/lost-found/claim', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                                    body: JSON.stringify(claimProof)
                                });
                                setClaimProof({ itemId: 0, proof: '' });
                                window.location.reload();
                            }}
                            className="w-full py-4 bg-[#7C3AED] text-white rounded-2xl font-bold"
                        >
                            Submit Claim
                        </button>
                        <button onClick={() => setClaimProof({ itemId: 0, proof: '' })} className="w-full py-2 text-gray-500 mt-2">Cancel</button>
                    </div>
                </div>
            )}
        </div>
    );
}

function LibraryView({ token, user, setActiveTab }: { token: string, user: any, setActiveTab: (t: string) => void }) {
    const [books, setBooks] = useState<any[]>([]);
    const [status, setStatus] = useState<string>('open');
    const [search, setSearch] = useState('');
    const [editingBook, setEditingBook] = useState<any>(null);
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [isScannerOpen, setIsScannerOpen] = useState(false);

    const fetchBooks = () => {
        fetch('/api/library/books', { headers: { 'Authorization': `Bearer ${token}` } })
            .then(async res => (res.ok ? await safeJson(res) : []) || [])
            .then(setBooks);
    };

    useEffect(() => {
        fetchBooks();
        fetch('/api/library/status')
            .then(async res => (res.ok ? await safeJson(res) : { status: 'open' }) || { status: 'open' })
            .then(data => setStatus(data.status));
    }, [token]);

    const filtered = books.filter(b => b.title.toLowerCase().includes(search.toLowerCase()) || b.author.toLowerCase().includes(search.toLowerCase()));

    const updateStatus = async (newStatus: string) => {
        const res = await fetch('/api/librarian/status', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ status: newStatus })
        });
        if (res.ok) setStatus(newStatus);
    };

    const handleAddBook = async (e: React.FormEvent) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget as HTMLFormElement);
        const payload = Object.fromEntries(formData.entries());
        const res = await fetch('/api/librarian/books', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(payload)
        });
        if (res.ok) {
            setIsAddOpen(false);
            fetch('/api/library/books', { headers: { 'Authorization': `Bearer ${token}` } })
                .then(async res => (res.ok ? await safeJson(res) : []) || [])
                .then(setBooks);
        }
    };

    const removeBook = async (id: number) => {
        if (!confirm('Are you sure you want to remove this book?')) return;
        const res = await fetch(`/api/librarian/books/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) setBooks(books.filter(b => b.id !== id));
    };

    const handleUpdateBook = async (e: React.FormEvent) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget as HTMLFormElement);
        const payload = {
            id: editingBook.id,
            availability: formData.get('availability'),
            copies: parseInt(formData.get('copies') as string)
        };
        const res = await fetch('/api/librarian/books', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(payload)
        });
        if (res.ok) {
            setBooks(books.map(b => b.id === editingBook.id ? { ...b, ...payload } : b));
            setEditingBook(null);
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex flex-wrap gap-6 items-center justify-between bg-white p-8 rounded-[40px] shadow-sm border border-gray-50">
                <div className="flex items-center gap-4">
                    <div className={`w-4 h-4 rounded-full ${status === 'open' ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                    <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Library Status</p>
                        <p className="text-xl font-bold text-[#1F2937] capitalize">{status}</p>
                    </div>
                </div>
                <div className="flex-1 max-w-md relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input 
                        placeholder="Search books by title or author..."
                        className="w-full pl-10 pr-4 py-3 bg-gray-50 rounded-2xl outline-none"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                {(user.role === 'librarian' || user.role === 'admin') && (
                    <div className="flex gap-2">
                        <button onClick={() => setIsScannerOpen(true)} className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold flex items-center gap-2">
                            <QrCode className="w-4 h-4" /> Scan Book
                        </button>
                        <button onClick={() => setIsAddOpen(true)} className="px-4 py-2 bg-[#7C3AED] text-white rounded-xl text-xs font-bold">Add Book</button>
                        <button onClick={() => updateStatus('open')} className="px-4 py-2 bg-green-100 text-green-600 rounded-xl text-xs font-bold">Open</button>
                        <button onClick={() => updateStatus('closed')} className="px-4 py-2 bg-red-100 text-red-600 rounded-xl text-xs font-bold">Close</button>
                    </div>
                )}
            </div>

            {isScannerOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-6">
                    <div className="bg-white w-full max-w-2xl rounded-[40px] p-10 relative max-h-[85vh] overflow-y-auto">
                        <button onClick={() => setIsScannerOpen(false)} className="absolute top-8 right-8 text-gray-400 hover:text-gray-600">
                            <X className="w-6 h-6" />
                        </button>
                        <BookScannerView token={token} onSuccess={() => {
                            fetchBooks();
                        }} />
                    </div>
                </div>
            )}

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filtered.map((book, i) => (
                    <div key={book.id || i} className="bg-white p-6 rounded-[32px] shadow-sm border border-gray-50 flex flex-col">
                        <div className="flex justify-between items-start mb-4">
                            <div className="w-16 h-24 bg-purple-50 rounded-xl overflow-hidden flex items-center justify-center shadow-inner">
                                {book.cover_image ? (
                                    <img src={book.cover_image} alt={book.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                ) : (
                                    <BookOpen className="text-[#7C3AED] w-8 h-8" />
                                )}
                            </div>
                            <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${
                                book.availability === 'available' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                            }`}>
                                {(book.availability || 'available').replace('_', ' ')}
                            </span>
                        </div>
                        <h3 className="font-bold text-[#1F2937] mb-1 line-clamp-1">{book.title}</h3>
                        <p className="text-xs text-[#6B7280] mb-2">By {book.author}</p>
                        {book.description && (
                            <p className="text-[10px] text-gray-400 line-clamp-2 mb-4 italic">
                                {book.description.substring(0, 100)}...
                            </p>
                        )}
                        <div className="flex items-center justify-between pt-4 border-t border-gray-50 mt-auto">
                            <span className="text-[10px] text-[#9CA3AF] font-medium">{book.copies || 1} Copies Available</span>
                            {(user.role === 'librarian' || user.role === 'admin') && (
                                <div className="flex gap-4">
                                    <button 
                                        onClick={() => setEditingBook(book)}
                                        className="text-xs font-bold text-[#7C3AED]"
                                    >
                                        Edit
                                    </button>
                                    <button 
                                        onClick={() => removeBook(book.id)}
                                        className="text-xs font-bold text-red-500"
                                    >
                                        Remove
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {isAddOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-6">
                    <div className="bg-white w-full max-w-md rounded-[40px] p-10 relative">
                        <h3 className="text-2xl font-bold mb-6">Add New Book</h3>
                        <form className="space-y-4" onSubmit={handleAddBook}>
                            <input name="title" placeholder="Book Title" required className="w-full px-4 py-3 bg-gray-50 rounded-xl border-none outline-none" />
                            <input name="author" placeholder="Author" required className="w-full px-4 py-3 bg-gray-50 rounded-xl border-none outline-none" />
                            <input name="category" placeholder="Category" required className="w-full px-4 py-3 bg-gray-50 rounded-xl border-none outline-none" />
                            <input name="copies" type="number" placeholder="Total Copies" required className="w-full px-4 py-3 bg-gray-50 rounded-xl border-none outline-none" />
                            <button type="submit" className="w-full py-4 bg-[#7C3AED] text-white rounded-2xl font-bold">Add Book</button>
                            <button type="button" onClick={() => setIsAddOpen(false)} className="w-full py-2 text-gray-500">Cancel</button>
                        </form>
                    </div>
                </div>
            )}

            {editingBook && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-6">
                    <div className="bg-white w-full max-w-md rounded-[40px] p-10 relative">
                        <h3 className="text-2xl font-bold mb-6">Edit Book</h3>
                        <form className="space-y-4" onSubmit={handleUpdateBook}>
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Availability</label>
                                <select 
                                    name="availability" 
                                    defaultValue={editingBook.availability}
                                    className="w-full px-4 py-3 bg-gray-50 rounded-xl border-none outline-none"
                                >
                                    <option value="available">Available</option>
                                    <option value="not_available">Not Available</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Total Copies</label>
                                <input 
                                    name="copies" 
                                    type="number" 
                                    defaultValue={editingBook.copies}
                                    className="w-full px-4 py-3 bg-gray-50 rounded-xl border-none outline-none" 
                                />
                            </div>
                            <button type="submit" className="w-full py-4 bg-[#7C3AED] text-white rounded-2xl font-bold">Update Book</button>
                            <button type="button" onClick={() => setEditingBook(null)} className="w-full py-2 text-gray-500">Cancel</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

function FeesView({ token }: { token: string }) {
    const [fees, setFees] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const { user } = useAuth();

    useEffect(() => {
        const endpoint = user?.role === 'admin' ? '/api/admin/fees' : '/api/student/fees';
        fetch(endpoint, { headers: { 'Authorization': `Bearer ${token}` } })
            .then(async res => (res.ok ? await safeJson(res) : []) || [])
            .then(setFees)
            .finally(() => setLoading(false));
    }, [token, user?.role]);

    const updateFeeStatus = async (feeId: number, status: string) => {
        await fetch('/api/admin/fees/update', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ feeId, status })
        });
        setFees(fees.map(f => f.id === feeId ? { ...f, status } : f));
    };

    const filteredFees = fees.filter(f => 
        !searchTerm || 
        f.student_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.roll_number?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return <div className="p-8 text-center">Loading fees...</div>;

    return (
        <div className="space-y-8">
            <div className="bg-white p-10 rounded-[40px] shadow-sm border border-gray-50">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                    <h2 className="text-2xl font-bold text-[#1F2937]">
                        {user?.role === 'admin' ? 'All Student Fees' : 'My Fee Structure - 2026'}
                    </h2>
                    {user?.role === 'admin' && (
                        <div className="relative w-full md:w-72">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input 
                                type="text"
                                placeholder="Search student by name or ID..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-purple-100 transition-all"
                            />
                        </div>
                    )}
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 text-[10px] uppercase tracking-widest text-[#9CA3AF] font-bold">
                            <tr>
                                {user?.role === 'admin' && <th className="px-8 py-4">Student</th>}
                                <th className="px-8 py-4">Amount</th>
                                <th className="px-8 py-4">Due Date</th>
                                <th className="px-8 py-4">Status</th>
                                {user?.role === 'admin' && <th className="px-8 py-4">Action</th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filteredFees.map((f, i) => (
                                <tr key={i}>
                                    {user?.role === 'admin' && (
                                        <td className="px-8 py-5">
                                            <p className="font-bold text-[#1F2937]">{f.student_name}</p>
                                            <p className="text-xs text-[#6B7280]">{f.roll_number}</p>
                                        </td>
                                    )}
                                    <td className="px-8 py-5 font-bold text-[#1F2937]">₹{f.amount.toLocaleString()}</td>
                                    <td className="px-8 py-5 text-sm text-[#6B7280]">{f.due_date}</td>
                                    <td className="px-8 py-5">
                                        <span className={`px-4 py-1.5 rounded-full text-xs font-bold ${
                                            f.status === 'paid' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                                        }`}>
                                            {f.status}
                                        </span>
                                    </td>
                                    {user?.role === 'admin' && (
                                        <td className="px-8 py-5">
                                            <select 
                                                value={f.status}
                                                onChange={(e) => updateFeeStatus(f.id, e.target.value)}
                                                className="px-3 py-1 bg-gray-50 border border-gray-100 rounded-lg text-xs outline-none"
                                            >
                                                <option value="paid">Paid</option>
                                                <option value="pending">Pending</option>
                                                <option value="partial">Partial</option>
                                            </select>
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {user?.role === 'student' && fees.length > 0 && (
                    <div className="pt-8 mt-8 border-t border-gray-100 flex justify-between items-center">
                        <div>
                            <p className="text-sm text-[#6B7280]">Total Outstanding</p>
                            <p className="text-3xl font-bold text-[#1F2937]">
                                ₹{fees.filter(f => f.status !== 'paid').reduce((acc, curr) => acc + curr.amount, 0).toLocaleString()}
                            </p>
                        </div>
                        <motion.button 
                            whileHover={{ scale: 1.05, boxShadow: "0 0 20px rgba(255,255,255,0.5)" }}
                            className="px-8 py-4 bg-[#7C3AED] text-white rounded-2xl font-bold hover:bg-[#6D28D9] transition-all shadow-lg shadow-purple-100"
                        >
                            Pay Now
                        </motion.button>
                    </div>
                )}
            </div>
        </div>
    );
}

function LibrarianDashboard({ token }: { token: string }) {
    const [stats, setStats] = useState({ totalBooks: 0, issuedBooks: 0, status: 'open' });
    const [books, setBooks] = useState<any[]>([]);
    const [isEditOpen, setIsEditOpen] = useState<any>(null);

    useEffect(() => {
        fetch('/api/library/books', { headers: { 'Authorization': `Bearer ${token}` } })
            .then(async res => (res.ok ? await safeJson(res) : []) || [])
            .then(setBooks);
        fetch('/api/library/status')
            .then(async res => (res.ok ? await safeJson(res) : { status: 'open' }) || { status: 'open' })
            .then(data => setStats(prev => ({ ...prev, status: data.status })));
    }, [token]);

    const updateStatus = async (newStatus: string) => {
        await fetch('/api/librarian/status', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ status: newStatus })
        });
        setStats({ ...stats, status: newStatus });
    };

    const updateBook = async (e: React.FormEvent) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget as HTMLFormElement);
        const payload = {
            bookId: isEditOpen.id,
            availability: formData.get('availability'),
            copies: parseInt(formData.get('copies') as string)
        };
        await fetch('/api/librarian/books/availability', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(payload)
        });
        setIsEditOpen(null);
        window.location.reload();
    };

    return (
        <div className="space-y-8">
            <div className="grid md:grid-cols-3 gap-6">
                <div className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-50">
                    <p className="text-xs font-bold text-gray-400 uppercase mb-2">Library Status</p>
                    <div className="flex items-center justify-between">
                        <span className={`text-2xl font-bold ${stats.status === 'open' ? 'text-green-500' : 'text-red-500'}`}>{stats.status.toUpperCase()}</span>
                        <div className="flex gap-2">
                            <motion.button whileHover={{ scale: 1.1 }} onClick={() => updateStatus('open')} className="p-2 bg-green-50 text-green-600 rounded-lg"><Clock className="w-4 h-4" /></motion.button>
                            <motion.button whileHover={{ scale: 1.1 }} onClick={() => updateStatus('closed')} className="p-2 bg-red-50 text-red-600 rounded-lg"><LogOut className="w-4 h-4" /></motion.button>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-50">
                    <p className="text-xs font-bold text-gray-400 uppercase mb-2">Total Books</p>
                    <span className="text-3xl font-bold text-[#1F2937]">{books.length}</span>
                </div>
                <div className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-50">
                    <p className="text-xs font-bold text-gray-400 uppercase mb-2">Issued Books</p>
                    <span className="text-3xl font-bold text-[#1F2937]">{books.filter(b => b.status === 'issued').length}</span>
                </div>
            </div>

            <div className="bg-white rounded-[40px] shadow-sm border border-gray-50 overflow-hidden">
                <div className="p-8 border-b border-gray-50">
                    <h2 className="text-xl font-bold">Manage Inventory</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 text-[10px] uppercase font-bold text-gray-400">
                            <tr>
                                <th className="px-8 py-4">Title</th>
                                <th className="px-8 py-4">Availability</th>
                                <th className="px-8 py-4">Copies</th>
                                <th className="px-8 py-4">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {books.map((b, i) => (
                                <tr key={i}>
                                    <td className="px-8 py-5 font-bold">{b.title}</td>
                                    <td className="px-8 py-5">
                                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${b.availability === 'available' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                            {b.availability}
                                        </span>
                                    </td>
                                    <td className="px-8 py-5 text-sm">{b.copies}</td>
                                    <td className="px-8 py-5">
                                        <motion.button whileHover={{ scale: 1.1 }} onClick={() => setIsEditOpen(b)} className="text-[#7C3AED] font-bold text-sm">Edit</motion.button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {isEditOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-6">
                    <div className="bg-white w-full max-w-md rounded-[40px] p-10 relative">
                        <h3 className="text-2xl font-bold mb-6">Edit Book Status</h3>
                        <form onSubmit={updateBook} className="space-y-4">
                            <select name="availability" defaultValue={isEditOpen.availability} className="w-full px-4 py-3 bg-gray-50 rounded-xl border-none outline-none">
                                <option value="available">Available</option>
                                <option value="not_available">Not Available</option>
                            </select>
                            <input name="copies" type="number" defaultValue={isEditOpen.copies} className="w-full px-4 py-3 bg-gray-50 rounded-xl border-none outline-none" />
                            <motion.button 
                                whileHover={{ scale: 1.05, boxShadow: "0 0 20px rgba(255,255,255,0.5)" }}
                                type="submit" 
                                className="w-full py-4 bg-[#7C3AED] text-white rounded-2xl font-bold"
                            >
                                Save Changes
                            </motion.button>
                            <button type="button" onClick={() => setIsEditOpen(null)} className="w-full py-2 text-gray-500">Cancel</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

function AdminPanelView({ token }: { token: string }) {
    const [students, setStudents] = useState<any[]>([]);
    const [teachers, setTeachers] = useState<any[]>([]);
    const [directoryTab, setDirectoryTab] = useState<'students' | 'faculty'>('students');
    const [subjects, setSubjects] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterDept, setFilterDept] = useState('');
    const [filterSem, setFilterSem] = useState('');
    const [sortBy, setSortBy] = useState<'name' | 'roll_number' | 'cgpa' | 'department' | 'semester'>('name');
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [isAddFacultyOpen, setIsAddFacultyOpen] = useState(false);
    const [isNotifOpen, setIsNotifOpen] = useState(false);
    const [isSubjectAssignOpen, setIsSubjectAssignOpen] = useState(false);
    const [pendingAssignments, setPendingAssignments] = useState<{[key: number]: number}>({});
    const [editingStudent, setEditingStudent] = useState<any>(null);
    const [addingFee, setAddingFee] = useState<any>(null);

    useEffect(() => {
        fetch('/api/admin/students', { headers: { 'Authorization': `Bearer ${token}` } })
            .then(async res => (res.ok ? await safeJson(res) : []) || [])
            .then(setStudents);
        fetch('/api/subjects', { headers: { 'Authorization': `Bearer ${token}` } })
            .then(async res => (res.ok ? await safeJson(res) : []) || [])
            .then(setSubjects);
        fetch('/api/admin/faculty', { headers: { 'Authorization': `Bearer ${token}` } })
            .then(async res => (res.ok ? await safeJson(res) : []) || [])
            .then(setTeachers);
    }, [token]);

    const handleUpdateStudent = async (e: React.FormEvent) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget as HTMLFormElement);
        const payload = {
            studentId: editingStudent.id,
            cgpa: parseFloat(formData.get('cgpa') as string),
            markscardUrl: formData.get('markscardUrl')
        };
        const res = await fetch('/api/admin/students/update', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(payload)
        });
        if (res.ok) {
            setStudents(students.map(s => s.id === editingStudent.id ? { ...s, ...payload } : s));
            setEditingStudent(null);
        }
    };

    const handleAddFee = async (e: React.FormEvent) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget as HTMLFormElement);
        const payload = {
            studentId: addingFee.id,
            amount: parseFloat(formData.get('amount') as string),
            dueDate: formData.get('dueDate'),
            status: formData.get('status')
        };
        const res = await fetch('/api/admin/fees', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(payload)
        });
        if (res.ok) {
            setAddingFee(null);
            alert('Fee added successfully');
        }
    };

    const filteredStudents = students.filter(s => 
        (!searchTerm || 
        s.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.roll_number?.toLowerCase().includes(searchTerm.toLowerCase())) &&
        (!filterDept || s.department === filterDept) &&
        (!filterSem || s.semester?.toString() === filterSem)
    ).sort((a, b) => {
        if (sortBy === 'cgpa') return (b.cgpa || 0) - (a.cgpa || 0);
        if (sortBy === 'semester') return (a.semester || 0) - (b.semester || 0);
        return String(a[sortBy]).localeCompare(String(b[sortBy]));
    });

    const filteredTeachers = teachers.filter(t => 
        (!searchTerm || 
        t.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.email?.toLowerCase().includes(searchTerm.toLowerCase())) &&
        (!filterDept || t.department === filterDept)
    );

    return (
        <div className="space-y-8">
            <div className="flex gap-4 mb-4">
                <button 
                    onClick={() => setDirectoryTab('students')}
                    className={`px-6 py-2 rounded-xl font-bold text-sm transition-all ${directoryTab === 'students' ? 'bg-[#7C3AED] text-white shadow-lg shadow-purple-200' : 'bg-white text-gray-400 hover:bg-gray-50'}`}
                >
                    Students ({students.length})
                </button>
                <button 
                    onClick={() => setDirectoryTab('faculty')}
                    className={`px-6 py-2 rounded-xl font-bold text-sm transition-all ${directoryTab === 'faculty' ? 'bg-[#7C3AED] text-white shadow-lg shadow-purple-200' : 'bg-white text-gray-400 hover:bg-gray-50'}`}
                >
                    Faculty ({teachers.length})
                </button>
            </div>

            <div className="bg-white rounded-[40px] shadow-sm border border-gray-50 overflow-hidden">
                <div className="p-8 border-b border-gray-50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex flex-col gap-1">
                        <h2 className="text-xl font-bold text-[#1F2937]">
                            {directoryTab === 'students' ? 'Student Directory' : 'Faculty Directory'}
                        </h2>
                        <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">
                            {directoryTab === 'students' ? 'Manage all registered students' : 'Manage faculty members'}
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-4 w-full md:w-auto">
                        <div className="flex gap-2">
                            <select 
                                value={filterDept}
                                onChange={(e) => setFilterDept(e.target.value)}
                                className="px-3 py-2 bg-gray-50 border border-gray-100 rounded-xl text-xs font-bold outline-none"
                            >
                                <option value="">All Depts</option>
                                <option value="CSE">CSE</option>
                                <option value="ISE">ISE</option>
                                <option value="ECE">ECE</option>
                                <option value="ALML">ALML</option>
                            </select>
                            {directoryTab === 'students' && (
                                <select 
                                    value={filterSem}
                                    onChange={(e) => setFilterSem(e.target.value)}
                                    className="px-3 py-2 bg-gray-50 border border-gray-100 rounded-xl text-xs font-bold outline-none"
                                >
                                    <option value="">All Sems</option>
                                    {[1,2,3,4,5,6,7,8].map(sem => <option key={sem} value={sem}>{sem}</option>)}
                                </select>
                            )}
                            {directoryTab === 'students' && (
                                <select 
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value as any)}
                                    className="px-3 py-2 bg-gray-50 border border-gray-100 rounded-xl text-xs font-bold outline-none"
                                >
                                    <option value="name">Sort by Name</option>
                                    <option value="roll_number">Sort by USN</option>
                                    <option value="department">Sort by Dept</option>
                                    <option value="semester">Sort by Sem</option>
                                    <option value="cgpa">Sort by CGPA</option>
                                </select>
                            )}
                        </div>
                        <div className="relative flex-1 md:w-64">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input 
                                type="text"
                                placeholder={directoryTab === 'students' ? "Search by name or USN..." : "Search by name or email..."}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-purple-100 transition-all"
                            />
                        </div>
                        
                        {directoryTab === 'students' ? (
                            <>
                                <motion.button 
                                    whileHover={{ scale: 1.05 }}
                                    onClick={() => setIsNotifOpen(true)} 
                                    className="px-6 py-2.5 bg-orange-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-orange-100"
                                >
                                    Send Alert
                                </motion.button>
                                <motion.button 
                                    whileHover={{ scale: 1.05 }}
                                    onClick={() => setIsAddOpen(true)} 
                                    className="px-6 py-2.5 bg-[#7C3AED] text-white rounded-xl text-sm font-bold shadow-lg shadow-purple-100"
                                >
                                    Add Student
                                </motion.button>
                            </>
                        ) : (
                            <motion.button 
                                whileHover={{ scale: 1.05 }}
                                onClick={() => setIsAddFacultyOpen(true)} 
                                className="px-6 py-2.5 bg-green-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-green-100"
                            >
                                Add Faculty
                            </motion.button>
                        )}
                        
                        <motion.button 
                            whileHover={{ scale: 1.05 }}
                            onClick={() => setIsSubjectAssignOpen(true)} 
                            className="px-6 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-100"
                        >
                            Assign Teachers
                        </motion.button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    {directoryTab === 'students' ? (
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 text-[10px] uppercase tracking-widest text-[#9CA3AF] font-bold">
                                <tr>
                                    <th className="px-8 py-4">Name</th>
                                    <th className="px-8 py-4">Roll No</th>
                                    <th className="px-8 py-4">CGPA</th>
                                    <th className="px-8 py-4">Fee Status</th>
                                    <th className="px-8 py-4">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {filteredStudents.map((s, i) => (
                                    <tr key={i} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-8 py-5">
                                            <p className="font-bold text-[#1F2937]">{s.name}</p>
                                            <p className="text-xs text-[#6B7280]">{s.department}</p>
                                        </td>
                                        <td className="px-8 py-5 text-sm text-[#6B7280]">{s.roll_number}</td>
                                        <td className="px-8 py-5 font-bold text-[#7C3AED]">{s.cgpa}</td>
                                        <td className="px-8 py-5">
                                            <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${
                                                s.fee_status === 'paid' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                                            }`}>
                                                {s.fee_status}
                                            </span>
                                        </td>
                                        <td className="px-8 py-5">
                                            <div className="flex gap-4">
                                                <button onClick={() => setEditingStudent(s)} className="text-xs font-bold text-[#7C3AED]">Update</button>
                                                <button onClick={() => setAddingFee(s)} className="text-xs font-bold text-orange-500">Add Fee</button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 text-[10px] uppercase tracking-widest text-[#9CA3AF] font-bold">
                                <tr>
                                    <th className="px-8 py-4">Name</th>
                                    <th className="px-8 py-4">Email</th>
                                    <th className="px-8 py-4">Department</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {filteredTeachers.map((t, i) => (
                                    <tr key={i} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-8 py-5 font-bold text-[#1F2937]">{t.name}</td>
                                        <td className="px-8 py-5 text-sm text-[#6B7280]">{t.email}</td>
                                        <td className="px-8 py-5 text-sm font-bold text-[#7C3AED]">{t.department}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {isAddFacultyOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-6">
                    <div className="bg-white w-full max-w-md rounded-[40px] p-10 relative">
                        <h3 className="text-2xl font-bold mb-6">Add New Faculty</h3>
                        <form className="space-y-4" onSubmit={async (e) => {
                            e.preventDefault();
                            const formData = new FormData(e.currentTarget);
                            const payload = Object.fromEntries(formData.entries());
                            const res = await fetch('/api/admin/faculty', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                                body: JSON.stringify(payload)
                            });
                            if (res.ok) {
                                setIsAddFacultyOpen(false);
                                window.location.reload();
                            } else {
                                alert('Failed to add faculty');
                            }
                        }}>
                            <input name="name" placeholder="Full Name" required className="w-full px-4 py-3 bg-gray-50 rounded-xl border-none outline-none" />
                            <input name="email" placeholder="Email" required type="email" className="w-full px-4 py-3 bg-gray-50 rounded-xl border-none outline-none" />
                            <input name="password" placeholder="Password" required type="password" className="w-full px-4 py-3 bg-gray-50 rounded-xl border-none outline-none" />
                            <select name="department" required className="w-full px-4 py-3 bg-gray-50 rounded-xl border-none outline-none">
                                <option value="">Select Department</option>
                                <option value="CSE">CSE</option>
                                <option value="ISE">ISE</option>
                                <option value="ECE">ECE</option>
                                <option value="ALML">ALML</option>
                            </select>
                            <button type="submit" className="w-full py-4 bg-green-600 text-white rounded-2xl font-bold">Create Faculty</button>
                            <button type="button" onClick={() => setIsAddFacultyOpen(false)} className="w-full py-2 text-gray-500">Cancel</button>
                        </form>
                    </div>
                </div>
            )}

            {editingStudent && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-6">
                    <div className="bg-white w-full max-w-md rounded-[40px] p-10 relative">
                        <h3 className="text-2xl font-bold mb-6">Update Student Info</h3>
                        <form className="space-y-4" onSubmit={handleUpdateStudent}>
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">CGPA</label>
                                <input name="cgpa" type="number" step="0.01" defaultValue={editingStudent.cgpa} className="w-full px-4 py-3 bg-gray-50 rounded-xl border-none outline-none" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Markscard URL / Drive Link</label>
                                <input name="markscardUrl" defaultValue={editingStudent.markscard_url} className="w-full px-4 py-3 bg-gray-50 rounded-xl border-none outline-none" />
                            </div>
                            <button type="submit" className="w-full py-4 bg-[#7C3AED] text-white rounded-2xl font-bold">Save Changes</button>
                            <button type="button" onClick={() => setEditingStudent(null)} className="w-full py-2 text-gray-500">Cancel</button>
                        </form>
                    </div>
                </div>
            )}

            {addingFee && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-6">
                    <div className="bg-white w-full max-w-md rounded-[40px] p-10 relative">
                        <h3 className="text-2xl font-bold mb-6">Add Fee for {addingFee.name}</h3>
                        <form className="space-y-4" onSubmit={handleAddFee}>
                            <input name="amount" type="number" placeholder="Amount" required className="w-full px-4 py-3 bg-gray-50 rounded-xl border-none outline-none" />
                            <input name="dueDate" type="date" required className="w-full px-4 py-3 bg-gray-50 rounded-xl border-none outline-none" />
                            <select name="status" className="w-full px-4 py-3 bg-gray-50 rounded-xl border-none outline-none">
                                <option value="pending">Pending</option>
                                <option value="partial">Partial</option>
                                <option value="paid">Paid</option>
                            </select>
                            <button type="submit" className="w-full py-4 bg-orange-500 text-white rounded-2xl font-bold">Add Fee</button>
                            <button type="button" onClick={() => setAddingFee(null)} className="w-full py-2 text-gray-500">Cancel</button>
                        </form>
                    </div>
                </div>
            )}

            {isAddOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-6">
                    <div className="bg-white w-full max-w-md rounded-[40px] p-10 relative">
                        <h3 className="text-2xl font-bold mb-6">Add New Student</h3>
                        <form className="space-y-4" onSubmit={async (e) => {
                            e.preventDefault();
                            const formData = new FormData(e.currentTarget);
                            const payload = Object.fromEntries(formData.entries());
                            await fetch('/api/admin/students', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                                body: JSON.stringify(payload)
                            });
                            setIsAddOpen(false);
                            window.location.reload();
                        }}>
                            <input name="name" placeholder="Full Name" required className="w-full px-4 py-3 bg-gray-50 rounded-xl border-none outline-none" />
                            <input name="email" placeholder="Email" required type="email" className="w-full px-4 py-3 bg-gray-50 rounded-xl border-none outline-none" />
                            <input name="password" placeholder="Password" required type="password" className="w-full px-4 py-3 bg-gray-50 rounded-xl border-none outline-none" />
                            <input name="rollNumber" placeholder="Roll Number" required className="w-full px-4 py-3 bg-gray-50 rounded-xl border-none outline-none" />
                            <input name="semester" placeholder="Semester" required type="number" className="w-full px-4 py-3 bg-gray-50 rounded-xl border-none outline-none" />
                            <input name="department" placeholder="Department" required className="w-full px-4 py-3 bg-gray-50 rounded-xl border-none outline-none" />
                            <button type="submit" className="w-full py-4 bg-[#7C3AED] text-white rounded-2xl font-bold">Create Student</button>
                            <button type="button" onClick={() => setIsAddOpen(false)} className="w-full py-2 text-gray-500">Cancel</button>
                        </form>
                    </div>
                </div>
            )}

            {isNotifOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-6">
                    <div className="bg-white w-full max-w-md rounded-[40px] p-10 relative">
                        <h3 className="text-2xl font-bold mb-6">Send Notification</h3>
                        <form className="space-y-4" onSubmit={async (e) => {
                            e.preventDefault();
                            const formData = new FormData(e.currentTarget);
                            const payload = Object.fromEntries(formData.entries());
                            await fetch('/api/notifications', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                                body: JSON.stringify(payload)
                            });
                            setIsNotifOpen(false);
                            alert('Notification sent!');
                        }}>
                            <input name="title" placeholder="Title" required className="w-full px-4 py-3 bg-gray-50 rounded-xl border-none outline-none" />
                            <textarea name="message" placeholder="Message" required className="w-full px-4 py-3 bg-gray-50 rounded-xl border-none outline-none" />
                            <select name="targetRole" required className="w-full px-4 py-3 bg-gray-50 rounded-xl border-none outline-none">
                                <option value="all">All</option>
                                <option value="student">Students</option>
                                <option value="faculty">Faculty</option>
                            </select>
                            <button type="submit" className="w-full py-4 bg-orange-500 text-white rounded-2xl font-bold">Send</button>
                            <button type="button" onClick={() => setIsNotifOpen(false)} className="w-full py-2 text-gray-500">Cancel</button>
                        </form>
                    </div>
                </div>
            )}

            {isSubjectAssignOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-6 overflow-y-auto">
                    <div className="bg-white w-full max-w-4xl rounded-[40px] p-10 relative my-8">
                        <button onClick={() => setIsSubjectAssignOpen(false)} className="absolute top-8 right-8 text-gray-400 hover:text-gray-600">
                            <X className="w-6 h-6" />
                        </button>
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-2xl font-bold">Assign Teachers to Subjects</h3>
                            {Object.keys(pendingAssignments).length > 0 && (
                                <button 
                                    onClick={async () => {
                                        const results = await Promise.all(
                                            Object.entries(pendingAssignments).map(async ([subId, teacherId]) => {
                                                if (!teacherId) return { ok: true };
                                                return fetch('/api/admin/subjects/teacher', {
                                                    method: 'POST',
                                                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                                                    body: JSON.stringify({ subjectId: parseInt(subId), teacherId: teacherId })
                                                });
                                            })
                                        );
                                        if (results.every(r => r.ok)) {
                                            alert('All changes saved successfully!');
                                            // Refresh subjects to get new teacher names or update locally
                                            const newSubjects = [...subjects];
                                            Object.entries(pendingAssignments).forEach(([subId, teacherId]) => {
                                                const subIndex = newSubjects.findIndex(s => s.id === parseInt(subId));
                                                const teacher = teachers.find(t => t.id === teacherId);
                                                if (subIndex !== -1 && teacher) {
                                                    newSubjects[subIndex] = { ...newSubjects[subIndex], teacher_name: teacher.name };
                                                }
                                            });
                                            setSubjects(newSubjects);
                                            setPendingAssignments({});
                                        }
                                    }}
                                    className="px-6 py-2 bg-green-500 text-white rounded-xl font-bold text-sm shadow-lg shadow-green-100 hover:bg-green-600 transition-all"
                                >
                                    Save All Changes
                                </button>
                            )}
                        </div>
                        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                            <table className="w-full text-left">
                                <thead className="text-[10px] uppercase font-bold text-gray-400 tracking-widest border-b border-gray-100">
                                    <tr>
                                        <th className="py-4">Subject</th>
                                        <th className="py-4">Department / Sem</th>
                                        <th className="py-4 text-center">Current Teacher</th>
                                        <th className="py-4 text-right">Assign New</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {subjects.map(sub => (
                                        <tr key={sub.id}>
                                            <td className="py-4">
                                                <p className="font-bold text-[#1F2937] text-sm">{sub.name}</p>
                                                <p className="text-[10px] text-gray-400 uppercase">{sub.code}</p>
                                            </td>
                                            <td className="py-4 text-sm text-gray-500">{sub.department} - Sem {sub.semester}</td>
                                            <td className="py-4 text-center text-sm font-medium">{sub.teacher_name || 'Not assigned'}</td>
                                            <td className="py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <select 
                                                        className="px-3 py-1.5 bg-gray-50 rounded-lg text-xs font-bold outline-none border border-gray-100"
                                                        value={pendingAssignments[sub.id] || ''}
                                                        onChange={(e) => {
                                                            const val = e.target.value;
                                                            setPendingAssignments(prev => ({
                                                                ...prev, 
                                                                [sub.id]: val ? parseInt(val) : 0
                                                            }));
                                                        }}
                                                    >
                                                        <option value="">Select Teacher...</option>
                                                        {teachers.map(t => <option key={t.id} value={t.id}>{t.name} ({t.department})</option>)}
                                                    </select>
                                                    {pendingAssignments[sub.id] > 0 && (
                                                        <button 
                                                            onClick={async () => {
                                                                const teacherId = pendingAssignments[sub.id];
                                                                const res = await fetch('/api/admin/subjects/teacher', {
                                                                    method: 'POST',
                                                                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                                                                    body: JSON.stringify({ subjectId: sub.id, teacherId })
                                                                });
                                                                if (res.ok) {
                                                                    // Update local state
                                                                    const teacher = teachers.find(t => t.id === teacherId);
                                                                    setSubjects(subjects.map(s => s.id === sub.id ? { ...s, teacher_name: teacher?.name } : s));
                                                                    setPendingAssignments(prev => {
                                                                        const next = {...prev};
                                                                        delete next[sub.id];
                                                                        return next;
                                                                    });
                                                                    alert('Teacher assigned successfully!');
                                                                }
                                                            }}
                                                            className="px-3 py-1.5 bg-[#7C3AED] text-white rounded-lg text-xs font-bold shadow-sm hover:bg-purple-700 transition-colors"
                                                        >
                                                            Save
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function AcademicDashboardView({ token }: { token: string }) {
    const [academicData, setAcademicData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/academic/courses', {
            headers: { 'Authorization': `Bearer ${token}` }
        })
        .then(res => res.json())
        .then(setAcademicData)
        .catch(console.error)
        .finally(() => setLoading(false));
    }, [token]);

    if (loading) return <div className="p-10 text-center text-gray-400 animate-pulse">Loading academic schedule...</div>;

    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-10"
        >
            <div className="bg-white p-10 rounded-[40px] shadow-sm border border-gray-50">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
                    <div>
                        <h2 className="text-3xl font-bold text-[#1F2937]">Academic Dashboard</h2>
                        <p className="text-[#6B7280] mt-1">{academicData?.branch} • Semester {academicData?.semester}</p>
                    </div>
                    <div className="px-6 py-3 bg-purple-50 rounded-2xl border border-purple-100">
                        <span className="text-xl font-bold text-[#7C3AED]">{academicData?.courses?.length || 0}</span>
                        <span className="text-xs font-bold text-purple-400 uppercase tracking-widest ml-2">Total Subjects</span>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {academicData?.courses?.map((course: any, i: number) => (
                        <motion.div 
                            key={i}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: i * 0.05 }}
                            className="group p-8 bg-gray-50 rounded-[32px] border border-gray-100 hover:bg-[#7C3AED] hover:border-[#7C3AED] transition-all duration-300 hover:shadow-xl hover:shadow-purple-100"
                        >
                            <div className="flex justify-between items-start mb-6">
                                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm group-hover:bg-white/20 transition-colors">
                                    <BookOpen className="w-6 h-6 text-[#7C3AED] group-hover:text-white" />
                                </div>
                                <div className="px-3 py-1 bg-white rounded-full text-[10px] font-bold text-[#7C3AED] uppercase tracking-widest shadow-sm group-hover:bg-white/20 group-hover:text-white transition-colors">
                                    Credits: {course.credits}
                                </div>
                            </div>
                            
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2 group-hover:text-purple-200">{course.code}</p>
                            <h3 className="text-lg font-bold text-[#1F2937] leading-snug group-hover:text-white mb-6 min-h-[56px]">{course.name}</h3>
                            
                            <div className="flex items-center gap-4 pt-6 border-t border-gray-200 group-hover:border-white/20">
                                <div className="flex -space-x-2">
                                    {[1, 2, 3].map(j => (
                                        <div key={j} className="w-8 h-8 rounded-full border-2 border-white bg-gray-200 overflow-hidden group-hover:border-purple-600 transition-colors">
                                            <img src={`https://api.dicebear.com/7.x/initials/svg?seed=ST${j}`} alt="student" />
                                        </div>
                                    ))}
                                </div>
                                <span className="text-[10px] font-bold text-gray-400 group-hover:text-purple-200 uppercase tracking-widest">+12 Peers</span>
                            </div>
                        </motion.div>
                    ))}
                    {(!academicData?.courses || academicData.courses.length === 0) && (
                        <div className="col-span-full py-20 text-center bg-gray-50 rounded-[40px] border border-dashed border-gray-200">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <AlertCircle className="w-8 h-8 text-gray-300" />
                            </div>
                            <h3 className="text-lg font-bold text-[#1F2937]">No Courses Found</h3>
                            <p className="text-sm text-gray-400">Your academic schedule for the current semester is being updated.</p>
                        </div>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 gap-10">
                <div style={{ color: '#371F1F', borderStyle: 'groove', borderWidth: '2.666667px', backgroundColor: '#FFB6FF', fontFamily: 'Courier New' }} className="p-10 rounded-[40px] shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:scale-110 transition-transform duration-700">
                        <GraduationCap className="w-64 h-64 -mr-20 -mt-20" />
                    </div>
                    <h3 className="text-2xl font-bold mb-6">VTU 2022 Scheme Guidance</h3>
                    <p className="opacity-80 leading-relaxed mb-8">
                        The 2022 scheme focuses on skill integration. Ensure you have obtained minimum passing marks in continuous internal evaluations (CIE) to qualify for Semester End Examinations (SEE).
                    </p>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-black/5 rounded-2xl border border-black/10">
                            <p className="text-[10px] font-bold opacity-50 uppercase tracking-widest mb-1">Total Credits</p>
                            <p className="text-xl font-bold">160 Units</p>
                        </div>
                        <div className="p-4 bg-black/5 rounded-2xl border border-black/10">
                            <p className="text-[10px] font-bold opacity-50 uppercase tracking-widest mb-1">Pass Criteria</p>
                            <p className="text-xl font-bold">40% Total</p>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

function SidebarLink({ icon, label, active = false, onClick }: { icon: React.ReactNode, label: string, active?: boolean, onClick: () => void }) {
    return (
        <motion.button 
            whileHover={{ scale: 1.05, boxShadow: "0 0 20px rgba(255,255,255,0.5)" }}
            onClick={onClick}
            className={`flex items-center gap-3 w-full px-4 py-3.5 rounded-2xl font-medium transition-all ${
                active ? 'bg-[#7C3AED] text-white shadow-lg shadow-purple-100' : 'text-[#6B7280] hover:bg-gray-50'
            }`}
        >
            {React.cloneElement(icon as React.ReactElement, { className: 'w-5 h-5' })}
            {label}
        </motion.button>
    );
}

function QuickAction({ icon, label, color }: { icon: React.ReactNode, label: string, color: string }) {
    return (
        <motion.button 
            whileHover={{ y: -5 }}
            className="flex flex-col items-center gap-3 p-6 bg-white rounded-[32px] shadow-sm border border-gray-50 group"
        >
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all group-hover:scale-110 ${color}`}>
                {React.cloneElement(icon as React.ReactElement, { className: 'w-7 h-7' })}
            </div>
            <span className="text-sm font-bold text-[#1F2937]">{label}</span>
        </motion.button>
    );
}

function AttendanceView({ token, user, setActiveTab }: { token: string, user: any, setActiveTab: (t: string) => void }) {
    const [students, setStudents] = useState<any[]>([]);
    const [attendanceSummary, setAttendanceSummary] = useState<any[]>([]);
    const [subjectStats, setSubjectStats] = useState<any[]>([]);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [stats, setStats] = useState<AttendanceStats[]>([]);
    const [attendanceLog, setAttendanceLog] = useState<AttendanceRecord[]>([]);
    const [isMarking, setIsMarking] = useState(false);
    const [selectedSubject, setSelectedSubject] = useState<number | null>(null);
    const [attendanceData, setAttendanceData] = useState<{[key: number]: string}>({});
    const [activeSubTab, setActiveSubTab] = useState<'take' | 'history' | 'stats'>('stats');
    const [filterDept, setFilterDept] = useState('');
    const [filterSem, setFilterSem] = useState('');
    const [historySearch, setHistorySearch] = useState('');

    useEffect(() => {
        if (user.role === 'admin' || user.role === 'faculty') {
            fetch('/api/admin/students', { headers: { 'Authorization': `Bearer ${token}` } })
                .then(async res => (res.ok ? await safeJson(res) : []) || [])
                .then(setStudents);
            fetch('/api/admin/attendance/summary', { headers: { 'Authorization': `Bearer ${token}` } })
                .then(async res => (res.ok ? await safeJson(res) : []) || [])
                .then(setAttendanceSummary);
            fetch('/api/admin/attendance/subject-stats', { headers: { 'Authorization': `Bearer ${token}` } })
                .then(async res => (res.ok ? await safeJson(res) : []) || [])
                .then(setSubjectStats);
            fetch('/api/subjects', { headers: { 'Authorization': `Bearer ${token}` } })
                .then(async res => (res.ok ? await safeJson(res) : []) || [])
                .then(setSubjects);
        }
        
        if (user.role === 'student') {
            fetch('/api/attendance/stats', { headers: { 'Authorization': `Bearer ${token}` } })
                .then(async res => (res.ok ? await safeJson(res) : []) || [])
                .then(setStats);
            fetch('/api/attendance/log', { headers: { 'Authorization': `Bearer ${token}` } })
                .then(async res => (res.ok ? await safeJson(res) : []) || [])
                .then(setAttendanceLog);
        }
    }, [token, user.role]);

    const handleBulkMark = (status: 'present' | 'absent' | 'no_class') => {
        const newData = { ...attendanceData };
        students.forEach(s => newData[s.id] = status);
        setAttendanceData(newData);
    };

    const handleMarkAttendance = async (e: React.FormEvent) => {
        e.preventDefault();
        const records = Object.entries(attendanceData).map(([id, status]) => ({
            studentId: Number(id),
            status,
            subjectId: selectedSubject,
            date: new Date().toISOString()
        }));

        const res = await fetch('/api/faculty/attendance/bulk', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ records })
        });
        if (res.ok) {
            alert('Attendance records saved successfully');
            setIsMarking(false);
            setAttendanceData({});
        }
    };

    if (user.role === 'student') {
        const lowAttendance = stats.filter(s => s.percentage < 75);
        return (
            <div className="space-y-8">
                <div className="flex items-center gap-4">
                    <button onClick={() => setActiveTab('Dashboard')} className="p-2 bg-white border border-gray-100 rounded-xl hover:bg-gray-50 shadow-sm">
                        <ArrowLeft className="w-5 h-5 text-[#7C3AED]" />
                    </button>
                    <h2 className="text-2xl font-bold text-[#1F2937]">Attendance Portal</h2>
                </div>

                {lowAttendance.length > 0 && (
                    <motion.div 
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-red-50 p-6 rounded-[32px] border border-red-100 flex items-center gap-4 text-red-700"
                    >
                        <AlertCircle className="w-6 h-6 shrink-0" />
                        <div>
                            <p className="font-bold">Attendance Warning!</p>
                            <p className="text-sm opacity-80">You have low attendance in {lowAttendance.length} subjects. Maintain 75% to remain exam eligible.</p>
                        </div>
                    </motion.div>
                )}

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {stats.map((s, i) => (
                        <div key={i} className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-50">
                            <div className="flex justify-between items-start mb-6">
                                <h3 className="font-bold text-[#1F2937]">{s.subjectName}</h3>
                                <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${s.percentage >= 75 ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                    {s.percentage}%
                                </span>
                            </div>
                            <div className="w-full bg-gray-100 h-2 rounded-full mb-4 overflow-hidden">
                                <motion.div 
                                    initial={{ width: 0 }}
                                    animate={{ width: `${s.percentage}%` }}
                                    className={`h-full rounded-full ${s.percentage >= 75 ? 'bg-green-500' : 'bg-red-500'}`}
                                />
                            </div>
                            <p className="text-xs text-secondary">{s.presentClasses} / {s.totalClasses} Classes attended</p>
                        </div>
                    ))}
                </div>

                <div className="bg-white rounded-[40px] shadow-sm border border-gray-50 overflow-hidden">
                    <div className="p-8 border-b border-gray-50 flex justify-between items-center">
                        <h3 className="text-xl font-bold">Daywise Attendance Sheet</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-gray-50 text-[10px] uppercase tracking-widest text-[#9CA3AF] font-bold">
                                <tr>
                                    <th className="px-8 py-4 bg-gray-50 sticky left-0 z-10">Date</th>
                                    {subjects.filter(s => stats.some(st => st.subjectId === s.id)).map(sub => (
                                        <th key={sub.id} className="px-6 py-4 text-center min-w-[120px]">{sub.name}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {(() => {
                                    const grouped = attendanceLog.reduce((acc: any, log) => {
                                        const d = new Date(log.date).toLocaleDateString();
                                        if (!acc[d]) acc[d] = {};
                                        acc[d][log.subjectId] = log.status;
                                        return acc;
                                    }, {});
                                    const sortedDates = Object.keys(grouped).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
                                    const activeSubs = subjects.filter(s => stats.some(st => st.subjectId === s.id));

                                    return sortedDates.map((date, idx) => (
                                        <tr key={idx} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-8 py-5 text-sm font-medium sticky left-0 bg-white border-r border-gray-50">{date}</td>
                                            {activeSubs.map(sub => {
                                                const status = grouped[date][sub.id];
                                                return (
                                                    <td key={sub.id} className="px-6 py-5 text-center">
                                                        {status ? (
                                                            <div className={`w-8 h-8 mx-auto rounded-xl flex items-center justify-center text-[10px] font-bold uppercase transition-all ${
                                                                status === 'present' ? 'bg-green-100 text-green-600' :
                                                                status === 'absent' ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-400'
                                                            }`}>
                                                                {status === 'present' ? 'P' : status === 'absent' ? 'A' : 'NC'}
                                                            </div>
                                                        ) : (
                                                            <span className="text-gray-200 text-[10px]">—</span>
                                                        )}
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    ));
                                })()}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="bg-white rounded-[40px] shadow-sm border border-gray-50 overflow-hidden">
                    <div className="p-8 border-b border-gray-50 flex justify-between items-center">
                        <h3 className="text-xl font-bold">Attendance Log</h3>
                        <button className="text-sm font-bold text-[#7C3AED] flex items-center gap-2">
                            <Download className="w-4 h-4" /> Download Report
                        </button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 text-[10px] uppercase tracking-widest text-[#9CA3AF] font-bold">
                                <tr>
                                    <th className="px-8 py-4">Date</th>
                                    <th className="px-8 py-4">Subject</th>
                                    <th className="px-8 py-4">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {attendanceLog.map((log, i) => (
                                    <tr key={i}>
                                        <td className="px-8 py-5 text-sm">{new Date(log.date).toLocaleDateString()}</td>
                                        <td className="px-8 py-5 font-medium">{subjects.find(s => s.id === log.subjectId)?.name || 'N/A'}</td>
                                        <td className="px-8 py-5">
                                            <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${
                                                log.status === 'present' ? 'bg-green-100 text-green-600' : 
                                                log.status === 'absent' ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-400'
                                            }`}>
                                                {log.status === 'no_class' ? 'No Class' : log.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="flex items-center gap-4">
                    <button onClick={() => setActiveTab('Dashboard')} className="p-2 bg-white border border-gray-100 rounded-xl hover:bg-gray-50 shadow-sm">
                        <ArrowLeft className="w-5 h-5 text-[#7C3AED]" />
                    </button>
                    <h2 className="text-2xl font-bold text-[#1F2937]">Attendance Management</h2>
                </div>
                <div className="flex gap-4">
                    <button onClick={() => setIsMarking(true)} className="px-6 py-2.5 bg-[#7C3AED] text-white rounded-xl font-bold shadow-lg shadow-purple-200">
                        Take Attendance
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-[40px] shadow-sm border border-gray-50 p-8">
                <div className="flex items-center gap-8 mb-8 border-b border-gray-50 pb-4">
                    <button onClick={() => setActiveSubTab('stats')} className={`text-sm font-bold uppercase tracking-widest ${activeSubTab === 'stats' ? 'text-[#7C3AED] border-b-2 border-[#7C3AED] pb-4' : 'text-secondary'}`}>Class Analytics</button>
                    <button onClick={() => setActiveSubTab('history')} className={`text-sm font-bold uppercase tracking-widest ${activeSubTab === 'history' ? 'text-[#7C3AED] border-b-2 border-[#7C3AED] pb-4' : 'text-secondary'}`}>History</button>
                </div>

                {activeSubTab === 'stats' && (
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {subjects.map((sub, i) => {
                            const stats = subjectStats.find(s => s.subject_id === sub.id);
                            const avg = stats ? stats.average : 0;
                            return (
                                <div key={i} className="p-6 bg-gray-50 rounded-3xl">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">{sub.code}</p>
                                    <h4 className="font-bold text-xl mb-4 truncate">{sub.name}</h4>
                                    <div className="flex justify-between items-center text-sm font-bold">
                                        <span className={`${avg >= 75 ? 'text-green-600' : 'text-red-600'}`}>Avg: {avg}%</span>
                                        <span className="text-secondary">{students.filter(s => s.department === sub.department && s.semester === sub.semester).length} Students</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {activeSubTab === 'history' && (
                    <div className="space-y-6">
                        <div className="flex flex-wrap gap-4 justify-between items-center">
                            <h4 className="font-bold text-[#1F2937]">Student Records</h4>
                            <div className="flex flex-wrap gap-3">
                                <select 
                                    className="px-3 py-1.5 bg-gray-50 border border-gray-100 rounded-lg text-xs font-bold outline-none"
                                    value={filterDept}
                                    onChange={(e) => setFilterDept(e.target.value)}
                                >
                                    <option value="">All Depts</option>
                                    <option value="CSE">CSE</option>
                                    <option value="ISE">ISE</option>
                                    <option value="ECE">ECE</option>
                                </select>
                                <select 
                                    className="px-3 py-1.5 bg-gray-50 border border-gray-100 rounded-lg text-xs font-bold outline-none"
                                    value={filterSem}
                                    onChange={(e) => setFilterSem(e.target.value)}
                                >
                                    <option value="">All Sems</option>
                                    {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                                    <input 
                                        type="text"
                                        placeholder="Search..."
                                        value={historySearch}
                                        onChange={(e) => setHistorySearch(e.target.value)}
                                        className="pl-9 pr-4 py-1.5 bg-gray-50 border border-gray-100 rounded-lg text-xs outline-none w-40"
                                    />
                                </div>
                                <button className="px-4 py-1.5 bg-white border border-gray-100 rounded-lg text-xs font-bold flex items-center gap-2 shadow-sm hover:bg-gray-50"><Download className="w-4 h-4" /> Export</button>
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="text-[10px] uppercase font-bold text-gray-400 border-b border-gray-50">
                                    <tr>
                                        <th className="pb-4">Student</th>
                                        <th className="pb-4">Roll Number</th>
                                        <th className="pb-4">Dept / Sem</th>
                                        <th className="pb-4">Attendance</th>
                                        <th className="pb-4 text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {students.filter(s => 
                                        (!filterDept || s.department === filterDept) &&
                                        (!filterSem || s.semester?.toString() === filterSem) &&
                                        (!historySearch || s.name?.toLowerCase().includes(historySearch.toLowerCase()) || s.roll_number?.toLowerCase().includes(historySearch.toLowerCase()))
                                    ).map((s, i) => (
                                        <tr key={i} className="hover:bg-gray-50/50">
                                            <td className="py-4 font-bold text-sm">{s.name}</td>
                                            <td className="py-4 text-sm text-secondary">{s.roll_number}</td>
                                            <td className="py-4 text-xs text-gray-500">{s.department} (Sem {s.semester})</td>
                                            <td className="py-4">
                                                {(() => {
                                                    const summary = attendanceSummary.find(as => as.student_id === s.id);
                                                    const percentage = summary ? summary.percentage : 0;
                                                    return (
                                                        <div className="flex items-center gap-3">
                                                            <div className="flex-1 max-w-[100px] bg-gray-100 h-1.5 rounded-full overflow-hidden">
                                                                <div 
                                                                    className={`h-full rounded-full ${percentage >= 75 ? 'bg-green-500' : 'bg-red-500'}`} 
                                                                    style={{ width: `${percentage}%` }} 
                                                                />
                                                            </div>
                                                            <span className={`text-xs font-bold ${percentage >= 75 ? 'text-green-600' : 'text-red-600'}`}>{percentage}%</span>
                                                        </div>
                                                    );
                                                })()}
                                            </td>
                                            <td className="py-4 text-right">
                                                <button className="text-[10px] font-bold uppercase tracking-widest text-[#7C3AED] hover:underline">View Sheet</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {isMarking && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-6 overflow-y-auto">
                    <div className="bg-white w-full max-w-4xl rounded-[40px] p-10 relative my-8">
                        <button onClick={() => setIsMarking(false)} className="absolute top-8 right-8 text-gray-400 hover:text-gray-600">
                            <X className="w-6 h-6" />
                        </button>
                        <h3 className="text-2xl font-bold mb-8">Mark Daily Attendance</h3>
                        
                        <div className="grid md:grid-cols-3 gap-6 mb-8">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-400 uppercase">1. Subject</label>
                                <select 
                                    className="w-full px-4 py-3 bg-gray-50 rounded-xl border-none outline-none font-medium"
                                    onChange={(e) => setSelectedSubject(Number(e.target.value))}
                                >
                                    <option value="">Select Subject...</option>
                                    {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-400 uppercase">2. Section</label>
                                <select className="w-full px-4 py-3 bg-gray-50 rounded-xl border-none outline-none font-medium">
                                    <option>Section A</option>
                                    <option>Section B</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-400 uppercase">3. Smart Bulk</label>
                                <div className="flex gap-2">
                                    <button onClick={() => handleBulkMark('present')} className="flex-1 py-3 bg-green-50 text-green-600 rounded-xl font-bold text-xs">ALL PRESENT</button>
                                    <button onClick={() => handleBulkMark('absent')} className="flex-1 py-3 bg-red-50 text-red-600 rounded-xl font-bold text-xs">ALL ABSENT</button>
                                    <button onClick={() => handleBulkMark('no_class')} className="flex-1 py-3 bg-gray-50 text-gray-500 rounded-xl font-bold text-xs">NO CLASS</button>
                                </div>
                            </div>
                        </div>

                        <div className="bg-gray-50 rounded-3xl p-6 mb-8 max-h-96 overflow-y-auto scrollbar-hide">
                            <table className="w-full text-left">
                                <thead className="text-[10px] uppercase font-bold text-gray-400">
                                    <tr>
                                        <th className="pb-4">Student</th>
                                        <th className="pb-4">Roll No</th>
                                        <th className="pb-4 text-center">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {students.map((s, i) => (
                                        <tr key={i} className="border-t border-gray-100">
                                            <td className="py-4 font-bold">{s.name}</td>
                                            <td className="py-4 text-xs text-secondary">{s.roll_number}</td>
                                            <td className="py-4">
                                                <div className="flex justify-center gap-2">
                                                    {['present', 'absent', 'no_class'].map(status => (
                                                        <button 
                                                            key={status}
                                                            onClick={() => setAttendanceData({...attendanceData, [s.id]: status as any})}
                                                            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all ${
                                                                attendanceData[s.id] === status ? 
                                                                (status === 'present' ? 'bg-green-500 text-white' : status === 'absent' ? 'bg-red-500 text-white' : 'bg-gray-400 text-white') : 
                                                                'bg-white text-gray-400 hover:bg-gray-100'
                                                            }`}
                                                        >
                                                            {status === 'no_class' ? 'NC' : status[0]}
                                                        </button>
                                                    ))}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="flex gap-4">
                            <button onClick={handleMarkAttendance} className="flex-1 py-4 bg-[#7C3AED] text-white rounded-2xl font-bold shadow-xl shadow-purple-200">Submit Attendance</button>
                            <button onClick={() => setIsMarking(false)} className="px-8 py-4 bg-gray-50 text-gray-500 rounded-2xl font-bold">Cancel</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function ResultsView({ token, user, setActiveTab }: { token: string, user: any, setActiveTab: (t: string) => void }) {
    const [students, setStudents] = useState<any[]>([]);
    const [subjects, setSubjects] = useState<any[]>([]);
    const [studentResults, setStudentResults] = useState<any>(null);
    const [isAdding, setIsAdding] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterDept, setFilterDept] = useState('');
    const [filterSem, setFilterSem] = useState('');
    const [modalSearch, setModalSearch] = useState('');
    const [selectedStudent, setSelectedStudent] = useState<any>(null);
    const [selectedSemester, setSelectedSemester] = useState<string>('1');
    const [marksUpdate, setMarksUpdate] = useState<{[key: number]: {internal: number, external: number}}>({});
    const [sortConfig, setSortConfig] = useState<{key: string, direction: 'asc' | 'desc'} | null>(null);

    useEffect(() => {
        if (user.role === 'admin' || user.role === 'faculty') {
            fetch('/api/admin/students', { headers: { 'Authorization': `Bearer ${token}` } })
                .then(async res => (res.ok ? await safeJson(res) : []) || [])
                .then(setStudents);
        }
        if (user.role === 'student') {
            fetch('/api/student/results', { headers: { 'Authorization': `Bearer ${token}` } })
                .then(async res => (res.ok ? await safeJson(res) : null))
                .then(setStudentResults);
        }
    }, [token, user.role]);

    const [loadingSubjects, setLoadingSubjects] = useState(false);

    useEffect(() => {
        if (selectedStudent && selectedSemester) {
            setLoadingSubjects(true);
            setSubjects([]); // Clear previous subjects
            console.log(`[Dashboard] Fetching subjects for Student: ${selectedStudent.name}, Dept: ${selectedStudent.department}, Sem: ${selectedSemester}`);
            
            // Fetch subjects
            const url = `/api/subjects?semester=${selectedSemester}&department=${encodeURIComponent(selectedStudent.department || '')}`;
            fetch(url, {
                headers: { 'Authorization': `Bearer ${token}` }
            })
            .then(async res => {
                if (!res.ok) throw new Error('Failed to fetch subjects');
                return await safeJson(res) || [];
            })
            .then(data => {
                console.log(`[Dashboard] Found ${data.length} subjects`);
                setSubjects(data);
                
                // Then fetch existing results to pre-fill
                fetch(`/api/results/student/${selectedStudent.id}/semester/${selectedSemester}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                })
                .then(async res => (res.ok ? await safeJson(res) : []) || [])
                .then(existingResults => {
                    const initial: any = {};
                    data.forEach((s: any) => {
                        const existing = existingResults.find((r: any) => r.subject_id === s.id);
                        initial[s.id] = { 
                            internal: existing ? existing.internal_marks : 0, 
                            external: existing ? existing.external_marks : 0 
                        };
                    });
                    setMarksUpdate(initial);
                    setLoadingSubjects(false);
                });
            })
            .catch(() => setLoadingSubjects(false));
        }
    }, [selectedStudent, selectedSemester, token]);

    const handleUpdateResult = async (subjectId: number) => {
        const marks = marksUpdate[subjectId];
        const res = await fetch('/api/results', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({
                studentId: selectedStudent.id,
                semester: parseInt(selectedSemester),
                subjectId,
                internalMarks: marks.internal,
                externalMarks: marks.external
            })
        });
        if (res.ok) {
            alert('Result updated successfully');
        } else {
            const err = await res.json();
            alert(err.message || 'Failed to update result');
        }
    };

    const filteredStudents = students.filter(s => 
        (!searchTerm || 
        s.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.roll_number?.toLowerCase().includes(searchTerm.toLowerCase())) &&
        (!filterDept || s.department === filterDept) &&
        (!filterSem || s.semester?.toString() === filterSem)
    );

    const sortedStudents = [...filteredStudents].sort((a, b) => {
        if (!sortConfig) return 0;
        const key = sortConfig.key as keyof typeof a;
        if (key === 'cgpa' || key === 'semester') {
            const aVal = parseFloat(String(a[key] || '0'));
            const bVal = parseFloat(String(b[key] || '0'));
            return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal;
        }
        const aVal = String(a[key] || '');
        const bVal = String(b[key] || '');
        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
    });

    const requestSort = (key: string) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const modalFilteredStudents = students.filter(s => 
        !modalSearch || 
        s.name?.toLowerCase().includes(modalSearch.toLowerCase()) ||
        s.roll_number?.toLowerCase().includes(modalSearch.toLowerCase())
    );

    if (user.role === 'student') {
        return (
            <div className="space-y-10">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    <div className="col-span-1 lg:col-span-2 bg-[#7C3AED] p-10 rounded-[40px] text-white relative overflow-hidden group shadow-2xl shadow-purple-200">
                        <div className="relative z-10">
                            <p className="text-purple-200 font-bold uppercase tracking-widest text-[10px] mb-4">Cumulative Performance</p>
                            <div className="flex items-baseline gap-4">
                                <h2 className="text-7xl font-bold">{studentResults?.cgpa || '0.00'}</h2>
                                <span className="text-2xl text-purple-200 font-medium tracking-tight">CGPA</span>
                            </div>
                        </div>
                        <div className="absolute -right-20 -bottom-20 opacity-10 group-hover:scale-110 transition-transform duration-700">
                            <GraduationCap className="w-80 h-80" />
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-10">
                    {studentResults?.performance?.map((p: any) => (
                        <div key={p.semester} className="bg-white rounded-[40px] shadow-sm border border-gray-50 overflow-hidden">
                            <div className="p-8 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
                                <div>
                                    <h3 className="text-2xl font-bold text-[#1F2937]">Semester {p.semester}</h3>
                                    <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Total Credits: {p.totalCredits}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-1">SGPA</p>
                                    <p className="text-3xl font-black text-[#7C3AED] leading-none">{p.sgpa.toFixed(2)}</p>
                                </div>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-[#FAF9FF] text-[10px] uppercase tracking-widest text-[#9CA3AF] font-bold">
                                        <tr>
                                            <th className="px-8 py-5">Subject Detail</th>
                                            <th className="px-8 py-5 text-center">Internals (50)</th>
                                            <th className="px-8 py-5 text-center">Externals (50)</th>
                                            <th className="px-8 py-5 text-center">Total (100)</th>
                                            <th className="px-8 py-5 text-center">Outcome</th>
                                            <th className="px-8 py-5 text-center">Credits</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {p.subjects.map((s: any, i: number) => (
                                            <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                                                <td className="px-8 py-6">
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-[#1F2937]">{s.name}</span>
                                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">{s.code}</span>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6 text-center font-bold text-gray-600">{s.internalMarks}</td>
                                                <td className="px-8 py-6 text-center font-bold text-gray-600">{s.externalMarks}</td>
                                                <td className="px-8 py-6 text-center font-bold text-[#1F2937]">{s.totalMarks}</td>
                                                <td className="px-8 py-6 text-center">
                                                    <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                                                        s.grade === 'F' ? 'bg-red-50 text-red-500' : 'bg-green-100 text-green-700'
                                                    }`}>
                                                        {s.grade}
                                                    </span>
                                                </td>
                                                <td className="px-8 py-6 text-center font-bold text-[#7C3AED]">{s.creditsObtained} / {s.totalCredits}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-4">
                    <button onClick={() => setActiveTab('Dashboard')} className="p-2 bg-white border border-gray-100 rounded-xl hover:bg-gray-50 transition-all shadow-sm">
                        <ArrowLeft className="w-5 h-5 text-[#7C3AED]" />
                    </button>
                    <h2 className="text-2xl font-bold text-[#1F2937]">Result Management</h2>
                </div>
                <div className="flex flex-wrap gap-4 w-full md:w-auto">
                    <div className="flex gap-2">
                        <select 
                            value={filterDept}
                            onChange={(e) => setFilterDept(e.target.value)}
                            className="px-3 py-2 bg-white border border-gray-100 rounded-xl text-xs font-bold outline-none shadow-sm"
                        >
                            <option value="">All Depts</option>
                            <option value="CSE">CSE</option>
                            <option value="ISE">ISE</option>
                            <option value="ECE">ECE</option>
                        </select>
                        <select 
                            value={filterSem}
                            onChange={(e) => setFilterSem(e.target.value)}
                            className="px-3 py-2 bg-white border border-gray-100 rounded-xl text-xs font-bold outline-none shadow-sm"
                        >
                            <option value="">All Sems</option>
                            {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                    <div className="relative flex-1 md:w-64">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input 
                            type="text"
                            placeholder="Search student..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-purple-100 transition-all shadow-sm"
                        />
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-[40px] shadow-sm border border-gray-50 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 text-[10px] uppercase tracking-widest text-[#9CA3AF] font-bold">
                        <tr>
                            <th className="px-8 py-4 cursor-pointer hover:text-[#7C3AED]" onClick={() => requestSort('name')}>Student</th>
                            <th className="px-8 py-4 cursor-pointer hover:text-[#7C3AED]" onClick={() => requestSort('roll_number')}>Roll No</th>
                            <th className="px-8 py-4 cursor-pointer hover:text-[#7C3AED]" onClick={() => requestSort('department')}>Department</th>
                            <th className="px-8 py-4 cursor-pointer hover:text-[#7C3AED]" onClick={() => requestSort('semester')}>Semester</th>
                            <th className="px-8 py-4 cursor-pointer hover:text-[#7C3AED]" onClick={() => requestSort('cgpa')}>CGPA</th>
                            <th className="px-8 py-4 text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {sortedStudents.map((s, i) => (
                            <tr key={i} className="hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => { setSelectedStudent(s); setSelectedSemester(s.semester?.toString() || '1'); }}>
                                <td className="px-8 py-5 font-bold text-[#1F2937]">{s.name}</td>
                                <td className="px-8 py-5 text-sm text-[#6B7280]">{s.roll_number}</td>
                                <td className="px-8 py-5 text-sm text-[#6B7280]">{s.department}</td>
                                <td className="px-8 py-5 text-sm text-[#6B7280]">Sem {s.semester}</td>
                                <td className="px-8 py-5 font-bold text-[#7C3AED]">{s.cgpa}</td>
                                <td className="px-8 py-5 text-right">
                                    <button 
                                        onClick={(e) => { 
                                            e.stopPropagation(); 
                                            setSelectedStudent(s); 
                                            setSelectedSemester(s.semester?.toString() || '1');
                                            setIsAdding(true); 
                                        }}
                                        className="text-[#7C3AED] font-bold text-sm hover:underline"
                                    >
                                        Update Results
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {isAdding && selectedStudent && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-6 overflow-y-auto">
                    <div className="bg-white w-full max-w-4xl rounded-[40px] p-10 relative my-8">
                        <button onClick={() => setIsAdding(false)} className="absolute top-8 right-8 text-gray-400 hover:text-gray-600">
                            <X className="w-6 h-6" />
                        </button>
                        
                        <div className="mb-8">
                            <h3 className="text-2xl font-bold text-[#1F2937]">Update Student Results</h3>
                            <p className="text-gray-500 font-medium">{selectedStudent.name} • {selectedStudent.roll_number} • {selectedStudent.department}</p>
                        </div>

                        <div className="flex gap-4 mb-8">
                            {[1, 2, 3, 4, 5, 6, 7, 8].map(sem => (
                                <button 
                                    key={sem}
                                    onClick={() => setSelectedSemester(sem.toString())}
                                    className={`px-4 py-2 rounded-xl font-bold text-sm transition-all ${selectedSemester === sem.toString() ? 'bg-[#7C3AED] text-white shadow-lg' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                                >
                                    Sem {sem}
                                </button>
                            ))}
                        </div>

                        <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
                            {loadingSubjects ? (
                                <div className="py-20 flex flex-col items-center justify-center space-y-4">
                                    <div className="w-10 h-10 border-4 border-purple-100 border-t-purple-600 rounded-full animate-spin" />
                                    <p className="text-gray-400 font-medium">Fetching subjects...</p>
                                </div>
                            ) : subjects.length > 0 ? (
                                <table className="w-full text-left">
                                    <thead className="text-[10px] uppercase font-bold text-gray-400 tracking-widest border-b border-gray-100">
                                        <tr>
                                            <th className="py-4">Subject</th>
                                            <th className="py-4 text-center">Credits</th>
                                            <th className="py-4 text-center">Internals (50)</th>
                                            <th className="py-4 text-center">Externals (50)</th>
                                            <th className="py-4 text-center">Total</th>
                                            <th className="py-4 text-right">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {subjects.map(s => (
                                            <tr key={s.id}>
                                                <td className="py-4">
                                                    <p className="font-bold text-[#1F2937] text-sm">{s.name}</p>
                                                    <p className="text-[10px] text-gray-400 uppercase font-medium">{s.code}</p>
                                                </td>
                                                <td className="py-4 text-center font-bold text-gray-400">{s.credits}</td>
                                                <td className="py-4 text-center">
                                                    <input 
                                                        type="number" 
                                                        max="50"
                                                        className="w-16 px-2 py-1.5 bg-gray-50 rounded-lg text-center font-bold text-sm outline-none focus:ring-2 focus:ring-purple-100"
                                                        value={marksUpdate[s.id]?.internal || 0}
                                                        onChange={(e) => setMarksUpdate({...marksUpdate, [s.id]: { ...marksUpdate[s.id], internal: parseInt(e.target.value) || 0 }})}
                                                    />
                                                </td>
                                                <td className="py-4 text-center">
                                                    <input 
                                                        type="number" 
                                                        max="50"
                                                        className="w-16 px-2 py-1.5 bg-gray-50 rounded-lg text-center font-bold text-sm outline-none focus:ring-2 focus:ring-purple-100"
                                                        value={marksUpdate[s.id]?.external || 0}
                                                        onChange={(e) => setMarksUpdate({...marksUpdate, [s.id]: { ...marksUpdate[s.id], external: parseInt(e.target.value) || 0 }})}
                                                    />
                                                </td>
                                                <td className="py-4 text-center font-bold text-[#7C3AED]">
                                                    {(marksUpdate[s.id]?.internal || 0) + (marksUpdate[s.id]?.external || 0)}
                                                </td>
                                                <td className="py-4 text-right">
                                                    <button 
                                                        onClick={() => handleUpdateResult(s.id)}
                                                        className="px-4 py-1.5 bg-purple-50 text-[#7C3AED] rounded-lg text-xs font-bold hover:bg-purple-100 transition-all"
                                                    >
                                                        Save
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : (
                                <div className="py-10 text-center text-gray-400 italic">No subjects found for this semester & department.</div>
                            )}
                        </div>

                        <div className="mt-10 p-6 bg-purple-50 rounded-3xl flex justify-between items-center border border-purple-100">
                             <div>
                                <p className="text-[#7C3AED] font-bold text-lg">Batch Result Update</p>
                                <p className="text-gray-500 text-sm">Save individual subjects or reload to see updated CGPA.</p>
                             </div>
                             <button onClick={() => window.location.reload()} className="px-6 py-3 bg-[#7C3AED] text-white rounded-2xl font-bold shadow-lg shadow-purple-200">Done & Refresh</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function ProfileView({ token, user }: { token: string, user: any }) {
    const [profile, setProfile] = useState<any>(null);
    const [isEditing, setIsEditing] = useState(false);

    useEffect(() => {
        fetch('/api/student/profile', { headers: { 'Authorization': `Bearer ${token}` } })
            .then(async res => (res.ok ? await safeJson(res) : null))
            .then(setProfile);
    }, [token]);

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget as HTMLFormElement);
        const payload = Object.fromEntries(formData.entries());
        
        const res = await fetch('/api/student/profile/update', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(payload)
        });
        if (res.ok) {
            setProfile({ ...profile, ...payload });
            setIsEditing(false);
        }
    };

    if (!profile) return (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <div className="w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
            <p className="text-gray-500 font-medium">Loading Profile...</p>
        </div>
    );

    const isStudent = profile.role === 'student';

    return (
        <div className="max-w-5xl mx-auto space-y-8 pb-20">
            {/* Header Card */}
            <div className="bg-white p-10 rounded-[40px] shadow-sm border border-gray-50 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-purple-50 rounded-full -mr-32 -mt-32" />
                <div className="relative flex flex-col md:flex-row items-center gap-8">
                    <div className="w-32 h-32 bg-[#7C3AED] rounded-[40px] flex items-center justify-center text-white text-4xl font-bold shadow-xl shadow-purple-200">
                        {profile.name[0]}
                    </div>
                    <div className="text-center md:text-left flex-1">
                        <div className="flex flex-wrap items-center gap-3 mb-2 justify-center md:justify-start">
                            <h2 className="text-3xl font-bold text-[#1F2937]">{profile.name}</h2>
                            <span className="px-3 py-1 bg-purple-100 text-[#7C3AED] text-xs font-bold rounded-full uppercase tracking-wider">
                                {profile.role}
                            </span>
                        </div>
                        <p className="text-[#6B7280] font-medium">
                            {profile.department} {isStudent && `• Semester ${profile.semester}`}
                        </p>
                        {isStudent && (
                            <div className="flex gap-4 mt-6 justify-center md:justify-start">
                                <button 
                                    onClick={() => setIsEditing(true)}
                                    className="px-6 py-2.5 bg-[#7C3AED] text-white rounded-xl text-sm font-bold hover:bg-[#6D28D9] transition-all shadow-lg shadow-purple-100"
                                >
                                    Edit Profile
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
                {/* Left Column: Personal & Contact */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Personal Information */}
                    <div className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-50">
                        <h3 className="text-lg font-bold mb-8 flex items-center gap-3 text-[#1F2937]">
                            <User className="text-[#7C3AED] w-5 h-5" />
                            Personal Information
                        </h3>
                        <div className="grid md:grid-cols-2 gap-x-12 gap-y-8">
                            <InfoField label="Full Name" value={profile.name} />
                            <InfoField label="Email Address" value={profile.email} />
                            {isStudent && (
                                <>
                                    <InfoField label="Date of Birth" value={profile.dob || 'Not set'} />
                                    <InfoField label="Gender" value={profile.gender || 'Not set'} />
                                    <InfoField label="Blood Group" value={profile.blood_group || 'Not set'} />
                                    <InfoField label="Enrollment Year" value={profile.enrollment_year || 'Not set'} />
                                </>
                            )}
                        </div>
                    </div>

                    {/* Family Details (Student Only) */}
                    {isStudent && (
                        <div className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-50">
                            <h3 className="text-lg font-bold mb-8 flex items-center gap-3 text-[#1F2937]">
                                <Users className="text-[#7C3AED] w-5 h-5" />
                                Family Details
                            </h3>
                            <div className="grid md:grid-cols-2 gap-x-12 gap-y-8">
                                <InfoField label="Father's Name" value={profile.father_name || 'Not set'} />
                                <InfoField label="Mother's Name" value={profile.mother_name || 'Not set'} />
                                <InfoField label="Guardian Contact" value={profile.guardian_contact || 'Not set'} />
                            </div>
                        </div>
                    )}

                    {/* Address (Student Only) */}
                    {isStudent && (
                        <div className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-50">
                            <h3 className="text-lg font-bold mb-8 flex items-center gap-3 text-[#1F2937]">
                                <MapPin className="text-[#7C3AED] w-5 h-5" />
                                Permanent Address
                            </h3>
                            <p className="text-[#6B7280] leading-relaxed">
                                {profile.address || 'No address provided yet.'}
                            </p>
                        </div>
                    )}
                </div>

                {/* Right Column: Academic & Achievements */}
                <div className="space-y-8">
                    {isStudent && (
                        <div className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-50">
                            <h3 className="text-lg font-bold mb-8 flex items-center gap-3 text-[#1F2937]">
                                <GraduationCap className="text-[#7C3AED] w-5 h-5" />
                                Academic Status
                            </h3>
                            <div className="space-y-6">
                                <div className="p-6 bg-purple-50 rounded-3xl text-center">
                                    <p className="text-[10px] font-bold text-purple-400 uppercase tracking-widest mb-1">Current CGPA</p>
                                    <p className="text-4xl font-black text-[#7C3AED]">{profile.cgpa}</p>
                                </div>
                                <div className="space-y-4">
                                    <InfoField label="Roll Number" value={profile.roll_number} />
                                    <InfoField label="Semester" value={profile.semester} />
                                    <InfoField label="Department" value={profile.department} />
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-50">
                        <h3 className="text-lg font-bold mb-6 flex items-center gap-3 text-[#1F2937]">
                            <ShieldCheck className="text-[#7C3AED] w-5 h-5" />
                            Achievements
                        </h3>
                        <p className="text-[#6B7280] text-sm leading-relaxed italic">
                            {profile.achievements || 'No achievements listed yet.'}
                        </p>
                    </div>

                    <div className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-50">
                        <h3 className="text-lg font-bold mb-6 flex items-center gap-3 text-[#1F2937]">
                            <Phone className="text-[#7C3AED] w-5 h-5" />
                            Contact Details
                        </h3>
                        <InfoField label="Primary Contact" value={profile.contact || 'Not set'} />
                    </div>
                </div>
            </div>

            {/* Edit Modal */}
            {isEditing && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-6 overflow-y-auto">
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        className="bg-white w-full max-w-2xl rounded-[40px] p-10 relative my-8"
                    >
                        <h3 className="text-2xl font-bold mb-8">Update Profile Information</h3>
                        <form className="space-y-6" onSubmit={handleUpdate}>
                            <div className="grid md:grid-cols-2 gap-6">
                                <EditField label="Phone Number" name="contact" defaultValue={profile.contact} />
                                <EditField label="Date of Birth" name="dob" type="date" defaultValue={profile.dob} />
                                <EditField label="Gender" name="gender" type="select" options={['Male', 'Female', 'Other']} defaultValue={profile.gender} />
                                <EditField label="Blood Group" name="blood_group" defaultValue={profile.blood_group} />
                                <EditField label="Father's Name" name="father_name" defaultValue={profile.father_name} />
                                <EditField label="Mother's Name" name="mother_name" defaultValue={profile.mother_name} />
                                <EditField label="Guardian Contact" name="guardian_contact" defaultValue={profile.guardian_contact} />
                                <EditField label="Enrollment Year" name="enrollment_year" type="number" defaultValue={profile.enrollment_year} />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Permanent Address</label>
                                <textarea name="address" defaultValue={profile.address} className="w-full h-24 px-4 py-3 bg-gray-50 rounded-xl border-none outline-none resize-none" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Achievements</label>
                                <textarea name="achievements" defaultValue={profile.achievements} className="w-full h-24 px-4 py-3 bg-gray-50 rounded-xl border-none outline-none resize-none" />
                            </div>
                            <div className="flex gap-4 pt-4">
                                <button type="submit" className="flex-1 py-4 bg-[#7C3AED] text-white rounded-2xl font-bold shadow-lg shadow-purple-100">Save Profile</button>
                                <button type="button" onClick={() => setIsEditing(false)} className="px-8 py-4 bg-gray-100 text-gray-500 rounded-2xl font-bold">Cancel</button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </div>
    );
}

function AdminProfileView({ token, setActiveTab }: { token: string, setActiveTab: (tab: string) => void }) {
    const [profile, setProfile] = useState<any>(null);
    const [isEditing, setIsEditing] = useState(false);

    useEffect(() => {
        fetch('/api/admin/profile', { headers: { 'Authorization': `Bearer ${token}` } })
            .then(async res => (res.ok ? await safeJson(res) : null))
            .then(setProfile);
    }, [token]);

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget as HTMLFormElement);
        const payload = Object.fromEntries(formData.entries());
        
        const res = await fetch('/api/admin/profile/update', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(payload)
        });
        if (res.ok) {
            setProfile({ ...profile, ...payload });
            setIsEditing(false);
            alert('Profile updated successfully');
        }
    };

    if (!profile) return <div className="p-8 text-center">Loading Admin Profile...</div>;

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div className="bg-white p-10 rounded-[40px] shadow-sm border border-gray-50 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-purple-50 rounded-full -mr-32 -mt-32" />
                <div className="relative flex flex-col md:flex-row items-center gap-8">
                    <div className="w-32 h-32 bg-[#7C3AED] rounded-[40px] flex items-center justify-center text-white text-4xl font-bold shadow-xl shadow-purple-200">
                        {profile.name[0]}
                    </div>
                    <div className="text-center md:text-left flex-1">
                        <div className="flex flex-wrap items-center gap-3 mb-2 justify-center md:justify-start">
                            <h2 className="text-3xl font-bold text-[#1F2937]">{profile.name}</h2>
                            <span className="px-3 py-1 bg-purple-100 text-[#7C3AED] text-xs font-bold rounded-full uppercase tracking-wider">
                                {profile.role}
                            </span>
                        </div>
                        <p className="text-[#6B7280] font-medium">{profile.email}</p>
                        <div className="mt-6 flex gap-4 justify-center md:justify-start">
                            <button 
                                onClick={() => setIsEditing(true)}
                                className="px-6 py-2.5 bg-[#7C3AED] text-white rounded-xl text-sm font-bold hover:bg-[#6D28D9] transition-all shadow-lg shadow-purple-100"
                            >
                                Edit Profile
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
                <div className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-50">
                    <h3 className="text-lg font-bold mb-6 flex items-center gap-3 text-[#1F2937]">
                        <Users className="text-[#7C3AED] w-5 h-5" />
                        System Statistics
                    </h3>
                    <div className="p-6 bg-purple-50 rounded-3xl text-center">
                        <p className="text-[10px] font-bold text-purple-400 uppercase tracking-widest mb-1">Total Registered Students</p>
                        <p className="text-4xl font-black text-[#7C3AED]">{profile.totalStudents}</p>
                    </div>
                </div>
            </div>

            <div className="bg-white p-10 rounded-[40px] shadow-sm border border-gray-50">
                <h3 className="text-xl font-bold text-[#1F2937] mb-8 flex items-center gap-3">
                    <ShieldCheck className="text-[#7C3AED] w-6 h-6" />
                    Administrative Controls
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="p-6 bg-gray-50 rounded-3xl border border-gray-100 flex flex-col gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                                <Users className="w-5 h-5 text-purple-500" />
                            </div>
                            <p className="font-bold text-[#1F2937] text-sm">User Management</p>
                        </div>
                        <p className="text-xs text-[#6B7280]">Manage student profiles, roles, and administrative access.</p>
                        <button onClick={() => setActiveTab('Admin Panel')} className="mt-2 text-sm font-bold text-[#7C3AED] hover:underline text-left">Go to Directory →</button>
                    </div>
                    <div className="p-6 bg-gray-50 rounded-3xl border border-gray-100 flex flex-col gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                                <CreditCard className="w-5 h-5 text-green-500" />
                            </div>
                            <p className="font-bold text-[#1F2937] text-sm">Billing & Fees</p>
                        </div>
                        <p className="text-xs text-[#6B7280]">Track fee payments, issue reminders, and update financial records.</p>
                        <button onClick={() => setActiveTab('Fees')} className="mt-2 text-sm font-bold text-[#7C3AED] hover:underline text-left">View Fee Ledger →</button>
                    </div>
                    <div className="p-6 bg-gray-50 rounded-3xl border border-gray-100 flex flex-col gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                                <BarChart3 className="w-5 h-5 text-orange-500" />
                            </div>
                            <p className="font-bold text-[#1F2937] text-sm">Academic Analytics</p>
                        </div>
                        <p className="text-xs text-[#6B7280]">Review overall campus performance and attendance trends.</p>
                        <button onClick={() => setActiveTab('Attendance')} className="mt-2 text-sm font-bold text-[#7C3AED] hover:underline text-left">Check Analytics →</button>
                    </div>
                </div>
            </div>

            {isEditing && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-6">
                    <div className="bg-white w-full max-w-md rounded-[40px] p-10 relative">
                        <h3 className="text-2xl font-bold mb-8">Update Admin Info</h3>
                        <form className="space-y-6" onSubmit={handleUpdate}>
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Full Name</label>
                                <input name="name" defaultValue={profile.name} required className="w-full px-4 py-3 bg-gray-50 rounded-xl border-none outline-none" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Email Address</label>
                                <input name="email" defaultValue={profile.email} required type="email" className="w-full px-4 py-3 bg-gray-50 rounded-xl border-none outline-none" />
                            </div>
                            <div className="flex gap-4 pt-4">
                                <button type="submit" className="flex-1 py-4 bg-[#7C3AED] text-white rounded-2xl font-bold shadow-lg shadow-purple-100">Save Changes</button>
                                <button type="button" onClick={() => setIsEditing(false)} className="px-8 py-4 bg-gray-100 text-gray-500 rounded-2xl font-bold">Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

function AlumniView({ token, user }: { token: string, user: any }) {
    const [alumni, setAlumni] = useState<any[]>([]);
    const [search, setSearch] = useState('');
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [editingAlumni, setEditingAlumni] = useState<any>(null);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);

    useEffect(() => {
        fetch('/api/alumni', { headers: { 'Authorization': `Bearer ${token}` } })
            .then(async res => (res.ok ? await safeJson(res) : []) || [])
            .then(setAlumni);
    }, [token]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setSelectedImage(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleAddAlumni = async (e: React.FormEvent) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget as HTMLFormElement);
        const payload = Object.fromEntries(formData.entries());
        
        const res = await fetch('/api/alumni', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({
                ...payload,
                imageUrl: selectedImage,
                batchYear: parseInt(payload.batchYear as string) || new Date().getFullYear()
            })
        });
        if (res.ok) {
            setIsAddOpen(false);
            setSelectedImage(null);
            fetch('/api/alumni', { headers: { 'Authorization': `Bearer ${token}` } })
                .then(async r => (r.ok ? await safeJson(r) : []) || [])
                .then(setAlumni);
        } else {
            const err = await res.json();
            alert(err.message || 'Failed to add alumni record');
        }
    };

    const handleEditAlumni = async (e: React.FormEvent) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget as HTMLFormElement);
        const payload = Object.fromEntries(formData.entries());
        
        const res = await fetch(`/api/alumni/${editingAlumni.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({
                ...payload,
                imageUrl: selectedImage || editingAlumni.image_url,
                batchYear: parseInt(payload.batchYear as string) || new Date().getFullYear()
            })
        });
        if (res.ok) {
            setEditingAlumni(null);
            setSelectedImage(null);
            fetch('/api/alumni', { headers: { 'Authorization': `Bearer ${token}` } })
                .then(async r => (r.ok ? await safeJson(r) : []) || [])
                .then(setAlumni);
        } else {
            const err = await res.json();
            alert(err.message || 'Failed to update alumni record');
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this record?')) return;
        const res = await fetch(`/api/alumni/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
            setAlumni(alumni.filter(a => a.id !== id));
        }
    };

    const filtered = alumni.filter(a => 
        a.name.toLowerCase().includes(search.toLowerCase()) ||
        a.batch_year.toString().includes(search)
    );

    return (
        <div className="space-y-8">
            <div className="flex flex-wrap gap-4 items-center justify-between">
                <h2 className="text-2xl font-bold text-[#1F2937]">Alumni Network</h2>
                <div className="flex gap-4 flex-1 max-w-md">
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input 
                            placeholder="Search by name or batch..."
                            className="w-full pl-10 pr-4 py-3 bg-white border border-gray-100 rounded-2xl outline-none"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    {user.role === 'admin' && (
                        <motion.button 
                            whileHover={{ scale: 1.05, boxShadow: "0 0 20px rgba(255,255,255,0.5)" }}
                            onClick={() => {
                                setSelectedImage(null);
                                setIsAddOpen(true);
                            }} 
                            className="px-6 py-3 bg-[#7C3AED] text-white rounded-2xl font-bold text-sm"
                        >
                            Add Alumni
                        </motion.button>
                    )}
                </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
                {filtered.map((a, i) => (
                    <div key={i} className="bg-white rounded-[32px] overflow-hidden shadow-sm border border-gray-50 group">
                        <div className="h-48 bg-gray-100 relative">
                            <img src={a.image_url || `https://api.dicebear.com/7.x/initials/svg?seed=${a.name}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-6">
                                <p className="text-white text-xs font-medium">{a.career_info}</p>
                            </div>
                            <span className="absolute top-4 right-4 px-3 py-1 bg-white/90 backdrop-blur-sm text-[#7C3AED] rounded-full text-[10px] font-bold uppercase">
                                Batch {a.batch_year}
                            </span>
                        </div>
                        <div className="p-6">
                            <h3 className="font-bold text-[#1F2937] mb-1">{a.name}</h3>
                            <p className="text-xs text-[#6B7280] mb-4">{a.contact_details}</p>
                            
                            <div className="space-y-3">
                                <div className="p-3 bg-gray-50 rounded-xl">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Achievements</p>
                                    <p className="text-xs text-[#1F2937] line-clamp-2">{a.achievements}</p>
                                </div>
                                {user.role === 'admin' && (
                                    <div className="flex gap-4 pt-2">
                                        <button onClick={() => {
                                            setSelectedImage(null);
                                            setEditingAlumni(a);
                                        }} className="text-xs font-bold text-[#7C3AED]">Edit</button>
                                        <button onClick={() => handleDelete(a.id)} className="text-xs font-bold text-red-500">Delete</button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {isAddOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-6 overflow-y-auto">
                    <div className="bg-white w-full max-w-md rounded-[40px] p-10 relative my-8 shadow-2xl">
                        <h3 className="text-2xl font-bold mb-6">Add Alumni Record</h3>
                        <form className="space-y-4" onSubmit={handleAddAlumni}>
                            <input name="name" placeholder="Full Name" required className="w-full px-4 py-3 bg-gray-50 rounded-xl border-none outline-none" />
                            <input name="batchYear" placeholder="Batch Year (e.g. 2020)" type="number" required className="w-full px-4 py-3 bg-gray-50 rounded-xl border-none outline-none" />
                            <input name="contactDetails" placeholder="Contact (Email/Phone)" required className="w-full px-4 py-3 bg-gray-50 rounded-xl border-none outline-none" />
                            <input name="careerInfo" placeholder="Current Career/Company" required className="w-full px-4 py-3 bg-gray-50 rounded-xl border-none outline-none" />
                            <textarea name="achievements" placeholder="Achievements" className="w-full h-24 px-4 py-3 bg-gray-50 rounded-xl border-none outline-none resize-none" />
                            
                            <div className="space-y-2">
                                <label className="block text-xs font-bold text-gray-400 uppercase">Profile Image</label>
                                <div className="flex items-center gap-4">
                                    <label className="flex-1 cursor-pointer">
                                        <div className="w-full py-3 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-2 hover:bg-gray-100 transition-colors">
                                            <FileUp className="w-5 h-5 text-gray-400" />
                                            <span className="text-xs font-semibold text-gray-500">Choose Image</span>
                                        </div>
                                        <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                                    </label>
                                    {selectedImage && (
                                        <div className="w-12 h-12 rounded-xl overflow-hidden border border-gray-200">
                                            <img src={selectedImage} alt="Preview" className="w-full h-full object-cover" />
                                        </div>
                                    )}
                                </div>
                            </div>

                            <button type="submit" className="w-full py-4 bg-[#7C3AED] text-white rounded-2xl font-bold shadow-lg shadow-purple-100">Add Alumni</button>
                            <button type="button" onClick={() => setIsAddOpen(false)} className="w-full py-2 text-gray-500 font-bold text-sm">Cancel</button>
                        </form>
                    </div>
                </div>
            )}

            {editingAlumni && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-6 overflow-y-auto">
                    <div className="bg-white w-full max-w-md rounded-[40px] p-10 relative my-8 shadow-2xl">
                        <h3 className="text-2xl font-bold mb-6">Edit Alumni Record</h3>
                        <form className="space-y-4" onSubmit={handleEditAlumni}>
                            <EditField label="Full Name" name="name" defaultValue={editingAlumni.name} />
                            <EditField label="Batch Year" name="batchYear" type="number" defaultValue={editingAlumni.batch_year} />
                            <EditField label="Contact" name="contactDetails" defaultValue={editingAlumni.contact_details} />
                            <EditField label="Career Info" name="careerInfo" defaultValue={editingAlumni.career_info} />
                            <div className="space-y-2">
                                <label className="block text-xs font-bold text-gray-400 uppercase">Achievements</label>
                                <textarea name="achievements" defaultValue={editingAlumni.achievements} className="w-full h-24 px-4 py-3 bg-gray-50 rounded-xl border-none outline-none resize-none" />
                            </div>
                            
                            <div className="space-y-2">
                                <label className="block text-xs font-bold text-gray-400 uppercase">Profile Image</label>
                                <div className="flex items-center gap-4">
                                    <label className="flex-1 cursor-pointer">
                                        <div className="w-full py-3 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-2 hover:bg-gray-100 transition-colors">
                                            <FileUp className="w-5 h-5 text-gray-400" />
                                            <span className="text-xs font-semibold text-gray-500">Change Image</span>
                                        </div>
                                        <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                                    </label>
                                    {(selectedImage || editingAlumni.image_url) && (
                                        <div className="w-12 h-12 rounded-xl overflow-hidden border border-gray-200">
                                            <img src={selectedImage || editingAlumni.image_url} alt="Preview" className="w-full h-full object-cover" />
                                        </div>
                                    )}
                                </div>
                            </div>

                            <button type="submit" className="w-full py-4 bg-[#7C3AED] text-white rounded-2xl font-bold shadow-lg shadow-purple-100">Update Record</button>
                            <button type="button" onClick={() => setEditingAlumni(null)} className="w-full py-2 text-gray-500 font-bold text-sm">Cancel</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

function InfoField({ label, value }: { label: string, value: any }) {
    return (
        <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">{label}</p>
            <p className="text-[#1F2937] font-semibold">{value || '—'}</p>
        </div>
    );
}

function EditField({ label, name, defaultValue, type = 'text', options = [] }: { label: string, name: string, defaultValue: any, type?: string, options?: string[] }) {
    return (
        <div>
            <label className="block text-xs font-bold text-gray-400 uppercase mb-2">{label}</label>
            {type === 'select' ? (
                <select name={name} defaultValue={defaultValue} className="w-full px-4 py-3 bg-gray-50 rounded-xl border-none outline-none">
                    <option value="">Select {label}</option>
                    {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
            ) : (
                <input type={type} name={name} defaultValue={defaultValue} className="w-full px-4 py-3 bg-gray-50 rounded-xl border-none outline-none" />
            )}
        </div>
    );
}

function BookScannerView({ token, onSuccess }: { token: string, onSuccess?: () => void }) {
    const [scanning, setScanning] = useState(false);
    const [book, setBook] = useState<any>(null);
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [error, setError] = useState('');
    const [queryInput, setQueryInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPreview, setShowPreview] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');

    const handleAddToLibrary = async () => {
        if (!book) return;
        setLoading(true);
        setError('');
        try {
            const res = await fetch('/api/books', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` 
                },
                body: JSON.stringify(book)
            });
            const data = await res.json();
            if (res.ok) {
                setSuccessMessage('Book successfully added to campus library!');
                if (onSuccess) onSuccess();
                setTimeout(() => setSuccessMessage(''), 4000);
            } else {
                setError(data.message || 'Failed to add book to library');
            }
        } catch (e) {
            setError('Error connecting to server');
        } finally {
            setLoading(false);
        }
    };

    const loadBookPreview = (isbn: string) => {
        const tryLoad = (attempts = 0) => {
            const google = (window as any).google;
            
            if (!google || !google.books) {
                if (attempts < 20) {
                    setTimeout(() => tryLoad(attempts + 1), 500);
                } else {
                    console.warn("Google Books API library not found or not yet loaded");
                }
                return;
            }

            const canvas = document.getElementById('viewerCanvas');
            if (!canvas) {
                if (attempts < 10) {
                    setTimeout(() => tryLoad(attempts + 1), 200);
                }
                return;
            }

            const initializeViewer = () => {
                if (google.books && google.books.DefaultViewer) {
                    try {
                        const viewer = new google.books.DefaultViewer(canvas);
                        viewer.load(`ISBN:${isbn}`, () => {
                            console.log("Book preview not available for this identifier.");
                            const msg = document.createElement('div');
                            msg.className = "text-center p-10 text-gray-400 font-medium font-sans";
                            msg.innerText = "Preview not available for this edition.";
                            canvas.innerHTML = '';
                            canvas.appendChild(msg);
                        });
                    } catch (err) {
                        console.error("Error creating DefaultViewer:", err);
                    }
                }
            };

            try {
                // The documentation uses google.books.load()
                if (typeof google.books.load === 'function') {
                    google.books.load();
                    google.books.setOnLoadCallback(initializeViewer);
                } 
                // Fallback to google.load('books', '1') if the above is missing
                else if (typeof google.load === 'function') {
                    google.load('books', '1', { 'callback': initializeViewer });
                }
                // If already initialized
                else if (google.books.DefaultViewer) {
                    initializeViewer();
                }
                else {
                    if (attempts < 20) {
                        setTimeout(() => tryLoad(attempts + 1), 500);
                    } else {
                        console.warn("Google Books Loader methods (load/google.load) not found after multiple attempts");
                    }
                }
            } catch (e) {
                console.error("Error in Google Books initialization sequence:", e);
            }
        };

        tryLoad();
    };

    useEffect(() => {
        if (showPreview && book?.isbn) {
            loadBookPreview(book.isbn);
        }
    }, [showPreview, book?.isbn]);

    useEffect(() => {
        let scanner: Html5QrcodeScanner | null = null;
        if (scanning) {
            scanner = new Html5QrcodeScanner("reader", { fps: 10, qrbox: 250 }, false);
            scanner.render(onScanSuccess, onScanError);
        }
        return () => {
            if (scanner) scanner.clear().catch(console.error);
        };
    }, [scanning]);

    const handleSearch = async (isIsbn: boolean = false) => {
        if (!queryInput) return;
        setScanning(false);
        setLoading(true);
        setError('');
        setBook(null);
        setSearchResults([]);

        try {
            if (isIsbn || /^\d+$/.test(queryInput)) {
                // Try ISBN lookup
                const res = await fetch(`/api/books/isbn/${queryInput}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setBook(data);
                } else {
                    // Try general search as fallback
                    const altRes = await fetch(`/api/books/remote-search?q=${encodeURIComponent(queryInput)}`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    const data = await altRes.json();
                    if (data.length > 0) setSearchResults(data);
                    else setError('No books found for this query');
                }
            } else {
                // Title/Author Search
                const res = await fetch(`/api/books/remote-search?q=${encodeURIComponent(queryInput)}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await res.json();
                if (data.length > 0) setSearchResults(data);
                else setError('No books found');
            }
        } catch (err) {
            setError('Failed to retrieve book data');
        } finally {
            setLoading(false);
        }
    };

    const handleSelectBookFromList = async (selected: any) => {
        setLoading(true);
        try {
            const res = await fetch(`/api/books/isbn/${selected.isbn || selected.title}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            setBook(data);
            setSearchResults([]);
        } catch (e) {
            setBook(selected); // Use what we have
        } finally {
            setLoading(false);
        }
    };

    const onScanSuccess = (decodedText: string) => {
        setQueryInput(decodedText);
        handleSearch(true);
    };

    const onScanError = (err: any) => {};

    return (
        <div className="max-w-2xl mx-auto space-y-8 pb-20">
            <div className="bg-white p-10 rounded-[40px] shadow-sm border border-gray-50 text-center">
                <div className="w-20 h-20 bg-purple-50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                    <QrCode className="w-10 h-10 text-[#7C3AED]" />
                </div>
                <h2 className="text-2xl font-bold text-[#1F2937] mb-2">Book Explorer</h2>
                <p className="text-[#6B7280] mb-8 text-sm px-10">Search by title, author, or scan ISBN barcode.</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                    {!scanning ? (
                        <button 
                            onClick={() => setScanning(true)}
                            className="p-6 bg-[#7C3AED] text-white rounded-3xl font-bold flex flex-col items-center gap-3 hover:bg-[#6D28D9] transition-all shadow-lg shadow-purple-100"
                        >
                            <Camera className="w-8 h-8" />
                            <span>Scan ISBN</span>
                        </button>
                    ) : (
                        <div className="col-span-1 md:col-span-2">
                            <div id="reader" className="overflow-hidden rounded-3xl border-2 border-dashed border-purple-100"></div>
                            <button onClick={() => setScanning(false)} className="mt-4 text-red-500 font-bold hover:underline">Stop Scanner</button>
                        </div>
                    )}
                    
                    <label className="p-6 bg-gray-50 text-[#1F2937] rounded-3xl font-bold flex flex-col items-center gap-3 hover:bg-gray-100 cursor-pointer transition-all border border-gray-100">
                        <FileUp className="w-8 h-8 text-[#7C3AED]" />
                        <span>Upload QR/Bar</span>
                        <input type="file" className="hidden" onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) alert("Scanning file for barcodes... This feature requires browser barcode detection API.");
                        }} />
                    </label>
                </div>

                <div className="flex gap-2">
                    <div className="relative flex-1">
                        <input 
                            type="text" 
                            placeholder="Title, Author, or ISBN..." 
                            value={queryInput}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            onChange={(e) => setQueryInput(e.target.value)}
                            className="w-full px-6 py-4 bg-gray-50 rounded-2xl border-none outline-none text-sm font-medium pr-12"
                        />
                        {loading && <div className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 border-2 border-[#7C3AED] border-t-transparent rounded-full animate-spin" />}
                    </div>
                    <button 
                        onClick={() => handleSearch()}
                        disabled={loading}
                        className="px-8 py-4 bg-[#1F2937] text-white rounded-2xl font-bold hover:bg-black transition-colors disabled:bg-gray-300"
                    >
                        Search
                    </button>
                </div>
            </div>

            {error && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-6 bg-red-50 rounded-3xl border border-red-100 flex items-center gap-4 text-red-600">
                    <AlertCircle className="w-6 h-6" />
                    <p className="font-bold">{error}</p>
                </motion.div>
            )}

            {successMessage && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-6 bg-green-50 rounded-3xl border border-green-100 flex items-center gap-4 text-green-600">
                    <CheckCircle className="w-6 h-6" />
                    <p className="font-bold">{successMessage}</p>
                </motion.div>
            )}

            {searchResults.length > 0 && (
                <div className="space-y-4">
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest px-4">Search Results</h3>
                    <div className="space-y-3">
                        {searchResults.map((res, i) => (
                            <motion.div 
                                key={i}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.05 }}
                                onClick={() => handleSelectBookFromList(res)}
                                className="bg-white p-4 rounded-3xl border border-gray-100 flex items-center gap-4 cursor-pointer hover:border-purple-200 hover:shadow-md transition-all group"
                            >
                                <div className="w-16 h-20 bg-gray-100 rounded-xl overflow-hidden shrink-0">
                                    {res.coverImage ? <img src={res.coverImage} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><Library className="w-5 h-5 text-gray-300" /></div>}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-bold text-[#1F2937] truncate group-hover:text-[#7C3AED] transition-colors">{res.title}</h4>
                                    <p className="text-xs text-gray-400 font-medium">by {res.author}</p>
                                    <div className="mt-2 text-[10px] font-bold text-gray-400 uppercase">{res.category}</div>
                                </div>
                                <ChevronRight className="w-5 h-5 text-gray-200 group-hover:text-[#7C3AED] group-hover:translate-x-1 transition-all" />
                            </motion.div>
                        ))}
                    </div>
                </div>
            )}

            {book && (
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-[#1F2937] p-10 rounded-[40px] text-white relative overflow-hidden shadow-2xl">
                    <div className="absolute top-0 right-0 p-10 opacity-5">
                        <Library className="w-64 h-64 -mr-20 -mt-20" />
                    </div>
                    
                    <div className="relative z-10">
                        <div className="flex flex-col md:flex-row gap-8">
                            <div className="w-40 h-56 bg-white/10 rounded-2xl overflow-hidden shadow-xl shrink-0">
                                {book.coverImage ? (
                                    <img src={book.coverImage} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                        <BookMarked className="w-12 h-12 text-white/20" />
                                    </div>
                                )}
                            </div>
                            
                            <div className="flex-1">
                                <div className="px-3 py-1 bg-green-500/20 text-green-400 text-[10px] font-bold rounded-full w-fit mb-4 border border-green-500/30 uppercase tracking-widest">
                                    ISBN: {book.isbn || 'N/A'}
                                </div>
                                <h3 className="text-3xl font-bold mb-2">{book.title}</h3>
                                <p className="text-gray-400 font-medium text-lg mb-4 italic">by {book.author}</p>
                                <p className="text-sm text-gray-300 line-clamp-3 mb-6 bg-white/5 p-4 rounded-2xl italic leading-relaxed">
                                    {book.description || "The profound wisdom within this volume awaits your intellectual pursuit."}
                                </p>
                                
                                <div className="grid grid-cols-2 gap-4 mb-8">
                                    <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">Subject Area</p>
                                        <p className="font-bold text-sm">{book.category || 'Academic'}</p>
                                    </div>
                                    <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">Library Status</p>
                                        <p className="font-bold text-sm text-green-400">Available</p>
                                    </div>
                                </div>
                                
                                <div className="flex flex-wrap gap-4">
                                    <button 
                                        onClick={handleAddToLibrary}
                                        disabled={loading}
                                        className="flex-1 py-4 bg-green-600 text-white rounded-2xl font-bold shadow-lg shadow-green-900/20 hover:bg-green-700 transition-all disabled:opacity-50"
                                    >
                                        Add to Library
                                    </button>
                                    <button className="flex-1 py-4 bg-[#7C3AED] text-white rounded-2xl font-bold shadow-lg shadow-purple-900/20 hover:bg-[#6D28D9] transition-all">Request Issue</button>
                                    <button 
                                        onClick={() => setShowPreview(!showPreview)} 
                                        className="flex-1 py-4 bg-white/10 text-white rounded-2xl font-bold hover:bg-white/20 transition-all border border-white/10"
                                    >
                                        {showPreview ? "Hide Preview" : "View Preview"}
                                    </button>
                                    <button onClick={() => { setBook(null); setShowPreview(false); }} className="px-6 py-4 bg-red-500/10 text-red-400 rounded-2xl font-bold hover:bg-red-500/20 transition-all border border-red-500/20">Dismiss</button>
                                </div>
                            </div>
                        </div>

                        {showPreview && (
                            <motion.div 
                                initial={{ opacity: 0, height: 0 }} 
                                animate={{ opacity: 1, height: 'auto' }} 
                                className="mt-10 overflow-hidden"
                            >
                                <div id="viewerCanvas" style={{ width: '100%', height: '500px' }} className="rounded-2xl overflow-hidden bg-white"></div>
                                <p className="mt-2 text-xs text-center text-gray-500 font-medium">Preview provided by Google Books Embedded Viewer</p>
                            </motion.div>
                        )}
                    </div>
                </motion.div>
            )}
        </div>
    );
}
