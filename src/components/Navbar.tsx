
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";

const Navbar = () => {
  return (
    <header className="w-full border-b border-gray-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 sticky top-0 z-40">
      <div className="container-custom flex h-16 items-center justify-between">
        <div className="flex items-center gap-2">
          <Link to="/" className="flex items-center gap-2">
            <svg 
              className="h-8 w-8 text-research-800" 
              viewBox="0 0 24 24" 
              fill="none" 
              xmlns="http://www.w3.org/2000/svg">
              <path 
                d="M3 19V5C3 3.89543 3.89543 3 5 3H19C20.1046 3 21 3.89543 21 5V19C21 20.1046 20.1046 21 19 21H5C3.89543 21 3 20.1046 3 19Z" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"/>
              <path 
                d="M7 7H17M7 12H17M7 17H13" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"/>
            </svg>
            <span className="font-serif text-xl font-bold text-research-900">Research Studio</span>
          </Link>
        </div>
        <nav className="hidden md:flex items-center gap-6">
          <Link to="/" className="text-sm font-medium text-gray-700 hover:text-research-700 transition-colors">Home</Link>
          <Link to="/features" className="text-sm font-medium text-gray-700 hover:text-research-700 transition-colors">Features</Link>
          <Link to="/pricing" className="text-sm font-medium text-gray-700 hover:text-research-700 transition-colors">Pricing</Link>
        </nav>
        <div className="flex items-center gap-4">
          <Button variant="ghost" className="text-sm font-medium text-gray-700">Sign In</Button>
          <Button className="bg-research-700 hover:bg-research-800 text-white">Get Started</Button>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
