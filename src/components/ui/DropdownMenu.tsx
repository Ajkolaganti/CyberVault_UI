"use client";

import { Button } from "./Button";
import { ChevronDown } from "lucide-react";
import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

type DropdownMenuProps = {
  options: {
    label: string;
    onClick: () => void;
    Icon?: React.ReactNode;
    variant?: 'default' | 'danger';
  }[];
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
};

const DropdownMenu = ({ 
  options, 
  children, 
  variant = 'ghost',
  size = 'sm',
  className = ''
}: DropdownMenuProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <Button
        onClick={toggleDropdown}
        variant={variant}
        size={size}
        className="flex items-center gap-2"
      >
        {children}
        <motion.span
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2, ease: "easeInOut" }}
        >
          <ChevronDown className="h-4 w-4" />
        </motion.span>
      </Button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ y: -5, scale: 0.95, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            exit={{ y: -5, scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute right-0 z-50 w-48 mt-2 bg-white rounded-lg shadow-lg border border-gray-200 py-1"
          >
            {options && options.length > 0 ? (
              options.map((option, index) => (
                <motion.button
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{
                    duration: 0.15,
                    delay: index * 0.05,
                    ease: "easeOut",
                  }}
                  key={`${option.label}-${index}`}
                  onClick={() => {
                    option.onClick();
                    setIsOpen(false);
                  }}
                  className={`w-full px-3 py-2 text-left text-sm flex items-center gap-2 hover:bg-gray-50 transition-colors ${
                    option.variant === 'danger' 
                      ? 'text-red-600 hover:bg-red-50' 
                      : 'text-gray-700'
                  }`}
                >
                  {option.Icon && (
                    <span className={option.variant === 'danger' ? 'text-red-500' : 'text-gray-500'}>
                      {option.Icon}
                    </span>
                  )}
                  {option.label}
                </motion.button>
              ))
            ) : (
              <div className="px-3 py-2 text-gray-500 text-sm">No options</div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export { DropdownMenu };
