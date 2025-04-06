// DOM manipulation helpers for copied pages in Edit mode

import { getId } from './utils'
import { storeDocument } from '../store/storeDocument'
import { storeEditActions } from '../store/storeEditActions'

export function deleteClassActiveForCopiedPages() {
  const wrapperDocuments = document.querySelector('.wrapper-documents') as HTMLElement
  wrapperDocuments
    .querySelectorAll('.page.copied.active')
    .forEach((elementPage) => elementPage.classList.remove('active'))
}

export function deleteClassActiveForNewDoc() {
  const wrapperDocuments = document.querySelector('.wrapper-documents') as HTMLElement
  wrapperDocuments
    .querySelectorAll('.wrapper-document.copied.active')
    .forEach((elementDoc) => elementDoc.classList.remove('active'))
}

export function getSplittedPagesByLine(): Map<string, HTMLElement[][]> {
  const splittedPagesInDocsByLine = new Map()
  const docs = Array.from(document.querySelectorAll('.wrapper-document'))

  docs.forEach((docElement) => {
    const pageWrappers = Array.from(docElement.querySelectorAll('.wrapper-page')) as HTMLElement[]
    const length = pageWrappers.length
    const targePageElement = pageWrappers[0]
    const difHeightWidth = Math.abs(targePageElement.clientHeight - targePageElement.clientWidth)
    const splittedPagesByLine: HTMLElement[][] = []

    let halfDifHeightWidth = difHeightWidth / 2
    let targetOffsetTop = targePageElement.offsetTop
    let pagesLine: HTMLElement[] = []

    pageWrappers.forEach((pageElement, index) => {
      if (pageIsInOneLine(pageElement, targetOffsetTop, halfDifHeightWidth)) {
        pagesLine.push(pageElement)
      } else {
        splittedPagesByLine.push([...pagesLine])

        targetOffsetTop = pageElement.offsetTop
        halfDifHeightWidth = Math.abs(pageElement.clientHeight - pageElement.clientWidth) / 2

        pagesLine = []
        pagesLine.push(pageElement)
      }

      if (index === length - 1) {
        // last element
        splittedPagesByLine.push([...pagesLine])
      }
    })

    splittedPagesInDocsByLine.set(docElement.id, splittedPagesByLine)
  })

  return splittedPagesInDocsByLine
}

export function getWrapperPage(pageId: string): HTMLElement {
  return document.querySelector(`#${pageId}`)?.closest('.wrapper-page') as HTMLElement
}

export function getClassStartWith(element: HTMLElement, value: string): string {
  return Array.from(element.classList).find((cl) => cl.includes(value)) as string
}

export function isPortrait(pageElement: HTMLElement): boolean {
  const ratioHeightWidth = pageElement.clientHeight / pageElement.clientWidth
  const classList = pageElement.classList
  const wrapperClassList = pageElement.closest('.wrapper-page')?.classList

  // (ratioHeightWidth > 1 && !Array.from(pageElement.querySelectorAll('.copied')).length) ||
  return !!(
    (ratioHeightWidth > 1 && !classList.contains('copied')) ||
    (ratioHeightWidth > 1 &&
      !wrapperClassList?.contains('rotate_90') &&
      !wrapperClassList?.contains('rotate_270')) ||
    (ratioHeightWidth < 1 &&
      (wrapperClassList?.contains('rotate_90') || wrapperClassList?.contains('rotate_270')))
  )
}

export function allPagesInDocPortrait(docId: string) {
  return Array.from(
    (document.querySelector(`#doc-${docId}`) as HTMLElement).querySelectorAll('.wrapper-page'),
  ).every((wrapperPage) => isPortrait(wrapperPage.querySelector('.page') as HTMLElement))
}

export function getTranslateX(pageElement: HTMLElement): number {
  return pageElement.style.translate
    ? +pageElement.style.translate.slice(0, pageElement.style.translate.indexOf('px'))
    : 0
}

