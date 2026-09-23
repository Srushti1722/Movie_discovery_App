# Movie Discovery App

## 1. Overview
The **Movie Discovery App** is a full-stack web application designed for browsing, searching, and cataloging movies. It solves the cold-start problem common in traditional search-only interfaces by immediately presenting users with a discoverable feed of trending movies on initial load—no search query required.

Users can:
- Instantly discover popular and trending movies with dynamic sorting and genre filtering.
- Search for movies by title with real-time debouncing and stale-request cancellation.
- Inspect detailed movie metadata including ratings, genres, status, runtime, and plot overviews.
- Save and manage movies in a persistent personal wishlist that remains saved across browser refreshes and sessions.

---

## 2. Features
- **Movie Discovery:** Immediate access to trending movies with options to filter by genre and sort by popularity, rating, or release date.
- **Search:** Search movies by title with automatic 500ms debouncing and network request cancellation.
- **Genre & Category Filtering:** Backend-driven genre selection that re-fetches and updates movie feeds dynamically.
- **Sorting:** Multi-parameter sorting (`popularity.desc`, `popularity.asc`, `vote_average.desc`, `release_date.desc`).
- **Load More Pagination:** Sequential pagination appending additional movie results as users explore.
- **Movie Details:** Dedicated detail pages showcasing high-resolution posters, backdrops, vote counts, runtime, status, and genres.
- **Persistent Wishlist:** Add/remove functionality backed by MongoDB with instant optimistic UI updates.
- **Comprehensive UI States:** Explicit loading spinners, error alerts with retry triggers, and friendly empty-state fallbacks.
- **Responsive UI:** Mobile-first layout scaling from compact mobile screens (2 columns) up to wide desktops (5 columns).

---

## 3. Tech Stack

### Frontend
- **React 19 (`^19.2.8`)**: Component-based UI library.
- **Vite 8 (`^8.3.0`)**: Build tool and development server.
- **React Router v7 (`^7.18.4`)**: Client-side declarative routing.
- **Tailwind CSS v4 (`^4.3.3`)**: Utility-first CSS styling.
- **Axios (`^1.20.0`)**: HTTP client for API communication.
- **Lucide React (`^1.47.0`)**: Icon library.

### Backend
- **Node.js**: Runtime environment.
- **Express 5 (`^5.2.1`)**: Backend REST API framework.
- **Mongoose 9 (`^9.10.2`)**: MongoDB object data modeling (ODM).
- **Axios (`^1.20.0`)**: Server-side client for fetching data from the external TMDB API.
- **CORS (`^2.8.6`)**: Cross-origin resource sharing middleware.
- **express-rate-limit (`^8.7.0`)**: IP rate limiting middleware.
- **dotenv (`^18.0.3`)**: Environment variable loader.

### Database
- **MongoDB**: NoSQL document database (compatible with local instances or MongoDB Atlas) for persistent wishlist storage.

### External API
- **TMDB (The Movie Database) API**: Source of truth for movie discovery, details, genres, and imagery.

### Supporting Tools
- **oxlint (`^1.81.0`)**: Fast JavaScript/React linter.
- **nodemon (`^3.1.14`)**: Backend development live-reload.

---

## 4. Architecture
The application employs a **Backend for Frontend (BFF) / API Proxy pattern**.

```
┌───────────────────────────────────────────────────────────┐
│                     React Frontend                        │
│             (Vite Dev Server : localhost:5173)            │
└─────────────────────────────┬─────────────────────────────┘
                              │ HTTP + Header (x-user-id)
                              ▼
┌───────────────────────────────────────────────────────────┐
│                    Express.js Backend                     │
│               (Node.js Server : localhost:5000)           │
├─────────────────────────────┬─────────────────────────────┤
│   In-Memory Cache (Map)     │   Data Normalization Layer  │
└──────────────┬──────────────┴──────────────┬──────────────┘
               │                             │
               ▼                             ▼
   ┌──────────────────────┐      ┌──────────────────────┐
   │     TMDB REST API    │      │    MongoDB / Atlas   │
   │ (api.themoviedb.org) │      │ (Wishlist Collection)│
   └──────────────────────┘      └──────────────────────┘
```

