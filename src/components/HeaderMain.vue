<script lang="ts">
import ControlsEdit from './ControlsEdit.vue'
import DocumentPanel from './DocumentPanel.vue'
import DialogWindow from './shared/DialogWindow.vue'
import MessageWindow from './shared/MessageWindow.vue'
import { ActionNames } from '../shared/actionNames.enum'
import { PresetsZoomSize } from '../shared/controls.enum'
import { storeDocument } from '../store/storeDocument'
import { storeUser } from '../store/storeUser'
import { useRequestInit } from '../composables/useRequestInit'

import * as PDFJS from 'pdfjs-dist'
import { v4 as uuid } from 'uuid'
import { ref } from 'vue'
import { IDocument, IFileDocument, IPage, IReqSaveDocuments } from '../shared/document.interface'
import { Document, Page, Prefixes } from '../utils/utils'

export default {
  props: [
    'scale',
    'activeRotate',
    'isEditMode',
    'isCompareView',
    'isWrappedView',
    'isFirstViewer',
    'isSecondViewer',
    'indexActiveFirstPageId',
    'countSelectedPages',
    'countSelectedDocs',
  ],

  emits: [
    'generatedDocument',
    'zoom',
    'selectZoom',
    'rotate',
    'showAnnotations',
    'changeIndexActiveFirstPageId',
  ],

  components: {
    MessageWindow,
    DialogWindow,
    DocumentPanel,
    ControlsEdit,
  },

  data() {
    return {
      leftPanel: false,
      rightPanel: false,
      showCreateNewDoc: false,
      storeDocument,
      messageTitle: '',
      messageText: '',
      showBtnCancel: false,
      visibleMessage: false,
      dialogBtnOk: ActionNames.CREATE,
      presetsZoom: [...Object.values(PresetsZoomSize)],
      pathSelectorSelect: `${this.isCompareView ? (this.isFirstViewer ? '.first' : '.second') : ''}.zoom-select-wrapper .select`,
      showZoomOptions: false,
    }
  },

  mounted() {
    // console.log('mounted header', this)
    if (this.isCompareView) {
      this.selectZoom(PresetsZoomSize.HEIGHT)
      return
    }

    this.setValueZoomInSelect(`${this.scale}%`, this.scale)
  },

  computed: {
    saveActive() {
      // return storeDocument.rotatePages.length || storeDocument.editActions.length
      return true
    }
  },

  methods: {
    toggleSelectMenu(): void {
      document
        .querySelectorAll(this.pathSelectorSelect)
        .forEach((elem) => elem.classList.toggle('open'))

      this.showZoomOptions = !this.showZoomOptions
    },

    selectZoom(zoomPreset: string) {
      if (this.selectedZoomPreset !== zoomPreset) {
        this.$emit('selectZoom', zoomPreset)
      }
    },

    setValueZoomInSelect(preset: string, valueZoom: number): void {
      this.selectedZoomPreset = preset

      document
        .querySelectorAll(this.pathSelectorSelect + ' .custom-options span.selected')
        .forEach((elem) => elem.classList.remove('selected'))

      document
        .querySelectorAll(this.pathSelectorSelect + ` .custom-options span[data-value='${preset}']`)
        .forEach((elem) => elem.classList.add('selected'))

      document
        .querySelectorAll(this.pathSelectorSelect + ' .select-current .select-current-value')
        .forEach((elem) => (elem.textContent = `${valueZoom}%`))
    },

    showDialogCreateNewDocument() {
      this.showCreateNewDoc = true
    },

    closeCreateNewDoc() {
      this.showCreateNewDoc = false
    },

    async createNewDoc(value: { docName: string; docText: string }) {
      const { docName, docText } = value

      let baseUrl = `http://localhost:8081/documents/create?documentName=${docName}`

      if (docText) {
        baseUrl += `&documentText=${docText}`
      }

      const options = useRequestInit('GET')

      try {
        const response = await fetch(baseUrl, options)
        const data = await response.blob();
        const url = URL.createObjectURL(data)
        const loadingTask = PDFJS.getDocument(url)

        await loadingTask.promise
          .then((res: PDFJS.PDFDocumentProxy) => {
            const numPages = res.numPages
            const url = ref()
            url.value = loadingTask

            const pages = []
            const newDocId = `${Prefixes.NEW_DOC}-${uuid()}`

            for (let i = 0; i < numPages; i++) {
              const numPage = i + 1
              const page = new Page(numPage, newDocId, numPage, url)
              pages.push(page)
            }

            const doc = new Document(`${docName}.pdf`, pages, newDocId)
            const positionIndex = storeDocument.documents.length;

            // storeDocument.setDocument(doc, positionIndex)
            storeDocument.addDocument(doc, positionIndex)
          })

      } catch (err) {
        this.showMessage('Some failed', 'Could not create new document!', true)
      }

      this.closeCreateNewDoc()
    },

    showMessage(title: string, text: string, show: boolean, showBtnCancel = false) {
      this.messageTitle = title
      this.messageText = text
      this.visibleMessage = show
      this.showBtnCancel = showBtnCancel
    },

    closeMessage() {
      this.visibleMessage = false
    },

    clickOkMessage() {
      if (this.messageTitle === 'Warning') {
        this.$router.push({ name: 'docReader' })
      }

      this.visibleMessage = false
    },

    // getDocuments(): Promise<FormData> {
    //   return new Promise(async(resolve, reject) => {
    //     const formData = new FormData()

    //     storeDocument.documents.forEach(async (doc, index) => {
    //       const pdfDocumentProxy = await doc.pages[0].url.promise

    //       pdfDocumentProxy.getData().then((arrayBuffer: Uint8Array) => {
    //         const blobFile = new Blob([arrayBuffer], { type: 'application/pdf' })
    //         formData.append('userIds[]', storeUser.userId)
    //         formData.append('documentIds[]', doc.id)
    //         formData.append('documentNames[]', doc.name)
    //         formData.append('files[]', blobFile)
    //         formData.append('info[]', null)


    //         if (index + 1 === storeDocument.documents.length) {
    //           // editAcions: storeDocument.editActions,
    //           // rotate: storeDocument.rotatePages
    //           // formData.append('rotate', storeDocument.rotatePages)
    //           resolve(formData)
    //         }
    //       })
    //     })
    //   })
    // },

//     const promise2 = new Promise((resolve, reject) =>
//   setTimeout(reject, 100, "foo"),
// );
// const promises = [promise1, promise2];

// Promise.allSettled(promises).then((results) =>
//   results.forEach((result) => console.log(result.status)),
// );

    getNewDocuments(): Promise<IFileDocument[]> {
      return new Promise((resolve, reject) => {
        const documents = [];
        const newDocuments = storeDocument.documents.filter(doc => doc.id.startsWith(Prefixes.NEW_DOC))
        const countNewDocuments = newDocuments.length

        if (countNewDocuments) {
          newDocuments.forEach(async (doc) => {
            try {
              const document = {} as IFileDocument
              const pdfDocumentProxy = await doc.pages[0].url.promise
              const arrayBuffer = await pdfDocumentProxy.getData()

              // document.userId = storeUser.userId
              document.id = doc.id
              document.name = doc.name
              document.file = btoa(String.fromCharCode(...arrayBuffer))
              document.pages = doc.pages.map((page) => (({ url, ...rest }) => rest)(page) as IPage)
              document.info = null

              documents.push(document)

              if (documents.length === countNewDocuments) {
                resolve(documents)
              }
            } catch (err) {
              reject(err)
            }
          })

        } else {
          resolve([])
        }

      })
    },

    async save() {
      try {
        const data: IReqSaveDocuments = {
          userId: storeUser.userId,
          rotate: storeDocument.rotatePages
        }

        if (this.isEditMode) {
          data.editActions = storeDocument.editActions
        } else {
          const newDocuments = await this.getNewDocuments()
          data.newDocuments = newDocuments

          console.log('11111111111111111', data.newDocuments)
        }

        const options = useRequestInit('POST', data, true)
        console.log('dddddddddddd---------send', data )

        // const response = await fetch('http://localhost:8081/documents/saveActions', options)
        const response = await fetch('http://localhost:8081/documents/saveDocuments', options)

        if (response.ok) {
          this.$router.push({ name: 'docReader' })
        } else {
          this.showMessage('Some failed', 'Could not save the documents!', true)
        }

        // response.ok
        //   ? this.$router.push({ name: 'docReader' })
        //   : this.showMessage('Some failed', 'Could not save the documents!', true)

      } catch (err) {
        this.showMessage('Some failed', 'Could not save the documents!', true)

      }
    },

    exit() {
      if (this.saveActive) {
        this.showMessage('Warning', 'There are some unsaved changes. Are you sure ?', true, true)
        return
      }

      this.$router.push({ name: 'docReader' })
    },

    async handleFileChange(event) {
      const files = Array.from(event.target.files)
      let countError = 0

      const docsLoadingTask = []

      files.forEach((file: File) => {
        if (file.type !== 'application/pdf') {
          countError++
        } else {
          const url = URL.createObjectURL(file)
          const loadingTask = PDFJS.getDocument(url)
          docsLoadingTask.push({ name: file.name, loadingTask })
        }
      })

      await Promise.allSettled(
        docsLoadingTask.map((docLoading) => docLoading.loadingTask.promise)
      ).then((results) => {
        results
          .filter(result => result.status === 'rejected')
          .forEach(() => countError++)

        results
          .filter(result => result.status === 'fulfilled')
          .forEach((result: PromiseFulfilledResult<PDFJS.PDFDocumentProxy>, index: number) => {
            const docLoading = docsLoadingTask[index]
            const numPages = result.value.numPages
            const url = ref()
            url.value = docLoading.loadingTask

            const pages = []
            const newDocId = `${Prefixes.NEW_DOC}-${uuid()}`
            const { name } = docLoading

            for (let i = 0; i < numPages; i++) {
              const numPage = i + 1
              const page = new Page(numPage, newDocId, numPage, url)
              pages.push(page)
            }

            const doc = new Document(name, pages, newDocId)
            const positionIndex = storeDocument.documents.length + index;

            storeDocument.setDocument(doc, positionIndex)

            // storeDocument.addDocument(doc, positionIndex)
          })
      })

      if (countError) {
        this.showMessage('Some failed', `${countError} document(s) could not be loaded!`, true)
      }
    },

    clickDocName($event: { id: string; value: boolean; path: number[]; event: PointerEvent }) {
      storeDocument.setActiveDocId($event.id)
    },

    clickOutSideSelectZoom(event: PointerEvent) {
      if (this.showZoomOptions) {
        this.toggleSelectMenu()
      }
    },

    download() {
      const options = useRequestInit('GET')

      storeDocument.selectedDocIds.forEach(async (docId) => {
        try {
          if (docId.startsWith(Prefixes.NEW_DOC)) {
            const doc= storeDocument.documents.find(doc => doc.id === docId)
            const pdfDocumentProxy = await doc.pages[0].url.promise

            pdfDocumentProxy
              .getData()
              .then((arrayBuffer: Uint8Array) => this.downloadDocument(arrayBuffer, doc.name))

          } else {
            const response = await fetch(`http://localhost:8081/documents/${docId}`, options)

            if (response.status === 200) {
              const data = await response.json()
              const binaryFile = atob(data.file)
              const length = binaryFile.length
              const arrayBuffer = new Uint8Array(length)

              for (let i = 0; i < length; i++) {
                arrayBuffer[i] = binaryFile.charCodeAt(i)
              }

              this.downloadDocument(arrayBuffer, data.name)

            } else {
              throw new Error(response.statusText)
            }
          }

        } catch (error) {
          console.error('Error download file:', error)
        }

        // -------------------------
        // const data = await response.arrayBuffer();
        // const blob = new Blob([data], { type: 'application/pdf' });
        // const url = window.URL.createObjectURL(blob);
        // const a = document.createElement('a');
        // a.href = url;
        // a.download = 'docName.pdf';
        // document.body.appendChild(a);
        // a.click();
        // a.remove();
        // window.URL.revokeObjectURL(url);
      })
    },

    downloadDocument(arrayBuffer: Uint8Array, name: string) {
      const url = URL.createObjectURL(new Blob([arrayBuffer], { type: 'application/pdf' }))
      const a = document.createElement('a')
      a.href = url
      a.download = name
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
    },

    print() {
      // TODO:
      console.log('printer')
    },
  },
}
</script>
<template>
  <MessageWindow
    :showMessage="visibleMessage"
    :title="messageTitle"
    :text="messageText"
    :showBtnCancel="showBtnCancel"
    @clickCancel="closeMessage"
    @clickOk="clickOkMessage"
  />

  <DialogWindow
    v-if="showCreateNewDoc"
    :modelValue="showCreateNewDoc"
    :title="'Create new document'"
    :actionNameOk="dialogBtnOk"
    @cancel="closeCreateNewDoc"
    @ok="createNewDoc"
  />

  <v-card
    class="card"
    :class="{
      'left-panel': leftPanel && !rightPanel,
      'right-panel': rightPanel && !leftPanel,
      'mixed-panel': rightPanel && leftPanel,
      'compare-view': isCompareView,
      second: isSecondViewer,
    }"
  >
    <v-layout>
      <v-app-bar
        :class="{ 'edit-mode': isEditMode }"
        :color="isEditMode ? 'light-green-lighten-1' : 'primary'"
        prominent
      >
        <v-btn
          v-if="isCompareView && isSecondViewer"
          icon
          class="mr-1 btn-wrapped-view"
          size="small"
          variant="outlined"
          @click="$router.push({ name: 'wrappedDocReader' })"
        >
          <v-icon>mdi-table-headers-eye</v-icon>
          <v-tooltip activator="parent" location="bottom">Wrapped View</v-tooltip>
        </v-btn>

        <v-app-bar-nav-icon
          variant="text"
          @click.stop="leftPanel = !leftPanel"
        ></v-app-bar-nav-icon>

        <v-toolbar-title>Document Reader & Editor</v-toolbar-title>

        <v-spacer>
          <div class="controls">
            <div class="actions-view">
              <div class="buttons-navigation">
                <v-btn
                  icon
                  class="mr-1"
                  size="small"
                  :color="isEditMode ? 'yellow-lighten-1' : ''"
                  :variant="isEditMode ? 'elevated' : 'outlined'"
                  :disabled="indexActiveFirstPageId === 0"
                  @click="$emit('changeIndexActiveFirstPageId', -1)"
                >
                  <v-icon>mdi-chevron-left</v-icon>
                  <v-tooltip activator="parent" location="bottom">Previous</v-tooltip>
                </v-btn>

                <div class="doc-counter">
                  {{ storeDocument.documents.length ? indexActiveFirstPageId + 1 : 0 }} /
                  {{ storeDocument.documents.length }}
                </div>

                <v-btn
                  icon
                  class="mr-1"
                  size="small"
                  :color="isEditMode ? 'yellow-lighten-1' : ''"
                  :variant="isEditMode ? 'elevated' : 'outlined'"
                  :disabled="indexActiveFirstPageId + 1 >= storeDocument.documents.length"
                  @click="$emit('changeIndexActiveFirstPageId', 1)"
                >
                  <v-icon>mdi-chevron-right</v-icon>
                  <v-tooltip activator="parent" location="bottom">Next</v-tooltip>
                </v-btn>
              </div>

              <div class="buttons-pages">
                <div class="buttons-rotate">
                  <v-badge
                    class="mr-3"
                    :color="countSelectedPages ? 'pink-darken-1' : 'deep-orange-lighten-2'"
                    :model-value="activeRotate"
                    max="99"
                    :content="countSelectedPages || countSelectedDocs"
                  >
                    <v-btn
                      icon
                      size="small"
                      :color="isEditMode ? 'yellow-lighten-1' : ''"
                      :variant="isEditMode ? 'elevated' : 'outlined'"
                      :disabled="!activeRotate"
                      @click="$emit('rotate', -90)"
                    >
                      <v-icon>mdi-rotate-left</v-icon>
                      <v-tooltip activator="parent" location="bottom">Rotate left 90°</v-tooltip>
                    </v-btn>
                  </v-badge>

                  <v-badge
                    class="mr-3"
                    :color="countSelectedPages ? 'pink-darken-1' : 'deep-orange-lighten-2'"
                    :model-value="activeRotate"
                    max="99"
                    :content="countSelectedPages || countSelectedDocs"
                  >
                    <v-btn
                      icon
                      size="small"
                      :color="isEditMode ? 'yellow-lighten-1' : ''"
                      :variant="isEditMode ? 'elevated' : 'outlined'"
                      :disabled="!activeRotate"
                      @click="$emit('rotate', 90)"
                    >
                      <v-icon>mdi-rotate-right</v-icon>
                      <v-tooltip activator="parent" location="bottom">Rotate right 90°</v-tooltip>
                    </v-btn>
                  </v-badge>
                </div>

                <div class="buttons-zoom">
                  <v-btn
                    icon
                    class="mr-1 btn-zoom"
                    size="small"
                    :color="isEditMode ? 'yellow-lighten-1' : ''"
                    :variant="isEditMode ? 'elevated' : 'outlined'"
                    :disabled="scale <= 30"
                    @click="$emit('zoom', -10)"
                  >
                    <v-icon>mdi-minus</v-icon>
                    <v-tooltip activator="parent" location="bottom">Zoom Out</v-tooltip>
                  </v-btn>

                  <div
                    class="zoom-select-wrapper"
                    :class="isCompareView ? (isFirstViewer ? 'first' : 'second') : ''"
                  >
                    <div class="select">
                      <div class="select-current">
                        <span class="select-current-value"></span>
                      </div>

                      <div class="custom-options">
                        <span
                          v-for="preset in presetsZoom"
                          :key="preset"
                          class="custom-option"
                          :data-value="preset"
                          @click="selectZoom(preset)"
                          >{{ preset }}</span
                        >
                      </div>
                    </div>
                  </div>
                  <v-btn
                    icon
                    class="mr-1 btn-select"
                    size="small"
                    :color="isEditMode ? 'yellow-lighten-1' : ''"
                    :variant="isEditMode ? 'elevated' : 'outlined'"
                    v-click-outside="clickOutSideSelectZoom"
                    @click.stop="toggleSelectMenu"
                  >
                    <v-icon>{{ showZoomOptions ? 'mdi-menu-up' : 'mdi-menu-down' }}</v-icon>
                    <v-tooltip activator="parent" location="bottom">Select Zoom</v-tooltip>
                  </v-btn>

                  <v-btn
                    icon
                    class="mr-1"
                    size="small"
                    :color="isEditMode ? 'yellow-lighten-1' : ''"
                    :variant="isEditMode ? 'elevated' : 'outlined'"
                    :disabled="scale >= 300"
                    @click="$emit('zoom', 10)"
                  >
                    <v-icon>mdi-plus</v-icon>
                    <v-tooltip activator="parent" location="bottom">Zoom In</v-tooltip>
                  </v-btn>

                  <v-btn
                    icon
                    class="mr-1 btn-annotations"
                    size="small"
                    :color="isEditMode ? 'yellow-lighten-1' : ''"
                    :variant="isEditMode ? 'elevated' : 'outlined'"
                    @click="$emit('showAnnotations')"
                  >
                    <v-icon>mdi-format-annotation-plus</v-icon>
                    <v-tooltip activator="parent" location="bottom">Annotations</v-tooltip>
                  </v-btn>
                </div>
              </div>
            </div>

            <ControlsEdit v-if="isEditMode" />

            <div v-if="!isCompareView && !isEditMode" class="actions-mode">
              <v-divider vertical thickness="2" inset class="mr-3"></v-divider>

              <div class="types-mode">
                <v-btn
                  v-if="isCompareView || isWrappedView"
                  icon
                  class="mr-1"
                  size="small"
                  variant="outlined"
                  @click="$router.push({ name: 'docReader' })"
                >
                  <v-icon>mdi-file-eye-outline</v-icon>
                  <v-tooltip activator="parent" location="bottom">View Mode</v-tooltip>
                </v-btn>

                <v-btn
                  v-if="!isWrappedView"
                  icon
                  class="mr-1"
                  size="small"
                  variant="outlined"
                  @click="$router.push({ name: 'wrappedDocReader' })"
                >
                  <v-icon>mdi-table-headers-eye</v-icon>
                  <v-tooltip activator="parent" location="bottom">Wrapped View</v-tooltip>
                </v-btn>

                <v-btn
                  v-if="!isCompareView"
                  icon
                  class="mr-1"
                  size="small"
                  variant="outlined"
                  @click="$router.push({ name: 'compareDocReader' })"
                >
                  <v-icon>mdi-file-compare</v-icon>
                  <v-tooltip activator="parent" location="bottom">Compare View</v-tooltip>
                </v-btn>
              </div>

              <v-divider
                v-if="!isCompareView"
                vertical
                thickness="2"
                inset
                class="mx-3"
              ></v-divider>

              <div v-if="!isCompareView" class="actions-files">
                <v-btn
                  icon
                  class="mr-1"
                  size="small"
                  variant="outlined"
                  @click="$router.push({ name: 'editDocReader' })"
                >
                  <v-icon>mdi-file-edit-outline</v-icon>
                  <v-tooltip activator="parent" location="bottom">Edit Mode</v-tooltip>
                </v-btn>

                <v-btn
                  icon
                  class="mr-1"
                  size="small"
                  variant="outlined"
                  @click="showDialogCreateNewDocument"
                >
                  <v-icon>mdi-file-document-plus-outline</v-icon>
                  <v-tooltip activator="parent" location="bottom">Create new</v-tooltip>
                </v-btn>

                <input
                  type="file"
                  ref="file"
                  style="display: none"
                  accept="application/pdf"
                  multiple
                  @change="handleFileChange"
                />

                <v-btn
                  icon
                  class="mr-1"
                  size="small"
                  variant="outlined"
                  @click="$refs.file.click()"
                >
                  <v-icon>mdi-file-upload-outline</v-icon>
                  <v-tooltip activator="parent" location="bottom">Upload File</v-tooltip>
                </v-btn>

                <v-badge
                  class="mx-3"
                  color="deep-orange-lighten-2"
                  :model-value="!!storeDocument.selectedDocIds.length"
                  max="99"
                  :content="storeDocument.selectedDocIds.length"
                >
                  <v-btn
                    icon
                    size="small"
                    variant="outlined"
                    :disabled="!storeDocument.selectedDocIds.length"
                    @click="download"
                  >
                    <v-icon>mdi-file-download-outline</v-icon>
                    <v-tooltip activator="parent" location="bottom">Download</v-tooltip>
                  </v-btn>
                </v-badge>

                <v-badge
                  class="mr-1"
                  color="deep-orange-lighten-2"
                  :model-value="!!storeDocument.selectedDocIds.length"
                  max="99"
                  :content="storeDocument.selectedDocIds.length"
                >
                  <v-btn
                    icon
                    size="small"
                    variant="outlined"
                    :disabled="!storeDocument.selectedDocIds.length"
                    @click="print"
                  >
                    <v-icon>mdi-printer-outline</v-icon>
                    <v-tooltip activator="parent" location="bottom">Print</v-tooltip>
                  </v-btn>
                </v-badge>
              </div>
            </div>

            <v-divider
              v-if="!isCompareView"
              :color="isEditMode ? 'black' : ''"
              vertical
              thickness="2"
              inset
              class="mx-3"
            ></v-divider>

            <div v-if="!isCompareView" class="action-save">
              <v-btn
                icon
                class="mr-1"
                size="small"
                :variant="isEditMode ? 'elevated' : 'outlined'"
                :color="isEditMode ? 'yellow-lighten-1' : ''"
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
                :variant="isEditMode ? 'elevated' : 'outlined'"
                :color="isEditMode ? 'yellow-lighten-1' : ''"
                @click="exit"
              >
                <v-icon>mdi-location-exit</v-icon>
                <v-tooltip activator="parent" location="bottom">Exit</v-tooltip>
              </v-btn>
            </div>
          </div>
        </v-spacer>

        <template v-if="$vuetify.display.smAndUp">
          <v-btn icon="mdi-magnify" variant="text"></v-btn>
          <v-btn icon="mdi-filter" variant="text"></v-btn>
        </template>

        <v-app-bar-nav-icon
          icon="mdi-dots-vertical"
          variant="text"
          @click.stop="rightPanel = !rightPanel"
        ></v-app-bar-nav-icon>

        <v-btn
          v-if="isCompareView && isFirstViewer"
          icon
          class="btn-view-mode"
          size="small"
          variant="outlined"
          @click="$router.push({ name: 'docReader' })"
        >
          <v-icon>mdi-file-eye-outline</v-icon>
          <v-tooltip activator="parent" location="bottom">View Mode</v-tooltip>
        </v-btn>
      </v-app-bar>

      <v-navigation-drawer
        v-model="leftPanel"
        class="left-list-panel"
        :class="{
          active: leftPanel,
        }"
        :location="$vuetify.display.mobile ? 'top' : undefined"
        temporary
      >
        <v-list @click:select="clickDocName">
          <v-list-item
            v-for="item in storeDocument.documents.map((doc) => ({
              title: doc.name.replace(/\.[^/.]+$/, ''),
              value: doc.id,
            }))"
            :key="item.value"
            :title="item.title"
            :value="item.value"
            :active="item.value === storeDocument.activeDocId"
          />
        </v-list>
      </v-navigation-drawer>

      <v-navigation-drawer
        v-model="rightPanel"
        :location="$vuetify.display.mobile ? 'bottom' : 'right'"
        class="right-list-panel"
        :class="{
          active: rightPanel,
          'panel-width': rightPanel && !$vuetify.display.mobile,
          'panel-height': $vuetify.display.mobile,
        }"
        temporary
      >
        <DocumentPanel />
      </v-navigation-drawer>
    </v-layout>
  </v-card>
