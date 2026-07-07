import React from 'react';
import { motion } from 'framer-motion';
import Sidebar from './Sidebar.jsx';
import Topbar from './Topbar.jsx';

function Layout({ children }) {
  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-800 font-sans relative overflow-hidden">
      {/* Decorative Floating Background Orbs */}
      <div className="absolute top-[-10%] right-[-10%] h-[35rem] w-[35rem] rounded-full bg-indigo-500/5 blur-[120px] pointer-events-none animate-float-slow z-0"></div>
      <div className="absolute bottom-[-10%] left-[20%] h-[30rem] w-[30rem] rounded-full bg-emerald-500/4 blur-[130px] pointer-events-none animate-float-slower z-0"></div>
      <div className="absolute top-[40%] left-[-10%] h-[25rem] w-[25rem] rounded-full bg-blue-500/3 blur-[110px] pointer-events-none animate-float-slow z-0"></div>

      {/* Sidebar Navigation */}
      <Sidebar />

      {/* Main Content Pane */}
      <div className="flex-1 flex flex-col min-w-0 z-10">
        <Topbar />
        
        <main className="flex-1 p-6 md:p-8 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
}

export default Layout;
