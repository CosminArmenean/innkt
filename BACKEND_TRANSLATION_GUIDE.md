# 🔧 Backend Translation Guide - What to Translate

## 🎯 **Purpose**

Backend microservices **only translate user-facing messages** sent through API responses. Internal logs, debug info, and technical details stay in English.

---

## ✅ **WHAT TO TRANSLATE**

### **1. Error Messages (Most Important)**

These appear when something goes wrong and users need to understand what happened:

```csharp
// ✅ YES - Translate these
return BadRequest(new { 
    error = _localizer["auth.invalid_credentials"].Value 
});
// Response: { "error": "Correo o contraseña inválidos" } (Spanish)

return NotFound(new { 
    error = _localizer["groups.not_found"].Value 
});
// Response: { "error": "Groupe non trouvé" } (French)

return Conflict(new { 
    error = _localizer["users.email_already_exists"].Value 
});
// Response: { "error": "E-Mail existiert bereits" } (German)
```

### **2. Success Messages**

When operations complete successfully:

```csharp
// ✅ YES - Translate these
return Ok(new { 
    message = _localizer["auth.login_success"].Value 
});
// Response: { "message": "Accesso riuscito" } (Italian)

return Ok(new { 
    message = _localizer["groups.member_added"].Value 
});
// Response: { "message": "Membro adicionado" } (Portuguese)
```

### **3. Validation Messages**

When user input doesn't meet requirements:

```csharp
// ✅ YES - Translate these
if (string.IsNullOrEmpty(email))
{
    return BadRequest(new { 
        error = _localizer["validation.email_required"].Value 
    });
}

if (password.Length < 8)
{
    return BadRequest(new { 
        error = _localizer["validation.password_too_short"].Value 
    });
}
```

### **4. Status Messages**

Operation status that users see:

```csharp
// ✅ YES - Translate these
return Ok(new { 
    status = _localizer["common.processing"].Value 
});

return Ok(new { 
    status = _localizer["common.completed"].Value 
});
```

---

## ❌ **WHAT NOT TO TRANSLATE**

### **1. Internal Logs**

```csharp
// ❌ NO - Keep in English
_logger.LogInformation("User {UserId} logged in successfully", userId);
_logger.LogError("Database connection failed: {Error}", ex.Message);
_logger.LogWarning("Cache miss for key {Key}", cacheKey);
```

### **2. Exception Messages (Technical)**

```csharp
// ❌ NO - Keep in English
throw new InvalidOperationException("Invalid state transition");
throw new ArgumentNullException(nameof(userId));
```

### **3. Debug Information**

```csharp
// ❌ NO - Keep in English
Console.WriteLine("DEBUG: Request processing started");
System.Diagnostics.Debug.WriteLine("Cache cleared");
```

### **4. Database Queries**

```csharp
// ❌ NO - Keep in English
var users = await _context.Users
    .Where(u => u.IsActive)
    .OrderBy(u => u.CreatedAt)
    .ToListAsync();
```

### **5. Technical Status Codes**

```csharp
// ❌ NO - HTTP status codes stay as-is
return StatusCode(500);
return NotFound();
return Unauthorized();
```

---

## 📋 **Translation Keys Structure**

### **Recommended Organization:**

```json
{
  "auth": {
    "login_success": "Login successful",
    "login_failed": "Login failed",
    "invalid_credentials": "Invalid email or password",
    "account_locked": "Account locked. Please contact support.",
    "password_reset_sent": "Password reset email sent"
  },
  "validation": {
    "email_required": "Email is required",
    "email_invalid": "Invalid email format",
    "password_required": "Password is required",
    "password_too_short": "Password must be at least 8 characters",
    "username_taken": "Username is already taken"
  },
  "groups": {
    "created": "Group created successfully",
    "updated": "Group updated successfully",
    "deleted": "Group deleted successfully",
    "not_found": "Group not found",
    "member_added": "Member added to group",
    "member_removed": "Member removed from group",
    "permission_denied": "You don't have permission to perform this action"
  },
  "common": {
    "processing": "Processing...",
    "completed": "Completed",
    "cancelled": "Cancelled",
    "unknown_error": "An unexpected error occurred"
  }
}
```

---

## 💡 **Best Practices**

### **1. Use Hierarchical Keys**
```csharp
// ✅ GOOD
_localizer["auth.login.invalid_credentials"]
_localizer["groups.members.add.success"]

// ❌ BAD
_localizer["loginError"]
_localizer["error1"]
```

### **2. Be Specific**
```csharp
// ✅ GOOD
_localizer["validation.email_format_invalid"]
_localizer["validation.email_already_registered"]

// ❌ BAD
_localizer["error.email"]
```

### **3. Context Matters**
```csharp
// ✅ GOOD - Different contexts, different keys
_localizer["auth.password_incorrect"]  // Login failed
_localizer["settings.password_updated"]  // Password change success

// ❌ BAD - Same generic message for different scenarios
_localizer["password_message"]
```

