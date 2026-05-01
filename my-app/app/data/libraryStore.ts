export type LibraryBook = {
  id: string
  title: string
  author: string
  imageLink: string
  audioLink: string
  isFinished: boolean
  addedAt: number
  finishedAt?: number
}

const STORAGE_KEY = 'sam_library_books_v1'

function canUseStorage (): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

export function getLibraryBooks (): LibraryBook[] {
  if (!canUseStorage()) return []

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []

    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []

    return parsed
      .filter(book => book && typeof book.id === 'string')
      .sort((a, b) => (b.addedAt ?? 0) - (a.addedAt ?? 0))
  } catch {
    return []
  }
}

function saveLibraryBooks (books: LibraryBook[]): void {
  if (!canUseStorage()) return
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(books))
}

export function upsertLibraryBook (book: Omit<LibraryBook, 'addedAt'> & { addedAt?: number }): LibraryBook[] {
  const books = getLibraryBooks()
  const now = Date.now()
  const existingIndex = books.findIndex(item => item.id === book.id)

  if (existingIndex >= 0) {
    const existing = books[existingIndex]
    books[existingIndex] = {
      ...existing,
      ...book,
      addedAt: existing.addedAt || book.addedAt || now,
      isFinished: existing.isFinished || book.isFinished,
      finishedAt: existing.finishedAt ?? book.finishedAt
    }
  } else {
    books.unshift({
      ...book,
      addedAt: book.addedAt ?? now
    })
  }

  saveLibraryBooks(books)
  return books
}

export function markLibraryBookFinished (bookId: string): LibraryBook[] {
  const books = getLibraryBooks()
  const now = Date.now()
  const next = books.map(book => {
    if (book.id !== bookId) return book

    return {
      ...book,
      isFinished: true,
      finishedAt: book.finishedAt ?? now
    }
  })

  saveLibraryBooks(next)
  return next
}
