import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { 
    LayoutDashboard, BookOpen, Calendar, Search, CreditCard, 
    Bell, LogOut, User, GraduationCap, Clock, AlertCircle,
    ChevronRight, BookMarked, ShieldCheck, Users
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

export default function Dashboard() {
    const { user, logout, token } = useAuth();
    const navigate = useNavigate();
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('Dashboard');

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
            if (!res.ok) {
                const errorData = await res.json().catch(() => ({ message: 'Request failed' }));
                throw new Error(errorData.message || 'Request failed');
            }
            return res.json();
        })
        .then(setData)
        .catch(err => console.error("Dashboard fetch error:", err))
        .finally(() => setLoading(false));
    }, [token, navigate, user?.role]);

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
            case 'Library':
                return <LibraryView token={token!} user={user!} />;
            default:
                return <StudentDashboard data={data} user={user} />;
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
                    <SidebarLink icon={<BookMarked />} label="Study Materials" active={activeTab === 'Study Materials'} onClick={() => setActiveTab('Study Materials')} />
                    <SidebarLink icon={<Calendar />} label="Events" active={activeTab === 'Events'} onClick={() => setActiveTab('Events')} />
                    <SidebarLink icon={<Search />} label="Lost & Found" active={activeTab === 'Lost & Found'} onClick={() => setActiveTab('Lost & Found')} />
                    <SidebarLink icon={<BookOpen />} label="Library" active={activeTab === 'Library'} onClick={() => setActiveTab('Library')} />
                    {(user?.role === 'student' || user?.role === 'admin') && (
                        <SidebarLink icon={<CreditCard />} label="Fees" active={activeTab === 'Fees'} onClick={() => setActiveTab('Fees')} />
                    )}
                    {user?.role === 'admin' && (
                        <SidebarLink icon={<ShieldCheck />} label="Admin Panel" active={activeTab === 'Admin Panel'} onClick={() => setActiveTab('Admin Panel')} />
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
                <header className="flex justify-between items-center mb-10">
                    <div>
                        <h1 className="text-3xl font-bold text-[#1F2937]">Welcome, {user?.name}</h1>
                        <p className="text-[#6B7280] mt-1">Role: <span className="capitalize font-semibold text-[#7C3AED]">{user?.role}</span></p>
                    </div>
                    <div className="flex items-center gap-4">
                        <button className="w-12 h-12 bg-white border border-gray-100 rounded-2xl flex items-center justify-center relative shadow-sm hover:bg-gray-50 transition-all">
                            <Bell className="w-6 h-6 text-[#4B5563]" />
                            <span className="absolute top-3 right-3 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white" />
                        </button>
                        <div className="w-12 h-12 bg-purple-100 rounded-2xl flex items-center justify-center border border-purple-200">
                            <User className="text-[#7C3AED] w-6 h-6" />
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
        <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
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
        </>
    );
}

