import { useMemo } from 'react';
import {
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
} from 'lucide-react';

const Pagination = ({
    currentPage = 1,
    totalItems = 0,
    itemsPerPage = 10,
    onPageChange = () => {},
    onItemsPerPageChange = () => {},
}) => {
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;

    // Generate page numbers for pagination
    const getPageNumbers = useMemo(() => {
        const pages = [];
        const maxVisiblePages = 5;

        if (totalPages <= maxVisiblePages) {
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            const startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
            const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

            for (let i = startPage; i <= endPage; i++) {
                pages.push(i);
            }
        }

        return pages;
    }, [currentPage, totalPages]);

    // Hide pagination if there's only one page or fewer items
    if (totalPages <= 1) return null;

    return (
        <div className="bg-card px-6 py-4 border-t border-border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-b-lg">
            {/* Left side - Results info and items per page */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="text-sm text-muted-foreground">
                    <span className="font-medium">{startIndex + 1}</span> to{' '}
                    <span className="font-medium">{Math.min(endIndex, totalItems)}</span> of{' '}
                    <span className="font-medium">{totalItems}</span> results
                </div>

                <div className="flex items-center gap-2">
                    <label htmlFor="itemsPerPage" className="text-sm text-muted-foreground whitespace-nowrap">
                        Rows per page:
                    </label>
                    <select
                        id="itemsPerPage"
                        value={itemsPerPage}
                        onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
                        className="border border-input rounded pl-3 pr-8 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring bg-background appearance-none cursor-pointer text-foreground"
                        style={{
                            backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
                            backgroundPosition: 'right 0.5rem center',
                            backgroundRepeat: 'no-repeat',
                            backgroundSize: '1.25em 1.25em'
                        }}
                    >
                        <option value={5}>5</option>
                        <option value={10}>10</option>
                        <option value={25}>25</option>
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                    </select>
                </div>
            </div>

            {/* Right side - Pagination controls */}
            <div className="flex items-center justify-center sm:justify-start gap-3">
                {/* First page button */}
                <button
                    onClick={() => onPageChange(1)}
                    disabled={currentPage === 1}
                    className={`w-9 h-9 flex items-center justify-center rounded border transition-colors ${currentPage === 1
                        ? 'border-border text-muted-foreground cursor-not-allowed'
                        : 'border-input text-foreground hover:bg-secondary hover:border-ring'
                        }`}
                    title="First page"
                >
                    <ChevronsLeft className="h-4 w-4" />
                </button>

                {/* Previous page button */}
                <button
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={`w-9 h-9 flex items-center justify-center rounded border transition-colors ${currentPage === 1
                        ? 'border-border text-muted-foreground cursor-not-allowed'
                        : 'border-input text-foreground hover:bg-secondary hover:border-ring'
                        }`}
                    title="Previous page"
                >
                    <ChevronLeft className="h-4 w-4" />
                </button>

                {/* Page numbers with symmetric ellipses */}
                <div className="flex items-center gap-2">
                    {/* Beginning ellipsis and first page */}
                    {totalPages > 5 && currentPage > 3 && (
                        <>
                            <button
                                onClick={() => onPageChange(1)}
                                className="w-9 h-9 flex items-center justify-center rounded border border-input text-foreground hover:bg-secondary hover:border-ring hover:text-foreground text-sm font-medium transition-all duration-200"
                            >
                                1
                            </button>
                            {currentPage > 4 && (
                                <span className="px-2 text-muted-foreground text-sm">...</span>
                            )}
                        </>
                    )}

                    {/* Main page numbers */}
                    {getPageNumbers.map((pageNumber) => (
                        <button
                            key={pageNumber}
                            onClick={() => onPageChange(pageNumber)}
                            className={`w-9 h-9 flex items-center justify-center rounded border text-sm font-medium transition-all duration-200 ${currentPage === pageNumber
                                ? 'bg-primary border-primary text-primary-foreground shadow-sm'
                                : 'border-input text-foreground hover:bg-secondary hover:border-ring'
                                }`}
                        >
                            {pageNumber}
                        </button>
                    ))}

                    {/* Ending ellipsis and last page */}
                    {totalPages > 5 && currentPage < totalPages - 2 && (
                        <>
                            {currentPage < totalPages - 3 && (
                                <span className="px-2 text-muted-foreground text-sm">...</span>
                            )}
                            <button
                                onClick={() => onPageChange(totalPages)}
                                className="w-9 h-9 flex items-center justify-center rounded border border-input text-foreground hover:bg-secondary hover:border-ring hover:text-foreground text-sm font-medium transition-all duration-200"
                            >
                                {totalPages}
                            </button>
                        </>
                    )}
                </div>

                {/* Next page button */}
                <button
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className={`w-9 h-9 flex items-center justify-center rounded border transition-colors ${currentPage === totalPages
                        ? 'border-border text-muted-foreground cursor-not-allowed'
                        : 'border-input text-foreground hover:bg-secondary hover:border-ring'
                        }`}
                    title="Next page"
                >
                    <ChevronRight className="h-4 w-4" />
                </button>

                {/* Last page button */}
                <button
                    onClick={() => onPageChange(totalPages)}
                    disabled={currentPage === totalPages}
                    className={`w-9 h-9 flex items-center justify-center rounded border transition-colors ${currentPage === totalPages
                        ? 'border-border text-muted-foreground cursor-not-allowed'
                        : 'border-input text-foreground hover:bg-secondary hover:border-ring'
                        }`}
                    title="Last page"
                >
                    <ChevronsRight className="h-4 w-4" />
                </button>
            </div>
        </div>
    );
};

export default Pagination;