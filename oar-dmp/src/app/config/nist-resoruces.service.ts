import { HttpClient, HttpHeaders } from "@angular/common/http";
import { Injectable } from '@angular/core';
import { Observable, Subject, throwError } from "rxjs";
import { catchError, tap } from "rxjs/operators";

import { environment } from "../../environments/environment";
import { NIST_Resources } from './nist-resources.model';

@Injectable({
  providedIn: 'root'
})
export class NistResorucesService {

  nistResources = environment.NIST_Resources;
  resources: NIST_Resources | null = null;

  constructor(private http: HttpClient) { }

  loadResources(data: any): void {
    this.resources = data as NIST_Resources;
    if (environment.debug) console.log("NIST resources loaded");
  }

  public fetchNistResources(nistResources: string | null = null): Observable<NIST_Resources>{
    const url = nistResources ?? this.nistResources;
    return this.http.get<NIST_Resources>(url, { responseType: 'json' }).pipe(
        catchError(this.handleError),
        tap(rsrc => this.loadResources(rsrc))
    );

  }

  public getNistResources(): NIST_Resources {
    return this.resources ?? { RESOURCES: []};
  }

  /**
     * Handle the HTTP errors.
     * @param error The error object.
     * @returns An observable containing the error message.
     */
  private handleError(error: any) {
    let errorMessage = '';
    if (error.error instanceof ErrorEvent) {
        // Get client-side error
        errorMessage = error.error.message;
    } else {
        // Get server-side error
        errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;
    }
    window.alert(errorMessage);
    return throwError(() => {
        return errorMessage;
    });
  }

}
