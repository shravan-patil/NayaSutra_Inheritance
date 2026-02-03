import { motion } from "framer-motion";
import { ArrowRight, Shield, Zap, Lock, Users, BookOpen, Scale } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect } from "react";

const Landing = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.2, delayChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  const features = [
    {
      icon: <Shield className="w-6 h-6" />,
      title: "Secure Evidence Management",
      description: "Blockchain-verified evidence handling with immutable audit trails",
      color: "from-blue-500 to-blue-600",
    },
    {
      icon: <Lock className="w-6 h-6" />,
      title: "Chain of Custody",
      description: "Complete tracking of evidence handling and access history",
      color: "from-purple-500 to-purple-600",
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: "Real-time Collaboration",
      description: "Seamless coordination between judiciary, lawyers, and police",
      color: "from-amber-500 to-amber-600",
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: "Role-Based Access",
      description: "Granular permission controls for different user types",
      color: "from-emerald-500 to-emerald-600",
    },
    {
      icon: <BookOpen className="w-6 h-6" />,
      title: "Digital Case Files",
      description: "Organized case documentation with advanced search capabilities",
      color: "from-cyan-500 to-cyan-600",
    },
    {
      icon: <Scale className="w-6 h-6" />,
      title: "Legal Compliance",
      description: "Meets international standards for evidence admissibility",
      color: "from-pink-500 to-pink-600",
    },
  ];

  const roles = [
    {
      name: "Judiciary",
      icon: "⚖️",
      description: "Judges and court administrators",
      color: "from-amber-500 to-amber-600",
    },
    {
      name: "Lawyers",
      icon: "👨‍⚖️",
      description: "Legal practitioners and advocates",
      color: "from-blue-500 to-blue-600",
    },
    {
      name: "Court Staff",
      icon: "📋",
      description: "Clerks and paralegals",
      color: "from-cyan-500 to-cyan-600",
    },
    {
      name: "Police",
      icon: "🚔",
      description: "Officers and investigators",
      color: "from-emerald-500 to-emerald-600",
    }

  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 grid-background opacity-10" />
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-amber-500/10 rounded-full blur-[120px] animate-pulse delay-1000" />

      {/* Navigation */}
      <nav className="relative z-20 px-6 py-4 flex justify-center items-center max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center group"
        >
          <div className="relative">
            {/* Glow effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-300" />
            
            {/* Logo container with subtle background */}
            <div className="relative bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm rounded-2xl p-3 border border-white/10 shadow-xl group-hover:border-white/20 transition-all duration-300">
              <img 
                src="/logo.png" 
                alt="NyaySutra" 
                className="h-12 w-auto object-contain filter drop-shadow-lg group-hover:scale-105 transition-transform duration-300"
              />
            </div>
            
            {/* Subtle accent line */}
            <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-16 h-0.5 bg-gradient-to-r from-transparent via-blue-400 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </div>
          
          {/* Brand text with enhanced styling */}
          <div className="ml-4 hidden sm:block">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 via-cyan-400 to-emerald-400 bg-clip-text text-transparent">
              NyaySutra
            </h1>
            <p className="text-xs text-slate-400 font-medium">Digital Justice System</p>
          </div>
        </motion.div>
      </nav>

      {/* Hero Section */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 max-w-7xl mx-auto px-6 py-10 text-center"
      >
        <motion.h1
          variants={itemVariants}
          className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight"
        >
          Digital Justice <br />
          <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-emerald-400 bg-clip-text text-transparent">
            Simplified
          </span>
        </motion.h1>

        <motion.p
          variants={itemVariants}
          className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto"
        >
          NyaySutra is a blockchain-powered evidence management system designed for the modern judiciary. Secure, transparent, and compliant.
        </motion.p>

        <motion.div variants={itemVariants} className="flex justify-center">
          <Button
            onClick={() => navigate("/auth")}
            className="px-8 py-6 text-lg bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 gap-2"
          >
            Login
            <ArrowRight className="w-5 h-5" />
          </Button>
        </motion.div>
      </motion.div>

      {/* Features Section */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        className="relative z-10 max-w-7xl mx-auto px-6 py-20"
      >
        <motion.h2
          variants={itemVariants}
          className="text-4xl font-bold text-white text-center mb-16"
        >
          Enterprise Features
        </motion.h2>

        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature, i) => (
            <motion.div
              key={i}
              variants={itemVariants}
              className="glass-card p-6 rounded-xl border border-white/10 hover:border-white/20 transition-all hover:shadow-lg hover:shadow-blue-500/20"
            >
              <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${feature.color} flex items-center justify-center text-white mb-4`}>
                {feature.icon}
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">
                {feature.title}
              </h3>
              <p className="text-slate-400">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Roles Section */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        className="relative z-10 max-w-7xl mx-auto px-6 py-20"
      >
        <motion.h2
          variants={itemVariants}
          className="text-4xl font-bold text-white text-center mb-16"
        >
          Specialized Portals
        </motion.h2>

        <div className="grid md:grid-cols-4 gap-8">
          {roles.map((role, i) => (
            <motion.div
              key={i}
              variants={itemVariants}
              className={`glass-card p-6 rounded-xl border border-white/10 hover:border-white/20 transition-all hover:shadow-lg hover:shadow-${role.color.split("-")[1]}-500/20 text-center`}
            >
              <div className="text-4xl mb-4">{role.icon}</div>
              <h3 className="text-lg font-semibold text-white mb-2">
                {role.name}
              </h3>
              <p className="text-sm text-slate-400">{role.description}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>



      {/* Footer */}
      <motion.footer
        variants={itemVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        className="relative z-10 border-t border-white/10 py-8 text-center text-slate-400 mt-10"
      >
        <p>&copy; 2026 NyaySutra. All rights reserved. Securing Justice Digitally.</p>
      </motion.footer>
    </div>
  );
};

export default Landing;
