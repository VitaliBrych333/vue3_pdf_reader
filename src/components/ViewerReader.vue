<script lang="ts">
import { Ref, ref } from 'vue'
import * as PDFJS from 'pdfjs-dist'
import LoaderSkeleton from '../components/LoaderSkeleton.vue'
import PageView from '../components/PageView.vue'
import HeaderMain from '../components/HeaderMain.vue'
import { storeDocument } from '../store/storeDocument'
import { storeEditActions } from '../store/storeEditActions'
import { storeUser } from '../store/storeUser'
import { useRequestInit } from '../composables/useRequestInit'
import { PresetsZoomSize } from '../shared/controls.enum'
import { IDocument, IPage } from '../shared/document.interface'
import { Document, Page, getDocName } from '../utils/utils'

export default {
  props: ['isEditMode', 'isWrappedView', 'isCompareView', 'isFirstViewer', 'isSecondViewer'],

  emits: ['allLoaded'],

  components: {
    HeaderMain,
    LoaderSkeleton,
    PageView,
  },

  data() {
    return {
      storeDocument,
      storeEditActions,
      indexActiveFirstPageId: 0,
      scale: this.isWrappedView ? 50 : this.isEditMode ? 35 : 100,
      selectedPageIds: [], // for CompareView
      selectedDocIds: [], // for CompareView
      isLastPageLoaded: false,
      annotations: false,
      scrollTop: {
        firstViewer: this.isCompareView ? 52 : 0,
        secondViewer: this.isCompareView ? 52 : 0,
      },
      pathViewer: this.isCompareView ? (this.isFirstViewer ? '.first' : '.second') : '',
    }
  },

  mounted() {
    if (!storeDocument.isDocumentsLoaded && !this.isSecondViewer) {
      this.getDocuments().then(async (documents: Document[]) => {
        const docsLoadingTask = []
        // let countError = 0

        documents.forEach(async (doc) => {
          const binaryFile = atob(doc.file)
          const array = new Uint8Array(binaryFile.length)
          const length = binaryFile.length

          for (let i = 0; i < length; i++) {
            array[i] = binaryFile.charCodeAt(i)
          }

          const url = URL.createObjectURL(new Blob([array], { type: 'application/json' }))
          const loadingTask = PDFJS.getDocument(url)

          docsLoadingTask.push({ doc, loadingTask })
        })

        await Promise.allSettled(
          docsLoadingTask.map((docLoading) => docLoading.loadingTask.promise),
        ).then((results) => {
          if (results.some((result) => result.status === 'rejected')) {
            console.warn('Some docs could not be loaded!')
          }

          results
            .filter((result) => result.status === 'fulfilled')
            .forEach((result: PromiseFulfilledResult<PDFJS.PDFDocumentProxy>, index: number) => {
              const docLoading = docsLoadingTask[index]
              const numPages = result.value.numPages
              const url = ref()
              url.value = docLoading.loadingTask

              const pages = []
              const { documentId, name } = docLoading.doc

              for (let i = 0; i < numPages; i++) {
                const numPage = i + 1
                const page = new Page(numPage, documentId, numPage, url)
                pages.push(page)
              }

              const doc = new Document(name, pages, documentId)

              storeDocument.setDocument(doc, index)
            })
        })

        storeDocument.setIsDocumentsLoaded(true)
      })
    }
  },

  beforeUnmount() {
    storeDocument.clearSelectedPageIds()
    storeDocument.clearSelectedDocIds()
  },

  computed: {
    docName() {
      return (name: string) => name.match(/([^\/]+)(?=\.\w+$)/)?.[0]
    },

    isLatestPageInDoc() {
      return (numPage: number, totalPage: number) => numPage === totalPage
    },

    countDocuments() {
      return storeDocument.documents.length
    },

    editedPageIds() {
      return storeEditActions.cutPageIds.concat(storeEditActions.copyPageIds)
    },

    editedDocIds() {
      return [...storeEditActions.cutDocIds].concat([...storeEditActions.copyDocIds])
    },

    activeRotate() {
      if (this.isCompareView) {
        return !!this.selectedPageIds.length || !!this.selectedDocIds.length
      }

      return !!storeDocument.selectedPageIds.length || !!storeDocument.selectedDocIds.length
    },
  },

  methods: {
    async getDocuments(): Promise<Document[]> {
      const options = useRequestInit('GET')
      const response = await fetch(
        `http://localhost:8081/documents?userId=${storeUser.userId}`,
        options,
      )
      const data = await response.json()

      return data
    },

    clickDocument(event: PointerEvent, docId: string) {
      if (this.isCompareView) {
        this.selectedPageIds = []
        this.selectedDocIds = event.ctrlKey
          ? this.selectedDocIds.includes(docId)
            ? [...this.selectedDocIds].filter((id) => id !== docId)
            : [...this.selectedDocIds].concat(docId)
          : [docId]
      } else {
        storeDocument.clearSelectedPageIds()
        storeDocument.addSelectedDocId(docId, event.ctrlKey)
      }
    },

    clickPage(event: PointerEvent, pageId: string) {
      if (this.isCompareView) {
        this.selectedDocIds = []
        this.selectedPageIds = event.ctrlKey
          ? this.selectedPageIds.includes(pageId)
            ? [...this.selectedPageIds].filter((id) => id !== pageId)
            : [...this.selectedPageIds].concat(pageId)
          : [pageId]
      } else {
        storeDocument.clearSelectedDocIds()
        storeDocument.addSelectedPageId(pageId, event.ctrlKey)
      }
    },

    docsLoaded() {
      this.isLastPageLoaded = true

      const firstDoc = storeDocument.documents[0]

      if (firstDoc?.id) {
        storeDocument.setActiveDocId(firstDoc.id)
      }

      if (this.isCompareView) {
        this.$emit('allLoaded', true)
      }
    },

    clickWrapper(event: PointerEvent) {
      if (this.isCompareView) {
        this.selectedDocIds = []
        this.selectedPageIds = []
        return
      }

      storeDocument.clearSelectedDocIds()
      storeDocument.clearSelectedPageIds()
    },

    zoom(value: number) {
      this.scale += value
      this.$refs.refControls.setValueZoomInSelect(`${this.scale}%`, this.scale)
    },

    selectZoom(zoomPreset: string) {
      const wrapperDocuments = document.querySelector(
        `${
          this.isCompareView ? (this.isFirstViewer ? '.first' : '.second') : ''
        }.wrapper-documents`,
      )
      const pages = wrapperDocuments.querySelectorAll('.page')
      let scaleIndex = 1

      if (zoomPreset === PresetsZoomSize.HEIGHT) {
        const heigthWrapperDocuments = wrapperDocuments.clientHeight - 10 // add margin 10px
        const maxHeigthPage = Math.max.apply(
          null,
          Array.from(pages).map((page) => page.clientHeight),
        )
        scaleIndex = Math.round((heigthWrapperDocuments / maxHeigthPage) * 100)
        this.scale = Math.round((this.scale * scaleIndex) / 100)
      } else if (zoomPreset === PresetsZoomSize.WIDTH) {
        const withWrapperDocuments = wrapperDocuments.clientWidth - 34 // add margin 12px and padding 5px
        const maxWidthPage = Math.max.apply(
          null,
          Array.from(pages).map((page) => page.clientWidth),
        )
        scaleIndex = Math.round((withWrapperDocuments / maxWidthPage) * 100)
        this.scale = Math.round((this.scale * scaleIndex) / 100)
      } else {
        this.scale = +zoomPreset.slice(0, -1)
      }

      const targetWidth = this.isCompareView
        ? this.isFirstViewer
          ? wrapperDocuments.clientWidth / 2
          : wrapperDocuments.clientWidth * 1.5
        : wrapperDocuments.clientWidth / 2

      const targetElement = document.elementFromPoint(targetWidth, (window.innerHeight - 64) / 2) // 64px - header height

      const middlePage = targetElement.closest('.page') || targetElement.querySelector('.page')

      requestAnimationFrame(() => {
        middlePage?.scrollIntoView({ behavior: 'auto', block: 'start' })
        wrapperDocuments.scrollBy(0, -5)
      })

      this.$refs.refControls.setValueZoomInSelect(zoomPreset, this.scale)
    },

    rotate(value: number) {
      if (this.isCompareView) {
        if (this.selectedDocIds.length) {
          this.selectedDocIds.forEach((id: string) =>
            storeDocument.documents
              .find((doc) => doc.id === id)
              .pages.forEach((page) =>
                this.$refs.refPage
                  .find((refPage) => refPage.page.pageId === page.pageId)
                  .rotatePage(value),
              ),
          )
        } else {
          this.selectedPageIds.forEach((id: string) =>
            this.$refs.refPage.find((refPage) => refPage.page.pageId === id).rotatePage(value),
          )
        }
      } else {
        if (storeDocument.selectedDocIds.length) {
          storeDocument.selectedDocIds.forEach((id) =>
            storeDocument.documents
              .find((doc) => doc.id === id)
              .pages.forEach((page) => storeDocument.rotate(page.pageId, value)),
          )
        } else {
          storeDocument.selectedPageIds.forEach((id) => storeDocument.rotate(id, value))
        }
      }
    },

    async showAnnotations() {
      this.annotations = !this.annotations
      // const existingPdfBytes = await fetch(storeDocument.baseUrl).then(res => res.arrayBuffer())
      // const pdfDoc = await PDFDocument.load(existingPdfBytes)
      //  console.log('show annotation', pdfDoc)
      //  const page = pdfDoc.addPage()
    },

    changeIndexActiveFirstPageId(value: number) {
      const docs = storeDocument.documents
      this.indexActiveFirstPageId += value
      const pageId = docs.map((doc) => doc.pages[0].pageId)[this.indexActiveFirstPageId]

      this.navigateToPage(pageId)

      if (!this.isCompareView) {
        storeDocument.setActiveDocId(docs[this.indexActiveFirstPageId].id)
      }

      // console.log('dddddddd----this.indexActiveFirstPageId', this.indexActiveFirstPageId)
    },

    navigateToPage(pageId: string) {
      const element = this.isCompareView
        ? (document
            .querySelector(`.wrapper-documents${this.pathViewer}`)
            .querySelector(`#${pageId}`) as HTMLElement)
        : (document.querySelector(`#${pageId}`) as HTMLElement)
      const elementWrapper = element.closest('.wrapper-documents') as HTMLElement

      element?.scrollIntoView({ behavior: 'auto', block: 'start' })
      elementWrapper?.scrollBy(0, -60) // for first pages of docs (to show the name doc)
    },

    handleScroll(event: Event) {
      if (this.isCompareView) {
        const targetElement = event.target as HTMLElement
        const classTargetViewer = targetElement.classList[0]

        if (storeDocument.isSynchronousScroll) {
          const classNextViewer = classTargetViewer === 'first' ? 'second' : 'first'
          const nextViewer = document.querySelector(
            `.${classNextViewer}.wrapper-documents`,
          ) as HTMLElement

          if (classTargetViewer === 'first' && !storeDocument.firstViewerScrollLock) {
            const scrollY = targetElement.scrollTop - this.scrollTop.firstViewer
            storeDocument.setSecondViewerScrollLock(true)
            nextViewer.scrollBy(0, scrollY)
            this.scrollTop.firstViewer = targetElement.scrollTop

            requestAnimationFrame(() => storeDocument.setSecondViewerScrollLock(false))
          } else if (classTargetViewer === 'second' && !storeDocument.secondViewerScrollLock) {
            const scrollY = targetElement.scrollTop - this.scrollTop.secondViewer
            storeDocument.setFirstViewerScrollLock(true)
            nextViewer.scrollBy(0, scrollY)
            this.scrollTop.secondViewer = targetElement.scrollTop

            requestAnimationFrame(() => storeDocument.setFirstViewerScrollLock(false))
          } else {
            this.setScrollTop(classTargetViewer, targetElement.scrollTop)
          }
        } else {
          this.setScrollTop(classTargetViewer, targetElement.scrollTop)
        }
      }
    },

    setScrollTop(classTargetViewer: string, scrollTop: number) {
      switch (classTargetViewer) {
        case 'first':
          this.scrollTop.firstViewer = scrollTop
          break
        case 'second':
          this.scrollTop.secondViewer = scrollTop
          break
        default:
          return
      }
    },
  },

  watch: {
    'storeDocument.activeDocId'(newDocId: string) {
      if (newDocId) {
        this.indexActiveFirstPageId = storeDocument.documents.findIndex(
          (doc) => doc.id === newDocId,
        )
      }
    },
  },
}
</script>

