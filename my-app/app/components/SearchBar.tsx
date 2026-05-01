import React, { useEffect, useMemo, useRef, useState } from 'react'

type SearchBook = {
  id: string
  title: string
  author: string
  subTitle?: string
  imageLink?: string
  audioLink?: string
  averageRating?: number
  duration?: string
}

type SearchBarProps = {
  placeholder?: string
  minChars?: number
  debounceMs?: number
  onResults?: (results: SearchBook[]) => void
}

const SEARCH_API =
  'https://us-central1-summaristt.cloudfunctions.net/getBooksByAuthorOrTitle?search='
const SKELETON_COUNT = 5

function SearchBar ({
  placeholder = 'Search for books',
  minChars = 2,
  debounceMs = 300,
  onResults
}: SearchBarProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchBook[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const trimmed = useMemo(() => query.trim(), [query])

  useEffect(() => {
    const onDocClick = (event: MouseEvent) => {
      if (!containerRef.current) return
      if (!containerRef.current.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [])

  useEffect(() => {
    if (trimmed.length < minChars) {
      setResults([])
      onResults?.([])
      setLoading(false)
      setOpen(false)
      return
    }

    const ctrl = new AbortController()
    const timer = setTimeout(async () => {
      try {
        setLoading(true)
        setOpen(true)
        const res = await fetch(`${SEARCH_API}${encodeURIComponent(trimmed)}`, {
          signal: ctrl.signal
        })

        if (!res.ok) throw new Error(`Search failed: ${res.status}`)

        const data = (await res.json()) as SearchBook[]
        const safe = Array.isArray(data) ? data : []
        setResults(safe)
        onResults?.(safe)
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          setResults([])
          onResults?.([])
        }
      } finally {
        setLoading(false)
      }
    }, debounceMs)

    return () => {
      ctrl.abort()
      clearTimeout(timer)
    }
  }, [trimmed, minChars, debounceMs, onResults])

  return (
    <div className='search__content' ref={containerRef}>
      <div className='search'>
        <div className='search__input--wrapper'>
          <input
            className='search__input'
            placeholder={placeholder}
            type='text'
            value={query}
            onChange={e => setQuery(e.target.value)}
            onFocus={() => results.length > 0 && setOpen(true)}
          />
          <div className='search__icon'>
            <svg
              stroke='currentColor'
              fill='currentColor'
              strokeWidth='0'
              viewBox='0 0 1024 1024'
              height='1em'
              width='1em'
              xmlns='http://www.w3.org/2000/svg'
            >
              <path d='M909.6 854.5L649.9 594.8C690.2 542.7 712 479 712 412c0-80.2-31.3-155.4-87.9-212.1-56.6-56.7-132-87.9-212.1-87.9s-155.5 31.3-212.1 87.9C143.2 256.5 112 331.8 112 412c0 80.1 31.3 155.5 87.9 212.1C256.5 680.8 331.8 712 412 712c67 0 130.6-21.8 182.7-62l259.7 259.6a8.2 8.2 0 0 0 11.6 0l43.6-43.5a8.2 8.2 0 0 0 0-11.6zM570.4 570.4C528 612.7 471.8 636 412 636s-116-23.3-158.4-65.6C211.3 528 188 471.8 188 412s23.3-116.1 65.6-158.4C296 211.3 352.2 188 412 188s116.1 23.2 158.4 65.6S636 352.2 636 412s-23.3 116.1-65.6 158.4z' />
            </svg>
          </div>
        </div>

        {open && (
          <>
            {loading && (
              <div className='search__books--wrapper'>
                {Array.from({ length: SKELETON_COUNT }).map((_, index) => (
                  <div
                    className='search__book--link search__book--skeleton'
                    key={`search-skeleton-${index}`}
                  >
                    <div className='skeleton skeleton-image-80' />
                    <div className='search__book--skeleton-text'>
                      <div className='skeleton skeleton-line skeleton-w-80' />
                      <div className='skeleton skeleton-line skeleton-w-50' />
                      <div className='search__book--skeleton-meta'>
                        <div className='skeleton skeleton-circle-16' />
                        <div className='skeleton skeleton-line skeleton-w-30' />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {!loading && results.length === 0 && trimmed.length >= minChars && (
              <div className='search__result'>No books found</div>
            )}
            {!loading && results.length > 0 && (
              <div className='search__books--wrapper'>
                {' '}
                {/* ← single wrapper outside map */}
                {results.map(book => (
                  <a
                    key={book.id}
                    className='search__book--link'
                    href={`/book/${book.id}`}
                  >
                    {' '}
                    {/* ← key on <a> */}
                    <audio src={book.audioLink} />
                    <figure
                      className='book__image--wrapper'
                      style={{
                        height: '80px',
                        width: '80px',
                        minWidth: '80px'
                      }}
                    >
                      <img
                        className='book__image'
                        src={book.imageLink}
                        alt={book.title}
                        style={{ display: 'block' }}
                      />
                    </figure>
                    <div>
                      <div className='search__book--title'>{book.title}</div>
                      <div className='search__book--author'>{book.author}</div>
                      {book.duration && (
                        <div className='search__book--duration'>
                          <div className='recommended__book--details'>
                            <div className='recommended__book--details-icon'>
                              <svg
                                stroke='currentColor'
                                fill='currentColor'
                                strokeWidth='0'
                                viewBox='0 0 24 24'
                                height='1em'
                                width='1em'
                                xmlns='http://www.w3.org/2000/svg'
                              >
                                <path d='M12 2C6.486 2 2 6.486 2 12s4.486 10 10 10 10-4.486 10-10S17.514 2 12 2zm0 18c-4.411 0-8-3.589-8-8s3.589-8 8-8 8 3.589 8 8-3.589 8-8 8z' />
                                <path d='M13 7h-2v6h6v-2h-4z' />
                              </svg>
                            </div>
                            <div className='recommended__book--details-text'>
                              {book.duration}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </a>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default SearchBar
