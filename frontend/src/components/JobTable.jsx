import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { 
  IoFunnelOutline, 
  IoSearchOutline, 
  IoSettingsOutline, 
  IoTrashOutline, 
  IoAddOutline, 
  IoOpenOutline 
} from 'react-icons/io5';

const JobTable = () => {
  const { user } = useAuth();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modals & Action States
  const [showAddModal, setShowAddModal] = useState(false);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // New Application Form State
  const [newApp, setNewApp] = useState({
    company: '',
    title: '',
    category: '',
    opportunity: '',
    location: '',
    mode: 'remote',
    status: 'applied',
    inTouchPerson: '',
    link: '',
    requirements: '',
    salary: ''
  });

  const fetchApps = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await api.getApplications();
      setApplications(data.applications || []);
      setError('');
    } catch (err) {
      console.error(err);
      if (err.message && err.message.toLowerCase().includes('no applications found')) {
        setApplications([]);
      } else {
        setError('Failed to fetch tracked jobs');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApps();
  }, [user]);

  const handleStatusChange = async (id, newStatus) => {
    try {
      await api.modifyApplication(id, { status: newStatus });
      setApplications(prev => 
        prev.map(app => app._id === id ? { ...app, status: newStatus } : app)
      );
    } catch (err) {
      alert('Failed to update status');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this tracked application?')) return;
    try {
      await api.deleteApplication(id);
      setApplications(prev => prev.filter(app => app._id !== id));
    } catch (err) {
      alert('Failed to delete application');
    }
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!newApp.company || !newApp.title) {
      alert('Company and Role are required fields');
      return;
    }

    try {
      const payload = {
        ...newApp,
        salary: newApp.salary ? Number(newApp.salary) : 0,
        requirements: newApp.requirements || 'No details provided'
      };
      const response = await api.createApplication(payload);
      
      // Update applications state locally
      setApplications(prev => [response.application, ...prev]);
      setShowAddModal(false);
      // Reset form
      setNewApp({
        company: '',
        title: '',
        category: '',
        opportunity: '',
        location: '',
        mode: 'remote',
        status: 'applied',
        inTouchPerson: '',
        link: '',
        requirements: '',
        salary: ''
      });
    } catch (err) {
      alert(err.message || 'Failed to track new job');
    }
  };

  // Filter & Search Logic
  const filteredApps = applications.filter(app => {
    const companyName = app.company || "";
    const jobTitle = app.title || "";
    const categoryName = app.category || "";

    const matchesSearch = 
      companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      jobTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      categoryName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || app.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'applied':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'interviewed':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'offered':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'rejected':
        return 'bg-rose-100 text-rose-800 border-rose-300';
      default:
        return 'bg-neutral-100 text-neutral-800 border-neutral-300';
    }
  };

  if (!user) {
    return (
      <div className='flex flex-col items-center justify-center p-8 bg-lime-400/5 rounded-2xl border border-lime-400/20 max-w-5xl mx-auto w-full text-center'>
        <p className='text-neutral-500 font-medium text-lg'>Please log in to track and manage your job applications.</p>
      </div>
    );
  }

  return (
    <div className='max-w-5xl w-full mx-auto px-4 py-8 select-none'>
      
      {/* Table Container */}
      <div className='bg-[#e4ffd4] rounded-2xl border-2 border-neutral-900 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] overflow-hidden flex flex-col'>
        
        {/* Table Header / Toolbar */}
        <div className='flex justify-between items-center bg-lime-300/40 px-4 py-3 border-b-2 border-neutral-900 flex-wrap gap-4'>
          <div className='text-neutral-900 font-bold text-lg flex items-center gap-2'>
            Jobs Spreadsheet
          </div>
          
          <div className='flex items-center gap-3 ml-auto flex-wrap'>
            {/* Search Input */}
            <div className='relative flex items-center'>
              <input
                type="text"
                placeholder="Search jobs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className='bg-white border-2 border-neutral-900 text-neutral-900 text-xs md:text-sm rounded-lg pl-8 pr-3 py-1 outline-none w-40 md:w-56 focus:w-48 md:focus:w-64 transition-all'
              />
              <IoSearchOutline className='absolute left-2.5 text-neutral-500' size={16} />
            </div>

            {/* Filter Toggle */}
            <div className='relative'>
              <button 
                onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                className='bg-white border-2 border-neutral-900 p-1.5 rounded-lg text-neutral-800 hover:bg-neutral-50 active:translate-y-[1px] cursor-pointer'
                title="Filter by status"
              >
                <IoFunnelOutline size={16} />
              </button>
              {showFilterDropdown && (
                <div className='absolute right-0 mt-2 w-40 bg-white border-2 border-black rounded-lg shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] z-30 py-1'>
                  {['all', 'applied', 'interviewed', 'offered', 'rejected'].map((st) => (
                    <button
                      key={st}
                      onClick={() => { setStatusFilter(st); setShowFilterDropdown(false); }}
                      className={`w-full text-left px-3 py-1.5 text-xs hover:bg-lime-100 transition-colors uppercase font-bold text-neutral-800 ${statusFilter === st ? 'bg-lime-200' : ''}`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Settings Trigger */}
            <button 
              className='bg-white border-2 border-neutral-900 p-1.5 rounded-lg text-neutral-800 hover:bg-neutral-50 active:translate-y-[1px] cursor-pointer'
              title="Table settings"
            >
              <IoSettingsOutline size={16} />
            </button>

            {/* Green New Button */}
            <button 
              onClick={() => setShowAddModal(true)}
              className='bg-[#a3e635] text-neutral-950 font-bold text-xs md:text-sm px-4 py-1.5 border-2 border-neutral-900 rounded-lg hover:bg-lime-400 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all cursor-pointer'
            >
              New
            </button>
          </div>
        </div>

        {/* The Spreadsheet Body */}
        <div className='overflow-x-auto w-full'>
          <table className='w-full text-left border-collapse min-w-[1000px] text-xs md:text-sm'>
            <thead>
              <tr className='bg-lime-400/20 text-neutral-950 font-bold border-b border-neutral-900 uppercase tracking-wider text-xxs md:text-xs'>
                <th className='px-4 py-3 border-r border-neutral-900'>Company</th>
                <th className='px-4 py-3 border-r border-neutral-900'>Role</th>
                <th className='px-4 py-3 border-r border-neutral-900'>Category</th>
                <th className='px-4 py-3 border-r border-neutral-900'>Opportunity</th>
                <th className='px-4 py-3 border-r border-neutral-900'>Location</th>
                <th className='px-4 py-3 border-r border-neutral-900'>Type</th>
                <th className='px-4 py-3 border-r border-neutral-900'>Status</th>
                <th className='px-4 py-3 border-r border-neutral-900'>Date</th>
                <th className='px-4 py-3 border-r border-neutral-900'>In touch Person</th>
                <th className='px-4 py-3 border-r border-neutral-900'>Link</th>
                <th className='px-4 py-3 text-center'>Actions</th>
              </tr>
            </thead>
            <tbody className='divide-y divide-neutral-900 bg-[#e4ffd4]/20'>
              {loading ? (
                <tr>
                  <td colSpan="11" className='px-4 py-12 text-center text-neutral-500 font-medium'>
                    Loading application data...
                  </td>
                </tr>
              ) : filteredApps.length === 0 ? (
                <tr>
                  <td colSpan="11" className='px-4 py-12 text-center text-neutral-500 font-medium'>
                    No job applications tracked yet. Click "New" or try "Auto Apply" in Explore!
                  </td>
                </tr>
              ) : (
                filteredApps.map((app) => (
                  <tr key={app._id} className='hover:bg-lime-400/5 transition-colors text-neutral-800 font-medium border-b border-neutral-900/60'>
                    <td className='px-4 py-3 border-r border-neutral-900 font-bold text-neutral-900'>{app.company}</td>
                    <td className='px-4 py-3 border-r border-neutral-900'>{app.title}</td>
                    <td className='px-4 py-3 border-r border-neutral-900 text-neutral-600'>{app.category || '-'}</td>
                    <td className='px-4 py-3 border-r border-neutral-900 text-neutral-600 capitalize'>{app.opportunity || '-'}</td>
                    <td className='px-4 py-3 border-r border-neutral-900 text-neutral-600'>{app.location || '-'}</td>
                    <td className='px-4 py-3 border-r border-neutral-900 capitalize text-neutral-600'>{app.mode}</td>
                    <td className='px-3 py-2 border-r border-neutral-900'>
                      <select
                        value={app.status}
                        onChange={(e) => handleStatusChange(app._id, e.target.value)}
                        className={`px-2 py-1 rounded-md border font-bold uppercase text-[10px] md:text-xs outline-none cursor-pointer ${getStatusColor(app.status)}`}
                      >
                        <option value="applied">Applied</option>
                        <option value="interviewed">Interviewed</option>
                        <option value="offered">Offered</option>
                        <option value="rejected">Rejected</option>
                      </select>
                    </td>
                    <td className='px-4 py-3 border-r border-neutral-900 text-neutral-600 text-[10px] md:text-xs'>
                      {new Date(app.createdAt).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </td>
                    <td className='px-4 py-3 border-r border-neutral-900 text-neutral-600'>{app.inTouchPerson || '-'}</td>
                    <td className='px-4 py-3 border-r border-neutral-900'>
                      {app.link ? (
                        <a 
                          href={app.link.startsWith('http') ? app.link : `https://${app.link}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className='text-lime-700 hover:text-lime-900 flex items-center gap-1 font-semibold underline'
                        >
                          Visit <IoOpenOutline size={12} />
                        </a>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className='px-4 py-3 text-center'>
                      <button
                        onClick={() => handleDelete(app._id)}
                        className='text-neutral-500 hover:text-red-600 p-1 border border-transparent hover:border-red-200 hover:bg-red-50 rounded-md transition-all cursor-pointer'
                        title="Delete application"
                      >
                        <IoTrashOutline size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Add Job Footer Quick Link */}
        <div className='p-3 border-t-2 border-neutral-900 bg-lime-300/10 flex justify-start'>
          <button 
            onClick={() => setShowAddModal(true)}
            className='text-neutral-950 font-bold hover:text-lime-700 flex items-center gap-2 cursor-pointer text-xs md:text-sm pl-2 py-1'
          >
            <IoAddOutline size={18} className='border-2 border-neutral-900 rounded bg-[#a3e635] p-0.5' />
            Add new job
          </button>
        </div>

      </div>

      {/* Manual Application Creator Modal */}
      {showAddModal && (
        <div className='fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4'>
          <div className='bg-white w-full max-w-2xl rounded-2xl border-2 border-black p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] max-h-[90vh] overflow-y-auto animate-in fade-in duration-200'>
            
            <h3 className='text-xl font-extrabold text-neutral-900 mb-6 border-b-2 border-neutral-100 pb-3 uppercase'>
              Track a New Application
            </h3>

            <form onSubmit={handleAddSubmit} className='flex flex-col gap-4'>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <div className='flex flex-col gap-1.5'>
                  <label className='text-xs font-bold text-neutral-700 uppercase'>Company *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Google"
                    value={newApp.company}
                    onChange={(e) => setNewApp({...newApp, company: e.target.value})}
                    className='border border-neutral-300 focus:border-black rounded-lg px-3 py-2 text-sm outline-none'
                  />
                </div>
                <div className='flex flex-col gap-1.5'>
                  <label className='text-xs font-bold text-neutral-700 uppercase'>Role / Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Software Engineer"
                    value={newApp.title}
                    onChange={(e) => setNewApp({...newApp, title: e.target.value})}
                    className='border border-neutral-300 focus:border-black rounded-lg px-3 py-2 text-sm outline-none'
                  />
                </div>
                <div className='flex flex-col gap-1.5'>
                  <label className='text-xs font-bold text-neutral-700 uppercase'>Category</label>
                  <input
                    type="text"
                    placeholder="e.g. Frontend Engineering"
                    value={newApp.category}
                    onChange={(e) => setNewApp({...newApp, category: e.target.value})}
                    className='border border-neutral-300 focus:border-black rounded-lg px-3 py-2 text-sm outline-none'
                  />
                </div>
                <div className='flex flex-col gap-1.5'>
                  <label className='text-xs font-bold text-neutral-700 uppercase'>Opportunity (Source)</label>
                  <input
                    type="text"
                    placeholder="e.g. LinkedIn Referral"
                    value={newApp.opportunity}
                    onChange={(e) => setNewApp({...newApp, opportunity: e.target.value})}
                    className='border border-neutral-300 focus:border-black rounded-lg px-3 py-2 text-sm outline-none'
                  />
                </div>
                <div className='flex flex-col gap-1.5'>
                  <label className='text-xs font-bold text-neutral-700 uppercase'>Location</label>
                  <input
                    type="text"
                    placeholder="e.g. Mountain View, CA"
                    value={newApp.location}
                    onChange={(e) => setNewApp({...newApp, location: e.target.value})}
                    className='border border-neutral-300 focus:border-black rounded-lg px-3 py-2 text-sm outline-none'
                  />
                </div>
                <div className='flex flex-col gap-1.5'>
                  <label className='text-xs font-bold text-neutral-700 uppercase'>Mode</label>
                  <select
                    value={newApp.mode}
                    onChange={(e) => setNewApp({...newApp, mode: e.target.value})}
                    className='border border-neutral-300 focus:border-black rounded-lg px-3 py-2 text-sm outline-none bg-white'
                  >
                    <option value="remote">Remote</option>
                    <option value="on-site">On-Site</option>
                    <option value="hybrid">Hybrid</option>
                  </select>
                </div>
                <div className='flex flex-col gap-1.5'>
                  <label className='text-xs font-bold text-neutral-700 uppercase'>Status</label>
                  <select
                    value={newApp.status}
                    onChange={(e) => setNewApp({...newApp, status: e.target.value})}
                    className='border border-neutral-300 focus:border-black rounded-lg px-3 py-2 text-sm outline-none bg-white'
                  >
                    <option value="applied">Applied</option>
                    <option value="interviewed">Interviewed</option>
                    <option value="offered">Offered</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
                <div className='flex flex-col gap-1.5'>
                  <label className='text-xs font-bold text-neutral-700 uppercase'>In touch Person</label>
                  <input
                    type="text"
                    placeholder="e.g. Sarah Smith (HR)"
                    value={newApp.inTouchPerson}
                    onChange={(e) => setNewApp({...newApp, inTouchPerson: e.target.value})}
                    className='border border-neutral-300 focus:border-black rounded-lg px-3 py-2 text-sm outline-none'
                  />
                </div>
                <div className='flex flex-col gap-1.5'>
                  <label className='text-xs font-bold text-neutral-700 uppercase'>Job URL / Link</label>
                  <input
                    type="text"
                    placeholder="e.g. careers.google.com/jobs/123"
                    value={newApp.link}
                    onChange={(e) => setNewApp({...newApp, link: e.target.value})}
                    className='border border-neutral-300 focus:border-black rounded-lg px-3 py-2 text-sm outline-none'
                  />
                </div>
                <div className='flex flex-col gap-1.5'>
                  <label className='text-xs font-bold text-neutral-700 uppercase'>Mock Salary ($ / year)</label>
                  <input
                    type="number"
                    placeholder="e.g. 120000"
                    value={newApp.salary}
                    onChange={(e) => setNewApp({...newApp, salary: e.target.value})}
                    className='border border-neutral-300 focus:border-black rounded-lg px-3 py-2 text-sm outline-none'
                  />
                </div>
              </div>

              <div className='flex flex-col gap-1.5'>
                <label className='text-xs font-bold text-neutral-700 uppercase'>Requirements / Description</label>
                <textarea
                  placeholder="Paste key qualifications or application status notes here..."
                  rows="3"
                  value={newApp.requirements}
                  onChange={(e) => setNewApp({...newApp, requirements: e.target.value})}
                  className='border border-neutral-300 focus:border-black rounded-lg px-3 py-2 text-sm outline-none resize-none'
                />
              </div>

              {/* Submit Buttons */}
              <div className='flex justify-end gap-3 mt-4 border-t border-neutral-100 pt-4'>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className='px-5 py-2 border border-neutral-300 hover:border-black rounded-lg text-sm font-semibold transition-all cursor-pointer'
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className='bg-[#a3e635] text-neutral-900 font-bold px-6 py-2 border-2 border-neutral-900 rounded-lg hover:bg-lime-400 transition-all shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] cursor-pointer text-sm'
                >
                  Save & Track
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default JobTable;