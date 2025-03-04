<script lang="ts">
import LoaderSkeleton from '../components/LoaderSkeleton.vue'
import PageView from '../components/PageView.vue'
import HeaderMain from '../components/HeaderMain.vue'
import { storeDocument } from '../store/storeDocument'
import { storeEditActions } from '../store/storeEditActions'
import { storeUser } from '../store/storeUser'
import { useRequestInit } from '../composables/useRequestInit'
import {
  deleteClassActiveForCopiedPages,
  deleteClassActiveForNewDoc,
  getWrapperPage,
  getClassStartWith,
  getSplittedPagesByLine,
  getTranslateX,
  pageIsInOneLine,
} from '../utils/utilsDOM'
import { PresetsZoomSize } from '../shared/controls.enum'
import { Document } from '../shared/document.interface'

export default {
  props: [
    'isEditMode',
    'isWrappedView',
    'isCompareView',
    'isFirstViewer',
    'isSecondViewer'
  ],

  emits: [
    'allLoaded',
  ],

  components: {
    HeaderMain,
    LoaderSkeleton,
    PageView,
  },

  data() {
    return {
      storeDocument,
      storeEditActions,
      activeFirstPageId: null,
      indexActiveFirstPageId: 0,
      firstPageIds: [],
      pageIds: [],
      scale: this.isWrappedView ? 50 : this.isEditMode ? 35 : 100,
      selectedPageIds: [],
      selectedDocIds: [],
      isLastPageLoaded: false,
      annotations: false,
      scrollTop: {
        firstViewer: this.isCompareView ? 52 : 0,
        secondViewer: this.isCompareView ? 52 : 0,
      },
      splittedPagesInDocsByLine: null,
    }
  },

  mounted() {
    if (!storeDocument.isDocumentsLoaded && !this.isSecondViewer) {
      this.getDocuments().then((documents: Document[]) => {
        documents.forEach((doc) => {
          const binaryFile = atob(doc.file)
          const array = new Uint8Array(binaryFile.length)
          const length = binaryFile.length

          for (let i = 0; i < length; i++) {
            array[i] = binaryFile.charCodeAt(i)
          }

          const url = URL.createObjectURL(new Blob([array], { type: 'application/json' }))

          storeDocument.setUsePdf(`${doc.id}`, doc.name, url)
        })

        storeDocument.setIsDocumentsLoaded(true)
      })
    }
  },

  beforeUnmount() {
    if (this.isEditMode) {
      window.removeEventListener('resize', this.handleResize)
      storeEditActions.clearSelectedPageIds()
    } else {
      storeDocument.clearSelectedDocIds()
    }
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
      if (this.isEditMode) {
        return (
          !!storeEditActions.selectedPageIds.length &&
          storeEditActions.selectedPageIds.every(
            (pageId) => !storeEditActions.copyPageIds.includes(pageId),
          )
        )
      }

      return !!this.selectedPageIds.length
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
      if (this.isEditMode && !event.ctrlKey) {
        deleteClassActiveForNewDoc()
      }

      if (this.isCompareView) {
        this.selectedDocIds = event.ctrlKey
          ? this.selectedDocIds.includes(docId)
            ? [...this.selectedDocIds].filter(id => id !== docId)
            : [...this.selectedDocIds].filter(id => id !== docId).concat(docId)
          : [docId]
      } else {
        storeDocument.addSelectedDocId(docId, event.ctrlKey)
      }
    },

    clickOutSidePage(event: PointerEvent, pageId: string) {
      const target = event.target as HTMLElement

      console.log('clickOutSidePage---------------', event, pageId, target, 'dddddddddd', target.className, target.nodeName)


      if (!event.ctrlKey || (event.ctrlKey && !(target.className.startsWith('page') || target.nodeName === 'CANVAS'))) {
      //  if (!event.ctrlKey) {
        console.log('clickOutSidePage---------------',  this.selectedPageIds)
        this.selectedPageIds = [...this.selectedPageIds].filter(id => id !== pageId)
         console.log('clickOutSidePage---------------after',  this.selectedPageIds)
      }


      // // if (targetClass !== 'document-title' && targetClass !== 'document-number' && targetClass !== 'document-name') {
      // if (!target.className.startsWith('document-')) {
      //   if (this.isCompareView) {
      //     this.selectedDocIds = []
      //   } else {
      //     storeDocument.clearSelectedDocIds()
      //   }

      //   deleteClassActiveForNewDoc()
      // }

      // if (this.isEditMode) {
      //   if (target.nodeName !== 'CANVAS') {
      //     storeEditActions.clearSelectedPageIds()
      //     deleteClassActiveForCopiedPages()
      //   }
      // } else {
      //   this.selectedPageIds = []
      // }

    },

    clickPage(event: PointerEvent, pageId: string) {
      console.log('clickPage', pageId)
      if (!this.editedDocIds.length) {

        // if (this.isCompareView) {
        //   this.selectedDocIds = []
        // } else {
        //   storeDocument.clearSelectedDocIds()
        // }

        if (this.isEditMode) {
          deleteClassActiveForNewDoc()

          if (!event.ctrlKey) {
            deleteClassActiveForCopiedPages()
          }

          storeEditActions.addSelectedPageId(pageId, event.ctrlKey)
        } else {
          this.selectedPageIds = event.ctrlKey
            ? this.selectedPageIds.includes(pageId)
              ? [...this.selectedPageIds].filter(id => id !== pageId)
              : [...this.selectedPageIds].filter(id => id !== pageId).concat(pageId)
            : [pageId]
        }
      }
    },

    docsLoaded() {
      this.isLastPageLoaded = true

      const firstDoc = storeDocument.documents[0]

      if (firstDoc?.id) {
        storeDocument.setActiveDocId(firstDoc.id)
      }

      if (this.isEditMode) {
        this.splittedPagesInDocsByLine = getSplittedPagesByLine()
        window.addEventListener('resize', this.handleResize)
      }

      if (this.isCompareView) {
        this.$emit('allLoaded', true);
      }
    },

    clickWrapper(event: PointerEvent) {
      const target = event.target as HTMLElement

      // if (targetClass !== 'document-title' && targetClass !== 'document-number' && targetClass !== 'document-name') {
      if (!target.className.startsWith('document-')) {
        if (this.isCompareView) {
          this.selectedDocIds = []
        } else {
          storeDocument.clearSelectedDocIds()
        }

        deleteClassActiveForNewDoc()
      }

      if (this.isEditMode) {
        if (target.nodeName !== 'CANVAS') {
          storeEditActions.clearSelectedPageIds()
          deleteClassActiveForCopiedPages()
        }
      } else {
        this.selectedPageIds = []
      }
    },

    clickOutSideDocName(event: PointerEvent, docId: string) {
      const target = event.target as HTMLElement
      console.log('clickOutSideDocName-----docId', event, target, docId, this.selectedDocIds)
      // console.log('clickOutSideDocName-----11111', target, event.ctrlKey, 'bbbb', this, this.isFirstViewer, this.selectedDocIds)


      if (this.isCompareView) {
        // this.selectedDocIds = [...this.selectedDocIds].filter((id) => id !== docId)
        this.selectedDocIds = event.ctrlKey && target.className.startsWith('document-')
          ? [...this.selectedDocIds]
          : [...this.selectedDocIds].filter((id) => id !== docId)

      } else {

        if (!target.className.startsWith('document-')) {
          storeDocument.clearSelectedDocIds()
        }
      }
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
        const withWrapperDocuments = wrapperDocuments.clientWidth - 24 // add margin 12px
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
      if (this.isEditMode) {
        this.$refs.refPage.forEach((refPage) => {
          if (storeEditActions.selectedPageIds.includes(refPage.pageId)) {
            refPage.rotatePage(value)
          }
        })

        storeEditActions.selectedPageIds
          .filter((pageId) => pageId.includes('copied'))
          .forEach((pageId) => {
            const targePageElement = getWrapperPage(pageId)
            const targetClassList = targePageElement.classList
            const targetClass = getClassStartWith(targePageElement, 'rotate_')

            const difHeightWidth = targePageElement.clientHeight - targePageElement.clientWidth
            const halfDifHeightWidth = difHeightWidth / 2
            const targetOffsetTop = targePageElement.offsetTop

            const wrapperPagesElement = targePageElement.closest('.wrapper-pages')
            const allPagesOnOneLine = Array.from(
              wrapperPagesElement.querySelectorAll('.wrapper-page'),
            ).filter((pageElement: HTMLElement) =>
              pageIsInOneLine(pageElement, targetOffsetTop, halfDifHeightWidth),
            )

            const indexTargetPage = allPagesOnOneLine.indexOf(targePageElement)

            let degree = 0

            if (targetClass) {
              const curentValue = +targetClass.slice(7)
              targetClassList.remove(targetClass)

              if (curentValue !== (value === 90 ? 270 : 90)) {
                degree = curentValue + value
                targetClassList.add(`rotate_${degree}`)
              }
            } else {
              degree = value === 90 ? 90 : 270
              targetClassList.add(`rotate_${degree}`)
            }

            allPagesOnOneLine.forEach((pageElement: HTMLElement, index: number) => {
              const curPageTranslateX = getTranslateX(pageElement)

              if (degree === 90 || degree === 270) {
                if (index < indexTargetPage) {
                  pageElement.style.translate = `${curPageTranslateX - halfDifHeightWidth}px 0px`
                } else if (index > indexTargetPage) {
                  pageElement.style.translate = `${curPageTranslateX + halfDifHeightWidth}px 0px`
                }
              } else {
                // 180 360/0
                if (index < indexTargetPage) {
                  pageElement.style.translate = `${curPageTranslateX + halfDifHeightWidth}px 0px`
                } else if (index > indexTargetPage) {
                  pageElement.style.translate = `${curPageTranslateX - halfDifHeightWidth}px 0px`
                }
              }
            })
          })

        const selectedPageIds = [...storeEditActions.selectedPageIds]
        storeEditActions.clearSelectedPageIds()

        requestAnimationFrame(() => {
          selectedPageIds.forEach((pageId) => storeEditActions.addSelectedPageId(pageId, true)) // workaround to trigger check isCopydDisabled after rotate landscape pages
          this.handleResize()
        })
      } else {
        this.$refs.refPage.forEach((refPage) => {
          if (this.selectedPageIds.includes(refPage.pageId)) {
            refPage.rotatePage(value)
          }
        })
      }
    },

    async showAnnotations() {
      this.annotations = !this.annotations

      // const existingPdfBytes = await fetch(storeDocument.baseUrl).then(res => res.arrayBuffer())
      // const pdfDoc = await PDFDocument.load(existingPdfBytes)
      //  console.log('show annotation', pdfDoc)
      //  const page = pdfDoc.addPage()
    },

    addPageId(pageId: string) {
      this.pageIds = [...this.pageIds].concat(pageId)
    },

    addFirstPageId(pageId: string, indexDoc: number) {
      this.firstPageIds[indexDoc] = pageId
    },

    changeIndexActiveFirstPageId(value: number) {
      this.indexActiveFirstPageId += value
      this.activeFirstPageId = this.firstPageIds[this.indexActiveFirstPageId]

      if (!this.isCompareView) {
        const docs = storeDocument.documents
        storeDocument.setActiveDocId(docs[this.indexActiveFirstPageId].id)
      }
    },

    handleResize() {
      if (this.isEditMode) {
        const docs = Array.from(document.querySelectorAll('.wrapper-document'))

        docs.forEach((docElement) => {
          const beforeResizeSplittedPages = this.splittedPagesInDocsByLine.get(docElement.id)
          const afterResizeSplittedPages = getSplittedPagesByLine().get(docElement.id)

          afterResizeSplittedPages.forEach((linePages, index) => {
            if (
              !linePages.every(
                (page, indexLine) => page === beforeResizeSplittedPages?.[index]?.[indexLine],
              ) ||
              linePages.length !== beforeResizeSplittedPages[index]?.length
            ) {
              linePages.forEach((page: HTMLElement) => (page.style.translate = '0px 0px'))
              const pageElements = linePages.filter((page: HTMLElement) =>
                getClassStartWith(page, 'rotate_'),
              )

              pageElements.forEach((page) => {
                const targetClass = getClassStartWith(page, 'rotate_')
                const curentValue = +targetClass.slice(7)
                const difHeightWidth = page.clientHeight - page.clientWidth
                const halfDifHeightWidth = difHeightWidth / 2
                const indexTargetPage = linePages.indexOf(page)

                linePages.forEach((pageElement: HTMLElement, index: number) => {
                  const curPageTranslateX = getTranslateX(pageElement)

                  if (curentValue === 90 || curentValue === 270) {
                    if (index < indexTargetPage) {
                      pageElement.style.translate = `${curPageTranslateX - halfDifHeightWidth}px 0px`
                    } else if (index > indexTargetPage) {
                      pageElement.style.translate = `${curPageTranslateX + halfDifHeightWidth}px 0px`
                    }
                  }
                })
              })
            }
          })
        })

        this.splittedPagesInDocsByLine = getSplittedPagesByLine()
      }
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
    activeFirstPageId(newPageId: string) {
      if (newPageId) {
        const element = document.querySelector(`#${newPageId}`) as HTMLElement
        const elementWrapper = element.closest('.wrapper-documents') as HTMLElement

        element?.scrollIntoView({ behavior: 'auto', block: 'start' })
        elementWrapper?.scrollBy(0, -60) // for first pages of docs (to show the name doc)
      }
    },

    'storeEditActions.cutPageIds'(newCutPageIds: string[]) {
      if (!newCutPageIds.length) {
        requestAnimationFrame(() => this.handleResize())
      }
    },

    'storeEditActions.copyPageIds'(newCopyPageIds: string[]) {
      if (!newCopyPageIds.length) {
        requestAnimationFrame(() => this.handleResize())
      }
    },

    'storeDocument.activeDocId'(newDocId: number) {
      if (newDocId) {
        const activeDocIds = document.querySelectorAll(`#doc_${newDocId}`)
        this.activeFirstPageId =
          this.isCompareView && this.isSecondViewer
            ? activeDocIds[1].querySelector('.page').id
            : activeDocIds[0].querySelector('.page').id

        this.indexActiveFirstPageId = this.firstPageIds.findIndex(
          (pageId: string) => pageId === this.activeFirstPageId,
        )
      }
    },
  },
}
</script>

