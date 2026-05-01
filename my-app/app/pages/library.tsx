'use client'

import React, { useEffect, useState } from 'react'
import SearchBar from '../components/SearchBar'
import { getLibraryBooks, type LibraryBook } from '../data/libraryStore'

function LibraryPage () {
  const [books, setBooks] = useState<LibraryBook[]>([])

  useEffect(() => {
    const syncBooks = () => {
      setBooks(getLibraryBooks())
    }

    syncBooks()
    window.addEventListener('storage', syncBooks)
    return () => window.removeEventListener('storage', syncBooks)
  }, [])

  return (
    <div id='__next'>
      <div className='wrapper'>
        <div className='search__background'>
          <div className='search__wrapper'>
            <figure>
              <img src='logo' alt='' />
            </figure>
            <div className='search__content'>
              <div className='search'>
                <SearchBar />
              </div>
            </div>
          </div>
        </div>

        <div className='row'>
          <div className='container'>
            <div className='section__title page__title'>My Library</div>

            {books.length === 0 ? (
              <div className='settings__text'>
                No books in your library yet. Open a book and click Add title to
                My Library.
              </div>
            ) : (
              <div className='for-you__recommended--books'>
                {books.map(book => (
                  <a
                    className='for-you__recommended--books-link'
                    href={`/book/${book.id}`}
                    key={book.id}
                  >
                    {book.isFinished && (
                      <div
                        className='book__pill'
                        style={{ backgroundColor: '#2bd97c' }}
                      >
                        Finished
                      </div>
                    )}
                    <figure
                      className='book__image--wrapper'
                      style={{ marginBottom: 8 }}
                    >
                      <img
                        className='book__image'
                        src={book.imageLink}
                        alt={book.title}
                        style={{ display: 'block' }}
                      />
                    </figure>
                    <div className='recommended__book--title'>{book.title}</div>
                    <div className='recommended__book--author'>
                      {book.author}
                    </div>
                    <div className='recommended__book--sub-title'>
                      {book.isFinished ? 'Read complete' : 'Saved to library'}
                    </div>
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default LibraryPage