<template>
  <HeaderMain
    v-if="isLastPageLoaded || storeDocument.isDocumentsLoaded && !countDocuments"
    ref="refControls"
    :isEditMode="isEditMode"
    :isFirstViewer="isFirstViewer"
    :isSecondViewer="isSecondViewer"
    :isWrappedView="isWrappedView"
    :isCompareView="isCompareView"
    :indexActiveFirstPageId="indexActiveFirstPageId"
    :countSelectedPages="
      isCompareView ? selectedPageIds.length : storeDocument.selectedPageIds.length
    "
    :countSelectedDocs="isCompareView ? selectedDocIds.length : storeDocument.selectedDocIds.length"
    :activeRotate="activeRotate"
    :scale="scale"
    @changeIndexActiveFirstPageId="changeIndexActiveFirstPageId"
    @rotate="rotate"
    @zoom="zoom"
    @selectZoom="selectZoom"
    @showAnnotations="showAnnotations"
  />

  <!-- <v-progress-circular color="error" indeterminate :size="89" :width="8"></v-progress-circular> -->

  <LoaderSkeleton
    v-if="!storeDocument.isDocumentsLoaded || (countDocuments && !isLastPageLoaded)"
  />

  <div v-if="storeDocument.isDocumentsLoaded && !countDocuments" class="empty">No documents</div>

  <div class="wrapper-view" @click="clickWrapper">
    <div
      :class="this.isCompareView ? (this.isFirstViewer ? 'first' : 'second') : ''"
      class="wrapper-documents"
      @scroll="handleScroll"
    >
      <div
        v-for="(doc, indexDoc, key) in storeDocument.documents"
        class="wrapper-document"
        :key="doc"
        :id="`${doc.id}`"
        :class="{
          'wrapped-view-documents': isWrappedView,
          'edit-mode': isEditMode,
          active: isCompareView
            ? selectedDocIds.includes(doc.id)
            : storeDocument.selectedDocIds.includes(doc.id),
          edit: editedDocIds.includes(doc.id),
        }"
      >
        <div
          v-if="isLastPageLoaded"
          class="document-title"
          @click.stop="clickDocument($event, doc.id)"
        >
          <span class="document-number"
            >{{
              storeDocument.documents.map((doc) => doc.id).findIndex((id) => id === doc.id) + 1
            }}.
          </span>
          <span class="document-name">{{ docName(doc.name) }}</span>
        </div>

        <div :class="{ 'wrapped-view-pages': isEditMode || isWrappedView }" class="wrapper-pages">
          <div
            v-for="page in doc.pages"
            :key="page"
            class="wrapper-page-view"
            :class="{
              'active-page': isCompareView
                ? selectedPageIds.includes(page.pageId)
                : storeDocument.selectedPageIds.includes(page.pageId),
              'edit-page': editedPageIds.includes(page.pageId),
            }"
          >
            <PageView
              ref="refPage"
              class="page"
              :isCompareView="isCompareView"
              :annotations="annotations"
              :page="page"
              :scale="scale / 100"
              :isLatestPageDoc="isLatestPageInDoc(page.numPage, doc.pages.length)"
              :isLatestPageAllDocs="
                isLatestPageInDoc(page.numPage, doc.pages.length) && indexDoc + 1 === countDocuments
              "
              :isLastPageAllDocsLoaded="isLastPageLoaded"
              @click.stop="clickPage($event, page.pageId)"
              @docsLoaded="docsLoaded"
            />

            <div class="page-order">{{ page.numPage }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.empty {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  font-size: 26px;
}

.wrapper-view {
  height: calc(100vh - 64px);
}

.v-layout header {
  position: relative;
}

.left-panel + .wrapper-view {
  margin-left: 255px;
  width: calc(100% - 255px);
}

.right-panel + .wrapper-view {
  width: calc(100% - 400px);
}

.mixed-panel + .wrapper-view {
  margin-left: 255px;
  width: calc(100% - 655px);
}

.left-panel + .wrapper-view .navigation {
  left: calc((100% + 255px) * 0.5);
}

.right-panel + .wrapper-view .navigation {
  left: calc((100% - 400px) * 0.5);
}

.mixed-panel + .wrapper-view .navigation {
  left: calc((100% - 155px) * 0.5);
}

.right-panel + .wrapper-view .column-btn,
.mixed-panel + .wrapper-view .column-btn {
  right: 420px;
}

.wrapper-documents {
  height: 100%;
  overflow-y: auto;
  overflow-x: auto;
  padding-bottom: 50px;
}

.wrapper-document {
  padding: 0 5px;
}

.edit-mode,
.wrapped-view-documents {
  display: flex;
  justify-content: center;
  flex-direction: column;
}

.edit {
  opacity: 0.5;
}

.document-title {
  height: 40px;
  margin-top: 10px;
  text-align: center;
  font-size: 20px;
  color: black;
}

.document-title {
  background-color: #ff7043;
}

.edit-mode > .document-title {
  text-align: left;
  padding-left: 10px;
}

.document-title:hover {
  cursor: pointer;
  opacity: 0.7;
  box-shadow:
    0px -7px 18px -4px rgba(0, 0, 0, 0.2),
    0 -8px 20px 0 rgba(0, 0, 0, 0.19);
}

.document-title:hover ~ .wrapper-pages {
  opacity: 0.7;
  box-shadow:
    0 10px 16px 0 rgba(0, 0, 0, 0.2),
    0 6px 20px 0 rgba(0, 0, 0, 0.19);
}

.document-title,
.wrapper-pages {
  border-right: 3px solid transparent;
  border-left: 3px solid transparent;
}

.document-title {
  border-top: 3px solid transparent;
}

.wrapper-pages {
  border-bottom: 3px solid transparent;
}

.active > .document-title,
.active > .document-title ~ .wrapper-pages {
  border-right: 3px solid #e53935;
  border-left: 3px solid #e53935;
}

.active > .document-title {
  border-top: 3px solid #e53935;
  box-shadow:
    0px -7px 18px -4px rgba(0, 0, 0, 0.2),
    0 -8px 20px 0 rgba(0, 0, 0, 0.19);
}

.active > .document-title ~ .wrapper-pages {
  border-bottom: 3px solid #e53935;
  box-shadow:
    0 10px 16px 0 rgba(0, 0, 0, 0.2),
    0 6px 20px 0 rgba(0, 0, 0, 0.19);
}

.wrapped-view-pages {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
}

.wrapper-page-view {
  display: flex;
  align-items: center;
  flex-direction: column;
  width: fit-content;
  margin: 0 auto;
}

.wrapped-view-pages .wrapper-page-view {
  margin: 0;
}

.page {
  position: relative;
  display: block;
  margin: 7px;
  border: 3px solid transparent;
}

.page:hover {
  cursor: pointer;
}

.page-order {
  font-size: 16px;
}

.active-page .page-order {
  background-color: #e53935;
  border-radius: 15px;
  padding: 0 10px;
}

.navigation {
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 20px;
  user-select: none;
}

.controls-right {
  right: 50px !important;
}
</style>
