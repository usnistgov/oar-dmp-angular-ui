import { NgModule, APP_INITIALIZER } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { NistResourcesService } from './nist-resources.service';

export function configFetcherFactory(configSvc: NistResourcesService) {
    return () => { 
        return configSvc.fetchNistResources().toPromise();
    };
}

@NgModule({
    providers: [
        HttpClient,
        NistResourcesService,
        { provide: APP_INITIALIZER, useFactory: configFetcherFactory,
          deps: [ NistResourcesService ], multi: true }
    ]
})
export class NistResourcesModule { }

export { NistResourcesService }
