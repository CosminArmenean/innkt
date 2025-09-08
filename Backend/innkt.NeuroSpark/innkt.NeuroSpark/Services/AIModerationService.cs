using Microsoft.Extensions.Logging;
using System.Text.Json;
using System.Text.RegularExpressions;
using System.Net.Http;
using System.Text;

namespace innkt.NeuroSpark.Services
{
    public interface IAIModerationService
    {
        Task<ContentModerationResult> ModerateTextAsync(string text, string userId);
        Task<ImageModerationResult> ModerateImageAsync(byte[] imageData, string userId);
        Task<SentimentAnalysisResult> AnalyzeSentimentAsync(string text);
        Task<SpamDetectionResult> DetectSpamAsync(string text, string userId);
        Task<ContentSuggestionResult> GetContentSuggestionsAsync(string text, string userId);
        Task<HashtagSuggestionResult> GetHashtagSuggestionsAsync(string text);
        Task<ContentQualityResult> AnalyzeContentQualityAsync(string text);
        Task<ComplianceResult> CheckComplianceAsync(string text, string userId);
        Task<AutomatedActionResult> TakeAutomatedActionAsync(ModerationViolation violation);
    }

    public class AIModerationService : IAIModerationService
    {
        private readonly ILogger<AIModerationService> _logger;
        private readonly HttpClient _httpClient;
        private readonly IConfiguration _configuration;

        // Moderation thresholds
        private const double TOXICITY_THRESHOLD = 0.7;
        private const double SPAM_THRESHOLD = 0.8;
        private const double QUALITY_THRESHOLD = 0.6;
        private const double SENTIMENT_THRESHOLD = -0.5;

        // Inappropriate content patterns
        private static readonly string[] INAPPROPRIATE_PATTERNS = {
            @"\b(hate|kill|murder|suicide|bomb|terrorist)\b",
            @"\b(fuck|shit|damn|bitch|asshole)\b",
            @"\b(nazi|hitler|kkk|white\s+supremacy)\b",
            @"\b(drugs|cocaine|heroin|marijuana)\b",
            @"\b(sex|porn|nude|naked|breast|penis|vagina)\b"
        };

        // Spam patterns
        private static readonly string[] SPAM_PATTERNS = {
            @"\b(buy\s+now|click\s+here|free\s+money|make\s+money|work\s+from\s+home)\b",
            @"\b(viagra|cialis|pharmacy|pills|medication)\b",
            @"\b(crypto|bitcoin|investment|trading|forex)\b",
            @"\b(follow\s+me|subscribe|like\s+and\s+share|dm\s+me)\b"
        };

        // Quality indicators
        private static readonly string[] QUALITY_INDICATORS = {
            @"\b(interesting|amazing|wonderful|fantastic|great)\b",
            @"\b(thoughtful|insightful|meaningful|valuable)\b",
            @"\b(question|discussion|opinion|perspective)\b",
            @"\b(experience|story|journey|adventure)\b"
        };

        public AIModerationService(
            ILogger<AIModerationService> logger,
            HttpClient httpClient,
            IConfiguration configuration)
        {
            _logger = logger;
            _httpClient = httpClient;
            _configuration = configuration;
        }

