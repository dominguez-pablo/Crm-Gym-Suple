import { useEffect } from 'react'

export function useDocumentBrand({ title, icon }) {
  useEffect(() => {
    const previousTitle = document.title
    document.title = title

    const link = document.querySelector("link[rel='icon']")
    const previousHref = link?.getAttribute('href')
    const previousType = link?.getAttribute('type')
    if (link) {
      link.type = 'image/jpeg'
      link.href = icon
    }

    return () => {
      document.title = previousTitle
      if (link) {
        if (previousType) link.type = previousType
        if (previousHref) link.href = previousHref
      }
    }
  }, [title, icon])
}
