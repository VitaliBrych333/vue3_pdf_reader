
export class PageAction {
  public toDocumentId: string;
  public toPagePosition: number;
  public fromDocumentId: string;
  public fromPagePosition: number;
  public page: any; // store removed page

  constructor(
    toDocumentId: string,
    toPagePosition: number,
    fromDocumentId: string,
    fromPagePosition: number,
    page: any = null
  ) {
    this.toDocumentId = toDocumentId;
    this.toPagePosition = toPagePosition;
    this.fromDocumentId = fromDocumentId;
    this.fromPagePosition = fromPagePosition;
    this.page = page;
  }
}
