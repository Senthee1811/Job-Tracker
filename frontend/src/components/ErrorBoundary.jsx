import React from 'react';
import { IoAlertCircleOutline, IoRefreshOutline, IoHomeOutline } from 'react-icons/io5';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[ErrorBoundary] Caught client-side component error:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/dashboard';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-6 select-none font-sans">
          <div className="bg-white border-2 border-neutral-900 rounded-2xl p-8 max-w-lg w-full text-center shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] space-y-5 animate-in fade-in duration-200">
            <div className="w-14 h-14 bg-rose-100 border-2 border-neutral-900 rounded-2xl flex items-center justify-center mx-auto text-rose-600 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <IoAlertCircleOutline className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-extrabold text-neutral-900 tracking-tight">
                Application Encountered an Error
              </h3>
              <p className="text-xs text-neutral-600 leading-relaxed max-w-sm mx-auto">
                An unexpected interface issue occurred. Your saved job applications and profile data remain completely secure.
              </p>
            </div>

            {this.state.error?.message && (
              <div className="p-3 bg-neutral-100 border border-neutral-200 rounded-xl text-left font-mono text-[11px] text-neutral-700 max-h-24 overflow-y-auto">
                {this.state.error.message}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={this.handleReload}
                className="flex-1 py-2.5 px-4 bg-[#a3e635] text-neutral-950 font-extrabold border-2 border-neutral-900 rounded-xl hover:bg-lime-400 transition-all text-xs cursor-pointer shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center gap-1.5"
              >
                <IoRefreshOutline className="w-4 h-4" />
                <span>Reload Page</span>
              </button>
              <button
                type="button"
                onClick={this.handleGoHome}
                className="flex-1 py-2.5 px-4 bg-white text-neutral-900 font-extrabold border-2 border-neutral-900 rounded-xl hover:bg-neutral-50 transition-all text-xs cursor-pointer shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center gap-1.5"
              >
                <IoHomeOutline className="w-4 h-4" />
                <span>Dashboard</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
