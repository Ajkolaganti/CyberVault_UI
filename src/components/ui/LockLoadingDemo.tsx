import { DotLoader } from "./DotLoader";

// Lock animation frames - creates a lock shape and shows locking animation
const lockAnimation = [
    // Frame 1: Lock outline starts to appear
    [16, 17, 18, 19, 20, 21, 22],
    
    // Frame 2: Lock body appears
    [16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29],
    
    // Frame 3: Lock shackle (top part) starts
    [9, 10, 11, 12, 13, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29],
    
    // Frame 4: Full lock outline
    [9, 13, 16, 22, 23, 29, 30, 36, 37, 43],
    
    // Frame 5: Lock fills in
    [9, 10, 11, 12, 13, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43],
    
    // Frame 6: Keyhole appears
    [9, 10, 11, 12, 13, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 24, 31, 38],
    
    // Frame 7: Lock secured - brief pause with glow effect
    [9, 10, 11, 12, 13, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43],
    
    // Frame 8: Security confirmation - pulse effect
    [9, 10, 11, 12, 13, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43],
];

// Alternative simpler lock animation
const simpleLockAnimation = [
    // Lock outline
    [17, 18, 19, 23, 25, 30, 31, 32, 33, 34, 37, 38, 39, 40, 41],
    
    // Lock filling in
    [17, 18, 19, 23, 25, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42],
    
    // Keyhole appears
    [17, 18, 19, 23, 25, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 32, 39],
    
    // Lock complete
    [17, 18, 19, 23, 25, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42],
];

// Loading dots animation - moving dots
const loadingDotsAnimation = [
    [24],
    [24, 25],
    [24, 25, 26],
    [25, 26, 27],
    [26, 27, 28],
    [27, 28],
    [28],
    [],
];

export const LockLoadingDemo = () => {
    return (
        <div className="flex flex-col items-center gap-8 rounded-lg bg-slate-900 p-8 text-white">
            {/* Lock Animation */}
            <div className="flex items-center gap-4">
                <DotLoader
                    frames={lockAnimation}
                    className="gap-0.5"
                    dotClassName="bg-blue-500/20 [&.active]:bg-blue-500 size-2 rounded-full"
                    duration={400}
                />
                <p className="font-medium text-blue-300">Securing Vault...</p>
            </div>

            {/* Simple Lock Animation */}
            <div className="flex items-center gap-4">
                <DotLoader
                    frames={simpleLockAnimation}
                    className="gap-1"
                    dotClassName="bg-cyan-500/20 [&.active]:bg-cyan-400 size-1.5 rounded-sm"
                    duration={600}
                />
                <p className="font-medium text-cyan-300">Authentication...</p>
            </div>

            {/* Loading Dots */}
            <div className="flex items-center gap-4">
                <DotLoader
                    frames={loadingDotsAnimation}
                    className="gap-1"
                    dotClassName="bg-white/20 [&.active]:bg-white size-2 rounded-full"
                    duration={200}
                />
                <p className="font-medium">Loading...</p>
            </div>
        </div>
    );
};

export default LockLoadingDemo;
