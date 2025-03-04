<script lang="ts">
import ControlsEdit from './ControlsEdit.vue'
import DocumentPanel from './DocumentPanel.vue'
import DialogWindow from './shared/DialogWindow.vue'
import MessageWindow from './shared/MessageWindow.vue'
import { ActionNames } from '../shared/actionNames.enum'
import { PresetsZoomSize } from '../shared/controls.enum'
import { storeDocument } from '../store/storeDocument'
import { storeUser } from '../store/storeUser'
import { getId } from '../utils/utils'
import { useRequestInit } from '../composables/useRequestInit'

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
    'countDocuments',
    'countSelectedPage'
  ],

  emits: [
    'generatedDocument',
    'zoom',
    'selectZoom',
    'rotate',
    'showAnnotations',
    'changeIndexActiveFirstPageId'
  ],

  components: {
    MessageWindow,
    DialogWindow,
    DocumentPanel,
    ControlsEdit
  },

  data() {
    return {
      leftPanel: false,
      rightPanel: false,
      showCreateNewDoc: false,
      storeDocument,
      messageTitle: '',
      messageText: '',
      isVisibleMessage: false,
      dialogBtnOk: ActionNames.CREATE,
      presetsZoom: [...Object.values(PresetsZoomSize)],
      pathSelectorSelect: `${this.isCompareView ? (this.isFirstViewer ? '.first' : '.second') : ''}.zoom-select-wrapper .select`,
      showZoomOptions: false,
    }
  },

  mounted() {
    if (this.isCompareView) {
      this.selectZoom(PresetsZoomSize.HEIGHT)
    } else {
      this.setValueZoomInSelect(`${this.scale}%`, this.scale)
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
      // const { firstName, lastName, email, password } = this;

      // const options = this.getRequestOptions('GET');
      // const response = await fetch('http://localhost:8081/documents/create', options);

      // const data = await response.blob();

      // fetch('http://localhost:8081/document/createNew', options)
      // .then((response) => response.blob())
      // .then((blob) => URL.createObjectURL(blob))
      // .then((href) => {

      //   console.log('ffffffffffffffffffffff---href', href)
      //   const a = document.createElement("a")
      //   document.body.appendChild(a)
      //   a.style = "display: none"
      //   a.href = href

      //   storeFile.setFile(href)
      //   a.download = 'hello.pdf'
      //   a.click()
      // })

      // console.log('createNewDocument---------response', response)

      // storeFile.setFile('http://localhost:8081/documents/create')

      // this.$emit('generatedDocument', response.body);

      // if (response.ok) {
      //   const data = await response.json();

      //   if (data?.id) {
      //      this.showDialog('Succes', 'Register succes! Please Log in now.', true);
      //   } else {
      //     this.showDialog('Failed', 'Something wrong! Please try again.', true);
      //   }

      // } else {
      //   this.showDialog('Failed', 'Something wrong! Please try again.', true);
      // }

      // storeDocument.createNewDocument('http://localhost:8081/documents/create');

      // storeDocument.setUsePdf('http://localhost:8081/documents/create');
    },

    closeCreateNewDoc() {
      this.showCreateNewDoc = false
    },

    async createNewDoc(value: { docName: string; docText: string }) {
      const { docName, docText } = value

      let baseUrl = 'http://localhost:8081/documents/create'

      if (docName) {
        baseUrl += `?docName=${docName}`
      } else {
        baseUrl += '?docName=new_document'
      }

      if (docText) {
        baseUrl += `&docText=${docText}`
      }

      // const options = useRequestInit('GET')
      // const response = await fetch(baseUrl, options)

      // // // нужно вернуть user_Id, чтобы добавлять для документов

      // if (response.ok) {
      //   const data = await response.json();

      //   console.log('response------', response, data)

      //   // if (data.userId && data.status === 'Success') {
      //   //   storeUser.setUserId(data.userId)

      //   // } else {
      //   //   // this.showDialog('Failed', 'Invalid email or password! Please try again.', true)
      //   // }

      // } else {
      //   this.showMessage('Failed', 'Can not create document! Please try again.', true)
      // }

      // storeDocument.setBaseUrl(baseUrl);

      console.log('ffffffffffff', baseUrl)
      const newId = getId()
      storeDocument.setUsePdf(newId, `${docName}.pdf`, baseUrl)
      this.closeCreateNewDoc()
    },
    // requestInit(method: string, body: object | null = null) {
    //   const init: RequestInit = {
    //     method,
    //     headers: { 'Content-Type': 'application/json' },
    //     credentials: 'include' // "include" | "omit" | "same-origin" - to get in response a cookie with token and set in the browser
    //   };

    //   if (body) {
    //     // init['body'] = JSON.stringify(body);
    //     init['body'] = body;
    //   }

    //   return init;
    // },

    showMessage(title: string, text: string, show: boolean) {
      this.messageTitle = title
      this.messageText = text
      this.isVisibleMessage = show
    },

    closeMessage() {
      this.isVisibleMessage = false
    },

    async getDocuments(): Promise<FormData> {
      return new Promise((resolve, reject) => {
        const formData = new FormData()

        storeDocument.documents.forEach(async (doc, index) => {
          const pdfDocumentProxy = await doc.url.pdf.promise

          pdfDocumentProxy.getData().then((arrayBuffer: Uint8Array) => {
            const blobFile = new Blob([arrayBuffer], { type: 'application/pdf' })

            formData.append('userIds[]', storeUser.userId)
            formData.append('names[]', doc.name)
            formData.append('files[]', blobFile)
            formData.append('info[]', null)

            if (index + 1 === storeDocument.documents.length) {
              resolve(formData)
            }
          })
        })
      })
    },

    async save() {
      const docsFormData = await this.getDocuments()
      const response = await fetch('http://localhost:8081/documents/save', {
        method: 'POST',
        // headers: { 'Content-Type': 'application/json' },  //application/x-www-form-urlencoded
        // headers: { 'Content-Type': 'application/json', 'Content-Disposition': 'form-data'},
        // headers: { 'Content-Type': 'multipart/form-data' },
        // headers: { 'Content-Type': 'form-data' },
        credentials: 'include',
        body: docsFormData,
      })

      console.log('000000-----response----------', response)
    },

    exit() {
      console.log('000000-----exit----------')
      this.$router.push({ name: 'docReader' })
    },

    handleFileChange(event) {
      console.log('handleFileChange--------', this.$refs.file.value, event.target.files)

      const files = Array.from(event.target.files)
      let countError = 0

      files.forEach((file: File) => {
        if (file.type !== 'application/pdf') {
          countError++
        } else {
          const url = URL.createObjectURL(file)
          const newId = getId()
          storeDocument.setUsePdf(newId, file.name, url)
        }
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
          const response = await fetch(`http://localhost:8081/documents/${docId}`, options)

          if (response.status === 200) {
            const data = await response.json()
            const binaryFile = atob(data.file)
            const array = new Uint8Array(binaryFile.length)

            for (let i = 0; i < binaryFile.length; i++) {
              array[i] = binaryFile.charCodeAt(i)
            }

            const url = URL.createObjectURL(new Blob([array], { type: 'application/pdf' }))
            const a = document.createElement('a')

            a.href = url
            a.download = data.name
            document.body.appendChild(a)
            a.click()
            a.remove()
            window.URL.revokeObjectURL(url)
          } else {
            throw new Error(response.statusText)
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

    print() {
      // TODO:
      console.log('printer')
    }
  },
}
</script>
<template>
  <MessageWindow
    :showMessage="isVisibleMessage"
    :title="messageTitle"
    :text="messageText"
    @closeMessage="closeMessage"
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
      'second': isSecondViewer
    }"
  >
    <v-layout>
      <v-app-bar :class="{ 'edit-mode': isEditMode }" :color="isEditMode ? 'light-green-lighten-1' : 'primary'" prominent>
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
                  {{ countDocuments ? indexActiveFirstPageId + 1 : 0 }} / {{ countDocuments }}
                </div>

                <v-btn
                  icon
                  class="mr-1"
                  size="small"
                  :color="isEditMode ? 'yellow-lighten-1' : ''"
                  :variant="isEditMode ? 'elevated' : 'outlined'"
                  :disabled="indexActiveFirstPageId + 1 >= countDocuments"
                  @click="$emit('changeIndexActiveFirstPageId', 1)"
                >
                  <v-icon>mdi-chevron-right</v-icon>
                  <v-tooltip activator="parent" location="bottom">Next</v-tooltip>
                </v-btn>
              </div>

              <div class="buttons-pages">
                <div class="buttons-rotate">

                  <v-badge class="mr-3" color="deep-orange-lighten-2" :model-value="activeRotate" max="99" :content="countSelectedPage">
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

                  <v-badge class="mr-3" color="deep-orange-lighten-2" :model-value="activeRotate" max="99" :content="countSelectedPage">
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

              <v-divider v-if="!isCompareView" vertical thickness="2" inset class="mx-3"></v-divider>

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

                <v-badge class="mx-3" color="deep-orange-lighten-2" :model-value="!!storeDocument.selectedDocIds.length" max="99" :content="storeDocument.selectedDocIds.length">
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

                <v-badge class="mr-1" color="deep-orange-lighten-2" :model-value="!!storeDocument.selectedDocIds.length" max="99" :content="storeDocument.selectedDocIds.length">
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

              <v-divider vertical thickness="2" inset class="mx-3"></v-divider>

              <div class="action-save">
                <v-btn icon class="mr-1" size="small" variant="outlined" @click="save">
                  <v-icon>mdi-content-save-all-outline</v-icon>
                  <v-tooltip activator="parent" location="bottom">Save</v-tooltip>
                </v-btn>

                <v-btn
                  icon
                  class="mr-1"
                  size="small"
                  variant="outlined"
                  @click="exit"
                >
                  <v-icon>mdi-location-exit</v-icon>
                  <v-tooltip activator="parent" location="bottom">Exit</v-tooltip>
                </v-btn>
              </div>
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
          'active': leftPanel,
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
          'active': rightPanel,
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

.right-list-panel, .left-list-panel {
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

.controls button, .btn-wrapped-view, .btn-view-mode {
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

.btn-zoom,
.btn-annotations {
  margin-left: 40px;
}

.compare-view .btn-zoom,
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
  color:black;
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
}

@media only screen and (max-width: 1670px) {
  .edit-mode .btn-zoom,
  .edit-mode .btn-annotations {
    margin-left: 0;
  }
}

@media only screen and (max-width: 1630px) {
  .buttons-pages {
    padding-left: 0;
  }

  .compare-view {
    margin-left: 0;
  }

  .compare-view .btn-zoom, .compare-view .btn-annotations {
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
