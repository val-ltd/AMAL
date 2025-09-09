
'use client';

import { useState, useMemo } from 'react';

const ITEMS_PER_PAGE = 5;

export function usePagination<T>(data: T[], itemsPerPage: number = ITEMS_PER_PAGE) {
    const [currentPage, setCurrentPage] = useState(1);
    
    const totalPages = useMemo(() => Math.ceil(data.length / itemsPerPage), [data.length, itemsPerPage]);

    const paginatedData = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        return data.slice(startIndex, endIndex);
    }, [data, currentPage, itemsPerPage]);

    const goToNextPage = () => {
        setCurrentPage((prev) => Math.min(prev + 1, totalPages));
    };

    const goToPreviousPage = () => {
        setCurrentPage((prev) => Math.max(prev - 1, 1));
    };

    const canGoNext = currentPage < totalPages;
    const canGoPrevious = currentPage > 1;

    // Reset to page 1 if the data changes and current page is out of bounds
    if (currentPage > totalPages && totalPages > 0) {
        setCurrentPage(1);
    }
    
    return {
        currentPage,
        totalPages,
        paginatedData,
        goToNextPage,
        goToPreviousPage,
        canGoNext,
        canGoPrevious,
    };
}
