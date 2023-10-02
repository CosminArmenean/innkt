import { Component, Renderer2 } from '@angular/core';
import { AuthenticationService } from './services/authentication.service';
import { TranslateService } from '@ngx-translate/core';
import { LanguageService } from './services/language.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'innkt';  
  isLoggedIn!: boolean;
  isRtlLayout : boolean = false;

  
  constructor(
    private authService : AuthenticationService, 
    private translateService: TranslateService, 
    private languageService: LanguageService,
    private renderer: Renderer2
    ){
    this.translateService.setDefaultLang('en-EN'); // Set the default language
    
    this.languageService.setLanguage('ro-RO');
    
    
  }

  ngOnInit(): void {
    // check if the token exist in session storage
    this.isLoggedIn = !!this.authService.getToken();

    this.languageService.selectedLanguage$.subscribe((language) => {
      this.isRtlLayout = this.languageService.isRtlLanguage();
      //document.documentElement.dir = isRtl ? 'rtl' : 'ltr';
      // Load RTL styles if needed      
      this.loadRtlStyles();      
    });
  }
  private loadRtlStyles() {
    if (this.isRtlLayout) {
      // Create a link element for the RTL styles
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.type = 'text/scss';
      link.href = '../styles/rtl-styles.scss'; // Adjust the path

      // Append the link element to the document's head
      this.renderer.appendChild(document.head, link);
      const dir = this.isRtlLayout ? 'rtl' : 'ltr';
      this.renderer.setAttribute(document.body, 'dir', dir);
      console.log('style rtl applied!');
    }
  }
  //get user Email Method
  getUserName() {
    return this.authService.getUser();
  }
  //Method to logout
  signOut() {
    this.authService.signOut();
  }
}
