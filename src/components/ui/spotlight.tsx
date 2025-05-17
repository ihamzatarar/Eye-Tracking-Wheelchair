import React from "react";

export const Spotlight = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => {
  return (
    <div
      className={`relative flex flex-col items-center justify-center overflow-hidden bg-gray-950 ${className}`}
    >
      <div className="relative flex w-full flex-1 scale-y-125 items-center justify-center isolate z-0 ">
        <div className="absolute inset-auto right-1/2 h-56 w-[30rem] bg-gradient-to-r from-transparent to-cyan-500 blur-[100px] transform translate-x-[50%]" />
        <div className="absolute inset-auto left-1/2 h-56 w-[30rem] bg-gradient-to-l from-transparent to-indigo-500 blur-[100px] transform translate-x-[-50%]" />
      </div>
      <div className="relative z-10">{children}</div>
    </div>
  );
};