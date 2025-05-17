import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Eye, Sliders, Bluetooth, Gauge, Menu, X } from 'lucide-react';
import { ResizableNavbar } from './ui/resizable-navbar';
import { motion } from 'framer-motion';
import ThemeToggle from './ThemeToggle';

const Navbar: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setIsMenuOpen(false);
  }, [location]);

  const navLinks = [
    { to: '/', label: 'Home', icon: <Eye size={20} /> },
    { to: '/calibration', label: 'Calibration', icon: <Sliders size={20} /> },
    { to: '/bluetooth', label: 'Bluetooth', icon: <Bluetooth size={20} /> },
    { to: '/gaze-tracking', label: 'Control', icon: <Gauge size={20} /> },
  ];

  return (
    <ResizableNavbar
      expanded={isExpanded}
      onExpand={setIsExpanded}
      className={`backdrop-blur-md ${
        isScrolled 
          ? 'bg-white/80 dark:bg-gray-900/80 shadow-md' 
          : 'bg-transparent'
      }`}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <NavLink 
            to="/" 
            className="flex items-center space-x-2 text-blue-600 dark:text-blue-400 font-bold text-xl"
          >
            <Eye size={28} />
            <span>GazeWheel</span>
          </NavLink>

          <div className="flex items-center space-x-4">
            <ThemeToggle />
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden flex items-center"
              aria-label="Toggle menu"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>

          <nav className="hidden md:flex space-x-8">
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `flex items-center space-x-1 py-2 px-1 border-b-2 transition-all duration-300 ${
                    isActive 
                      ? 'border-blue-600 dark:border-blue-400 text-blue-600 dark:text-blue-400' 
                      : 'border-transparent hover:border-blue-300 dark:hover:border-blue-500 hover:text-blue-500 dark:hover:text-blue-300'
                  }`
                }
              >
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center space-x-1"
                >
                  {link.icon}
                  <span>{link.label}</span>
                </motion.div>
              </NavLink>
            ))}
          </nav>
        </div>
      </div>

      <motion.div 
        initial={false}
        animate={{
          height: isMenuOpen ? 'auto' : 0,
          opacity: isMenuOpen ? 1 : 0
        }}
        transition={{ duration: 0.2 }}
        className="md:hidden overflow-hidden bg-white/95 dark:bg-gray-900/95 backdrop-blur-md shadow-lg"
      >
        <nav className="flex flex-col px-4 py-2">
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `flex items-center space-x-3 py-3 px-2 border-l-4 ${
                  isActive 
                    ? 'border-blue-600 dark:border-blue-400 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30' 
                    : 'border-transparent hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-blue-300 dark:hover:border-blue-500'
                }`
              }
            >
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center space-x-3"
              >
                {link.icon}
                <span>{link.label}</span>
              </motion.div>
            </NavLink>
          ))}
        </nav>
      </motion.div>
    </ResizableNavbar>
  );
};

export default Navbar;