import React from 'react';
import { motion } from 'framer-motion';
import { User, Shield, Briefcase, DraftingCompass, Users, Warehouse, Search, HardHat, ShieldAlert } from 'lucide-react';
import './org-chart.css';

const OrgBox = ({ role, name, icon: Icon, variant = 'default', children }: { role: string, name: string, icon?: any, variant?: 'default' | 'root' | 'support', children?: React.ReactNode }) => (
  <motion.div 
    initial={{ opacity: 0, scale: 0.95 }}
    whileInView={{ opacity: 1, scale: 1 }}
    viewport={{ once: true }}
    className={`org-box ${variant} group`}
  >
    <div className="flex items-center gap-3 mb-2">
      <div className={`p-2 rounded-lg transition-colors ${variant === 'root' ? 'bg-amber-500/10 text-amber-500 group-hover:bg-amber-500/20' : 'bg-blue-500/10 text-blue-500 group-hover:bg-blue-500/20'}`}>
        {Icon ? <Icon size={16} /> : <User size={16} />}
      </div>
      <div className="role text-[10px] font-bold uppercase tracking-wider text-blue-400 group-hover:text-blue-300">{role}</div>
    </div>
    <div className="name text-base font-bold text-slate-100">{name}</div>
    {children}
  </motion.div>
);

