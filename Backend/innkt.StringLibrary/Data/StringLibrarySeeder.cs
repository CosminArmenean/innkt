using innkt.StringLibrary.Models;
using innkt.StringLibrary.Services;

namespace innkt.StringLibrary.Data;

/// <summary>
/// Seeds the string library with initial localized strings
/// </summary>
public static class StringLibrarySeeder
{
    /// <summary>
    /// Seeds the localization service with initial strings
    /// </summary>
    /// <param name="localizationService">The localization service to seed</param>
    public static async Task SeedAsync(ILocalizationService localizationService)
    {
        // Seed English strings
        await SeedEnglishStringsAsync(localizationService);
        
        // Seed Spanish strings
        await SeedSpanishStringsAsync(localizationService);
        
        // Seed French strings
        await SeedFrenchStringsAsync(localizationService);
        
        // Seed German strings
        await SeedGermanStringsAsync(localizationService);
        
        // Seed Romanian strings
        await SeedRomanianStringsAsync(localizationService);
    }

    private static async Task SeedEnglishStringsAsync(ILocalizationService localizationService)
    {
        var strings = new Dictionary<string, (string value, string? description, string? category)>
        {
            // Authentication
            ["auth.login.success"] = ("Login successful", "Message shown when user successfully logs in", "auth"),
            ["auth.login.failed"] = ("Login failed", "Message shown when user login fails", "auth"),
            ["auth.login.invalid_credentials"] = ("Invalid username or password", "Message shown for invalid credentials", "auth"),
            ["auth.login.account_locked"] = ("Account is locked", "Message shown when account is locked", "auth"),
            ["auth.login.account_inactive"] = ("Account is inactive", "Message shown when account is inactive", "auth"),
            ["auth.logout.success"] = ("Logout successful", "Message shown when user successfully logs out", "auth"),
            ["auth.registration.success"] = ("Registration successful", "Message shown when user registration succeeds", "auth"),
            ["auth.registration.failed"] = ("Registration failed", "Message shown when user registration fails", "auth"),
            ["auth.registration.email_exists"] = ("Email already exists", "Message shown when email is already registered", "auth"),
            ["auth.registration.username_exists"] = ("Username already exists", "Message shown when username is already taken", "auth"),
            
            // MFA
            ["mfa.setup.required"] = ("Multi-factor authentication setup required", "Message shown when MFA setup is needed", "mfa"),
            ["mfa.setup.success"] = ("Multi-factor authentication setup successful", "Message shown when MFA setup succeeds", "mfa"),
            ["mfa.setup.failed"] = ("Multi-factor authentication setup failed", "Message shown when MFA setup fails", "mfa"),
            ["mfa.enable.success"] = ("Multi-factor authentication enabled", "Message shown when MFA is enabled", "mfa"),
            ["mfa.enable.failed"] = ("Failed to enable multi-factor authentication", "Message shown when MFA enable fails", "mfa"),
            ["mfa.verification.required"] = ("MFA verification required", "Message shown when MFA verification is needed", "mfa"),
            ["mfa.verification.success"] = ("MFA verification successful", "Message shown when MFA verification succeeds", "mfa"),
            ["mfa.verification.failed"] = ("MFA verification failed", "Message shown when MFA verification fails", "mfa"),
            
            // Verification
            ["verification.credit_card.required"] = ("Credit card verification required", "Message shown when credit card verification is needed", "verification"),
            ["verification.credit_card.success"] = ("Credit card verification successful", "Message shown when credit card verification succeeds", "verification"),
            ["verification.driver_license.required"] = ("Driver license verification required", "Message shown when driver license verification is needed", "verification"),
            ["verification.driver_license.success"] = ("Driver license verification successful", "Message shown when driver license verification succeeds", "verification"),
            
            // Kid Accounts
            ["kid_account.creation.success"] = ("Kid account created successfully", "Message shown when kid account creation succeeds", "kid_account"),
            ["kid_account.pairing.success"] = ("Kid account paired successfully", "Message shown when kid account pairing succeeds", "kid_account"),
            ["kid_account.independence.activated"] = ("Kid account independence activated", "Message shown when kid account becomes independent", "kid_account"),
            
            // General
            ["general.success"] = ("Operation completed successfully", "Generic success message", "general"),
            ["general.error"] = ("An error occurred", "Generic error message", "general"),
            ["general.warning"] = ("Warning", "Generic warning message", "general"),
            ["general.info"] = ("Information", "Generic information message", "general"),
            
            // Validation
            ["validation.required"] = ("This field is required", "Validation message for required fields", "validation"),
            ["validation.invalid_email"] = ("Invalid email format", "Validation message for invalid email", "validation"),
            ["validation.too_long"] = ("Value is too long", "Validation message for values exceeding length limit", "validation"),
            ["validation.too_short"] = ("Value is too short", "Validation message for values below length limit", "validation")
        };

        foreach (var (key, (value, description, category)) in strings)
        {
            await localizationService.SetStringAsync(key, "en", value, description, category);
        }
    }

