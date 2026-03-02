import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'toArray', standalone: true })
export class ToArrayPipe implements PipeTransform {
  transform(fileList: FileList): File[] {
    return fileList ? Array.from(fileList) : [];
  }
}

