---
description: How to run the ProovdCRO development environment
---

# ProovdCRO Development Setup

## Prerequisites
- Node.js 18+
- MongoDB (local Docker or cloud)

## Quick Start

### 1. Install Dependencies
```bash
cd /home/pluto/A/proovd
npm install
```

### 2. Set Up Environment Variables
Create `.env.local` if it doesn't exist:
```bash
# MongoDB
MONGODB_URI=mongodb://localhost:27017/proovd

# Auth (Clerk)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_key
CLERK_SECRET_KEY=your_secret

# Optional: Socket server (not needed for CRO widgets)
# NEXT_PUBLIC_SOCKET_URL=ws://localhost:3001
```

### 3. Start MongoDB (if using Docker)
// turbo
```bash
cd /home/pluto/A/proovd && docker-compose up -d
```

### 4. Build the Widget Script
// turbo
```bash
cd /home/pluto/A/proovd && npm run build:widget
```

This compiles the widget code and copies it to `public/widget.js`.

### 5. Start the Next.js Dev Server
```bash
cd /home/pluto/A/proovd && npm run dev
```

The app will be available at: http://localhost:3000

### 6. View the CRO Demo
Open in browser: http://localhost:3000/cro-demo.html

---

## Development Workflows

### Making Widget Changes
1. Edit files in `src/pulse-widget/`
2. Rebuild widget: `npm run build:widget`
3. Refresh the demo page

### Testing Widgets Standalone
The `public/cro-demo.html` file has inline widget implementations for quick testing without needing the full TypeScript build.

### Testing with Real Dashboard
1. Start the Next.js server: `npm run dev`
2. Go to http://localhost:3000
3. Log in and create a website
4. Access notifications/campaigns

---

## File Locations

| What | Where |
|------|-------|
| Widget source | `src/pulse-widget/` |
| Built widget | `public/widget.js` |
| CRO demo | `public/cro-demo.html` |
| Dashboard | `app/dashboard/` |
| API routes | `app/api/` |
| MongoDB models | `app/lib/models/` |

---

## Troubleshooting

### Widget not updating?
Run `npm run build:widget` after any changes to `src/pulse-widget/`.

### MongoDB connection errors?
Make sure Docker is running: `docker-compose up -d`

### Port 3000 in use?
Kill existing process: `lsof -ti:3000 | xargs kill -9`
