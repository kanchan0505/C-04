import Link from 'next/link';
import { useRouter } from 'next/router';
import { LayoutDashboard, Upload, Users, Briefcase, FileText, Menu, X } from 'lucide-react';
import { useState } from 'react';

const NAV_ITEMS = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/upload', label: 'Data Ingestion', icon: Upload },
  { href: '/students', label: 'Students', icon: Users },
  { href: '/placement', label: 'Placement', icon: Briefcase },
  { href: '/report', label: 'NBA Report', icon: FileText },
];

export default function Navbar() {
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-40 border-b border-white/5" style={{ background: 'rgba(2, 6, 23, 0.8)', backdropFilter: 'blur(16px)' }}>
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-primary-500/20 group-hover:shadow-primary-500/40 transition-shadow">
              C4
            </div>
            <div>
              <span className="text-sm font-bold text-white tracking-tight">NBA Criteria 4</span>
              <span className="hidden sm:block text-[10px] text-surface-400 -mt-0.5 tracking-wide">Automation System</span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
              const isActive = router.pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-primary-500/15 text-primary-400 shadow-sm shadow-primary-500/10'
                      : 'text-surface-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon size={16} strokeWidth={isActive ? 2.5 : 2} />
                  {label}
                </Link>
              );
            })}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 rounded-lg text-surface-400 hover:text-white hover:bg-white/5 transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
            id="mobile-menu-toggle"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Mobile Nav */}
        {mobileOpen && (
          <div className="md:hidden pb-4 space-y-1">
            {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
              const isActive = router.pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-primary-500/15 text-primary-400'
                      : 'text-surface-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon size={18} />
                  {label}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </nav>
  );
}
