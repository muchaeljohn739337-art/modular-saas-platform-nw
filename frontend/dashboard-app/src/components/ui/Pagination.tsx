import React from "react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  showFirstLast?: boolean;
  showPreviousNext?: boolean;
  className?: string;
}

export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  showFirstLast = true,
  showPreviousNext = true,
  className = "",
}: PaginationProps) {
  const getVisiblePages = () => {
    const delta = 2;
    const range = [];
    const rangeWithDots = (start: number, end: number) => {
      for (let i = start; i <= end; i++) {
        range.push(i);
      }
      return range;
    };

    if (totalPages <= 7) {
      return rangeWithDots(1, totalPages);
    }

    if (currentPage <= 4) {
      return [...rangeWithDots(1, 5), "...", totalPages];
    }

    if (currentPage >= totalPages - 3) {
      return [1, "...", ...rangeWithDots(totalPages - 4, totalPages)];
    }

    return [
      1,
      "...",
      ...rangeWithDots(currentPage - delta, currentPage + delta),
      "...",
      totalPages
    ];
  };

  const visiblePages = getVisiblePages();

  return (
    <div className={`flex items-center justify-between ${className}`}>
      {showFirstLast && (
        <div className="flex items-center space-x-2">
          <button
            onClick={() => onPageChange(1)}
            disabled={currentPage === 1}
            className="px-3 py-1 text-sm text-gray-500 hover:text-gray-700 disabled:text-gray-300 disabled:cursor-not-allowed"
          >
            First
          </button>
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-3 py-1 text-sm text-gray-500 hover:text-gray-700 disabled:text-gray-300 disabled:cursor-not-allowed"
          >
            Previous
          </button>
        </div>
      )}
      
      <div className="flex items-center space-x-2">
        {visiblePages.map((page, index) => (
          <button
            key={index}
            onClick={() => onPageChange(page)}
            disabled={page === "..."}
            className={`
              px-3 py-1 text-sm
              ${page === currentPage
                ? "bg-blue-600 text-white"
                : "text-gray-500 hover:text-gray-700"
              }
              ${page === "..." ? "cursor-default" : "cursor-pointer"}
            `}
          >
            {page}
          </button>
        ))}
      </div>
      
      {showPreviousNext && (
        <div className="flex items-center space-x-2">
          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-3 py-1 text-sm text-gray-500 hover:text-gray-700 disabled:text-gray-300 disabled:cursor-not-allowed"
          >
            Next
          </button>
          <button
            onClick={() => onPageChange(totalPages)}
            disabled={currentPage === totalPages}
            className="px-3 py-1 text-sm text-gray-500 hover:text-gray-700 disabled:text-gray-300 disabled:cursor-not-allowed"
          >
            Last
          </button>
        </div>
      )}
    </div>
  );
}
