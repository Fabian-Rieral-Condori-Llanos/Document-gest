import { Outlet } from 'react-router-dom';
import Navbar from '../Navbar/Navbar';

/**
 * MainLayout - Layout principal para páginas autenticadas
 * 
 * Incluye:
 * - Navbar lateral con slide-in/out
 * - Área de contenido principal
 */
const MainLayout = ({ children }) => {
  return (
    <div className="min-h-screen bg-bg-primary">
      {/* Navbar lateral */}
      <Navbar />
      
      {/* Contenido principal */}
      <main className="min-h-screen transition-all duration-300">
        {/* El contenido tiene padding-left para el trigger del navbar */}
        <div className="pl-0">
          {children || <Outlet />}
        </div>
      </main>
    </div>
  );
};

export default MainLayout;