import { DotLoader } from "./DotLoader";

// Lock animation frames showing a lock being secured
const lockSecuringAnimation = [
    // Frame 1: Empty grid
    [],
    
    // Frame 2: Lock outline starts to form
    [17, 18, 19],
    
    // Frame 3: Lock shackle top part
    [17, 18, 19, 10, 12],
    
    // Frame 4: Complete shackle outline
    [10, 12, 17, 18, 19],
    
    // Frame 5: Lock body outline starts
    [10, 12, 17, 18, 19, 23, 25],
    
    // Frame 6: Lock body complete outline
    [10, 12, 17, 18, 19, 23, 25, 30, 36],
    
    // Frame 7: Lock body fills in
    [10, 12, 17, 18, 19, 23, 24, 25, 30, 31, 32, 33, 34, 35, 36],
    
    // Frame 8: Keyhole appears
    [10, 12, 17, 18, 19, 23, 24, 25, 30, 31, 32, 33, 34, 35, 36, 32],
    
    // Frame 9: Lock secured - full illumination
    [10, 12, 17, 18, 19, 23, 24, 25, 30, 31, 32, 33, 34, 35, 36],
    
    // Frame 10: Security confirmation pulse
    [9, 10, 11, 12, 13, 16, 17, 18, 19, 20, 22, 23, 24, 25, 26, 29, 30, 31, 32, 33, 34, 35, 36, 37],
    
    // Frame 11: Return to stable lock
    [10, 12, 17, 18, 19, 23, 24, 25, 30, 31, 32, 33, 34, 35, 36],
    
    // Frame 12: Final secure state
    [10, 12, 17, 18, 19, 23, 24, 25, 30, 31, 32, 33, 34, 35, 36],
];

// Simpler loading dots animation
const dotLoadingAnimation = [
    [24],
    [24, 25],
    [24, 25, 26],
    [25, 26, 27],
    [26, 27, 28],
    [27, 28],
    [28],
    [],
];

// Circular loading animation
const circularLoadingAnimation = [
    [17], // Top
    [17, 24], // Top-right
    [17, 24, 25], // Right
    [24, 25, 32], // Bottom-right
    [25, 32, 31], // Bottom
    [32, 31, 24], // Bottom-left
    [31, 24, 23], // Left
    [24, 23, 16], // Top-left
    [23, 16, 17], // Back to top
];

export interface LockAnimationProps {
    variant?: 'lock' | 'dots' | 'circular';
    size?: 'sm' | 'md' | 'lg';
    className?: string;
    text?: string;
}

export const LockAnimation = ({ 
    variant = 'lock', 
    size = 'md',
    className = '',
    text 
}: LockAnimationProps) => {
    const sizeConfig = {
        sm: {
            dotSize: 'size-1',
            gap: 'gap-0.5',
            duration: 300,
            textSize: 'text-sm'
        },
        md: {
            dotSize: 'size-1.5',
            gap: 'gap-0.5',
            duration: 400,
            textSize: 'text-base'
        },
        lg: {
            dotSize: 'size-2',
            gap: 'gap-1',
            duration: 500,
            textSize: 'text-lg'
        }
    };

    const config = sizeConfig[size];

    const getAnimation = () => {
        switch (variant) {
            case 'lock':
                return lockSecuringAnimation;
            case 'dots':
                return dotLoadingAnimation;
            case 'circular':
                return circularLoadingAnimation;
            default:
                return lockSecuringAnimation;
        }
    };

    const getColors = () => {
        switch (variant) {
            case 'lock':
                return 'bg-blue-500/20 [&.active]:bg-blue-500 [&.active]:shadow-lg [&.active]:shadow-blue-500/50';
            case 'dots':
                return 'bg-cyan-500/20 [&.active]:bg-cyan-400';
            case 'circular':
                return 'bg-purple-500/20 [&.active]:bg-purple-500';
            default:
                return 'bg-blue-500/20 [&.active]:bg-blue-500';
        }
    };

    const getText = () => {
        switch (variant) {
            case 'lock':
                return text || 'Securing Vault...';
            case 'dots':
                return text || 'Loading...';
            case 'circular':
                return text || 'Processing...';
            default:
                return text || 'Loading...';
        }
    };

    return (
        <div className={`flex flex-col items-center justify-center space-y-4 ${className}`}>
            <div className="flex items-center justify-center p-4 rounded-2xl bg-gradient-to-br from-slate-900/5 to-slate-900/10 backdrop-blur-sm">
                <DotLoader
                    frames={getAnimation()}
                    className={config.gap}
                    dotClassName={`${config.dotSize} rounded-full transition-all duration-200 ${getColors()}`}
                    duration={config.duration}
                />
            </div>
            
            {text && (
                <div className="text-center space-y-2">
                    <p className={`font-medium text-slate-700 ${config.textSize}`}>
                        {getText()}
                    </p>
                    <div className="flex space-x-1 justify-center">
                        <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce"></div>
                        <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LockAnimation;
