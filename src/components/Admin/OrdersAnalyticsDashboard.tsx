import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import {
  PieChart as PieIcon,
  BarChart2,
  TrendingUp,
  Truck,
  CheckCircle,
  Clock,
  AlertTriangle,
  Package,
  Layers,
} from 'lucide-react';
import { StagedOrder } from '../../types';

interface OrdersAnalyticsDashboardProps {
  orders: StagedOrder[];
}

// Colors for status charts
const STATUS_COLORS: Record<string, string> = {
  'מאושר': '#3b82f6', // blue
  'נקלט ב-SabanOS': '#f59e0b', // amber
  'בטיפול לוגיסטי': '#06b6d4', // cyan
  'יצא לדרך': '#a855f7', // purple
  'סופק': '#10b981', // emerald
  'חורג': '#ef4444', // red
  'לא סופק': '#f43f5e', // rose
};

const DEFAULT_COLOR = '#64748b';

export const OrdersAnalyticsDashboard: React.FC<OrdersAnalyticsDashboardProps> = ({ orders }) => {
  // Aggregate order status distribution
  const statusCounts: Record<string, number> = {};
  const driverCounts: Record<string, number> = {};

  orders.forEach((ord) => {
    const st = ord.status || 'נקלט ב-SabanOS';
    statusCounts[st] = (statusCounts[st] || 0) + 1;

    const drv = ord.driverName && ord.driverName.trim() !== '' ? ord.driverName : 'טרם שובץ';
    // Shorten driver name for chart
    const drvShort = drv.split('-')[0].trim();
    driverCounts[drvShort] = (driverCounts[drvShort] || 0) + 1;
  });

  // Data for Status Bar Chart
  const statusBarData = Object.keys(statusCounts).map((status) => ({
    name: status,
    count: statusCounts[status],
    fill: STATUS_COLORS[status] || DEFAULT_COLOR,
  }));

  // Data for Status Pie Chart
  const statusPieData = Object.keys(statusCounts).map((status) => ({
    name: status,
    value: statusCounts[status],
  }));

  // Data for Driver Distribution Chart
  const driverBarData = Object.keys(driverCounts).map((driver) => ({
    driver,
    orders: driverCounts[driver],
  }));

  // Key metrics
  const totalOrders = orders.length;
  const deliveredCount = statusCounts['סופק'] || 0;
  const inTransitCount = statusCounts['יצא לדרך'] || 0;
  const pendingCount = (statusCounts['נקלט ב-SabanOS'] || 0) + (statusCounts['מאושר'] || 0) + (statusCounts['בטיפול לוגיסטי'] || 0);
  const totalValue = orders.reduce((sum, o) => sum + (o.totalPrice || 0), 0);
  const deliveryRate = totalOrders > 0 ? Math.round((deliveredCount / totalOrders) * 100) : 0;

  return (
    <div className="bg-[#0f172a] rounded-3xl border border-[#334155] p-5 shadow-2xl space-y-6 dir-rtl font-sans text-slate-100">
      
      {/* Dashboard Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#334155] pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl text-white shadow-lg">
            <BarChart2 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-white flex items-center gap-2">
              דשבורד אנליטיקת סידור עבודה & ביצועים (Recharts Live Analytics)
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              פילוג סטטוסים בלייב, הקצאות נהגים ואחוזי אספקה יומיים
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-[#1e293b] px-3.5 py-1.5 rounded-2xl border border-[#334155] shrink-0">
          <Layers className="w-4 h-4 text-[#00a884]" />
          <span className="text-xs font-bold text-slate-300">סה"כ הזמנות במערכת:</span>
          <span className="text-sm font-black text-amber-400 font-mono">{totalOrders}</span>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-[#1e293b]/80 p-3.5 rounded-2xl border border-[#334155] flex flex-col justify-between space-y-1 shadow">
          <span className="text-[11px] text-slate-400 font-semibold flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            ממתינות / בטיפול
          </span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-xl font-black text-amber-400 font-mono">{pendingCount}</span>
            <span className="text-[10px] text-slate-400 font-mono">
              {totalOrders > 0 ? Math.round((pendingCount / totalOrders) * 100) : 0}% מסה"כ
            </span>
          </div>
        </div>

        <div className="bg-[#1e293b]/80 p-3.5 rounded-2xl border border-[#334155] flex flex-col justify-between space-y-1 shadow">
          <span className="text-[11px] text-slate-400 font-semibold flex items-center gap-1.5">
            <Truck className="w-3.5 h-3.5 text-purple-400" />
            יצאו להובלה (בדרך)
          </span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-xl font-black text-purple-300 font-mono">{inTransitCount}</span>
            <span className="text-[10px] text-slate-400 font-mono">
              {totalOrders > 0 ? Math.round((inTransitCount / totalOrders) * 100) : 0}% מסה"כ
            </span>
          </div>
        </div>

        <div className="bg-[#1e293b]/80 p-3.5 rounded-2xl border border-[#334155] flex flex-col justify-between space-y-1 shadow">
          <span className="text-[11px] text-slate-400 font-semibold flex items-center gap-1.5">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
            סופקו בהצלחה
          </span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-xl font-black text-emerald-400 font-mono">{deliveredCount}</span>
            <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded font-mono font-bold">
              {deliveryRate}% הצלחה
            </span>
          </div>
        </div>

        <div className="bg-[#1e293b]/80 p-3.5 rounded-2xl border border-[#334155] flex flex-col justify-between space-y-1 shadow">
          <span className="text-[11px] text-slate-400 font-semibold flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-indigo-400" />
            שווי כספי כולל
          </span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-lg font-black text-indigo-300 font-mono">
              ₪{totalValue.toLocaleString()}
            </span>
            <span className="text-[10px] text-slate-400">משוער</span>
          </div>
        </div>
      </div>

      {/* Interactive Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Chart 1: Status Distribution Bar Chart (7 cols) */}
        <div className="lg:col-span-7 bg-[#1e293b]/60 p-4 rounded-2xl border border-[#334155] flex flex-col justify-between shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold text-slate-200 flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-indigo-400" />
              <span>התפלגות הזמנות לפי סטטוס נוכחי</span>
            </h3>
            <span className="text-[10px] text-slate-400 font-mono">השוואה כמותית</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusBarData} margin={{ top: 10, right: 10, left: -20, bottom: 25 }}>
                <XAxis
                  dataKey="name"
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                  interval={0}
                  angle={-15}
                  textAnchor="end"
                />
                <YAxis stroke="#94a3b8" fontSize={11} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '12px',
                    fontSize: '12px',
                    color: '#fff',
                  }}
                  formatter={(value: any) => [`${value} הזמנות`, 'כמות']}
                />
                <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                  {statusBarData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Status Proportion Pie Chart (5 cols) */}
        <div className="lg:col-span-5 bg-[#1e293b]/60 p-4 rounded-2xl border border-[#334155] flex flex-col justify-between shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold text-slate-200 flex items-center gap-2">
              <PieIcon className="w-4 h-4 text-emerald-400" />
              <span>אחוזי התפלגות סטטוסים</span>
            </h3>
            <span className="text-[10px] text-slate-400 font-mono">Pie View</span>
          </div>

          <div className="h-64 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {statusPieData.map((entry, index) => (
                    <Cell
                      key={`pie-cell-${index}`}
                      fill={STATUS_COLORS[entry.name] || DEFAULT_COLOR}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '12px',
                    fontSize: '12px',
                    color: '#fff',
                  }}
                  formatter={(value: any) => [`${value} הזמנות`, 'כמות']}
                />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  wrapperStyle={{ fontSize: '10px', color: '#cbd5e1' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Chart 3: Driver Load Breakdown */}
      <div className="bg-[#1e293b]/60 p-4 rounded-2xl border border-[#334155] shadow-lg">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold text-slate-200 flex items-center gap-2">
            <Truck className="w-4 h-4 text-purple-400" />
            <span>חלוקת עומס הובלות לפי נהגים משויכים</span>
          </h3>
          <span className="text-[10px] text-slate-400">משאיות ומנופים</span>
        </div>

        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={driverBarData} margin={{ top: 10, right: 10, left: -20, bottom: 10 }}>
              <XAxis dataKey="driver" stroke="#94a3b8" fontSize={11} tickLine={false} />
              <YAxis stroke="#94a3b8" fontSize={11} allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  borderColor: '#334155',
                  borderRadius: '12px',
                  fontSize: '12px',
                  color: '#fff',
                }}
                formatter={(value: any) => [`${value} הובלות`, 'משויך לנהג']}
              />
              <Bar dataKey="orders" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
};