    private static async Task SeedSpanishStringsAsync(ILocalizationService localizationService)
    {
        var strings = new Dictionary<string, (string value, string? description, string? category)>
        {
            // Authentication
            ["auth.login.success"] = ("Inicio de sesión exitoso", "Mensaje mostrado cuando el usuario inicia sesión exitosamente", "auth"),
            ["auth.login.failed"] = ("Inicio de sesión fallido", "Mensaje mostrado cuando falla el inicio de sesión", "auth"),
            ["auth.login.invalid_credentials"] = ("Usuario o contraseña inválidos", "Mensaje mostrado para credenciales inválidas", "auth"),
            ["auth.logout.success"] = ("Cierre de sesión exitoso", "Mensaje mostrado cuando el usuario cierra sesión exitosamente", "auth"),
            ["auth.registration.success"] = ("Registro exitoso", "Mensaje mostrado cuando el registro del usuario es exitoso", "auth"),
            
            // MFA
            ["mfa.setup.required"] = ("Configuración de autenticación de dos factores requerida", "Mensaje mostrado cuando se necesita configuración MFA", "mfa"),
            ["mfa.setup.success"] = ("Configuración de autenticación de dos factores exitosa", "Mensaje mostrado cuando la configuración MFA es exitosa", "mfa"),
            
            // General
            ["general.success"] = ("Operación completada exitosamente", "Mensaje genérico de éxito", "general"),
            ["general.error"] = ("Ocurrió un error", "Mensaje genérico de error", "general"),
            
            // Validation
            ["validation.required"] = ("Este campo es obligatorio", "Mensaje de validación para campos obligatorios", "validation"),
            ["validation.invalid_email"] = ("Formato de email inválido", "Mensaje de validación para email inválido", "validation")
        };

        foreach (var (key, (value, description, category)) in strings)
        {
            await localizationService.SetStringAsync(key, "es", value, description, category);
        }
    }

    private static async Task SeedFrenchStringsAsync(ILocalizationService localizationService)
    {
        var strings = new Dictionary<string, (string value, string? description, string? category)>
        {
            // Authentication
            ["auth.login.success"] = ("Connexion réussie", "Message affiché lorsque l'utilisateur se connecte avec succès", "auth"),
            ["auth.login.failed"] = ("Échec de la connexion", "Message affiché lorsque la connexion échoue", "auth"),
            ["auth.login.invalid_credentials"] = ("Nom d'utilisateur ou mot de passe invalide", "Message affiché pour des identifiants invalides", "auth"),
            
            // General
            ["general.success"] = ("Opération terminée avec succès", "Message de succès générique", "general"),
            ["general.error"] = ("Une erreur s'est produite", "Message d'erreur générique", "general"),
            
            // Validation
            ["validation.required"] = ("Ce champ est obligatoire", "Message de validation pour les champs obligatoires", "validation"),
            ["validation.invalid_email"] = ("Format d'email invalide", "Message de validation pour email invalide", "validation")
        };

        foreach (var (key, (value, description, category)) in strings)
        {
            await localizationService.SetStringAsync(key, "fr", value, description, category);
        }
    }

    private static async Task SeedGermanStringsAsync(ILocalizationService localizationService)
    {
        var strings = new Dictionary<string, (string value, string? description, string? category)>
        {
            // Authentication
            ["auth.login.success"] = ("Anmeldung erfolgreich", "Nachricht angezeigt, wenn sich der Benutzer erfolgreich anmeldet", "auth"),
            ["auth.login.failed"] = ("Anmeldung fehlgeschlagen", "Nachricht angezeigt, wenn die Anmeldung fehlschlägt", "auth"),
            ["auth.login.invalid_credentials"] = ("Ungültiger Benutzername oder Passwort", "Nachricht angezeigt für ungültige Anmeldedaten", "auth"),
            
            // General
            ["general.success"] = ("Vorgang erfolgreich abgeschlossen", "Generische Erfolgsnachricht", "general"),
            ["general.error"] = ("Ein Fehler ist aufgetreten", "Generische Fehlernachricht", "general"),
            
            // Validation
            ["validation.required"] = ("Dieses Feld ist erforderlich", "Validierungsnachricht für erforderliche Felder", "validation"),
            ["validation.invalid_email"] = ("Ungültiges E-Mail-Format", "Validierungsnachricht für ungültige E-Mail", "validation")
        };

        foreach (var (key, (value, description, category)) in strings)
        {
            await localizationService.SetStringAsync(key, "de", value, description, category);
        }
    }

    private static async Task SeedRomanianStringsAsync(ILocalizationService localizationService)
    {
        var strings = new Dictionary<string, (string value, string? description, string? category)>
        {
            // Authentication
            ["auth.login.success"] = ("Autentificare reușită", "Mesaj afișat când utilizatorul se autentifică cu succes", "auth"),
            ["auth.login.failed"] = ("Autentificare eșuată", "Mesaj afișat când autentificarea eșuează", "auth"),
            ["auth.login.invalid_credentials"] = ("Nume de utilizator sau parolă invalidă", "Mesaj afișat pentru credențiale invalide", "auth"),
            
            // General
            ["general.success"] = ("Operațiunea a fost finalizată cu succes", "Mesaj generic de succes", "general"),
            ["general.error"] = ("A apărut o eroare", "Mesaj generic de eroare", "general"),
            
            // Validation
            ["validation.required"] = ("Acest câmp este obligatoriu", "Mesaj de validare pentru câmpurile obligatorii", "validation"),
            ["validation.invalid_email"] = ("Format de email invalid", "Mesaj de validare pentru email invalid", "validation")
        };

        foreach (var (key, (value, description, category)) in strings)
        {
            await localizationService.SetStringAsync(key, "ro", value, description, category);
        }
    }
}