        public async Task<ContentModerationResult> ModerateTextAsync(string text, string userId)
        {
            try
            {
                _logger.LogInformation($"Moderating text for user {userId}");

                var result = new ContentModerationResult
                {
                    Text = text,
                    UserId = userId,
                    Timestamp = DateTime.UtcNow,
                    IsApproved = true,
                    Confidence = 1.0,
                    Violations = new List<ModerationViolation>()
                };

                // Check for inappropriate content
                var inappropriateResult = await CheckInappropriateContentAsync(text);
                if (inappropriateResult.IsViolation)
                {
                    result.Violations.Add(inappropriateResult);
                    result.IsApproved = false;
                    result.Confidence = Math.Min(result.Confidence, inappropriateResult.Confidence);
                }

                // Check for spam
                var spamResult = await DetectSpamAsync(text, userId);
                if (spamResult.IsSpam)
                {
                    result.Violations.Add(new ModerationViolation
                    {
                        Type = ViolationType.Spam,
                        Severity = ViolationSeverity.Medium,
                        Description = "Content appears to be spam",
                        Confidence = spamResult.Confidence,
                        SuggestedAction = ModerationAction.Flag
                    });
                    result.IsApproved = false;
                    result.Confidence = Math.Min(result.Confidence, spamResult.Confidence);
                }

                // Check sentiment
                var sentimentResult = await AnalyzeSentimentAsync(text);
                if (sentimentResult.Score < SENTIMENT_THRESHOLD)
                {
                    result.Violations.Add(new ModerationViolation
                    {
                        Type = ViolationType.NegativeSentiment,
                        Severity = ViolationSeverity.Low,
                        Description = "Content has very negative sentiment",
                        Confidence = Math.Abs(sentimentResult.Score),
                        SuggestedAction = ModerationAction.Warn
                    });
                }

                // Check compliance
                var complianceResult = await CheckComplianceAsync(text, userId);
                if (!complianceResult.IsCompliant)
                {
                    result.Violations.AddRange(complianceResult.Violations);
                    result.IsApproved = false;
                }

                _logger.LogInformation($"Text moderation completed for user {userId}. Approved: {result.IsApproved}");
                return result;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error moderating text for user {userId}");
                return new ContentModerationResult
                {
                    Text = text,
                    UserId = userId,
                    Timestamp = DateTime.UtcNow,
                    IsApproved = false,
                    Confidence = 0.0,
                    Error = "Moderation failed due to technical error"
                };
            }
        }

        public async Task<ImageModerationResult> ModerateImageAsync(byte[] imageData, string userId)
        {
            try
            {
                _logger.LogInformation($"Moderating image for user {userId}");

                var result = new ImageModerationResult
                {
                    UserId = userId,
                    Timestamp = DateTime.UtcNow,
                    IsApproved = true,
                    Confidence = 1.0,
                    Violations = new List<ModerationViolation>()
                };

                // Basic image analysis (in a real implementation, this would use AI vision APIs)
                var imageAnalysis = await AnalyzeImageContentAsync(imageData);
                
                if (imageAnalysis.ContainsInappropriateContent)
                {
                    result.Violations.Add(new ModerationViolation
                    {
                        Type = ViolationType.InappropriateImage,
                        Severity = ViolationSeverity.High,
                        Description = "Image contains inappropriate content",
                        Confidence = imageAnalysis.Confidence,
                        SuggestedAction = ModerationAction.Block
                    });
                    result.IsApproved = false;
                    result.Confidence = imageAnalysis.Confidence;
                }

                if (imageAnalysis.ContainsViolence)
                {
                    result.Violations.Add(new ModerationViolation
                    {
                        Type = ViolationType.Violence,
                        Severity = ViolationSeverity.High,
                        Description = "Image contains violent content",
                        Confidence = imageAnalysis.Confidence,
                        SuggestedAction = ModerationAction.Block
                    });
                    result.IsApproved = false;
                    result.Confidence = Math.Min(result.Confidence, imageAnalysis.Confidence);
                }

                _logger.LogInformation($"Image moderation completed for user {userId}. Approved: {result.IsApproved}");
                return result;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error moderating image for user {userId}");
                return new ImageModerationResult
                {
                    UserId = userId,
                    Timestamp = DateTime.UtcNow,
                    IsApproved = false,
                    Confidence = 0.0,
                    Error = "Image moderation failed due to technical error"
                };
            }
        }

        public async Task<SentimentAnalysisResult> AnalyzeSentimentAsync(string text)
        {
            try
            {
                _logger.LogDebug($"Analyzing sentiment for text: {text.Substring(0, Math.Min(50, text.Length))}...");

                var result = new SentimentAnalysisResult
                {
                    Text = text,
                    Timestamp = DateTime.UtcNow
                };

                // Simple sentiment analysis based on keywords
                var positiveWords = new[] { "good", "great", "amazing", "wonderful", "fantastic", "love", "like", "happy", "joy", "excellent" };
                var negativeWords = new[] { "bad", "terrible", "awful", "hate", "dislike", "sad", "angry", "frustrated", "disappointed", "horrible" };

                var words = text.ToLower().Split(' ', StringSplitOptions.RemoveEmptyEntries);
                var positiveCount = words.Count(w => positiveWords.Contains(w));
                var negativeCount = words.Count(w => negativeWords.Contains(w));

                if (positiveCount + negativeCount == 0)
                {
                    result.Score = 0.0;
                    result.Label = "Neutral";
                }
                else
                {
                    result.Score = (positiveCount - negativeCount) / (double)(positiveCount + negativeCount);
                    result.Label = result.Score > 0.1 ? "Positive" : result.Score < -0.1 ? "Negative" : "Neutral";
                }

                result.Confidence = Math.Min(1.0, (positiveCount + negativeCount) / 10.0);

                _logger.LogDebug($"Sentiment analysis completed. Score: {result.Score}, Label: {result.Label}");
                return result;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error analyzing sentiment");
                return new SentimentAnalysisResult
                {
                    Text = text,
                    Timestamp = DateTime.UtcNow,
                    Score = 0.0,
                    Label = "Unknown",
                    Confidence = 0.0,
                    Error = "Sentiment analysis failed"
                };
            }
        }

