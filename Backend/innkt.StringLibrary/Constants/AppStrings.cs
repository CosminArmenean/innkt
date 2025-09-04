namespace innkt.StringLibrary.Constants;

/// <summary>
/// Contains all string constants used throughout the application
/// These keys will be used to retrieve localized strings from the database
/// </summary>
public static class AppStrings
{
    #region Authentication
    
    public static class Auth
    {
        public const string LoginSuccess = "auth.login.success";
        public const string LoginFailed = "auth.login.failed";
        public const string LogoutSuccess = "auth.logout.success";
        public const string RegistrationSuccess = "auth.registration.success";
        public const string RegistrationFailed = "auth.registration.failed";
        public const string PasswordResetSuccess = "auth.password_reset.success";
        public const string PasswordResetFailed = "auth.password_reset.failed";
        public const string EmailConfirmationRequired = "auth.email_confirmation.required";
        public const string EmailConfirmationSuccess = "auth.email_confirmation.success";
        public const string EmailConfirmationFailed = "auth.email_confirmation.failed";
        public const string UserNotAuthenticated = "auth.user_not_authenticated";
        public const string UserNotAuthorized = "auth.user_not_authorized";
        public const string InvalidCredentials = "auth.invalid_credentials";
        public const string AccountLocked = "auth.account.locked";
        public const string AccountDisabled = "auth.account.disabled";
        public const string SessionExpired = "auth.session.expired";
        public const string TokenInvalid = "auth.token.invalid";
        public const string TokenExpired = "auth.token.expired";
    }
    
    #endregion

    #region Multi-Factor Authentication
    
    public static class Mfa
    {
        public const string EnableSuccess = "mfa.enable.success";
        public const string EnableFailed = "mfa.enable.failed";
        public const string DisableSuccess = "mfa.disable.success";
        public const string DisableFailed = "mfa.disable.failed";
        public const string VerificationSuccess = "mfa.verification.success";
        public const string VerificationFailed = "mfa.verification.failed";
        public const string InvalidCode = "mfa.invalid_code";
        public const string CodeExpired = "mfa.code_expired";
        public const string SetupRequired = "mfa.setup.required";
        public const string SetupSuccess = "mfa.setup.success";
        public const string SetupFailed = "mfa.setup.failed";
        public const string BackupCodesGenerated = "mfa.backup_codes.generated";
        public const string BackupCodesUsed = "mfa.backup_codes.used";
        public const string BackupCodesRegenerated = "mfa.backup_codes.regenerated";
        public const string BackupCodeInvalid = "mfa.backup_code.invalid";
        public const string BackupCodeUsed = "mfa.backup_code.used";
    }
    
    #endregion

    #region User Verification
    
    public static class Verification
    {
        public const string CreditCardRequired = "verification.credit_card.required";
        public const string CreditCardInvalid = "verification.credit_card.invalid";
        public const string CreditCardSuccess = "verification.credit_card.success";
        public const string CreditCardFailed = "verification.credit_card.failed";
        public const string DriverLicenseRequired = "verification.driver_license.required";
        public const string DriverLicenseInvalid = "verification.driver_license.invalid";
        public const string DriverLicenseSuccess = "verification.driver_license.success";
        public const string DriverLicenseFailed = "verification.driver_license.failed";
        public const string VerificationPending = "verification.status.pending";
        public const string VerificationApproved = "verification.status.approved";
        public const string VerificationRejected = "verification.status.rejected";
        public const string VerificationInProgress = "verification.status.in_progress";
        public const string VerificationExpired = "verification.status.expired";
        public const string VerificationFailed = "verification.status.failed";
    }
    
    #endregion
    
    #region Kid Accounts
    
    public static class KidAccount
    {
        public const string CreationSuccess = "kid_account.creation.success";
        public const string CreationFailed = "kid_account.creation.failed";
        public const string PairingSuccess = "kid_account.pairing.success";
        public const string PairingFailed = "kid_account.pairing.failed";
        public const string PairingCodeInvalid = "kid_account.pairing.code_invalid";
        public const string PairingCodeExpired = "kid_account.pairing.code_expired";
        public const string IndependenceDateSet = "kid_account.independence.date_set";
        public const string IndependenceActivated = "kid_account.independence.activated";
        public const string IndependenceFailed = "kid_account.independence.failed";
        public const string FollowRequestSubmitted = "kid_account.follow.request_submitted";
        public const string FollowRequestApproved = "kid_account.follow.request_approved";
        public const string FollowRequestRejected = "kid_account.follow.request_rejected";
        public const string FollowRequestPending = "kid_account.follow.request_pending";
        public const string QrCodeGenerated = "kid_account.qr_code.generated";
        public const string QrCodeRegenerated = "kid_account.qr_code.regenerated";
        public const string DeactivationSuccess = "kid_account.deactivation.success";
        public const string DeactivationFailed = "kid_account.deactivation.failed";
        
