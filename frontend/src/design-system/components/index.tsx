import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Download, Eye, EyeOff } from 'lucide-react';

// ─── PREMIUM BUTTON ──────────────────────────────────────────
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'success';
}

export const PremiumButton: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  className = '', 
  ...props 
}) => {
  const baseStyle = "px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer shadow-sm active:scale-95";
  const variants = {
    primary: "bg-brand hover:bg-brand-hover text-white shadow-brand/10",
    secondary: "bg-white/5 hover:bg-white/10 text-gray-200 border border-white/5",
    danger: "bg-danger hover:bg-red-600 text-white shadow-red-500/10",
    success: "bg-success hover:bg-emerald-600 text-white shadow-emerald-500/10"
  };

  return (
    <button 
      className={`${baseStyle} ${variants[variant]} ${className}`} 
      {...props}
    >
      {children}
    </button>
  );
};

// ─── PREMIUM CARD ────────────────────────────────────────────
interface CardProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

export const PremiumCard: React.FC<CardProps> = ({ 
  title, 
  subtitle, 
  children, 
  action, 
  className = '' 
}) => {
  return (
    <div className={`glass-panel p-5 rounded-2xl border border-white/5 shadow-lg shadow-black/10 hover:border-white/10 transition-all duration-300 ${className}`}>
      <div className="flex items-center justify-between border-b border-white/5 pb-3.5 mb-4">
        <div>
          <h3 className="text-xs font-extrabold text-white uppercase tracking-wider">{title}</h3>
          {subtitle && <p className="text-[10px] text-gray-400 mt-0.5">{subtitle}</p>}
        </div>
        {action && <div>{action}</div>}
      </div>
      {children}
    </div>
  );
};

// ─── SKELETON LOADER ──────────────────────────────────────────
export const SkeletonLoader: React.FC<{ count?: number }> = ({ count = 3 }) => {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="w-full h-12 rounded-xl bg-white/5 animate-pulse border border-white/5" />
      ))}
    </div>
  );
};

// ─── PREMIUM INPUT ────────────────────────────────────────────
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export const PremiumInput: React.FC<InputProps> = ({ 
  label, 
  error, 
  type = 'text', 
  className = '', 
  ...props 
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';

  return (
    <div className="space-y-1.5 text-left">
      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{label}</label>
      <div className="relative">
        <input 
          type={isPassword ? (showPassword ? 'text' : 'password') : type}
          className={`w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-brand transition-all ${className} ${error ? 'border-danger focus:border-danger' : ''}`}
          {...props}
        />
        {isPassword && (
          <button 
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        )}
      </div>
      {error && <span className="text-[10px] font-semibold text-danger block">{error}</span>}
    </div>
  );
};

// ─── PREMIUM DATA TABLE ───────────────────────────────────────
interface TableProps {
  headers: string[];
  data: any[][];
  onExportCSV?: () => void;
  title?: string;
}

export const PremiumTable: React.FC<TableProps> = ({ 
  headers, 
  data, 
  onExportCSV,
  title
}) => {
  const [sortCol, setSortCol] = useState<number | null>(null);
  const [sortAsc, setSortAsc] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const rowsPerPage = 5;

  const handleSort = (colIndex: number) => {
    if (sortCol === colIndex) {
      setSortAsc(!sortAsc);
    } else {
      setSortCol(colIndex);
      setSortAsc(true);
    }
  };

  // Filter
  const filteredData = data.filter(row => 
    row.some(val => 
      String(val).toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  // Sort
  const sortedData = [...filteredData];
  if (sortCol !== null) {
    sortedData.sort((a, b) => {
      const aVal = String(a[sortCol]);
      const bVal = String(b[sortCol]);
      return sortAsc ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    });
  }

  // Paginate
  const pageData = sortedData.slice(
    currentPage * rowsPerPage, 
    (currentPage + 1) * rowsPerPage
  );

  const totalPages = Math.ceil(sortedData.length / rowsPerPage);

  const exportToCSV = () => {
    if (onExportCSV) {
      onExportCSV();
      return;
    }
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...data.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${title || 'export'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="glass-panel rounded-2xl border border-white/5 overflow-hidden">
      <div className="p-4 border-b border-white/5 flex flex-col sm:flex-row gap-3 justify-between items-center bg-white/[0.01]">
        {title && <h3 className="text-xs font-extrabold text-white uppercase tracking-wider">{title}</h3>}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <input 
            type="text" 
            placeholder="Search records..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-dark-bg border border-white/10 text-xs text-white placeholder-gray-500 focus:outline-none w-full sm:w-48"
          />
          <button 
            onClick={exportToCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-brand hover:bg-brand-hover text-white text-xs font-bold rounded-lg cursor-pointer"
          >
            <Download className="h-3.5 w-3.5" /> CSV
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-white/5 text-[10px] text-gray-500 uppercase font-extrabold bg-white/[0.01]">
              {headers.map((h, i) => (
                <th 
                  key={i} 
                  onClick={() => handleSort(i)}
                  className="p-3 cursor-pointer select-none hover:text-white transition-colors"
                >
                  <div className="flex items-center gap-1">
                    {h}
                    {sortCol === i ? (sortAsc ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />) : null}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="text-xs text-gray-300">
            {pageData.map((row, rIdx) => (
              <tr key={rIdx} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                {row.map((cell, cIdx) => (
                  <td key={cIdx} className="p-3">{cell}</td>
                ))}
              </tr>
            ))}
            {pageData.length === 0 && (
              <tr>
                <td colSpan={headers.length} className="p-8 text-center text-gray-500">
                  No records match search filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="p-3 border-t border-white/5 flex justify-between items-center text-xs text-gray-400 bg-white/[0.01]">
          <span>Page {currentPage + 1} of {totalPages}</span>
          <div className="flex gap-1">
            <button 
              disabled={currentPage === 0}
              onClick={() => setCurrentPage(currentPage - 1)}
              className="px-2.5 py-1 rounded bg-white/5 hover:bg-white/10 disabled:opacity-30 cursor-pointer"
            >
              Previous
            </button>
            <button 
              disabled={currentPage === totalPages - 1}
              onClick={() => setCurrentPage(currentPage + 1)}
              className="px-2.5 py-1 rounded bg-white/5 hover:bg-white/10 disabled:opacity-30 cursor-pointer"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