        public async Task<SpamDetectionResult> DetectSpamAsync(string text, string userId)
        {
            try
            {
                _logger.LogDebug($"Detecting spam for user {userId}");

                var result = new SpamDetectionResult
                {
                    Text = text,
                    UserId = userId,
                    Timestamp = DateTime.UtcNow,
                    IsSpam = false,
                    Confidence = 0.0
                };

                // Check for spam patterns
                var spamScore = 0.0;
                foreach (var pattern in SPAM_PATTERNS)
                {
                    if (Regex.IsMatch(text, pattern, RegexOptions.IgnoreCase))
                    {
                        spamScore += 0.2;
                    }
                }

                // Check for excessive repetition
                var words = text.Split(' ', StringSplitOptions.RemoveEmptyEntries);
                var wordCounts = words.GroupBy(w => w.ToLower()).ToDictionary(g => g.Key, g => g.Count());
                var maxRepetition = wordCounts.Values.Max();
                if (maxRepetition > words.Length * 0.3)
                {
                    spamScore += 0.3;
                }

                // Check for excessive links
                var linkCount = Regex.Matches(text, @"https?://").Count;
                if (linkCount > 3)
                {
                    spamScore += 0.2;
                }

                // Check for excessive hashtags
                var hashtagCount = Regex.Matches(text, @"#\w+").Count;
                if (hashtagCount > 10)
                {
                    spamScore += 0.2;
                }

                result.Confidence = Math.Min(1.0, spamScore);
                result.IsSpam = result.Confidence > SPAM_THRESHOLD;

                _logger.LogDebug($"Spam detection completed for user {userId}. IsSpam: {result.IsSpam}, Confidence: {result.Confidence}");
                return result;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error detecting spam for user {userId}");
                return new SpamDetectionResult
                {
                    Text = text,
                    UserId = userId,
                    Timestamp = DateTime.UtcNow,
                    IsSpam = false,
                    Confidence = 0.0,
                    Error = "Spam detection failed"
                };
            }
        }

        public async Task<ContentSuggestionResult> GetContentSuggestionsAsync(string text, string userId)
        {
            try
            {
                _logger.LogDebug($"Getting content suggestions for user {userId}");

                var result = new ContentSuggestionResult
                {
                    Text = text,
                    UserId = userId,
                    Timestamp = DateTime.UtcNow,
                    Suggestions = new List<ContentSuggestion>()
                };

                // Suggest improvements based on content analysis
                var qualityResult = await AnalyzeContentQualityAsync(text);
                
                if (qualityResult.Score < QUALITY_THRESHOLD)
                {
                    result.Suggestions.Add(new ContentSuggestion
                    {
                        Type = SuggestionType.Improvement,
                        Title = "Improve Content Quality",
                        Description = "Consider adding more detail or context to make your content more engaging",
                        Priority = SuggestionPriority.Medium
                    });
                }

                // Suggest hashtags
                var hashtagResult = await GetHashtagSuggestionsAsync(text);
                if (hashtagResult.SuggestedHashtags.Any())
                {
                    result.Suggestions.Add(new ContentSuggestion
                    {
                        Type = SuggestionType.Hashtag,
                        Title = "Add Relevant Hashtags",
                        Description = $"Consider adding these hashtags: {string.Join(", ", hashtagResult.SuggestedHashtags.Take(3))}",
                        Priority = SuggestionPriority.Low
                    });
                }

                // Suggest engagement improvements
                if (text.Length < 50)
                {
                    result.Suggestions.Add(new ContentSuggestion
                    {
                        Type = SuggestionType.Engagement,
                        Title = "Add More Content",
                        Description = "Longer posts tend to get more engagement. Consider adding more details or asking a question",
                        Priority = SuggestionPriority.Low
                    });
                }

                _logger.LogDebug($"Content suggestions generated for user {userId}. Count: {result.Suggestions.Count}");
                return result;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error getting content suggestions for user {userId}");
                return new ContentSuggestionResult
                {
                    Text = text,
                    UserId = userId,
                    Timestamp = DateTime.UtcNow,
                    Suggestions = new List<ContentSuggestion>(),
                    Error = "Content suggestions failed"
                };
            }
        }

