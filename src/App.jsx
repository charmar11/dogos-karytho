import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import BottomNav from './components/Navigation/BottomNav';
import Login from './components/Login';
import PosScreen from './components/POS/PosScreen';
import SalesHistoryTab from './components/POS/SalesHistoryTab';
import AdminScreen from './components/Admin/AdminScreen';
import MemberSelector from './components/Auth/MemberSelector';
import InventoryScreen from './components/Inventory/InventoryScreen';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ProductProvider } from './context/ProductContext';
import { CartProvider } from './context/CartContext';
import { HistoryProvider } from './context/HistoryContext';
import { InventoryProvider } from './context/InventoryContext';
import { OperationsProvider } from './context/OperationsContext';
import { EventsProvider } from './context/EventsContext';
import { ActivityProvider } from './context/ActivityContext';
import EventsScreen from './components/Events/EventsScreen';
import ExpenseScreen from './components/POS/ExpenseScreen';
import ProductsEditor from './components/POS/ProductsEditor';

const AppContent = () => {
  const { user, userData, activeMember, loading, logout } = useAuth();
  const [view, setView] = useState(''); // Default is empty, resolved later
  const [isCorteOpen, setIsCorteOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);

  useEffect(() => {
    const root = document.getElementById('root');
    if (isCartOpen && root) {
      root.style.overflow = 'hidden';
      root.style.touchAction = 'none';
    } else if (root) {
      root.style.overflow = 'auto';
      root.style.touchAction = '';
    }
    return () => {
      if (root) {
        root.style.overflow = 'auto';
        root.style.touchAction = '';
      }
    };
  }, [isCartOpen]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-base-200">
        <div className="flex flex-col items-center gap-4">
          <span className="loading loading-spinner loading-lg text-primary"></span>
          <p className="text-neutral/40 font-serif italic text-sm">Preparando el carrito...</p>
        </div>
      </div>
    );
  }

  if (!user || user.isAnonymous) {
    return <Login />;
  }

  const isCidop = user.email === 'cidop@karytho.com';
  if (isCidop && !activeMember) {
    return <MemberSelector />;
  }

  const isAdmin = userData?.role === 'admin' || userData?.isAdmin;
  const isEncargado = userData?.role === 'encargado';
  const isEventos = userData?.role === 'eventos';

  // Safety: If logged in but no branch assigned (common in CIDOP shared accounts)
  // Admins are exempt from this check since they manage the whole system
  if (!isAdmin && !userData?.branchId && !loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-base-200 p-8">
        <div className="max-w-md w-full bg-base-100 rounded-3xl shadow-2xl p-8 text-center space-y-6">
          <div className="w-20 h-20 bg-warning rounded-full flex items-center justify-center mx-auto">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
          </div>
          <h2 className="text-2xl font-bold text-neutral">Sucursal no asignada</h2>
          <p className="text-neutral/60">
            Tu cuenta ({user.email}) no tiene una sucursal vinculada en la base de datos.
            Contacta al administrador para asignar una sucursal.
          </p>
          <button onClick={() => window.location.reload()} className="btn btn-primary w-full rounded-xl">Reintentar</button>
          <button onClick={logout} className="btn btn-ghost btn-sm text-error uppercase tracking-widest">Cerrar Sesión</button>
        </div>
      </div>
    );
  }

  // (Moved up for logic flow)

  // Admins can see events if specifically selected, otherwise pinned to admin
  const currentView = (isAdmin && view === 'events') ? 'events' : (isAdmin ? 'admin' : (isEventos ? 'events' : (view || 'pos')));

  return (
    <div className="min-h-[100dvh] bg-base-100 flex flex-col font-sans overflow-x-hidden">
      {/* Hide Navbar on mobile when in Admin view to save space */}
      <div className={`${isAdmin ? 'hidden md:block' : 'block'}`}>
        <Navbar
          currentView={currentView}
          setView={setView}
          isCorteOpen={isCorteOpen}
          setIsCorteOpen={setIsCorteOpen}
          isCartOpen={isCartOpen}
        />
      </div>

      <main className={`flex-1 overflow-x-hidden relative pb-32 md:pb-0 transition-all duration-500 ${isAdmin ? 'pt-0' : ''} ${isCartOpen ? 'pt-0 md:pt-20' : 'pt-20'}`}>
        {isAdmin ? (
          <AdminScreen />
        ) : currentView === 'events' ? (
          <EventsScreen />
        ) : currentView === 'inventory' ? (
          <InventoryScreen />
        ) : currentView === 'expenses' ? (
          <ExpenseScreen />
        ) : currentView === 'history' ? (
          <SalesHistoryTab />
        ) : currentView === 'products' ? (
          <ProductsEditor />
        ) : (
          <PosScreen isCartOpen={isCartOpen} setIsCartOpen={setIsCartOpen} />
        )}
      </main>

      {/* Bottom Navigation for Mobile */}
      <BottomNav
        currentView={currentView}
        setView={setView}
        isCartOpen={isCartOpen}
        setIsCartOpen={setIsCartOpen}
        onOpenCorte={() => setIsCorteOpen(true)}
        isAdmin={isAdmin}
      />
    </div>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <ActivityProvider>
        <EventsProvider>
          <HistoryProvider>
            <InventoryProvider>
              <OperationsProvider>
                <ProductProvider>
                  <CartProvider>
                    <AppContent />
                  </CartProvider>
                </ProductProvider>
              </OperationsProvider>
            </InventoryProvider>
          </HistoryProvider>
        </EventsProvider>
      </ActivityProvider>
    </AuthProvider>
  );
};

export default App;
