import React from 'react';
import './SidebarMenu.css';

interface SidebarMenuProps {
  onSelect: (page: string) => void;
  currentPage: string;
}

const SidebarMenu: React.FC<SidebarMenuProps> = ({ onSelect, currentPage }: SidebarMenuProps) => {
  return (
    <aside className="sidebar-menu">
      <div className="sidebar-title">Menu</div>
      <button className={currentPage === 'dashboard' ? 'active' : ''} onClick={() => onSelect('dashboard')}>
        📊 Dashboard
      </button>
      <button className={currentPage === 'scanner' ? 'active' : ''} onClick={() => onSelect('scanner')}>
        � Scan Instruments
      </button>
      <button className={currentPage === 'logs' ? 'active' : ''} onClick={() => onSelect('logs')}>
        📜 Logging
      </button>
      <button className={currentPage === 'diagnosis' ? 'active' : ''} onClick={() => onSelect('diagnosis')}>
        🧠 Smart Diagnosis
      </button>
    </aside>
  );
};

export default SidebarMenu;