// to check if the pages stay on the same line (2px due to css translate);
export function pageIsInOneLine(
  pageElement: HTMLElement,
  lineOffsetTop: number,
  halfDifHeightWidth: number,
): boolean {
  const pageOffsetTop = pageElement.offsetTop
  const halfHeightWidth = Math.floor(halfDifHeightWidth)
  const difLinePageOffsetTop = lineOffsetTop - pageOffsetTop
  const difPageLineOffsetTop = pageOffsetTop - lineOffsetTop

  const difLinePageOffsetTopHalfHeightWidth = difLinePageOffsetTop - halfHeightWidth
  const sumLinePageOffsetTopHalfHeightWidth = difLinePageOffsetTop + halfHeightWidth
  const difPageLineOffsetTopHalfHeightWidth = difPageLineOffsetTop - halfHeightWidth
  const sumPageLineOffsetTopHalfHeightWidth = difPageLineOffsetTop + halfHeightWidth

  return (
    lineOffsetTop === pageOffsetTop ||
    (difLinePageOffsetTopHalfHeightWidth <= 2 && difLinePageOffsetTopHalfHeightWidth >= 0) ||
    (sumLinePageOffsetTopHalfHeightWidth <= 2 && sumLinePageOffsetTopHalfHeightWidth >= 0) ||
    (difPageLineOffsetTopHalfHeightWidth <= 2 && difPageLineOffsetTopHalfHeightWidth >= 0) ||
    (sumPageLineOffsetTopHalfHeightWidth <= 2 && sumPageLineOffsetTopHalfHeightWidth >= 0)
  )
}

export function toggleClassEditForCopiedElement(element: HTMLElement) {
  const elementClassList = element.classList

  if (elementClassList.contains('copied')) {
    elementClassList.toggle('edit')
  }
}

export function createCopyPage(
  targetPageElement: HTMLElement,
  pageId: string,
  countCopiedPage: number,
): HTMLElement {
  const elementWrapperPage = getWrapperPage(pageId).cloneNode(true) as HTMLElement
  const elementPage = elementWrapperPage.querySelector('.page') as HTMLElement
  const classList = elementPage.classList

  classList.remove('edit', 'active')
  classList.add('copied')
  elementPage.id += `-copied-${countCopiedPage}`

  elementPage.addEventListener('click', (event: MouseEvent) => {
    const pageId = elementPage.id

    if (!event.ctrlKey) {
      deleteClassActiveForCopiedPages()
    }

    classList.add('active')
    storeDocument.addSelectedPageId(pageId, event.ctrlKey)
  })

  const sourceCanvas = targetPageElement.querySelector('canvas') as HTMLCanvasElement
  const destCanvas = elementWrapperPage.querySelector('canvas') as HTMLCanvasElement
  const destCanvasContext = destCanvas.getContext('2d') as CanvasRenderingContext2D

  destCanvasContext.drawImage(sourceCanvas, 0, 0)
  destCanvasContext.rotate((-45 * Math.PI) / 180)
  destCanvasContext.fillStyle = 'red'
  destCanvasContext.font = '60px Roboto'

  const positionX = targetPageElement.clientWidth > targetPageElement.clientHeight ? -50 : -110

  destCanvasContext.fillText('Copied', positionX, 280)

  return elementWrapperPage
}

export function createDoc(
  docClone: HTMLElement,
  orderIndex: number,
): { docId: string; doc: HTMLElement } {
  const doc = docClone.cloneNode(true) as HTMLElement
  const elementDocTitle = doc.querySelector('.document-title') as HTMLElement
  const docId = getId()

  doc.id = `doc-${docId}`
  ;(elementDocTitle.querySelector('.document-number') as HTMLElement).innerHTML =
    `${orderIndex + 1}. `

  elementDocTitle.addEventListener('click', (event: MouseEvent) => {
    if (!event.ctrlKey) {
      deleteClassActiveForNewDoc()
    }

    doc.classList.add('active')
    storeDocument.addSelectedDocId(docId, event.ctrlKey)
  })

  doc.querySelectorAll('.wrapper-page').forEach((page) => page.remove())

  return { docId, doc }
}

export function checkWrapperPagesIsEmpty(wrapperPages: HTMLElement) {
  if (!wrapperPages.querySelectorAll('.wrapper-page').length) {
    const elementDoc = wrapperPages.closest('.wrapper-document') as HTMLElement
    const docId = elementDoc.id.slice(4)

    storeDocument.removeDocumentId(docId)
    elementDoc.remove()
  }
}

export function changeDocNumberNameForCopiedDocs() {
  document.querySelectorAll('.wrapper-document.copied').forEach((elementDoc) => {
    const targetIndexDoc = storeDocument.documentIds.findIndex(
      (docId) => docId === elementDoc.id.slice(4),
    ) as number
    ;(elementDoc.querySelector('.document-number') as HTMLElement).innerHTML =
      `${targetIndexDoc + 1}. `
  })
}
