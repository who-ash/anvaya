import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useDebounce } from 'use-debounce';

interface UseSearchWithParamsOptions {
    debounceMs?: number;
    onSearchChange?: () => void;
}

interface UseSearchWithParamsReturn {
    searchQuery: string;
    debouncedSearchQuery: string;
    setSearchQuery: (query: string) => void;
}

/**
 * Custom hook for managing search state with URL query parameters and debouncing
 * @param options - Configuration options for search
 * @returns Search state and handlers
 */
export function useSearchWithParams(
    options: UseSearchWithParamsOptions = {},
): UseSearchWithParamsReturn {
    const { debounceMs = 300, onSearchChange } = options;
    const searchParams = useSearchParams();
    const router = useRouter();

    const [searchQuery, setSearchQuery] = useState(
        searchParams.get('search') || '',
    );
    const [debouncedSearchQuery] = useDebounce(searchQuery, debounceMs);

    // Update URL when search query changes
    useEffect(() => {
        const abortController = new AbortController();

        const params = new URLSearchParams(searchParams.toString());
        if (debouncedSearchQuery) {
            params.set('search', debouncedSearchQuery);
        } else {
            params.delete('search');
        }
        // Reset to page 1 when search changes
        params.set('page', '1');

        if (!abortController.signal.aborted) {
            router.push(`?${params.toString()}`, { scroll: false });

            // Call optional callback when search changes
            if (onSearchChange) {
                onSearchChange();
            }
        }

        return () => {
            abortController.abort();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [debouncedSearchQuery, onSearchChange]);

    return {
        searchQuery,
        debouncedSearchQuery,
        setSearchQuery,
    };
}
