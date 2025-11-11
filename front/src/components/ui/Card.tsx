import type { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
  padding?: "none" | "sm" | "md" | "lg";
  hover?: boolean;
}

const paddingStyles = {
  none: "",
  sm: "p-4",
  md: "p-6",
  lg: "p-8",
};

export function Card({ children, className = "", padding = "md", hover = false }: CardProps) {
  return (
    <div
      className={`
        bg-white rounded shadow
        ${paddingStyles[padding]}
        ${hover ? "hover:shadow-md" : ""}
        ${className}
      `}
    >
      {children}
    </div>
  );
}
