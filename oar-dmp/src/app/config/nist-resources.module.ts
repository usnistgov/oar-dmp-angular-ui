import { NgModule, APP_INITIALIZER } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { NistResorucesService } from './nist-resoruces.service';


@NgModule({
    providers: [
        HttpClient,
        NistResorucesService
    ]
})
export class NistResorucesModule { }

export { NistResorucesService }
