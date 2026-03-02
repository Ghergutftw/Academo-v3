import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'fileOriginalName' })
export class FileOriginalNamePipe implements PipeTransform {
  transform(filename: string): string {
    // Extrage numele original (totul înainte de _YYYYMMDD_HHMMSS.ext)
    const match = filename.match(/^(.*?)(?:_\d{8}_\d{6})?\.[^.]+$/);
    if (match) {
      const ext = filename.split('.').pop();
      return match[1] + (ext ? '.' + ext : '');
    }
    return filename;
  }
}

