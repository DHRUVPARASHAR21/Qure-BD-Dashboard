import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ArrowUpRight, CalendarBlank, ChartLineUp, CheckCircle, Clock, Database, DownloadSimple, FileText, Funnel, MagnifyingGlass, Plus, TrendUp, UsersThree, WarningCircle, X } from '@phosphor-icons/react';
import { createAction, createGoal, deleteGoal, loadDashboard, markRemindersSent, saveDashboard, saveWeeklyReviewNote, toggleActionComplete, updateGoal } from './data/dashboardStore';
import './styles.css';
import './qure-theme.css';
import './qure-brand-refinement.css';
import './qure-depth.css';

const Status = ({ value }) => <span className={`status ${value.toLowerCase().replace(' ', '-')}`}>{value}</span>;
const Bars = () => <div className="bars">{[32, 41, 47, 54, 49, 62, 66, 73, 68].map((value, index) => <div key={index} style={{ '--bar': index }}><i style={{ height: `${value}%` }}></i><small>{['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'][index]}</small></div>)}</div>;
function CountUp({ value, suffix = '' }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) { setDisplay(value); return undefined; }
    let frame;
    const startedAt = performance.now();
    const tick = (now) => {
      const completion = Math.min(1, (now - startedAt) / 620);
      setDisplay(Math.round(value * (1 - Math.pow(1 - completion, 3))));
      if (completion < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value]);
  return <>{display}{suffix}</>;
}

function App() {
  const [page, setPage] = useState('Overview');
  const [query, setQuery] = useState('');
  const [toast, setToast] = useState('');
  const [dashboard, setDashboard] = useState(() => loadDashboard());
  const [composerOpen, setComposerOpen] = useState(false);
  const [goalComposer, setGoalComposer] = useState(null);
  const notify = (message) => { setToast(message); setTimeout(() => setToast(''), 2500); };
  const goals = dashboard.goals;
  const filteredGoals = useMemo(() => goals.filter((goal) => Object.values(goal).join(' ').toLowerCase().includes(query.toLowerCase())), [goals, query]);
  const navigation = [['Overview', ChartLineUp], ['Goal tracker', CheckCircle], ['Weekly review', CalendarBlank], ['Analytics', TrendUp], ['Data & admin', Database]];

  useEffect(() => { saveDashboard(dashboard); }, [dashboard]);

  const addAction = (action) => {
    setDashboard((current) => createAction(current, action));
    setComposerOpen(false);
    notify('Action item added and saved locally');
  };
  const toggleComplete = (actionId) => setDashboard((current) => toggleActionComplete(current, actionId));
  const sendReminders = () => { setDashboard((current) => markRemindersSent(current)); notify('Reminder activity recorded for open actions'); };
  const saveReviewNote = (note) => {
    setDashboard((current) => saveWeeklyReviewNote(current, note));
    notify('Decision saved to this weekly review');
  };
  const saveGoal = (goal) => {
    setDashboard((current) => goalComposer?.mode === 'edit' ? updateGoal(current, goalComposer.goal.id, goal) : createGoal(current, goal));
    setGoalComposer(null);
    notify(goalComposer?.mode === 'edit' ? 'Milestone changes saved locally' : 'Milestone added to the annual plan');
  };
  const removeGoal = () => {
    if (!goalComposer?.goal) return;
    setDashboard((current) => deleteGoal(current, goalComposer.goal.id));
    setGoalComposer(null);
    notify('Milestone removed from the annual plan');
  };

  return <div className="app">
    <aside>
      <div className="brand"><b>q</b><span>qure<i>.ai</i></span></div>
      <div className="space"><small>WORKSPACE</small><strong>Life Sciences BD</strong></div>
      <nav>{navigation.map(([label, Icon]) => <button className={page === label ? 'active' : ''} onClick={() => setPage(label)} key={label}><Icon size={19}/><span>{label}</span>{label === 'Weekly review' && <em>{dashboard.tasks.filter((task) => task.status !== 'Complete').length}</em>}</button>)}</nav>
      <div className="profile"><UsersThree size={18}/><span><strong>Amit Kulkarni</strong><small>Life Sciences Head</small></span></div>
    </aside>
    <main>
      <header><div>Life Sciences <i>/</i> FY26 operating cadence</div><div><button aria-label="Alerts"><WarningCircle size={19}/></button><button className="primary" onClick={() => setComposerOpen(true)}><Plus size={17}/>Add action</button></div></header>
      {page === 'Overview' && <Overview tasks={dashboard.tasks} go={() => setPage('Goal tracker')}/>}
      {page === 'Goal tracker' && <Tracker filtered={filteredGoals} query={query} setQuery={setQuery} notify={notify} onCreate={() => setGoalComposer({ mode: 'create' })} onEdit={(goal) => setGoalComposer({ mode: 'edit', goal })}/>}
      {page === 'Weekly review' && <Review tasks={dashboard.tasks} weeklyReview={dashboard.weeklyReview} onToggleComplete={toggleComplete} onReminders={sendReminders} onSaveNote={saveReviewNote} notify={notify}/>}
      {page === 'Analytics' && <Analytics/>}
      {page === 'Data & admin' && <Admin/>}
    </main>
    {composerOpen && <ActionComposer onClose={() => setComposerOpen(false)} onSave={addAction}/>}
    {goalComposer && <GoalComposer goal={goalComposer.goal} onClose={() => setGoalComposer(null)} onSave={saveGoal} onDelete={goalComposer.mode === 'edit' ? removeGoal : null}/>}
    {toast && <div className="toast" role="status"><CheckCircle size={18}/>{toast}</div>}
  </div>;
}

