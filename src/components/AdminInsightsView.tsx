import React, { useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import {
  TrendingUp,
  Users,
  UserCheck,
  UserX,
  Film,
  Tv,
  Radio,
  HardDrive,
  UserPlus,
} from 'lucide-react';
import { LiveTVChannel, Movie, TVShow, UserAccount } from '../types';
import { getUserTrialInfo, MS_PER_DAY } from '../lib/trial';

interface AdminInsightsViewProps {
  users: UserAccount[];
  movies: Movie[];
  tvShows: TVShow[];
  liveChannels: LiveTVChannel[];
  onOpenUsersTab: () => void;
  onOpenAddUserModal: () => void;
}

interface DailyGrowthPoint {
  dateKey: string;
  dateLabel: string;
  fullDate: string;
  newUsers: number;
  totalUsers: number;
}

interface StatusDatum {
  name: 'Active Users' | 'Inactive Users';
  shortName: 'Active' | 'Inactive';
  value: number;
  color: string;
  detail: string;
}

function getLocalDayStart(timestampMs: number): number {
  const d = new Date(timestampMs);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

function resolveUserJoinedTimestamp(user: UserAccount, nowMs: number): number {
  if (typeof user.createdAt === 'number' && user.createdAt > 0) {
    return user.createdAt;
  }
  if (typeof user.trialStartDate === 'number' && user.trialStartDate > 0) {
    return user.trialStartDate;
  }
  if (user.joinedDate) {
    const normalized = user.joinedDate.trim().toLowerCase();
    if (normalized === 'today' || normalized === 'just now') {
      return nowMs;
    }
    if (normalized === 'yesterday') {
      return nowMs - MS_PER_DAY;
    }
    const daysAgoMatch = normalized.match(/^(\d+)\s+days?\s+ago$/);
    if (daysAgoMatch) {
      return nowMs - Number(daysAgoMatch[1]) * MS_PER_DAY;
    }
    const parsed = Date.parse(user.joinedDate);
    if (!Number.isNaN(parsed) && parsed > 0) {
      return parsed;
    }
  }
  return nowMs;
}

interface CustomGrowthTooltipProps {
  active?: boolean;
  payload?: Array<{
    value?: number;
    dataKey?: string;
    payload?: DailyGrowthPoint;
  }>;
}

const GrowthTooltip: React.FC<CustomGrowthTooltipProps> = ({ active, payload }) => {
  if (!active || !payload || payload.length === 0 || !payload[0].payload) {
    return null;
  }
  const point = payload[0].payload;
  return (
    <div className="rounded-xl bg-[#181822] border border-white/15 px-3.5 py-2.5 shadow-2xl text-xs">
      <p className="font-semibold text-white mb-1.5">{point.fullDate}</p>
      <div className="space-y-1 tabular-nums">
        <div className="flex items-center justify-between gap-5">
          <span className="text-gray-400">Cumulative Users</span>
          <span className="font-mono font-bold text-white">{point.totalUsers.toLocaleString()}</span>
        </div>
        <div className="flex items-center justify-between gap-5">
          <span className="text-gray-400">New Signups</span>
          <span className="font-mono font-bold text-[#E50914]">
            +{point.newUsers.toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
};

interface CustomStatusTooltipProps {
  active?: boolean;
  payload?: Array<{
    payload?: StatusDatum;
  }>;
  totalUsers: number;
}

const StatusTooltip: React.FC<CustomStatusTooltipProps> = ({ active, payload, totalUsers }) => {
  if (!active || !payload || payload.length === 0 || !payload[0].payload) {
    return null;
  }
  const item = payload[0].payload;
  const pct = totalUsers > 0 ? Math.round((item.value / totalUsers) * 100) : 0;
  return (
    <div className="rounded-xl bg-[#181822] border border-white/15 px-3.5 py-2.5 shadow-2xl text-xs">
      <p className="font-semibold text-white">{item.name}</p>
      <p className="text-gray-400 mt-0.5">{item.detail}</p>
      <p className="mt-1.5 font-mono font-bold text-white tabular-nums">
        {item.value.toLocaleString()} users ({pct}%)
      </p>
    </div>
  );
};

export const AdminInsightsView: React.FC<AdminInsightsViewProps> = ({
  users,
  movies,
  tvShows,
  liveChannels,
  onOpenUsersTab,
  onOpenAddUserModal,
}) => {
  const [growthMetric, setGrowthMetric] = useState<'cumulative' | 'daily'>('cumulative');
  const [statusChartType, setStatusChartType] = useState<'donut' | 'bar'>('donut');

  const analytics = useMemo(() => {
    const nowMs = Date.now();
    const todayStart = getLocalDayStart(nowMs);
    const windowDays = 30;
    const windowStart = todayStart - (windowDays - 1) * MS_PER_DAY;

    let activeCount = 0;
    let inactiveCount = 0;
    let paidCount = 0;
    let activeTrialCount = 0;
    let expiredTrialCount = 0;
    let suspendedCount = 0;
    let priorBaselineCount = 0;
    let newLast30Days = 0;

    const dailyCounts = new Map<number, number>();
    for (let i = 0; i < windowDays; i++) {
      dailyCounts.set(windowStart + i * MS_PER_DAY, 0);
    }

    for (const user of users) {
      const trial = getUserTrialInfo(user, nowMs);
      const isSuspended = user.status === 'suspended';
      const isActiveUser = !isSuspended && !trial.isExpired;

      if (isActiveUser) {
        activeCount += 1;
        if (trial.isPaid) {
          paidCount += 1;
        } else {
          activeTrialCount += 1;
        }
      } else {
        inactiveCount += 1;
        if (isSuspended) {
          suspendedCount += 1;
        } else {
          expiredTrialCount += 1;
        }
      }

      const joinedMs = resolveUserJoinedTimestamp(user, nowMs);
      const joinedDayStart = getLocalDayStart(joinedMs);

      if (joinedDayStart < windowStart) {
        priorBaselineCount += 1;
      } else if (joinedDayStart <= todayStart) {
        dailyCounts.set(joinedDayStart, (dailyCounts.get(joinedDayStart) || 0) + 1);
        newLast30Days += 1;
      } else {
        // Clamp any future-skewed timestamp into today's bucket
        dailyCounts.set(todayStart, (dailyCounts.get(todayStart) || 0) + 1);
        newLast30Days += 1;
      }
    }

    const growthSeries: DailyGrowthPoint[] = [];
    let runningTotal = priorBaselineCount;
    let peakDayCount = 0;
    let peakDayLabel = 'None';

    for (let i = 0; i < windowDays; i++) {
      const dayMs = windowStart + i * MS_PER_DAY;
      const d = new Date(dayMs);
      const newCount = dailyCounts.get(dayMs) || 0;
      runningTotal += newCount;

      const dateLabel = d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
      const fullDate = d.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });

      if (newCount > peakDayCount) {
        peakDayCount = newCount;
        peakDayLabel = dateLabel;
      }

      growthSeries.push({
        dateKey: `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`,
        dateLabel,
        fullDate,
        newUsers: newCount,
        totalUsers: runningTotal,
      });
    }

    const totalUsers = users.length;
    const activePct = totalUsers > 0 ? Math.round((activeCount / totalUsers) * 100) : 0;
    const inactivePct = totalUsers > 0 ? 100 - activePct : 0;
    const growthRatePct =
      priorBaselineCount > 0
        ? Math.round((newLast30Days / priorBaselineCount) * 100)
        : newLast30Days > 0
          ? 100
          : 0;

    const statusData: StatusDatum[] = [
      {
        name: 'Active Users',
        shortName: 'Active',
        value: activeCount,
        color: '#16A34A',
        detail: `${paidCount} paid · ${activeTrialCount} in free trial`,
      },
      {
        name: 'Inactive Users',
        shortName: 'Inactive',
        value: inactiveCount,
        color: '#E50914',
        detail: `${suspendedCount} suspended · ${expiredTrialCount} expired trial`,
      },
    ];

    return {
      totalUsers,
      activeCount,
      inactiveCount,
      paidCount,
      activeTrialCount,
      expiredTrialCount,
      suspendedCount,
      priorBaselineCount,
      newLast30Days,
      activePct,
      inactivePct,
      growthRatePct,
      peakDayCount,
      peakDayLabel,
      growthSeries,
      statusData,
    };
  }, [users]);

  if (users.length === 0) {
    return (
      <div className="p-10 rounded-2xl bg-[#121217] border border-white/10 text-center space-y-4">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-[#E50914]/15 text-[#E50914] flex items-center justify-center">
          <TrendingUp className="w-7 h-7" />
        </div>
        <div className="space-y-1.5">
          <h3 className="text-lg font-extrabold text-white font-['Outfit']">
            No User Analytics Yet
          </h3>
          <p className="text-xs sm:text-sm text-gray-400 max-w-md mx-auto">
            30-day user growth and active vs. inactive user charts will populate automatically once
            members sign up or are added to MovieKart UG.
          </p>
        </div>
        <div className="flex items-center justify-center gap-3 pt-1">
          <button
            type="button"
            onClick={onOpenAddUserModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#E50914] hover:bg-red-700 text-white text-xs font-bold transition-colors cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add First User</span>
          </button>
          <button
            type="button"
            onClick={onOpenUsersTab}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-200 text-xs font-semibold transition-colors cursor-pointer"
          >
            <span>View Users Tab</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top KPI Summary Strip (Single Elevation, Tabular Figures) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 sm:p-5 rounded-2xl bg-[#121217] border border-white/10">
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span>Total Registered Users</span>
            <Users className="w-4 h-4 text-gray-500" />
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-white font-mono tabular-nums mt-2">
            {analytics.totalUsers.toLocaleString()}
          </p>
          <p className="text-xs text-gray-400 mt-1 tabular-nums">
            {analytics.priorBaselineCount.toLocaleString()} prior · {analytics.newLast30Days.toLocaleString()} last 30d
          </p>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-[#121217] border border-white/10">
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span>30-Day User Growth</span>
            <TrendingUp className="w-4 h-4 text-[#E50914]" />
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-white font-mono tabular-nums mt-2">
            +{analytics.newLast30Days.toLocaleString()}
          </p>
          <p className="text-xs text-gray-400 mt-1 tabular-nums">
            {analytics.growthRatePct > 0 ? `+${analytics.growthRatePct}%` : '0%'} growth · Peak {analytics.peakDayCount} ({analytics.peakDayLabel})
          </p>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-[#121217] border border-white/10">
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span>Active Users</span>
            <UserCheck className="w-4 h-4 text-[#16A34A]" />
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-[#16A34A] font-mono tabular-nums mt-2">
            {analytics.activeCount.toLocaleString()}
          </p>
          <p className="text-xs text-gray-400 mt-1 tabular-nums">
            {analytics.activePct}% of total · {analytics.paidCount} paid · {analytics.activeTrialCount} trial
          </p>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-[#121217] border border-white/10">
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span>Inactive Users</span>
            <UserX className="w-4 h-4 text-[#E50914]" />
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-[#E50914] font-mono tabular-nums mt-2">
            {analytics.inactiveCount.toLocaleString()}
          </p>
          <p className="text-xs text-gray-400 mt-1 tabular-nums">
            {analytics.inactivePct}% of total · {analytics.suspendedCount} suspended · {analytics.expiredTrialCount} expired
          </p>
        </div>
      </div>

      {/* Primary Charts Grid: 30-Day User Growth + Active vs. Inactive Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left: User Growth Over Last 30 Days */}
        <section className="lg:col-span-8 p-5 sm:p-6 rounded-2xl bg-[#121217] border border-white/10 flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
            <div>
              <h3 className="text-base sm:text-lg font-extrabold text-white font-['Outfit']">
                User Growth (Last 30 Days)
              </h3>
              <p className="text-xs text-gray-400 mt-0.5 tabular-nums">
                {growthMetric === 'cumulative'
                  ? `Cumulative registered accounts reaching ${analytics.totalUsers.toLocaleString()} users`
                  : `${analytics.newLast30Days.toLocaleString()} new signups recorded across the last 30 days`}
              </p>
            </div>

            <div
              role="group"
              aria-label="Growth chart metric"
              className="inline-flex items-center p-1 rounded-xl bg-[#0a0a0f] border border-white/10 self-start sm:self-auto"
            >
              <button
                type="button"
                onClick={() => setGrowthMetric('cumulative')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  growthMetric === 'cumulative'
                    ? 'bg-[#E50914] text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Cumulative Total
              </button>
              <button
                type="button"
                onClick={() => setGrowthMetric('daily')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  growthMetric === 'daily'
                    ? 'bg-[#E50914] text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Daily Signups
              </button>
            </div>
          </div>

          <div className="w-full h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              {growthMetric === 'cumulative' ? (
                <AreaChart
                  data={analytics.growthSeries}
                  margin={{ top: 10, right: 12, left: -12, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="moviekartGrowthGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#E50914" stopOpacity={0.38} />
                      <stop offset="95%" stopColor="#E50914" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                  <XAxis
                    dataKey="dateLabel"
                    stroke="#71717a"
                    tick={{ fill: '#9ca3af', fontSize: 11 }}
                    tickLine={false}
                    axisLine={{ stroke: 'rgba(255,255,255,0.08)' }}
                    interval={4}
                  />
                  <YAxis
                    allowDecimals={false}
                    stroke="#71717a"
                    tick={{ fill: '#9ca3af', fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    content={<GrowthTooltip />}
                    cursor={{ stroke: 'rgba(229,9,20,0.45)', strokeWidth: 1 }}
                  />
                  <Area
                    type="monotone"
                    dataKey="totalUsers"
                    name="Total Users"
                    stroke="#E50914"
                    strokeWidth={2.5}
                    fill="url(#moviekartGrowthGradient)"
                    activeDot={{ r: 5, fill: '#E50914', stroke: '#ffffff', strokeWidth: 2 }}
                  />
                </AreaChart>
              ) : (
                <BarChart
                  data={analytics.growthSeries}
                  margin={{ top: 10, right: 12, left: -12, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                  <XAxis
                    dataKey="dateLabel"
                    stroke="#71717a"
                    tick={{ fill: '#9ca3af', fontSize: 11 }}
                    tickLine={false}
                    axisLine={{ stroke: 'rgba(255,255,255,0.08)' }}
                    interval={4}
                  />
                  <YAxis
                    allowDecimals={false}
                    stroke="#71717a"
                    tick={{ fill: '#9ca3af', fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    content={<GrowthTooltip />}
                    cursor={{ fill: 'rgba(255,255,255,0.04)' }}
                  />
                  <Bar
                    dataKey="newUsers"
                    name="New Signups"
                    fill="#E50914"
                    radius={[5, 5, 0, 0]}
                    maxBarSize={20}
                  />
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
        </section>

        {/* Right: Active vs. Inactive Users Breakdown */}
        <section className="lg:col-span-4 p-5 sm:p-6 rounded-2xl bg-[#121217] border border-white/10 flex flex-col justify-between">
          <div className="flex items-start justify-between gap-2 mb-4">
            <div>
              <h3 className="text-base sm:text-lg font-extrabold text-white font-['Outfit']">
                Active vs. Inactive
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">
                Current member access status
              </p>
            </div>

            <div
              role="group"
              aria-label="Status chart view"
              className="inline-flex items-center p-1 rounded-xl bg-[#0a0a0f] border border-white/10 shrink-0"
            >
              <button
                type="button"
                onClick={() => setStatusChartType('donut')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  statusChartType === 'donut'
                    ? 'bg-[#E50914] text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Donut
              </button>
              <button
                type="button"
                onClick={() => setStatusChartType('bar')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  statusChartType === 'bar'
                    ? 'bg-[#E50914] text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Bar
              </button>
            </div>
          </div>

          <div className="relative w-full h-[210px]">
            <ResponsiveContainer width="100%" height="100%">
              {statusChartType === 'donut' ? (
                <PieChart>
                  <Pie
                    data={analytics.statusData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={58}
                    outerRadius={84}
                    paddingAngle={analytics.activeCount > 0 && analytics.inactiveCount > 0 ? 4 : 0}
                    stroke="none"
                  >
                    {analytics.statusData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<StatusTooltip totalUsers={analytics.totalUsers} />} />
                </PieChart>
              ) : (
                <BarChart
                  data={analytics.statusData}
                  margin={{ top: 12, right: 12, left: -16, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                  <XAxis
                    dataKey="shortName"
                    stroke="#71717a"
                    tick={{ fill: '#d1d5db', fontSize: 12 }}
                    tickLine={false}
                    axisLine={{ stroke: 'rgba(255,255,255,0.08)' }}
                  />
                  <YAxis
                    allowDecimals={false}
                    stroke="#71717a"
                    tick={{ fill: '#9ca3af', fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    content={<StatusTooltip totalUsers={analytics.totalUsers} />}
                    cursor={{ fill: 'rgba(255,255,255,0.04)' }}
                  />
                  <Bar dataKey="value" radius={[8, 8, 0, 0]} maxBarSize={54}>
                    {analytics.statusData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              )}
            </ResponsiveContainer>

            {statusChartType === 'donut' && (
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-extrabold text-white font-mono tabular-nums">
                  {analytics.activePct}%
                </span>
                <span className="text-[11px] font-medium text-gray-400">Active</span>
              </div>
            )}
          </div>

          {/* Crisp Tabular Legend Breakdown */}
          <div className="mt-4 pt-4 border-t border-white/10 space-y-3">
            {analytics.statusData.map((item) => {
              const pct =
                analytics.totalUsers > 0 ? Math.round((item.value / analytics.totalUsers) * 100) : 0;
              return (
                <div key={item.name} className="flex items-center justify-between gap-3 text-xs">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-sm shrink-0"
                        style={{ backgroundColor: item.color }}
                        aria-hidden="true"
                      />
                      <span className="font-semibold text-white">{item.name}</span>
                    </div>
                    <p className="text-[11px] text-gray-400 pl-4.5 mt-0.5 truncate">
                      {item.detail}
                    </p>
                  </div>
                  <div className="text-right shrink-0 font-mono tabular-nums">
                    <span className="font-bold text-white">{item.value.toLocaleString()}</span>
                    <span className="text-gray-400 ml-1.5">({pct}%)</span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      {/* Live Firestore Catalog & Storage Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <section className="p-5 sm:p-6 rounded-2xl bg-[#121217] border border-white/10 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white font-['Outfit']">
              Live Firestore Catalog Summary
            </h3>
            <button
              type="button"
              onClick={onOpenUsersTab}
              className="text-xs font-semibold text-red-400 hover:text-red-300 transition-colors cursor-pointer"
            >
              Manage Users
            </button>
          </div>
          <p className="text-xs text-gray-400">
            Real-time counts synchronized across your Firestore catalog and user collections.
          </p>
          <div className="grid grid-cols-3 gap-4 pt-3 border-t border-white/5">
            <div>
              <p className="text-xs text-gray-400 flex items-center gap-1.5">
                <Film className="w-3.5 h-3.5 text-[#E50914]" />
                <span>Movies</span>
              </p>
              <p className="text-xl font-bold text-white font-mono tabular-nums mt-1">
                {movies.length.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400 flex items-center gap-1.5">
                <Tv className="w-3.5 h-3.5 text-[#E50914]" />
                <span>TV Shows</span>
              </p>
              <p className="text-xl font-bold text-white font-mono tabular-nums mt-1">
                {tvShows.length.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400 flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 text-[#E50914]" />
                <span>Live TV</span>
              </p>
              <p className="text-xl font-bold text-white font-mono tabular-nums mt-1">
                {liveChannels.length.toLocaleString()}
              </p>
            </div>
          </div>
        </section>

        <section className="p-5 sm:p-6 rounded-2xl bg-[#121217] border border-white/10 space-y-4">
          <h3 className="text-sm font-bold text-white font-['Outfit']">
            Firebase Storage Media Pipeline
          </h3>
          <p className="text-xs text-gray-400 leading-relaxed">
            Posters are stored in <code className="text-red-400">posters/</code> and video streams in{' '}
            <code className="text-red-400">videos/</code> inside{' '}
            <code className="text-gray-200">moviekart-ug.firebasestorage.app</code>.
          </p>
          <div className="pt-3 border-t border-white/5 flex items-center justify-between text-xs">
            <span className="text-gray-400 flex items-center gap-1.5">
              <HardDrive className="w-4 h-4 text-[#E50914]" />
              <span>Storage Pipeline</span>
            </span>
            <span className="text-[#16A34A] font-semibold">Connected</span>
          </div>
        </section>
      </div>
    </div>
  );
};
