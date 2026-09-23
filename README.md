# 🎬 Movie Discovery App

A full-stack React and Node.js application for discovering trending movies, searching by title, and managing a personal wishlist. Built as a technical assignment demonstrating robust engineering practices for a fresher/junior role.
Full-stack movie discovery application built with React, Node.js, MongoDB Atlas and TMDB API.

## 🌟 Features

- **Discover Movies:** Browse trending movies with genre filtering, sorting, and pagination (Load More).
- **Search:** Real-time search by movie title with debounce and request cancellation.
- **Movie Details:** View comprehensive details including rating, runtime, overview, and genres.
- **Wishlist:** Add and remove movies to a persistent personal wishlist.
- **Responsive Design:** Mobile-first responsive UI built with Tailwind CSS v4.
- **Robust Error Handling:** Unified error catching, MongoDB 11000 translation, and user-friendly error boundaries.

## 🛠 Tech Stack

**Frontend:**
- React 19 (Vite)
- Tailwind CSS v4
- React Router v7
- Axios
- Lucide React (Icons)

**Backend:**
- Node.js & Express v5
- MongoDB & Mongoose
- Axios (for TMDB API requests)

**External API:**
- [TMDB (The Movie Database) API](https://developer.themoviedb.org/docs)

## 🏗 Architecture & Data Flow

The application uses a **BFF (Backend for Frontend)** architecture.

1. **Security:** The frontend *never* communicates directly with TMDB. The TMDB API key is kept secret on the Node.js server.
2. **Anonymous Sessions:** The frontend generates a UUID (stored in `localStorage`) and sends it via an Axios interceptor as the `x-user-id` header. The backend uses this to namespace the wishlist in MongoDB without requiring full user authentication.
3. **Data Normalization:** TMDB returns heavily nested, snake_case data. The backend normalizes this into clean, consistent camelCase payloads before sending them to the frontend.

### Folder Structure
```
movie-discovery-app/
├── backend/
│   ├── src/             # Express server, routes, controllers, services, models
│   ├── .env.example     # Environment variables template
│   └── test-*.js        # Automated tests
└── frontend/
    └── src/             # React components, pages, hooks, context, services
```

## 🚀 Setup Instructions

### 1. Prerequisites
- Node.js (v18+)
- MongoDB (running locally on port 27017, or an Atlas cluster)
- A TMDB API Key

### 2. Backend Setup
```bash
cd backend
npm install
cp .env.example .env
```
Open `backend/.env` and configure:
- `MONGODB_URI`: Set to your local `mongodb://localhost:27017/movie-discovery` or Atlas string.
- `TMDB_API_KEY`: Your key from TMDB.

Start the backend:
```bash
npm run dev
```
*Runs on `http://localhost:5000`*

### 3. Frontend Setup
```bash
cd frontend
npm install
```
Start the frontend:
```bash
npm run dev
```
*Runs on `http://localhost:5173`*

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/movies?page=1&sort=...&genre=...` | Discover/trending movies |
| `GET` | `/api/movies/search?q=...&page=...` | Search movies by title |
| `GET` | `/api/movies/genres` | All available genres |
| `GET` | `/api/movies/:id` | Single movie detail |
| `GET` | `/api/wishlist` | Get user's wishlist |
| `POST` | `/api/wishlist` | Add movie to wishlist |
| `DELETE` | `/api/wishlist/:movieId` | Remove movie from wishlist |
| `GET` | `/api/health` | Server health check |

## 🧠 Technical Decisions

### Database & Wishlist Design
The `Wishlist` MongoDB schema uses a **Compound Unique Index** on `{ userId: 1, movieId: 1 }`. This delegates the responsibility of preventing duplicate wishlist entries entirely to the database, eliminating application-level race conditions.

### Caching Approach
To respect TMDB rate limits and speed up responses, the backend uses a simple in-memory `Map` cache:
- **Genres:** Cached for 24 hours.
- **Movie Details:** Cached for 30 minutes.
- **Discover Results:** Cached for 10 minutes.
- **Search Results:** *Not cached* (too variable).

### Search Debouncing & Request Cancellation
The frontend `Search.jsx` uses a custom `useDebounce` hook (500ms) to prevent hammering the API on every keystroke. Furthermore, it leverages the native `AbortController` API to cancel in-flight network requests if the user modifies their search term before the previous request finishes, preventing stale data from overwriting new data.

### Error Handling
- **Backend:** An `asyncHandler` wrapper catches promise rejections and routes them to a centralized `errorHandler` middleware. This middleware translates MongoDB `11000` errors into clean HTTP `409 Conflict` responses.
- **Frontend:** API requests populate an `error` state which renders a unified `<ErrorState>` component with a "Try Again" fallback.

## 🧪 Testing

The backend includes zero-dependency automated tests demonstrating logic verification:
```bash
cd backend
node test-normalize.js    # Tests data transformation and fallback logic
node test-edgecases.js    # Tests MongoDB error translation and API mapping
```

## 📌 Assumptions & Known Limitations

1. **Anonymous Authentication:** Wishlists are tied to `localStorage`. If the user clears their browser data or switches devices, their wishlist is lost.
2. **In-Memory Cache:** The backend cache is cleared if the Node.js server restarts. (At enterprise scale, this would be moved to Redis).
3. **Express Rate Limiting:** Rate limiting is enforced per-IP in memory, which is sufficient for a single-instance deployment but would need a persistent store for multi-instance scaling.

## 🤖 AI Usage

This project was developed with the assistance of an AI coding agent to accelerate boilerplate generation, scaffold the Tailwind UI, and simulate a technical audit. All architectural decisions (BFF, Compound Indexes, AbortController) were deliberate engineering choices directed and validated by the developer.

## 🔮 Future Improvements

- Add comprehensive unit testing via Jest/Vitest.
- Implement user accounts (JWT or OAuth) for cross-device wishlist syncing.
- Migrate backend cache to Redis for multi-instance deployment.
- Implement React Query (or SWR) on the frontend for robust client-side caching and background refetching.
