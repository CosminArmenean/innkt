// core.module.ts

import { NgModule } from '@angular/core';
import { TranslateLoader, TranslateModule, TranslatePipe, TranslateService } from '@ngx-translate/core';
import { LanguageService } from './services/language.service';
import { HttpLoader } from './http-loader';

@NgModule({
   
    imports: [TranslateModule.forRoot({
        loader: {
          provide: TranslateLoader,
          useClass: HttpLoader
        }
      })],
    providers: [LanguageService, TranslateService],
  })
  export class CoreModule {}