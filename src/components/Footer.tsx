import React from 'react';
import { Eye, Github, Twitter, Linkedin } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-900 text-gray-300 pt-12 pb-8">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center mb-8">
          <div className="flex items-center space-x-2 text-white font-bold text-xl mb-6 md:mb-0">
            <Eye size={28} />
            <span>GazeWheel</span>
          </div>
          
          <div className="flex space-x-6">
            <a href="#" className="hover:text-white transition-colors duration-200">
              <Github size={20} />
            </a>
            <a href="#" className="hover:text-white transition-colors duration-200">
              <Twitter size={20} />
            </a>
            <a href="#" className="hover:text-white transition-colors duration-200">
              <Linkedin size={20} />
            </a>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          <div>
            <h3 className="text-white font-semibold mb-4">About</h3>
            <p className="text-sm leading-relaxed">
              GazeWheel is a revolutionary gaze-tracking wheelchair system, designed to enhance 
              independence and mobility for individuals with limited motor functions.
            </p>
          </div>
          
          <div>
            <h3 className="text-white font-semibold mb-4">Contact</h3>
            <p className="text-sm mb-2">Email: info@gazewheel.com</p>
            <p className="text-sm mb-2">Phone: +1 (555) 123-4567</p>
            <p className="text-sm">Address: 123 Innovation Lane, Tech City</p>
          </div>
          
          <div>
            <h3 className="text-white font-semibold mb-4">Support</h3>
            <ul className="text-sm space-y-2">
              <li><a href="#" className="hover:text-white transition-colors duration-200">Help Center</a></li>
              <li><a href="#" className="hover:text-white transition-colors duration-200">Documentation</a></li>
              <li><a href="#" className="hover:text-white transition-colors duration-200">Terms of Service</a></li>
              <li><a href="#" className="hover:text-white transition-colors duration-200">Privacy Policy</a></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-gray-800 pt-6 text-center text-sm">
          <p>&copy; {new Date().getFullYear()} GazeWheel. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;