        // Additional constants for the updated controller
        public const string StatusRetrievalFailed = "kid_account.status.retrieval_failed";
        public const string ParentAccountsRetrievalFailed = "kid_account.parent_accounts.retrieval_failed";
        public const string IndependenceDateSetSuccess = "kid_account.independence.date_set_success";
        public const string IndependenceDateSetFailed = "kid_account.independence.date_set_failed";
        public const string IndependenceSuccess = "kid_account.independence.success";
        public const string FollowRequestSentSuccess = "kid_account.follow.request_sent_success";
        public const string FollowRequestSentFailed = "kid_account.follow.request_sent_failed";
        public const string FollowRequestApprovedSuccess = "kid_account.follow.request_approved_success";
        public const string FollowRequestApprovedFailed = "kid_account.follow.request_approved_failed";
        public const string FollowRequestRejectedSuccess = "kid_account.follow.request_rejected_success";
        public const string FollowRequestRejectedFailed = "kid_account.follow.request_rejected_failed";
        public const string UnfollowSuccess = "kid_account.unfollow.success";
        public const string UnfollowFailed = "kid_account.unfollow.failed";
        public const string FollowersRetrievalFailed = "kid_account.followers.retrieval_failed";
        public const string FollowingRetrievalFailed = "kid_account.following.retrieval_failed";
        public const string ContentRestrictionsSetSuccess = "kid_account.content_restrictions.set_success";
        public const string ContentRestrictionsSetFailed = "kid_account.content_restrictions.set_failed";
        public const string ContentRestrictionsRetrievalFailed = "kid_account.content_restrictions.retrieval_failed";
    }
    
    #endregion
    
    #region Joint Accounts
    
    public static class JointAccount
    {
        public const string CreationSuccess = "joint_account.creation.success";
        public const string CreationFailed = "joint_account.creation.failed";
        public const string LinkingSuccess = "joint_account.linking.success";
        public const string LinkingFailed = "joint_account.linking.failed";
        public const string UnlinkingSuccess = "joint_account.unlinking.success";
        public const string UnlinkingFailed = "joint_account.unlinking.failed";
        public const string StatusActive = "joint_account.status.active";
        public const string StatusPending = "joint_account.status.pending";
        public const string StatusSuspended = "joint_account.status.suspended";
        public const string StatusTerminated = "joint_account.status.terminated";
    }
    
    #endregion
    
    #region Profile Management
    
    public static class Profile
    {
        public const string UpdateSuccess = "profile.update.success";
        public const string UpdateFailed = "profile.update.failed";
        public const string PictureUploadSuccess = "profile.picture.upload_success";
        public const string PictureUploadFailed = "profile.picture.upload_failed";
        public const string PictureCroppingSuccess = "profile.picture.cropping_success";
        public const string PictureCroppingFailed = "profile.picture.cropping_failed";
        public const string PictureFormatUnsupported = "profile.picture.format_unsupported";
        public const string PictureSizeTooLarge = "profile.picture.size_too_large";
        public const string PictureProcessingInProgress = "profile.picture.processing_in_progress";
    }
    
    #endregion
    
    #region Groups
    
