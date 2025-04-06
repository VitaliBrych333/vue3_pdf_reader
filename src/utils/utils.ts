import * as PDFJS from 'pdfjs-dist'
import { v4 as uuid } from 'uuid'
import type { IDocument, IPage } from '../shared/document.interface'

export enum Prefixes {
  NEW_DOC = 'new-doc',
  PAGE = 'page',
}

// export function getId() {
//   return Math.ceil(Math.random() * 100000000).toString()
// }

export function getDocName(name: string) {
  return name?.match(/([^\/]+)(?=\.\w+$)/)?.[0]
}

export const getCircularReplacer = () => {
  const seen = new WeakSet()

  return (key, value) => {
    if (typeof value === 'object' && value !== null) {
      if (seen.has(value)) {
        return
      }
      seen.add(value)
    }
    return value
  }
}

export class Page {
  pageId: string
  numPage: number
  rotate: number
  originalDocumentId: string
  originalNumPage: number
  url: PDFJS.PDFDocumentLoadingTask

  constructor(
    numPage: number,
    originalDocumentId: string,
    originalNumPage: number,
    url: PDFJS.PDFDocumentLoadingTask,
    rotate = 0,
  ) {
    this.pageId = `${Prefixes.PAGE}-${uuid()}`
    this.numPage = numPage
    this.rotate = rotate
    this.originalDocumentId = originalDocumentId
    this.originalNumPage = originalNumPage
    this.url = url
  }
}

export class Document {
  id: string
  name: string
  pages: IPage[]

  constructor(name: string, pages: IPage[], id = `${Prefixes.NEW_DOC}-${uuid()}`) {
    this.id = id
    this.name = name
    this.pages = pages
  }
}

// export function getDocName() {
//   return (name: string) => name.match(/([^\/]+)(?=\.\w+$)/)?.[0];
// }