</template>
<style scoped>
.v-toolbar-title {
  max-width: 250px;
  min-width: 250px;
}

.compare-view .v-toolbar-title {
  display: none;
}

.compare-view .actions-view {
  justify-content: center;
  padding-right: 69px;
}

.second.compare-view .actions-view {
  justify-content: flex-start;
}

.compare-view .actions-view {
  padding-left: 4px;
}

.right-list-panel,
.left-list-panel {
  transition: none;
}

:not(.second).compare-view .active.right-list-panel {
  right: 50% !important;
}

.second.compare-view .active.left-list-panel {
  left: 50% !important;
}

.card {
  height: 64px;
  cursor: default;
  z-index: 999;
}

.compare-view .v-layout header {
  width: 50% !important;
  left: auto !important;
}

.panel-width {
  width: 400px !important;
  border: 0;
}

.panel-height {
  max-height: 200px;
}

.controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 64px;
  color: white;
}

.controls button,
.btn-wrapped-view,
.btn-view-mode {
  border-radius: 10%;
}

.btn-view-mode {
  margin-inline-end: 5px !important;
  margin-left: 4px;
}

.controls button:hover {
  opacity: 0.7;
}

.controls .btn-select {
  border-radius: 0 10% 10% 0;
}

.actions-view {
  display: flex;
  justify-content: space-between;
  width: 100%;
}

