import React, { useState, useMemo, useRef } from "react";
import { 
  TrendingUp, 
  History, 
  Wallet, 
  Receipt, 
  ArrowLeft, 
  Search, 
  Filter,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Eye,
  Package,
  WalletCards,
  Users,
  BarChart3,
  ClipboardList,
  Settings,
  LayoutDashboard,
  Plus,
  ArrowRight,
  Trash2,
  X
} from "lucide-react";
import { useHistory } from "../../context/HistoryContext";
import { useInventory } from "../../context/InventoryContext";
import { useOperations } from "../../context/OperationsContext";
import InventoryTab from "../Inventory/InventoryTab";
import AdminDashboard from "./AdminDashboard";
import AnalyticsTab from "./AnalyticsTab";
import EarningsTab from "./EarningsTab";
import EventAdminReport from "./EventAdminReport";
import CidopTab from "./CidopTab";
import UsersTab from "./UsersTab";
import SalesHistoryTab from "./SalesHistoryTab";
import ExpenseHistoryTab from "./ExpenseHistoryTab";
import CutsHistoryTab from "./CutsHistoryTab";
import ActivityLogsTab from "./ActivityLogsTab";
import SettingsTab from "./SettingsTab";
import CreateBranchModal from "./CreateBranchModal";
import MiniCalendar from "./MiniCalendar";
import { ArrowUpRight, ArrowDownRight, ChevronDown } from "lucide-react";

