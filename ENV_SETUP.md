# Environment Setup

## Required Environment Variables

Create a `.env.local` file in the root of the Next.js project with the following variables:

```env
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_BETTER_AUTH_URL=http://localhost:3000/api/auth
```

## Backend Setup

Make sure the NestJS backend is running on port 3000:

```bash
cd byb-db-nestjs
npm run start:dev
```

## Frontend Setup

Start the Next.js development server:

```bash
cd byb-db-nextjs
pnpm dev
```

## Important Notes

1. **Better Auth**: The frontend now uses Better Auth client to communicate with the NestJS backend
2. **Session Management**: Sessions are managed via HTTP-only cookies
3. **API Calls**: All API calls go through Axios with automatic cookie handling
4. **TanStack Query**: Server state is managed through React Query for caching and updates
5. **Modern UI**: Glassmorphism effects and flat design principles applied throughout

## Testing the Integration

1. Start the backend server
2. Start the frontend server
3. Navigate to http://localhost:3001 (or your Next.js port)
4. Try logging in or registering
5. Check the dashboard to see API data loading

## Troubleshooting

- If you see CORS errors, ensure the NestJS backend has the correct CORS configuration
- If sessions aren't persisting, check that cookies are being set correctly (look in browser DevTools)
- If API calls fail, verify the backend is running and the API endpoints match the service calls

