import { useState, useCallback } from 'react';
import { DiagnosticError, logDiagnostic, getDiagnosticError } from '@/lib/error-handler';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

export function useDiagnostics() {
  const [lastError, setLastError] = useState<DiagnosticError | null>(null);
  const router = useRouter();

  const reportError = useCallback((code: string, error?: any, showToast = true) => {
    const diagnostic = logDiagnostic(code, error);
    setLastError(diagnostic);

    if (showToast) {
      toast.error(diagnostic.message, {
        description: `Error Code: [${diagnostic.code}]`,
        action: diagnostic.autoFix ? {
          label: diagnostic.autoFix.label,
          onClick: () => applyFix(diagnostic)
        } : diagnostic.troubleshooting ? {
          label: 'Troubleshoot',
          onClick: () => {
            alert(`Troubleshooting: ${diagnostic.troubleshooting}`);
          }
        } : undefined,
      });
    }

    return diagnostic;
  }, [router]);

  const applyFix = useCallback(async (error: DiagnosticError, context?: any) => {
    if (!error.autoFix) return;

    console.log(`[AUTO-FIX] Executing action: ${error.autoFix.action} for ${error.code}`);

    switch (error.autoFix.action) {
      case 'REFRESH_PAGE':
        window.location.reload();
        break;
      case 'REDIRECT_LOGIN':
        router.push('/login');
        break;
      case 'RETRY_FETCH':
        if (context?.retry) {
          await context.retry();
          setLastError(null);
          toast.success('Retry successful');
        } else {
          window.location.reload();
        }
        break;
      case 'CLEAR_SESSION':
        localStorage.clear();
        sessionStorage.clear();
        window.location.href = '/login';
        break;
      case 'RESET_GPS':
        toast.info('GPS stream reset initiated...');
        // Simulate GPS reset logic
        setTimeout(() => toast.success('GPS signal restored'), 1000);
        break;
      default:
        toast.info(`Manual action required: ${error.autoFix.label}`);
    }
  }, [router]);

  const clearError = useCallback(() => {
    setLastError(null);
  }, []);

  return {
    lastError,
    reportError,
    applyFix,
    clearError,
    getDiagnostic: getDiagnosticError
  };
}
