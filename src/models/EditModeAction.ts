import { PageAction } from './PageAction';
import { DocumentAction } from './DocumentAction';
// import { RotatePageAction } from './RotatePageAction';

export class SortModeAction {
  public createdDocument: DocumentAction;
  public updatedDocument: DocumentAction;
  public updatedDocuments: DocumentAction[];
  public removedDocuments: DocumentAction[];
  public changedPages: PageAction[];
  // public rotatePages: RotatePageAction;
  constructor() {}
}
