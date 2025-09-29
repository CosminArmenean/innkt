using Microsoft.AspNetCore.Mvc;
using innkt.Groups.DTOs;
using innkt.Groups.Services;

namespace innkt.Groups.Controllers
{
    [ApiController]
    [Route("api/groups/{groupId}/topics")]
    public class TopicController : ControllerBase
    {
        private readonly ITopicService _topicService;

        public TopicController(ITopicService topicService)
        {
            _topicService = topicService;
        }

        /// <summary>
        /// Get all topics for a group
        /// </summary>
        [HttpGet]
        public async Task<ActionResult<List<TopicResponse>>> GetGroupTopics(Guid groupId, [FromQuery] Guid? subgroupId = null)
        {
            try
            {
                var topics = await _topicService.GetGroupTopicsAsync(groupId, subgroupId);
                return Ok(topics);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        /// <summary>
        /// Get a specific topic by ID
        /// </summary>
        [HttpGet("{topicId}")]
        public async Task<ActionResult<TopicResponse>> GetTopic(Guid groupId, Guid topicId)
        {
            try
            {
                var topic = await _topicService.GetTopicAsync(groupId, topicId);
                if (topic == null)
                    return NotFound();

                return Ok(topic);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        /// <summary>
        /// Create a new topic
        /// </summary>
        [HttpPost]
        public async Task<ActionResult<TopicResponse>> CreateTopic(Guid groupId, CreateTopicRequest request)
        {
            try
            {
                var userId = GetCurrentUserId();
                var topic = await _topicService.CreateTopicAsync(groupId, userId, request);
                return CreatedAtAction(nameof(GetTopic), new { groupId, topicId = topic.Id }, topic);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        /// <summary>
        /// Update an existing topic
        /// </summary>
        [HttpPut("{topicId}")]
        public async Task<ActionResult<TopicResponse>> UpdateTopic(Guid groupId, Guid topicId, UpdateTopicRequest request)
        {
            try
            {
                var userId = GetCurrentUserId();
                var topic = await _topicService.UpdateTopicAsync(groupId, topicId, userId, request);
                return Ok(topic);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        /// <summary>
        /// Delete a topic
        /// </summary>
        [HttpDelete("{topicId}")]
        public async Task<ActionResult> DeleteTopic(Guid groupId, Guid topicId)
        {
            try
            {
                var userId = GetCurrentUserId();
                await _topicService.DeleteTopicAsync(groupId, topicId, userId);
                return NoContent();
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        /// <summary>
        /// Archive a topic
        /// </summary>
        [HttpPost("{topicId}/archive")]
        public async Task<ActionResult<TopicResponse>> ArchiveTopic(Guid groupId, Guid topicId)
        {
            try
            {
                var userId = GetCurrentUserId();
                var topic = await _topicService.ArchiveTopicAsync(groupId, topicId, userId);
                return Ok(topic);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        /// <summary>
        /// Unarchive a topic
        /// </summary>
        [HttpPost("{topicId}/unarchive")]
        public async Task<ActionResult<TopicResponse>> UnarchiveTopic(Guid groupId, Guid topicId)
        {
            try
            {
                var userId = GetCurrentUserId();
                var topic = await _topicService.UnarchiveTopicAsync(groupId, topicId, userId);
                return Ok(topic);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        /// <summary>
        /// Pin a topic
        /// </summary>
        [HttpPost("{topicId}/pin")]
        public async Task<ActionResult<TopicResponse>> PinTopic(Guid groupId, Guid topicId)
        {
            try
            {
                var userId = GetCurrentUserId();
                var topic = await _topicService.PinTopicAsync(groupId, topicId, userId);
                return Ok(topic);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        /// <summary>
        /// Unpin a topic
        /// </summary>
        [HttpPost("{topicId}/unpin")]
        public async Task<ActionResult<TopicResponse>> UnpinTopic(Guid groupId, Guid topicId)
        {
            try
            {
                var userId = GetCurrentUserId();
                var topic = await _topicService.UnpinTopicAsync(groupId, topicId, userId);
                return Ok(topic);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        /// <summary>
        /// Set topic permissions for a role
        /// </summary>
        [HttpPost("{topicId}/permissions")]
        public async Task<ActionResult<TopicPermissionResponse>> SetTopicPermissions(Guid groupId, Guid topicId, TopicPermissionRequest request)
        {
            try
            {
                var userId = GetCurrentUserId();
                var permission = await _topicService.SetTopicPermissionsAsync(groupId, topicId, userId, request);
                return Ok(permission);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        /// <summary>
        /// Get topic permissions
        /// </summary>
        [HttpGet("{topicId}/permissions")]
        public async Task<ActionResult<List<TopicPermissionResponse>>> GetTopicPermissions(Guid groupId, Guid topicId)
        {
            try
            {
                var permissions = await _topicService.GetTopicPermissionsAsync(groupId, topicId);
                return Ok(permissions);
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
