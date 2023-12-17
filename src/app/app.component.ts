import { Component, OnInit, Renderer2, ViewChild } from '@angular/core';
import { AuthenticationService } from './services/authentication.service';
import { TranslateService } from '@ngx-translate/core';
import { LanguageService } from './services/language.service';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { MatSidenav } from '@angular/material/sidenav';
import { NavigationEnd, Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { delay, filter } from 'rxjs';
import { LoginResponse, OidcSecurityService } from 'angular-auth-oidc-client';

@UntilDestroy()
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent  implements OnInit{
  title = 'innkt';  
  isContainerLayout = false;
  hamburgerOpen  = false;
  isLoggedIn: boolean = true;
  isSmallScreen = false;
  isRtlLayout : boolean = false;

  @ViewChild(MatSidenav)
  sidenav!: MatSidenav;


  
  constructor(
    private authService : AuthenticationService, 
    private translateService: TranslateService, 
    private languageService: LanguageService,
    private renderer: Renderer2,
    private breakpointObserver: BreakpointObserver,
    private router:Router,
    private oidcSecurityService: OidcSecurityService
    ){
    this.translateService.setDefaultLang('en-EN'); // Set the default language
    
    this.languageService.setLanguage('en-EN');
    
    
  }

  ngOnInit(): void {
    this.breakpointObserver
    .observe([Breakpoints.XSmall, Breakpoints.Small])
    .subscribe((result) => {
      this.isSmallScreen = result.matches;
      //this.isSmallScreen = false;
    });

    this.oidcSecurityService
    .checkAuth()
    .subscribe((loginResponse: LoginResponse) => {
      const { isAuthenticated, userData, accessToken, idToken, configId } =
        loginResponse;
        console.log('app authenticated', isAuthenticated);
        console.log(`Current access token is '${accessToken}'`);
        console.log(`Current access token is '${idToken}'`);
        console.log(`Current access token is '${userData}'`);
        console.log(`Current access token is '${configId}'`);
      /*...*/
    });
    //subscribe to identity server
    this.oidcSecurityService
    .checkAuth()
    .subscribe(({ isAuthenticated, userData, accessToken }) => {
      console.log('app authenticated', isAuthenticated);
      console.log(`Current access token is '${accessToken}'`);
    });
    console.log('here!!');
    // check if the token exist in session storage
    //this.isLoggedIn = !!this.authService.getToken();
    this.isLoggedIn = false;

    this.languageService.selectedLanguage$.subscribe((language) => {
      this.isRtlLayout = this.languageService.isRtlLanguage();
      //document.documentElement.dir = isRtl ? 'rtl' : 'ltr';
      // Load RTL styles if needed      
      this.loadRtlStyles();      
    });

    this.authService.initAuth();
  }

  //ngAfterViewInit() {
  //  this.breakpointObserver
  //    .observe(['(max-width: 768px)'])
  //    .pipe(delay(1), untilDestroyed(this))
  //    .subscribe((res) => {
  //      if (res.matches) {
  //        this.sidenav.mode = 'over';
  //        this.sidenav.close();
  //      } else {
  //        this.sidenav.mode = 'side';
  //        this.sidenav.open();
  //      }
  //    });
//
//    this.router.events
//      .pipe(
//        untilDestroyed(this),
//        filter((e) => e instanceof NavigationEnd)
//      )
//      .subscribe(() => {
//        if (this.sidenav.mode === 'over') {
//          this.sidenav.close();
//        }
//      });
//  }


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

  toggleMenu() {
    this.hamburgerOpen  = !this.hamburgerOpen;
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
