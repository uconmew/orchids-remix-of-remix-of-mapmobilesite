export type ErrorCategory = 'STAFF' | 'CUST' | 'AUDIT' | 'DB' | 'API' | 'AUTH' | 'BOOKING' | 'PAYMENT' | 'CONFIG' | 'STORAGE' | 'MAPS' | 'INVENTORY' | 'COMM' | 'DEPLOY';
export type ErrorAction = 'FETCH' | 'CREATE' | 'UPDATE' | 'DELETE' | 'SYNC' | 'UNAUTH' | 'FORBID' | 'VALIDATE' | 'CONFIG' | 'UPLOAD' | 'ASSIGN' | 'COMPLETE' | 'REFUND' | 'GEOCODE' | 'DISPATCH';

export interface DiagnosticError {
  code: string;
  category: ErrorCategory;
  action: ErrorAction;
  message: string;
  troubleshooting?: string;
  technicalDetails?: any;
  autoFix?: {
    label: string;
    action: string;
  };
}

export const ERROR_REGISTRY: Record<string, Omit<DiagnosticError, 'code' | 'technicalDetails'>> = {
  // Fetch (F)
  'F19283': {
    category: 'STAFF',
    action: 'FETCH',
    message: 'Failed to retrieve staff list from database.',
    troubleshooting: 'Check database connection and profiles table permissions.'
  },
  'F55219': {
    category: 'CUST',
    action: 'FETCH',
    message: 'Failed to retrieve customer list or activity data.',
    troubleshooting: 'Check profiles and bookings tables. Ensure no legacy references to orders exist.'
  },
  'F77321': {
    category: 'CUST',
    action: 'FETCH',
    message: 'Failed to retrieve detailed customer booking/purchase history.',
    troubleshooting: 'Check bookings and booking_items table relationships and data integrity.'
  },
  'F88432': {
    category: 'AUDIT',
    action: 'FETCH',
    message: 'Failed to retrieve system audit logs.',
    troubleshooting: 'Check audits table and foreign key relationships with profiles.'
  },
  'F55667': {
    category: 'BOOKING',
    action: 'FETCH',
    message: 'Failed to retrieve bookings.',
    troubleshooting: 'Check database connectivity and booking table permissions.',
    autoFix: {
      label: 'Retry Fetch',
      action: 'RETRY_FETCH'
    }
  },
  'F11294': {
    category: 'API',
    action: 'FETCH',
    message: 'Failed to retrieve dashboard analytics and statistics.',
    troubleshooting: 'Verify Supabase connection and check if all required tables (bookings, profiles, payments) are accessible.',
    autoFix: {
      label: 'Reconnect & Retry',
      action: 'RETRY_FETCH'
    }
  },
  // Validation (V)
  'V82910': {
    category: 'STAFF',
    action: 'VALIDATE',
    message: 'Client-side validation failed during staff creation.',
    troubleshooting: 'Ensure all required fields (email, name, password, DOB) are provided.'
  },
  // System/Server (S)
  'S73612': {
    category: 'STAFF',
    action: 'CREATE',
    message: 'Server error during staff account creation.',
    troubleshooting: 'Check server logs for Auth/API failures. Ensure email is unique.'
  },
  'S92103': {
    category: 'STAFF',
    action: 'UPDATE',
    message: 'Failed to update staff role in the database.',
    troubleshooting: 'Verify RLS policies on profiles table allow role updates.'
  },
  'S01928': {
    category: 'STAFF',
    action: 'DELETE',
    message: 'Failed to mark staff as removed/archived.',
    troubleshooting: 'Check if staff_removed_at column exists and is writable.'
  },
  'S66210': {
    category: 'CUST',
    action: 'UPDATE',
    message: 'Failed to update customer role (Admin/Customer).',
    troubleshooting: 'Verify database connectivity and audit logging service status.'
  },
  'S44556': {
    category: 'BOOKING',
    action: 'UPDATE',
    message: 'Failed to update appointment details.',
    troubleshooting: 'Check if the booking exists and you have permissions to modify it.'
  },
  'S22334': {
    category: 'BOOKING',
    action: 'DELETE',
    message: 'Failed to delete appointment from system.',
    troubleshooting: 'Ensure the booking is not locked or referenced by active deployments.'
  },
  // Auth (A)
  'A11223': {
    category: 'AUTH',
    action: 'UNAUTH',
    message: 'Session expired or unauthorized access attempt.',
    troubleshooting: 'Please log in again to continue.',
    autoFix: {
      label: 'Login Again',
      action: 'REDIRECT_LOGIN'
    }
  },
  'A33445': {
    category: 'AUTH',
    action: 'FORBID',
    message: 'Insufficient permissions for the requested action.',
    troubleshooting: 'Contact a system administrator if you believe this is an error.'
  },
  // Payment (P)
  'P99887': {
    category: 'PAYMENT',
    action: 'VALIDATE',
    message: 'Payment validation failed.',
    troubleshooting: 'Check Stripe configuration and payment intent status.'
  },
  // Diagnostics/Default (D)
  'D10293': {
    category: 'DB',
    action: 'SYNC',
    message: 'Database synchronization failure.',
    troubleshooting: 'General synchronization failure between client and server.',
    autoFix: {
      label: 'Force Refresh',
      action: 'REFRESH_PAGE'
    }
  },
  // Developer Style Diagnostics
  'V55432': {
    category: 'CONFIG',
    action: 'CONFIG',
    message: 'Missing or invalid environment configuration.',
    troubleshooting: 'Check .env.local for missing SUPABASE_URL or STRIPE_SECRET_KEY.'
  },
  'F99102': {
    category: 'API',
    action: 'FETCH',
    message: 'Product catalog retrieval failure.',
    troubleshooting: 'Verify if the products table exists and has active products.'
  },
  'S11209': {
    category: 'STORAGE',
    action: 'UPLOAD',
    message: 'Asset upload failure to Supabase Storage.',
    troubleshooting: 'Check bucket permissions and RLS policies for storage.objects.'
  },
  'P77102': {
    category: 'PAYMENT',
    action: 'CREATE',
    message: 'Stripe Checkout session creation failed.',
    troubleshooting: 'Verify Stripe API keys and network connectivity to stripe.com.'
  },
  'S88123': {
    category: 'API',
    action: 'VALIDATE',
    message: 'Webhook signature verification failed.',
    troubleshooting: 'Ensure STRIPE_WEBHOOK_SECRET matches the one in Stripe Dashboard.'
  },
  'A99881': {
    category: 'AUTH',
    action: 'VALIDATE',
    message: 'Security token / CSRF mismatch.',
    troubleshooting: 'Clear browser cookies and ensure headers are correctly passed.',
    autoFix: {
      label: 'Clear Session & Retry',
      action: 'CLEAR_SESSION'
    }
  },
  'D88442': {
    category: 'DB',
    action: 'SYNC',
    message: 'Resource exhaustion or rate limit alert.',
    troubleshooting: 'Check Supabase project limits and optimize query frequency.'
  },
  'F44210': {
    category: 'CUST',
    action: 'SYNC',
    message: 'User profile synchronization failure.',
    troubleshooting: 'Check for conflicting profile updates or network timeout during fetch.'
  },
  // Maps & Geolocation (M)
  'M11220': {
    category: 'MAPS',
    action: 'GEOCODE',
    message: 'Address geocoding failure.',
    troubleshooting: 'Verify address format and Google Maps API quota/connectivity.'
  },
  'M33440': {
    category: 'MAPS',
    action: 'FETCH',
    message: 'Map tiles or API failed to load.',
    troubleshooting: 'Check browser console for script loading errors or API key restrictions.',
    autoFix: {
      label: 'Reload Map Engine',
      action: 'REFRESH_PAGE'
    }
  },
  'M55660': {
    category: 'MAPS',
    action: 'UPDATE',
    message: 'Marker rendering or clustering failure.',
    troubleshooting: 'Reduce the number of active markers or check for invalid coordinate data.'
  },
  // Logistics & Deployment (L)
  'L11001': {
    category: 'DEPLOY',
    action: 'DISPATCH',
    message: 'Technician GPS tracking signal lost.',
    troubleshooting: 'Ensure the technician app has location permissions enabled and active signal.',
    autoFix: {
      label: 'Reset GPS Stream',
      action: 'RESET_GPS'
    }
  },
  'L22002': {
    category: 'DEPLOY',
    action: 'COMPLETE',
    message: 'Deployment completion timeout.',
    troubleshooting: 'Job was not marked finished within the expected window; check technician status.'
  },
  'L33003': {
    category: 'DEPLOY',
    action: 'ASSIGN',
    message: 'Automated job assignment failed.',
    troubleshooting: 'No available technicians match the skill or location requirements.'
  },
  // Inventory & Products (I)
  'I11001': {
    category: 'INVENTORY',
    action: 'FETCH',
    message: 'Stock level synchronization failure.',
    troubleshooting: 'Check database connectivity or product inventory table locks.'
  },
  'I22002': {
    category: 'INVENTORY',
    action: 'VALIDATE',
    message: 'Product metadata integrity check failed.',
    troubleshooting: 'Ensure all required specifications and SKU details are populated.'
  },
  'I33003': {
    category: 'INVENTORY',
    action: 'UPDATE',
    message: 'Inventory depletion / Out of stock error.',
    troubleshooting: 'Quantity requested exceeds available stock levels in the warehouse.'
  },
  // Communications (C)
  'C11001': {
    category: 'COMM',
    action: 'SYNC',
    message: 'SMS notification delivery failure.',
    troubleshooting: 'Verify recipient phone number and Twilio/Provider balance.'
  },
  'C22002': {
    category: 'COMM',
    action: 'SYNC',
    message: 'Customer email notification bounced.',
    troubleshooting: 'Check email address validity and Resend/SendGrid reputation scores.'
  },
  // Expanded Storage/Media (S/L)
  'S22901': {
    category: 'STORAGE',
    action: 'UPLOAD',
    message: 'Media file size exceeds system limits.',
    troubleshooting: 'Compress the image or video file before re-uploading (Max 10MB).'
  },
  'S33902': {
    category: 'STORAGE',
    action: 'UPLOAD',
    message: 'Unsupported media file format.',
    troubleshooting: 'Please use standard formats like JPG, PNG, or MP4.'
  },
  'S44903': {
    category: 'STORAGE',
    action: 'DELETE',
    message: 'Failed to delete media asset.',
    troubleshooting: 'Check if the file is locked or if you have delete permissions in the bucket.'
  }
};
  
  export function getDiagnosticError(code: string, technicalDetails?: any): DiagnosticError {
    const baseError = ERROR_REGISTRY[code];
    if (!baseError) {
      return {
        code: 'D00000',
        category: 'API',
        action: 'SYNC',
        message: 'An unexpected error occurred.',
        troubleshooting: 'Please check the console for more details.',
        technicalDetails
      };
    }
  return {
    ...baseError,
    code,
    technicalDetails
  };
}

export function logDiagnostic(code: string, error?: any) {
  const diagnostic = getDiagnosticError(code, error);
  console.error(`[DIAGNOSTIC_CODE: ${diagnostic.code}]`, {
    message: diagnostic.message,
    category: diagnostic.category,
    action: diagnostic.action,
    troubleshooting: diagnostic.troubleshooting,
    technicalDetails: error
  });
  return diagnostic;
}
