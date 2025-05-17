import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/utils/cn";

export const ResizablePanel = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <motion.div
      layout
      className={cn("w-full overflow-hidden", className)}
      transition={{
        type: "spring",
        stiffness: 500,
        damping: 30,
      }}
    >
      {children}
    </motion.div>
  );
};

export const ResizableNavbar = ({
  children,
  expanded,
  onExpand,
  className,
}: {
  children: React.ReactNode;
  expanded: boolean;
  onExpand: (expanded: boolean) => void;
  className?: string;
}) => {
  return (
    <nav
      onMouseEnter={() => onExpand(true)}
      onMouseLeave={() => onExpand(false)}
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        className
      )}
    >
      <ResizablePanel>
        <AnimatePresence>
          {expanded ? (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
            >
              {children}
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
            >
              {children}
            </motion.div>
          )}
        </AnimatePresence>
      </ResizablePanel>
    </nav>
  );
};