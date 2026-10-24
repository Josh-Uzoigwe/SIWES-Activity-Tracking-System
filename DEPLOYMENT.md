# SIWES Backend Deployment Guide for Render

This repository is pre-configured for deployment on [Render](https://render.com) using the included [`render.yaml`](./render.yaml) blueprint.

---

## 1. Cloud Database Requirement (MySQL)

Render does not natively host MySQL databases on its platform (it only supports PostgreSQL and Redis).
Because the SIWES backend uses Prisma with MySQL (`provider = "mysql"`), you need a free cloud MySQL database URL:

### Recommended Free MySQL Providers:
1. **[TiDB Cloud](https://tidbcloud.com/)** (Recommended — 100% MySQL compatible, generous free tier):
   - Sign up at https://tidbcloud.com
   - Click **Create Cluster** -> Select **Serverless (Free)**.
   - Click **Connect**, choose **Prisma** or **General**, and copy the connection string:
     ```
     mysql://username:password@gateway01.region.prod.aws.tidbcloud.com:4000/siwes_db?sslaccept=strict
     ```
2. **[Aiven for MySQL](https://aiven.io/)** (Free trial / free credits):
   - Create a free MySQL service and copy the Service URI.
3. **[Railway](https://railway.app/)**:
   - Create a new project -> Add **MySQL** -> Copy `DATABASE_URL`.

---

## 2. Deploying on Render (Two Methods)

### Method A: Blueprint 1-Click (Fastest)
1. Go to [dashboard.render.com](https://dashboard.render.com) and log in with your GitHub account.
2. Click **New +** at the top right and select **Blueprint**.
3. Select your repository: `Josh-Uzoigwe/SIWES-Activity-Tracking-System`.
4. Render will detect `render.yaml` and configure:
   - Service Name: `siwes-backend`
   - Root Directory: `server`
   - Build Command: `npm install && npm run build && npm run db:push && npm run seed`
   - Start Command: `npm start`
5. Under Environment Variables:
   - Paste your `DATABASE_URL` (from TiDB, Aiven, or Railway).
   - Render automatically generates secure random values for `JWT_SECRET` and `JWT_REFRESH_SECRET`.
6. Click **Apply**. Render will build the app, migrate the database schema, seed the default ITF Officer account (`itf@test.com`), and bring your API live!

---

### Method B: Manual Web Service Setup
If you prefer setting it up manually:
1. Go to [dashboard.render.com](https://dashboard.render.com) -> **New +** -> **Web Service**.
2. Connect `Josh-Uzoigwe/SIWES-Activity-Tracking-System`.
3. Configure the settings:
   - **Name**: `siwes-backend`
   - **Region**: Closest to you (e.g., Frankfurt or Oregon)
   - **Branch**: `master`
   - **Root Directory**: `server`
   - **Runtime**: `Node`
   - **Build Command**: `npm install && npm run build && npm run db:push && npm run seed`
   - **Start Command**: `npm start`
   - **Plan**: `Free`
4. Under **Advanced** -> **Environment Variables**, add:
   - `NODE_ENV`: `production`
   - `DATABASE_URL`: `your-mysql-cloud-connection-string`
   - `JWT_SECRET`: `your_random_secret_32_characters_long`
   - `JWT_REFRESH_SECRET`: `your_random_refresh_secret_32_characters_long`
   - `FRONTEND_URL`: `*` (or your deployed frontend URL)
5. Click **Deploy Web Service**.

---

## 3. Verify Your Live Deployment

Once Render finishes deploying (Status changes to **Live**):
- Your backend URL will be: `https://siwes-backend-xxxx.onrender.com`
- Check health: `https://siwes-backend-xxxx.onrender.com/health` (returns `{"status":"healthy"}`)
- API root: `https://siwes-backend-xxxx.onrender.com/` (returns API details)

### Default ITF Admin Account:
- **Email**: `itf@test.com`
- **Password**: `password123`
