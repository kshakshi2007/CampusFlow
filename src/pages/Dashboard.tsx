import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { 
    LayoutDashboard, BookOpen, Calendar, Search, CreditCard, 
    Bell, LogOut, User, GraduationCap, Clock, AlertCircle,
    ChevronRight, BookMarked, ShieldCheck, Users, BarChart3, FileText,
    MapPin, Phone, Award, QrCode, UserCircle, ArrowLeft, Plus, Target, Music, Trophy, Star, Image, Download, CheckCircle, X, Camera, FileUp,
    Library, Trash2, Home
} from 'lucide-react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
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
            case 'Study Materials':
                return <StudyMaterialsView token={token!} user={user!} />;
            case 'Events':
                return <EventsView token={token!} user={user!} />;
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
        <div className="min-h-screen bg-[#F8F7FF] flex">
            {/* Sidebar */}
            <aside className="w-72 bg-white border-r border-gray-100 hidden lg:flex flex-col p-6 sticky top-0 h-screen">
                <div className="flex items-center gap-3 mb-10 px-2">
                    <div className="w-10 h-10 bg-[#7C3AED] rounded-xl flex items-center justify-center">
                        <BookOpen className="text-white w-6 h-6" />
                    </div>
                    <span className="text-xl font-bold text-[#1F2937]">CampusFlow</span>
                </div>

                <nav className="space-y-2 flex-1">
                    <SidebarLink icon={<LayoutDashboard />} label="Dashboard" active={activeTab === 'Dashboard'} onClick={() => setActiveTab('Dashboard')} />
                    <SidebarLink icon={<User />} label="Profile" active={activeTab === 'Profile'} onClick={() => setActiveTab('Profile')} />
                    <SidebarLink icon={<BarChart3 />} label="Attendance" active={activeTab === 'Attendance'} onClick={() => setActiveTab('Attendance')} />
                    <SidebarLink icon={<FileText />} label="Results" active={activeTab === 'Results'} onClick={() => setActiveTab('Results')} />
                    <SidebarLink icon={<BookMarked />} label="Study Materials" active={activeTab === 'Study Materials'} onClick={() => setActiveTab('Study Materials')} />
                    <SidebarLink icon={<Calendar />} label="Events" active={activeTab === 'Events'} onClick={() => setActiveTab('Events')} />
                    <SidebarLink icon={<Search />} label="Lost & Found" active={activeTab === 'Lost & Found'} onClick={() => setActiveTab('Lost & Found')} />
                    <SidebarLink icon={<Award />} label="Alumni" active={activeTab === 'Alumni'} onClick={() => setActiveTab('Alumni')} />
                    <SidebarLink icon={<BookOpen />} label="Library" active={activeTab === 'Library'} onClick={() => setActiveTab('Library')} />
                    {(user?.role === 'student' || user?.role === 'admin') && (
                        <SidebarLink icon={<CreditCard />} label="Fees" active={activeTab === 'Fees'} onClick={() => setActiveTab('Fees')} />
                    )}
                    {user?.role === 'admin' && (
                        <>
                            <SidebarLink icon={<ShieldCheck />} label="Admin Panel" active={activeTab === 'Admin Panel'} onClick={() => setActiveTab('Admin Panel')} />
                            <SidebarLink icon={<UserCircle />} label="Admin Profile" active={activeTab === 'Admin Profile'} onClick={() => setActiveTab('Admin Profile')} />
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
            <main className="flex-1 p-8 lg:p-12 overflow-y-auto">
                <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
                    <div>
                        <h1 className="text-3xl font-bold text-[#1F2937]">Welcome, {user?.name}</h1>
                        <p className="text-[#6B7280] mt-1">Role: <span className="capitalize font-semibold text-[#7C3AED]">{user?.role}</span></p>
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
                            <div className="w-12 h-12 bg-purple-100 rounded-2xl flex items-center justify-center border border-purple-200">
                                <User className="text-[#7C3AED] w-6 h-6" />
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
    const stats = [
        { label: 'CGPA', value: data?.student?.cgpa || '0.0', icon: <GraduationCap className="w-6 h-6 text-purple-500" />, color: 'bg-purple-50' },
        { label: 'Semester', value: data?.student?.semester || '1', icon: <BookOpen className="w-6 h-6 text-blue-500" />, color: 'bg-blue-50' },
        { label: 'Attendance', value: '85%', icon: <Clock className="w-6 h-6 text-green-500" />, color: 'bg-green-50' },
        { label: 'Backlogs', value: data?.student?.backlogs || '0', icon: <AlertCircle className="w-6 h-6 text-red-500" />, color: 'bg-red-50' },
    ];

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
                <div className="lg:col-span-2 bg-white p-8 rounded-[40px] shadow-sm border border-gray-50">
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

                <div className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-50 flex flex-col justify-center items-center text-center">
                    <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mb-6">
                        <Users className="text-[#7C3AED] w-10 h-10" />
                    </div>
                    <h2 className="text-2xl font-bold text-[#1F2937] mb-2">Attendance Management</h2>
                    <p className="text-[#6B7280] mb-8">Update and track student attendance for your assigned subjects.</p>
                    <AttendanceModal token={data?.token} />
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
<<<<<<< Updated upstream
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
=======
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Student ID (1-500)</label>
                                <input 
                                    type="number" 
                                    required 
>>>>>>> Stashed changes
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
    const [filter, setFilter] = useState({ semester: '', type: '', subject: '' });
    const [isUploadOpen, setIsUploadOpen] = useState(false);

    useEffect(() => {
        fetch('/api/materials', { headers: { 'Authorization': `Bearer ${token}` } })
            .then(async res => (res.ok ? await safeJson(res) : []) || [])
            .then(setMaterials);
    }, [token]);

    const filtered = materials.filter(m => 
        (!filter.semester || m.semester.toString() === filter.semester) &&
        (!filter.type || m.type === filter.type)
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
        { id: 'syllabus', label: 'Syllabus' },
        { id: 'question_bank', label: 'Question Bank' },
        { id: 'textbook', label: 'Textbooks' },
    ];

    return (
        <div className="space-y-8">
            <div className="flex flex-wrap gap-4 items-center justify-between">
                <div className="flex gap-4">
                    <select 
                        className="px-4 py-2 bg-white border border-gray-100 rounded-xl text-sm outline-none"
                        onChange={(e) => setFilter({...filter, semester: e.target.value})}
                    >
                        <option value="">All Semesters</option>
                        {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>Semester {s}</option>)}
                    </select>
                    <select 
                        className="px-4 py-2 bg-white border border-gray-100 rounded-xl text-sm outline-none"
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
                            <input name="semester" type="number" placeholder="Semester (1-8)" required className="w-full px-4 py-3 bg-gray-50 rounded-xl border-none outline-none" />
                            <input name="subjectId" type="number" placeholder="Subject ID" required className="w-full px-4 py-3 bg-gray-50 rounded-xl border-none outline-none" />
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
    const [loadingRegistrations, setLoadingRegistrations] = useState(false);
    const [registrationStatus, setRegistrationStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [registrationError, setRegistrationError] = useState('');

    const [isAddResourceOpen, setIsAddResourceOpen] = useState(false);
    const [isAddLeaderboardOpen, setIsAddLeaderboardOpen] = useState(false);

    useEffect(() => {
        fetchEvents();
    }, []);

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
                body: JSON.stringify({ eventId: selectedEvent.id })
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
                                <p className="text-sm text-[#6B7280] mb-6 line-clamp-2 flex-1">{e.description}</p>
                                <div className="flex items-center gap-3">
                                    <button 
                                        onClick={() => { setSelectedEvent(e); setViewMode('details'); fetchEventDetails(e.id); }}
                                        className="flex-1 py-3 bg-gray-50 text-[#1F2937] rounded-2xl font-bold hover:bg-gray-100 transition-colors"
                                    >
                                        View Details
                                    </button>
                                    <button 
                                        onClick={() => { setSelectedEvent(e); setIsRegisterOpen(true); }}
                                        className="flex-1 py-3 bg-[#7C3AED] text-white rounded-2xl font-bold shadow-lg shadow-purple-100"
                                    >
                                        Register
                                    </button>
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
                                    <span>{new Date(selectedEvent.date).toLocaleString()}</span>
                                </div>
                            </div>
                            <h1 className="text-3xl font-bold text-[#1F2937] mb-4">{selectedEvent.title}</h1>
                            <p className="text-[#6B7280] leading-relaxed mb-8">{selectedEvent.description}</p>
                            
                            <div className="grid sm:grid-cols-2 gap-6">
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
                            <h3 className="text-xl font-bold mb-4">Join this Event</h3>
                            <p className="text-purple-100 text-sm mb-8 leading-relaxed">
                                Be part of this amazing experience. Register now to secure your spot!
                            </p>
                            <button 
                                onClick={() => setIsRegisterOpen(true)}
                                className="w-full py-4 bg-white text-[#7C3AED] rounded-2xl font-bold shadow-lg hover:bg-purple-50 transition-colors mb-4"
                            >
                                Register Now
                            </button>
                            <p className="text-center text-[10px] font-bold uppercase tracking-widest text-purple-200">
                                Registration closes soon
                            </p>
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
                            <textarea name="description" placeholder="Short Description" className="w-full px-4 py-3 bg-gray-50 rounded-xl border-none outline-none" />
                            <div className="grid grid-cols-2 gap-4">
                                <input name="date" type="datetime-local" required className="w-full px-4 py-3 bg-gray-50 rounded-xl border-none outline-none" />
                                <select name="category" required className="w-full px-4 py-3 bg-gray-50 rounded-xl border-none outline-none">
                                    <option value="technical">Technical</option>
                                    <option value="cultural">Cultural</option>
                                    <option value="sports">Sports</option>
                                    <option value="college_fest">College Fest</option>
                                </select>
                            </div>
                            <input name="venue" placeholder="Venue / Location" required className="w-full px-4 py-3 bg-gray-50 rounded-xl border-none outline-none" />
                            <input name="organizer" placeholder="Organizer Name" className="w-full px-4 py-3 bg-gray-50 rounded-xl border-none outline-none" />
                            <input name="department" placeholder="Department" className="w-full px-4 py-3 bg-gray-50 rounded-xl border-none outline-none" />
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
                                <h3 className="text-2xl font-bold mb-4 text-[#1F2937]">Confirm Registration</h3>
                                <p className="text-[#6B7280] mb-8 leading-relaxed">
                                    Are you sure you want to register for <br/>
                                    <span className="font-bold text-[#7C3AED]">{selectedEvent.title}</span>?
                                </p>
                                <div className="space-y-3">
                                    <button 
                                        onClick={handleRegister}
                                        disabled={registrationStatus === 'loading'}
                                        className="w-full py-4 bg-[#7C3AED] text-white rounded-2xl font-bold hover:bg-[#6D28D9] transition-all shadow-lg shadow-purple-100 disabled:opacity-50"
                                    >
                                        {registrationStatus === 'loading' ? 'Registering...' : 'Confirm Registration'}
                                    </button>
                                    <button 
                                        onClick={() => setIsRegisterOpen(false)} 
                                        disabled={registrationStatus === 'loading'}
                                        className="w-full py-2 text-gray-400 font-medium hover:text-gray-600 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                </div>
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
                        <p className="text-sm text-[#6B7280] mb-6">Total registrations for "{selectedEvent.title}": {registrations.length}</p>
                        
                        <div className="overflow-y-auto flex-1 pr-2">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50 text-[10px] uppercase tracking-widest text-[#9CA3AF] font-bold sticky top-0">
                                    <tr>
                                        <th className="px-6 py-4">Name</th>
                                        <th className="px-6 py-4">Roll Number</th>
                                        <th className="px-6 py-4">Email</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {registrations.map((reg, i) => (
                                        <tr key={i} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 font-bold text-[#1F2937] text-sm">{reg.name}</td>
                                            <td className="px-6 py-4 text-sm text-[#6B7280]">{reg.roll_number}</td>
                                            <td className="px-6 py-4 text-sm text-[#6B7280]">{reg.email}</td>
                                        </tr>
                                    ))}
                                    {registrations.length === 0 && (
                                        <tr>
                                            <td colSpan={3} className="px-6 py-10 text-center text-gray-400 italic">No registrations yet.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
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

    useEffect(() => {
        fetch('/api/library/books', { headers: { 'Authorization': `Bearer ${token}` } })
            .then(async res => (res.ok ? await safeJson(res) : []) || [])
            .then(setBooks);
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
                        <BookScannerView token={token} />
                    </div>
                </div>
            )}

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filtered.map((book, i) => (
                    <div key={i} className="bg-white p-6 rounded-[32px] shadow-sm border border-gray-50">
                        <div className="flex justify-between items-start mb-4">
                            <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center">
                                <BookOpen className="text-[#7C3AED] w-6 h-6" />
                            </div>
                            <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${
                                book.availability === 'available' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                            }`}>
                                {book.availability.replace('_', ' ')}
                            </span>
                        </div>
                        <h3 className="font-bold text-[#1F2937] mb-1">{book.title}</h3>
                        <p className="text-xs text-[#6B7280] mb-4">By {book.author}</p>
                        <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                            <span className="text-[10px] text-[#9CA3AF] font-medium">{book.copies} Copies Available</span>
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
    const [searchTerm, setSearchTerm] = useState('');
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [isNotifOpen, setIsNotifOpen] = useState(false);
    const [editingStudent, setEditingStudent] = useState<any>(null);
    const [addingFee, setAddingFee] = useState<any>(null);

    useEffect(() => {
        fetch('/api/admin/students', { headers: { 'Authorization': `Bearer ${token}` } })
            .then(async res => (res.ok ? await safeJson(res) : []) || [])
            .then(setStudents);
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
        !searchTerm || 
        s.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.roll_number?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-8">
            <div className="bg-white rounded-[40px] shadow-sm border border-gray-50 overflow-hidden">
                <div className="p-8 border-b border-gray-50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex flex-col gap-1">
                        <h2 className="text-xl font-bold text-[#1F2937]">Student Directory ({students.length})</h2>
                        <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Manage all registered students</p>
                    </div>
                    <div className="flex flex-wrap gap-4 w-full md:w-auto">
                        <div className="relative flex-1 md:w-64">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input 
                                type="text"
                                placeholder="Search by name or ID..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-purple-100 transition-all"
                            />
                        </div>
                        <motion.button 
                            whileHover={{ scale: 1.05, boxShadow: "0 0 20px rgba(255,255,255,0.5)" }}
                            onClick={() => setIsNotifOpen(true)} 
                            className="px-6 py-2.5 bg-orange-500 text-white rounded-xl text-sm font-bold"
                        >
                            Send Alert
                        </motion.button>
                        <motion.button 
                            whileHover={{ scale: 1.05, boxShadow: "0 0 20px rgba(255,255,255,0.5)" }}
                            onClick={() => setIsAddOpen(true)} 
                            className="px-6 py-2.5 bg-[#7C3AED] text-white rounded-xl text-sm font-bold"
                        >
                            Add Student
                        </motion.button>
                    </div>
                </div>
                <div className="overflow-x-auto">
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
                </div>
            </div>

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
        </div>
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
    const [subjects, setSubjects] = useState<any[]>([]);
    const [stats, setStats] = useState<any[]>([]);
    const [isMarking, setIsMarking] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [modalSearch, setModalSearch] = useState('');
    const [sortConfig, setSortConfig] = useState<{key: string, direction: 'asc' | 'desc'} | null>(null);

    useEffect(() => {
        if (user.role === 'admin' || user.role === 'faculty') {
            fetch('/api/admin/students', { headers: { 'Authorization': `Bearer ${token}` } })
                .then(async res => (res.ok ? await safeJson(res) : []) || [])
                .then(setStudents);
        }
        fetch('/api/subjects', { headers: { 'Authorization': `Bearer ${token}` } })
            .then(async res => (res.ok ? await safeJson(res) : []) || [])
            .then(setSubjects);
        
        if (user.role === 'student') {
            fetch('/api/attendance/stats', { headers: { 'Authorization': `Bearer ${token}` } })
                .then(async res => (res.ok ? await safeJson(res) : []) || [])
                .then(setStats);
        }
    }, [token, user.role]);

    const handleMarkAttendance = async (e: React.FormEvent) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget as HTMLFormElement);
        const payload = Object.fromEntries(formData.entries());
        
        const res = await fetch('/api/faculty/attendance', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(payload)
        });
        if (res.ok) {
            alert('Attendance marked successfully');
            setIsMarking(false);
        }
    };

    if (user.role === 'student') {
        const subjectStats = stats.reduce((acc: any, curr: any) => {
            if (!acc[curr.subject]) acc[curr.subject] = [];
            acc[curr.subject].push(curr);
            return acc;
        }, {});

        return (
            <div className="space-y-8">
                <h2 className="text-2xl font-bold text-[#1F2937]">Your Attendance Graphs</h2>
                <div className="grid lg:grid-cols-2 gap-8">
                    {Object.entries(subjectStats).map(([subject, data]: [string, any]) => (
                        <div key={subject} className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-50 h-[400px]">
                            <h3 className="text-lg font-bold mb-6">{subject}</h3>
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={data}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                                    <XAxis dataKey="date" hide />
                                    <YAxis hide />
                                    <Tooltip />
                                    <Area type="monotone" dataKey="status" stroke="#7C3AED" fill="#7C3AED" fillOpacity={0.1} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    const filteredStudents = students.filter(s => 
        !searchTerm || 
        s.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.roll_number?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const sortedStudents = [...filteredStudents].sort((a, b) => {
        if (!sortConfig) return 0;
        const key = sortConfig.key as keyof typeof a;
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

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-4">
                    <button onClick={() => setActiveTab('Dashboard')} className="p-2 bg-white border border-gray-100 rounded-xl hover:bg-gray-50 transition-all shadow-sm">
                        <ArrowLeft className="w-5 h-5 text-[#7C3AED]" />
                    </button>
                    <h2 className="text-2xl font-bold text-[#1F2937]">Attendance Management</h2>
                </div>
                <div className="flex flex-wrap gap-4 w-full md:w-auto">
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
                    <button 
                        onClick={() => {
                            setIsMarking(true);
                            setModalSearch('');
                        }}
                        className="px-6 py-2.5 bg-[#7C3AED] text-white rounded-xl font-bold whitespace-nowrap"
                    >
                        Mark Attendance
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-[40px] shadow-sm border border-gray-50 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 text-[10px] uppercase tracking-widest text-[#9CA3AF] font-bold">
                        <tr>
                            <th className="px-8 py-4 cursor-pointer hover:text-[#7C3AED]" onClick={() => requestSort('name')}>Student</th>
                            <th className="px-8 py-4 cursor-pointer hover:text-[#7C3AED]" onClick={() => requestSort('roll_number')}>Roll No</th>
                            <th className="px-8 py-4 cursor-pointer hover:text-[#7C3AED]" onClick={() => requestSort('department')}>Department</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {sortedStudents.map((s, i) => (
                            <tr key={i} className="hover:bg-gray-50 transition-colors">
                                <td className="px-8 py-5 font-bold text-[#1F2937]">{s.name}</td>
                                <td className="px-8 py-5 text-sm text-[#6B7280]">{s.roll_number}</td>
                                <td className="px-8 py-5 text-sm text-[#6B7280]">{s.department}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {isMarking && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-6">
                    <div className="bg-white w-full max-w-md rounded-[40px] p-10 relative">
                        <button onClick={() => setIsMarking(false)} className="absolute top-8 right-8 text-gray-400 hover:text-gray-600">
                            <X className="w-6 h-6" />
                        </button>
                        <h3 className="text-2xl font-bold mb-6">Mark Attendance</h3>
                        <form className="space-y-4" onSubmit={handleMarkAttendance}>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-400 uppercase">Search & Select Student</label>
                                <div className="relative">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input 
                                        type="text"
                                        placeholder="Type to filter students..."
                                        value={modalSearch}
                                        onChange={(e) => setModalSearch(e.target.value)}
                                        className="w-full pl-10 pr-4 py-3 bg-gray-50 rounded-xl border-none outline-none text-sm"
                                    />
                                </div>
                                <select name="studentId" required className="w-full px-4 py-3 bg-gray-50 rounded-xl border-none outline-none">
                                    <option value="">Select Student ({modalFilteredStudents.length} found)</option>
                                    {modalFilteredStudents.map(s => <option key={s.id} value={s.id}>{s.name} ({s.roll_number})</option>)}
                                </select>
                            </div>
                            <select name="subjectId" required className="w-full px-4 py-3 bg-gray-50 rounded-xl border-none outline-none">
                                <option value="">Select Subject</option>
                                {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                            <input name="date" type="date" required defaultValue={new Date().toISOString().split('T')[0]} className="w-full px-4 py-3 bg-gray-50 rounded-xl border-none outline-none" />
                            <select name="status" required className="w-full px-4 py-3 bg-gray-50 rounded-xl border-none outline-none">
                                <option value="present">Present</option>
                                <option value="absent">Absent</option>
                            </select>
                            <button type="submit" className="w-full py-4 bg-[#7C3AED] text-white rounded-2xl font-bold">Save Attendance</button>
                            <button type="button" onClick={() => setIsMarking(false)} className="w-full py-2 text-gray-500">Cancel</button>
                        </form>
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
    const [modalSearch, setModalSearch] = useState('');
    const [bulkMarks, setBulkMarks] = useState<{[key: number]: number}>({});
    const [sortConfig, setSortConfig] = useState<{key: string, direction: 'asc' | 'desc'} | null>(null);

    useEffect(() => {
        if (user.role === 'admin' || user.role === 'faculty') {
            fetch('/api/admin/students', { headers: { 'Authorization': `Bearer ${token}` } })
                .then(async res => (res.ok ? await safeJson(res) : []) || [])
                .then(setStudents);
            fetch('/api/subjects', { headers: { 'Authorization': `Bearer ${token}` } })
                .then(async res => (res.ok ? await safeJson(res) : []) || [])
                .then(setSubjects);
        }
        if (user.role === 'student') {
            fetch(`/api/results/student/${user.id}`, { headers: { 'Authorization': `Bearer ${token}` } })
                .then(async res => (res.ok ? await safeJson(res) : null))
                .then(setStudentResults);
        }
    }, [token, user.role, user.id]);

    useEffect(() => {
        // Initialize bulkMarks if subjects are loaded
        if (subjects.length > 0 && Object.keys(bulkMarks).length === 0) {
            const initial: any = {};
            subjects.forEach(s => initial[s.id] = 0);
            setBulkMarks(initial);
        }
    }, [subjects]);

    const calculateGPA = () => {
        const marksList = Object.values(bulkMarks) as number[];
        if (marksList.length === 0) return '0.00';
        const total = marksList.reduce((acc: number, m: number) => acc + m, 0);
        // Assuming 100 marks per subject, SGPA calculation simplified: (total / (subjects.length * 100)) * 10
        return ((total / (subjects.length * 100)) * 10).toFixed(2);
    };

    const handleAddResult = async (e: React.FormEvent) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget as HTMLFormElement);
        const studentId = formData.get('studentId');
        const semester = formData.get('semester');
        
        const results = subjects.map(s => {
            const m = bulkMarks[s.id] || 0;
            let g = 'F';
            if (m >= 90) g = 'O';
            else if (m >= 80) g = 'A+';
            else if (m >= 70) g = 'A';
            else if (m >= 60) g = 'B';
            else if (m >= 50) g = 'C';
            else if (m >= 30) g = 'D';
            return { subjectId: s.id, marks: m, grade: g };
        });

        const res = await fetch('/api/results/bulk', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ studentId, semester, results, cgpa: calculateGPA() })
        });
        if (res.ok) {
            alert('Results added and CGPA updated');
            setIsAdding(false);
            window.location.reload();
        }
    };

    const filteredStudents = students.filter(s => 
        !searchTerm || 
        s.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.roll_number?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const sortedStudents = [...filteredStudents].sort((a, b) => {
        if (!sortConfig) return 0;
        const key = sortConfig.key as keyof typeof a;
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
            <div className="space-y-8">
                <div className="bg-[#7C3AED] p-10 rounded-[40px] text-white flex justify-between items-center">
                    <div>
                        <p className="text-purple-200 font-bold uppercase tracking-widest text-xs mb-2">Current CGPA</p>
                        <h2 className="text-5xl font-bold">{studentResults?.cgpa || '0.00'}</h2>
                    </div>
                    <div className="text-right">
                        <p className="text-purple-200 font-bold uppercase tracking-widest text-xs mb-2">Current Semester</p>
                        <h2 className="text-3xl font-bold">Sem {studentResults?.semester}</h2>
                    </div>
                </div>

                <div className="bg-white rounded-[40px] shadow-sm border border-gray-50 overflow-hidden">
                    <div className="p-8 border-b border-gray-50">
                        <h3 className="text-xl font-bold">Semester-wise Results</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 text-[10px] uppercase tracking-widest text-[#9CA3AF] font-bold">
                                <tr>
                                    <th className="px-8 py-4">Semester</th>
                                    <th className="px-8 py-4">Subject</th>
                                    <th className="px-8 py-4">Marks</th>
                                    <th className="px-8 py-4">Grade</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {studentResults?.results.map((r: any, i: number) => (
                                    <tr key={i} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-8 py-5 font-bold text-[#1F2937]">Sem {r.semester}</td>
                                        <td className="px-8 py-5 text-sm text-[#6B7280]">{r.subject_name} ({r.subject_code})</td>
                                        <td className="px-8 py-5 text-sm font-bold">{r.marks}</td>
                                        <td className="px-8 py-5">
                                            <span className="px-3 py-1 bg-purple-100 text-[#7C3AED] rounded-full text-[10px] font-bold uppercase">
                                                {r.grade}
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
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-4">
                    <button onClick={() => setActiveTab('Dashboard')} className="p-2 bg-white border border-gray-100 rounded-xl hover:bg-gray-50 transition-all shadow-sm">
                        <ArrowLeft className="w-5 h-5 text-[#7C3AED]" />
                    </button>
                    <h2 className="text-2xl font-bold text-[#1F2937]">Result Management</h2>
                </div>
                <div className="flex flex-wrap gap-4 w-full md:w-auto">
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
                    <button 
                        onClick={() => {
                            setIsAdding(true);
                            setModalSearch('');
                        }}
                        className="px-6 py-2.5 bg-[#7C3AED] text-white rounded-xl font-bold whitespace-nowrap"
                    >
                        Add Result
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-[40px] shadow-sm border border-gray-50 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 text-[10px] uppercase tracking-widest text-[#9CA3AF] font-bold">
                        <tr>
                            <th className="px-8 py-4 cursor-pointer hover:text-[#7C3AED]" onClick={() => requestSort('name')}>Student</th>
                            <th className="px-8 py-4 cursor-pointer hover:text-[#7C3AED]" onClick={() => requestSort('roll_number')}>Roll No</th>
                            <th className="px-8 py-4 cursor-pointer hover:text-[#7C3AED]" onClick={() => requestSort('cgpa')}>CGPA</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {sortedStudents.map((s, i) => (
                            <tr key={i} className="hover:bg-gray-50 transition-colors">
                                <td className="px-8 py-5 font-bold text-[#1F2937]">{s.name}</td>
                                <td className="px-8 py-5 text-sm text-[#6B7280]">{s.roll_number}</td>
                                <td className="px-8 py-5 font-bold text-[#7C3AED]">{s.cgpa}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {isAdding && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-6 overflow-y-auto">
                    <div className="bg-white w-full max-w-2xl rounded-[40px] p-10 relative my-8">
                        <button onClick={() => setIsAdding(false)} className="absolute top-8 right-8 text-gray-400 hover:text-gray-600">
                            <X className="w-6 h-6" />
                        </button>
                        <h3 className="text-2xl font-bold mb-6">Add Results & Calculate GPA</h3>
                        <form className="space-y-6" onSubmit={handleAddResult}>
                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-400 uppercase">1. Select Student</label>
                                    <div className="relative">
                                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        <input 
                                            type="text"
                                            placeholder="Search student..."
                                            value={modalSearch}
                                            onChange={(e) => setModalSearch(e.target.value)}
                                            className="w-full pl-10 pr-4 py-3 bg-gray-50 rounded-xl border-none outline-none text-sm"
                                        />
                                    </div>
                                    <select name="studentId" required className="w-full px-4 py-3 bg-gray-50 rounded-xl border-none outline-none">
                                        <option value="">Choose Student...</option>
                                        {modalFilteredStudents.map(s => <option key={s.id} value={s.id}>{s.name} ({s.roll_number})</option>)}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-400 uppercase">2. Semester</label>
                                    <input name="semester" type="number" placeholder="Enter Semester" required className="w-full px-4 py-3 bg-gray-50 rounded-xl border-none outline-none" />
                                </div>
                            </div>

                            <div className="space-y-4">
                                <label className="text-xs font-bold text-gray-400 uppercase">3. Subject Marks (Max 100 each)</label>
                                <div className="grid md:grid-cols-2 gap-4">
                                    {subjects.map(s => (
                                        <div key={s.id} className="p-4 bg-gray-50 rounded-2xl flex items-center justify-between gap-4">
                                            <span className="text-sm font-bold text-[#1F2937] truncate">{s.name}</span>
                                            <input 
                                                type="number" 
                                                max="100"
                                                placeholder="Marks"
                                                className="w-20 px-3 py-2 bg-white rounded-lg outline-none text-sm font-bold"
                                                value={bulkMarks[s.id] || 0}
                                                onChange={(e) => setBulkMarks({...bulkMarks, [s.id]: parseInt(e.target.value) || 0})}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="p-6 bg-[#7C3AED] rounded-[32px] text-white flex justify-between items-center shadow-lg shadow-purple-100">
                                <div>
                                    <p className="text-purple-100 text-[10px] font-bold uppercase tracking-widest">Calculated GPA</p>
                                    <p className="text-3xl font-black">{calculateGPA()}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-purple-100 text-[10px] font-bold uppercase tracking-widest">Total Subjects</p>
                                    <p className="text-xl font-bold">{subjects.length}</p>
                                </div>
                            </div>

                            <button type="submit" className="w-full py-4 bg-[#1F2937] text-white rounded-2xl font-bold shadow-xl">Save All Results & Update CGPA</button>
                        </form>
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

    useEffect(() => {
        fetch('/api/alumni', { headers: { 'Authorization': `Bearer ${token}` } })
            .then(async res => (res.ok ? await safeJson(res) : []) || [])
            .then(setAlumni);
    }, [token]);

    const filtered = alumni.filter(a => 
        a.name.toLowerCase().includes(search.toLowerCase()) ||
        a.batch_year.toString().includes(search)
    );

    const handleAddAlumni = async (e: React.FormEvent) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget as HTMLFormElement);
        const payload = Object.fromEntries(formData.entries());
        
        const res = await fetch('/api/alumni', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(payload)
        });
        if (res.ok) {
            setIsAddOpen(false);
            window.location.reload();
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
                            onClick={() => setIsAddOpen(true)} 
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
                            <img src={a.image_url || `https://picsum.photos/seed/${a.id}/400/300`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
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
                                        <button onClick={() => setEditingAlumni(a)} className="text-xs font-bold text-[#7C3AED]">Edit</button>
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
                    <div className="bg-white w-full max-w-md rounded-[40px] p-10 relative my-8">
                        <h3 className="text-2xl font-bold mb-6">Add Alumni Record</h3>
                        <form className="space-y-4" onSubmit={handleAddAlumni}>
                            <input name="name" placeholder="Full Name" required className="w-full px-4 py-3 bg-gray-50 rounded-xl border-none outline-none" />
                            <input name="batchYear" placeholder="Batch Year (e.g. 2020)" type="number" required className="w-full px-4 py-3 bg-gray-50 rounded-xl border-none outline-none" />
                            <input name="contactDetails" placeholder="Contact (Email/Phone)" required className="w-full px-4 py-3 bg-gray-50 rounded-xl border-none outline-none" />
                            <input name="careerInfo" placeholder="Current Career/Company" required className="w-full px-4 py-3 bg-gray-50 rounded-xl border-none outline-none" />
                            <textarea name="achievements" placeholder="Achievements" className="w-full h-24 px-4 py-3 bg-gray-50 rounded-xl border-none outline-none resize-none" />
                            <input name="imageUrl" placeholder="Image URL" className="w-full px-4 py-3 bg-gray-50 rounded-xl border-none outline-none" />
                            <input name="documentUrl" placeholder="Document/Proof Link" className="w-full px-4 py-3 bg-gray-50 rounded-xl border-none outline-none" />
                            <button type="submit" className="w-full py-4 bg-[#7C3AED] text-white rounded-2xl font-bold">Add Alumni</button>
                            <button type="button" onClick={() => setIsAddOpen(false)} className="w-full py-2 text-gray-500">Cancel</button>
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

function BookScannerView({ token }: { token: string }) {
    const [scanning, setScanning] = useState(false);
    const [book, setBook] = useState<any>(null);
    const [error, setError] = useState('');
    const [isbnInput, setIsbnInput] = useState('');

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

    const handleManualLookup = async (manualIsbn?: string) => {
        const id = manualIsbn || isbnInput;
        if (!id) return;
        setScanning(false);
        try {
            const res = await fetch(`/api/books/isbn/${id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setBook(data);
                setError('');
            } else {
                setError('Book not found for this ISBN/QR');
            }
        } catch (err) {
            setError('Failed to fetch book details');
        }
    };

    const onScanSuccess = (decodedText: string) => handleManualLookup(decodedText);

    const onScanError = (err: any) => {
        // console.warn(err);
    };

    return (
        <div className="max-w-2xl mx-auto space-y-8">
            <div className="bg-white p-10 rounded-[40px] shadow-sm border border-gray-50 text-center">
                <div className="w-20 h-20 bg-purple-50 rounded-full flex items-center justify-center mx-auto mb-6">
                    <QrCode className="w-10 h-10 text-[#7C3AED]" />
                </div>
                <h2 className="text-2xl font-bold text-[#1F2937] mb-2">Book Search & Scanner</h2>
                <p className="text-[#6B7280] mb-8 text-sm px-10">Scan barcode, upload from explorer, or enter ISBN manually.</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                    {!scanning ? (
                        <button 
                            onClick={() => setScanning(true)}
                            className="p-6 bg-[#7C3AED] text-white rounded-3xl font-bold flex flex-col items-center gap-3 hover:bg-[#6D28D9] transition-all"
                        >
                            <Camera className="w-8 h-8" />
                            <span>Use Camera</span>
                        </button>
                    ) : (
                        <div className="col-span-1 md:col-span-2">
                            <div id="reader" className="overflow-hidden rounded-3xl border-2 border-dashed border-purple-100"></div>
                            <button onClick={() => setScanning(false)} className="mt-4 text-red-500 font-bold">Stop Camera</button>
                        </div>
                    )}
                    
                    <label className="p-6 bg-gray-50 text-[#1F2937] rounded-3xl font-bold flex flex-col items-center gap-3 hover:bg-gray-100 cursor-pointer transition-all border border-gray-100">
                        <FileUp className="w-8 h-8 text-[#7C3AED]" />
                        <span>File Explorer</span>
                        <input type="file" className="hidden" onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) alert("Scanning file for barcodes... Simulated ISBN extraction.");
                        }} />
                    </label>
                </div>

                <div className="flex gap-2">
                    <input 
                        type="text" 
                        placeholder="Or enter ISBN manually..." 
                        value={isbnInput}
                        onChange={(e) => setIsbnInput(e.target.value)}
                        className="flex-1 px-6 py-4 bg-gray-50 rounded-2xl border-none outline-none text-sm font-medium"
                    />
                    <button 
                        onClick={() => handleManualLookup()}
                        className="px-8 py-4 bg-[#1F2937] text-white rounded-2xl font-bold"
                    >
                        Lookup
                    </button>
                </div>
            </div>

            {error && (
                <div className="p-6 bg-red-50 rounded-3xl border border-red-100 flex items-center gap-4 text-red-600">
                    <AlertCircle className="w-6 h-6" />
                    <p className="font-bold">{error}</p>
                </div>
            )}

            {book && (
                <div className="bg-[#1F2937] p-10 rounded-[40px] text-white relative overflow-hidden">
                    <div className="relative z-10">
                        <div className="px-3 py-1 bg-green-500/20 text-green-400 text-[10px] font-bold rounded-full w-fit mb-4 border border-green-500/30 uppercase tracking-widest">
                            Found ISBN: {book.isbn}
                        </div>
                        <h3 className="text-2xl font-bold mb-1">{book.title}</h3>
                        <p className="text-gray-400 font-medium mb-6">by {book.author}</p>
                        
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">Category</p>
                                <p className="font-bold">{book.category}</p>
                            </div>
                            <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">Status</p>
                                <p className="font-bold capitalize">{book.status}</p>
                            </div>
                        </div>
                        
                        <div className="mt-8 flex gap-4">
                            <button className="flex-1 py-4 bg-[#7C3AED] text-white rounded-2xl font-bold">Issue Book</button>
                            <button onClick={() => setBook(null)} className="px-6 py-4 bg-white/10 text-white rounded-2xl font-bold">Clear</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
