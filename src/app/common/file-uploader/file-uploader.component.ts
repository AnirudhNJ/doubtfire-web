import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders, HttpEventType } from '@angular/common/http';

@Component({
  selector: 'file-uploader',
  templateUrl: './file-uploader.component.html',
  styleUrls: ['./file-uploader.component.scss'],
})
export class FileUploaderComponent implements OnInit {
  @Input() files: any = {};
  @Input() url: string = '';
  @Input() method: string = 'POST';
  @Input() payload: any = {};
  @Input() onBeforeUpload?: () => void;
  @Input() onSuccess?: (response: any) => void;
  @Input() onFailure?: (response: any) => void;
  @Input() onComplete?: () => void;
  @Input() isUploading: boolean = false;
  @Input() isReady: boolean = false;
  @Input() showName: boolean = true;
  @Input() asButton: boolean = false;
  @Input() filesSelected: any = [];
  @Input() singleDropZone: boolean = false;
  @Input() showUploadButton: boolean = true;
  @Input() resetAfterUpload: boolean = true;

  @Output() initiateUpload = new EventEmitter<void>();

  uploadingInfo: any = null;
  shownUploadZones: any[] = [];
  uploadZones: any[] = [];
  dropSupported: boolean = true;

  showUploader: boolean = true;
  selectedFiles: any[] = [];

  ACCEPTED_TYPES = {
    document: { extensions: ['pdf', 'ps'], icon: 'fa-file-pdf-o', name: 'PDF' },
    csv: { extensions: ['csv', 'xls', 'xlsx'], icon: 'fa-file-excel-o', name: 'CSV' },
    image: { extensions: ['png', 'bmp', 'tiff', 'jpeg', 'jpg', 'gif'], icon: 'fa-file-image-o', name: 'image' },
    zip: { extensions: ['zip', 'tar.gz', 'tar'], icon: 'fa-file-zip-o', name: 'archive' }
  };

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
  console.log("djbfekjrbf",this.files)  
  if (!this.files || typeof this.files !== 'object') {
      this.files = {};
    }
    this.createUploadZones(this.files);
    if (!this.onClickFailureCancel) {
      this.onClickFailureCancel = this.resetUploader.bind(this);
    }
  }
  onFileDrop(event: DragEvent): void {
    console.log("efw",event)
    event.preventDefault();
    event.stopPropagation();
    const files = Array.from(event.dataTransfer!.files);
    this.handleFiles(files);
  }
  handleFiles(files: File[]) {
    throw new Error('Method not implemented.');
  }

  createUploadZones(files: any): void {
    this.uploadZones = Object.keys(files).map((uploadName) => {
      const uploadData = files[uploadName];
      const type = uploadData.type;
      const typeData = this.ACCEPTED_TYPES[type];

      if (!typeData) {
        throw new Error(`Invalid type provided to File Uploader: ${type}`);
      }

      return {
        name: uploadName,
        model: null,
        accept: typeData.extensions.map((ext) => `.${ext}`).join(','),
        rejects: null,
        display: {
          name: uploadData.name,
          icon: typeData.icon,
          type: typeData.name,
          error: false
        }
      };
    });

    this.shownUploadZones = this.singleDropZone ? [this.uploadZones[0]] : this.uploadZones;
  }

  resetUploader(): void {
    this.uploadingInfo = null;
    this.isUploading = false;
    this.showUploader = !this.asButton;

    for (let upload of this.uploadZones) {
      this.clearEnqueuedUpload(upload);
    }
  }

  clearEnqueuedUpload(upload: any): void {
    upload.model = null;
    this.refreshShownUploadZones();
  }

  refreshShownUploadZones(): void {
    if (this.singleDropZone) {
      const firstEmptyZone = this.uploadZones.find((zone) => !zone.model || zone.model.length === 0);
      this.shownUploadZones = firstEmptyZone ? [firstEmptyZone] : [];
    }
  }

  modelChanged(newFiles: any[], upload: any): void {
    if (newFiles.length > 0 || upload.rejects?.length > 0) {
      const gotError = this.checkForError(upload);
      if (!gotError) {
        this.filesSelected = this.uploadZones.map((zone) => zone.model).flat();
        if (this.singleDropZone) {
          this.selectedFiles = this.uploadZones;
          this.refreshShownUploadZones();
        }
      }
    }
  }

  checkForError(upload: any): boolean {
    console.log("a1")
    if (upload.rejects?.length > 0) {
      upload.display.error = true;
      setTimeout(() => (upload.display.error = false), 4000);
      return true;
    }
    return false;
  }

  readyToUpload(): boolean {
    // console.log("hjefbgejhr")
    this.isReady = this.uploadZones.every((upload) =>{
      console.log("dcds",upload)
       !!upload.model});
    return true;
  }

  initiateFileUpload(): void {
    console.log("dfb",this.uploadZones, this.readyToUpload)
    if (!this.readyToUpload()) {
      return;
    }

    this.onBeforeUpload?.();

    const formData = new FormData();
    for (let zone of this.uploadZones) {
      formData.append(zone.name, zone.model[0]);
    }

    for (let key in this.payload) {
      let value = this.payload[key];
      if (typeof value === 'object') {
        value = JSON.stringify(value);
      }
      formData.append(key, value);
    }

    this.uploadingInfo = { progress: 5, success: null, error: null, complete: false };
    this.isUploading = true;

    const headers = new HttpHeaders({ 'Auth-Token': 'auth-token', 'Username': 'username' });

    this.http.post(this.url, formData, { headers, observe: 'events', reportProgress: true })
      .subscribe({
        next: (event) => {
          if (event.type === HttpEventType.UploadProgress) {
            const progress = Math.round(100 * event.loaded / (event.total || 1));
            this.uploadingInfo.progress = progress;
          } else if (event.type === HttpEventType.Response) {
            this.uploadingInfo.complete = true;
            this.uploadingInfo.success = true;
            this.onSuccess?.(event.body);
            setTimeout(() => {
              this.onComplete?.();
              if (this.resetAfterUpload) {
                this.resetUploader();
              }
            }, 2500);
          }
        },
        error: (error) => {
          this.uploadingInfo.complete = true;
          this.uploadingInfo.success = false;
          this.uploadingInfo.error = error.error || 'Unknown error';
          this.onFailure?.(error);
        }
      });
  }

  onClickFailureCancel?: () => void;
}
