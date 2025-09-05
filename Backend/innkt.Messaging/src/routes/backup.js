const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();

// Create full backup
router.post('/full', authenticateToken, async (req, res) => {
  try {
    const { backupName } = req.body;

    if (!global.backupService) {
      return res.status(503).json({ error: 'Backup service not available' });
    }

    const backup = await global.backupService.createFullBackup(backupName);

    res.status(201).json({ backup });

  } catch (error) {
    logger.error('Error creating full backup:', error);
    res.status(500).json({ error: 'Failed to create full backup' });
  }
});

// Create incremental backup
router.post('/incremental', authenticateToken, async (req, res) => {
  try {
    const { lastBackupId, backupName } = req.body;

    if (!lastBackupId) {
      return res.status(400).json({ error: 'Last backup ID is required' });
    }

    if (!global.backupService) {
      return res.status(503).json({ error: 'Backup service not available' });
    }

    const backup = await global.backupService.createIncrementalBackup(lastBackupId, backupName);

    res.status(201).json({ backup });

  } catch (error) {
    logger.error('Error creating incremental backup:', error);
    res.status(500).json({ error: 'Failed to create incremental backup' });
  }
});

// List all backups
router.get('/', authenticateToken, async (req, res) => {
  try {
    if (!global.backupService) {
      return res.status(503).json({ error: 'Backup service not available' });
    }

    const backups = await global.backupService.listBackups();

    res.json({ backups });

  } catch (error) {
    logger.error('Error listing backups:', error);
    res.status(500).json({ error: 'Failed to list backups' });
  }
});

// Get backup details
router.get('/:backupId', authenticateToken, async (req, res) => {
  try {
    const { backupId } = req.params;

    if (!global.backupService) {
      return res.status(503).json({ error: 'Backup service not available' });
    }

    const backup = await global.backupService.getBackupMetadata(backupId);

    if (!backup) {
      return res.status(404).json({ error: 'Backup not found' });
    }

    res.json({ backup });

  } catch (error) {
    logger.error('Error getting backup details:', error);
    res.status(500).json({ error: 'Failed to get backup details' });
  }
});

// Restore from backup
router.post('/:backupId/restore', authenticateToken, async (req, res) => {
  try {
    const { backupId } = req.params;
    const { targetPath } = req.body;

    if (!global.backupService) {
      return res.status(503).json({ error: 'Backup service not available' });
    }

    const restore = await global.backupService.restoreFromBackup(backupId, targetPath);

    res.json({ restore });

  } catch (error) {
    logger.error('Error restoring from backup:', error);
    res.status(500).json({ error: 'Failed to restore from backup' });
  }
});

// Delete backup
router.delete('/:backupId', authenticateToken, async (req, res) => {
  try {
    const { backupId } = req.params;

    if (!global.backupService) {
      return res.status(503).json({ error: 'Backup service not available' });
    }

    await global.backupService.deleteBackup(backupId);

    res.json({ message: 'Backup deleted successfully' });

  } catch (error) {
    logger.error('Error deleting backup:', error);
    res.status(500).json({ error: 'Failed to delete backup' });
  }
});

// Clean up old backups
router.post('/cleanup', authenticateToken, async (req, res) => {
  try {
    const { keepCount = 10 } = req.body;

    if (!global.backupService) {
      return res.status(503).json({ error: 'Backup service not available' });
    }

    await global.backupService.cleanupOldBackups(keepCount);

    res.json({ message: 'Old backups cleaned up successfully' });

  } catch (error) {
    logger.error('Error cleaning up old backups:', error);
    res.status(500).json({ error: 'Failed to clean up old backups' });
  }
});

module.exports = router;

