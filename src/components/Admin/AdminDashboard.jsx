import React, { useMemo, useState } from 'react';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  Title, 
  Tooltip, 
  Legend, 
  ArcElement,
  PointElement,
  LineElement
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { 
  TrendingUp, 
  Wallet, 
  Package, 
  AlertCircle, 
  Clock, 
  ArrowUpRight, 
  Edit2,
  X,
  Users
} from 'lucide-react';
import { ref, onValue, get } from 'firebase/database';
import { db } from '../../firebase/config';
import { useHistory } from '../../context/HistoryContext';
import { useInventory } from '../../context/InventoryContext';
import { useEvents } from '../../context/EventsContext';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const AdminDashboard = ({ branchId = "all", range = "day", selectedDate = new Date() }) => {
  const { sales: rawSales, gastos: rawGastos, branches, updateBranchGoal } = useHistory();
  const { ingredients } = useInventory();
  const { events } = useEvents();
  const [editingGoalBranchId, setEditingGoalBranchId] = useState(null);
  const [goalInputValue, setGoalInputValue] = useState("");
  const [onlineUsers, setOnlineUsers] = useState([]);
  
  // Presence & User Validation Listener
  React.useEffect(() => {
    const presenceRef = ref(db, 'presence');
    const usersRef = ref(db, 'users');
    const unsubscribe = onValue(presenceRef, (pSnapshot) => {
      const pData = pSnapshot.val() || {};
      get(usersRef).then((uSnapshot) => {
        const uData = uSnapshot.val() || {};
        const active = Object.entries(pData)
          .map(([uid, u]) => ({ uid, ...u }))
          .filter(u => u.online === true && u.name && uData[u.uid])
          .sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        setOnlineUsers(active);
      });
    });
    return () => unsubscribe();
  }, []);

  const targetISO = selectedDate.toLocaleDateString('en-CA');
  
  const getMonday = (d) => {
    const date = new Date(d);
    date.setHours(0,0,0,0);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(date.setDate(diff));
  };

  const isInRange = (ts) => {
    if (!ts) return false;
    const d = new Date(ts);
    const dISO = d.toLocaleDateString('en-CA');
    if (range === 'day') return dISO === targetISO;
    if (range === 'week') {
      const start = getMonday(selectedDate);
      const end = new Date(start); 
      end.setDate(end.getDate() + 7);
      return d >= start && d < end;
    }
    if (range === 'month') return d.getMonth() === selectedDate.getMonth() && d.getFullYear() === selectedDate.getFullYear();
    if (range === 'year') return d.getFullYear() === selectedDate.getFullYear();
    return false;
  };

  const getSuggestedGoal = (bId) => {
    const bSales = branches[bId]?.sales || [];
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
    const recentSales = bSales.filter(s => s.ts >= thirtyDaysAgo);
    if (recentSales.length === 0) return 5000;
    const dailyTotals = {};
    recentSales.forEach(s => {
      const d = new Date(s.ts).toLocaleDateString();
      dailyTotals[d] = (dailyTotals[d] || 0) + (s.amount || 0);
    });
    const days = Object.keys(dailyTotals).length;
    const total = Object.values(dailyTotals).reduce((a, b) => a + b, 0);
    return Math.round(total / days);
  };

  const getISODate = (date) => new Date(date).toLocaleDateString('en-CA');

  const stats = useMemo(() => {
    let totalVentas = 0;
    let totalGastos = 0;
    let totalCogs = 0;
    let numVentas = 0;
    const branchSummaries = [];

    const branchesToProcess = branchId === 'all' 
      ? Object.values(branches).filter(b => b.id !== 'cidop')
      : Object.values(branches).filter(b => b.id === branchId && b.id !== 'cidop');

    branchesToProcess.forEach(branch => {
      const bFilteredSales = (branch.sales || []).filter(s => !s.isEvento && isInRange(s.ts));
      const bFilteredGastos = (branch.gastos || []).filter(g => isInRange(g.ts));

      const bSalesTotal = bFilteredSales.reduce((acc, s) => acc + (s.amount || 0), 0);
      const bGastosTotal = bFilteredGastos.reduce((acc, g) => acc + (g.amount || 0), 0);
      const bCogsTotal = bFilteredSales.reduce((acc, s) => acc + (s.totalCogs || 0), 0);
      
      totalVentas += bSalesTotal;
      totalGastos += bGastosTotal;
      totalCogs += bCogsTotal;
      numVentas += bFilteredSales.length;

      const dailyGoal = branch.config?.dailyGoal || 5000;
      const progress = Math.min((bSalesTotal / dailyGoal) * 100, 100);

      branchSummaries.push({
        id: branch.id,
        name: branch.name,
        sales: bSalesTotal,
        goal: dailyGoal,
        progress
      });
    });

    // Eventos (Only add to total if viewing all branches)
    if (branchId === 'all') {
      const targetEvents = events.filter(e => isInRange(e.eventDate));
      totalVentas += targetEvents.reduce((acc, curr) => acc + (curr.total || 0), 0);
      totalGastos += targetEvents.reduce((acc, curr) => acc + (curr.totalExpenses || 0), 0);
    }

    // Trend Chart (Hourly for Today)
    const hours = new Array(24).fill(0);
    const filteredSales = branchId === 'all' ? rawSales : (branches[branchId]?.sales || []);
    filteredSales.filter(s => isInRange(s.ts)).forEach(s => {
      const hour = new Date(s.ts).getHours();
      hours[hour] += 1;
    });
    const labels = ['12pm', '1pm', '2pm', '3pm', '4pm', '5pm', '6pm', '7pm', '8pm', '9pm', '10pm', '11pm', '12am', '1am', '2am', '3am'];
    const data = [hours[12], hours[13], hours[14], hours[15], hours[16], hours[17], hours[18], hours[19], hours[20], hours[21], hours[22], hours[23], hours[0], hours[1], hours[2], hours[3]];

    return {
      totalVentas,
      totalGastos,
      totalCogs,
      utilidadNeta: totalVentas - totalGastos - totalCogs,
      numVentas,
      branchSummaries: branchSummaries.sort((a, b) => b.sales - a.sales),
      trendChart: {
        labels,
        datasets: [{
          label: 'Frecuencia de Ventas',
          data,
          backgroundColor: 'oklch(var(--p) / 0.8)',
          borderColor: 'oklch(var(--p))',
          borderRadius: 8
        }]
      }
    };
  }, [branches, rawSales, branchId, events, selectedDate, range]);

const criticalInventory = ingredients.filter(ing => ing.stock <= (ing.alertAt || 0)).slice(0, 5);

  return (
    <div className="space-y-6 lg:space-y-10 animate-in fade-in duration-700 pb-20">
      
      {/* Los reportes se envían automáticamente por Telegram (configurado en Google Apps Script) */}

      {/* Real-time KPIs Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-6">
        <div className="bg-base-100 p-5 md:p-8 rounded-2xl md:rounded-[2.5rem] shadow-xl border border-base-200 hover:scale-[1.02] transition-all cursor-default">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-primary/10 rounded-2xl text-primary"><TrendingUp size={22}/></div>
            <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em] bg-primary/5 px-3 py-1.5 rounded-full border border-primary/10">Hoy</span>
          </div>
          <div className="space-y-0.5">
            <h3 className="text-2xl md:text-4xl font-black text-base-content tracking-tighter">${stats.totalVentas.toLocaleString()}</h3>
            <p className="text-[10px] text-base-content/40 font-bold uppercase tracking-widest">{stats.numVentas} ventas</p>
          </div>
        </div>

        <div className="bg-base-100 p-5 md:p-8 rounded-2xl md:rounded-[2.5rem] shadow-xl border border-base-200 hover:scale-[1.02] transition-all cursor-default">
          <div className="flex justify-between items-start mb-6">
            <div className="p-4 bg-error/10 rounded-[1.5rem] text-error"><Wallet size={28}/></div>
            <span className="text-[10px] font-black text-error uppercase tracking-[0.2em] bg-error/5 px-3 py-1.5 rounded-full border border-error/10">Inversión</span>
          </div>
          <div className="space-y-1">
            <h3 className="text-2xl md:text-4xl font-black text-base-content tracking-tighter">${stats.totalGastos.toLocaleString()}</h3>
            <p className="text-xs text-base-content/40 font-bold uppercase tracking-widest">Gastos del día</p>
          </div>
        </div>

        <div className="bg-base-100 p-5 md:p-8 rounded-2xl md:rounded-[2.5rem] shadow-xl border border-base-200 hover:scale-[1.02] transition-all cursor-default relative overflow-hidden">
          <div className="flex justify-between items-start mb-6">
            <div className="p-4 bg-warning/10 rounded-[1.5rem] text-warning relative z-10"><Package size={28}/></div>
            <span className="text-[10px] font-black text-warning uppercase tracking-[0.2em] bg-warning/5 px-3 py-1.5 rounded-full border border-warning/10 relative z-10">Consumo</span>
          </div>
          <div className="space-y-1 relative z-10">
            <h3 className="text-2xl md:text-4xl font-black text-base-content tracking-tighter">${stats.totalCogs.toLocaleString(undefined, { maximumFractionDigits: 0 })}</h3>
            <p className="text-xs text-base-content/40 font-bold uppercase tracking-widest">Costo de Insumos</p>
          </div>
          <div className="absolute top-10 -right-4 opacity-[0.03] rotate-12">
             <Package size={140} />
          </div>
        </div>

        <div className="bg-neutral p-5 md:p-8 rounded-2xl md:rounded-[2.5rem] shadow-2xl text-neutral-content flex flex-col justify-between relative overflow-hidden group hover:shadow-primary/20 transition-all">
          <div className="flex justify-between items-start mb-6 z-10">
            <div className="p-4 bg-primary/20 rounded-[1.5rem] text-primary shadow-inner"><TrendingUp size={28}/></div>
            <div className="flex flex-col items-end">
               <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Estimado Neto</span>
            </div>
          </div>
          <div className="z-10">
            <h3 className="text-3xl md:text-5xl font-black italic tracking-tighter text-white drop-shadow-md">
              ${stats.utilidadNeta.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </h3>
            <div className="flex items-center gap-2 text-xs font-black text-success mt-2 uppercase tracking-tight">
              <div className="w-2 h-2 rounded-full bg-success animate-pulse"></div>
              Rentabilidad Hoy
            </div>
          </div>
          <div className="absolute -right-8 -bottom-8 opacity-10 group-hover:scale-110 transition-transform text-primary">
             <TrendingUp size={200}/>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6 lg:gap-8 transition-all">
        {/* Daily Goals Progress */}
        <div className="xl:col-span-2 bg-base-100 p-6 rounded-[2rem] shadow-xl border border-base-200">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary/5 rounded-2xl text-primary shadow-sm"><TrendingUp size={20}/></div>
              <div>
                <h3 className="text-xl font-black text-base-content uppercase tracking-tighter italic">Ventas por Sucursal</h3>
                <p className="text-[10px] text-base-content/30 font-black uppercase tracking-[0.2em] mt-0.5">Progreso vs Meta Diaria</p>
              </div>
            </div>
          </div>
          
          <div className="space-y-8">
            {stats.branchSummaries.map(branch => (
              <div key={branch.id} className="space-y-3 group">
                <div className="flex justify-between items-end">
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                       <span className="text-sm font-black text-base-content uppercase tracking-tight group-hover:text-primary transition-colors">{branch.name}</span>
                       <button onClick={() => { setEditingGoalBranchId(branch.id); setGoalInputValue(branch.goal.toString()); }} className="btn btn-ghost btn-xs btn-circle opacity-0 group-hover:opacity-40 transition-opacity"><Edit2 size={12}/></button>
                    </div>
                    {editingGoalBranchId === branch.id ? (
                      <div className="flex items-center gap-2 mt-2 p-1 bg-base-200 rounded-xl">
                        <input type="number" className="input input-xs h-8 w-24 font-black bg-transparent border-none" value={goalInputValue} onChange={(e) => setGoalInputValue(e.target.value)} autoFocus />
                        <button className="btn btn-xs btn-primary h-8 min-h-0 text-[9px] font-black uppercase rounded-lg px-3" onClick={() => { updateBranchGoal(branch.id, goalInputValue); setEditingGoalBranchId(null); }}>Actualizar</button>
                        <button className="btn btn-xs btn-ghost h-8 min-h-0 px-2" onClick={() => setEditingGoalBranchId(null)}><X size={12}/></button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="text-xs font-black text-base-content">${branch.sales.toLocaleString()}</span>
                        <span className="text-[9px] font-bold text-base-content/20 uppercase tracking-widest">/ meta ${branch.goal.toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <span className={`text-[11px] font-black px-3 py-1 rounded-full border shadow-sm ${branch.progress >= 100 ? 'bg-success/10 text-success border-success/20' : 'bg-primary/5 text-primary border-primary/10'}`}>
                      {Math.round(branch.progress)}%
                    </span>
                  </div>
                </div>
                <div className="h-3 w-full bg-base-200 rounded-full overflow-hidden shadow-inner p-0.5">
                  <div className={`h-full rounded-full transition-all duration-1000 ease-out relative ${branch.progress >= 100 ? 'bg-success' : 'bg-primary shadow-[0_0_15px_rgba(var(--p),0.4)]'}`} style={{ width: `${branch.progress}%` }}>
                    {branch.progress > 10 && <div className="absolute inset-0 bg-white/20 animate-pulse"></div>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Hourly Rush Chart */}
        <div className="xl:col-span-3 bg-base-100 p-6 rounded-[2rem] shadow-xl border border-base-200">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary/5 rounded-2xl text-primary shadow-sm"><Clock size={20}/></div>
              <div>
                <h3 className="text-xl font-black text-base-content uppercase tracking-tighter italic">Rush Hour</h3>
                <p className="text-[10px] text-base-content/30 font-black uppercase tracking-[0.2em] mt-0.5">Ventas según horario hoy</p>
              </div>
            </div>
            <div className="hidden sm:flex gap-2">
               <span className="badge badge-primary font-black uppercase text-[8px] p-2 tracking-widest opacity-30">Real Time Feed</span>
            </div>
          </div>
          <div className="h-[340px]">
             <Bar 
               data={stats.trendChart} 
               options={{
                 responsive: true,
                 maintainAspectRatio: false,
                 plugins: { 
                   legend: { display: false },
                   tooltip: {
                     backgroundColor: 'oklch(var(--n))',
                     titleFont: { family: 'inherit', weight: 'black', size: 14 },
                     bodyFont: { family: 'inherit', weight: 'bold', size: 12 },
                     padding: 12,
                     cornerRadius: 12,
                     displayColors: false
                   }
                 },
                 scales: { 
                   y: { 
                     beginAtZero: true, 
                     grid: { color: 'rgba(0,0,0,0.03)', drawBorder: false }, 
                     ticks: { font: { weight: 'bold', size: 10 }, color: 'oklch(var(--bc)/0.3)' } 
                   }, 
                   x: { 
                     grid: { display: false }, 
                     ticks: { font: { weight: 'bold', size: 10 }, color: 'oklch(var(--bc)/0.3)' } 
                   } 
                 }
               }} 
             />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 xl:grid-cols-5 gap-6 lg:gap-8">
        {/* Critical Stock */}
        <div className="lg:col-span-1 xl:col-span-1 bg-base-100 p-8 rounded-[3rem] shadow-xl border border-base-200 flex flex-col">
           <div className="flex items-center gap-3 mb-8">
              <div className="p-3 bg-error/5 text-error rounded-2xl"><AlertCircle size={22}/></div>
              <h3 className="font-black text-base-content uppercase tracking-tighter text-lg italic">Alertas Stock</h3>
           </div>
           <div className="space-y-3 flex-1 overflow-y-auto no-scrollbar">
              {criticalInventory.map(ing => (
                <div key={ing.id} className="group flex items-center justify-between p-4 bg-error/5 hover:bg-error/10 rounded-2xl border border-error/10 transition-colors">
                   <div className="flex flex-col min-w-0">
                      <span className="text-xs font-black truncate uppercase tracking-tight group-hover:text-error transition-colors">{ing.name}</span>
                      <span className="text-[9px] font-bold opacity-30 uppercase tracking-widest mt-0.5">Nivel Crítico</span>
                   </div>
                   <div className="text-right shrink-0">
                      <p className="text-lg font-black text-error leading-none">{Number(ing.stock).toFixed(1)}</p>
                      <span className="text-[8px] font-black opacity-30 uppercase tracking-tighter">{ing.unit}</span>
                   </div>
                </div>
              ))}
              {criticalInventory.length === 0 && (
                <div className="flex flex-col items-center justify-center py-10 opacity-30">
                   <Package size={40} className="mb-2" />
                   <p className="text-[10px] font-black uppercase tracking-[0.2em]">Stock Saludable</p>
                </div>
              )}
           </div>
           <div className="mt-6 pt-4 border-t border-base-200">
              <button className="btn btn-ghost btn-xs w-full font-black uppercase text-[9px] tracking-widest opacity-40">Ver Inventario Completo</button>
           </div>
        </div>

        {/* Online Staff */}
        <div className="lg:col-span-3 xl:col-span-4 bg-neutral p-10 rounded-[3rem] shadow-2xl relative overflow-hidden flex flex-col justify-between text-neutral-content group">
           <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
              <div>
                 <div className="flex items-center gap-4 mb-2">
                    <div className="p-3 bg-primary/20 text-primary rounded-2xl shadow-inner"><Users size={24}/></div>
                    <h4 className="text-3xl font-black italic uppercase tracking-tighter text-white">Personal Conectado</h4>
                 </div>
                 <p className="text-[11px] font-bold text-neutral-content/40 uppercase tracking-[0.4em] ml-1">Monitoreo de actividad en tiempo real</p>
              </div>
              <div className="flex -space-x-4">
                 {onlineUsers.slice(0, 8).map((u, i) => (
                   <div key={i} className="w-12 h-12 rounded-full bg-primary border-4 border-neutral flex items-center justify-center text-sm font-black text-primary-content uppercase shadow-lg transform hover:-translate-y-2 transition-transform cursor-pointer">
                     {u.name?.charAt(0)}
                   </div>
                 ))}
                 {onlineUsers.length > 8 && (
                   <div className="w-12 h-12 rounded-full bg-base-200 border-4 border-neutral flex items-center justify-center text-xs font-black text-base-content shadow-lg">
                     +{onlineUsers.length - 8}
                   </div>
                 )}
              </div>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 relative z-10">
              {onlineUsers.map((u, i) => (
                <div key={i} className="flex items-center gap-4 p-5 bg-neutral-content/5 hover:bg-neutral-content/10 rounded-[1.5rem] border border-neutral-content/10 transition-all hover:scale-[1.03] cursor-pointer">
                   <div className="w-12 h-12 rounded-2xl bg-base-content/10 flex items-center justify-center text-lg font-black uppercase shadow-inner text-primary">
                     {u.name?.charAt(0)}
                   </div>
                   <div className="flex flex-col min-w-0">
                      <span className="text-sm font-black truncate text-white">{u.name}</span>
                      <div className="flex items-center gap-1.5 mt-0.5">
                         <div className="w-1.5 h-1.5 rounded-full bg-success shadow-[0_0_8px_rgba(var(--s),0.8)]"></div>
                         <span className="text-[9px] font-black text-primary uppercase tracking-widest truncate">{branches[u.branchId]?.name || 'Admin'}</span>
                      </div>
                   </div>
                </div>
              ))}
              {onlineUsers.length === 0 && (
                <div className="col-span-full flex flex-col items-center justify-center py-16 opacity-30">
                   <div className="relative mb-4">
                      <Users size={60} />
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-error rounded-full border-4 border-neutral animate-ping"></div>
                   </div>
                   <p className="text-sm font-black uppercase tracking-[0.3em]">No hay sucursales activas</p>
                </div>
              )}
           </div>

           {/* Decorative Background Elements */}
           <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl group-hover:bg-primary/10 transition-colors"></div>
           <div className="absolute bottom-0 left-0 w-96 h-96 bg-primary/5 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl opacity-50"></div>
        </div>
      </div>

    </div>
  );

};

export default AdminDashboard;
