# Contact Form Setup

The Hg Ops contact form now sends email notifications when someone submits a message.

## How it Works

1. User fills out contact form on hgops.com/contact
2. Form data is sent to the backend API at `/api/contact`
3. Backend sends an email notification to david.hunter@hgops.com
4. User sees a success message

## Environment Variables

### Frontend (Hg Ops Next.js)
Add this to your `.env.local` file:
```
NEXT_PUBLIC_API_URL=https://your-waitlist-api-url.railway.app
```

### Backend (Waitlist Server)
The following environment variable can be optionally set (defaults to `david.hunter@hgops.com`):
```
HGOPS_CONTACT_EMAIL=david.hunter@hgops.com
```

## Backend Changes Made

### New Files
- `/waitlist/server/app/contact_routes.py` - New FastAPI route handler for contact form submissions

### Modified Files
- `/waitlist/server/app/utils/email.py` - Added `send_contact_form_notification()` function
- `/waitlist/server/app/config.py` - Added `HGOPS_CONTACT_EMAIL` configuration option
- `/waitlist/server/app/main.py` - Registered the new contact router

### Frontend Changes
- `/src/app/contact/page.tsx` - Converted to client component with form handling and API integration

## API Endpoint

```
POST /api/contact
```

### Request Body
```json
{
  "name": "string",
  "email": "string",
  "city": "string (optional)",
  "message": "string (optional)"
}
```

### Response
```json
{
  "status": "success",
  "message": "Thank you for your message. We'll get back to you soon!"
}
```

## Deployment

After deploying the backend changes to Railway (or your server), make sure to:

1. Set the `NEXT_PUBLIC_API_URL` environment variable in your Hg Ops frontend deployment
2. Optionally set `HGOPS_CONTACT_EMAIL` if you want to use a different recipient email
3. The backend already has CORS configured to accept requests from any origin

## Testing

You can test the contact form by:

1. Running the backend server locally or using the deployed version
2. Setting the environment variable in your frontend
3. Filling out and submitting the contact form
4. Checking that david.hunter@hgops.com receives the email notification