        public async Task<HashtagSuggestionResult> GetHashtagSuggestionsAsync(string text)
        {
            try
            {
                _logger.LogDebug($"Getting hashtag suggestions for text: {text.Substring(0, Math.Min(50, text.Length))}...");

                var result = new HashtagSuggestionResult
                {
                    Text = text,
                    Timestamp = DateTime.UtcNow,
                    SuggestedHashtags = new List<string>()
                };

                // Extract keywords from text
                var words = text.ToLower()
                    .Split(' ', StringSplitOptions.RemoveEmptyEntries)
                    .Where(w => w.Length > 3 && !IsStopWord(w))
                    .GroupBy(w => w)
                    .OrderByDescending(g => g.Count())
                    .Take(5)
                    .Select(g => g.Key);

                // Generate hashtag suggestions
                foreach (var word in words)
                {
                    result.SuggestedHashtags.Add($"#{word}");
                }

                // Add trending hashtags based on content
                var trendingHashtags = GetTrendingHashtags(text);
                result.SuggestedHashtags.AddRange(trendingHashtags);

                // Remove duplicates and limit
                result.SuggestedHashtags = result.SuggestedHashtags
                    .Distinct()
                    .Take(10)
                    .ToList();

                _logger.LogDebug($"Hashtag suggestions generated. Count: {result.SuggestedHashtags.Count}");
                return result;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting hashtag suggestions");
                return new HashtagSuggestionResult
                {
                    Text = text,
                    Timestamp = DateTime.UtcNow,
                    SuggestedHashtags = new List<string>(),
                    Error = "Hashtag suggestions failed"
                };
            }
        }

        public async Task<ContentQualityResult> AnalyzeContentQualityAsync(string text)
        {
            try
            {
                _logger.LogDebug($"Analyzing content quality for text: {text.Substring(0, Math.Min(50, text.Length))}...");

                var result = new ContentQualityResult
                {
                    Text = text,
                    Timestamp = DateTime.UtcNow,
                    Score = 0.0,
                    Factors = new List<QualityFactor>()
                };

                var qualityScore = 0.0;

                // Length factor
                var lengthFactor = new QualityFactor
                {
                    Name = "Length",
                    Score = Math.Min(1.0, text.Length / 200.0),
                    Description = text.Length < 50 ? "Very short" : text.Length < 200 ? "Good length" : "Long content"
                };
                result.Factors.Add(lengthFactor);
                qualityScore += lengthFactor.Score * 0.2;

                // Quality indicators
                var qualityIndicatorCount = 0;
                foreach (var indicator in QUALITY_INDICATORS)
                {
                    if (Regex.IsMatch(text, indicator, RegexOptions.IgnoreCase))
                    {
                        qualityIndicatorCount++;
                    }
                }
                var qualityFactor = new QualityFactor
                {
                    Name = "Quality Indicators",
                    Score = Math.Min(1.0, qualityIndicatorCount / 3.0),
                    Description = $"Contains {qualityIndicatorCount} quality indicators"
                };
                result.Factors.Add(qualityFactor);
                qualityScore += qualityFactor.Score * 0.3;

                // Readability
                var readabilityScore = CalculateReadability(text);
                var readabilityFactor = new QualityFactor
                {
                    Name = "Readability",
                    Score = readabilityScore,
                    Description = readabilityScore > 0.7 ? "Easy to read" : readabilityScore > 0.4 ? "Moderate readability" : "Difficult to read"
                };
                result.Factors.Add(readabilityFactor);
                qualityScore += readabilityFactor.Score * 0.3;

                // Engagement potential
                var engagementScore = CalculateEngagementPotential(text);
                var engagementFactor = new QualityFactor
                {
                    Name = "Engagement Potential",
                    Score = engagementScore,
                    Description = engagementScore > 0.7 ? "High engagement potential" : engagementScore > 0.4 ? "Moderate engagement potential" : "Low engagement potential"
                };
                result.Factors.Add(engagementFactor);
                qualityScore += engagementFactor.Score * 0.2;

                result.Score = qualityScore;
                result.OverallRating = qualityScore > 0.8 ? "Excellent" : qualityScore > 0.6 ? "Good" : qualityScore > 0.4 ? "Fair" : "Poor";

                _logger.LogDebug($"Content quality analysis completed. Score: {result.Score}, Rating: {result.OverallRating}");
                return result;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error analyzing content quality");
                return new ContentQualityResult
                {
                    Text = text,
                    Timestamp = DateTime.UtcNow,
                    Score = 0.0,
                    OverallRating = "Unknown",
                    Factors = new List<QualityFactor>(),
                    Error = "Content quality analysis failed"
                };
            }
        }