function Top({ tag, title, sub, children }) { return <section className="top"><div><small>{tag}</small><h1>{title}</h1><p>{sub}</p></div>{children}</section>; }

function Overview({ tasks, go }) {
  const kpis = [['Qualified pipeline', '$5.6M', '66% of $8.5M'], ['Strategic partnerships', '2 / 4', '1 active negotiation'], ['Proposals submitted', '7 / 12', '18% behind plan'], ['Evidence studies', '3 / 6', 'Clinical input gap'], ['Priority leads', '42', '+9 this month'], ['Whitespace accounts', '9 / 12', '3 markets pending']];
  return <><Top tag="Executive overview" title="Keep the year moving forward." sub="September close. 92 days remain in FY26."/><section className="annual"><div><small>ANNUAL PLAN PROGRESS</small><strong><CountUp value={64}/><sup>%</sup></strong><p>Weighted across 6 annual objectives</p></div><div className="plan"><span>Plan attainment <b>Target: 75% by Sep</b></span><div><i></i><em></em></div><small>0% <b>FY26 target</b> 100%</small></div><div className="forecast">FORECAST<strong><CountUp value={82} suffix="%"/></strong><p>↑ 7 pts above current pace</p></div></section><section className="kpis">{kpis.map((kpi, index) => <article key={kpi[0]} style={{ '--item': index }}><p>{kpi[0]}</p><strong>{kpi[1]}<ArrowUpRight size={17}/></strong><small className={index === 2 || index === 3 ? 'bad' : ''}>{kpi[2]}</small></article>)}</section><section className="two"><article className="panel"><div className="panelhead"><div><small>MONTHLY PERFORMANCE</small><h2>Pipeline progression</h2></div><button>View report <ArrowUpRight size={14}/></button></div><div className="metric">$5.6M <span>Qualified pipeline</span><b>+12.4% vs Aug</b></div><Bars/><p className="legend">■ Actual　□ Target trajectory</p></article><article className="panel"><div className="panelhead"><div><small>NEEDS ATTENTION</small><h2>Three items need a decision</h2></div><button onClick={go}>View all <ArrowUpRight size={14}/></button></div>{tasks.filter((task) => task.status !== 'Complete').slice(0, 3).map((task) => <div className="attention" key={task.id}><b></b><div><strong>{task.title}</strong><small>{task.owner} · Due {task.dueDate}</small></div><Status value={task.status}/></div>)}</article></section><section className="three"><article className="panel insight"><small>AI INSIGHT</small><h3>Proposal turnaround is 18% behind plan.</h3><p>Three submissions are waiting on clinical or health economics inputs. Clearing them this week protects $1.3M in Q4 pipeline.</p><button>Review in agenda <ArrowUpRight size={14}/></button></article><article className="panel"><small>RAG DISTRIBUTION</small><div className="rag"><span>● <b>3</b> On track</span><span>● <b>2</b> At risk</span><span>● <b>1</b> Off track</span></div></article><article className="panel"><small>OWNERSHIP GAPS</small><h3>2 actions lack a named reviewer</h3><p>Clinical protocol sign-off and UK evidence budget decision.</p><button>Assign owners <ArrowUpRight size={14}/></button></article></section></>;
}

