import { AbstractControl } from '@angular/forms';
import { Observable, Observer, of } from 'rxjs';

export const mimeType = (control: AbstractControl): Promise<{[key: string]: any }> | Observable <{[key: string]: any}> => {

  if (typeof(control.value) === 'string') {
    return of(null);
  }
  const file = control.value as File;
  const fileReader = new FileReader();
  // tslint:disable-next-line: deprecation
  const frObs = Observable.create(
    (observer: Observer<{ [key: string]: any}>) => {
    fileReader.addEventListener('loadend', () => {
      const arr = new Uint8Array(fileReader.result as ArrayBuffer).subarray(0, 4);
      let header = '';
      let isValid = false;
      // tslint:disable-next-line: prefer-for-of
      for (let i = 0;  i < arr.length; i++) {
        header += arr[i].toString(16);
      }
      switch (header) {
        case '504B0304': // zip
          console.log('Found ZIP file - Good to go'); //	application/json //	text/csv
          isValid = true;
          break;
        case '255044462d': //.pdf
          console.log('Did you mean to upload a PDF???');
          isValid = true;
          break;
        case '89504E47': //.pdf
          console.log('Did you mean to upload a PNG???');
          isValid = true;
          break;
        default:
          console.log('Sorry this file type is not supported.');
          isValid = false; // Or you can use the blob.type as fallback
          break;
      }
      if (isValid) {
        observer.next(null);
      } else {
        observer.next({ invalidMimeType: true});
      }
      observer.complete();
    });
    fileReader.readAsArrayBuffer(file);
  });
  return frObs;
};
