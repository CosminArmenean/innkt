SELECT p."Id", p."CommentsCount", p."Content", p."CreatedAt", p."Hashtags", p."IsPinned", p."IsPublic", p."LikesCount", p."Location", p."MediaUrls", p."Mentions", p."PollDuration", p."PollExpiresAt", p."PollOptions", p."PostType", p."SharesCount", p."UpdatedAt", p."UserId", p."ViewsCount"
FROM public."Posts" AS p
WHERE p."UserId" = 'c2a81b3c-c84e-4a0c-a5ff-9d19eb883514' AND p."IsPublic"
ORDER BY p."CreatedAt" DESC
LIMIT 10 OFFSET 0;
