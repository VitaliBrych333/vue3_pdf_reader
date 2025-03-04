import { reactive } from 'vue'

export const storeEditActions = reactive({
  cut: [],
  delete: [],
  recycle: [],
  rename: [],
  split: [],
  insertPages: [],

  selectedPageIds: [] as string[],

  cutPageIds: [] as string[],
  copyPageIds: [] as string[],

  cutDocIds: [] as string[],
  copyDocIds: [] as string[],

  resetEditActions() {
    this.cut = []
    this.delete = []
    this.recycle = []
    this.rename = []
    this.split = []
    this.insertPages = []
  },

  addSelectedPageId(pageId: string, multi = false) {
    this.selectedPageIds = multi ? [...this.selectedPageIds].filter(id => id !== pageId).concat(pageId) : [pageId]
  },

  clearSelectedPageIds() {
    this.selectedPageIds = []
  },

  addCutPageId(pageId: string) {
    this.cutPageIds = [...this.cutPageIds].concat(pageId)
  },

  clearCutPageIds() {
    this.cutPageIds = []
  },

  addCutDocId(docId: string) {
    this.cutDocIds = [...this.cutDocIds].concat(docId)
  },

  clearCutDocIds() {
    this.cutDocIds = []
  },

  addCopyPageId(pageId: string) {
    this.copyPageIds = [...this.copyPageIds].concat(pageId)
  },

  clearCopyPageIds() {
    this.copyPageIds = []
  },

  addCopyDocId(docId: string) {
    this.copyDocIds = [...this.copyDocIds].concat(docId)
  },

  clearCopyDocIds() {
    this.copyDocIds = []
  },
})
