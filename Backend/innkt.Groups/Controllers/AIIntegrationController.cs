using Microsoft.AspNetCore.Mvc;
using innkt.Groups.DTOs;
using innkt.Groups.Services;

namespace innkt.Groups.Controllers
{
    [ApiController]
    [Route("api/groups/{groupId}/ai")]
    public class AIIntegrationController : ControllerBase
    {
        private readonly IAIIntegrationService _aiService;

        public AIIntegrationController(IAIIntegrationService aiService)
        {
            _aiService = aiService;
        }

        /// <summary>
        /// Analyze content using @grok AI
        /// </summary>
        [HttpPost("analyze")]
        public async Task<ActionResult<AIAnalysisResponse>> AnalyzeContent(Guid groupId, AIAnalysisRequest request)
        {
            try
            {
                var userId = GetCurrentUserId();
                request.GroupId = groupId;
                var analysis = await _aiService.AnalyzeContentAsync(userId, request);
                return Ok(analysis);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        /// <summary>
        /// Analyze homework using @grok AI
        /// </summary>
        [HttpPost("analyze-homework")]
        public async Task<ActionResult<HomeworkAnalysisResponse>> AnalyzeHomework(Guid groupId, HomeworkAnalysisRequest request)
        {
            try
            {
                var userId = GetCurrentUserId();
                var analysis = await _aiService.AnalyzeHomeworkAsync(userId, request);
                return Ok(analysis);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        /// <summary>
        /// Analyze document using @grok AI
        /// </summary>
        [HttpPost("analyze-document")]
        public async Task<ActionResult<DocumentAnalysisResponse>> AnalyzeDocument(Guid groupId, DocumentAnalysisRequest request)
        {
            try
            {
                var userId = GetCurrentUserId();
                request.GroupId = groupId;
                var analysis = await _aiService.AnalyzeDocumentAsync(userId, request);
                return Ok(analysis);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        /// <summary>
        /// Get AI suggestions for group content
        /// </summary>
        [HttpPost("suggestions")]
        public async Task<ActionResult<AISuggestionResponse>> GetSuggestions(Guid groupId, AISuggestionRequest request)
        {
            try
            {
                var userId = GetCurrentUserId();
                request.GroupId = groupId;
                var suggestions = await _aiService.GetSuggestionsAsync(userId, request);
                return Ok(suggestions);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        /// <summary>
        /// Translate content using @grok AI
        /// </summary>
        [HttpPost("translate")]
        public async Task<ActionResult<AIAnalysisResponse>> TranslateContent(Guid groupId, AIAnalysisRequest request)
        {
            try
            {
                var userId = GetCurrentUserId();
                request.GroupId = groupId;
                request.AnalysisType = "translation";
                var translation = await _aiService.TranslateContentAsync(userId, request);
                return Ok(translation);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        /// <summary>
        /// Generate content summary using @grok AI
        /// </summary>
        [HttpPost("summarize")]
        public async Task<ActionResult<AIAnalysisResponse>> SummarizeContent(Guid groupId, AIAnalysisRequest request)
        {
            try
            {
                var userId = GetCurrentUserId();
                request.GroupId = groupId;
                request.AnalysisType = "summary";
                var summary = await _aiService.SummarizeContentAsync(userId, request);
                return Ok(summary);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        /// <summary>
        /// Answer questions using group documentation and @grok AI
        /// </summary>
        [HttpPost("answer-question")]
        public async Task<ActionResult<AIAnalysisResponse>> AnswerQuestion(Guid groupId, AIAnalysisRequest request)
        {
            try
            {
                var userId = GetCurrentUserId();
                request.GroupId = groupId;
                request.AnalysisType = "question-answering";
                var answer = await _aiService.AnswerQuestionAsync(userId, request);
                return Ok(answer);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        /// <summary>
        /// Get AI-powered group insights
        /// </summary>
        [HttpGet("insights")]
        public async Task<ActionResult<object>> GetGroupInsights(Guid groupId)
        {
            try
            {
                var userId = GetCurrentUserId();
                var insights = await _aiService.GetGroupInsightsAsync(groupId, userId);
                return Ok(insights);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        private Guid GetCurrentUserId()
        {
            // This should be implemented based on your authentication system
            return Guid.Parse("550e8400-e29b-41d4-a716-446655440001");
        }
    }
}
