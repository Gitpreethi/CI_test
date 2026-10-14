import { useEffect, useMemo, useState } from 'react';
import { BookOpen, CalendarDays, Check, CheckCircle2, ChevronLeft, ChevronRight, Clock3, Plus, Sparkles, Target, Trash2 } from 'lucide-react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/tasks';
const today = new Date();
const localDate = (date) => { const d = new Date(date); return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10); };
const initialTasks = [
  { id: 'sample-1', subject: 'Biology', topic: 'Cell structure & function', date: localDate(today), time: '09:00', duration: 45, completed: false },
  { id: 'sample-2', subject: 'Mathematics', topic: 'Integration practice', date: localDate(today), time: '11:30', duration: 60, completed: false },
  { id: 'sample-3', subject: 'English', topic: 'Read chapter 4', date: localDate(new Date(today.getTime() + 86400000)), time: '16:00', duration: 30, completed: true },
];
const colors = { Biology: 'mint', Mathematics: 'lilac', English: 'peach', Chemistry: 'blue', History: 'yellow', Physics: 'pink' };
const prettyDate = (date) => new Date(`${date}T12:00:00`).toLocaleDateString('en', { weekday: 'short', month: 'short', day: 'numeric' });

function App() {
  const [tasks, setTasks] = useState(initialTasks);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState('all');
  const [form, setForm] = useState({ subject: '', topic: '', date: localDate(today), time: '09:00', duration: 45 });
  const [formError, setFormError] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    fetch(API, { signal: controller.signal }).then(async (response) => {
      if (!response.ok) throw new Error('Could not load your study sessions.');
      const data = await response.json();
      setTasks(data);
    }).catch((err) => { if (err.name !== 'AbortError') setError(`${err.message} Showing sample sessions while the API is unavailable.`); })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, []);

  const completed = tasks.filter((task) => task.completed).length;
  const minutes = tasks.filter((task) => task.completed).reduce((sum, task) => sum + Number(task.duration), 0);
  const visible = useMemo(() => tasks.filter((task) => filter === 'all' || (filter === 'done' ? task.completed : !task.completed)).sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`)), [tasks, filter]);
  const todayLabel = today.toLocaleDateString('en', { weekday: 'long', month: 'long', day: 'numeric' });

  async function addTask(event) {
    event.preventDefault(); setFormError('');
    if (!form.subject.trim() || !form.topic.trim() || !form.date || !form.time || Number(form.duration) < 5) { setFormError('Fill in every field. Sessions must be at least 5 minutes.'); return; }
    const payload = { ...form, duration: Number(form.duration), completed: false };
    try {
      const response = await fetch(API, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (!response.ok) { const body = await response.json(); throw new Error(body.error || 'Unable to save this session.'); }
      const created = await response.json(); setTasks((items) => [...items, created]); setShowForm(false); setNotice('Session added to your plan.');
      setForm({ subject: '', topic: '', date: localDate(today), time: '09:00', duration: 45 }); setTimeout(() => setNotice(''), 2800);
    } catch (err) { setFormError(`${err.message} Is the Flask server running?`); }
  }

  async function toggleTask(task) {
    setError('');
    try {
      const response = await fetch(`${API}/${task.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ completed: !task.completed }) });
      if (!response.ok) throw new Error('Could not update this session.');
      const updated = await response.json(); setTasks((items) => items.map((item) => item.id === task.id ? updated : item));
    } catch (err) { setError(`${err.message} Please try again.`); }
  }

  async function deleteTask(task) {
    setError('');
    try {
      const response = await fetch(`${API}/${task.id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Could not delete this session.');
      setTasks((items) => items.filter((item) => item.id !== task.id));
    } catch (err) { setError(`${err.message} Please try again.`); }
  }

  const upcoming = tasks.filter((task) => !task.completed).sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`))[0];

  return <main className="app-shell">
    <aside className="sidebar">
      <a className="brand" href="#top"><span className="brand-icon"><BookOpen size={19}/></span><span>studyspace<span className="brand-dot">.</span></span></a>
      <div className="side-label">YOUR SPACE</div>
      <button className="nav-item active"><CalendarDays size={17}/> My planner <span className="nav-count">{tasks.length}</span></button>
      <div className="side-label subjects-label">SUBJECTS</div>
      <div className="subject-link"><i className="subject-dot mint-dot"/> Biology <span>{tasks.filter(t=>t.subject==='Biology').length}</span></div>
      <div className="subject-link"><i className="subject-dot lilac-dot"/> Mathematics <span>{tasks.filter(t=>t.subject==='Mathematics').length}</span></div>
      <div className="subject-link"><i className="subject-dot peach-dot"/> English <span>{tasks.filter(t=>t.subject==='English').length}</span></div>
      <div className="subject-link"><i className="subject-dot blue-dot"/> Chemistry <span>{tasks.filter(t=>t.subject==='Chemistry').length}</span></div>
      <div className="sidebar-note"><div className="note-spark"><Sparkles size={15}/></div><strong>Little by little</strong><p>Small steps every day add up to big progress.</p><div className="note-progress"><span style={{width:`${tasks.length ? Math.min(100, completed / tasks.length * 100) : 0}%`}}/></div><small>{completed} of {tasks.length} sessions done</small></div>
      <div className="sidebar-footer"><span className="avatar">S</span><span><strong>Student</strong><small>Your learning space</small></span><span className="online-dot"/></div>
    </aside>

    <section className="main-area" id="top">
      <header className="topbar"><div className="breadcrumb">My planner <ChevronRight size={14}/> <span>Overview</span></div><div className="top-date"><span className="date-live"/>{todayLabel}</div></header>
      <div className="content">
        <section className="welcome"><div><div className="eyebrow"><Sparkles size={13}/> YOUR SPACE TO GROW</div><h1>A little progress<br/><em>every day.</em></h1><p>Make time for what matters. Your next step starts here.</p><button className="primary-btn" onClick={()=>setShowForm(true)}><Plus size={17}/> Plan a session</button></div><div className="welcome-art"><div className="sun-orb"/><div className="art-book book-back"/><div className="art-book book-front"><BookOpen size={33}/></div><div className="art-star star-one">✳</div><div className="art-star star-two">✦</div><div className="art-line"/></div></section>

        <section className="stats-grid">
          <div className="stat-card"><div className="stat-top"><span>Sessions completed</span><span className="stat-icon mint-icon"><CheckCircle2 size={16}/></span></div><div className="stat-value">{completed}<small> / {tasks.length}</small></div><div className="stat-foot"><span className="mini-bar"><i style={{width:`${tasks.length ? completed / tasks.length * 100 : 0}%`}}/></span><span>{tasks.length ? Math.round(completed / tasks.length * 100) : 0}% of your plan</span></div></div>
          <div className="stat-card"><div className="stat-top"><span>Focused time</span><span className="stat-icon lilac-icon"><Clock3 size={16}/></span></div><div className="stat-value">{Math.floor(minutes / 60)}<small>h </small>{minutes % 60}<small>m</small></div><div className="stat-foot">Time well spent. Keep it up!</div></div>
          <div className="stat-card next-card"><div className="stat-top"><span>Up next</span><span className="stat-icon peach-icon"><Target size={16}/></span></div><div className="next-session">{upcoming ? upcoming.subject : 'All caught up!'}</div><div className="stat-foot">{upcoming ? `${prettyDate(upcoming.date)} · ${upcoming.time}` : 'Add a session to get started'}</div></div>
        </section>

        <section className="sessions-section"><div className="section-heading"><div><div className="eyebrow section-eyebrow">MAKE IT COUNT</div><h2>Your study sessions</h2></div><button className="add-small" onClick={()=>setShowForm(true)}><Plus size={16}/> Add session</button></div>
          {error && <div className="alert error-alert">{error}<button onClick={()=>setError('')}>Dismiss</button></div>}
          {notice && <div className="alert success-alert"><Check size={16}/>{notice}</div>}
          <div className="list-toolbar"><div className="filters"><button className={filter==='all'?'selected':''} onClick={()=>setFilter('all')}>All <span>{tasks.length}</span></button><button className={filter==='todo'?'selected':''} onClick={()=>setFilter('todo')}>To do <span>{tasks.length-completed}</span></button><button className={filter==='done'?'selected':''} onClick={()=>setFilter('done')}>Completed <span>{completed}</span></button></div><div className="week-nav"><button aria-label="Previous week"><ChevronLeft size={16}/></button><span>This week</span><button aria-label="Next week"><ChevronRight size={16}/></button></div></div>
          {loading && <div className="loading-line"><span className="spinner"/> Loading your sessions…</div>}
          <div className="task-list">{visible.map((task) => <article className={`task-card ${task.completed?'is-complete':''}`} key={task.id}><button className={`task-check ${task.completed?'checked':''}`} aria-label={task.completed?'Mark incomplete':'Mark complete'} onClick={()=>toggleTask(task)}>{task.completed&&<Check size={15}/>}</button><div className={`task-subject-icon ${colors[task.subject] || 'blue'}`}><BookOpen size={18}/></div><div className="task-info"><div className="task-title">{task.subject}<span className="task-topic">{task.topic}</span></div><div className="task-meta"><span><CalendarDays size={13}/>{prettyDate(task.date)}</span><span><Clock3 size={13}/>{task.time} · {task.duration} min</span></div></div><span className={`subject-pill ${colors[task.subject] || 'blue'}`}>{task.subject}</span><button className="delete-btn" aria-label="Delete session" onClick={()=>deleteTask(task)}><Trash2 size={15}/></button></article>)}
            {!loading && visible.length===0 && <div className="empty-state"><div className="empty-icon"><BookOpen size={24}/></div><strong>{tasks.length ? 'Nothing here just yet' : 'Your plan starts here'}</strong><p>{tasks.length ? 'Try another filter or add a new study session.' : 'Set up your first study session and make today count.'}</p><button className="primary-btn" onClick={()=>setShowForm(true)}><Plus size={16}/> Plan a session</button></div>}
          </div>
          <div className="list-footer"><span>Showing {visible.length} of {tasks.length} sessions</span><span><span className="footer-dot"/> Synced with your planner</span></div>
        </section>
        <footer className="app-footer">Made for your next small win <span>✳</span></footer>
      </div>
    </section>

    {showForm && <div className="modal-backdrop" onMouseDown={(e)=>{if(e.target===e.currentTarget)setShowForm(false)}}><section className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title"><button className="modal-close" onClick={()=>setShowForm(false)} aria-label="Close">×</button><div className="eyebrow">A NEW STUDY SESSION</div><h2 id="modal-title">Make a little plan.</h2><p className="modal-copy">Choose what to focus on and when to begin.</p><form onSubmit={addTask}><label>Subject<input value={form.subject} onChange={e=>setForm({...form,subject:e.target.value})} placeholder="e.g. Biology" list="subjects" maxLength="40" autoFocus/><datalist id="subjects"><option>Biology</option><option>Mathematics</option><option>English</option><option>Chemistry</option><option>History</option><option>Physics</option></datalist></label><label>What will you study?<input value={form.topic} onChange={e=>setForm({...form,topic:e.target.value})} placeholder="e.g. Review chapter 3" maxLength="100"/></label><div className="form-row"><label>Date<input type="date" value={form.date} onChange={e=>setForm({...form,date:e.target.value})}/></label><label>Start time<input type="time" value={form.time} onChange={e=>setForm({...form,time:e.target.value})}/></label></div><label>Duration <span className="input-unit">minutes</span><input type="number" min="5" max="600" step="5" value={form.duration} onChange={e=>setForm({...form,duration:e.target.value})}/></label>{formError && <div className="form-error">{formError}</div>}<button type="submit" className="primary-btn submit-btn"><Plus size={17}/> Add to my plan</button></form></section></div>}
  </main>;
}

export default App;
