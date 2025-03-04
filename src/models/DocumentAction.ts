export class DocumentAction {
  public document: any;
  public documentId: string;
  public position: number;
  // public originalProperties;
  // public updatedProperties;

  constructor(
    document = null,
    documentId: string = null,
    position: number = null,
    originalProperties = null,
    updatedProperties = null
  ) {
    this.document = document;
    this.documentId = documentId;
    this.position = position;
    // this.originalProperties = originalProperties;
    // this.updatedProperties = updatedProperties;
  }
}
