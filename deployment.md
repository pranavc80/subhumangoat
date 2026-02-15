# McKinney Orbit Deployment Guide

This guide provides step-by-step instructions for deploying the McKinney Orbit project.

## Prerequisites
- A GitHub repository with your source code.
- Accounts on [Vercel](https://vercel.com) (Frontend) and [Railway](https://railway.app) (Backend).

---

## 1. Frontend Deployment (Vercel)

Vercel is the recommended platform for Next.js applications.

1.  **Import Project**: Connect your GitHub account to Vercel and import the `mckinneyorbit4` repository.
2.  **Edit Settings**:
    *   **Root Directory**: `mk-frontend`
    *   **Framework Preset**: Next.js
3.  **Environment Variables**:
    *   `NEXT_PUBLIC_API_URL`: The URL of your deployed backend (e.g., `https://your-backend.up.railway.app`).
4.  **Deploy**: Click "Deploy". Vercel will automatically build and host your site.

---

## 2. Backend Deployment (Railway)

Railway is excellent for Bun-based backends.

1.  **New Project**: Create a new project on Railway and connect your GitHub repository.
2.  **Configure Service**:
    *   Railway will detect the `mk-backend` directory if you point it there, or you can use the `Dockerfile`.
    *   **Root Directory**: `mk-backend`
3.  **Environment Variables**:
    *   `PORT`: `3000`
    *   `DISCORD_WEBHOOK_URL`: Your actual Discord webhook URL.
    *   `API_KEY`: Your secret API key.
4.  **Deploy**: Railway will build the image and start the Bun server.

---

## 3. Alternative: Docker Deployment (VPS)

If you prefer to host on a VPS (like DigitalOcean or Hetzner):

1.  **Clone Repository**: `git clone <your-repo-url>`
2.  **Environment Setup**: Create a `.env` file in the root with your secrets.
3.  **Run with Docker Compose**:
    ```bash
    docker-compose up -d --build
    ```
4.  **Reverse Proxy**: Use Nginx or Caddy to route traffic to ports `3000` (Frontend) and `3001` (Backend).

---

## Important Notes

> [!WARNING]
> Ensure that `NEXT_PUBLIC_API_URL` in the frontend starts with `https://` in production to avoid mixed-content errors.

> [!TIP]
> Use the `docker-compose.yml` provided in the root directory for local testing before pushing to production.
