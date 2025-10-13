import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { kinderService, MaturityScore } from '../../services/kinder.service';

interface MaturityAssessmentPanelProps {
  kidAccountId: string;
  parentId: string;
  kidName: string;
  kidAge: number;
}

const MaturityAssessmentPanel: React.FC<MaturityAssessmentPanelProps> = ({
  kidAccountId,
  parentId,
  kidName,
  kidAge
}) => {
  const { t } = useTranslation();
  const [maturityScore, setMaturityScore] = useState<MaturityScore | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [parentRating, setParentRating] = useState(0);
  const [assessmentNotes, setAssessmentNotes] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadMaturityScore();
  }, [kidAccountId]);

  const loadMaturityScore = async () => {
    try {
      const score = await kinderService.getMaturityScore(kidAccountId);
      setMaturityScore(score);
      setParentRating(score.parentRating);
    } catch (err) {
      console.error('Error loading maturity score:', err);
    }
  };

  const handleUpdateAssessment = async () => {
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const updatedScore = await kinderService.updateParentAssessment(kidAccountId, {
        parentId,
        rating: parentRating,
        notes: assessmentNotes || undefined
      });

      setMaturityScore(updatedScore);
      setSuccess('Assessment updated successfully!');
      setAssessmentNotes('');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update assessment');
    } finally {
      setIsLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-green-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-blue-600';
  };

  const getLevelBadge = (level: string) => {
    const colors = {
      high: 'bg-green-100 text-green-800',
      medium: 'bg-yellow-100 text-yellow-800',
      low: 'bg-blue-100 text-blue-800'
    };
    return colors[level as keyof typeof colors] || colors.low;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900">Maturity Assessment</h3>
        <p className="text-sm text-gray-600">Evaluate {kidName}'s maturity and responsibility</p>
      </div>

      {/* Messages */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {success && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-700 text-sm">{success}</p>
        </div>
      )}

      {/* Score Overview */}
      {maturityScore && (
        <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg p-6">
          <div className="text-center mb-4">
            <div className={`text-5xl font-bold ${getScoreColor(maturityScore.totalScore)}`}>
              {maturityScore.totalScore}
              <span className="text-2xl text-gray-400">/100</span>
            </div>
            <div className="mt-2">
              <span className={`px-4 py-2 rounded-full text-sm font-medium ${getLevelBadge(maturityScore.level)}`}>
                {maturityScore.level.toUpperCase()} MATURITY
              </span>
            </div>
          </div>

          {/* Score Breakdown */}
          <div className="grid grid-cols-3 gap-4 mt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{maturityScore.ageScore}</div>
              <div className="text-xs text-gray-600">Age Score</div>
              <div className="text-xs text-gray-500">(0-40)</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{maturityScore.parentAssessment}</div>
              <div className="text-xs text-gray-600">Parent Rating</div>
              <div className="text-xs text-gray-500">(0-30)</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{maturityScore.behavioralScore}</div>
              <div className="text-xs text-gray-600">Behavioral</div>
              <div className="text-xs text-gray-500">(0-30)</div>
            </div>
          </div>
        </div>
      )}

      {/* Behavioral Metrics */}
      {maturityScore && (
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-gray-900">Behavioral Metrics</h4>
          
          {[
            { label: 'Time Management', value: maturityScore.timeManagement },
            { label: 'Content Appropriateness', value: maturityScore.contentAppropriateness },
            { label: 'Social Interaction', value: maturityScore.socialInteraction },
            { label: 'Responsibility', value: maturityScore.responsibilityScore },
            { label: 'Security Awareness', value: maturityScore.securityAwareness }
          ].map((metric) => (
            <div key={metric.label}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-gray-600">{metric.label}</span>
                <span className="text-sm font-medium text-gray-900">{Math.round(metric.value)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${
                    metric.value >= 70 ? 'bg-green-500' :
                    metric.value >= 40 ? 'bg-yellow-500' :
                    'bg-blue-500'
                  }`}
                  style={{ width: `${metric.value}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Parent Assessment */}
      <div className="space-y-4 border-t border-gray-200 pt-6">
        <h4 className="text-sm font-semibold text-gray-900">Your Assessment</h4>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Rate {kidName}'s Overall Maturity (0-5 stars)
          </label>
          <div className="flex items-center space-x-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => setParentRating(star)}
                className={`text-3xl transition-colors ${
                  star <= parentRating ? 'text-yellow-400' : 'text-gray-300'
                } hover:text-yellow-500`}
              >
                ★
              </button>
            ))}
            <span className="ml-2 text-sm text-gray-600">
              {parentRating}/5 = {parentRating * 6} points
            </span>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Assessment Notes (Optional)
          </label>
          <textarea
            value={assessmentNotes}
            onChange={(e) => setAssessmentNotes(e.target.value)}
            placeholder="Add notes about your kid's behavior and maturity..."
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>

        <button
          onClick={handleUpdateAssessment}
          disabled={isLoading}
          className="w-full bg-purple-600 text-white py-3 px-4 rounded-lg hover:bg-purple-700 transition-colors font-medium disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Updating...' : 'Update Assessment'}
        </button>
      </div>

      {/* Maturity Level Explanation */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-blue-900 mb-2">What This Means:</h4>
        <ul className="text-sm text-blue-700 space-y-1">
          {maturityScore?.level === 'low' && (
            <>
              <li>• QR code login only (no password)</li>
              <li>• Login codes expire in 7 days</li>
              <li>• Strict parental controls</li>
            </>
          )}
          {maturityScore?.level === 'medium' && (
            <>
              <li>• Can use QR code OR password</li>
              <li>• Login codes expire in 30 days</li>
              <li>• Parent notified of password changes</li>
            </>
          )}
          {maturityScore?.level === 'high' && (
            <>
              <li>• Password primary authentication</li>
              <li>• Login codes expire in 90 days</li>
              <li>• Full autonomy (near independence)</li>
            </>
          )}
        </ul>
      </div>
    </div>
  );
};

export default MaturityAssessmentPanel;