<template>
  <HeaderMain
    v-if="isLastPageLoaded"
    ref="refControls"
    :isEditMode="isEditMode"
    :isFirstViewer="isFirstViewer"
    :isSecondViewer="isSecondViewer"
    :isWrappedView="isWrappedView"
    :isCompareView="isCompareView"
    :indexActiveFirstPageId="indexActiveFirstPageId"
    :countDocuments="firstPageIds.length"
    :countSelectedPage="isEditMode ? storeEditActions.selectedPageIds.length : selectedPageIds.length"
    :activeRotate="activeRotate"
    :scale="scale"
    @changeIndexActiveFirstPageId="changeIndexActiveFirstPageId"
    @rotate="rotate"
    @zoom="zoom"
    @selectZoom="selectZoom"
    @showAnnotations="showAnnotations"
  />

  <LoaderSkeleton v-if="!storeDocument.isDocumentsLoaded || (countDocuments && !isLastPageLoaded)" />

  <div v-if="storeDocument.isDocumentsLoaded && !countDocuments" class="empty">No documents</div>

  <div class="wrapper-view">
 <!-- @click="clickWrapper" -->
    <div
      :class="this.isCompareView ? (this.isFirstViewer ? 'first' : 'second') : ''"
      class="wrapper-documents"
      @click="clickWrapper"
      @scroll="handleScroll"
    >
      <div
        v-for="(doc, indexDoc, key) in storeDocument.documents"
        class="wrapper-document"
        :key="doc"
        :id="`doc_${doc.id}`"
        :class="{
          'wrapped-view-documents': isWrappedView,
          'edit-mode': isEditMode,
          active: isCompareView ? selectedDocIds.includes(doc.id) : storeDocument.selectedDocIds.includes(doc.id),
          edit: editedDocIds.includes(doc.id)
        }"
      >
        <div
          v-if="isLastPageLoaded"
          class="document-title"
          v-click-outside="($event) => clickOutSideDocName($event, doc.id)"
          @click="!editedPageIds.length && !editedDocIds.includes(doc.id) && clickDocument($event, doc.id)"
        >
          <span class="document-number">{{ storeDocument.documentIds.findIndex(id => id === doc.id) + 1 }}. </span>
          <span class="document-name">{{ docName(doc.name) }}</span>
        </div>

        <div :class="{ 'wrapped-view-pages': isEditMode || isWrappedView }" class="wrapper-pages">
          <div class="wrapper-page" v-for="page in doc.url.pages" :key="page">
             <!-- @clickOutSidePage="clickOutSidePage" -->
            <PageView
              ref="refPage"
              class="page"
              :class="`num_page_${page}`"
              :docId="doc.id"
              :docPdf="doc.url.pdf"
              :isEditMode="isEditMode"
              :annotations="annotations"
              :numberPage="page"
              :scale="scale / 100"
              :selectedPageIds="isEditMode ? storeEditActions.selectedPageIds : selectedPageIds"
              :editedPageIds="editedPageIds"
              :isLatestPageDoc="isLatestPageInDoc(page, doc.url.pages)"
              :isLatestPageAllDocs="isLatestPageInDoc(page, doc.url.pages) && indexDoc + 1 === countDocuments"
              :isLastPageAllDocsLoaded="isLastPageLoaded"

              @clickPage="clickPage"
              @docsLoaded="docsLoaded"
              @addPageId="addPageId"
              @addFirstPageId="addFirstPageId($event, indexDoc)"
            />
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

.edit-mode,
.wrapped-view-documents {
  display: flex;
  justify-content: center;
  flex-direction: column;
  padding: 0 90px;
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
}

.active > .document-title ~ .wrapper-pages {
  border-bottom: 3px solid #e53935;
}

.wrapped-view-pages {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
}

.wrapper-page {
  display: flex;
  align-items: center;
  flex-direction: column;
  width: fit-content;
  margin: 0 auto;
}

.wrapped-view-pages .wrapper-page {
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

.rotate_90 {
  transform: rotate(90deg);
}

.rotate_180 {
  transform: rotate(180deg);
}

.rotate_270 {
  transform: rotate(270deg);
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
