using innkt.Groups.DTOs;

namespace innkt.Groups.Services
{
    public interface IAIIntegrationService
    {
        Task<AIAnalysisResponse> AnalyzeContentAsync(Guid userId, AIAnalysisRequest request);
        Task<HomeworkAnalysisResponse> AnalyzeHomeworkAsync(Guid userId, HomeworkAnalysisRequest request);
        Task<DocumentAnalysisResponse> AnalyzeDocumentAsync(Guid userId, DocumentAnalysisRequest request);
        Task<AISuggestionResponse> GetSuggestionsAsync(Guid userId, AISuggestionRequest request);
        Task<AIAnalysisResponse> TranslateContentAsync(Guid userId, AIAnalysisRequest request);
        Task<AIAnalysisResponse> SummarizeContentAsync(Guid userId, AIAnalysisRequest request);
        Task<AIAnalysisResponse> AnswerQuestionAsync(Guid userId, AIAnalysisRequest request);
        Task<object> GetGroupInsightsAsync(Guid groupId, Guid userId);
    }
}
