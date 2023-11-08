import { LogLevel, OpenIdConfigLoader } from "angular-auth-oidc-client";
import { config } from "process";
import { environment } from "src/environments/environment";

export const authConfig = {
    authority: environment.identityApiUrl,
    redirectUrl: window.location.origin,
    postLogoutRedirectUri: window.location.origin,
    clientId: 'm2m.client',
    scope: 'openid innkt.read',
    responseType: 'code',
    silentRenew: true,
    useRefreshToken: true,
    logLevel: LogLevel.Debug,
  };