export const OrganizationChart = () => {
  return (
    <div className="org-container min-h-screen bg-[#020617] p-10 overflow-x-auto selection:bg-blue-500/30">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-600/5 blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-amber-600/5 blur-[120px]" />
      </div>

      {/* Header */}
      <div className="org-header mb-20">
        <motion.div 
          initial={{ opacity: 0, letterSpacing: '0.1rem' }}
          animate={{ opacity: 1, letterSpacing: '0.4rem' }}
          className="org-title uppercase font-black text-amber-500/60 mb-4"
        >
          Organization Chart
        </motion.div>
        <div className="org-subtitle text-5xl font-black text-white tracking-tight">THE PENTAGON APARTMENT PROJECT</div>
      </div>

      <div className="org-chart-wrapper min-w-[1500px] flex flex-col items-center">
        {/* Connection Lines (Simplified SVG) */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-0" xmlns="http://www.w3.org/2000/svg">
          <path d="M 750 100 V 200" stroke="rgba(255,255,255,0.1)" strokeWidth="2" fill="none" />
          <path d="M 750 200 H 450 V 300" stroke="rgba(255,255,255,0.1)" strokeWidth="2" fill="none" />
          <path d="M 750 200 H 1050 V 300" stroke="rgba(255,255,255,0.1)" strokeWidth="2" fill="none" />
          {/* Main vertical line to structured box */}
          <path d="M 750 400 V 500" stroke="rgba(255,255,255,0.1)" strokeWidth="2" fill="none" strokeDasharray="5,5" />
        </svg>

        {/* Level 0: Root */}
        <div className="mb-20">
          <OrgBox role="Koordinator Project Manager" name="Agung Puji Susanto" variant="root" icon={Users} />
        </div>

        {/* Level 1: GM */}
        <div className="mb-20">
          <OrgBox role="General Manager" name="Ir. Suswanto H. Prawiro" variant="root" icon={Shield} />
        </div>

        {/* Level 2: PM & Finance */}
        <div className="flex gap-40 mb-32 z-10">
          <OrgBox role="Project Manager" name="Irphan" icon={Briefcase} />
          <OrgBox role="Finance Engineering & Administration" name="Risti Dini Astuti" icon={DraftingCompass} />
        </div>

        {/* Structured Box Group */}
        <div className="relative w-full max-w-[1500px] border-2 border-white/5 bg-white/[0.02] rounded-[60px] p-16 shadow-2xl backdrop-blur-3xl">
          <div className="tag-label text-slate-400 font-black tracking-[0.3em] bg-[#020617] px-8 border-x border-white/10 uppercase">
            Pekerjaan Struktur
          </div>

          {/* Floating Supports */}
          <div className="absolute -top-12 left-20">
            <OrgBox role="Quality Control Engineering" name="Prihantono" variant="support" icon={Search} />
          </div>
          <div className="absolute -top-12 right-20">
            <OrgBox role="HSE & Project Admin, Doc Control" name="Putri R. Taho" variant="support" icon={Search} />
          </div>

          {/* Managers Grid */}
          <div className="grid grid-cols-6 gap-8 mb-24">
            <OrgBox role="Engineering" name="Ibnu Gunawan" icon={DraftingCompass} />
            <OrgBox role="Quantity Surveyor" name="Tiara Nurmaliza" icon={Search} />
            <OrgBox role="Site Manager" name="Ihza H. Amri" icon={HardHat} />
            <OrgBox role="Purchasing" name="Charles T. Ardianata" icon={Warehouse} />
            <OrgBox role="HSE" name="Rinaldi" icon={ShieldAlert} />
            <OrgBox role="HSE" name="Fransiskus G.O" icon={Shield} />
          </div>

          {/* Sub-Teams Details */}
          <div className="grid grid-cols-6 gap-8 items-start">
            {/* Engineering Sub */}
            <div className="space-y-4">
              <div className="p-4 bg-white/[0.03] border border-white/10 rounded-2xl group hover:border-blue-500/30 transition-all">
                <div className="text-[10px] uppercase font-bold text-blue-400 mb-1">Surveyor</div>
                <div className="text-sm font-bold text-white mb-3">Tri Santoby</div>
                <div className="pl-3 border-l border-blue-500/20">
                  <div className="text-[9px] uppercase text-slate-500">Asst. Surveyor</div>
                  <div className="text-[11px] font-bold text-slate-300">Muh. Ady</div>
                  <div className="text-[9px] uppercase text-slate-600 mt-2">Harian Helper</div>
                  <div className="text-[11px] font-medium text-slate-400">SANTO</div>
                </div>
              </div>
              <div className="p-4 bg-white/[0.03] border border-white/10 rounded-2xl group hover:border-blue-500/30 transition-all">
                <div className="text-[10px] uppercase font-bold text-blue-400 mb-1">Surveyor</div>
                <div className="text-sm font-bold text-white mb-3">Yogi</div>
                <div className="pl-3 border-l border-blue-500/20">
                  <div className="text-[9px] uppercase text-slate-500">Mech & Storing</div>
                  <div className="text-[11px] font-bold text-slate-300">Miftah Suhendri</div>
                  <div className="text-[9px] uppercase text-slate-600 mt-2">Harian Helper</div>
                  <div className="text-[11px] font-medium text-slate-400">HERRY</div>
                </div>
              </div>
            </div>

            {/* Empty space for QS */}
            <div />

            {/* Site Manager Sub */}
            <div className="space-y-4">
              <div className="p-4 bg-amber-500/[0.03] border border-amber-500/10 rounded-2xl group hover:border-amber-500/30 transition-all">
                <div className="text-[10px] uppercase font-bold text-amber-500 mb-1">Supervisor Zone 1</div>
                <div className="text-sm font-bold text-white mb-2">Ibrahim Aji</div>
                <div className="text-[9px] text-slate-400 line-clamp-3">
                  Pabrikasi/Instalasi Bekisting, Pengecoran (WANTO)<br/>
                  Pabrikasi/Instalasi Besi (SLAMET)
                </div>
              </div>
              <div className="p-4 bg-amber-500/[0.03] border border-amber-500/10 rounded-2xl group hover:border-amber-500/30 transition-all">
                <div className="text-[10px] uppercase font-bold text-amber-500 mb-1">Supervisor Zone 2</div>
                <div className="text-sm font-bold text-white mb-2">M. Ridhoi</div>
                <div className="text-[9px] text-slate-400">
                  Pabrikasi/Instalasi Bekisting, Pengecoran (HARIYANTO)
                </div>
              </div>
            </div>

            {/* Purchasing Sub */}
            <div className="p-4 bg-white/[0.03] border border-white/10 rounded-2xl">
              <div className="text-[10px] uppercase font-bold text-blue-400 mb-1">Warehouse</div>
              <div className="text-sm font-bold text-white">Habib</div>
            </div>

            {/* 5R Team */}
            <div className="space-y-2">
              <div className="text-center text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">Division 5R</div>
              {['ANTON', 'ACH. FORKON', 'RUSMONO', 'APANDI', 'SLAMET UTAMI'].map(name => (
                <div key={name} className="flex justify-between items-center p-2 bg-white/[0.02] border border-white/5 rounded-lg text-[10px]">
                  <span className="font-bold text-slate-300">{name}</span>
                  <span className="text-slate-600 font-black">5R</span>
                </div>
              ))}
            </div>

            {/* Security Team */}
            <div className="space-y-2">
              <div className="text-center text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">Security</div>
              {['Fedianus Giawa', 'Anton', 'Yelvin Putra', 'Moh. Sham', 'Rengga Yuswanto', 'Yefitritus Laoli', 'Muhaddis'].map(name => (
                <div key={name} className="flex justify-between items-center p-2 bg-blue-500/[0.03] border border-blue-500/5 rounded-lg text-[10px]">
                  <span className="font-bold text-slate-300">{name}</span>
                  <span className="text-blue-500/40 font-black">SEC</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Separate Architecture Box */}
        <div className="mt-20 self-end mr-4">
           <div className="p-8 border-2 border-dashed border-white/10 rounded-[40px] bg-white/[0.02] w-[300px]">
              <div className="text-xs font-black uppercase tracking-widest text-blue-400 mb-6 border-b border-white/5 pb-2">Arsitektur & Add. Work</div>
              <div className="space-y-4">
                 <div className="p-4 bg-white/[0.04] rounded-2xl border border-white/5 font-bold text-slate-200">Charles T. Ardianata</div>
                 <div className="p-4 bg-white/[0.04] rounded-2xl border border-white/5 font-bold text-slate-200">Kendrick Marzuki</div>
              </div>
           </div>
        </div>
      </div>

      {/* Footer */}
      <div className="footer-section mt-32 max-w-[1500px] mx-auto border-t border-white/10 pt-16 flex justify-between items-end">
        <div className="text-slate-500 font-medium">Batam, 14 November 2025</div>
        <div className="text-right">
          <div className="text-slate-500 uppercase tracking-[0.2em] text-xs font-black mb-4">Disetujui Oleh</div>
          <div className="text-3xl font-black text-white mb-1 tracking-tight">Ir. Suswanto H. Prawiro</div>
          <div className="text-amber-500 uppercase tracking-widest text-[10px] font-black">General Manager</div>
        </div>
      </div>
    </div>
  );
};
