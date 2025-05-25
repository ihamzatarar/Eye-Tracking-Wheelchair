import React from 'react';
import { Eye, Github, Twitter, Linkedin } from 'lucide-react';
import { Button } from './ui/button';
import { cn } from '../lib/utils';

const Footer: React.FC = () => {
  return (
    <footer className="bg-muted text-muted-foreground pt-12 pb-8">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center mb-8">
          <div className="flex items-center space-x-2 text-primary font-bold text-xl mb-6 md:mb-0">
            <Eye className="h-7 w-7" />
            <span>GazeWheel</span>
          </div>
          
          <div className="flex space-x-6">
            <Button variant="ghost" size="icon" asChild>
              <a href="#" className="hover:text-primary transition-colors duration-200">
                <Github className="h-5 w-5" />
              </a>
            </Button>
            <Button variant="ghost" size="icon" asChild>
              <a href="#" className="hover:text-primary transition-colors duration-200">
                <Twitter className="h-5 w-5" />
              </a>
            </Button>
            <Button variant="ghost" size="icon" asChild>
              <a href="#" className="hover:text-primary transition-colors duration-200">
                <Linkedin className="h-5 w-5" />
              </a>
            </Button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          <div>
            <h3 className="text-foreground font-semibold mb-4">About</h3>
            <p className="text-sm leading-relaxed">
              GazeWheel is a revolutionary gaze-tracking wheelchair system, designed to enhance 
              independence and mobility for individuals with limited motor functions.
            </p>
          </div>
          
          <div>
            <h3 className="text-foreground font-semibold mb-4">Contact</h3>
            <p className="text-sm mb-2">Email: info@gazewheel.com</p>
            <p className="text-sm mb-2">Phone: +1 (555) 123-4567</p>
            <p className="text-sm">Address: 123 Innovation Lane, Tech City</p>
          </div>
          
          <div>
            <h3 className="text-foreground font-semibold mb-4">Support</h3>
            <ul className="text-sm space-y-2">
              <li>
                <Button variant="link" className="p-0 h-auto text-muted-foreground hover:text-primary">
                  Help Center
                </Button>
              </li>
              <li>
                <Button variant="link" className="p-0 h-auto text-muted-foreground hover:text-primary">
                  Documentation
                </Button>
              </li>
              <li>
                <Button variant="link" className="p-0 h-auto text-muted-foreground hover:text-primary">
                  Terms of Service
                </Button>
              </li>
              <li>
                <Button variant="link" className="p-0 h-auto text-muted-foreground hover:text-primary">
                  Privacy Policy
                </Button>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-border pt-6 text-center text-sm">
          <p>&copy; {new Date().getFullYear()} GazeWheel. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;