        public async Task<ComplianceResult> CheckComplianceAsync(string text, string userId)
        {
            try
            {
                _logger.LogDebug($"Checking compliance for user {userId}");

                var result = new ComplianceResult
                {
                    Text = text,
                    UserId = userId,
                    Timestamp = DateTime.UtcNow,
                    IsCompliant = true,
                    Violations = new List<ModerationViolation>()
                };

                // Check for inappropriate content
                var inappropriateResult = await CheckInappropriateContentAsync(text);
                if (inappropriateResult.IsViolation)
                {
                    result.Violations.Add(inappropriateResult);
                    result.IsCompliant = false;
                }

                // Check for spam
                var spamResult = await DetectSpamAsync(text, userId);
                if (spamResult.IsSpam)
                {
                    result.Violations.Add(new ModerationViolation
                    {
                        Type = ViolationType.Spam,
                        Severity = ViolationSeverity.Medium,
                        Description = "Content violates spam policy",
                        Confidence = spamResult.Confidence,
                        SuggestedAction = ModerationAction.Flag
                    });
                    result.IsCompliant = false;
                }

                // Check for age-inappropriate content
                if (ContainsAgeInappropriateContent(text))
                {
                    result.Violations.Add(new ModerationViolation
                    {
                        Type = ViolationType.AgeInappropriate,
                        Severity = ViolationSeverity.High,
                        Description = "Content is not age-appropriate",
                        Confidence = 0.8,
                        SuggestedAction = ModerationAction.Block
                    });
                    result.IsCompliant = false;
                }

                _logger.LogDebug($"Compliance check completed for user {userId}. Compliant: {result.IsCompliant}");
                return result;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error checking compliance for user {userId}");
                return new ComplianceResult
                {
                    Text = text,
                    UserId = userId,
                    Timestamp = DateTime.UtcNow,
                    IsCompliant = false,
                    Violations = new List<ModerationViolation>(),
                    Error = "Compliance check failed"
                };
            }
        }

        public async Task<AutomatedActionResult> TakeAutomatedActionAsync(ModerationViolation violation)
        {
            try
            {
                _logger.LogInformation($"Taking automated action for violation: {violation.Type}");

                var result = new AutomatedActionResult
                {
                    Violation = violation,
                    Timestamp = DateTime.UtcNow,
                    ActionTaken = violation.SuggestedAction,
                    Success = true
                };

                switch (violation.SuggestedAction)
                {
                    case ModerationAction.Block:
                        result.Description = "Content has been blocked and will not be published";
                        break;
                    case ModerationAction.Flag:
                        result.Description = "Content has been flagged for manual review";
                        break;
                    case ModerationAction.Warn:
                        result.Description = "User has been warned about content policy violation";
                        break;
                    case ModerationAction.Hide:
                        result.Description = "Content has been hidden from public view";
                        break;
                    default:
                        result.Description = "No action taken";
                        break;
                }

                _logger.LogInformation($"Automated action completed: {result.ActionTaken}");
                return result;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error taking automated action for violation: {violation.Type}");
                return new AutomatedActionResult
                {
                    Violation = violation,
                    Timestamp = DateTime.UtcNow,
                    ActionTaken = ModerationAction.None,
                    Success = false,
                    Error = "Automated action failed"
                };
            }
        }

