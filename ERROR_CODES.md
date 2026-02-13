# Admin Advanced Diagnostic Error Codes

This document lists the randomized 5-digit diagnostic error codes used across the MAPmobile Admin Dashboard for real-time troubleshooting and system auditing.

## Error Code Format
`[TXXXXX]`
- **T**: Type (F: Fetch, V: Validation, S: System/Server, A: Auth, P: Payment, D: Diagnostic, M: Maps, I: Inventory, C: Comm, L: Logistics)
- **XXXXX**: Randomized 5-digit numeric identifier

---

## 🔍 Fetch Errors (F)
*Errors occurring during data retrieval from Supabase or external APIs.*

| Code | Description | Troubleshooting |
| :--- | :--- | :--- |
| `F19283` | Staff retrieval failure. | Check database connection and `profiles` table permissions. |
| `F55219` | Customer data retrieval failure. | Check `profiles` and `bookings` tables. |
| `F77321` | Detailed booking history failure. | Verify `bookings` and `booking_items` table integrity. |
| `F88432` | System audit log failure. | Check `audits` table and foreign key relationships. |
| `F55667` | Bookings list failure. | Check database connectivity and booking table permissions. |
| `F11294` | Dashboard analytics failure. | Verify Supabase connection; check access to `bookings`, `profiles`, and `payments`. |
| `F99102` | Product catalog retrieval failure. | Verify if the `products` table exists and has active products. |
| `F44210` | User profile synchronization failure. | Check for conflicting profile updates or network timeout during fetch. |

## ✅ Validation Errors (V)
*Errors occurring during client-side form validation or data integrity checks.*

| Code | Description | Troubleshooting |
| :--- | :--- | :--- |
| `V82910` | Staff creation validation. | Ensure all required fields (email, name, password, DOB) are provided. |
| `V55432` | Environment configuration error. | Check `.env.local` for missing `SUPABASE_URL` or `STRIPE_SECRET_KEY`. |

## ⚙️ System & Server Errors (S)
*Critical failures occurring on the backend or during database write operations.*

| Code | Description | Troubleshooting |
| :--- | :--- | :--- |
| `S73612` | Staff account creation error. | Check server logs for Auth/API failures. Ensure email is unique. |
| `S92103` | Staff role update failure. | Verify RLS policies on `profiles` table allow role updates. |
| `S01928` | Staff archiving failure. | Check if `staff_removed_at` column exists and is writable. |
| `S66210` | Customer role update failure. | Verify database connectivity and audit logging service status. |
| `S44556` | Booking update failure. | Check if the booking exists and you have permissions to modify it. |
| `S22334` | Booking deletion failure. | Ensure the booking is not locked or referenced by active deployments. |
| `S11209` | Asset upload failure. | Check Supabase Storage bucket permissions and RLS policies for `storage.objects`. |
| `S22901` | Media size limit exceeded. | Compress the image or video file before re-uploading (Max 10MB). |
| `S33902` | Unsupported media format. | Please use standard formats like JPG, PNG, or MP4. |
| `S44903` | Media deletion failure. | Check if the file is locked or if you have delete permissions. |
| `S88123` | Webhook signature failure. | Ensure `STRIPE_WEBHOOK_SECRET` matches the one in Stripe Dashboard. |

## 🔐 Authentication Errors (A)
*Errors related to user sessions, permissions, and access control.*

| Code | Description | Troubleshooting |
| :--- | :--- | :--- |
| `A11223` | Session expired / Unauthorized. | Please log in again to continue. |
| `A33445` | Insufficient permissions. | Contact a system administrator if you believe this is an error. |
| `A99881` | CSRF / Security token mismatch. | Clear browser cookies and ensure headers are correctly passed. |

## 💳 Payment Errors (P)
*Errors related to Stripe integrations and payment processing.*

| Code | Description | Troubleshooting |
| :--- | :--- | :--- |
| `P99887` | Payment validation failed. | Check Stripe configuration and payment intent status. |
| `P77102` | Stripe session creation failed. | Verify Stripe API keys and network connectivity to `stripe.com`. |

## 🗺️ Maps & Geolocation (M)
*Errors related to Google Maps API, geocoding, and spatial data.*

| Code | Description | Troubleshooting |
| :--- | :--- | :--- |
| `M11220` | Geocoding failure. | Verify address format and Google Maps API quota/connectivity. |
| `M33440` | Map API load failure. | Check browser console for script loading errors or API key restrictions. |
| `M55660` | Marker rendering failure. | Reduce active markers or check for invalid coordinate data. |

## 📦 Inventory & Products (I)
*Errors related to warehouse levels, SKUs, and product synchronization.*

| Code | Description | Troubleshooting |
| :--- | :--- | :--- |
| `I11001` | Stock sync failure. | Check database connectivity or product inventory table locks. |
| `I22002` | Metadata integrity failure. | Ensure all required specifications and SKU details are populated. |
| `I33003` | Out of stock error. | Quantity requested exceeds available stock levels. |

## 💬 Communications (C)
*Errors related to SMS, Email, and internal notification services.*

| Code | Description | Troubleshooting |
| :--- | :--- | :--- |
| `C11001` | SMS delivery failure. | Verify recipient phone number and provider balance. |
| `C22002` | Email bounced. | Check email validity and provider reputation scores. |

## 🚛 Logistics & Deployment (L)
*Errors related to technician dispatch, GPS tracking, and job completion.*

| Code | Description | Troubleshooting |
| :--- | :--- | :--- |
| `L11001` | GPS signal lost. | Ensure technician app has location permissions enabled. |
| `L22002` | Deployment timeout. | Job was not marked finished within the expected window. |
| `L33003` | Assignment failure. | No available technicians match skill or location requirements. |

## 🛠️ Diagnostics & Sync (D)
*General system synchronization and diagnostic fallback codes.*

| Code | Description | Troubleshooting |
| :--- | :--- | :--- |
| `D10293` | Database sync failure. | General synchronization failure between client and server. |
| `D88442` | Resource exhaustion alert. | Check Supabase project limits and optimize query frequency. |
| `D00000` | Unexpected error. | Fallback for unhandled exceptions. Check console for details. |

---

## Technical Support Note
When reporting an issue, please include the **5-digit diagnostic code** displayed in the red alert banner. This allows administrators to quickly cross-reference browser logs with server-side audit trails.