### Why the Frontend Does Not Call TMDB Directly:
1. **API Key Security:** TMDB requires an API key. Calling TMDB directly from the browser exposes the key in the browser network inspector and client bundle. The backend keeps `TMDB_API_KEY` hidden server-side.
2. **Data Normalization:** TMDB payloads contain nested structures, snake_case keys, and unused properties. The backend transforms data into a predictable, camelCase format tailored to UI requirements.
3. **Caching & Rate Limit Protection:** The backend caches frequent requests (genres, popular movies, details) in memory, minimizing external API consumption and preventing quota exhaustion.

---

## 5. Data Flow

### Movie Discovery
1. User loads the home page or updates filter/sort controls.
2. `Home.jsx` calls `movieService.getMovies({ page, sort, genre })`.
3. Backend checks in-memory cache for key `discover:page={p}:genre={g}:sort={s}`.
4. On cache miss, backend calls TMDB `GET /3/discover/movie`.
5. Backend normalizes TMDB items using `normalizeMovieSummary()`.
6. Result is cached (10 min TTL) and returned to the frontend.

### Search
1. User types in `Navbar.jsx`, managed through `useDebounce` (500ms delay).
2. Debounced query updates URL parameters (`/search?q=...`).
3. `Search.jsx` mounts an `AbortController` and requests `movieService.searchMovies(query, page, signal)`.
4. If the query changes before resolution, `controller.abort()` cancels the previous in-flight HTTP request.
5. Backend calls TMDB `GET /3/search/movie`, normalizes results, and responds. Search results are intentionally not cached.

### Movie Details
1. User navigates to `/movie/:id`.
2. `MovieDetails.jsx` requests `movieService.getMovieById(id)`.
3. Backend checks cache for key `movie:{id}` (30 min TTL).
4. On miss, backend requests TMDB `GET /3/movie/{id}`.
5. Backend processes payload via `normalizeMovieDetail()`, stripping sensitive financial metadata and extracting clean genre arrays.

### Wishlist
1. Axios request interceptor attaches `x-user-id` (anonymous UUID from `localStorage`) to headers.
2. Frontend calls `POST /api/wishlist` or `DELETE /api/wishlist/:movieId`.
3. Express verifies header via `validateUserId` middleware.
4. Backend executes Mongoose operations on MongoDB.
5. `WishlistContext.jsx` manages global state across components with optimistic updates.

---

## 6. Backend API

| Method | Route | Purpose | Key Parameters | Response Description |
|---|---|---|---|---|
| `GET` | `/api/health` | Service health & uptime probe | None | Server status, timestamp, and environment |
| `GET` | `/api/movies` | Discover/browse movies | Query: `page` (int), `genre` (int), `sort` (enum) | Normalized movie summaries and pagination metadata |
| `GET` | `/api/movies/genres` | Get available movie genres | None | Array of `{ id, name }` genre mappings |
| `GET` | `/api/movies/search` | Search movie catalog | Query: `q` (string, required), `page` (int) | Matching movie summaries and pagination metadata |
| `GET` | `/api/movies/:id` | Fetch full movie details | Path: `id` (numeric movie ID) | Full normalized movie detail object |
| `GET` | `/api/wishlist` | Retrieve user wishlist | Header: `x-user-id` (UUID string) | Array of saved movie objects sorted newest first |
| `POST` | `/api/wishlist` | Add movie to wishlist | Header: `x-user-id`<br>Body: `{ movieId, title, posterUrl, releaseDate, rating }` | HTTP 201 with saved document |
| `DELETE` | `/api/wishlist/:movieId`| Remove movie from wishlist | Header: `x-user-id`<br>Path: `movieId` (numeric movie ID) | HTTP 200 with deletion confirmation |

---

## 7. Movie Data Normalization
TMDB returns complex responses with snake_case keys and varying structures depending on the endpoint. The normalization utility (`backend/src/utils/normalizeMovie.js`) standardizes these payloads.

