# Hg Ops Email Configuration Setup

The server now supports separate Postmark configuration specifically for Hg Ops contact form emails.

## Environment Variables

Add these variables to your `.envrc` file:

```bash
# Hg Ops specific email configuration
export HGOPS_POSTMARK_TOKEN="your-hgops-postmark-token-here"
export HGOPS_FROM_EMAIL="hgops@dsmurrell.com"
export HGOPS_CONTACT_EMAIL="david.hunter@hgops.com"
```

## How It Works

### Email Routing
- **Hg Ops Contact Form**: Uses `HGOPS_POSTMARK_TOKEN` and sends from `HGOPS_FROM_EMAIL`
- **Other Emails** (waitlist, referrals): Continue using the original `POSTMARK_API_TOKEN` and `FROM_EMAIL`

### Fallback Behavior
- If `HGOPS_POSTMARK_TOKEN` is not set or empty, the system falls back to using `POSTMARK_API_TOKEN`
- This ensures backward compatibility and prevents email failures

### Configuration Details

| Variable | Purpose | Default Value |
|----------|---------|---------------|
| `HGOPS_POSTMARK_TOKEN` | Postmark API token for Hg Ops emails | Falls back to `POSTMARK_API_TOKEN` |
| `HGOPS_FROM_EMAIL` | From email address for Hg Ops emails | `hgops@dsmurrell.com` |
| `HGOPS_CONTACT_EMAIL` | Recipient for Hg Ops contact forms | `david.hunter@hgops.com` |

## Email Flow

When someone submits the Hg Ops contact form:

1. **API Endpoint**: `POST /api/contact`
2. **Email Service**: `send_contact_form_notification()`
3. **Postmark Token**: Uses `HGOPS_POSTMARK_TOKEN` (or falls back to default)
4. **From Address**: `hgops@dsmurrell.com`
5. **To Address**: `david.hunter@hgops.com` (or custom recipient)

## Testing

To test the configuration:

1. Set the environment variables in your `.envrc`
2. Restart the server: `direnv reload`
3. Submit a test contact form from the Hg Ops website
4. Check that the email is sent from `hgops@dsmurrell.com` using the Hg Ops Postmark token

## Deployment

When deploying, ensure all environment variables are set in your production environment:

```bash
# Production environment variables
HGOPS_POSTMARK_TOKEN=your-production-hgops-token
HGOPS_FROM_EMAIL=hgops@dsmurrell.com
HGOPS_CONTACT_EMAIL=david.hunter@hgops.com
```

## Logging

The system logs which token and from email are being used:

```
Successfully sent contact form notification from user@example.com to david.hunter@hgops.com using Hg Ops token and from email hgops@dsmurrell.com
```

This helps with debugging and monitoring email delivery.

