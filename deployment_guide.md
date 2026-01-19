# Deploying to Render

Your project is now configured to be deployed as a single web service on Render. The backend will serve your React Native Web frontend.

## Prerequisites
1.  **GitHub**: Make sure your code is pushed to a GitHub repository.

## Steps

### 1. Create a Web Service
1.  Log in to [Render dashboard](https://dashboard.render.com/).
2.  Click **New +** -> **Web Service**.
3.  Connect your GitHub repository.

### 2. Configure Service
-   **Name**: Give your service a name (e.g., `todo-task-app`).
-   **Region**: Choose a region close to you (e.g., Singapore, Frankfurt).
-   **Branch**: `main` (or your working branch).
-   **Root Directory**: Leave empty (defaults to root).
-   **Runtime**: **Node**
-   **Build Command**: `npm install && npm run build`
-   **Start Command**: `npm start`

### 3. Environment Variables
Scroll down to "Environment Variables" and add these key-value pairs (match your local `.env` values):

| Key | Value |
| :--- | :--- |
| `MONGO_URI` | `mongodb+srv://angelaaconsultants:Green%402026@cluster0.4i5uae8.mongodb.net/todo_task?retryWrites=true&w=majority` |
| `JWT_SECRET` | `jet-ski-super-secret-key-2026` |
| `NODE_ENV` | `production` |

### 4. Deploy
-   Click **Create Web Service**.
-   Render will start building your app. You can watch the logs.
-   Once finished, you will get a URL (e.g., `https://todo-task-app.onrender.com`).

## Troubleshooting
-   If the build fails, check the "Logs" tab.
-   Ensure `npm run build` works locally before pushing.
