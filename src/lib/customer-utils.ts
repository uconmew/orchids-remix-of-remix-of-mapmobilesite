import { SupabaseClient } from '@supabase/supabase-js';

export async function getOrCreateCustomerNumber(
  supabase: SupabaseClient, 
  { userId, email }: { userId?: string; email?: string }
): Promise<string> {
  // 1. If userId exists, check and update profile
  if (userId) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('customer_number')
      .eq('id', userId)
      .single();

    if (profile?.customer_number) {
      return profile.customer_number;
    }

    // Generate new for user
    const customerNumber = generateRandomCustomerNumber();
    await supabase
      .from('profiles')
      .update({ customer_number: customerNumber })
      .eq('id', userId);
    
    return customerNumber;
  }

  // 2. For guests, we can optionally link by email if we want consistency, 
  // but the user said "Every customer number should be different except if it's assigned to users".
  // This implies guests get a unique one each time, OR we link guests by email.
  // Given "if they create an account they can see all history", linking by email is safer.
  
  if (email) {
    // Check if there's a profile with this email first
    const { data: profileByEmail } = await supabase
      .from('profiles')
      .select('customer_number')
      .eq('email', email)
      .single();

    if (profileByEmail?.customer_number) {
      return profileByEmail.customer_number;
    }
  }

  // Generate a fresh one for this transaction/guest
  return generateRandomCustomerNumber();
}

function generateRandomCustomerNumber(): string {
  const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let result = 'CUST-';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}
