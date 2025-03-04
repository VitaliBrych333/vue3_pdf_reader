<script lang="ts">
import DialogWindow from './shared/DialogWindow.vue'
import { storeDocument } from '../store/storeDocument'
import { storeEditActions } from '../store/storeEditActions'
import { getDocName } from '../utils/utils'
import {
  allPagesInDocPortrait,
  changeDocNumberNameForCopiedDocs,
  checkWrapperPagesIsEmpty,
  createCopyPage,
  createDoc,
  getWrapperPage,
  isPortrait,
  toggleClassEditForCopiedElement,
} from '../utils/utilsDOM'
import { ActionNames } from '../shared/actionNames.enum'

export default {
  components: {
    DialogWindow,
  },

  data() {
    return {
      storeDocument,
      storeEditActions,
      docName: '',
      docText: '',
      showDialog: false,
      dialogTitle: '',
      dialogBtnOk: '',
      countCopiedPage: 0,
    }
  },

  computed: {
    selectedPageIds() {
      return storeEditActions.selectedPageIds
    },

    countSelectedPageIds() {
      return this.selectedPageIds.length
    },

    selectedDocIds() {
      return storeDocument.selectedDocIds
    },

    countSelectedDocIds() {
      return this.selectedDocIds.length
    },

    countCutPageIds() {
      return storeEditActions.cutPageIds.length
    },

    countCutDocIds() {
      return storeEditActions.cutDocIds.length
    },

    countCopyPageIds() {
      return storeEditActions.copyPageIds.length
    },

    countCopyDocIds() {
      return storeEditActions.copyDocIds.length
    },

    allSelectedPagesPortrait() {
      return (
        this.countSelectedPageIds &&
        this.selectedPageIds.every((pageId: string) =>
          isPortrait(document.querySelector(`#${pageId}`)),
        )
      )
    },

    allSelectedDocsContainPortrait() {
      return (
        this.countSelectedDocIds > 0 &&
        this.selectedDocIds.every((docId: string) => allPagesInDocPortrait(docId))
      )
    },

    createActive() {
      return (
        this.allSelectedPagesPortrait ||
        (this.countSelectedDocIds > 1 && this.allSelectedDocsContainPortrait)
      )
    },

    renameActive() {
      return this.countSelectedDocIds === 1
    },

    splitActive() {
      if (this.countSelectedPageIds !== 1) {
        return false
      }

      const elementPage = getWrapperPage(storeEditActions.selectedPageIds[0])
      const allWrapperPage = Array.from(
        elementPage.closest('.wrapper-pages').querySelectorAll('.wrapper-page'),
      )
      const pageIds = allWrapperPage.map(
        (elementWrapperPage) => elementWrapperPage.querySelector('.page').id,
      )
      const targetIndexPage = pageIds.findIndex((id) => id === storeEditActions.selectedPageIds[0])
      const targetPageIds = pageIds.slice(targetIndexPage)

      return (
        allWrapperPage[0] !== elementPage &&
        targetPageIds.every((pageId: string) => isPortrait(document.querySelector(`#${pageId}`)))
      )
    },

    copyActive() {
      return this.allSelectedPagesPortrait || this.allSelectedDocsContainPortrait
    },

    cutActive() {
      return this.allSelectedPagesPortrait || this.allSelectedDocsContainPortrait
    },

    pasteActive() {
      return !!(
        ((this.countCutPageIds || this.countCopyPageIds) && this.countSelectedPageIds) ||
        ((this.countCutDocIds || this.countCopyDocIds) && this.countSelectedDocIds)
      )
    },

    deleteActive() {
      return !!(this.countSelectedPageIds || this.countSelectedDocIds)
    },

    undoActive() {
      return this.countSelectedPageIds
    },

    redoActive() {
      return !this.countSelectedPageIds
    },

    saveActive() {
      return this.countSelectedPageIds
    },

    countSelected() {
      return this.countSelectedPageIds
        ? this.countSelectedPageIds
        : this.countSelectedDocIds
          ? this.countSelectedDocIds
          : 0
    },

    countCutOrCopy() {
      return this.countCutPageIds || this.countCopyPageIds
        ? this.countCutPageIds || this.countCopyPageIds
        : this.countCutDocIds || this.countCopyDocIds
          ? this.countCutDocIds || this.countCopyDocIds
          : 0
    },
  },

  methods: {
    showWindowDialog(title: string, nameBtnOk: string, docName = '', docText = '') {
      this.showDialog = true
      this.dialogTitle = title
      this.docName = docName
      this.docText = docText
      this.dialogBtnOk = nameBtnOk
    },

    closeDialog() {
      this.showDialog = false
    },

    rename() {
      const docId = this.selectedDocIds[0]
      const targetDoc = storeDocument.documents.find((doc) => doc.id === docId)

      let docName = getDocName(targetDoc?.name)

      if (!docName) {
        const elementDoc = document.querySelector(`#doc_${docId}`)
        docName = elementDoc.querySelector('.document-name').innerHTML
      }

      if (docName) {
        this.showWindowDialog('Rename document', ActionNames.RENAME, docName)
      }
    },

    create() {
      this.showWindowDialog('Create new document', ActionNames.CREATE)
    },

    split() {
      this.showWindowDialog('Create new document', ActionNames.SPLIT)
    },

    copy() {
      if (this.countSelectedPageIds) {
        this.selectedPageIds.forEach((pageId) => {
          const elementPage = document.querySelector(`#${pageId}`) as HTMLElement
          toggleClassEditForCopiedElement(elementPage)

          storeEditActions.addCopyPageId(pageId)
        })

        storeEditActions.clearSelectedPageIds()

      } else if (this.countSelectedDocIds) {
        this.selectedDocIds.forEach((docId: string) => {
          const elementDoc = document.querySelector(`#doc_${docId}`) as HTMLElement
          toggleClassEditForCopiedElement(elementDoc)

          storeEditActions.addCopyDocId(docId)
        })

        storeDocument.clearSelectedDocIds()
      }
    },

    cut() {
      if (this.countSelectedPageIds) {
        this.selectedPageIds.forEach((pageId) => {
          const elementPage = document.querySelector(`#${pageId}`) as HTMLElement
          toggleClassEditForCopiedElement(elementPage)

          storeEditActions.addCutPageId(pageId)
        })

        storeEditActions.clearSelectedPageIds()

      } else if (this.countSelectedDocIds) {
        this.selectedDocIds.forEach((docId: string) => {
          const elementDoc = document.querySelector(`#doc_${docId}`) as HTMLElement
          toggleClassEditForCopiedElement(elementDoc)

          storeEditActions.addCutDocId(docId)
        })

        storeDocument.clearSelectedDocIds()
      }
    },

    paste() {
      if (this.countCutPageIds) {
        // handler for cut pages
        const targetPageId = storeEditActions.selectedPageIds[this.countSelectedPageIds - 1]
        const targetWrapperPage = getWrapperPage(targetPageId)

        storeEditActions.cutPageIds.forEach((pageId) => {
          const elementWrapperPage = getWrapperPage(pageId)
          const wrapperPages = elementWrapperPage.closest('.wrapper-pages') as HTMLElement
          const elementPage = elementWrapperPage.querySelector(`#${pageId}`) as HTMLElement

          toggleClassEditForCopiedElement(elementPage)

          targetWrapperPage.parentNode.insertBefore(
            elementWrapperPage,
            targetWrapperPage.nextSibling,
          )

          checkWrapperPagesIsEmpty(wrapperPages)
        })

        storeEditActions.clearCutPageIds()
      } else if (this.countCopyPageIds) {
        // handler for copied pages
        const targetPageId = this.selectedPageIds[this.countSelectedPageIds - 1]
        const targetWrapperPage = getWrapperPage(targetPageId)

        storeEditActions.copyPageIds.forEach((pageId) => {
          const targetPageElement = document.querySelector(`#${pageId}`) as HTMLElement

          toggleClassEditForCopiedElement(targetPageElement)

          this.countCopiedPage += 1
          const elementWrapperPage = createCopyPage(targetPageElement, pageId, this.countCopiedPage)

          targetWrapperPage.parentNode.insertBefore(
            elementWrapperPage,
            targetWrapperPage.nextSibling,
          )
        })

        storeEditActions.clearCopyPageIds()
      } else if (this.countCutDocIds) {
        // handler for cut docs
        storeEditActions.cutDocIds.forEach((documentId: string) => {
          const lastSelectedDocId = storeDocument.selectedDocIds[this.countSelectedDocIds - 1]
          const targetWrapperDoc = document.querySelector(`#doc_${lastSelectedDocId}`)
          const currentCutDocPosition = storeDocument.documentIds.findIndex(
            (id) => id === documentId
          )
          let docPositionInsert = storeDocument.documentIds.findIndex(
            (id) => id === lastSelectedDocId
          )

          if (docPositionInsert < currentCutDocPosition) {
            docPositionInsert += 1
          }

          const elementDoc = document.querySelector(`#doc_${documentId}`) as HTMLElement

          toggleClassEditForCopiedElement(elementDoc)

          targetWrapperDoc.parentNode.insertBefore(elementDoc, targetWrapperDoc.nextSibling)

          storeDocument.addSelectedDocId(documentId, true)
          storeDocument.changeOrderDocumentId(documentId, docPositionInsert)
        })

        changeDocNumberNameForCopiedDocs()
        storeEditActions.clearCutDocIds()
      } else if (this.countCopyDocIds) {
        // handler for copied docs
        storeEditActions.copyDocIds.forEach((documentId: string) => {
          const targetDocIdToInsert = this.selectedDocIds[this.countSelectedDocIds - 1]
          const docPositionInsert =
            storeDocument.documentIds.findIndex((id) => id === targetDocIdToInsert) + 1
          const targetToInserDoc = document.querySelector(`#doc_${targetDocIdToInsert}`)
          const targetWrapperDoc = document.querySelector(`#doc_${documentId}`) as HTMLElement

          toggleClassEditForCopiedElement(targetWrapperDoc)

          const { docId, doc } = createDoc(targetWrapperDoc, docPositionInsert)

          const targetWrapperPages = doc.querySelector('.wrapper-pages')

          doc.classList.add('copied', 'active')
          doc.classList.remove('edit')

          targetWrapperDoc.querySelectorAll('.page').forEach((page: HTMLElement) => {
            this.countCopiedPage += 1
            const elementWrapperPage = createCopyPage(page, page.id, this.countCopiedPage)

            targetWrapperPages.appendChild(elementWrapperPage)
          })

          targetToInserDoc.parentNode.insertBefore(doc, targetToInserDoc.nextSibling)

          storeDocument.addDocumentId(docId, docPositionInsert)
          storeDocument.addSelectedDocId(docId, true)
        })

        changeDocNumberNameForCopiedDocs()
        storeEditActions.clearCopyDocIds()
      }

      // need to add register action
    },

    remove() {
      if (this.countSelectedPageIds) {
        this.selectedPageIds.forEach((pageId) => {
          const elementPage = getWrapperPage(pageId)
          const wrapperPages = elementPage.closest('.wrapper-pages') as HTMLElement

          elementPage.remove()
          checkWrapperPagesIsEmpty(wrapperPages)
        })

      } else if (this.countSelectedDocIds) {
        this.selectedDocIds.forEach((docId: string) => {
          const elementDoc = document.querySelector(`#doc_${docId}`)
          storeDocument.removeDocumentId(docId)
          elementDoc.remove()
        })
      }

      changeDocNumberNameForCopiedDocs()

      // need to add register action
    },

    undo() {
      console.log('000000-----undo----------')
    },

    redo() {
      console.log('000000-----redo----------')
    },

    exit() {
      this.$router.push({ name: 'docReader' })
    },

    save() {
      console.log('000000-----save----------')

      this.$router.push({ name: 'docReader' })
    },

    async actionOkDialog(value: { actionNameOk: string; docName: string; docText: string }) {
      const { actionNameOk, docName, docText } = value

      if (actionNameOk === ActionNames.RENAME) {
        this.handleRename(docName)
      }

      if (actionNameOk === ActionNames.CREATE) {
        this.handleCreate(docName, storeDocument.documentIds.length)
      }

      if (actionNameOk === ActionNames.SPLIT) {
        this.handleSplit(docName)
      }

      this.closeDialog()
    },

    handleRename(newName: string) {
      const docId = this.selectedDocIds[0]
      const targetDoc = storeDocument.documents.find((doc) => doc.id === docId)

      if (targetDoc) {
        storeDocument.changeNameDocument(docId, `${newName}.pdf`)
      } else {
        const elementDoc = document.querySelector(`#doc_${docId}`)
        elementDoc.querySelector('.document-name').innerHTML = newName
      }
    },

    handleCreate(docName: string, docPositionInsert: number) {
      if (this.countSelectedPageIds) {
        const firstDocId = storeDocument.documentIds[0]
        const targetDocId = storeDocument.documentIds[docPositionInsert - 1]
        const elementFirstDoc = document.querySelector(`#doc_${firstDocId}`) as HTMLElement
        const targetElementDoc = document.querySelector(`#doc_${targetDocId}`)

        const { docId, doc } = createDoc(elementFirstDoc, docPositionInsert)

        doc.querySelector('.document-name').innerHTML = `${docName}`

        const targetWrapperPages = doc.querySelector('.wrapper-pages')

        this.selectedPageIds.forEach((pageId: string) => {
          const elementPage = getWrapperPage(pageId)
          const wrapperPages = elementPage.closest('.wrapper-pages') as HTMLElement

          targetWrapperPages.appendChild(elementPage)
          checkWrapperPagesIsEmpty(wrapperPages)
        })

        doc.classList.add('copied')

        targetElementDoc.parentNode.insertBefore(doc, targetElementDoc.nextSibling)
        storeDocument.addDocumentId(docId, docPositionInsert)

      } else if (this.countSelectedDocIds) {
        const targetFirstDocId = this.selectedDocIds[0]
        const targetFirstSelectedDoc = document.querySelector(`#doc_${targetFirstDocId}`)
        const targetWrapperPages = targetFirstSelectedDoc.querySelector('.wrapper-pages')

        this.selectedDocIds.forEach((docId: string) => {
          if (docId !== targetFirstDocId) {
            const elementDoc = document.querySelector(`#doc_${docId}`)

            elementDoc
              .querySelectorAll('.wrapper-page')
              .forEach((elementWrapperPage) => targetWrapperPages.appendChild(elementWrapperPage))

            storeDocument.removeDocumentId(docId)
            elementDoc.remove()
          }
        })

        this.handleRename(docName)
        storeDocument.addSelectedDocId(targetFirstDocId)
      }

      changeDocNumberNameForCopiedDocs() // for splitted documents
    },

    handleSplit(docName: string) {
      const elementPage = document.querySelector(`#${this.selectedPageIds[0]}`) as HTMLElement
      const targetPageId = elementPage.id
      const targetWrapperPages = elementPage.closest('.wrapper-pages')
      const targetWrapperDoc = elementPage.closest('.wrapper-document')
      const targetFullDocId = targetWrapperDoc.id
      const targetDocId = targetFullDocId.slice(4)
      const targetDocPosition = storeDocument.documentIds.findIndex((id) => id === targetDocId)

      const pageIds = Array.from(targetWrapperPages.querySelectorAll('.wrapper-page')).map(
        (elementWrapperPage) => elementWrapperPage.querySelector('.page').id,
      )

      const targetIndexPage = pageIds.findIndex((id) => id === targetPageId)
      const targetPageIds = pageIds.slice(targetIndexPage)

      targetPageIds.forEach((id) => storeEditActions.addSelectedPageId(id, true))
      this.handleCreate(docName, targetDocPosition + 1)
    },

    // handleSplit(docName: string) {
    //   const elementPage = document.querySelector(
    //     `#${this.selectedPageIds[0]}`,
    //   ) as HTMLElement
    //   const targetClass = getClassStartWith(elementPage, 'num_page_')
    //   const curentNumPage = +targetClass.slice(9)

    //   const targetWrapperPage = getWrapperPage(this.selectedPageIds[0])
    //   const targetWrapperDocument = targetWrapperPage.closest('.wrapper-document')
    //   const targetDocId = targetWrapperDocument.id.slice(4) // doc_

    //   const targetIndexDoc = storeDocument.documents.findIndex((doc) => doc.id === targetDocId)
    //   const targetObjectDocUrl = storeDocument.documents[targetIndexDoc].url
    //   const targetIndexNewDoc = targetIndexDoc + 1

    //   targetWrapperPage.remove()
    //   const newId = getId()

    //   storeDocument.addDocument(
    //     { id: newId, name: `${docName}.pdf`, url: targetObjectDocUrl },
    //     targetIndexNewDoc,
    //   )

    //   eventEmitter.on('pageLoaded', (docId) => {
    //     if (docId === newId) {
    //       Array.from(
    //         document.querySelector(`#doc_${docId}`).querySelectorAll('.wrapper-page'),
    //       ).forEach((element: HTMLElement, index: number) => {
    //         if (index + 1 < curentNumPage) {
    //           element.remove()
    //         }
    //       })

    //       eventEmitter.off('pageLoaded')
    //     }
    //   })
    // },
  },
}
</script>
<template>
  <DialogWindow
    v-if="showDialog"
    :modelValue="showDialog"
    :title="dialogTitle"
    :name="docName"
    :text="docText"
    :actionNameOk="dialogBtnOk"
    @cancel="closeDialog"
    @ok="actionOkDialog"
  />

  <div class="actions-mode">
    <v-divider color="black" thickness="2" vertical inset class="mx-3"></v-divider>

    <div class="actions-edit">
      <v-badge class="mr-3" color="deep-orange-lighten-2" :model-value="renameActive" max="99" :content="countSelectedDocIds">
        <v-btn
          icon
          size="small"
          color="yellow-lighten-1"
          variant="elevated"
          :disabled="!renameActive"
          @click="rename"
        >
          <v-icon>mdi-rename-box-outline</v-icon>
          <v-tooltip activator="parent" location="bottom">Rename</v-tooltip>
          </v-btn>
      </v-badge>

      <v-badge class="mr-3" color="deep-orange-lighten-2" :model-value="createActive && !!countSelected" max="99" :content="countSelected">
        <v-btn
          icon
          size="small"
          color="yellow-lighten-1"
          variant="elevated"
          :disabled="!createActive"
          @click="create"
        >
          <v-icon>mdi-folder-plus-outline</v-icon>
          <v-tooltip activator="parent" location="bottom">Create</v-tooltip>
        </v-btn>
      </v-badge>

      <v-btn
        icon
        class="mr-3"
        size="small"
        color="yellow-lighten-1"
        variant="elevated"
        :disabled="!splitActive"
        @click="split"
      >
        <v-icon>mdi-format-page-split</v-icon>
        <v-tooltip activator="parent" location="bottom">Split</v-tooltip>
      </v-btn>

      <v-badge class="mr-3" color="deep-orange-lighten-2" :model-value="copyActive && !!countSelected" max="99" :content="countSelected">
        <v-btn
          icon
          size="small"
          color="yellow-lighten-1"
          variant="elevated"
          :disabled="!copyActive"
          @click="copy"
        >
          <v-icon>mdi-content-copy</v-icon>
          <v-tooltip activator="parent" location="bottom">Copy</v-tooltip>
        </v-btn>
      </v-badge>

      <v-badge class="mr-3" color="deep-orange-lighten-2" :model-value="cutActive && !!countSelected" max="99" :content="countSelected">
        <v-btn
          icon
          size="small"
          color="yellow-lighten-1"
          variant="elevated"
          :disabled="!cutActive"
          @click="cut"
        >
          <v-icon>mdi-content-cut</v-icon>
          <v-tooltip activator="parent" location="bottom">Cut</v-tooltip>
        </v-btn>
      </v-badge>

      <v-badge class="mr-3" color="deep-orange-lighten-2" :model-value="pasteActive && !!countCutOrCopy" max="99" :content="countCutOrCopy">
        <v-btn
          icon
          size="small"
          color="yellow-lighten-1"
          variant="elevated"
          :disabled="!pasteActive"
          @click="paste"
        >
          <v-icon>mdi-content-paste</v-icon>
          <v-tooltip activator="parent" location="bottom">Paste</v-tooltip>
        </v-btn>
      </v-badge>

      <v-badge class="mr-1" color="deep-orange-lighten-2" :model-value="deleteActive && !!countSelected" max="99" :content="countSelected">
        <v-btn
          icon
          size="small"
          color="yellow-lighten-1"
          variant="elevated"
          :disabled="!deleteActive"
          @click="remove"
        >
          <v-icon>mdi-delete-outline</v-icon>
          <v-tooltip activator="parent" location="bottom">Delete</v-tooltip>
        </v-btn>
      </v-badge>
    </div>

    <v-divider color="black" thickness="2" vertical inset class="mx-3"></v-divider>

    <div class="actions-revert">
      <v-btn
        icon
        class="mr-1"
        size="small"
        color="yellow-lighten-1"
        variant="elevated"
        :disabled="!undoActive"
        @click="undo"
      >
        <v-icon>mdi-undo-variant</v-icon>
        <v-tooltip activator="parent" location="bottom">Undo</v-tooltip>
      </v-btn>

      <v-btn
        icon
        class="mr-1"
        size="small"
        color="yellow-lighten-1"
        variant="elevated"
        :disabled="!redoActive"
        @click="redo"
      >
        <v-icon>mdi-redo-variant</v-icon>
        <v-tooltip activator="parent" location="bottom">Redo</v-tooltip>
      </v-btn>
    </div>

    <v-divider color="black" thickness="2" vertical inset class="mx-3"></v-divider>

    <div class="action-save">
      <v-btn
        icon
        class="mr-1"
        size="small"
        color="yellow-lighten-1"
        variant="elevated"
        :disabled="!saveActive"
        @click="save"
      >
        <v-icon>mdi-content-save-all-outline</v-icon>
        <v-tooltip activator="parent" location="bottom">Save</v-tooltip>
      </v-btn>

      <v-btn
        icon
        class="mr-1"
        size="small"
        color="yellow-lighten-1"
        variant="elevated"
        @click="exit"
      >
        <v-icon>mdi-location-exit</v-icon>
        <v-tooltip activator="parent" location="bottom">Exit</v-tooltip>
      </v-btn>
    </div>
  </div>
</template>
<style scoped>
.actions-mode {
  display: flex;
  align-items: center;
  height: 64px;
}

.actions-mode button {
  border-radius: 10%;
}

.actions-mode button:hover {
  opacity: 0.7;
}

.actions-edit,
.actions-revert,
.action-save {
  display: flex;
  margin-left: 4px;
}

@media only screen and (max-width: 1345px) {
  .v-divider {
    margin-left: 0 !important;
    margin-right: 0 !important;
  }
}
</style>
