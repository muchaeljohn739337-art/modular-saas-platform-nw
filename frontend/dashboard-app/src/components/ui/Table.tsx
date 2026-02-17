import React from "react";

interface TableColumn {
  key: string;
  title: string;
  render?: (value: any, row: any) => React.ReactNode;
  className?: string;
}

interface TableProps {
  columns: TableColumn[];
  data: any[];
  className?: string;
  striped?: boolean;
  hover?: boolean;
  compact?: boolean;
}

export default function Table({
  columns,
  data,
  className = "",
  striped = false,
  hover = true,
  compact = false,
}: TableProps) {
  const getRowClassName = (index: number) => {
    let classes = "";
    if (striped && index % 2 === 1) classes += "bg-gray-50";
    if (hover) classes += " hover:bg-gray-100";
    if (compact) classes += " py-2";
    return classes;
  };

  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${column.className || ""}`}
              >
                {column.title}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data.map((row, index) => (
            <tr key={index} className={getRowClassName(index)}>
              {columns.map((column) => (
                <td
                  key={column.key}
                  className={`px-6 py-4 whitespace-nowrap text-sm text-gray-900 ${column.className || ""}`}
                >
                  {column.render ? column.render(row[column.key], row) : row[column.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
