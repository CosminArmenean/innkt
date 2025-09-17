import React, { useState } from 'react';
import { socialService, Post } from '../../services/social.service';
import { ChartBarIcon, PlusIcon, XMarkIcon, ClockIcon } from '@heroicons/react/24/outline';

interface GroupPollProps {
  groupId: string;
  groupName: string;
  onPollCreated?: (post: Post) => void;
  className?: string;
}

interface PollOption {
  id: string;
  text: string;
}

const GroupPoll: React.FC<GroupPollProps> = ({
  groupId,
  groupName,
  onPollCreated,
  className = ''
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState<PollOption[]>([
    { id: '1', text: '' },
    { id: '2', text: '' }
  ]);
  const [duration, setDuration] = useState('7'); // days
  const [isLoading, setIsLoading] = useState(false);

  const addOption = () => {
    if (options.length < 10) {
      const newId = (options.length + 1).toString();
      setOptions(prev => [...prev, { id: newId, text: '' }]);
    }
  };

  const removeOption = (id: string) => {
    if (options.length > 2) {
      setOptions(prev => prev.filter(option => option.id !== id));
    }
  };

  const updateOption = (id: string, text: string) => {
    setOptions(prev => prev.map(option => 
      option.id === id ? { ...option, text } : option
    ));
  };

  const handleSubmit = async () => {
    if (!question.trim()) {
      alert('Please enter a poll question');
      return;
    }

    const validOptions = options.filter(option => option.text.trim());
    if (validOptions.length < 2) {
      alert('Please provide at least 2 poll options');
      return;
    }

    setIsLoading(true);
    try {
      const pollContent = `📊 **${question.trim()}**\n\n${validOptions.map((option, index) => 
        `${index + 1}. ${option.text.trim()}`
      ).join('\n')}\n\n⏰ Poll duration: ${duration} days`;

      const postData = {
        content: pollContent,
        postType: 'poll' as const,
        visibility: 'group' as const,
        groupId: groupId,
        tags: ['poll', 'survey']
      };

      const newPost = await socialService.createPost(postData);
      
      // Reset form
      setQuestion('');
      setOptions([
        { id: '1', text: '' },
        { id: '2', text: '' }
      ]);
      setDuration('7');
      setIsCreating(false);
      
      if (onPollCreated) {
        onPollCreated(newPost);
      }
    } catch (error) {
      console.error('Failed to create poll:', error);
      alert('Failed to create poll. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-4 ${className}`}>
      {!isCreating ? (
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
              <ChartBarIcon className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900">Create Poll</h3>
              <p className="text-sm text-gray-600">Ask the group a question</p>
            </div>
          </div>
          
          <button
            onClick={() => setIsCreating(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <ChartBarIcon className="w-4 h-4" />
            <span>Create Poll</span>
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <ChartBarIcon className="w-5 h-5 text-blue-600" />
              <h3 className="font-medium text-gray-900">New Poll</h3>
            </div>
            <button
              onClick={() => {
                setIsCreating(false);
                setQuestion('');
                setOptions([
                  { id: '1', text: '' },
                  { id: '2', text: '' }
                ]);
                setDuration('7');
              }}
              className="p-1 text-gray-400 hover:text-gray-600"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>
          
          {/* Poll Question */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Poll Question *
            </label>
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="What would you like to ask the group?"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          {/* Poll Options */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Options *
            </label>
            <div className="space-y-2">
              {options.map((option, index) => (
                <div key={option.id} className="flex items-center space-x-2">
                  <span className="text-sm text-gray-500 w-6">{index + 1}.</span>
                  <input
                    type="text"
                    value={option.text}
                    onChange={(e) => updateOption(option.id, e.target.value)}
                    placeholder={`Option ${index + 1}`}
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  {options.length > 2 && (
                    <button
                      onClick={() => removeOption(option.id)}
                      className="p-1 text-red-500 hover:text-red-700"
                    >
                      <XMarkIcon className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            
            {options.length < 10 && (
              <button
                onClick={addOption}
                className="mt-2 flex items-center space-x-2 text-blue-600 hover:text-blue-700 text-sm"
              >
                <PlusIcon className="w-4 h-4" />
                <span>Add Option</span>
              </button>
            )}
          </div>
          
          {/* Poll Duration */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Poll Duration
            </label>
            <div className="flex items-center space-x-2">
              <ClockIcon className="w-4 h-4 text-gray-500" />
              <select
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="1">1 day</option>
                <option value="3">3 days</option>
                <option value="7">1 week</option>
                <option value="14">2 weeks</option>
                <option value="30">1 month</option>
              </select>
            </div>
          </div>
          
          <div className="flex items-center justify-between pt-4 border-t border-gray-200">
            <div className="text-sm text-gray-500">
              📊 This will be posted as a poll in {groupName}
            </div>
            
            <div className="flex space-x-2">
              <button
                onClick={() => {
                  setIsCreating(false);
                  setQuestion('');
                  setOptions([
                    { id: '1', text: '' },
                    { id: '2', text: '' }
                  ]);
                  setDuration('7');
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={isLoading || !question.trim() || options.filter(o => o.text.trim()).length < 2}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? 'Creating...' : 'Create Poll'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GroupPoll;
