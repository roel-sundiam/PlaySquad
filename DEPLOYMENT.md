# PlaySquad Deployment Guide - Render

This guide covers deploying PlaySquad to Render using the Blueprint feature.

## Prerequisites

1. MongoDB Atlas database (or other cloud MongoDB provider)
2. Render account
3. GitHub repository with your code

## Deployment Steps

### 1. Fork/Push to GitHub
Ensure your PlaySquad code is pushed to a GitHub repository that Render can access.

### 2. Create Services on Render

#### Option A: Using Blueprint (Recommended)
1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click "New" → "Blueprint"
3. Connect your GitHub repository
4. Render will automatically detect the `render.yaml` file and create both services

#### Option B: Manual Service Creation

**Backend Service:**
1. Click "New" → "Web Service"
2. Connect GitHub repository
3. Configure:
   - **Name**: `playsquad-backend`
   - **Environment**: `Node`
   - **Build Command**: `cd backend && npm install`
   - **Start Command**: `cd backend && npm start`
   - **Plan**: `Starter` (or higher)

**Frontend Service:**
1. Click "New" → "Static Site"
2. Connect GitHub repository
3. Configure:
   - **Name**: `playsquad-frontend`
   - **Build Command**: `cd frontend && npm install && npm run build`
   - **Publish Directory**: `frontend/dist/frontend`

### 3. Configure Environment Variables

**Backend Environment Variables:**
```
NODE_ENV=production
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/playsquad
JWT_SECRET=your-super-secret-jwt-key-here
FRONTEND_URL=https://playsquad-frontend.onrender.com
```

**Important Notes:**
- Replace `MONGODB_URI` with your actual MongoDB Atlas connection string
- Generate a strong `JWT_SECRET` (at least 32 characters)
- Update `FRONTEND_URL` with your actual frontend URL once deployed

### 4. Database Setup

**MongoDB Atlas:**
1. Create MongoDB Atlas account at [mongodb.com/atlas](https://mongodb.com/atlas)
2. Create a new cluster (free tier available)
3. Create database user with read/write permissions
4. Whitelist Render's IP addresses (or use 0.0.0.0/0 for all IPs)
5. Get connection string and add to `MONGODB_URI` environment variable

### 5. Service URLs

After deployment, your services will be available at:
- **Backend**: `https://playsquad-backend.onrender.com`
- **Frontend**: `https://playsquad-frontend.onrender.com`

### 6. Post-Deployment Setup

1. **Verify Health Endpoint**: Visit `https://playsquad-backend.onrender.com/api/health`
2. **Seed Database**: Access your backend service and run:
   ```bash
   npm run seed
   ```
3. **Test Login**: Use admin credentials from CLAUDE.md to verify authentication

## Environment Variables Reference

### Backend Required Variables
| Variable | Description | Example |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `production` |
| `MONGODB_URI` | MongoDB connection string | `mongodb+srv://user:pass@cluster.mongodb.net/playsquad` |
| `JWT_SECRET` | JWT signing secret | `your-super-secret-key-minimum-32-chars` |
| `FRONTEND_URL` | Frontend application URL | `https://playsquad-frontend.onrender.com` |

### Optional Backend Variables
| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `3000` (auto-set by Render) |

## Render Configuration Files

The repository includes:
- `render.yaml` - Blueprint configuration for both services
- `backend/Dockerfile` - Optional Docker configuration
- `frontend/_redirects` - SPA routing configuration

## Monitoring and Logs

- **Logs**: Available in Render dashboard under each service
- **Health Check**: Backend includes `/api/health` endpoint
- **Performance**: Monitor response times and uptime in Render dashboard

## Custom Domains (Optional)

To use custom domains:
1. Go to service settings in Render dashboard
2. Add custom domain under "Custom Domains"
3. Update DNS records as instructed
4. Update `FRONTEND_URL` environment variable if using custom backend domain

## Troubleshooting

**Common Issues:**

1. **Build Failures**: Check build logs for missing dependencies
2. **Environment Variables**: Ensure all required variables are set
3. **Database Connection**: Verify MongoDB URI and network access
4. **CORS Issues**: Check frontend URL in backend CORS configuration

**Performance Notes:**
- Free tier services sleep after 15 minutes of inactivity
- Consider upgrading to paid plans for production use
- Database connections may timeout on free tiers

## Security Considerations

- Use strong JWT secrets (minimum 32 characters)
- Restrict MongoDB network access when possible
- Keep environment variables secure
- Regularly update dependencies
- Monitor access logs

## Production Checklist

- [ ] MongoDB Atlas cluster configured
- [ ] Environment variables set
- [ ] Health endpoint responding
- [ ] Database seeded with initial data
- [ ] Admin login working
- [ ] Socket.IO connections working
- [ ] Mobile PWA features tested
- [ ] Performance monitoring enabled