        // Helper methods
        private async Task<ModerationViolation> CheckInappropriateContentAsync(string text)
        {
            var violation = new ModerationViolation
            {
                Type = ViolationType.InappropriateContent,
                Severity = ViolationSeverity.Medium,
                Description = "Content contains inappropriate language",
                Confidence = 0.0,
                SuggestedAction = ModerationAction.Flag
            };

            foreach (var pattern in INAPPROPRIATE_PATTERNS)
            {
                if (Regex.IsMatch(text, pattern, RegexOptions.IgnoreCase))
                {
                    violation.Confidence = Math.Max(violation.Confidence, 0.8);
                    violation.Severity = ViolationSeverity.High;
                    violation.SuggestedAction = ModerationAction.Block;
                    break;
                }
            }

            return violation;
        }

        private async Task<ImageAnalysisResult> AnalyzeImageContentAsync(byte[] imageData)
        {
            // In a real implementation, this would use AI vision APIs like Google Vision, AWS Rekognition, or Azure Computer Vision
            return new ImageAnalysisResult
            {
                ContainsInappropriateContent = false,
                ContainsViolence = false,
                Confidence = 0.0
            };
        }

        private bool IsStopWord(string word)
        {
            var stopWords = new[] { "the", "and", "or", "but", "in", "on", "at", "to", "for", "of", "with", "by", "is", "are", "was", "were", "be", "been", "have", "has", "had", "do", "does", "did", "will", "would", "could", "should", "may", "might", "can", "this", "that", "these", "those", "a", "an" };
            return stopWords.Contains(word.ToLower());
        }

        private List<string> GetTrendingHashtags(string text)
        {
            // In a real implementation, this would fetch trending hashtags from a database or API
            var trendingHashtags = new List<string>();
            
            if (text.ToLower().Contains("technology"))
                trendingHashtags.Add("#technology");
            if (text.ToLower().Contains("art"))
                trendingHashtags.Add("#art");
            if (text.ToLower().Contains("music"))
                trendingHashtags.Add("#music");
            if (text.ToLower().Contains("travel"))
                trendingHashtags.Add("#travel");
            if (text.ToLower().Contains("food"))
                trendingHashtags.Add("#food");

            return trendingHashtags;
        }

        private double CalculateReadability(string text)
        {
            var sentences = text.Split('.', '!', '?').Length;
            var words = text.Split(' ', StringSplitOptions.RemoveEmptyEntries).Length;
            var syllables = text.Split(' ', StringSplitOptions.RemoveEmptyEntries).Sum(w => CountSyllables(w));

            if (sentences == 0 || words == 0) return 0.0;

            var avgWordsPerSentence = words / (double)sentences;
            var avgSyllablesPerWord = syllables / (double)words;

            // Simple readability score (0-1, higher is better)
            var score = 1.0 - (avgWordsPerSentence / 20.0) - (avgSyllablesPerWord / 3.0);
            return Math.Max(0.0, Math.Min(1.0, score));
        }

        private int CountSyllables(string word)
        {
            word = word.ToLower();
            var vowels = "aeiouy";
            var syllableCount = 0;
            var previousWasVowel = false;

            foreach (var c in word)
            {
                var isVowel = vowels.Contains(c);
                if (isVowel && !previousWasVowel)
                {
                    syllableCount++;
                }
                previousWasVowel = isVowel;
            }

            if (word.EndsWith("e"))
            {
                syllableCount--;
            }

            return Math.Max(1, syllableCount);
        }

        private double CalculateEngagementPotential(string text)
        {
            var score = 0.0;

            // Questions increase engagement
            if (text.Contains("?"))
                score += 0.3;

            // Exclamation marks increase engagement
            if (text.Contains("!"))
                score += 0.2;

            // Hashtags increase engagement
            var hashtagCount = Regex.Matches(text, @"#\w+").Count;
            score += Math.Min(0.2, hashtagCount * 0.05);

            // Mentions increase engagement
            var mentionCount = Regex.Matches(text, @"@\w+").Count;
            score += Math.Min(0.2, mentionCount * 0.1);

            // Length affects engagement
            if (text.Length > 100 && text.Length < 500)
                score += 0.1;

            return Math.Min(1.0, score);
        }

        private bool ContainsAgeInappropriateContent(string text)
        {
            var inappropriateWords = new[] { "adult", "mature", "explicit", "nsfw", "18+", "21+" };
            return inappropriateWords.Any(word => text.ToLower().Contains(word));
        }
    }