.actions-mode {
  display: flex;
  align-items: center;
  height: 64px;
}

.buttons-navigation,
.buttons-rotate,
.buttons-zoom {
  display: flex;
}

.doc-counter {
  width: 70px;
  height: 40px;
  text-align: center;
  align-content: center;
  background: white;
  /* color: #1867c0; */
  color: black;
  margin-right: 4px;
  border-radius: 10%;
  line-height: 20px;
  cursor: default;
}

.buttons-pages {
  display: flex;
  width: 100%;
  justify-content: center;
  padding-left: 90px;
}

.compare-view .buttons-pages {
  width: max-content;
  margin-left: 5px;
  padding-left: 0;
  padding-right: 23px;
}

.edit-mode .buttons-pages {
  justify-content: flex-end;
  padding-right: 0;
}

.btn-zoom {
  margin-left: 32px;
}

.btn-annotations {
  margin-left: 40px;
}

.compare-view .btn-zoom {
  margin-left: 14px;
}

.compare-view .btn-annotations {
  margin-left: 20px;
}

.types-mode,
.actions-files,
.action-save {
  display: flex;
  margin-left: 4px;
}

.zoom-select-wrapper {
  width: 60px;
  display: inline-block;
}

.select {
  position: relative;
  display: flex;
  flex-direction: column;
  box-shadow:
    0 2px 5px 0 rgba(0, 0, 0, 0.05),
    0 2px 10px 0 rgba(0, 0, 0, 0.05);
}

