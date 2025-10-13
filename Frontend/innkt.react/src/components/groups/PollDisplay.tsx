import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { groupsService, PollResponse, PollOptionResult } from '../../services/groups.service';
import { ChartBarIcon, ClockIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

interface PollDisplayProps {
  poll: PollResponse;
  onVote?: (pollId: string, optionIndex: number) => void;
  className?: string;
}

const PollDisplay: React.FC<PollDisplayProps> = ({
  poll,
  onVote,
  className = ''
}) => {
  const { t } = useTranslation();
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isVoting, setIsVoting] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<string>('');

  useEffect(() => {
    // Calculate time remaining
    const updateTimeRemaining = () => {
      const now = new Date();
      const expiresAt = new Date(poll.expiresAt);
      const diff = expiresAt.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeRemaining(t('messaging.pollExpired'));
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      if (days > 0) {
        setTimeRemaining(t('messaging.daysHoursMinutesRemaining', { days, hours, minutes }));
      } else if (hours > 0) {
        setTimeRemaining(t('messaging.hoursMinutesRemaining', { hours, minutes }));
      } else {
        setTimeRemaining(t('messaging.minutesRemaining', { minutes }));
      }
    };

    updateTimeRemaining();
    const interval = setInterval(updateTimeRemaining, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [poll.expiresAt]);

  const handleVote = async (optionIndex: number) => {
    if (poll.hasUserVoted || !poll.isActive) {
      return;
    }

    setIsVoting(true);
    try {
      await groupsService.votePoll(poll.id, optionIndex);
      setSelectedOption(optionIndex);
      if (onVote) {
        onVote(poll.id, optionIndex);
      }
    } catch (error) {
      console.error('Failed to vote on poll:', error);
      alert('Failed to vote on poll. Please try again.');
    } finally {
      setIsVoting(false);
    }
  };

  const getOptionPercentage = (optionIndex: number): number => {
    if (poll.totalVotes === 0) return 0;
    const optionResult = poll.optionResults.find(r => r.optionIndex === optionIndex);
    return optionResult ? optionResult.percentage : 0;
  };

  const getOptionVoteCount = (optionIndex: number): number => {
    const optionResult = poll.optionResults.find(r => r.optionIndex === optionIndex);
    return optionResult ? optionResult.voteCount : 0;
  };

  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-6 ${className}`}>
      {/* Poll Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
            <ChartBarIcon className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="font-medium text-gray-900">Poll</h3>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <ClockIcon className="w-4 h-4" />
              <span>{timeRemaining}</span>
            </div>
          </div>
        </div>
        
        <div className="text-right">
          <div className="text-sm text-gray-500">
            {poll.totalVotes} vote{poll.totalVotes !== 1 ? 's' : ''}
          </div>
          <div className="text-xs text-gray-400">
            {poll.allowMultipleVotes ? 'Multiple votes allowed' : 'Single vote only'}
          </div>
        </div>
      </div>

      {/* Poll Question */}
      <div className="mb-6">
        <h4 className="text-lg font-medium text-gray-900 mb-2">{poll.question}</h4>
      </div>

      {/* Poll Options */}
      <div className="space-y-3">
        {poll.options.map((option, index) => {
          const percentage = getOptionPercentage(index);
          const voteCount = getOptionVoteCount(index);
          const isSelected = poll.hasUserVoted && poll.userVoteIndex === index;
          const canVote = !poll.hasUserVoted && poll.isActive && !isVoting;

          return (
            <div key={index} className="relative">
              <button
                onClick={() => handleVote(index)}
                disabled={!canVote}
                className={`w-full text-left p-4 rounded-lg border-2 transition-all duration-200 ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50'
                    : canVote
                    ? 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    : 'border-gray-200 bg-gray-50 cursor-not-allowed'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {isSelected && (
                      <CheckCircleIcon className="w-5 h-5 text-blue-600" />
                    )}
                    <span className="font-medium text-gray-900">{option}</span>
                  </div>
                  
                  {poll.hasUserVoted && (
                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-900">
                        {voteCount} vote{voteCount !== 1 ? 's' : ''}
                      </div>
                      <div className="text-sm text-gray-500">
                        {percentage.toFixed(1)}%
                      </div>
                    </div>
                  )}
                </div>

                {/* Progress Bar */}
                {poll.hasUserVoted && (
                  <div className="mt-3">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                )}
              </button>
            </div>
          );
        })}
      </div>

      {/* Poll Footer */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between text-sm text-gray-500">
          <div>
            {poll.allowKidVoting && (
              <span className="inline-block px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs mr-2">
                Kids can vote
              </span>
            )}
            {poll.allowParentVotingForKid && (
              <span className="inline-block px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs">
                Parents can vote for kids
              </span>
            )}
          </div>
          
          <div>
            Created {new Date(poll.createdAt).toLocaleDateString()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PollDisplay;