    // Data models for AI moderation
    public class ContentModerationResult
    {
        public string Text { get; set; } = string.Empty;
        public string UserId { get; set; } = string.Empty;
        public DateTime Timestamp { get; set; }
        public bool IsApproved { get; set; }
        public double Confidence { get; set; }
        public List<ModerationViolation> Violations { get; set; } = new();
        public string? Error { get; set; }
    }

    public class ImageModerationResult
    {
        public string UserId { get; set; } = string.Empty;
        public DateTime Timestamp { get; set; }
        public bool IsApproved { get; set; }
        public double Confidence { get; set; }
        public List<ModerationViolation> Violations { get; set; } = new();
        public string? Error { get; set; }
    }

    public class SentimentAnalysisResult
    {
        public string Text { get; set; } = string.Empty;
        public DateTime Timestamp { get; set; }
        public double Score { get; set; }
        public string Label { get; set; } = string.Empty;
        public double Confidence { get; set; }
        public string? Error { get; set; }
    }

    public class SpamDetectionResult
    {
        public string Text { get; set; } = string.Empty;
        public string UserId { get; set; } = string.Empty;
        public DateTime Timestamp { get; set; }
        public bool IsSpam { get; set; }
        public double Confidence { get; set; }
        public string? Error { get; set; }
    }

    public class ContentSuggestionResult
    {
        public string Text { get; set; } = string.Empty;
        public string UserId { get; set; } = string.Empty;
        public DateTime Timestamp { get; set; }
        public List<ContentSuggestion> Suggestions { get; set; } = new();
        public string? Error { get; set; }
    }

    public class HashtagSuggestionResult
    {
        public string Text { get; set; } = string.Empty;
        public DateTime Timestamp { get; set; }
        public List<string> SuggestedHashtags { get; set; } = new();
        public string? Error { get; set; }
    }

    public class ContentQualityResult
    {
        public string Text { get; set; } = string.Empty;
        public DateTime Timestamp { get; set; }
        public double Score { get; set; }
        public string OverallRating { get; set; } = string.Empty;
        public List<QualityFactor> Factors { get; set; } = new();
        public string? Error { get; set; }
    }

    public class ComplianceResult
    {
        public string Text { get; set; } = string.Empty;
        public string UserId { get; set; } = string.Empty;
        public DateTime Timestamp { get; set; }
        public bool IsCompliant { get; set; }
        public List<ModerationViolation> Violations { get; set; } = new();
        public string? Error { get; set; }
    }

    public class AutomatedActionResult
    {
        public ModerationViolation Violation { get; set; } = new();
        public DateTime Timestamp { get; set; }
        public ModerationAction ActionTaken { get; set; }
        public bool Success { get; set; }
        public string Description { get; set; } = string.Empty;
        public string? Error { get; set; }
    }

    public class ModerationViolation
    {
        public ViolationType Type { get; set; }
        public ViolationSeverity Severity { get; set; }
        public string Description { get; set; } = string.Empty;
        public double Confidence { get; set; }
        public ModerationAction SuggestedAction { get; set; }
        public bool IsViolation => Confidence > 0.5;
    }

    public class ContentSuggestion
    {
        public SuggestionType Type { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public SuggestionPriority Priority { get; set; }
    }

    public class QualityFactor
    {
        public string Name { get; set; } = string.Empty;
        public double Score { get; set; }
        public string Description { get; set; } = string.Empty;
    }

    public class ImageAnalysisResult
    {
        public bool ContainsInappropriateContent { get; set; }
        public bool ContainsViolence { get; set; }
        public double Confidence { get; set; }
    }

    public enum ViolationType
    {
        InappropriateContent,
        InappropriateImage,
        Spam,
        Violence,
        HateSpeech,
        Harassment,
        AgeInappropriate,
        NegativeSentiment,
        CopyrightViolation,
        PrivacyViolation
    }

    public enum ViolationSeverity
    {
        Low,
        Medium,
        High,
        Critical
    }

    public enum ModerationAction
    {
        None,
        Warn,
        Flag,
        Hide,
        Block,
        Delete,
        Ban
    }

    public enum SuggestionType
    {
        Improvement,
        Hashtag,
        Engagement,
        Content,
        Style
    }

    public enum SuggestionPriority
    {
        Low,
        Medium,
        High
    }
}
