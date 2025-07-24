import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card } from './Card';
import { Badge } from './Badge';
import { Button } from './Button';
import { 
  MessageCircle, 
  Heart, 
  Share, 
  MoreHorizontal,
  User,
  Clock
} from 'lucide-react';

interface Comment {
  id: string;
  author: {
    name: string;
    avatar?: string;
    role?: string;
  };
  content: string;
  timestamp: string;
  likes: number;
  replies?: number;
  isLiked?: boolean;
}

interface CardCommentProps {
  comment: Comment;
  className?: string;
}

export const CardComment: React.FC<CardCommentProps> = ({ 
  comment,
  className = ""
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isLiked, setIsLiked] = useState(comment.isLiked || false);
  const [likesCount, setLikesCount] = useState(comment.likes);

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsLiked(!isLiked);
    setLikesCount(prev => isLiked ? prev - 1 : prev + 1);
  };

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Implement share functionality
    console.log('Share comment:', comment.id);
  };

  const handleMore = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Implement more options
    console.log('More options for comment:', comment.id);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className={`group cursor-pointer ${className}`}
    >
      <Card className="p-4 transition-all duration-300 hover:shadow-lg hover:shadow-blue-100/50 border border-gray-200 hover:border-blue-300">
        <div className="flex space-x-3">
          {/* Avatar */}
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-medium">
              {comment.author.avatar ? (
                <img 
                  src={comment.author.avatar} 
                  alt={comment.author.name}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <User className="w-5 h-5" />
              )}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <h4 className="text-sm font-semibold text-gray-900">
                  {comment.author.name}
                </h4>
                {comment.author.role && (
                  <Badge variant="info" className="text-xs">
                    {comment.author.role}
                  </Badge>
                )}
                <div className="flex items-center text-xs text-gray-500">
                  <Clock className="w-3 h-3 mr-1" />
                  {comment.timestamp}
                </div>
              </div>
              
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: isHovered ? 1 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleMore}
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </motion.div>
            </div>

            {/* Comment Content */}
            <motion.div
              initial={{ height: "auto" }}
              animate={{ height: "auto" }}
              className="mt-2"
            >
              <p className="text-sm text-gray-700 leading-relaxed">
                {comment.content}
              </p>
            </motion.div>

            {/* Actions */}
            <motion.div 
              initial={{ opacity: 0.7 }}
              animate={{ opacity: isHovered ? 1 : 0.7 }}
              className="flex items-center space-x-4 mt-3"
            >
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleLike}
                className={`flex items-center space-x-1 text-xs transition-colors ${
                  isLiked 
                    ? 'text-red-500 hover:text-red-600' 
                    : 'text-gray-500 hover:text-red-500'
                }`}
              >
                <Heart 
                  className={`w-4 h-4 transition-all ${
                    isLiked ? 'fill-current' : ''
                  }`} 
                />
                <span>{likesCount}</span>
              </motion.button>

              {comment.replies && comment.replies > 0 && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center space-x-1 text-xs text-gray-500 hover:text-blue-500 transition-colors"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>{comment.replies}</span>
                </motion.button>
              )}

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleShare}
                className="flex items-center space-x-1 text-xs text-gray-500 hover:text-blue-500 transition-colors"
              >
                <Share className="w-4 h-4" />
                <span>Share</span>
              </motion.button>
            </motion.div>
          </div>
        </div>

        {/* Hover Effect Overlay */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: isHovered ? 1 : 0 }}
          transition={{ duration: 0.3 }}
          className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-blue-500 to-purple-600 origin-left"
        />
      </Card>
    </motion.div>
  );
};

export default CardComment;
