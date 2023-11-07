import { NgModule, APP_INITIALIZER } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { NistResorucesService } from './nist-resoruces.service';

export function configFetcherFactory(configSvc: NistResorucesService) {
    return () => { 
        return configSvc.fetchNistResources().toPromise();
    };
}

@NgModule({
    providers: [
        HttpClient,
        NistResorucesService,
        { provide: APP_INITIALIZER, useFactory: configFetcherFactory,
          deps: [ NistResorucesService ], multi: true }
    ]
})
export class NistResorucesModule { }

export { NistResorucesService }