function Tracker({ filtered, query, setQuery, notify, onCreate, onEdit }) {
  const exportCsv = () => {
    const headers = 'Milestone,Workstream,Owner,Status,Progress,Due,Confidence';
    const rows = filtered.map((goal) => [goal.title, goal.workstream, goal.owner, goal.status, goal.progress, goal.dueDate, `${goal.confidence}%`].map((value) => `"${String(value).replaceAll('"', '""')}"`).join(','));
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([[headers, ...rows].join('\n')], { type: 'text/csv' }));
    link.download = 'qure-goals.csv';
    link.click();
    URL.revokeObjectURL(link.href);
    notify('Goal tracker exported as CSV');
  };
  return <><Top tag="Annual plan" title="Goal tracker" sub="Objective → key result → monthly milestone → action item"><div className="tracker-actions"><button onClick={exportCsv}><DownloadSimple size={17}/>Export CSV</button><button className="primary" onClick={onCreate}><Plus size={17}/>Add milestone</button></div></Top><section className="filters"><label><MagnifyingGlass size={17}/><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search goals, milestones or notes"/></label><select><option>September 2026</option></select><select><option>All owners</option></select><button><Funnel size={16}/>More filters</button></section><section className="table"><div>{filtered.length} milestones <span>Click a row to edit its details</span></div><table><thead><tr><th>Objective / milestone</th><th>Owner</th><th>Status</th><th>Progress</th><th>Due</th><th>Confidence</th></tr></thead><tbody>{filtered.map((goal, index) => <tr tabIndex="0" style={{ '--row': index }} onClick={() => onEdit(goal)} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onEdit(goal); } }} key={goal.id}><td><strong>{goal.title}</strong><small>{goal.workstream}</small></td><td>{goal.owner}</td><td><Status value={goal.status}/></td><td>{goal.progress}</td><td>{goal.dueDate}</td><td><i className="conf"><b style={{ width: `${goal.confidence}%` }}></b></i> {goal.confidence}%</td></tr>)}</tbody></table></section><div className="empty"><FileText size={23}/><div><strong>Need a new planning view?</strong><p>Saved views can be shared by workstream, market or annual objective.</p></div><button>Create saved view</button></div></>;
}

