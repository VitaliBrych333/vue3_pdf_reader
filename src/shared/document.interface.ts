import * as PDFJS from 'pdfjs-dist'

export interface IFileDocument extends IDocument {
  // userId: string;
  // info: string;
  file: string;
}

export interface IDocument {
  id: string;
  name: string;
  info: string;
  pages: IPage[];
}

export interface IPage {
  pageId: string;
  numPage: number;
  rotate: number;
  originalDocumentId: string;
  originalNumPage: number;
  url: PDFJS.PDFDocumentLoadingTask;
}

export interface IDocumentsStack {
  documents: IDocument[];
  editActions: IEditAction[];
  index: number;
}

// deleteDocument?: string;
// deletePage?: { id: string, page: IPage };
// newDocument?: { doc: IDocument, positionIndex: number };
// newPage?: { id: string, page: IPage, positionIndex: number };
// rename?: { id: string, name: string };

export interface IDocumentId {
  id: string;
}

export interface IPageDetails extends IDocumentId {
  page: IPage;
}

export interface ICreateDocument {
  doc: IDocument;
  positionIndex: number;
}

export interface ICreatePage extends IPageDetails {
  positionIndex: number;
}

export interface IRename extends IDocumentId {
  name: string;
}

export interface IEditAction {
  type: string;
  value: IDocumentId | IPageDetails | ICreateDocument | ICreatePage | IRename
  // deleteDocument?: string;
  // deletePage?: { id: string, page: IPage };
  // newDocument?: { doc: IDocument, positionIndex: number };
  // newPage?: { id: string, page: IPage, positionIndex: number };
  // rename?: { id: string, name: string };
}

// export interface IEditActionsStack {
//   editActions: IEditAction[];
//   index: number;
// }

export interface IReqSaveDocuments {
  userId: string;
  rotate: IPageDetails[];
  editActions?: IEditAction[];
  newDocuments?: IDocument[];
}




