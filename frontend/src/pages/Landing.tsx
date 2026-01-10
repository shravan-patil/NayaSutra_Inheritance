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
    },
    {
      name: "Public",
      icon: "👥",
      description: "Parties and witnesses",
      color: "from-slate-400 to-slate-500",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 grid-background opacity-10" />
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-amber-500/10 rounded-full blur-[120px] animate-pulse delay-1000" />

      {/* Navigation */}
      <nav className="relative z-20 px-6 py-4 flex justify-between items-center max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-3"
        >
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
            <Scale className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-bold text-white">NyaySutra</span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex gap-4"
        >
          <Button
            variant="outline"
            onClick={() => navigate("/auth")}
            className="border-slate-600 hover:border-slate-400 text-slate-200 hover:text-white"
          >
            Sign In
          </Button>
          <Button
            onClick={() => navigate("/auth")}
            className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
          >
            Get Started
          </Button>
        </motion.div>
      </nav>

      {/* Hero Section */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 max-w-7xl mx-auto px-6 py-20 text-center"
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

        <motion.div variants={itemVariants} className="flex gap-4 justify-center">
          <Button
            onClick={() => navigate("/auth")}
            className="px-8 py-6 text-lg bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 gap-2"
          >
            Start Your Journey
            <ArrowRight className="w-5 h-5" />
          </Button>
          <Button
            variant="outline"
            className="px-8 py-6 text-lg border-slate-600 hover:border-slate-400 text-slate-200"
          >
            Learn More
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

        <div className="grid md:grid-cols-5 gap-6">
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

      {/* Stats Section */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
        className="relative z-10 max-w-7xl mx-auto px-6 py-20"
      >
        <div className="grid md:grid-cols-4 gap-8 text-center">
          {[
            { label: "Cases Managed", value: "10,000+" },
            { label: "Evidence Items", value: "50,000+" },
            { label: "Active Users", value: "5,000+" },
            { label: "Court Systems", value: "100+" },
          ].map((stat, i) => (
            <motion.div key={i} variants={itemVariants}>
              <div className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent mb-2">
                {stat.value}
              </div>
              <div className="text-slate-400">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* CTA Section */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
        className="relative z-10 max-w-4xl mx-auto px-6 py-20 text-center"
      >
        <motion.div
          variants={itemVariants}
          className="glass-card p-12 rounded-2xl border border-white/10"
        >
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Transform Your Judiciary?
          </h2>
          <p className="text-slate-300 mb-8">
            Join thousands of courts worldwide using NyaySutra for secure, transparent evidence management.
          </p>
          <Button
            onClick={() => navigate("/auth")}
            className="px-8 py-6 text-lg bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
          >
            Get Started Today
          </Button>
        </motion.div>
      </motion.div>

      {/* Footer */}
      <motion.footer
        variants={itemVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        className="relative z-10 border-t border-white/10 py-8 text-center text-slate-400 mt-20"
      >
        <p>&copy; 2026 NyaySutra. All rights reserved. Securing Justice Digitally.</p>
      </motion.footer>
    </div>
  );
};

export default Landing;
