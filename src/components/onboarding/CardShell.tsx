import React from "react";

type Props = {
  children: React.ReactNode;
  className?: string;
};

export const CardShell = ({ children, className = "" }: Props) => (
  <div
    className={`rounded-3xl p-5 border-2 border-background ${className}`}
    style={{
      background: "hsl(0 0% 96%)",
      boxShadow: "0 1px 4px hsl(220 14% 10% / 0.03)",
    }}
  >
    {children}
  </div>
);
