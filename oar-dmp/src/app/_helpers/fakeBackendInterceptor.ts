import { Injectable } from '@angular/core';
import { HttpClient, HttpRequest, HttpResponse, HttpHandler, HttpEvent, HttpInterceptor, HTTP_INTERCEPTORS, HttpErrorResponse } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { delay, mergeMap, materialize, dematerialize } from 'rxjs/operators';
// import { userInfo } from 'os';

@Injectable()
export class FakeBackendInterceptor implements HttpInterceptor {

  constructor(private http: HttpClient) { }

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // wrap in delayed observable to simulate server api call
    return of(null).pipe(mergeMap(() => {
      // authenticate
      if (request.url.indexOf('auth/_tokeninfo') > -1 && request.method === 'GET') {
        let body: any = {
            userDetails: {
                userId: 'xyz@nist.gov',
                userName: 'xyz',
                userLastName: 'anon',
                userEmail: 'anon@email.com'
            },
            token: 'fake-jwt-token'
        };
        console.log("logging in...");

        //Authorized
        return of(new HttpResponse({ status: 200, body }));
      }

      // return 401 not authorised if token is null or invalid
      // if (request.url.indexOf('auth/_perm/') > -1 && request.method === 'GET') {
      //     let body: ApiToken = {
      //         userId: '1234',
      //         token: 'fake-jwt-token'
      //     };
      //     console.log("logging in...")
      //     return Observable.throw(
      //         JSON.stringify({
      //             "status": 401,
      //             "Userid": "xyz@nist.gov",
      //             "message": "Unauthorizeduser: User token is empty or expired."
      //         })
      //     );
      // }

      // pass through any requests not handled above
      return next.handle(request);

  }))

  // call materialize and dematerialize to ensure delay even if an error is thrown (https://github.com/Reactive-Extensions/RxJS/issues/648)
  .pipe(materialize())
  .pipe(delay(500))
  .pipe(dematerialize());
  }
}

export let fakeBackendProvider = {
  // use fake backend in place of Http service for backend-less development
  provide: HTTP_INTERCEPTORS,
  useClass: FakeBackendInterceptor,
  multi: true
};