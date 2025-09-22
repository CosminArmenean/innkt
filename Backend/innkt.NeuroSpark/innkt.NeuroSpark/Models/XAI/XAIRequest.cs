namespace innkt.NeuroSpark.Models.XAI;

public class XAIRequest
{
    public string Model { get; set; } = "grok-beta";
    public List<XAIMessage> Messages { get; set; } = new();
    public int MaxTokens { get; set; } = 500;
    public double Temperature { get; set; } = 0.7;
    public bool Stream { get; set; } = false;
}

public class XAIMessage
{
    public string Role { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
}

public class XAIResponse
{
    public string Id { get; set; } = string.Empty;
    public string Object { get; set; } = string.Empty;
    public long Created { get; set; }
    public string Model { get; set; } = string.Empty;
    public List<XAIChoice> Choices { get; set; } = new();
    public XAIUsage Usage { get; set; } = new();
}

public class XAIChoice
{
    public int Index { get; set; }
    public XAIMessage Message { get; set; } = new();
    public string FinishReason { get; set; } = string.Empty;
}

public class XAIUsage
{
    public int PromptTokens { get; set; }
    public int CompletionTokens { get; set; }
    public int TotalTokens { get; set; }
}
