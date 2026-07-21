import { useEffect, useMemo, useState } from 'react';
import {
  CalendarDays,
  Clock,
  UserCheck,
  TrendingUp,
  RefreshCw,
  LayoutDashboard,
  CalendarClock,
  Settings,
  Sparkles,
  AlertCircle,
  Inbox,
  ArrowDownUp,
  MapPin,
  Phone,
  Mail,
  Globe,
  Building2,
  CalendarPlus,
} from 'lucide-react';

type View = 'dashboard' | 'appointments' | 'settings' | 'coming-today' | 'booked-today';

type Appointment = {
  id: number;
  patient_name: string;
  phone_number: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  service: string;
  created_at?: string; // ISO timestamp or YYYY-MM-DD
};

const CLINIC_NAME = 'Bright Smile Dental';
const API_URL = 'https://dental-clinic-a4vx.onrender.com/api/all-appointments';

/* ---------- date helpers ---------- */
function todayStr() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

function formatDateLabel(dateStr: string) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatTime(timeStr: string) {
  const [h, m] = timeStr.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(m).padStart(2, '0')} ${period}`;
}

function formatPhone(phone: string) {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  return phone;
}

function addDays(base: string, days: number) {
  const [y, m, d] = base.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + days);
  const ny = dt.getFullYear();
  const nm = String(dt.getMonth() + 1).padStart(2, '0');
  const nd = String(dt.getDate()).padStart(2, '0');
  return `${ny}-${nm}-${nd}`;
}

function datePartOf(value?: string) {
  if (!value) return '';
  // ISO timestamp like 2026-07-14T12:34:56Z or 2026-07-14 12:34:56
  const t = value.split('T')[0].split(' ')[0];
  return t.length === 10 ? t : '';
}

/* ---------- sidebar ---------- */
function Sidebar({ view, onNavigate }: { view: View; onNavigate: (v: View) => void }) {
  return (
    <aside className="hidden md:flex w-64 shrink-0 flex-col bg-navy-950 text-navy-100 min-h-screen sticky top-0">
      <div className="px-6 py-7 flex items-center gap-2.5">
        <div className="grid place-items-center h-9 w-9 rounded-xl bg-teal-400/15 ring-1 ring-teal-400/30">
          <Sparkles className="h-5 w-5 text-teal-300" />
        </div>
        <div className="leading-tight">
          <p className="text-white font-bold tracking-tight text-lg">Ava AI</p>
          <p className="text-[11px] uppercase tracking-wider text-navy-300">Receptionist</p>
        </div>
      </div>

      <nav className="mt-4 px-3 space-y-1">
        <NavItem icon={LayoutDashboard} label="Dashboard" active={view === 'dashboard'} onClick={() => onNavigate('dashboard')} />
        <NavItem icon={UserCheck} label="Coming Today" active={view === 'coming-today'} onClick={() => onNavigate('coming-today')} />
        <NavItem icon={CalendarPlus} label="Booked Today" active={view === 'booked-today'} onClick={() => onNavigate('booked-today')} />
        <NavItem icon={CalendarClock} label="Appointments" active={view === 'appointments'} onClick={() => onNavigate('appointments')} />
        <NavItem icon={Settings} label="Settings" active={view === 'settings'} onClick={() => onNavigate('settings')} />
      </nav>

      <div className="mt-auto px-4 py-5 border-t border-navy-800/70">
        <div className="flex items-center gap-3 px-2 py-2 rounded-lg">
          <div className="grid place-items-center h-9 w-9 rounded-full bg-navy-700 text-teal-200 font-semibold text-sm">
            BS
          </div>
          <div className="min-w-0">
            <p className="text-white text-sm font-medium truncate">{CLINIC_NAME}</p>
            <button className="text-xs text-navy-300 hover:text-teal-300 transition-colors">
              Logout
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}

function NavItem({
  icon: Icon,
  label,
  active = false,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
        active
          ? 'bg-navy-800 text-white shadow-inner'
          : 'text-navy-300 hover:bg-navy-900 hover:text-white'
      }`}
    >
      <Icon className={`h-[18px] w-[18px] ${active ? 'text-teal-300' : ''}`} />
      {label}
    </button>
  );
}

/* ---------- stat card ---------- */
type StatColor = 'teal' | 'navy' | 'amber' | 'violet';

