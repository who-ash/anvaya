import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

interface UsePaginationOptions {
    defaultPage?: number;
    defaultLimit?: number;
}

interface UsePaginationReturn {
    currentPage: number;
    limit: number;
    setCurrentPage: (page: number) => void;
    handlePageChange: (page: number) => void;
}

/**
 * Custom hook for managing pagination state with URL query parameters
 * @param options - Configuration options for pagination
 * @returns Pagination state and handlers
 */
export function usePagination(
    options: UsePaginationOptions = {},
): UsePaginationReturn {
    const { defaultPage = 1, defaultLimit = 10 } = options;
    const searchParams = useSearchParams();
    const router = useRouter();

    const [currentPage, setCurrentPage] = useState(
        Number(searchParams.get('page')) || defaultPage,
    );
    const [limit] = useState(defaultLimit);

    useEffect(() => {
        const abortController = new AbortController();

        const params = new URLSearchParams(searchParams.toString());

        if (currentPage > 1) {
            params.set('page', currentPage.toString());
        } else {
            params.delete('page');
        }

        if (!abortController.signal.aborted) {
            router.push(`?${params.toString()}`, { scroll: false });
        }

        return () => {
            abortController.abort();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentPage]);

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    return {
        currentPage,
        limit,
        setCurrentPage,
        handlePageChange,
    };
}