### Transformations Applied:
- **Image URL Assembly:** Prefixes partial poster and backdrop paths with TMDB CDN base URLs (`https://image.tmdb.org/t/p/w500` and `w1280`).
- **Rating Standardization:** Formats `vote_average` to a single decimal float (e.g., `8.431` → `8.4`), defaulting to `0` when absent.
- **Genre Extraction:** Converts TMDB detail objects (`[{ id: 28, name: "Action" }]`) into clean string arrays (`["Action"]`).
- **Date Formatting:** Preserves date strings (`YYYY-MM-DD`) while mapping missing or empty values to `null`.
- **Payload Sanitization:** Explicitly omits unneeded or sensitive attributes (e.g., `budget`, `revenue`, `production_companies`, `adult`).
- **Fallback Handling:** Defaults missing titles to `original_title` or `'Untitled'`.

---

## 8. Database and Wishlist

### Storage & Schema
Wishlists are stored in MongoDB using Mongoose (`backend/src/models/Wishlist.js`). The document schema stores:
- `userId` (String): Anonymous UUID created in client `localStorage`.
- `movieId` (Number): Unique numeric TMDB identifier.
- `title` (String): Movie title.
- `posterUrl` (String, nullable): Image path for display.
- `releaseDate` (String, nullable): Release date.
- `rating` (Number): Vote average.
- `timestamps`: Automatic `createdAt` and `updatedAt` tracking.

### Compound Unique Index
A compound unique index is enforced on `{ userId: 1, movieId: 1 }`:
- **Fast Queries:** Index-accelerated queries for `find({ userId })`.
- **Duplicate Prevention:** Database-level uniqueness prevents the same movie from being added multiple times under the same `userId`.

### Persistence Across Sessions
When a user accesses the app, `userId.js` checks `localStorage.getItem('movie_app_user_id')`. If not found, a standard v4 UUID is generated via `crypto.randomUUID()` and saved to `localStorage`. This UUID is sent in the `x-user-id` header on every request, preserving wishlists across browser restarts.

---

## 9. Performance and Request Handling

- **In-Memory Caching (`cache.js`):** Process-level key-value `Map` implementing TTL expirations:
  - Genres: 24 Hours
  - Movie Details: 30 Minutes
  - Discover / Trending: 10 Minutes
  - Search: Uncached
- **Search Debouncing (`useDebounce.js`):** Defers search queries by 500ms after user keystrokes to minimize backend load.
- **Request Cancellation (`AbortController`):** Cancels pending Axios search requests when search terms change, preventing out-of-order responses from overwriting newer queries.
- **Global Context State (`WishlistContext.jsx`):** Single shared state provider preventing duplicate fetches across components and synchronizing wishlist status across cards, detail pages, and the wishlist view.
- **Rate Limiting:** Express endpoint limiter restricting client IPs to 100 requests per 15-minute window.

---

## 10. Error, Loading, and Edge-Case Handling

- **Loading States:** Explicit spinners (`LoadingState.jsx`) displayed during network transactions.
- **Empty States:** Rendered when searches return no results (`EmptyState.jsx`) or when the wishlist is empty.
- **Backend & TMDB Outages:** Unreachable upstream services trigger an `ApiError` with HTTP status `502 Bad Gateway`, rendered cleanly via `ErrorState.jsx` with a retry callback.
- **Duplicate Insertion (Race Conditions):** MongoDB `E11000` duplicate key errors are intercepted by `errorHandler.js` and converted to a clean `409 Conflict`.
- **Safe Value Fallbacks:** Rating displays use nullish coalescing `(movie.rating ?? 0).toFixed(1)` to guard against missing rating numbers.
- **Retry Mechanism:** Error boundaries on search and home feeds allow instant refetching without forcing a full page reload.

---

## 11. Responsive Design
The UI is constructed mobile-first with Tailwind CSS v4:
- **Screen Widths:** 
  - Mobile (<640px): 2-column grid, compact header icon navigation.
  - Tablet (640px–1024px): 3 to 4-column grid.
  - Desktop (>1024px): 5-column grid.
- **Poster Dimension Uniformity:** Enforces strict `aspect-[2/3]` sizing with `object-cover` and slate fallback placeholders for missing posters.
- **Text Truncation:** Movie titles use `line-clamp-1` with native HTML `title` attributes to handle long titles without breaking layout cards.

---