    public static class Groups
    {
        public const string CreationSuccess = "groups.creation.success";
        public const string CreationFailed = "groups.creation.failed";
        public const string UpdateSuccess = "groups.update.success";
        public const string UpdateFailed = "groups.update.failed";
        public const string DeletionSuccess = "groups.deletion.success";
        public const string DeletionFailed = "groups.deletion.failed";
        public const string NotFound = "groups.not_found";
        public const string AccessDenied = "groups.access_denied";
        public const string MemberAddedSuccess = "groups.member.added_success";
        public const string MemberAddedFailed = "groups.member.added_failed";
        public const string MemberRemovedSuccess = "groups.member.removed_success";
        public const string MemberRemovedFailed = "groups.member.removed_failed";
        public const string MemberRoleUpdated = "groups.member.role_updated";
        public const string MemberRoleUpdateFailed = "groups.member.role_update_failed";
        public const string InvitationSentSuccess = "groups.invitation.sent_success";
        public const string InvitationSentFailed = "groups.invitation.sent_failed";
        public const string InvitationAccepted = "groups.invitation.accepted";
        public const string InvitationDeclined = "groups.invitation.declined";
        public const string InvitationExpired = "groups.invitation.expired";
        public const string InvitationNotFound = "groups.invitation.not_found";
        public const string PostCreatedSuccess = "groups.post.created_success";
        public const string PostCreatedFailed = "groups.post.created_failed";
        public const string PostUpdatedSuccess = "groups.post.updated_success";
        public const string PostUpdatedFailed = "groups.post.updated_failed";
        public const string PostDeletedSuccess = "groups.post.deleted_success";
        public const string PostDeletedFailed = "groups.post.deleted_failed";
        public const string PostNotFound = "groups.post.not_found";
        public const string CommentAddedSuccess = "groups.comment.added_success";
        public const string CommentAddedFailed = "groups.comment.added_failed";
        public const string CommentUpdatedSuccess = "groups.comment.updated_success";
        public const string CommentUpdatedFailed = "groups.comment.updated_failed";
        public const string CommentDeletedSuccess = "groups.comment.deleted_success";
        public const string CommentDeletedFailed = "groups.comment.deleted_failed";
        public const string ReactionAddedSuccess = "groups.reaction.added_success";
        public const string ReactionAddedFailed = "groups.reaction.added_failed";
        public const string ReactionRemovedSuccess = "groups.reaction.removed_success";
        public const string ReactionRemovedFailed = "groups.reaction.removed_failed";
        public const string QrCodeGeneratedSuccess = "groups.qr_code.generated_success";
        public const string QrCodeGeneratedFailed = "groups.qr_code.generated_failed";
        public const string QrCodeScannedSuccess = "groups.qr_code.scanned_success";
        public const string QrCodeScannedFailed = "groups.qr_code.scanned_failed";
        public const string QrCodeInvalid = "groups.qr_code.invalid";
        public const string QrCodeExpired = "groups.qr_code.expired";
        public const string ParentalApprovalRequired = "groups.parental_approval.required";
        public const string ParentalApprovalGranted = "groups.parental_approval.granted";
        public const string ParentalApprovalDenied = "groups.parental_approval.denied";
        public const string ParentalApprovalPending = "groups.parental_approval.pending";
        public const string KidGroupRestriction = "groups.kid.restriction";
        public const string TeacherAdminRequired = "groups.teacher.admin_required";
        public const string ContentModerationRequired = "groups.content.moderation_required";
    }
    
    #endregion
    
    #region General Messages
    
    public static class General
    {
        public const string Success = "general.success";
        public const string Error = "general.error";
        public const string Warning = "general.warning";
        public const string Info = "general.info";
        public const string NotFound = "general.not_found";
        public const string ValidationFailed = "general.validation_failed";
        public const string ServerError = "general.server_error";
        public const string NetworkError = "general.network_error";
        public const string TimeoutError = "general.timeout_error";
        public const string MaintenanceMode = "general.maintenance_mode";
        public const string ServiceUnavailable = "general.service_unavailable";
    }
    
    #endregion
    
    #region Validation Messages
    
    public static class Validation
    {
        public const string Required = "validation.required";
        public const string InvalidFormat = "validation.invalid_format";
        public const string TooLong = "validation.too_long";
        public const string TooShort = "validation.too_short";
        public const string InvalidEmail = "validation.invalid_email";
        public const string InvalidPhone = "validation.invalid_phone";
        public const string InvalidDate = "validation.invalid_date";
        public const string InvalidUrl = "validation.invalid_url";
        public const string InvalidCreditCard = "validation.invalid_credit_card";
        public const string PasswordMismatch = "validation.password_mismatch";
        public const string TermsNotAccepted = "validation.terms_not_accepted";
        public const string AgeRestriction = "validation.age_restriction";
        public const string KidAccountIdRequired = "validation.kid_account_id.required";
    }
    
    #endregion
    
    #region Email Templates
    
    public static class Email
    {
        public const string WelcomeSubject = "email.welcome.subject";
        public const string WelcomeBody = "email.welcome.body";
        public const string VerificationSubject = "email.verification.subject";
        public const string VerificationBody = "email.verification.body";
        public const string PasswordResetSubject = "email.password_reset.subject";
        public const string PasswordResetBody = "email.password_reset.body";
        public const string MfaSetupSubject = "email.mfa_setup.subject";
        public const string MfaSetupBody = "email.mfa_setup.body";
        public const string AccountLockedSubject = "email.account_locked.subject";
        public const string AccountLockedBody = "email.account_locked.body";
    }
    
    #endregion
}
