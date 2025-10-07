# Documentation Update Rule

## Purpose
This file defines an automatic rule for updating project documentation when milestones are achieved.

## Rule
When significant work is completed or a milestone is achieved, the AI assistant should:

1. **Ask the user**: "Would you like me to update the project documentation files?"
2. **Wait for confirmation**: User responds "yes" or "no"
3. **If yes**: Update the following documentation files based on the work completed

## Documentation Files to Update

### 1. **SERVICE_ARCHITECTURE_ANALYSIS.md**
- Update when: New services are added, service dependencies change, or architecture patterns are modified
- What to update: Service relationships, communication patterns, technology stack changes

### 2. **FEATURES_CHANGELOG.md**
- Update when: New features are implemented, existing features are enhanced, or bugs are fixed
- What to update: Add new entries with date, feature name, description, and impact

### 3. **FINAL_PLATFORM_READINESS_REPORT.md**
- Update when: Major milestones are completed, system capabilities change, or deployment readiness changes
- What to update: Platform status, completed features, pending items, deployment readiness checklist

### 4. **Additional Documentation**
- **PLATFORM_STATUS_SUMMARY.md**: Overall system health and status
- **SERVICE_STATUS_REPORT.md**: Individual service status and health
- **NEXT_PHASE_ROADMAP.md**: Future work and priorities

## Trigger Conditions for Updates

Update documentation when:
- ✅ A major feature is completed
- ✅ Service architecture changes are made
- ✅ New services or components are added
- ✅ Integration between services is modified
- ✅ Database schema changes are made
- ✅ API endpoints are added or modified
- ✅ Performance improvements are implemented
- ✅ Security enhancements are added

## Update Process

1. **Detect Milestone**: AI identifies when significant work is completed
2. **Prompt User**: 
   ```
   📝 Documentation Update Reminder
   
   We've completed [MILESTONE_NAME]. This affects:
   - [FILE_1]
   - [FILE_2]
   - [FILE_3]
   
   Would you like me to update these documentation files now? (yes/no)
   ```
3. **If User Says Yes**: 
   - Update each affected file
   - Show summary of changes made
   - Commit documentation updates with descriptive message
4. **If User Says No**:
   - Skip documentation update
   - Continue with next task

## Example Usage

```
Assistant: 📝 Documentation Update Reminder

We've just completed the Kafka-based microservices architecture implementation.

This affects:
- SERVICE_ARCHITECTURE_ANALYSIS.md (service communication changes)
- FEATURES_CHANGELOG.md (event-driven notifications)
- FINAL_PLATFORM_READINESS_REPORT.md (architecture improvements)

Would you like me to update these documentation files now?

User: yes
