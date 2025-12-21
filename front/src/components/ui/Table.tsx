import { forwardRef, type ReactNode, type CSSProperties } from "react";

interface TableProps {
  children: ReactNode;
  className?: string;
}

export function Table({ children, className = "" }: TableProps) {
  return (
    <div className="overflow-x-auto">
      <table className={`w-full border-collapse bg-white shadow rounded ${className}`}>
        {children}
      </table>
    </div>
  );
}

interface TableHeaderProps {
  children: ReactNode;
}

export function TableHeader({ children }: TableHeaderProps) {
  return (
    <thead>
      <tr className="bg-gray-100">{children}</tr>
    </thead>
  );
}

interface TableBodyProps {
  children: ReactNode;
}

export function TableBody({ children }: TableBodyProps) {
  return <tbody>{children}</tbody>;
}

interface TableRowProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  style?: CSSProperties;
}

export const TableRow = forwardRef<HTMLTableRowElement, TableRowProps>(
  ({ children, className = "", onClick, style }, ref) => {
    return (
      <tr
        ref={ref}
        className={`hover:bg-gray-50 ${onClick ? "cursor-pointer" : ""} ${className}`}
        onClick={onClick}
        style={style}
      >
        {children}
      </tr>
    );
  }
);

TableRow.displayName = "TableRow";

interface TableHeadProps {
  children?: ReactNode;
  align?: "left" | "center" | "right";
  className?: string;
}

export function TableHead({ children, align = "left", className = "" }: TableHeadProps) {
  const alignStyles = {
    left: "text-left",
    center: "text-center",
    right: "text-right",
  };

  return (
    <th className={`border border-gray-300 px-4 py-2 ${alignStyles[align]} ${className}`}>
      {children}
    </th>
  );
}

interface TableCellProps {
  children: ReactNode;
  align?: "left" | "center" | "right";
  className?: string;
}

export function TableCell({ children, align = "left", className = "" }: TableCellProps) {
  const alignStyles = {
    left: "text-left",
    center: "text-center",
    right: "text-right",
  };

  return (
    <td className={`border border-gray-300 px-4 py-2 ${alignStyles[align]} ${className}`}>
      {children}
    </td>
  );
}

interface EmptyStateProps {
  message: string;
  colSpan: number;
}

export function TableEmptyState({ message, colSpan }: EmptyStateProps) {
  return (
    <tr>
      <td colSpan={colSpan} className="border border-gray-300 px-4 py-8 text-center text-gray-500">
        {message}
      </td>
    </tr>
  );
}
