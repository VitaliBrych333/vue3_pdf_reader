import { reactive } from 'vue'
import type {
  ICreateDocument,
  ICreatePage,
  IEditAction,
  IDocumentsStack,
  IDocument,
  IPage,
  IPageDetails
} from '../shared/document.interface'
import { ActionTypes } from '../shared/actionNames.enum'
import { Document, Page, Prefixes } from '../utils/utils'

export const storeDocument = reactive({
  isDocumentsLoaded: false,
  documents: [] as IDocument[],
  activeDocId: '',

  selectedDocIds: [] as string[],
  selectedPageIds: [] as string[],

  editActions: [] as IEditAction[],
  rotatePages: [] as IPageDetails[],

  documentsStack: [] as IDocumentsStack[],
  indexDocumentsStack: 0,
  currentIndexDocumentsStack: 0,

  // for Compare Mode
  isSynchronousScroll: false,
  firstViewerScrollLock: false,
  secondViewerScrollLock: false,

  setIsDocumentsLoaded(value: boolean) {
    this.isDocumentsLoaded = value
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
    // console.log('----setActiveDocId----------', value)
    this.activeDocId = value
  },

  addPage(id: string, page: IPage, positionIndex: number) {
    this.documents = [...this.documents].map((doc) =>
      doc.id === id
        ? ({
            ...doc,
            pages: (this.insertValueInArray(doc.pages, page, positionIndex) as IPage[])
                      .map((page, index) => ({ ...page, numPage: index + 1 })),
          })
        : doc,
    )

    if (id.startsWith(Prefixes.NEW_DOC)) {
      this.editActions = [...this.editActions].map(editAction =>
        editAction.type === ActionTypes.CREATE_DOCUMENT && (editAction.value as ICreateDocument)?.doc?.id === id
          ? ({
              ...editAction,
              value: ({
                ...editAction.value,
                doc: ({
                  ...(editAction.value as ICreateDocument).doc,
                  pages: (this.insertValueInArray((editAction.value as ICreateDocument).doc.pages, page, positionIndex) as IPage[])
                            .map((page, index) => ({ ...page, numPage: index + 1 })),
                })
              })
            })
          : editAction,
      )

    } else {
      this.editActions = [...this.editActions].concat({
        type: ActionTypes.CREATE_PAGE,
        value: {
          id,
          positionIndex,
          page: (({ url, ...rest }) => rest)(page) as IPage,
        },
      })
    }

    console.log('this.editActions-------addPage', this.editActions)
  },

  setDocument(doc: IDocument, positionIndex: number) {
    this.documents = this.insertValueInArray(this.documents, doc, positionIndex) as IDocument[]
  },

  addDocument(doc: IDocument, positionIndex: number) {
    this.setDocument(doc, positionIndex)
    this.editActions = [...this.editActions].concat({
      type: ActionTypes.CREATE_DOCUMENT,
      value: {
        positionIndex,
        doc: ({
          ...doc,
          pages: doc.pages.map((page) => (({ url, ...rest }) => rest)(page) as IPage),
        }),
      },
    })

    console.log('this.editActions-------createdoc', this.editActions)
  },

  changeNameDocument(id: string, newName: string) {
    const name = `${newName}.pdf`

    this.documents = [...this.documents].map((doc) => doc.id === id ? ({ ...doc, name }) : doc)

    if (id.startsWith(Prefixes.NEW_DOC)) {
      this.editActions = [...this.editActions]
        .map(editAction =>
          editAction.type === ActionTypes.CREATE_DOCUMENT && (editAction.value as ICreateDocument)?.doc?.id === id
            ? ({
                ...editAction,
                value: ({
                  ...editAction.value,
                  doc: ({
                    ...(editAction.value as ICreateDocument).doc,
                    name,
                  })
                })
              })
            : editAction
        )

    } else {
      this.editActions = [...this.editActions].concat({
        type: ActionTypes.RENAME,
        value: { id, name },
      })
    }

    console.log('this.editActions-------changeNameDocument', this.editActions)
  },

  removePage(id: string) {
    const targetDoc = this.documents.find(
      (doc) => doc.pages.filter((page) => page.pageId === id).length,
    ) as Document
    const targetPage = targetDoc?.pages.find((page) => page.pageId === id) as Page

    this.documents = [...this.documents].map((doc) =>
      doc.id === targetDoc.id
        ? ({
            ...doc,
            pages: doc.pages
                      .filter((page) => page.pageId !== targetPage.pageId)
                      .map((page, index) => ({ ...page, numPage: index + 1 })),
          })
        : doc
    )

    if (this.documents.some((doc) => !doc.pages.length)) {
      this.documents = this.documents.filter((doc) => {
        if (!doc.pages.length) {
          this.removeDocument(doc.id)
        }
        return doc.pages.length
      })

    } else if (targetDoc.id.startsWith(Prefixes.NEW_DOC)) {
      this.editActions = [...this.editActions].map(editAction =>
        editAction.type === ActionTypes.CREATE_DOCUMENT && (editAction.value as ICreateDocument)?.doc?.id === targetDoc.id
          ? ({
              ...editAction,
              value: ({
                ...editAction.value,
                doc: ({
                  ...(editAction.value as ICreateDocument).doc,
                  pages: (editAction.value as ICreateDocument).doc.pages
                            .filter((page) => page.pageId !== targetPage.pageId)
                            .map((page, index) => ({ ...page, numPage: index + 1 })),
                })
              })
            })
          : editAction,
      )

    } else {
      this.editActions = [...this.editActions].concat({
        type: ActionTypes.DELETE_PAGE,
        value: {
          id: targetDoc?.id,
          page: (({ url, ...rest }) => rest)(targetPage) as IPage,
        },
      })
    }

    console.log('this.editActions-------removePage', this.editActions)
  },

  removeDocument(id: string) {
    this.documents = [...this.documents].filter((doc) => doc.id !== id)

    if (id.startsWith(Prefixes.NEW_DOC)) {
      this.editActions = [...this.editActions]
        .filter((editAction) => !(
          editAction.type === ActionTypes.CREATE_DOCUMENT &&
          (editAction.value as ICreateDocument)?.doc?.id === id
        ))

    } else {
      this.editActions = [...this.editActions].concat({
        type: ActionTypes.DELETE_DOCUMENT,
        value: { id },
      })
    }

    console.log('this.editActions-------removeDocument', this.editActions)
  },

  rotate(id: string, value: number) {
    const targetDoc = this.documents.find(
      (doc) => doc.pages.filter((page) => page.pageId === id).length,
    ) as IDocument
    const targetDocId = targetDoc.id

    this.documents = [...this.documents].map((doc) =>
      doc.id === targetDocId
        ? ({
            ...doc,
            pages: doc.pages.map((page) =>
              page.pageId === id
                ? ({
                    ...page,
                    rotate: this.getRotateValue(page.rotate, value)
                  })
                : page,
            ),
          })
        : doc,
    )

    const page = this.documents.find(doc => doc.id === targetDocId)?.pages.find((page) => page.pageId === id) as Page

    if (targetDocId.startsWith(Prefixes.NEW_DOC)) {
      this.editActions = [...this.editActions].map(editAction =>
        editAction.type === ActionTypes.CREATE_DOCUMENT && (editAction.value as ICreateDocument)?.doc?.id === targetDocId
          ? ({
              ...editAction,
              value: ({
                ...editAction.value,
                doc: ({
                  ...(editAction.value as ICreateDocument).doc,
                  pages: (editAction.value as ICreateDocument).doc.pages.map(page => page.pageId === id
                            ? ({
                                ...page,
                                rotate: this.getRotateValue(page.rotate, value)
                              })
                            : page
                          ),
                })
              })
            })
          : editAction)

    } else if (this.editActions.filter(editAction => editAction.type === ActionTypes.CREATE_PAGE && (editAction.value as ICreatePage).page.pageId === id).length) {
      this.editActions = [...this.editActions].map(editAction =>
        editAction.type === ActionTypes.CREATE_PAGE && (editAction.value as ICreatePage).page.pageId === id
          ? ({
              ...editAction,
              value: ({
                ...editAction.value,
                page: ({
                  ...(editAction.value as ICreatePage).page,
                  rotate: this.getRotateValue((editAction.value as ICreatePage).page.rotate, value)
                })
              })
            })
          : editAction)

    } else {
      this.rotatePages = [...this.rotatePages].filter(rotatePage => rotatePage.page.pageId !== id)

      if (page.rotate !== 0) {
        this.rotatePages = [...this.rotatePages].concat({
          id: targetDocId,
          page: (({ url, ...rest }) => rest)(page) as IPage,
        })
      }
    }

    console.log('ffffffffff', this.rotatePages)
  },

  clearRotatePages() {
    this.rotatePages = []
  },

  addSelectedPageId(pageId: string, multi = false) {
    this.selectedPageIds = multi
      ? this.selectedPageIds.includes(pageId)
        ? [...this.selectedPageIds].filter((id) => id !== pageId)
        : [...this.selectedPageIds].concat(pageId)
      : [pageId]
  },

  clearSelectedPageIds() {
    this.selectedPageIds = []
  },

  addSelectedDocId(docId: string, multi = false) {
    this.selectedDocIds = multi
      ? this.selectedDocIds.includes(docId)
        ? [...this.selectedDocIds].filter((id) => id !== docId)
        : [...this.selectedDocIds].concat(docId)
      : [docId]
  },

  clearSelectedDocIds() {
    this.selectedDocIds = []
  },

  addDocumentsStack() {
    this.indexDocumentsStack += 1
    this.currentIndexDocumentsStack = this.indexDocumentsStack
    this.documentsStack = [...this.documentsStack].concat({
      documents: this.documents,
      editActions: this.editActions,
      index: this.indexDocumentsStack,
    })
  },

  updateDocumentsStack() {
    const { documents, editActions } = this.documentsStack.find(
      (stack) => stack.index === this.currentIndexDocumentsStack,
    ) as IDocumentsStack

    this.documents = documents || []
    this.editActions = editActions || []
  },

  clearDocumentsStack() {
    this.documents = []
    this.editActions = []
    this.isDocumentsLoaded = false
    this.indexDocumentsStack = 0
    this.currentIndexDocumentsStack = 0
    this.documentsStack = []
    this.clearRotatePages()
  },

  undo() {
    this.currentIndexDocumentsStack -= 1
    this.updateDocumentsStack()
  },

  redo() {
    this.currentIndexDocumentsStack += 1
    this.updateDocumentsStack()
  },

  insertValueInArray<T>(array: T[], value: T, positionIndex: number) {
    return [
      ...array.slice(0, positionIndex),
      value,
      ...array.slice(positionIndex)
    ]
  },

  getRotateValue(value: number, rotate: number) {
    const newValue = value + rotate
    return newValue > 270 || newValue < -270
      ? 0
      : newValue
  },
})