const AdminScreen = ({ onBack }) => {
  const { sales: rawSales, gastos: rawGastos, cortes: rawCortes, branches, deleteBranch } = useHistory();
  const { updateExpenseDate } = useOperations();
  const { setAdminBranchId } = useInventory();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [searchTerm, setSearchTerm] = useState("");
  const [editingExpense, setEditingExpense] = useState(null);
  const [selectedBranchId, setSelectedBranchId] = useState("all");

  // Shared Date Range State for Analytics & Earnings
  const [range, setRange] = useState('month'); 

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isNewBranchModalOpen, setIsNewBranchModalOpen] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const calendarRef = useRef(null);

  const isFutureLimit = useMemo(() => {
    const today = new Date();
    const d = new Date(selectedDate);
    
    const todayYear = today.getFullYear();
    const todayMonth = today.getMonth();
    
    if (range === 'day') return d.setHours(0,0,0,0) >= today.setHours(0,0,0,0);
    
    if (range === 'week') {
      const getMon = (date) => {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
        return new Date(d.setDate(diff)).setHours(0,0,0,0);
      };
      return getMon(selectedDate) >= getMon(today);
    }
    
    if (range === 'month') {
      const todayVal = todayYear * 12 + todayMonth;
      const selectedVal = d.getFullYear() * 12 + d.getMonth();
      return selectedVal >= todayVal;
    }
    
    if (range === 'year') {
      return d.getFullYear() >= todayYear;
    }
    
    return false;
  }, [selectedDate, range]);

  const activityData = useMemo(() => {
    const days = new Set();
    const months = new Set();
    const years = new Set();
    
    // Explicit manual formatter to avoid timezone/locale surprises
    const getISO = (d) => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    const processItems = (items) => {
      if (!items || !Array.isArray(items)) return;
      items.forEach(item => {
        const ts = item.ts || item.timestamp;
        if (!ts) return;
        const d = new Date(ts);
        if (isNaN(d.getTime())) return;
        
        const iso = getISO(d);
        days.add(iso);
        months.add(iso.substring(0, 7)); // YYYY-MM
        years.add(iso.substring(0, 4)); // YYYY
      });
    };

    // Process from raw arrays for better coverage
    processItems(rawSales);
    processItems(rawGastos);
    
    // Ensure CIDOP sales/gastos are also included in activity sets
    if (branches?.cidop) {
      processItems(branches.cidop.sales);
      processItems(branches.cidop.gastos);
    }

    return { days, months, years };
  }, [rawSales, rawGastos, branches]);

  const branchList = Object.values(branches).filter(b => b.id !== 'cidop');

  // Filtered Data based on selectedBranchId
  const sales = selectedBranchId === 'all' 
    ? rawSales 
    : (branches[selectedBranchId]?.sales || []);
    
  const gastos = selectedBranchId === 'all' 
    ? rawGastos 
    : (branches[selectedBranchId]?.gastos || []);

  const cortes = selectedBranchId === 'all' 
    ? rawCortes 
    : (branches[selectedBranchId]?.cortes || []);

  const getSummary = () => {
    const today = new Date().toLocaleDateString('en-CA'); 
    const salesToday = sales.filter(s => s.ts && new Date(s.ts).toLocaleDateString('en-CA') === today);
    const totalVentas = salesToday.reduce((acc, s) => acc + (s.amount || 0), 0);
    
    const gastosToday = gastos.filter(g => g.ts && new Date(g.ts).toLocaleDateString('en-CA') === today);
    const totalGastos = gastosToday.reduce((acc, g) => acc + (g.amount || 0), 0);
    
    return {
      totalVentas,
      totalGastos,
      utilidad: totalVentas - totalGastos,
      numVentas: salesToday.length
    };
  };

  const summary = getSummary();

  // The renderSales, renderGastos, and renderCortes functions have been 
  // extracted to standalone components for better performance and layout flexibility.

  const tabs = useMemo(() => {
    const baseTabs = [
      { id: 'dashboard', label: 'Monitor', icon: LayoutDashboard, color: "text-info" },
      { id: 'analytics', label: 'Reportes', icon: BarChart3, color: "text-accent" },
      { id: 'earnings', label: 'Finanzas', icon: TrendingUp, color: "text-success" },
      { id: 'inventario', label: 'Inventario', icon: Package, color: "text-warning" },
      { id: "ventas", label: "Histórico", icon: History, color: "text-primary" },
      { id: "gastos", label: "Gastos", icon: Wallet, color: "text-error" },
      { id: "cortes", label: "Cortes", icon: Receipt, color: "text-secondary" },
    ];

    if (selectedBranchId === "all") {
      return [
        ...baseTabs,
        { id: "separator", label: "", type: "separator" },
        { id: "eventos", label: "Eventos", icon: Calendar, color: "text-success" },
        { id: "cidop", label: "Gastos Corporativo", icon: WalletCards, color: "text-success" },
        { id: "users", label: "Equipo", icon: Users, color: "text-accent" },
        { id: "logs", label: "Bitácora", icon: ClipboardList, color: "text-primary" },
        { id: "settings", label: "Configuración", icon: Settings, color: "text-neutral" },
      ];
    } else {
      return baseTabs;
    }
  }, [selectedBranchId]);

  const currentBranchName = selectedBranchId === 'all' 
    ? "CONSOLIDADO SUCURSALES" 
    : (branches[selectedBranchId]?.name || "Sucursal");

  const isGlobalTab = activeTab === 'cidop' || activeTab === 'users' || activeTab === 'eventos';

  return (
    <div className="h-[100dvh] bg-base-200/50 flex flex-col lg:flex-row overflow-hidden">
          {/* Desktop Sidebar - Premium Obsidian Redesign */}
      <aside className="hidden lg:flex w-72 bg-[#0a0a0c] border-r border-white/5 flex-col shrink-0 relative overflow-hidden">
        {/* Abstract Background Glow */}
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-20">
          <div className="absolute -top-24 -left-24 w-64 h-64 bg-primary/20 rounded-full blur-[100px]"></div>
          <div className="absolute bottom-48 -right-24 w-48 h-48 bg-secondary/10 rounded-full blur-[80px]"></div>
        </div>

        <div className="p-8 pb-4 relative z-10">
           <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/30 ring-1 ring-white/20">
                <LayoutDashboard size={22} className="text-white" />
             </div>
             <div className="flex flex-col">
               <h2 className="text-lg font-black italic uppercase tracking-tighter text-white leading-none">
                 KARYTHO <span className="text-primary italic">PRO</span>
               </h2>
               <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] font-sans">Admin Console</span>
             </div>
           </div>
        </div>

        <div className="flex-1 overflow-y-auto py-8 px-4 space-y-1 relative z-10 scrollbar-hide">
          {tabs.map((tab) => {
            if (tab.type === "separator") {
              return <div key="sep" className="h-[1px] bg-white/5 my-6 mx-4"></div>;
            }
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all font-black text-[11px] uppercase tracking-wider group relative ${
                  isActive 
                  ? "bg-white/10 text-white shadow-xl scale-[1.02] ring-1 ring-white/10" 
                  : "text-white/30 hover:bg-white/5 hover:text-white/60"
                }`}
              >
                {isActive && (
                  <div className="absolute left-0 w-1.5 h-6 bg-primary rounded-r-full shadow-[0_0_15px_oklch(var(--p))]"></div>
                )}
                <tab.icon size={18} className={isActive ? "text-primary shadow-[0_0_10px_oklch(var(--p)/0.5)]" : "opacity-50"} />
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="p-6 border-t border-white/5 relative z-10">
           <div className="bg-white/5 p-5 rounded-[2.5rem] border border-white/5 backdrop-blur-sm">
              <span className="text-[9px] font-black text-primary uppercase tracking-[0.2em] block mb-3 opacity-80">Rendimiento Hoy</span>
              <div className="flex justify-between items-end gap-2">
                <div>
                   <p className="text-[8px] font-bold text-white/30 uppercase tracking-widest">En Caja</p>
                   <p className="text-xl font-black text-white tracking-tighter">${summary.totalVentas.toLocaleString()}</p>
                </div>
                <div className="text-right">
                   <p className="text-[8px] font-bold text-white/30 uppercase tracking-widest">Neto</p>
                   <p className={`text-sm font-black ${summary.utilidad >= 0 ? 'text-success' : 'text-error'} shadow-sm`}>
                     ${summary.utilidad.toLocaleString()}
                   </p>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
                <span className="text-[8px] font-black text-white/20 uppercase tracking-widest">Estado Sistema</span>
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 bg-success rounded-full animate-pulse shadow-[0_0_8px_oklch(var(--su))]"></div>
                  <span className="text-[9px] font-bold text-success/80">Online</span>
                </div>
              </div>
           </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-[100dvh] overflow-x-hidden">
        
        {/* Top Header / Nav Mobile */}
        <header className="bg-base-100 border-b border-base-300 px-4 md:px-8 py-4 lg:py-6 shrink-0 relative z-20">
          <div className="max-w-screen-2xl mx-auto flex flex-col gap-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h2 className="text-xl md:text-2xl font-black italic uppercase tracking-tighter text-base-content leading-none">
                  {isGlobalTab ? "Gestión Global" : currentBranchName}
                </h2>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-[10px] font-black text-base-content/30 uppercase tracking-widest">
                    {isGlobalTab ? "Contexto:" : "Viendo Sucursal:"}
                  </span>
                  <select 
                    className={`select select-ghost select-xs font-black uppercase border-none rounded-lg transition-all ${isGlobalTab ? 'opacity-20 pointer-events-none' : 'text-primary bg-primary/5 px-2'}`}
                    value={selectedBranchId}
                    disabled={isGlobalTab}
                      onChange={(e) => {
                        const newId = e.target.value;
                        setSelectedBranchId(newId);
                        setAdminBranchId(newId);
                        if (newId !== 'all' && (activeTab === 'cidop' || activeTab === 'users' || activeTab === 'eventos')) {
                          setActiveTab('dashboard');
                        } else if (newId === 'all' && activeTab === 'inventario') {
                          setActiveTab('dashboard');
                        }
                      }}
                  >
                    <option value="all">Todas las Sucursales</option>
                    {branchList.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                  {!isGlobalTab && (
                    <div className="flex items-center gap-1">
                      <button 
                        onClick={() => setIsNewBranchModalOpen(true)}
                        className="btn btn-primary btn-xs h-7 w-7 p-0 flex items-center justify-center rounded-lg shadow-lg shadow-primary/20 hover:scale-110 transition-all border-none"
                        title="Nueva Sucursal"
                      >
                        <Plus size={14} />
                      </button>
                      {selectedBranchId !== 'all' && (
                        <button 
                          onClick={async () => {
                            if (window.confirm(`¿Seguro que deseas eliminar la sucursal "${branches[selectedBranchId]?.name}"? ESTA ACCIÓN NO SE PUEDE DESHACER.`)) {
                              await deleteBranch(selectedBranchId, branches[selectedBranchId]?.name);
                              setSelectedBranchId('all');
                              setActiveTab('dashboard');
                            }
                          }}
                          className="btn btn-error btn-xs h-7 w-7 p-0 flex items-center justify-center rounded-lg shadow-lg shadow-error/20 hover:scale-110 transition-all border-none bg-error/10 text-error hover:bg-error hover:text-error-content"
                          title="Eliminar Sucursal"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Period Selectors & Search (Simplified for Header) */}
              <div className="flex items-center gap-2 w-full md:w-auto">
                {activeTab !== "users" && activeTab !== "config" && (
                  <div className="flex items-center bg-base-200 p-1 rounded-xl md:rounded-2xl shrink-0 relative border border-base-content/5 shadow-inner">
                    <button 
                      onClick={() => {
                        const newDate = new Date(selectedDate);
                        if (range === 'day') newDate.setDate(newDate.getDate() - 1);
                        if (range === 'week') newDate.setDate(newDate.getDate() - 7);
                        if (range === 'month') newDate.setMonth(newDate.getMonth() - 1);
                        if (range === 'year') newDate.setFullYear(newDate.getFullYear() - 1);
                        setSelectedDate(newDate);
                      }} 
                      className="btn btn-ghost btn-xs btn-circle hover:bg-base-300"
                    >
                      <ChevronLeft size={16}/>
                    </button>

                    <div className="relative" ref={calendarRef}>
                      <button 
                        onClick={() => setShowCalendar(v => !v)}
                        className="px-2 md:px-4 h-8 md:h-9 mx-1 flex items-center gap-2 md:gap-3 bg-base-100 hover:bg-base-200 transition-colors shadow-sm border border-base-300/50 rounded-lg md:rounded-xl cursor-pointer"
                      >
                         <div className="bg-primary/10 text-primary p-1 md:p-1.5 rounded-lg">
                            <Calendar size={12} className="md:w-[14px] md:h-[14px]" />
                         </div>
                         <div className="flex flex-col items-start leading-none pointer-events-none">
                            <span className="text-[7px] md:text-[8px] font-black uppercase text-primary tracking-tighter opacity-70">
                              {range === 'day' ? 'Hoy' : range === 'week' ? 'Semana' : range === 'month' ? 'Mes' : 'Año'}
                            </span>
                            <span className="text-[10px] md:text-[11px] font-black text-base-content whitespace-nowrap">
                              {range === 'day' && selectedDate.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}
                              {range === 'week' && `Inic. ${selectedDate.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}`}
                              {range === 'month' && selectedDate.toLocaleDateString('es-MX', { month: 'short', year: 'numeric' })}
                              {range === 'year' && selectedDate.getFullYear()}
                            </span>
                         </div>
                         <ChevronDown size={10} className={`opacity-40 transition-transform ${showCalendar ? 'rotate-180 text-primary opacity-100' : ''}`} />
                      </button>


                    </div>

                    <button 
                      disabled={isFutureLimit} 
                      onClick={() => {
                        const newDate = new Date(selectedDate);
                        if (range === 'day') newDate.setDate(newDate.getDate() + 1);
                        if (range === 'week') newDate.setDate(newDate.getDate() + 7);
                        if (range === 'month') newDate.setMonth(newDate.getMonth() + 1);
                        if (range === 'year') newDate.setFullYear(newDate.getFullYear() + 1);
                        setSelectedDate(newDate);
                      }} 
                      className="btn btn-ghost btn-xs btn-circle disabled:opacity-10 disabled:pointer-events-none hover:bg-base-300"
                    >
                      <ChevronRight size={16}/>
                    </button>
                  </div>
                )}
                
                {/* Global Search Bar Integrated */}
                {activeTab !== "dashboard" && activeTab !== "analytics" && activeTab !== "earnings" && activeTab !== "cidop" && activeTab !== "users" && (
                   <div className="relative group shrink-0">
                     <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/20 group-focus-within:text-primary transition-colors" size={14} />
                     <input 
                       type="text" 
                       placeholder="Buscar..."
                       className="input input-xs h-9 w-32 md:w-48 pl-9 bg-base-200 border-none rounded-xl focus:ring-4 focus:ring-primary/5 text-xs font-bold"
                       value={searchTerm}
                       onChange={(e) => setSearchTerm(e.target.value)}
                     />
                   </div>
                )}

                 {(activeTab === "analytics" || activeTab === "earnings" || activeTab === "ventas" || activeTab === "gastos" || activeTab === "cortes" || activeTab === "cidop") && (
                    <div className="join bg-base-200 p-1 rounded-xl shrink-0">
                     {['day', 'week', 'month', 'year'].map((r) => (
                       <button key={r} onClick={() => setRange(r)} className={`join-item btn btn-[10px] h-7 min-h-0 px-3 border-none rounded-lg capitalize font-black ${range === r ? 'btn-primary shadow-sm' : 'btn-ghost opacity-40'}`}>
                         {r === 'day' ? 'D' : r === 'week' ? 'S' : r === 'month' ? 'M' : 'A'}
                       </button>
                     ))}
                    </div>
                 )}
              </div>
             </div>
          </div>

          {/* Mobile Tabs - Only visible on small screens */}
          <div className="lg:hidden mt-6 overflow-x-auto no-scrollbar -mx-4 px-4 pb-2">
            <div className="flex gap-2 min-w-max">
              {tabs.map((tab) => {
                if (tab.type === "separator") return null;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-3 h-8 rounded-lg transition-all font-black text-[9px] uppercase tracking-wider ${
                      isActive 
                      ? "bg-primary text-primary-content shadow-lg shadow-primary/20 scale-105" 
                      : "bg-base-200 text-base-content/40"
                    }`}
                  >
                    <tab.icon size={14} />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>
        </header>

        {/* ===== INLINE CALENDAR PANEL — between header & content, no positioning tricks ===== */}
        {showCalendar && (
          <div className="bg-base-100 border-b-2 border-base-300 shrink-0 overflow-y-auto relative z-50 shadow-2xl" style={{ maxHeight: '75vh' }}>
            <div className="max-w-sm mx-auto p-4 pb-6">
              {/* Header row */}
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="font-serif font-black italic text-lg text-primary uppercase tracking-tighter leading-none">Filtro de Fecha</h3>
                  <span className="text-[9px] font-bold text-base-content/40 uppercase tracking-widest">Toca un día para filtrar</span>
                </div>
                <button
                  onClick={() => setShowCalendar(false)}
                  className="btn btn-circle btn-ghost btn-sm"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Period tabs */}
              <div className="flex bg-base-200 p-1 rounded-2xl mb-4">
                {['day','week','month','year'].map(r => (
                  <button
                    key={r}
                    onClick={() => setRange(r)}
                    className={`flex-1 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${
                      range === r ? 'bg-base-100 shadow text-primary' : 'text-base-content/40'
                    }`}
                  >
                    {r === 'day' ? 'Día' : r === 'week' ? 'Sem' : r === 'month' ? 'Mes' : 'Año'}
                  </button>
                ))}
              </div>

              {/* Calendar with activity dots */}
              <div className="flex justify-center">
                <MiniCalendar
                  currentDate={selectedDate}
                  onSelectDay={(d) => {
                    setSelectedDate(new Date(new Date(d).setHours(12, 0, 0, 0)));
                    if (range === 'day') setShowCalendar(false);
                  }}
                  onClose={() => setShowCalendar(false)}
                  period={range === 'day' ? 'dia' : range === 'week' ? 'semana' : range === 'month' ? 'mes' : 'year'}
                  activityData={activityData}
                />
              </div>
            </div>
          </div>
        )}

        {/* Dynamic Scrollable Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 xl:p-12">
          <div className="max-w-screen-2xl mx-auto space-y-8 pb-20">
            {activeTab === "dashboard" && <AdminDashboard branchId={selectedBranchId} range={range} selectedDate={selectedDate} />}
            {activeTab === "analytics" && <AnalyticsTab branchId={selectedBranchId} range={range} selectedDate={selectedDate} />}
            {activeTab === "earnings" && <EarningsTab branchId={selectedBranchId} range={range} selectedDate={selectedDate} />}
            {activeTab === "eventos" && <EventAdminReport />}
            {activeTab === "ventas" && (
              <SalesHistoryTab 
                sales={sales} 
                range={range} 
                selectedDate={selectedDate} 
                searchTerm={searchTerm} 
                branchId={selectedBranchId}
                setRange={setRange}
                setSelectedDate={setSelectedDate}
              />
            )}
            {activeTab === "gastos" && (
              <ExpenseHistoryTab 
                gastos={gastos} 
                range={range} 
                selectedDate={selectedDate} 
                searchTerm={searchTerm}
                branchId={selectedBranchId}
                setRange={setRange}
                setSelectedDate={setSelectedDate}
              />
            )}
            {activeTab === "cortes" && (
              <CutsHistoryTab 
                cuts={rawCortes} 
                range={range} 
                selectedDate={selectedDate} 
                searchTerm={searchTerm} 
                branchId={selectedBranchId}
                setRange={setRange}
                setSelectedDate={setSelectedDate}
              />
            )}
            {activeTab === "inventario" && (
              selectedBranchId === "all" ? (
                <div className="flex flex-col items-center justify-center py-20 bg-base-100 rounded-[2.5rem] border-2 border-dashed border-base-300">
                  <div className="bg-warning/10 text-warning p-6 rounded-full mb-4">
                    <Package size={40} />
                  </div>
                  <h3 className="text-xl font-black text-base-content italic uppercase tracking-tighter">Selecciona una Sucursal</h3>
                  <p className="text-sm text-base-content/40 font-bold max-w-xs text-center mt-2 uppercase tracking-tight">
                    Para gestionar el inventario debes elegir una sucursal específica.
                  </p>
                </div>
              ) : (
                <InventoryTab searchTerm={searchTerm} />
              )
            )}
            {activeTab === "cidop" && (
              <CidopTab 
                branchId={selectedBranchId}
                range={range}
                selectedDate={selectedDate}
                setRange={setRange}
                setSelectedDate={setSelectedDate}
              />
            )}
            {activeTab === "users" && <UsersTab branches={branches} />}
            {activeTab === "logs" && <ActivityLogsTab />}
            {activeTab === "settings" && <SettingsTab />}
          </div>
        </main>
      </div>
      
      <CreateBranchModal 
        isOpen={isNewBranchModalOpen} 
        onClose={() => setIsNewBranchModalOpen(false)} 
      />
    </div>
  );

};

export default AdminScreen;