function AttendanceModal({ token }: { token: string }) {
    const [isOpen, setIsOpen] = useState(false);
    const [status, setStatus] = useState<'present' | 'absent'>('present');
    const [studentId, setStudentId] = useState('');
    const [subjectId, setSubjectId] = useState('1');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await fetch('/api/faculty/attendance', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}` 
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
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-6">
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
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Student ID (1-200)</label>
                                <input 
                                    type="number" 
                                    required 
                                    value={studentId}
                                    onChange={(e) => setStudentId(e.target.value)}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-purple-500"
                                    placeholder="Enter Student ID"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Subject</label>
                                <select 
                                    value={subjectId}
                                    onChange={(e) => setSubjectId(e.target.value)}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none"
                                >
                                    <option value="1">DBMS (CS401)</option>
                                    <option value="2">OS (CS402)</option>
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
            .then(res => res.ok ? res.json() : []).then(setMaterials);
    }, [token]);

    const filtered = materials.filter(m => 
        (!filter.semester || m.semester.toString() === filter.semester) &&
        (!filter.type || m.type === filter.type)
    );

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget as HTMLFormElement);
        const payload = Object.fromEntries(formData.entries());
        const res = await fetch('/api/materials', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(payload)
        });
        if (res.ok) {
            setIsUploadOpen(false);
            fetch('/api/materials', { headers: { 'Authorization': `Bearer ${token}` } })
                .then(res => res.ok ? res.json() : []).then(setMaterials);
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
                        <h3 className="text-2xl font-bold mb-6">Upload Material</h3>
                        <form className="space-y-4" onSubmit={handleUpload}>
                            <input name="title" placeholder="Title" required className="w-full px-4 py-3 bg-gray-50 rounded-xl border-none outline-none" />
                            <select name="type" required className="w-full px-4 py-3 bg-gray-50 rounded-xl border-none outline-none">
                                {categories.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                            </select>
                            <input name="subjectId" placeholder="Subject ID" required type="number" className="w-full px-4 py-3 bg-gray-50 rounded-xl border-none outline-none" />
                            <input name="semester" placeholder="Semester" required type="number" className="w-full px-4 py-3 bg-gray-50 rounded-xl border-none outline-none" />
                            <input name="url" placeholder="File URL" required className="w-full px-4 py-3 bg-gray-50 rounded-xl border-none outline-none" />
                            <button type="submit" className="w-full py-4 bg-[#7C3AED] text-white rounded-2xl font-bold">Upload</button>
                            <button type="button" onClick={() => setIsUploadOpen(false)} className="w-full py-2 text-gray-500">Cancel</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

function EventsView({ token, user }: { token: string, user: any }) {
    const [events, setEvents] = useState<any[]>([]);
    const [isAddOpen, setIsAddOpen] = useState(false);

    useEffect(() => {
        fetch('/api/events', { headers: { 'Authorization': `Bearer ${token}` } })
            .then(res => res.ok ? res.json() : []).then(setEvents);
    }, [token]);

    const handleAddEvent = async (e: React.FormEvent) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget as HTMLFormElement);
        const payload = Object.fromEntries(formData.entries());
        const res = await fetch('/api/events', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(payload)
        });
        if (res.ok) {
            setIsAddOpen(false);
            fetch('/api/events', { headers: { 'Authorization': `Bearer ${token}` } })
                .then(res => res.ok ? res.json() : []).then(setEvents);
        }
    };

    return (
        <div className="space-y-8">
            {(user.role === 'admin' || user.role === 'faculty') && (
                <div className="flex justify-end">
                    <motion.button 
                        whileHover={{ scale: 1.05, boxShadow: "0 0 20px rgba(255,255,255,0.5)" }}
                        onClick={() => setIsAddOpen(true)} 
                        className="px-6 py-2.5 bg-[#7C3AED] text-white rounded-xl font-bold"
                    >
                        Add Event
                    </motion.button>
                </div>
            )}
            <div className="grid md:grid-cols-2 gap-8">
                {events.map((e, i) => (
                    <div key={i} className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-50 flex gap-6">
                        <div className="w-24 h-24 bg-purple-50 rounded-3xl flex flex-col items-center justify-center flex-shrink-0">
                            <span className="text-2xl font-bold text-[#7C3AED]">{new Date(e.date).getDate()}</span>
                            <span className="text-xs font-bold text-[#7C3AED] uppercase">{new Date(e.date).toLocaleString('default', { month: 'short' })}</span>
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-[#1F2937] mb-2">{e.title}</h3>
                            <p className="text-sm text-[#6B7280] mb-4 line-clamp-2">{e.description}</p>
                            <div className="flex items-center gap-4">
                                <span className="text-xs font-bold px-3 py-1 bg-purple-100 text-[#7C3AED] rounded-full uppercase">{e.category}</span>
                                <button className="text-sm font-bold text-[#7C3AED] hover:underline">Register Now</button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            {isAddOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-6">
                    <div className="bg-white w-full max-w-md rounded-[40px] p-10 relative">
                        <h3 className="text-2xl font-bold mb-6">Add Event</h3>
                        <form className="space-y-4" onSubmit={handleAddEvent}>
                            <input name="title" placeholder="Title" required className="w-full px-4 py-3 bg-gray-50 rounded-xl border-none outline-none" />
                            <textarea name="description" placeholder="Description" className="w-full px-4 py-3 bg-gray-50 rounded-xl border-none outline-none" />
                            <input name="date" type="datetime-local" required className="w-full px-4 py-3 bg-gray-50 rounded-xl border-none outline-none" />
                            <input name="venue" placeholder="Venue" required className="w-full px-4 py-3 bg-gray-50 rounded-xl border-none outline-none" />
                            <select name="category" required className="w-full px-4 py-3 bg-gray-50 rounded-xl border-none outline-none">
                                <option value="club">Club</option>
                                <option value="hackathon">Hackathon</option>
                                <option value="cultural">Cultural</option>
                                <option value="workshop">Workshop</option>
                            </select>
                            <button type="submit" className="w-full py-4 bg-[#7C3AED] text-white rounded-2xl font-bold">Add Event</button>
                            <button type="button" onClick={() => setIsAddOpen(false)} className="w-full py-2 text-gray-500">Cancel</button>
                        </form>
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
            .then(res => res.ok ? res.json() : []).then(setItems);
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
                            <input name="imageUrl" placeholder="Image URL (optional)" className="w-full px-4 py-3 bg-gray-50 rounded-xl border-none outline-none" />
                            <input name="driveUrl" placeholder="Google Drive Link (optional)" className="w-full px-4 py-3 bg-gray-50 rounded-xl border-none outline-none" />
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
                        <p className="text-sm text-gray-500 mb-6">Please provide proof of ownership (e.g., ID number, unique marks).</p>
                        <textarea 
                            className="w-full px-4 py-3 bg-gray-50 rounded-xl border-none outline-none mb-6"
                            placeholder="Enter proof here..."
                            value={claimProof.proof}
                            onChange={(e) => setClaimProof({...claimProof, proof: e.target.value})}
                        />
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

function LibraryView({ token, user }: { token: string, user: any }) {
    const [books, setBooks] = useState<any[]>([]);
    const [status, setStatus] = useState<string>('open');
    const [search, setSearch] = useState('');
    const [editingBook, setEditingBook] = useState<any>(null);
    const [isAddOpen, setIsAddOpen] = useState(false);

    useEffect(() => {
        fetch('/api/library/books', { headers: { 'Authorization': `Bearer ${token}` } })
            .then(res => res.ok ? res.json() : []).then(setBooks);
        fetch('/api/library/status').then(res => res.ok ? res.json() : { status: 'open' }).then(data => setStatus(data.status));
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
                .then(res => res.ok ? res.json() : []).then(setBooks);
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
                        <button onClick={() => setIsAddOpen(true)} className="px-4 py-2 bg-[#7C3AED] text-white rounded-xl text-xs font-bold">Add Book</button>
                        <button onClick={() => updateStatus('open')} className="px-4 py-2 bg-green-100 text-green-600 rounded-xl text-xs font-bold">Open</button>
                        <button onClick={() => updateStatus('closed')} className="px-4 py-2 bg-red-100 text-red-600 rounded-xl text-xs font-bold">Close</button>
                    </div>
                )}
            </div>

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
    const { user } = useAuth();

    useEffect(() => {
        const endpoint = user?.role === 'admin' ? '/api/admin/fees' : '/api/student/fees';
        fetch(endpoint, { headers: { 'Authorization': `Bearer ${token}` } })
            .then(res => res.json())
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

    if (loading) return <div className="p-8 text-center">Loading fees...</div>;

    return (
        <div className="space-y-8">
            <div className="bg-white p-10 rounded-[40px] shadow-sm border border-gray-50">
                <h2 className="text-2xl font-bold text-[#1F2937] mb-8">
                    {user?.role === 'admin' ? 'All Student Fees' : 'My Fee Structure - 2026'}
                </h2>
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
                            {fees.map((f, i) => (
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
            .then(res => res.ok ? res.json() : []).then(setBooks);
        fetch('/api/library/status').then(res => res.ok ? res.json() : { status: 'open' }).then(data => setStats(prev => ({ ...prev, status: data.status })));
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
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [isNotifOpen, setIsNotifOpen] = useState(false);
    const [editingStudent, setEditingStudent] = useState<any>(null);
    const [addingFee, setAddingFee] = useState<any>(null);

    useEffect(() => {
        fetch('/api/admin/students', { headers: { 'Authorization': `Bearer ${token}` } })
            .then(res => res.ok ? res.json() : []).then(setStudents);
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

    return (
        <div className="space-y-8">
            <div className="bg-white rounded-[40px] shadow-sm border border-gray-50 overflow-hidden">
                <div className="p-8 border-b border-gray-50 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-[#1F2937]">Student Directory ({students.length})</h2>
                    <div className="flex gap-4">
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
                            {students.map((s, i) => (
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
        <button className="bg-white p-6 rounded-[32px] shadow-sm border border-gray-50 hover:shadow-md transition-all group flex flex-col items-center gap-3">
            <div className={`w-12 h-12 ${color} text-white rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                {icon}
            </div>
            <span className="text-sm font-bold text-[#1F2937]">{label}</span>
        </button>
    );
}
