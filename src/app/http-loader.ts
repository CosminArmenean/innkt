import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { TranslateLoader } from '@ngx-translate/core';

@Injectable({
    providedIn: 'root'
  })
export class HttpLoader {

    constructor(private http: HttpClient){}

    getTranslation(lang:string){
        return this.http.get(`../assets/i18n/${lang}.json`);
    }
}