### **4. Include Helpful Details**
```csharp
// ✅ GOOD
return BadRequest(new { 
    error = _localizer["validation.password_requirements"].Value,
    details = "Password must contain: uppercase, lowercase, number, special character"
});

// ❌ BAD
return BadRequest(new { 
    error = "Invalid password"
});
```

---

## 🔍 **Example: Officer Service (Auth)**

### **Only These Messages Need Translation:**

```csharp
// AuthController.cs

[HttpPost("login")]
public async Task<IActionResult> Login([FromBody] LoginRequest request)
{
    try
    {
        // Validate input
        if (string.IsNullOrEmpty(request.Email))
        {
            return BadRequest(new { 
                error = _localizer["validation.email_required"].Value  // ✅ Translate
            });
        }

        // Attempt login
        var result = await _authService.LoginAsync(request.Email, request.Password);
        
        if (!result.Success)
        {
            return Unauthorized(new { 
                error = _localizer["auth.invalid_credentials"].Value  // ✅ Translate
            });
        }

        // Log success (internal)
        _logger.LogInformation("User {Email} logged in", request.Email);  // ❌ Don't translate

        return Ok(new { 
            message = _localizer["auth.login_success"].Value,  // ✅ Translate
            token = result.Token
        });
    }
    catch (Exception ex)
    {
        // Log error (internal)
        _logger.LogError(ex, "Login failed for {Email}", request.Email);  // ❌ Don't translate
        
        return StatusCode(500, new { 
            error = _localizer["common.server_error"].Value  // ✅ Translate
        });
    }
}
```

---

## 📊 **Translation Priority**

### **High Priority:**
1. Authentication errors (login, register, password reset)
2. Authorization errors (permission denied, access forbidden)
3. Validation errors (required fields, format errors)
4. CRUD operation messages (created, updated, deleted)

### **Medium Priority:**
5. Status messages (processing, completed, cancelled)
6. Confirmation messages (are you sure?, please confirm)
7. Warning messages (approaching limit, expiring soon)

### **Low Priority:**
8. Informational messages (tip: you can..., did you know...)
9. Help text (this feature allows you to...)
10. Suggestions (you might also like...)

---

## 🚀 **Quick Start Checklist**

For each microservice, add translations for:

- [ ] **Authentication**: Login, register, logout messages
- [ ] **Authorization**: Permission denied, access forbidden
- [ ] **Validation**: Required fields, format errors, length constraints
- [ ] **CRUD Operations**: Create, read, update, delete confirmations
- [ ] **Common Errors**: Server error, network error, not found
- [ ] **Success Messages**: Operation completed, changes saved

---

## 📝 **Example Translation File (Officer Service)**

```json
{
  "auth": {
    "login_success": "Login successful",
    "login_failed": "Login failed. Please try again.",
    "invalid_credentials": "Invalid email or password",
    "account_locked": "Your account has been locked. Contact support.",
    "account_not_verified": "Please verify your email address",
    "password_reset_sent": "Password reset instructions sent to your email",
    "password_updated": "Password updated successfully",
    "token_expired": "Your session has expired. Please login again.",
    "register_success": "Account created successfully",
    "register_failed": "Registration failed. Please try again.",
    "email_already_exists": "An account with this email already exists",
    "username_already_exists": "This username is already taken",
    "language_updated": "Language preference updated successfully",
    "language_update_failed": "Failed to update language preference"
  },
  "validation": {
    "email_required": "Email address is required",
    "email_invalid": "Please enter a valid email address",
    "password_required": "Password is required",
    "password_too_short": "Password must be at least 8 characters",
    "password_mismatch": "Passwords do not match",
    "username_required": "Username is required",
    "username_too_short": "Username must be at least 3 characters",
    "invalid_language": "Invalid language code"
  },
  "errors": {
    "server_error": "An unexpected server error occurred",
    "network_error": "Network connection error",
    "unauthorized": "You are not authorized to access this resource",
    "forbidden": "Access to this resource is forbidden",
    "not_found": "The requested resource was not found",
    "validation_failed": "Validation failed. Please check your input."
  },
  "common": {
    "success": "Operation completed successfully",
    "processing": "Processing your request...",
    "cancelled": "Operation cancelled",
    "saved": "Changes saved",
    "deleted": "Deleted successfully"
  }
}
```

---

## 🎯 **Summary**

**Only translate user-facing messages in API responses. Everything else stays in English.**

- ✅ **Error messages** → User sees them
- ✅ **Success messages** → User sees them
- ✅ **Validation messages** → User sees them
- ❌ **Log messages** → Only developers see them
- ❌ **Debug info** → Only developers see them
- ❌ **Technical details** → Stay in code

**Keep it simple and focused on the user experience!** 🌍

