export interface Document {
  id: number;
  userId: string;
  name: string;
  file: string;
  info: string;
}

export interface DocumentPdf {
  id: string;
  name: string;
  url: object
}
