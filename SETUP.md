# Deployment Setup Guide

This document outlines the necessary steps to deploy and configure the Telegram Aggregator application on Google Cloud Platform (GCP).

## Prerequisites

- Google Cloud Platform (GCP) Account
- Google Cloud SQL instance (PostgreSQL 15+ with `pgvector` support)
- Google Cloud Run (for hosting the application)
- Google Gemini API Key (for embeddings and AI features)
- Telegram API credentials (API ID and API Hash)
- Node.js 18+ (for local development/building)

## 1. Environment Variables Configuration

Create a `.env.production` file or configure these directly in Google Cloud Run secret manager:

```env
# Database (Cloud SQL)
DATABASE_URL="postgresql://user:password@host:port/dbname?schema=public"

# Authentication
NEXTAUTH_URL="https://your-cloud-run-url.run.app"
NEXTAUTH_SECRET="your-super-secret-random-string" # Generate with: openssl rand -base64 32

# Admin Account Setup
INITIAL_ADMIN_EMAIL="admin@yourdomain.com"
INITIAL_ADMIN_PASSWORD="secure-initial-password"

# Telegram API
TELEGRAM_API_ID="your_api_id"
TELEGRAM_API_HASH="your_api_hash"
TELEGRAM_PHONE_NUMBER="your_phone_number"

# Google AI (Gemini)
GEMINI_API_KEY="your_gemini_api_key"
```

## 2. Database Setup (Cloud SQL)

1. **Create Instance:** Provision a Cloud SQL for PostgreSQL instance.
2. **Enable pgvector:** Ensure the `cloudsql.enable_pgvector` flag is turned on in your Cloud SQL instance settings.
3. **Run Migrations:** Connect to your database using `psql` or Cloud SQL Studio and execute the provided migration script:
   ```bash
   psql -h <INSTANCE_IP> -U <USER> -d <DB_NAME> -f migrations/001_initial_schema.sql
   ```
   *Note: The schema is configured for 768-dimensional vectors to match Google's `text-embedding-004` model.*

## 3. Initial Admin Account Creation

1. **Automated Script:** Run the seed script to create the first admin account using the credentials from your environment variables.
   ```bash
   npm run seed:admin
   ```

## 4. Background Jobs Setup

The application relies on background jobs to fetch new posts and generate vector embeddings.
1. **Cloud Scheduler & Cloud Tasks:** On GCP, you can use Cloud Scheduler to trigger a secure endpoint on your Cloud Run service (e.g., `/api/cron/fetch`) every 5 minutes.
2. **Embedding Generation:** When new posts are fetched, the backend should call the Gemini API (`text-embedding-004`) to generate 768-dimensional embeddings and store them in the `pgvector` column.

## 5. Telegram Authentication

1. **First Run Login:** The backend needs to authenticate with Telegram. This may require a one-time login code sent to your phone.
2. **Session Storage:** Store the generated Telegram session string securely (e.g., in Google Secret Manager or a Cloud SQL table) so the container doesn't need to re-authenticate when Cloud Run scales.

## 6. Deployment to Google Cloud Run

1. **Containerize:** Ensure you have a `Dockerfile` configured for a Next.js production build.
2. **Build and Deploy:**
   ```bash
   gcloud run deploy telegram-aggregator \
     --source . \
     --region us-central1 \
     --allow-unauthenticated \
     --set-env-vars="DATABASE_URL=...,GEMINI_API_KEY=..."
   ```
3. **Verify:**
   - Access the provided Cloud Run URL.
   - Log in with the initial admin credentials.
   - Add a test Telegram channel.
   - Verify that posts are fetched, embedded using Google AI, and searchable via `pgvector`.
