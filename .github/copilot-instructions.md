# CI-PAE Copilot Instructions

## Project Overview
**CI-PAE** (Campaign Imprints: Intelligent Extraction System for Poverty Alleviation Experience) is a full-stack web application demonstrating a skeletal architecture for data analysis and NLP-driven insights. The project is split into:
- **Backend**: Express.js API (port 3001) with controller→service→mock-data layering
- **Frontend**: Vue 3 + Vite SPA (port 5174) with router-based navigation and Axios API client

**Critical Context**: Current backend services return mock data—integration points for database/ML models are in `backend/services/` as `TODO` markers.

## Architecture Patterns

### Backend Request Flow
```
Frontend API call → Vite proxy (/api → localhost:3001)
  ↓
Express Router (/api/*)
  ↓
Middleware (auth, CORS, body-parser)
  ↓
Controller (request parsing)
  ↓
Service (business logic + data fetch—currently mock)
  ↓
Response (JSON with {ok, data/error})
```

**Key Files**:
- `backend/app.js`: Express app setup with middleware pipeline
- `backend/routes/index.js`: Endpoint definitions (3 endpoints: data, analysis, nlp)
- `backend/controllers/`: Request handlers that delegate to services
- `backend/services/`: Mock implementations—replace these for real data/ML

### Frontend Architecture
- **Entry**: `frontend/src/main.js` bootstraps Vue with router
- **Layout**: `App.vue` wraps `AppHeader` + `AppSidebar` + `<router-view>`
- **Routes** (4 pages): Dashboard, Analysis, Patterns, Compare (defined in `frontend/src/router/index.js`)
- **API Client**: `frontend/src/api/index.js` provides organized namespace for backend calls (`.data.fetchSummary()`, `.analysis.runReport()`, `.nlp.query()`)

### Data Flow
Frontend components import API client → call methods with params → Vite dev server proxies to backend → controller processes → service returns mock data → response sent back to frontend component

## Development Workflow

### Setup & Running
```pwsh
# First time
npm install  # root (installs frontend + backend dependencies)

# Terminal 1: Backend (watch mode with nodemon)
cd backend && npm run dev  # watches server.js, restarts on changes

# Terminal 2: Frontend (Vite dev server)
cd frontend && npm run dev  # hot-reload on .vue/.js changes, proxies /api to backend
```

**Ports**: Backend 3001, Frontend 5174 (Vite proxy handles cross-origin)

### Building for Production
```pwsh
cd frontend && npm run build  # generates dist/ with optimized bundle
npm run serve  # preview production build locally
```

## Key Conventions & Patterns

### Endpoint Structure
All backend endpoints follow `/api/{domain}/{action}` pattern:
- `/api/data/summary` (GET) — fetch statistics, accepts `period` query param
- `/api/analysis/report` (POST) — generate analysis report
- `/api/nlp/query` (POST) — NLP query processing

**Response Format** (consistent):
```json
{ "ok": true, "data": {...} }  // success
{ "ok": false, "error": "..." }  // error
```

### Service Implementation Template
When adding real functionality to `backend/services/`:
```javascript
// Current mock pattern (in dataService.js):
exports.fetchSummary = async (params) => {
  // TODO: replace with DB query
  return { totalCount: 12345, counties: 12, period: params.period || '2015-2020' }
}

// Expected replacement pattern:
// - Query database or ML model
// - Handle errors in service (throw to controller's try-catch)
// - Return normalized data structure matching the mock
```

### Frontend API Calls
Use the centralized API client (`frontend/src/api/index.js`) for all backend calls:
```javascript
import api from '@/api'

// In components:
const result = await api.data.fetchSummary({ period: '2020-2024' })
const report = await api.analysis.runReport({ type: 'detailed' })
```
Never hardcode axios instances—new endpoints must be added to `api/index.js` first.

### Authentication
Currently **placeholder**: Uses `x-api-key` header check in `backend/middleware/auth.js` (dev-key). All requests pass through in current scaffold. For production, replace with JWT validation.

## File Organization & Responsibilities

| Path | Purpose |
|------|---------|
| `backend/app.js` | Express app setup, middleware pipeline |
| `backend/server.js` | Server entry point (port binding) |
| `backend/routes/index.js` | Endpoint route definitions |
| `backend/controllers/*.js` | Request handlers, parameter parsing |
| `backend/services/*.js` | **[INTEGRATION POINT]** Business logic & data fetching |
| `backend/middleware/*.js` | Auth, error handling middleware |
| `frontend/src/main.js` | Vue app bootstrap |
| `frontend/src/router/index.js` | Route definitions (4 views) |
| `frontend/src/api/index.js` | **[INTEGRATION POINT]** Axios client + namespaced methods |
| `frontend/src/components/Layout/*.vue` | Header, sidebar (persistent UI) |
| `frontend/src/views/*.vue` | Page components (Dashboard, Analysis, Patterns, Compare) |
| `frontend/vite.config.js` | Dev proxy config for `/api` + build settings |
| `config/index.js` | Centralized config (port, apiPrefix) |

## Common Tasks & How-Tos

### Adding a New Backend Endpoint
1. Define route in `backend/routes/index.js` (e.g., `router.get('/feature/action', featureController.action)`)
2. Create/update controller in `backend/controllers/featureController.js` with try-catch wrapper
3. Implement service method in `backend/services/featureService.js`
4. Add corresponding API method to `frontend/src/api/index.js` under appropriate namespace

### Adding a New Frontend Page
1. Create `.vue` file in `frontend/src/views/` (e.g., `NewPage.vue`)
2. Import and add route to `frontend/src/router/index.js`
3. Add navigation link in `frontend/src/components/Layout/AppSidebar.vue`

### Debugging Backend Issues
- Check `backend/middleware/errorHandler.js` for error response format
- Backend runs with nodemon—check terminal for console logs
- Use `console.log()` in services to inspect data flow

### Debugging Frontend Issues
- Vite dev server prints build warnings to browser console and terminal
- Use Vue DevTools extension for component state inspection
- Check browser Network tab to verify `/api` proxy requests reach backend

## Integration Points (Next Steps)

1. **Database Connection** (in `backend/services/`)
   - Replace mock data fetchers with real queries
   - Maintain response format: `{ totalCount, counties, period }` for data endpoint

2. **ML/NLP Model Integration** (in `backend/services/nlpService.js`)
   - Current placeholder: `nlpController.query()` → service
   - Expected: Process natural language input, return analysis results

3. **Authentication Enhancement** (in `backend/middleware/auth.js`)
   - Upgrade from x-api-key to JWT token validation
   - Add user context to request objects

4. **Frontend State Management** (optional, for complex state)
   - Consider Pinia or Vuex if data sharing across views becomes complex
   - Currently minimal—each view fetches its own data

## Notes for AI Agents
- **Monorepo structure**: Always clarify whether changes affect `/backend` or `/frontend`
- **Mock vs. Real**: Services currently return hardcoded data—flag `TODO` comments as replacement opportunities
- **Port dependencies**: Backend must run before frontend (frontend proxies `/api` to backend:3001)
- **No tests currently**: Consider adding Jest (backend) or Vitest (frontend) when expanding
