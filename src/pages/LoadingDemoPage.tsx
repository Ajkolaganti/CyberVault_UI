import { LockAnimation } from "../components/ui/LockAnimation";
import { LoadingSpinner } from "../components/ui/LoadingSpinner";
import { LockLoadingDemo } from "../components/ui/LockLoadingDemo";

export const LoadingDemoPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-8">
      <div className="max-w-4xl mx-auto space-y-12">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-slate-900 mb-4">
            CyberVault Loading Animations
          </h1>
          <p className="text-slate-600 max-w-2xl mx-auto">
            Modern loading animations with lock themes for security applications
          </p>
        </div>

        {/* Lock Animations */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold text-slate-800 text-center">
            Lock Animations
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl p-6 shadow-lg">
              <h3 className="text-lg font-medium text-slate-700 mb-4 text-center">
                Dot Lock Animation
              </h3>
              <LockAnimation variant="lock" size="md" text="Securing..." />
            </div>

            <div className="bg-white rounded-xl p-6 shadow-lg">
              <h3 className="text-lg font-medium text-slate-700 mb-4 text-center">
                Loading Dots
              </h3>
              <LockAnimation variant="dots" size="md" text="Loading..." />
            </div>

            <div className="bg-white rounded-xl p-6 shadow-lg">
              <h3 className="text-lg font-medium text-slate-700 mb-4 text-center">
                Circular Loading
              </h3>
              <LockAnimation variant="circular" size="md" text="Processing..." />
            </div>
          </div>
        </section>

        {/* Size Variants */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold text-slate-800 text-center">
            Size Variants
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl p-6 shadow-lg">
              <h3 className="text-lg font-medium text-slate-700 mb-4 text-center">
                Small
              </h3>
              <LockAnimation variant="lock" size="sm" text="Securing..." />
            </div>

            <div className="bg-white rounded-xl p-6 shadow-lg">
              <h3 className="text-lg font-medium text-slate-700 mb-4 text-center">
                Medium
              </h3>
              <LockAnimation variant="lock" size="md" text="Securing..." />
            </div>

            <div className="bg-white rounded-xl p-6 shadow-lg">
              <h3 className="text-lg font-medium text-slate-700 mb-4 text-center">
                Large
              </h3>
              <LockAnimation variant="lock" size="lg" text="Securing..." />
            </div>
          </div>
        </section>

        {/* LoadingSpinner Variants */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold text-slate-800 text-center">
            LoadingSpinner Component
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl p-6 shadow-lg">
              <h3 className="text-lg font-medium text-slate-700 mb-4 text-center">
                Spinner
              </h3>
              <LoadingSpinner variant="spinner" size="md" text="Loading..." />
            </div>

            <div className="bg-white rounded-xl p-6 shadow-lg">
              <h3 className="text-lg font-medium text-slate-700 mb-4 text-center">
                SVG Lock
              </h3>
              <LoadingSpinner variant="lock" size="md" text="Securing..." />
            </div>

            <div className="bg-white rounded-xl p-6 shadow-lg">
              <h3 className="text-lg font-medium text-slate-700 mb-4 text-center">
                Dot Lock
              </h3>
              <LoadingSpinner variant="dotlock" size="md" text="Securing Vault..." />
            </div>
          </div>
        </section>

        {/* Original Demo */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold text-slate-800 text-center">
            Advanced Lock Demo
          </h2>
          
          <div className="flex justify-center">
            <LockLoadingDemo />
          </div>
        </section>
      </div>
    </div>
  );
};
