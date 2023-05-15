import { NgModule, APP_INITIALIZER } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { ConfigurationService } from './config.service';


export function configFetcherFactory(configSvc: ConfigurationService) {
    return () => { 
        return configSvc.fetchConfig().toPromise();
    };
}

@NgModule({
    providers: [
        HttpClient,
        ConfigurationService,
        { provide: APP_INITIALIZER, useFactory: configFetcherFactory,
          deps: [ ConfigurationService ], multi: true }
    ]
})
export class ConfigModule { }

export { ConfigurationService }