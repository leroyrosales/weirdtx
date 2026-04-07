import { useEffect } from 'react'

/** Sets `document.title` to `title · Weird TX` and restores the previous title on unmount. */
export function useDocumentTitle(title: string) {
  useEffect(() => {
    const prev = document.title
    document.title = `${title} · Weird TX`
    return () => {
      document.title = prev
    }
  }, [title])
}
