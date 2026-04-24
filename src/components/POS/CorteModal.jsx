import React, { useState, useEffect } from 'react';
import { X, Receipt, Calculator, Banknote, Coins, ArrowRight, Save, History, TrendingUp, Wallet } from 'lucide-react';
import { useHistory } from '../../context/HistoryContext';
import { useOperations } from '../../context/OperationsContext';
import { useAuth } from '../../context/AuthContext';

const BILLS = [1000, 500, 200, 100, 50, 20];

const CorteModal = ({ onClose }) => {
  const { sales, gastos } = useHistory();
  const { saveCorte } = useOperations();
  const { user } = useAuth();
  const isCidop = user?.email === 'cidop@karytho.com';

  // State declarations - must come BEFORE any conditional returns
  const [fondoInicial, setFondoInicial] = useState(() => {
    return parseFloat(localStorage.getItem('last_fondo')) || 0;
  });
  const [denominaciones, setDenominaciones] = useState({});
  const [monedas, setMonedas] = useState('');
  const [nota, setNota] = useState('');
  const [loading, setLoading] = useState(false);

  // Totales del día (locales)
  const today = new Date().toLocaleDateString('en-CA');
  const salesToday = sales.filter(s => {
    const sDate = s.timestamp ? new Date(s.timestamp).toLocaleDateString('en-CA') : '';
    return sDate === today;
  });
  const gastosToday = gastos.filter(g => {
    const gDate = g.timestamp ? new Date(g.timestamp).toLocaleDateString('en-CA') : '';
    return gDate === today && (g.origen === 'caja' || !g.origen);
  });

  const totalVentas = salesToday.reduce((acc, s) => acc + (s.amount || 0), 0);
  const totalGastos = gastosToday.reduce((acc, g) => acc + (g.amount || 0), 0);
  const totalEsperado = fondoInicial + totalVentas - totalGastos;

  const totalBilletes = BILLS.reduce((acc, b) => {
    return acc + ((parseInt(denominaciones[b]) || 0) * b);
  }, 0);

  const totalContado = totalBilletes + (parseFloat(monedas) || 0);
  const diferencia = totalContado - totalEsperado;

  const handleDenomChange = (val, b) => {
    setDenominaciones(prev => ({...prev, [b]: val}));
  };

  const handleSave = async () => {
    setLoading(true);

    // Preparar resumen de productos para el corte (como en el sistema original)
    const productosCounts = {};
    const productosTotals = {};
    salesToday.forEach(sale => {
      sale.items?.forEach(it => {
        const key = it.productName + (it.variationName ? ` (${it.variationName})` : '');
        productosCounts[key] = (productosCounts[key] || 0) + it.qty;
        productosTotals[key] = (productosTotals[key] || 0) + (it.price * it.qty);
      });
    });

    const res = await saveCorte({
      fechaISO: today,
      fondoInicial,
      totalVentas,
      totalGastos,
      totalEsperado,
      totalContado,
      diferencia,
      denominaciones,
      monedas: parseFloat(monedas) || 0,
      nota,
      numVentas: salesToday.length,
      productos: productosCounts,
      productosTotales: productosTotals
    });

    if (res.success) {
      localStorage.setItem('last_fondo', fondoInicial);
      onClose();
    } else {
      alert("Error: " + res.message);
    }
    setLoading(false);
  };

  // CRITICAL: CIDOP user check must come AFTER all hooks
  // This prevents CIDOP from ever seeing the modal
  if (isCidop) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md transition-all duration-300 animate-in fade-in overflow-y-auto">
      <div className="bg-base-100 w-full max-w-4xl rounded-[2.5rem] shadow-2xl flex flex-col md:flex-row overflow-hidden border border-base-content/10 animate-in slide-in-from-bottom-8 duration-500 my-8">

        {/* Left Panel: Calculator */}
        <div className="flex-1 p-8 bg-base-200/50">
          <div className="flex items-center gap-4 mb-8">
            <div className="bg-primary/10 text-primary p-3 rounded-2xl">
              <Calculator size={24} />
            </div>
            <div>
              <h2 className="font-black text-2xl tracking-tighter uppercase italic">Arqueo de Caja</h2>
              <p className="text-[10px] uppercase font-bold text-base-content/40 tracking-widest">Conteo físico de efectivo</p>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <label className="text-[10px] uppercase font-black tracking-widest text-base-content/40 ml-1 mb-3 block">Fondo Inicial</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-primary/40">$</span>
                <input
                  type="number"
                  value={fondoInicial}
                  onChange={(e) => setFondoInicial(parseFloat(e.target.value) || 0)}
                  className="input w-full pl-8 bg-base-100 border-base-content/5 focus:border-primary rounded-2xl font-black text-lg"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {BILLS.map(b => (
                <div key={b} className="bg-base-100 p-4 rounded-[1.5rem] border border-base-content/5 shadow-sm group hover:border-primary/30 transition-colors">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-black text-base-content/30 italic">${b}</span>
                    <span className={`text-xs font-black transition-colors ${(denominaciones[b] > 0) ? 'text-primary' : 'text-base-content/10'}`}>
                      ${(parseInt(denominaciones[b]) || 0) * b}
                    </span>
                  </div>
                  <input
                    type="number"
                    placeholder="0"
                    value={denominaciones[b] || ''}
                    onChange={(e) => handleDenomChange(e.target.value, b)}
                    className="w-full bg-transparent border-none focus:outline-none text-2xl font-black tracking-tighter placeholder:opacity-10"
                  />
                </div>
              ))}
            </div>

            <div className="bg-base-100 p-6 rounded-[1.5rem] border border-base-content/5 shadow-sm">
              <div className="flex items-center gap-3 mb-4 text-amber-500">
                <Coins size={20} />
                <span className="text-[10px] uppercase font-black tracking-widest">Fracción / Monedas (Morralla)</span>
              </div>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-amber-500/40">$</span>
                <input
                  type="number"
                  value={monedas}
                  onChange={(e) => setMonedas(e.target.value)}
                  placeholder="0.00"
                  className="input w-full pl-8 bg-base-200/50 border-none focus:border-amber-500 focus:outline-none rounded-2xl font-black text-xl text-amber-600"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel: Summary & Save */}
        <div className="w-full md:w-[380px] p-8 border-l border-base-content/5 bg-base-100 flex flex-col">
          <div className="flex justify-end mb-4">
            <button onClick={onClose} className="btn btn-ghost btn-circle btn-sm opacity-20 hover:opacity-100">
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 space-y-6">
            <div className="space-y-3">
              <h3 className="text-[10px] uppercase font-black tracking-widest text-base-content/40 italic">Sistema vs Real</h3>

              <div className="space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="font-bold opacity-40">Ventas (+)</span>
                  <span className="font-black text-blue-600">${totalVentas.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="font-bold opacity-40">Gastos (−)</span>
                  <span className="font-black text-red-500">${totalGastos.toFixed(2)}</span>
                </div>
                <div className="pt-2 border-t border-dashed border-base-content/10 flex justify-between items-center">
                  <span className="text-xs font-black uppercase tracking-tighter opacity-60">Esperado</span>
                  <span className="text-xl font-black">${totalEsperado.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className={`p-6 rounded-[2rem] border-2 flex flex-col items-center text-center transition-all duration-500 ${
              Math.abs(diferencia) < 0.1
                ? 'bg-green-50 border-green-200 text-green-700'
                : diferencia > 1
                ? 'bg-amber-50 border-amber-200 text-amber-700'
                : 'bg-red-50 border-red-200 text-red-700'
            }`}>
              <div className="mb-2">
                {Math.abs(diferencia) < 0.1 ? (
                  <span className="text-[10px] uppercase font-black tracking-[0.2em] opacity-60">✅ Exacto</span>
                ) : diferencia > 1 ? (
                  <span className="text-[10px] uppercase font-black tracking-[0.2em] opacity-60">⬆️ Sobrante</span>
                ) : (
                  <span className="text-[10px] uppercase font-black tracking-[0.2em] opacity-60">⬇️ Faltante</span>
                )}
              </div>
              <div className="text-5xl font-black tracking-tighter mb-1">
                ${Math.abs(diferencia).toFixed(2)}
              </div>
              <p className="text-[10px] font-bold opacity-50">Diferencia de hoy</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-[10px] uppercase font-black tracking-widest text-base-content/40 ml-1 mb-2 block">Nota u Observaciones</label>
                <textarea
                  value={nota}
                  onChange={(e) => setNota(e.target.value)}
                  className="textarea w-full bg-base-200 border-transparent focus:border-primary/30 min-h-[100px] rounded-2xl font-bold text-xs"
                  placeholder="Ej: Faltó cobrar un dongo, se perdió moneda..."
                />
              </div>

              <button
                onClick={handleSave}
                disabled={loading}
                className="btn btn-primary btn-lg w-full h-16 rounded-2xl shadow-xl shadow-primary/20 flex items-center justify-center gap-3"
              >
                {loading ? <span className="loading loading-spinner"></span> : (
                  <>
                    <Save size={20} />
                    <span className="font-black uppercase tracking-tight">Finalizar Corte</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CorteModal;
