"use client";

import React, { useEffect, useRef, useState } from "react";

type BookResult = {
  id?: string;
  title?: string;
  author?: string;
  imageLink?: string;
  audioLink?: string;
  duration?: string;
};

function getAudioDuration(audioUrl: string): Promise<number | null> {
  return new Promise((resolve) => {
    const audio = new Audio();
    audio.preload = "metadata";
    audio.src = audioUrl;
    audio.onloadedmetadata = () => {
      resolve(Number.isFinite(audio.duration) ? Math.floor(audio.duration) : null);
    };
    audio.onerror = () => resolve(null);
  });
}

function formatClock(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export default function SearchBar() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<BookResult[]>([]);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!query.trim()) {
      setResults([]);
      setOpen(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://us-central1-summaristt.cloudfunctions.net/getBooksByAuthorOrTitle?search=${encodeURIComponent(query.trim())}`
        );
        const data: BookResult[] = await res.json();

        const withDurations = await Promise.all(
          data.map(async (book) => {
            if (!book.audioLink) return book;
            const seconds = await getAudioDuration(book.audioLink);
            return {
              ...book,
              duration: seconds !== null ? formatClock(seconds) : "",
            };
          })
        );

        setResults(withDurations);
        setOpen(true);
      } catch {
        setResults([]);
        setOpen(false);
      }
    }, 400);
  }, [query]);

  function clearSearch() {
    setQuery("");
    setResults([]);
    setOpen(false);
  }

  return (
    <>
      <div className="search__input--wrapper">
        <input
          className="search__input"
          placeholder="Search for books"
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <div className="search__icon">
          {query ? (
            <svg
              stroke="currentColor"
              fill="none"
              strokeWidth={0}
              viewBox="0 0 24 24"
              className="search__delete--icon"
              height="1em"
              width="1em"
              xmlns="http://www.w3.org/2000/svg"
              onClick={clearSearch}
            >
              <path d="M6.2253 4.81108C5.83477 4.42056 5.20161 4.42056 4.81108 4.81108C4.42056 5.20161 4.42056 5.83477 4.81108 6.2253L10.5858 12L4.81114 17.7747C4.42062 18.1652 4.42062 18.7984 4.81114 19.1889C5.20167 19.5794 5.83483 19.5794 6.22535 19.1889L12 13.4142L17.7747 19.1889C18.1652 19.5794 18.7984 19.5794 19.1889 19.1889C19.5794 18.7984 19.5794 18.1652 19.1889 17.7747L13.4142 12L19.189 6.2253C19.5795 5.83477 19.5795 5.20161 19.189 4.81108C18.7985 4.42056 18.1653 4.42056 17.7748 4.81108L12 10.5858L6.2253 4.81108Z" fill="currentColor" />
            </svg>
          ) : (
            <svg
              stroke="currentColor"
              fill="currentColor"
              strokeWidth={0}
              viewBox="0 0 1024 1024"
              height="1em"
              width="1em"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M909.6 854.5L649.9 594.8C690.2 542.7 712 479 712 412c0-80.2-31.3-155.4-87.9-212.1-56.6-56.7-132-87.9-212.1-87.9s-155.5 31.3-212.1 87.9C143.2 256.5 112 331.8 112 412c0 80.1 31.3 155.5 87.9 212.1C256.5 680.8 331.8 712 412 712c67 0 130.6-21.8 182.7-62l259.7 259.6a8.2 8.2 0 0 0 11.6 0l43.6-43.5a8.2 8.2 0 0 0 0-11.6zM570.4 570.4C528 612.7 471.8 636 412 636s-116-23.3-158.4-65.6C211.3 528 188 471.8 188 412s23.3-116.1 65.6-158.4C296 211.3 352.2 188 412 188s116.1 23.2 158.4 65.6S636 352.2 636 412s-23.3 116.1-65.6 158.4z" />
            </svg>
          )}
        </div>
      </div>

      {open && results.length > 0 && (
        <div className="search__books--wrapper">
          {results.map((book, i) => (
            <a
              key={book.id ?? i}
              className="search__book--link"
              href={`/book/${book.id ?? ""}`}
            >
              <figure
                className="book__image--wrapper"
                style={{ height: 80, width: 80, minWidth: 80 }}
              >
                <img
                  className="book__image"
                  src={book.imageLink ?? ""}
                  alt="book"
                  style={{ display: "block" }}
                />
              </figure>
              <div>
                <div className="search__book--title">{book.title ?? ""}</div>
                <div className="search__book--author">{book.author ?? ""}</div>
                {book.duration && (
                  <div className="search__book--duration">
                    <div className="recommended__book--details">
                      <div className="recommended__book--details-icon">
                        <svg
                          stroke="currentColor"
                          fill="currentColor"
                          strokeWidth={0}
                          viewBox="0 0 24 24"
                          height="1em"
                          width="1em"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path d="M12 2C6.486 2 2 6.486 2 12s4.486 10 10 10 10-4.486 10-10S17.514 2 12 2zm0 18c-4.411 0-8-3.589-8-8s3.589-8 8-8 8 3.589 8 8-3.589 8-8 8z" />
                          <path d="M13 7h-2v6h6v-2h-4z" />
                        </svg>
                      </div>
                      <div className="recommended__book--details-text">{book.duration}</div>
                    </div>
                  </div>
                )}
              </div>
            </a>
          ))}
        </div>
      )}
    </>
  );
}