## 12. Environment Setup

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **MongoDB**: Local MongoDB instance (port 27017) or a MongoDB Atlas cluster URI
- **TMDB API Key**: Free API key from [The Movie Database](https://www.themoviedb.org/settings/api)

### Installation & Execution

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Srushti1722/Movie_discovery_App.git
   cd Movie_discovery_App
   ```

2. **Backend Setup:**
   ```bash
   cd backend
   npm install
   cp .env.example .env
   ```
   *Edit `backend/.env` with your `TMDB_API_KEY` and `MONGODB_URI`.*

   Start backend:
   ```bash
   npm run dev
   ```
   *Backend runs on `http://localhost:5000`*

3. **Frontend Setup:**
   ```bash
   cd ../frontend
   npm install
   npm run dev
   ```
   *Frontend runs on `http://localhost:5173`*

---

## 13. Environment Variables

### Backend (`backend/.env`)
| Variable | Description | Example / Default |
|---|---|---|
| `PORT` | Port for Express server | `5000` |
| `NODE_ENV` | Runtime environment | `development` |
| `FRONTEND_URL` | Allowed origin for CORS | `http://localhost:5173` |
| `TMDB_API_KEY` | TMDB API Authentication Key | `your_tmdb_api_key_here` |
| `TMDB_BASE_URL` | Upstream TMDB API root | `https://api.themoviedb.org/3` |
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/movie-discovery` |

### Frontend (`frontend/.env` - Optional)
| Variable | Description | Default |
|---|---|---|
| `VITE_API_URL` | Base URL pointing to backend API | `http://localhost:5000/api` |

---

## 14. Project Structure

```
movie-discovery-app/
├── backend/
│   ├── src/
│   │   ├── config/          # Database connection (db.js)
│   │   ├── controllers/     # HTTP route handlers (movieController, wishlistController)
│   │   ├── middleware/      # Error handler, user validation
│   │   ├── models/          # Mongoose schemas (Wishlist.js)
│   │   ├── routes/          # Express route definitions (movies.js, wishlist.js)
│   │   ├── services/        # Business logic & TMDB API calls (tmdbService, wishlistService)
│   │   ├── utils/           # Cache, Normalizer, ApiError, AsyncHandler
│   │   ├── app.js           # Express app configuration & middleware pipeline
│   │   └── server.js        # Server boot & graceful shutdown
│   ├── test-edgecases.js    # Edge case integration tests
│   ├── test-normalize.js    # Data transformation test suite
│   ├── package.json
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── assets/          # Static assets
│   │   ├── components/      # UI components (Navbar, MovieCard, Layout, StateComponents)
│   │   ├── context/         # Global state (WishlistContext.jsx)
│   │   ├── hooks/           # Custom React hooks (useDebounce.js, useWishlist.js)
│   │   ├── pages/           # Views (Home.jsx, Search.jsx, MovieDetails.jsx, Wishlist.jsx)
│   │   ├── services/        # Axios API clients (api.js, movieService.js, wishlistService.js)
│   │   ├── utils/           # Client helpers (userId.js)
│   │   ├── App.jsx          # Route declarations
│   │   ├── main.jsx         # React application root
│   │   └── index.css        # Tailwind imports and theme variables
│   ├── package.json
│   └── vite.config.js
├── .gitignore               # Comprehensive Git ignore rules
└── README.md                # Project documentation
```

---

## 15. Technical Decisions

- **React over Multi-Page SSR:** Provides an interactive Single Page Application (SPA) experience with client-side routing, instant state updates, and smooth transitions.
- **Node.js & Express:** Lightweight, non-blocking I/O runtime suited for API aggregation, routing, and header processing.
- **BFF Architecture:** Shields third-party API credentials, formats payloads, and applies rate limiting before data reaches the client.
- **Data Normalization:** Protects frontend components from schema drift in third-party APIs and trims payload sizes.
- **MongoDB for Wishlist Storage:** Flexible document model accommodating denormalized movie cards with native compound unique indexing.
- **Anonymous Session UUIDs:** Enables persistent user-specific storage via `localStorage` and `x-user-id` headers without requiring an authentication and session-management backend.

---

## 16. Assumptions
- Movie metadata provided by TMDB remains the primary source of truth.
- Local storage persistence is adequate for single-device anonymous wishlists.
- Single-instance in-memory caching is sufficient for development and demonstration workloads.

---

## 17. Known Limitations
- **Anonymous Wishlist Scope:** Clearing browser `localStorage` disconnects the client from their previous wishlist UUID.
- **In-Memory Cache Volatility:** Cache contents clear upon Node.js server restarts.
- **Single-Process Rate Limiter:** `express-rate-limit` tracks IP windows in process memory rather than a shared Redis store.

---

## 18. Testing

The repository contains automated test scripts verifying backend normalization and database edge cases:

### Run Tests:
```bash
cd backend
node test-normalize.js
node test-edgecases.js
```

### Coverage:
- **`test-normalize.js` (30 assertions):** Validates normalization of summary fields, detail fields, camelCase transformations, image URL resolution, and null-data fallbacks.
- **`test-edgecases.js` (3 assertions):** Validates removal of private MongoDB fields (`_id`, `__v`), propagation of `E11000` duplicate errors, and 404 handling on missing items.

### Frontend Build Verification:
```bash
cd frontend
npm run build
```
Executes production Vite compilation, verifying JSX syntax, module resolution, and asset bundling.

---

## 19. AI Usage
AI tools were used during development as a supporting aid for understanding documentation, exploring implementation approaches, debugging issues, generating initial boilerplate, and reviewing parts of the implementation. The final architecture, technology choices, integration decisions, and behaviour were reviewed and validated as part of the development process.

### Concrete Correction Example:
During the technical audit, the initial search retry implementation was found to pass an out-of-scope `fetchResults` function reference to the `<ErrorState>` retry prop, causing a `ReferenceError` on failure. The issue was identified and resolved by introducing a `retryCount` dependency trigger within `Search.jsx`, allowing error retries while preserving `AbortController` cancellation cleanup.

---

## 20. What I Would Improve With More Time
1. **Shared Distributed Caching:** Replace in-memory `Map` with Redis to persist caches across server restarts and cluster instances.
2. **User Authentication:** Introduce JWT-based authentication or OAuth (Google/GitHub) to allow cross-device wishlist synchronization.
3. **Comprehensive End-to-End Testing:** Implement Playwright or Cypress for browser automated user-flow testing.
4. **Accessibility (a11y) Auditing:** Add full ARIA live regions for async state announcements and verify WCAG 2.1 AA keyboard navigation.
5. **Infinite Scrolling:** Provide an optional virtualized infinite scroll alternative to the "Load More" pagination button.

---

## 21. Assignment Requirements Coverage

| Requirement | Implementation |
|---|---|
| Movie discovery without initial search | `Home.jsx` immediately fetches trending movies on initial mount. |
| Movie search | `Search.jsx` queries `/api/movies/search` with dynamic query handling. |
| Categories & attributes displayed | Displays title, poster, release year, rating, overview, and genre tags. |
| Filtering & Sorting | Genre select dropdown and multi-parameter sort controls on discovery feed. |
| Continued exploration / Pagination | "Load More" pagination appending subsequent result pages seamlessly. |
| Movie details | Dedicated `/movie/:id` view fetching full metadata and backdrops. |
| Persistent wishlist | MongoDB storage indexed by `userId` and `movieId` with optimistic UI updates. |
| Navigation & context preservation | React Router `Layout` with persistent header search and back navigation. |
| Loading, empty, and error states | Dedicated `LoadingState`, `EmptyState`, and `ErrorState` components on all views. |
| Backend abstraction & security | Express BFF proxying TMDB with secret key hidden server-side. |
| Request optimization & resilience | 500ms search debouncing, `AbortController` cancellation, and in-memory TTL caching. |
| Responsive layout | Tailwind responsive grid adapting across mobile, tablet, and desktop breakpoints. |
| Maintainability & Clean Architecture | Modular structure separating routes, controllers, services, models, and UI context. |

---

## 22. Running the Application

To run the complete application locally:

```bash
# Terminal 1: Backend
cd backend
npm install
npm run dev

# Terminal 2: Frontend
cd frontend
npm install
npm run dev
```
Open **`http://localhost:5173`** in your browser to explore the app.
