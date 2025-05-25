import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Eye, Sliders, Bluetooth, Gauge, Menu, X, Settings } from 'lucide-react';
import { ResizableNavbar } from './ui/resizable-navbar';
import { motion } from 'framer-motion';
import ThemeToggle from './ThemeToggle';
import { Button } from './ui/button';
import { cn } from '../lib/utils';

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
    { to: '/', label: 'Home', icon: <Eye className="h-5 w-5" /> },
    { to: '/calibration', label: 'Calibration', icon: <Sliders className="h-5 w-5" /> },
    { to: '/bluetooth', label: 'Bluetooth', icon: <Bluetooth className="h-5 w-5" /> },
    { to: '/gaze-tracking', label: 'Control', icon: <Gauge className="h-5 w-5" /> },
    { to: '/settings', label: 'Settings', icon: <Settings className="h-5 w-5" /> },
  ];

  return (
    <ResizableNavbar
      expanded={isExpanded}
      onExpand={setIsExpanded}
      className={cn(
        "backdrop-blur-md transition-colors duration-200",
        isScrolled 
          ? "bg-background/80 shadow-md" 
          : "bg-transparent"
      )}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <NavLink 
            to="/" 
            className="flex items-center space-x-2 text-primary font-bold text-xl"
          >
            <Eye className="h-7 w-7" />
            <span>GazeWheel</span>
          </NavLink>

          <div className="flex items-center space-x-4 md:hidden">
            <Button 
              variant="ghost"
              size="icon"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Toggle menu"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>

          <nav className="hidden md:flex space-x-8">
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  cn(
                    "flex items-center space-x-1 py-2 px-1 border-b-2 transition-all duration-300",
                    isActive 
                      ? "border-primary text-primary" 
                      : "border-transparent hover:border-primary/50 hover:text-primary/80"
                  )
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
            <div className="flex items-center ml-6">
              <ThemeToggle />
            </div>
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
        className="md:hidden overflow-hidden bg-background/95 backdrop-blur-md shadow-lg"
      >
        <nav className="flex flex-col px-4 py-2">
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                cn(
                  "flex items-center space-x-3 py-3 px-2 border-l-4",
                  isActive 
                    ? "border-primary text-primary bg-primary/10" 
                    : "border-transparent hover:bg-muted hover:border-primary/50"
                )
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
          <div className="flex items-center mt-4">
            <ThemeToggle />
          </div>
        </nav>
      </motion.div>
    </ResizableNavbar>
  );
};

export default Navbar;