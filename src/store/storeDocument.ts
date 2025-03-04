import { reactive, watchEffect } from 'vue'
import { usePDF } from '@tato30/vue-pdf'
import type { DocumentPdf } from '../shared/document.interface'

export const storeDocument = reactive({
  baseUrl: '',
  documents: [] as DocumentPdf[],
  documentIds: [] as string[],
  isDocumentsLoaded: false,
  activeDocId: '',

  // to rename or download docs
  selectedDocIds: [] as string[],

  // for Compare Mode
  isSynchronousScroll: false,
  firstViewerScrollLock: false,
  secondViewerScrollLock: false,

  setBaseUrl(url: string) {
    this.baseUrl = url
  },

  setIsDocumentsLoaded(value: boolean) {
    this.isDocumentsLoaded = value
  },

  setUsePdf(id: string, docName: string, url: string) {
    const newDoc = {
      id,
      name: docName,
      url: usePDF(url),
    }

    this.documents = [...this.documents].concat(newDoc)
    this.documentIds = [...this.documentIds].concat(id)
  },

  // for split
  // addDocument(doc: { id: string; name: string; url: object }, positionIndex: number) {
  //   // this.documents = [...this.documents].concat(doc);
  //   this.documents = [...this.documents]
  //   this.documents.splice(positionIndex, 0, doc)

  //   this.documentIds = [...this.documentIds].concat(doc.id)
  // },

  removeDocumentId(id: string) {
    this.documentIds = [...this.documentIds].filter(docId => docId !== id)
  },

  // changeDocument(id: string, newValues: { name: string; url: object }) {
  changeNameDocument(id: string, newName: string ) {
    // this.documents = [...this.documents].map(doc => doc.id === id ? ({ ...doc, ...newValues }) : doc)
    this.documents.map(doc => {
      if (doc.id === id) {
        doc.name = newName
      }

      return doc
    })
  },

  addDocumentId(id: string, positionIndex: number) {
    this.documentIds = [
      ...this.documentIds.slice(0, positionIndex),
      id,
      ...this.documentIds.slice(positionIndex)
    ];
  },

  changeOrderDocumentId(id: string, newPositionIndex: number) {
    this.documentIds = [ ...this.documentIds].filter(docId => docId !== id)

    this.documentIds = [
      ...this.documentIds.slice(0, newPositionIndex),
      id,
      ...this.documentIds.slice(newPositionIndex)
    ];
  },

  toggleSynchronous() {
    this.isSynchronousScroll = !this.isSynchronousScroll
  },

  setFirstViewerScrollLock(value: boolean) {
    this.firstViewerScrollLock = value
  },

  setSecondViewerScrollLock(value: boolean) {
    this.secondViewerScrollLock = value
  },

  resetSettingsForCompareMode() {
    this.isSynchronousScroll = false
    this.firstViewerScrollLock = false
    this.secondViewerScrollLock = false
  },

  setActiveDocId(value: string) {
    this.activeDocId = value
  },

  addSelectedDocId(docId: string, multi = false) {
    this.selectedDocIds = multi
      ? this.selectedDocIds.includes(docId)
        ? [...this.selectedDocIds].filter(id => id !== docId)
        : [...this.selectedDocIds].filter(id => id !== docId).concat(docId)
      : [docId]
  },

  clearSelectedDocIds() {
    this.selectedDocIds = []
  },

  // createNewDocument(queryParams: string) {
  //   this.urlCreateNewDocument += queryParams;
  // }
})
