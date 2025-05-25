import React from 'react';
import { Eye, Github, Linkedin } from 'lucide-react';
import { Button } from './ui/button';

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
              <a href="https://github.com/ihamzatarar" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors duration-200">
                <Github className="h-5 w-5" />
              </a>
            </Button>
            <Button variant="ghost" size="icon" asChild>
              <a href="https://x.com/ihamzatarar" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors duration-200">
                <span className="font-bold text-lg">X</span>
              </a>
            </Button>
            <Button variant="ghost" size="icon" asChild>
              <a href="https://www.linkedin.com/in/hamza-tarar/" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors duration-200">
                <Linkedin className="h-5 w-5" />
              </a>
            </Button>
            <Button variant="ghost" size="icon" asChild>
              <a href="https://ihamzatarar.github.io/portfolio/" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors duration-200">
                <span className="font-bold text-lg">P</span>
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
            <p className="text-sm mb-2">Email: <a href="mailto:ihamzatarar@gmail.com" className="underline hover:text-primary">ihamzatarar@gmail.com</a></p>
            <p className="text-sm mb-2">Address: Forman Christian College, Ferozepur Road, Lahore 54600</p>
            <p className="text-sm mb-2">Phone: +92 325 5525557</p>
          </div>
          
          <div>
            <h3 className="text-foreground font-semibold mb-4">Support</h3>
            <ul className="text-sm space-y-2">
              <li>
                <Button variant="link" className="p-0 h-auto text-muted-foreground hover:text-primary" asChild>
                  <a href="mailto:ihamzatarar@gmail.com?subject=Help%20Center%20Inquiry">Help Center</a>
                </Button>
              </li>
              <li>
                <Button variant="link" className="p-0 h-auto text-muted-foreground hover:text-primary" asChild>
                  <a href="/documentation" target="_blank" rel="noopener noreferrer">Documentation</a>
                </Button>
              </li>
              <li>
                <Button variant="link" className="p-0 h-auto text-muted-foreground hover:text-primary" asChild>
                  <a href="/privacy-policy">Privacy Policy</a>
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