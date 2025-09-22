using innkt.Social.DTOs;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace innkt.Social.Services;

public interface IGrokService
{
    Task<GrokResponseDto> ProcessGrokRequestAsync(GrokRequestDto request, Guid userId);
    Task<GrokResponseDto?> GetGrokStatusAsync(string requestId, Guid userId);
    Task ProcessCompletedGrokResponseAsync(string requestId, string response);
}
