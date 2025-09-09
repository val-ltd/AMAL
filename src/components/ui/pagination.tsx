
'use client';

import { Button } from "./button";

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    goToPreviousPage: () => void;
    goToNextPage: () => void;
    canGoPrevious: boolean;
    canGoNext: boolean;
}

export function Pagination({ currentPage, totalPages, goToPreviousPage, goToNextPage, canGoPrevious, canGoNext }: PaginationProps) {
    if (totalPages <= 1) {
        return null;
    }
    
    return (
        <div className="flex w-full items-center justify-between">
             <div className="text-sm text-muted-foreground">
                Halaman {currentPage} dari {totalPages}
            </div>
            <div className="flex items-center space-x-2">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={goToPreviousPage}
                    disabled={!canGoPrevious}
                >
                    Sebelumnya
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={goToNextPage}
                    disabled={!canGoNext}
                >
                    Berikutnya
                </Button>
            </div>
        </div>
    );
}
