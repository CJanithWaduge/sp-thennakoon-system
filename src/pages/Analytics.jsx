import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell,
} from 'recharts';
import {
  TrendingUp, CreditCard, DollarSign,
  ChevronDown, Filter, Target, Info
} from 'lucide-react';
import { formatCurrency } from '../utils/calculations';

// Senior Expert Theme Constants
// Senior Expert Theme Logic
const getThemeColors = (isDarkMode) => ({
  sales: '#06b6d4',       // Cyan
  collections: '#10b981', // Emerald
  debtRecent: isDarkMode ? '#facc15' : '#eab308',  // Yellow
  debtDue: isDarkMode ? '#f97316' : '#f97316',     // Orange
  debtCritical: '#dc2626', // Red
  profit: '#8b5cf6',      // Violet
  grid: isDarkMode ? '#2d2d2d' : '#e2e8f0',
  cardBg: isDarkMode ? '#1e1e1e' : '#ffffff',
  textMain: isDarkMode ? '#f8fafc' : '#0f172a',
  textLight: isDarkMode ? '#94a3b8' : '#64748b'
});

const RevealSection = ({ children, delay = 0 }) => {
  const [isVisible, setIsVisible] = useState(false);
  const domRef = useRef();

  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target); // Only animate once
        }
      });
    }, { threshold: 0.1 });

    const currentRef = domRef.current;
    if (currentRef) observer.observe(currentRef);

    return () => {
      if (currentRef) observer.unobserve(currentRef);
    };
  }, []);

  return (
    <div
      ref={domRef}
      className={`reveal-on-scroll ${isVisible ? 'visible' : ''}`}
      style={{ transitionDelay: `${delay}ms`, display: 'flex', flexDirection: 'column' }}
    >
      {children}
    </div>
  );
};