function Review({ tasks, weeklyReview, onToggleComplete, onReminders, onSaveNote, notify }) {
  const openActions = tasks.filter((task) => task.status !== 'Complete');
  const [draft, setDraft] = useState('');
  const saveNote = () => { if (!draft.trim()) return; onSaveNote(draft); setDraft(''); };
  return <><Top tag="Weekly business review" title="Thursday, 01 October" sub="60 min · Life Sciences BD leadership review"><button className="primary" onClick={() => notify('Meeting pack exported')}><DownloadSimple size={17}/>Export meeting pack</button></Top><section className="two review"><article className="panel"><small>AUTO-GENERATED AGENDA</small><h2>Focus the meeting on movement</h2>{[['05 min', 'Previous commitments', '2 actions overdue from last review'], ['15 min', 'Decisions required', 'Clinical input for APAC study; Roche pricing guardrails'], ['20 min', 'At-risk goal review', 'Evidence activation and proposal conversion'], ['15 min', 'Pipeline movement', 'Novartis, Roche, two oncology pursuits'], ['05 min', 'Close & commitments', 'Name owners and confirm due dates']].map((item) => <div className="agenda" key={item[1]}><b>{item[0]}</b><div><strong>{item[1]}</strong><small>{item[2]}</small></div></div>)}</article><article className="panel"><small>DECISION LOG</small><h2>Capture decisions in context</h2><textarea value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Start taking meeting notes here…" aria-label="Weekly review decision note"></textarea><button className="primary" onClick={saveNote} disabled={!draft.trim()}><CheckCircle size={17}/>Save decision</button>{weeklyReview.notes.length > 0 && <div className="saved-decisions" aria-live="polite"><strong>Saved this review</strong>{weeklyReview.notes.slice(0, 3).map((note, index) => <div style={{ '--note': index }} key={note.id}><p>{note.body}</p><small>{new Date(note.savedAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</small></div>)}</div>}<div className="follow"><strong>Previous meeting follow-up</strong><p>Confirm Novartis DPA path with Legal. Owner: Ananya. Due: 02 Oct.</p></div></article></section><section className="panel actions"><div className="panelhead"><div><small>ACTION TRACKER</small><h2>{openActions.length} open commitments</h2></div><button onClick={onReminders}><Clock size={16}/>Send reminders</button></div>{tasks.map((task) => <div key={task.id} className={task.status === 'Complete' ? 'is-complete' : ''}><button className="task-check" onClick={() => onToggleComplete(task.id)} aria-label={`${task.status === 'Complete' ? 'Reopen' : 'Complete'} ${task.title}`}><CheckCircle size={16}/></button><strong>{task.title}</strong><span>{task.owner}</span><span>{task.dueDate}</span><Status value={task.status}/></div>)}</section></>;
}

function ActionComposer({ onClose, onSave }) {
  const [draft, setDraft] = useState({ title: '', owner: '', dueDate: '2026-10-10', status: 'Not started' });
  const update = (event) => setDraft((current) => ({ ...current, [event.target.name]: event.target.value }));
  const submit = (event) => { event.preventDefault(); onSave(draft); };
  return <div className="modal-backdrop" role="presentation"><form className="action-composer" onSubmit={submit} aria-labelledby="action-composer-title"><div className="composer-head"><div><small>NEW ACTION ITEM</small><h2 id="action-composer-title">Turn a commitment into action</h2></div><button type="button" className="close-composer" onClick={onClose} aria-label="Close action composer"><X size={20}/></button></div><label>Action title<input autoFocus required name="title" value={draft.title} onChange={update} placeholder="e.g. Confirm APAC protocol scope"/></label><label>Assignee<input required name="owner" value={draft.owner} onChange={update} placeholder="Name of accountable owner"/></label><div className="composer-fields"><label>Due date<input required type="date" name="dueDate" value={draft.dueDate} onChange={update}/></label><label>Status<select name="status" value={draft.status} onChange={update}><option>Not started</option><option>In progress</option></select></label></div><div className="composer-actions"><button type="button" onClick={onClose}>Cancel</button><button className="primary" type="submit"><Plus size={17}/>Add action</button></div></form></div>;
}

