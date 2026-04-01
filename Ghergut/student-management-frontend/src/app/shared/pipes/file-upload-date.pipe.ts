import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'fileUploadDate' })
export class FileUploadDatePipe implements PipeTransform {
  transform(filename: string): string {
    // Extrage data și ora din nume: _YYYYMMDD_HHMMSS
    const match = filename.match(/_(\d{8})_(\d{6})\.[^.]+$/);
    if (match) {
      const date = match[1];
      const time = match[2];
      return `${date.slice(6,8)}/${date.slice(4,6)}/${date.slice(0,4)} ${time.slice(0,2)}:${time.slice(2,4)}`;
    }
    return '';
  }
}

