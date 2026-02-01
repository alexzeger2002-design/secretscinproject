import { Link, useLocation } from 'react-router-dom';
import { authService } from '../services/authService';
import { useNavigate } from 'react-router-dom';

export function AdminNav() {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    authService.logout();
    navigate('/admin/login');
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="bg-[#0F0F1A] border-b border-white/10 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <h1 className="text-xl font-bold text-white">PULSE ROOM Admin</h1>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <Link
                to="/admin/dashboard"
                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors ${
                  isActive('/admin/dashboard')
                    ? 'border-[#FF007A] text-white'
                    : 'border-transparent text-[#94A3B8] hover:border-gray-600 hover:text-white'
                }`}
              >
                Панель
              </Link>
              <Link
                to="/admin/links"
                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors ${
                  isActive('/admin/links')
                    ? 'border-[#FF007A] text-white'
                    : 'border-transparent text-[#94A3B8] hover:border-gray-600 hover:text-white'
                }`}
              >
                Ссылки
              </Link>
              <Link
                to="/admin/stats"
                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors ${
                  isActive('/admin/stats')
                    ? 'border-[#FF007A] text-white'
                    : 'border-transparent text-[#94A3B8] hover:border-gray-600 hover:text-white'
                }`}
              >
                Статистика
              </Link>
            </div>
          </div>
          <div className="flex items-center">
            <button
              onClick={handleLogout}
              className="text-[#94A3B8] hover:text-white px-3 py-2 text-sm font-medium transition-colors"
            >
              Выйти
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
