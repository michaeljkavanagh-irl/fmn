import { HttpInterceptor, HttpRequest, HttpHandler, HttpErrorResponse } from '@angular/common/http';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material';
import { ErrorComponent } from './error/error.component';
import { Router } from '@angular/router';
import { MapService } from './map/map.service';

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {


  constructor(private dialog: MatDialog, private mapService: MapService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler) {
    return next.handle(req).pipe(
      catchError((error: HttpErrorResponse) => {
        console.log(error);
        let errorMsg = 'An unknown error occurred!';
        let errorMsg500 = 'Oops, something went wrong in the background. Its not you, its us. Please bear with us as we are constatnly making improvements to the application';
        

        if (error.error.message) {
          errorMsg = error.error.message;
       }
        if (error.message) {
          errorMsg = error.message;
       }
        this.dialog.open(ErrorComponent, {data: {message: errorMsg}});
        this.mapService.killSpinners(true);
        return throwError(error);
      })
    );
  }
}