// Memoized Custom Tooltip Component
const CustomTooltip = React.memo(({ active, payload, label, colors, formatCurrency: formatter }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ backgroundColor: colors.cardBg, border: `1px solid ${colors.grid}`, padding: '12px', borderRadius: '8px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.5)' }}>
        <p style={{ margin: '0 0 5px 0', fontSize: '12px', fontWeight: 'bold', color: colors.textMain }}>{label || payload[0].name}</p>
        {payload.map((entry, index) => (
          <div key={index} style={{ display: 'flex', justifyContent: 'space-between', gap: '20px', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', color: entry.color }}>{entry.name}:</span>
            <span style={{ fontSize: '12px', fontWeight: '800', color: colors.textMain }}>Rs. {formatter(entry.value)}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
});

const Analytics = ({
  salesHistory = [],
  routes = [],
  isDarkMode = true
}) => {
  const [selectedRoute, setSelectedRoute] = useState(() => {
    const saved = localStorage.getItem('samindu_analytics_selected_route');
    return saved || 'All';
  });
  const [timeRange, setTimeRange] = useState(() => {
    const saved = localStorage.getItem('samindu_analytics_time_range');
    return saved || 'This Month';
  });
  const COLORS = useMemo(() => getThemeColors(isDarkMode), [isDarkMode]);

  // Logic: Filtering Sales specifically for the selected window
  const filteredSales = useMemo(() => {
    let sales = [...salesHistory];

    if (selectedRoute !== 'All') {
      sales = sales.filter(s => s.routeName === selectedRoute);
    }

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

    if (timeRange === 'Today') {
      sales = sales.filter(s => new Date(s.date).getTime() >= today);
    } else if (timeRange === 'This Week') {
      const lastWeek = today - (7 * 24 * 60 * 60 * 1000);
      sales = sales.filter(s => new Date(s.date).getTime() >= lastWeek);
    } else if (timeRange === 'This Month') {
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
      sales = sales.filter(s => new Date(s.date).getTime() >= firstDayOfMonth);
    }

    return sales;
  }, [salesHistory, selectedRoute, timeRange]);

  // Requirement 1: Debt Aging Donut Logic
  const debtAgingData = useMemo(() => {
    const nowTimestamp = new Date().getTime();
    const ages = [
      { name: 'Recent (0-7d)', value: 0, color: COLORS.debtRecent },
      { name: 'Due (8-30d)', value: 0, color: COLORS.debtDue },
      { name: 'Critical (30d+)', value: 0, color: COLORS.debtCritical },
    ];

    filteredSales.forEach(invoice => {
      if (invoice.isCredit) {
        const remaining = invoice.totalBill - (invoice.paidAmount || 0);
        if (remaining > 0) {
          const ageInDays = (nowTimestamp - new Date(invoice.date).getTime()) / (1000 * 60 * 60 * 24);
          if (ageInDays <= 7) ages[0].value += remaining;
          else if (ageInDays <= 30) ages[1].value += remaining;
          else ages[2].value += remaining;
        }
      }
    });
    return ages.filter(a => a.value > 0);
  }, [filteredSales, COLORS]);

  // Requirement 2: Route Performance Grouped Bar Logic
  const routePerformanceData = useMemo(() => {
    const stats = {};
    routes.forEach(r => stats[r] = { name: r, sales: 0, collections: 0 });

    // We use all sales history to show comparative route scale, or filtered?
    // Requirement 2 implies comparison across routes for the window
    filteredSales.forEach(s => {
      if (stats[s.routeName]) {
        stats[s.routeName].sales += s.totalBill;
        stats[s.routeName].collections += (s.paidAmount || 0);
      }
    });

    return Object.values(stats);
  }, [filteredSales, routes]);

  // Requirement 3: Collection Rate Logic
  const collectionRate = useMemo(() => {
    const totalSales = filteredSales.reduce((acc, s) => acc + s.totalBill, 0);
    const totalPaid = filteredSales.reduce((acc, s) => acc + (s.paidAmount || 0), 0);
    if (totalSales === 0) return 0;
    return (totalPaid / totalSales) * 100;
  }, [filteredSales]);

   const metrics = useMemo(() => {
    const totalSales = filteredSales.reduce((acc, s) => acc + s.totalBill, 0);
    const totalPaid = filteredSales.reduce((acc, s) => acc + (s.paidAmount || 0), 0);
    const totalDebt = filteredSales.reduce((acc, s) => s.isCredit ? acc + (s.totalBill - (s.paidAmount || 0)) : acc, 0);
    return { totalSales, totalPaid, totalDebt };
  }, [filteredSales]);

  return (
    <div style={{ padding: '32px 12px', width: '98%', maxWidth: '1600px', margin: '0 auto', color: COLORS.textMain }}>

      {/* Refined Header Section */}
       <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', flexWrap: 'wrap', gap: '20px' }}>
        <div>
          <h1 style={{ fontSize: '30px', fontWeight: '800', margin: 0, letterSpacing: '-0.5px' }}>Business Intelligence</h1>
          <p style={{ margin: '4px 0 0 0', color: COLORS.textLight, fontSize: '14px' }}>Deep analytical insights for {timeRange.toLowerCase()}</p>
          <p style={{
            margin: '2px 0 0 0',
            color: COLORS.sales,
            fontSize: '10px',
            fontWeight: '600',
            letterSpacing: '0.5px',
            opacity: 0.8
          }}>
            Financial Insights Engine by W2 Tech Solutions
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          {/* Enhanced Filters */}
          <div style={{ display: 'flex', background: COLORS.cardBg, border: `1px solid ${COLORS.grid}`, borderRadius: '10px', padding: '4px' }}>
                {['Today', 'This Week', 'This Month'].map(range => (
                <button
                  key={range}
                  onClick={() => {
                    setTimeRange(range);
                    localStorage.setItem('samindu_analytics_time_range', range);
                  }}
                  style={{
                    padding: '6px 16px',
                    borderRadius: '7px',
                    fontSize: '12px',
                    fontWeight: '600',
                    border: 'none',
                    cursor: 'pointer',
                    transition: '0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    background: timeRange === range ? COLORS.sales : 'transparent',
                    color: timeRange === range ? '#fff' : COLORS.textLight
                  }}
                >
                  {range}
                </button>
              ))}
          </div>

          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', background: COLORS.cardBg, border: `1px solid ${COLORS.grid}`, padding: '8px 16px', borderRadius: '10px' }}>
            <Filter size={16} color={COLORS.sales} style={{ marginRight: '8px' }} />
            <select
              value={selectedRoute}
              onChange={(e) => {
                const newRoute = e.target.value;
                setSelectedRoute(newRoute);
                localStorage.setItem('samindu_analytics_selected_route', newRoute);
              }}
              style={{ background: 'transparent', border: 'none', color: COLORS.textMain, fontSize: '13px', fontWeight: '600', outline: 'none', cursor: 'pointer', appearance: 'none', paddingRight: '20px' }}
            >
              <option value="All" style={{ background: COLORS.cardBg, color: COLORS.textMain }}>All Regions</option>
              {routes.map(r => <option key={r} value={r} style={{ background: COLORS.cardBg, color: COLORS.textMain }}>{r}</option>)}
            </select>
            <ChevronDown size={14} style={{ position: 'absolute', right: '12px', pointerEvents: 'none', opacity: 0.6 }} />
          </div>
        </div>
      </div>

      {/* Requirement 3: Collection Rate Gauge & Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))', gap: '32px', marginBottom: '48px', alignItems: 'stretch' }}>

        {/* Gauge Card */}
        <RevealSection delay={100}>
          <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '20px', background: COLORS.cardBg, flex: 1, minHeight: '160px' }}>
            <div style={{ position: 'relative', width: '100px', height: '100px' }}>
              <svg viewBox="0 0 36 36" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none" stroke={COLORS.grid} strokeWidth="3"
                />
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke={collectionRate < 80 ? COLORS.debtDue : COLORS.collections}
                  strokeWidth="3"
                  strokeDasharray={`${collectionRate}, 100`}
                  style={{ transition: 'stroke-dasharray 1s cubic-bezier(0.4, 0, 0.2, 1)' }}
                />
                {/* Target Line at 80% */}
                <circle cx="18" cy="18" r="15.9155" fill="none" stroke={isDarkMode ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.1)"} strokeWidth="0.5" strokeDasharray="1, 99" style={{ transform: 'rotate(288deg)', transformOrigin: 'center' }} />
              </svg>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
                <span style={{ fontSize: '18px', fontWeight: '800' }}>{Math.round(collectionRate)}%</span>
              </div>
            </div>
            <div>
              <h4 style={{ margin: 0, fontSize: '13px', color: COLORS.textLight, display: 'flex', alignItems: 'center', gap: '5px' }}>
                Collection Rate <Target size={14} color={COLORS.sales} />
              </h4>
              <p style={{ margin: '4px 0 0 0', fontSize: '11px', color: collectionRate < 80 ? COLORS.debtDue : COLORS.collections }}>
                {collectionRate < 80 ? 'Below 80% Target' : 'Healthy Recovery'}
              </p>
            </div>
          </div>
        </RevealSection>

        <RevealSection delay={200}>
          <ExpertMetricCard title="Total Revenue" value={metrics.totalSales} icon={<TrendingUp size={20} color={COLORS.sales} />} isDarkMode={isDarkMode} />
        </RevealSection>

        <RevealSection delay={300}>
          <ExpertMetricCard title="Actual Collections" value={metrics.totalPaid} icon={<DollarSign size={20} color={COLORS.collections} />} isDarkMode={isDarkMode} />
        </RevealSection>

        <RevealSection delay={400}>
          <ExpertMetricCard title="Outstanding Balances" value={metrics.totalDebt} icon={<CreditCard size={20} color={COLORS.debtCritical} />} isDarkMode={isDarkMode} />
        </RevealSection>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))', gap: '32px' }}>

        {/* Requirement 1: Debt Aging Refactor */}
        <RevealSection delay={500}>
          <div className="card" style={{ background: COLORS.cardBg, borderColor: COLORS.grid, flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700' }}>Debt Aging Profile</h3>
                <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: COLORS.textLight }}>Risk exposure by payment delay</p>
              </div>
              <Info size={18} color={COLORS.textLight} opacity={0.5} />
            </div>
            <div style={{ height: '300px', position: 'relative' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={debtAgingData}
                    cx="50%" cy="50%"
                    innerRadius={75} outerRadius={105}
                    paddingAngle={8}
                    dataKey="value"
                    animationDuration={1500}
                  >
                    {debtAgingData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip colors={COLORS} formatCurrency={formatCurrency} />} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                <span style={{ fontSize: '12px', color: COLORS.textLight }}>Total Risk</span>
                <span style={{ fontSize: '20px', fontWeight: '800' }}>Rs. {formatCurrency(metrics.totalDebt)}</span>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginTop: '10px' }}>
              {debtAgingData.map((item, id) => (
                <div key={id} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: item.color }}></div>
                  <span style={{ fontSize: '11px', color: COLORS.textLight }}>{item.name}</span>
                </div>
              ))}
            </div>
          </div>
        </RevealSection>

        {/* Requirement 2: Route Performance Refactor */}
        <RevealSection delay={600}>
          <div className="card" style={{ background: COLORS.cardBg, borderColor: COLORS.grid, flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700' }}>Regional Efficiency</h3>
                <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: COLORS.textLight }}>Revenue vs Physical Collections by Route</p>
              </div>
              <div style={{ display: 'flex', gap: '15px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: '8px', height: '8px', borderRadius: '2px', background: COLORS.sales }}></div><span style={{ fontSize: '11px', color: COLORS.textLight }}>Sales</span></div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: '8px', height: '8px', borderRadius: '2px', background: COLORS.collections }}></div><span style={{ fontSize: '11px', color: COLORS.textLight }}>Paid</span></div>
              </div>
            </div>
            <div style={{ height: '320px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={routePerformanceData} margin={{ left: -10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={COLORS.grid} vertical={false} />
                  <XAxis dataKey="name" stroke={COLORS.textLight} fontSize={11} tickLine={false} axisLine={false} tick={{ dy: 10 }} />
                  <YAxis stroke={COLORS.textLight} fontSize={11} tickLine={false} axisLine={false} tickFormatter={(val) => `${val / 1000}k`} />
                  <Tooltip content={<CustomTooltip colors={COLORS} formatCurrency={formatCurrency} />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                  <Bar name="Total Sales" dataKey="sales" fill={COLORS.sales} radius={[4, 4, 0, 0]} barSize={16} />
                  <Bar name="Actual Collections" dataKey="collections" fill={COLORS.collections} radius={[4, 4, 0, 0]} barSize={16} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </RevealSection>
      </div>

      {/* Historical Context Section (Replaces simple Monthly bar) */}
      <RevealSection delay={700}>
        <div style={{ marginTop: '60px', padding: '32px', background: 'linear-gradient(135deg, rgba(6,182,212,0.08) 0%, rgba(139,92,246,0.08) 100%)', borderRadius: '20px', border: `1px solid ${COLORS.grid}`, overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
            <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '800' }}>Collection Trend Analysis</h3>
            <span style={{ fontSize: '12px', color: COLORS.sales, fontWeight: 'bold', background: 'rgba(6,182,212,0.15)', padding: '6px 16px', borderRadius: '20px', border: `1px solid ${COLORS.sales}33` }}>Historical Benchmark</span>
          </div>
          <div style={{ height: '240px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={routePerformanceData.length > 0 ? routePerformanceData : [{ name: 'Jan', sales: 4000, collections: 2400 }]}>
                <defs>
                  <linearGradient id="expertSales" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={COLORS.sales} stopOpacity={0.2} /><stop offset="95%" stopColor={COLORS.sales} stopOpacity={0} /></linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={COLORS.grid} vertical={false} />
                <XAxis dataKey="name" stroke={COLORS.textLight} fontSize={11} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip colors={COLORS} formatCurrency={formatCurrency} />} />
                <Area type="monotone" dataKey="sales" name="Sales Growth" stroke={COLORS.sales} fill="url(#expertSales)" strokeWidth={3} />
                <Area type="monotone" dataKey="collections" name="Collection Flow" stroke={COLORS.collections} fill="none" strokeWidth={2} strokeDasharray="5 5" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </RevealSection>
    </div>
  );
};

const ExpertMetricCard = ({ title, value, icon, isDarkMode = true }) => {
  const COLORS = getThemeColors(isDarkMode);
  return (
    <div className="card expert-card" style={{ background: COLORS.cardBg, padding: '24px', border: `1px solid ${COLORS.grid}`, position: 'relative', overflow: 'hidden', flex: 1, minHeight: '160px' }}>
      <div className="background-icon" style={{ position: 'absolute', top: '-10px', right: '-10px', opacity: isDarkMode ? 0.1 : 0.05, transition: 'all 0.5s ease-out' }}>
        {React.cloneElement(icon, { size: 80 })}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
        <div style={{ background: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)', padding: '10px', borderRadius: '12px' }}>
          {icon}
        </div>
      </div>
      <h4 style={{ margin: 0, fontSize: '13px', color: COLORS.textLight, fontWeight: '500' }}>{title}</h4>
      <h3 style={{ margin: '4px 0 0 0', fontSize: '24px', fontWeight: '800', color: COLORS.textMain }}>Rs. {formatCurrency(value)}</h3>
    </div>
  );
};

export default Analytics;