.select-current {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  height: 40px;
  line-height: 56px;
  /* color: #1867c0; */
  color: black;
  background-color: white;
  cursor: default;
  border: 1px solid white;
  border-right: none;
  border-radius: 10% 0 0 10%;
}

.custom-options {
  width: 100px;
  position: absolute;
  display: block;
  top: 100%;
  box-shadow:
    0 2px 2px 0 rgb(0 0 0 / 14%),
    0 1px 5px 0 rgb(0 0 0 / 12%),
    0 3px 1px -2px rgb(0 0 0 / 20%);
  background: white;
  transition: all 0.2s;
  opacity: 0;
  visibility: hidden;
  pointer-events: none;
  z-index: 2;
}

.select.open .custom-options {
  opacity: 1;
  visibility: visible;
  pointer-events: all;
}

.custom-option {
  position: relative;
  display: block;
  padding-left: 7px;
  font-size: 14px;
  font-weight: 400;
  color: rgba(2, 21, 44, 0.88);
  line-height: 19px;
  transition: all 0.5s;
}

.custom-option:hover {
  cursor: pointer;
  background-color: gray;
}

.custom-option.selected {
  color: white;
  background-color: #1867c0;
}

@media only screen and (max-width: 1768px) {
  .compare-view .actions-view {
    justify-content: flex-start;
    padding-right: 0;
  }

  .edit-mode .btn-zoom,
  .edit-mode .btn-annotations {
    margin-left: 0;
  }
}

