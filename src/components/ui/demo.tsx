import React from 'react';
import { CardComment } from './card-comment';

const sampleComments = [
  {
    id: '1',
    author: {
      name: 'Alice Johnson',
      role: 'Security Admin'
    },
    content: 'This account has been successfully validated and is ready for production use. All security requirements have been met.',
    timestamp: '2 hours ago',
    likes: 5,
    replies: 2,
    isLiked: false
  },
  {
    id: '2',
    author: {
      name: 'Bob Smith',
      role: 'DevOps Engineer'
    },
    content: 'I noticed some intermittent connectivity issues with this account. Might need to check the network configuration.',
    timestamp: '4 hours ago',
    likes: 3,
    replies: 1,
    isLiked: true
  },
  {
    id: '3',
    author: {
      name: 'Carol Williams',
      role: 'Compliance Officer'
    },
    content: 'Password rotation completed successfully. Next rotation scheduled for next month according to our security policy.',
    timestamp: '1 day ago',
    likes: 8,
    replies: 0,
    isLiked: false
  }
];

export const CardCommentDemo: React.FC = () => {
  return (
    <div className="max-w-2xl mx-auto p-6 space-y-4">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Card Comment Component Demo</h2>
        <p className="text-gray-600">
          Interactive comment cards with hover effects, like functionality, and smooth animations.
        </p>
      </div>

      <div className="space-y-4">
        {sampleComments.map((comment) => (
          <CardComment 
            key={comment.id} 
            comment={comment}
            className="transition-all duration-300"
          />
        ))}
      </div>

      <div className="mt-8 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Features</h3>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• Smooth hover animations with Framer Motion</li>
          <li>• Interactive like button with state management</li>
          <li>• Role-based badges for user identification</li>
          <li>• Responsive design with Tailwind CSS</li>
          <li>• Action buttons that appear on hover</li>
          <li>• Gradient avatars for users without profile pictures</li>
        </ul>
      </div>
    </div>
  );
};

export default CardCommentDemo;