function GoalComposer({ goal, onClose, onSave, onDelete }) {
  const [draft, setDraft] = useState(goal ?? { title: '', workstream: '', owner: '', status: 'On track', progress: '', dueDate: '', confidence: 70 });
  const update = (event) => setDraft((current) => ({ ...current, [event.target.name]: event.target.value }));
  const submit = (event) => { event.preventDefault(); onSave(draft); };
  const editing = Boolean(goal);
  return <div className="modal-backdrop" role="presentation"><form className="action-composer goal-composer" onSubmit={submit} aria-labelledby="goal-composer-title"><div className="composer-head"><div><small>{editing ? 'EDIT MILESTONE' : 'NEW MILESTONE'}</small><h2 id="goal-composer-title">{editing ? 'Keep the annual plan current' : 'Add a milestone to the annual plan'}</h2></div><button type="button" className="close-composer" onClick={onClose} aria-label="Close milestone editor"><X size={20}/></button></div><label>Objective / milestone<input autoFocus required name="title" value={draft.title} onChange={update} placeholder="e.g. Launch APAC evidence study"/></label><label>Workstream<input required name="workstream" value={draft.workstream} onChange={update} placeholder="e.g. Evidence-led market access"/></label><div className="composer-fields"><label>Owner<input required name="owner" value={draft.owner} onChange={update} placeholder="Accountable owner"/></label><label>RAG status<select name="status" value={draft.status} onChange={update}><option>On track</option><option>At risk</option><option>Off track</option></select></label></div><div className="composer-fields"><label>Actual / target<input required name="progress" value={draft.progress} onChange={update} placeholder="e.g. 2 / 4"/></label><label>Due date<input required name="dueDate" value={draft.dueDate} onChange={update} placeholder="e.g. 18 Oct"/></label></div><label>Confidence <span className="field-value">{draft.confidence}%</span><input required type="range" name="confidence" min="0" max="100" value={draft.confidence} onChange={update}/></label><div className="composer-actions">{onDelete && <button type="button" className="delete-goal" onClick={onDelete}>Remove milestone</button>}<span/><button type="button" onClick={onClose}>Cancel</button><button className="primary" type="submit"><CheckCircle size={17}/>{editing ? 'Save changes' : 'Add milestone'}</button></div></form></div>;
}

function Analytics() { return <><Top tag="Analytics & insights" title="Where to intervene next" sub="Signals combine goal progress, workload and dependency data."/><section className="two"><article className="panel"><small>GOAL VELOCITY</small><h2>67% of September milestones closed</h2><Bars/><p>Velocity recovered from August, but remains below the 75% monthly plan.</p></article><article className="panel"><small>TEAM CAPACITY</small><h2>Capacity is uneven across workstreams</h2>{[['Partnerships', 82], ['Revenue', 74], ['Evidence', 108], ['Proposals', 91]].map((item) => <div className="cap" key={item[0]}><span>{item[0]}</span><i><b style={{ width: `${item[1]}%` }}></b></i><strong>{item[1]}%</strong></div>)}</article></section><section className="three">{[['FORECAST SIGNAL', 'Q4 qualified pipeline is forecast at $2.2M.', 'This is $0.4M above plan if the Novartis and Roche proposals exit review before 10 October.'], ['TOP DEPENDENCY', 'Clinical team turnaround', 'Three proposals depend on clinical inputs; median wait time is now 9 days.'], ['RECURRING BLOCKER', 'Pricing approval', 'Raised in 3 of the last 4 reviews. Assign a single approval path.']].map((item) => <article className="panel" key={item[0]}><small>{item[0]}</small><h3>{item[1]}</h3><p>{item[2]}</p></article>)}</section></>; }

function Admin() { return <><Top tag="Data & administration" title="Reliable inputs, clear permissions" sub="The mock data layer is designed for a CRM, PM tool and analytics warehouse."/><section className="three">{[['Salesforce pipeline', 'Connected', '18 min ago'], ['Asana action items', 'Connected', '22 min ago'], ['Evidence tracker', 'Sync warning', '3 hrs ago']].map((item) => <article className="panel source" key={item[0]}><Database size={23}/><h3>{item[0]}</h3><Status value={item[1]}/><p>Last refresh {item[2]}</p></article>)}</section><section className="panel schema"><small>INTEGRATION SCHEMA</small><h2>Core entities</h2><div>{[['AnnualObjective', 'id, title, ownerId, fiscalYear, status'], ['KeyResult', 'objectiveId, target, actual, confidence'], ['Milestone', 'keyResultId, month, dueDate, RAG'], ['ActionItem', 'milestoneId, assigneeId, status, notes']].map((item) => <span key={item[0]}><strong>{item[0]}</strong><code>{item[1]}</code></span>)}</div><p>Connect an API by replacing the seeded repository with a service returning these entities. Role scopes: leadership, owner, analyst.</p></section></>; }

createRoot(document.getElementById('root')).render(<App/>);