function StatCard({
  icon: Icon,
  value,
  label,
  color,
  loading,
  delay = 0,
}: {
  icon: React.ComponentType<{ className?: string }>;
  value: number;
  label: string;
  color: StatColor;
  loading: boolean;
  delay?: number;
}) {
  const accent: Record<StatColor, string> = {
    teal: 'border-l-teal-400',
    navy: 'border-l-navy-500',
    amber: 'border-l-amber-400',
    violet: 'border-l-violet-400',
  };
  const iconWrap: Record<StatColor, string> = {
    teal: 'bg-teal-50 text-teal-600',
    navy: 'bg-navy-50 text-navy-600',
    amber: 'bg-amber-50 text-amber-600',
    violet: 'bg-violet-50 text-violet-600',
  };

  return (
    <div
      className={`animate-fade-in-up bg-white rounded-2xl shadow-card hover:shadow-card-hover transition-shadow border border-slate-100 border-l-4 ${accent[color]} p-5`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-start justify-between">
        <div className={`grid place-items-center h-11 w-11 rounded-xl ${iconWrap[color]}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <div className="mt-4">
        {loading ? (
          <div className="skeleton h-8 w-16 rounded-md" />
        ) : (
          <p className="text-3xl font-bold text-navy-900 tracking-tight tabular-nums">{value}</p>
        )}
        <p className="mt-1 text-sm text-slate-500 font-medium">{label}</p>
      </div>
    </div>
  );
}

/* ---------- table ---------- */
type Column = {
  key: string;
  label: string;
  sortable?: boolean;
  className?: string;
};

function AppointmentTable({
  columns,
  rows,
  loading,
  emptyMessage,
  sortKey,
  sortDir,
  onSort,
}: {
  columns: Column[];
  rows: Record<string, React.ReactNode>[];
  loading: boolean;
  emptyMessage: string;
  sortKey?: string;
  sortDir?: 'asc' | 'desc';
  onSort?: (key: string) => void;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs uppercase tracking-wider text-slate-500 border-b border-slate-100">
            {columns.map((col) => (
              <th key={col.key} className={`py-3 px-4 font-semibold ${col.className ?? ''}`}>
                {col.sortable && onSort ? (
                  <button
                    onClick={() => onSort(col.key)}
                    className="inline-flex items-center gap-1.5 hover:text-navy-700 transition-colors"
                  >
                    {col.label}
                    <ArrowDownUp
                      className={`h-3 w-3 ${
                        sortKey === col.key ? 'text-teal-500' : 'text-slate-300'
                      }`}
                    />
                  </button>
                ) : (
                  col.label
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <tr key={i} className="border-b border-slate-50">
                {columns.map((c) => (
                  <td key={c.key} className="py-3.5 px-4">
                    <div className="skeleton h-4 w-full max-w-[140px] rounded" />
                  </td>
                ))}
              </tr>
            ))
          ) : rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="py-12 px-4">
                <div className="flex flex-col items-center justify-center text-center">
                  <div className="grid place-items-center h-12 w-12 rounded-full bg-slate-100 text-slate-400">
                    <Inbox className="h-6 w-6" />
                  </div>
                  <p className="mt-3 text-sm text-slate-500 font-medium">{emptyMessage}</p>
                </div>
              </td>
            </tr>
          ) : (
            rows.map((row, i) => (
              <tr
                key={i}
                className="border-b border-slate-50 hover:bg-slate-50/70 transition-colors"
              >
                {columns.map((c) => (
                  <td key={c.key} className={`py-3 px-4 text-slate-700 ${c.className ?? ''}`}>
                    {row[c.key]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

function SectionCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="bg-white rounded-2xl shadow-card border border-slate-100">
      <div className="flex items-end justify-between px-5 pt-5 pb-3">
        <div>
          <h2 className="text-base font-semibold text-navy-900">{title}</h2>
          {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      <div className="px-2 pb-2">{children}</div>
    </section>
  );
}

function ServiceBadge({ service }: { service: string }) {
  return (
    <span className="inline-flex items-center rounded-full bg-teal-50 px-2.5 py-1 text-xs font-medium text-teal-700 ring-1 ring-teal-100">
      {service}
    </span>
  );
}

function SettingsRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-4 py-4 border-b border-slate-100 last:border-0">
      <div className="grid place-items-center h-10 w-10 rounded-xl bg-navy-50 text-navy-600 shrink-0">
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <p className="text-xs uppercase tracking-wider text-slate-400 font-semibold">{label}</p>
        <p className="text-sm text-navy-900 font-medium mt-0.5">{value}</p>
      </div>
    </div>
  );
}

function SettingsPage() {
  const hours: { day: string; time: string }[] = [
    { day: 'Monday', time: '8:00 AM – 5:00 PM' },
    { day: 'Tuesday', time: '8:00 AM – 5:00 PM' },
    { day: 'Wednesday', time: '8:00 AM – 5:00 PM' },
    { day: 'Thursday', time: '8:00 AM – 5:00 PM' },
    { day: 'Friday', time: '8:00 AM – 2:00 PM' },
    { day: 'Saturday', time: 'Closed' },
    { day: 'Sunday', time: 'Closed' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-navy-900 tracking-tight">Settings</h1>
        <p className="text-sm text-slate-500 mt-0.5">Clinic profile and operating hours</p>
      </div>

      <section className="bg-white rounded-2xl shadow-card border border-slate-100 p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="grid place-items-center h-11 w-11 rounded-xl bg-teal-50 text-teal-600">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-navy-900">Clinic Profile</h2>
            <p className="text-xs text-slate-500">Information used across Ava AI</p>
          </div>
        </div>
        <SettingsRow icon={Building2} label="Clinic Name" value={CLINIC_NAME} />
        <SettingsRow icon={MapPin} label="Address" value="1428 Maple Avenue, Springfield, IL 62704" />
        <SettingsRow icon={Phone} label="Phone" value="(217) 555-0142" />
        <SettingsRow icon={Mail} label="Email" value="frontdesk@brightsmiledental.com" />
        <SettingsRow icon={Globe} label="Website" value="www.brightsmiledental.com" />
      </section>

      <section className="bg-white rounded-2xl shadow-card border border-slate-100 p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="grid place-items-center h-11 w-11 rounded-xl bg-navy-50 text-navy-600">
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-navy-900">Operating Hours</h2>
            <p className="text-xs text-slate-500">When Ava AI accepts new bookings</p>
          </div>
        </div>
        <div className="divide-y divide-slate-100">
          {hours.map((h) => (
            <div key={h.day} className="flex items-center justify-between py-3">
              <span className="text-sm font-medium text-navy-900">{h.day}</span>
              <span
                className={`text-sm ${
                  h.time === 'Closed' ? 'text-slate-400' : 'text-slate-600 tabular-nums'
                }`}
              >
                {h.time}
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

/* ---------- main app ---------- */
export default function App() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [allSortDir, setAllSortDir] = useState<'asc' | 'desc'>('desc');
  const [view, setView] = useState<View>('dashboard');

  async function fetchAppointments() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(API_URL);
      if (!res.ok) throw new Error(`Request failed (${res.status})`);
      const data: Appointment[] = await res.json();
      setAppointments(Array.isArray(data) ? data : []);
      setLastUpdated(new Date());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load appointments');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchAppointments();
  }, []);

  const today = todayStr();
  const weekEnd = addDays(today, 7);

  const todays = useMemo(
    () => appointments.filter((a) => a.date === today).sort((a, b) => a.time.localeCompare(b.time)),
    [appointments, today]
  );

  const upcoming = useMemo(
    () =>
      appointments
        .filter((a) => a.date > today)
        .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))
        .slice(0, 10),
    [appointments, today]
  );

  const allSorted = useMemo(
    () =>
      [...appointments].sort((a, b) =>
        allSortDir === 'desc'
          ? (b.date + b.time).localeCompare(a.date + a.time)
          : (a.date + a.time).localeCompare(b.date + b.time)
      ),
    [appointments, allSortDir]
  );

  const comingToday = useMemo(
    () =>
      appointments
        .filter((a) => a.date === today)
        .sort((a, b) => a.time.localeCompare(b.time)),
    [appointments, today]
  );

  const bookedToday = useMemo(
    () =>
      appointments
        .filter((a) => datePartOf(a.created_at) === today)
        .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time)),
    [appointments, today]
  );

  const hasCreatedAt = useMemo(
    () => appointments.some((a) => datePartOf(a.created_at)),
    [appointments]
  );

  const stats = useMemo(
    () => ({
      total: appointments.length,
      today: todays.length,
      week: appointments.filter((a) => a.date >= today && a.date <= weekEnd).length,
    }),
    [appointments, todays.length, today, weekEnd]
  );

  const todayDateLabel = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  function rowFor(a: Appointment, withDate = false) {
    return {
      patient: <span className="font-medium text-navy-900">{a.patient_name}</span>,
      phone: <span className="text-slate-500 tabular-nums">{formatPhone(a.phone_number)}</span>,
      time: <span className="text-slate-600">{formatTime(a.time)}</span>,
      date: <span className="text-slate-600">{formatDateLabel(a.date)}</span>,
      service: <ServiceBadge service={a.service} />,
    };
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar view={view} onNavigate={setView} />

      <main className="flex-1 min-w-0">
        {/* top bar */}
        <header className="sticky top-0 z-10 bg-slate-50/80 backdrop-blur border-b border-slate-100">
          <div className="px-5 md:px-8 py-4 flex items-center justify-between gap-4">
            <div>
              {view === 'dashboard' ? (
                <>
                  <h1 className="text-xl md:text-2xl font-bold text-navy-900 tracking-tight">
                    {greeting()}, {CLINIC_NAME}
                  </h1>
                  <p className="text-sm text-slate-500 mt-0.5">{todayDateLabel}</p>
                </>
              ) : view === 'appointments' ? (
                <>
                  <h1 className="text-xl md:text-2xl font-bold text-navy-900 tracking-tight">
                    Appointments
                  </h1>
                  <p className="text-sm text-slate-500 mt-0.5">
                    All {appointments.length} appointments on record
                  </p>
                </>
              ) : view === 'coming-today' ? (
                <>
                  <h1 className="text-xl md:text-2xl font-bold text-navy-900 tracking-tight">
                    Coming Today
                  </h1>
                  <p className="text-sm text-slate-500 mt-0.5">
                    Patients scheduled to arrive today · {todayDateLabel}
                  </p>
                </>
              ) : view === 'booked-today' ? (
                <>
                  <h1 className="text-xl md:text-2xl font-bold text-navy-900 tracking-tight">
                    Booked Today
                  </h1>
                  <p className="text-sm text-slate-500 mt-0.5">
                    New bookings made today · {todayDateLabel}
                  </p>
                </>
              ) : (
                <>
                  <h1 className="text-xl md:text-2xl font-bold text-navy-900 tracking-tight">
                    Settings
                  </h1>
                  <p className="text-sm text-slate-500 mt-0.5">Clinic profile and operating hours</p>
                </>
              )}
            </div>
            {view !== 'settings' && (
              <button
                onClick={fetchAppointments}
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-xl bg-navy-900 px-4 py-2.5 text-sm font-semibold text-white shadow-card hover:bg-navy-800 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            )}
          </div>
        </header>

        <div className="px-5 md:px-8 py-6 space-y-6 max-w-[1400px]">
          {view === 'settings' ? (
            <SettingsPage />
          ) : (
            <>
              {error && (
                <div className="flex items-start gap-3 rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-700">
                  <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold">Couldn't load appointments</p>
                    <p className="text-red-600/90">{error}. Please try refreshing.</p>
                  </div>
                </div>
              )}

              {view === 'dashboard' && (
                <>
                  {/* stat cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                    <StatCard
                      icon={CalendarDays}
                      value={stats.total}
                      label="Total Appointments"
                      color="navy"
                      loading={loading}
                      delay={0}
                    />
                    <StatCard
                      icon={Clock}
                      value={stats.today}
                      label="Today's Bookings"
                      color="teal"
                      loading={loading}
                      delay={60}
                    />
                    <StatCard
                      icon={UserCheck}
                      value={stats.today}
                      label="Coming Today"
                      color="amber"
                      loading={loading}
                      delay={120}
                    />
                    <StatCard
                      icon={TrendingUp}
                      value={stats.week}
                      label="This Week"
                      color="violet"
                      loading={loading}
                      delay={180}
                    />
                  </div>

                  {/* today */}
                  <SectionCard
                    title="Today's Appointments"
                    subtitle={loading ? 'Loading…' : `${todays.length} scheduled for today`}
                  >
                    <AppointmentTable
                      columns={[
                        { key: 'patient', label: 'Patient Name' },
                        { key: 'phone', label: 'Phone' },
                        { key: 'time', label: 'Time' },
                        { key: 'service', label: 'Service' },
                      ]}
                      rows={todays.map((a) => rowFor(a))}
                      loading={loading}
                      emptyMessage="No appointments scheduled for today"
                    />
                  </SectionCard>

                  {/* upcoming */}
                  <SectionCard
                    title="Upcoming Appointments"
                    subtitle={loading ? 'Loading…' : `Next ${upcoming.length} of 10`}
                  >
                    <AppointmentTable
                      columns={[
                        { key: 'patient', label: 'Patient Name' },
                        { key: 'phone', label: 'Phone' },
                        { key: 'date', label: 'Date' },
                        { key: 'time', label: 'Time' },
                        { key: 'service', label: 'Service' },
                      ]}
                      rows={upcoming.map((a) => rowFor(a, true))}
                      loading={loading}
                      emptyMessage="No upcoming appointments"
                    />
                  </SectionCard>
                </>
              )}

              {view === 'coming-today' && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-white rounded-2xl shadow-card border border-slate-100 border-l-4 border-l-amber-400 p-5">
                      <div className="grid place-items-center h-11 w-11 rounded-xl bg-amber-50 text-amber-600">
                        <UserCheck className="h-5 w-5" />
                      </div>
                      <p className="mt-4 text-3xl font-bold text-navy-900 tabular-nums">
                        {loading ? '—' : comingToday.length}
                      </p>
                      <p className="mt-1 text-sm text-slate-500 font-medium">Patients arriving today</p>
                    </div>
                  </div>
                  <SectionCard
                    title="Coming Today"
                    subtitle={loading ? 'Loading…' : `${comingToday.length} appointment${comingToday.length === 1 ? '' : 's'} scheduled for today`}
                  >
                    <AppointmentTable
                      columns={[
                        { key: 'patient', label: 'Patient Name' },
                        { key: 'phone', label: 'Phone' },
                        { key: 'time', label: 'Time' },
                        { key: 'service', label: 'Service' },
                      ]}
                      rows={comingToday.map((a) => rowFor(a))}
                      loading={loading}
                      emptyMessage="No patients scheduled to arrive today"
                    />
                  </SectionCard>
                </>
              )}

              {view === 'booked-today' && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-white rounded-2xl shadow-card border border-slate-100 border-l-4 border-l-teal-400 p-5">
                      <div className="grid place-items-center h-11 w-11 rounded-xl bg-teal-50 text-teal-600">
                        <CalendarPlus className="h-5 w-5" />
                      </div>
                      <p className="mt-4 text-3xl font-bold text-navy-900 tabular-nums">
                        {loading ? '—' : bookedToday.length}
                      </p>
                      <p className="mt-1 text-sm text-slate-500 font-medium">New bookings today</p>
                    </div>
                  </div>
                  <SectionCard
                    title="Booked Today"
                    subtitle={
                      loading
                        ? 'Loading…'
                        : hasCreatedAt
                          ? `${bookedToday.length} booking${bookedToday.length === 1 ? '' : 's'} created today`
                          : 'No booking timestamps available'
                    }
                  >
                    <AppointmentTable
                      columns={[
                        { key: 'patient', label: 'Patient Name' },
                        { key: 'phone', label: 'Phone' },
                        { key: 'date', label: 'Appointment Date' },
                        { key: 'time', label: 'Time' },
                        { key: 'service', label: 'Service' },
                      ]}
                      rows={bookedToday.map((a) => rowFor(a, true))}
                      loading={loading}
                      emptyMessage={
                        hasCreatedAt
                          ? 'No new bookings made today'
                          : 'No bookings with a creation timestamp — the API did not return a "created_at" field'
                      }
                    />
                  </SectionCard>
                </>
              )}

              {/* full appointments table — shown on dashboard and appointments views */}
              {(view === 'dashboard' || view === 'appointments') && (
                <SectionCard
                  title="All Appointments"
                  subtitle={
                    loading
                      ? 'Loading…'
                      : `${appointments.length} total · sorted ${allSortDir === 'desc' ? 'newest first' : 'oldest first'}`
                  }
                >
                  <AppointmentTable
                    columns={[
                      { key: 'patient', label: 'Patient Name' },
                      { key: 'phone', label: 'Phone' },
                      { key: 'date', label: 'Date', sortable: true },
                      { key: 'time', label: 'Time' },
                      { key: 'service', label: 'Service' },
                    ]}
                    rows={allSorted.map((a) => rowFor(a, true))}
                    loading={loading}
                    emptyMessage="No appointments yet"
                    sortKey="date"
                    sortDir={allSortDir}
                    onSort={() => setAllSortDir((d) => (d === 'desc' ? 'asc' : 'desc'))}
                  />
                </SectionCard>
              )}

              {lastUpdated && (
                <p className="text-center text-xs text-slate-400 pt-1 pb-4">
                  Last updated {lastUpdated.toLocaleTimeString('en-US')}
                </p>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