/* @media only screen and (max-width: 1670px) {
  .edit-mode .btn-zoom,
  .edit-mode .btn-annotations {
    margin-left: 0;
  }
} */

@media only screen and (max-width: 1670px) {
  .buttons-pages {
    padding-left: 0;
  }

  .compare-view {
    margin-left: 0;
  }

  .compare-view .btn-zoom,
  .compare-view .btn-annotations {
    margin-left: 0;
  }
}

@media only screen and (max-width: 1590px) {
  .edit-mode .v-toolbar-title {
    min-width: calc(100% - 1351px);
  }

  .edit-mode .v-toolbar__content > .v-toolbar-title {
    margin-inline-start: 2px;
  }
}

@media only screen and (max-width: 1550px) {
  .btn-zoom,
  .btn-annotations {
    margin-left: 0;
  }

  .compare-view .buttons-pages {
    padding-right: 0;
  }
}

@media only screen and (max-width: 1500px) {
  .v-toolbar-title {
    min-width: calc(100% - 1155px);
  }

  .v-divider {
    margin-left: 0 !important;
    margin-right: 0 !important;
  }
}

@media only screen and (max-width: 1150px) {
  .buttons-pages {
    padding-right: 0;
  }

  .v-toolbar__content > .v-toolbar-title {
    margin-inline-start: 2px;
  }
}
</style>
