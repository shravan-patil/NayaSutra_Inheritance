import { motion } from "framer-motion";
import { Shield, Wallet, LogIn, LogOut, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export const Navbar = () => {
  const { isAuthenticated, signOut, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async() => {
    await signOut();
    await navigate('/', { state: { from: location.pathname } });
    location.pathname = '/';
  };

  if (isLoading) {
    return null; 
  }

  return (
    <motion.nav
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      // Updated className for better universal visibility
      className="fixed top-0 left-0 right-0 z-50 bg-slate-950/60 backdrop-blur-xl border-b border-white/10"
    >
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo Section */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="relative">
            <div className="absolute inset-0 bg-emerald-500/20 blur-xl group-hover:bg-emerald-500/30 transition-all duration-300" />
            <div className="relative w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:scale-110 transition-transform">
              <Shield className="w-5 h-5 text-white" />
            </div>
          </div>
          <span className="text-xl font-bold text-white tracking-tight">
            Nyay<span className="text-emerald-500">Sutra</span>
          </span>
        </Link>

        {/* Navigation Actions */}
        <div className="flex items-center gap-4">
          {isAuthenticated ? (
            <>
              {/* Notifications - Useful for all roles */}
              <button className="p-2 text-slate-400 hover:text-emerald-400 transition-colors relative">
                <Bell className="w-5 h-5" />
                <span className="absolute top-2 right-2 w-2 h-2 bg-emerald-500 rounded-full border-2 border-slate-950" />
              </button>

              <div className="h-6 w-[1px] bg-white/10 mx-2" />

              <Button
                variant="ghost"
                className="text-slate-400 hover:text-white hover:bg-white/5 transition-all"
                onClick={handleLogout}
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </>
          ) : (
            <Link to="/auth" state={{ from: location.pathname }}>
              <Button
                variant="ghost"
                className="text-slate-400 hover:text-white hover:bg-white/5 transition-all"
              >
                <LogIn className="w-4 h-4 mr-2" />
                Officer Login
              </Button>
            </Link>
          )}

          {/* Universal Wallet Connection */}
          <Button
            className="relative bg-emerald-500/10 border border-emerald-500/50 text-emerald-400 hover:bg-emerald-500 hover:text-white transition-all duration-300 shadow-lg shadow-emerald-500/10"
          >
            <Wallet className="w-4 h-4 mr-2" />
            Connect Wallet
          </Button>
        </div>
      </div>
    </motion.nav>
  );
};