#!/usr/bin/env bash
# =============================================================================
# setup-gcp.sh — One-time GCP infrastructure setup for pptx-slideshow-maker
#
# Usage:
#   export GCP_PROJECT=ai-agent-dev-486423
#   export REGION=us-central1
#   export DB_PASSWORD=<choose-a-password>
#   bash scripts/setup-gcp.sh
# =============================================================================
set -euo pipefail

PROJECT="${GCP_PROJECT:-ai-agent-dev-486423}"
REGION="${REGION:-us-central1}"
BUCKET="${GCS_BUCKET:-slideshow-uploads-${PROJECT}}"
DB_INSTANCE="${DB_INSTANCE:-slideshow-db}"
DB_NAME="${DB_NAME:-slideshow}"
DB_USER="${DB_USER:-slideshow}"
DB_PASSWORD="${DB_PASSWORD:?DB_PASSWORD is required}"
AUTH_SECRET="${AUTH_SECRET:-$(openssl rand -base64 32)}"

echo "──────────────────────────────────────────────────────────────"
echo " Setting up GCP for: $PROJECT / $REGION"
echo "──────────────────────────────────────────────────────────────"

# ─── 1. Set active project ────────────────────────────────────
gcloud config set project "$PROJECT"

# ─── 2. Enable required APIs ─────────────────────────────────
echo "▶ Enabling APIs..."
gcloud services enable \
  run.googleapis.com \
  sqladmin.googleapis.com \
  storage.googleapis.com \
  secretmanager.googleapis.com \
  cloudbuild.googleapis.com \
  containerregistry.googleapis.com \
  iam.googleapis.com \
  --project "$PROJECT"

# ─── 3. Create GCS bucket ─────────────────────────────────────
echo "▶ Creating GCS bucket: $BUCKET"
if ! gsutil ls "gs://${BUCKET}" &>/dev/null; then
  gsutil mb -p "$PROJECT" -l "$REGION" "gs://${BUCKET}"
  # Allow public reads for slide images (uploaded with makePublic())
  gsutil iam ch allUsers:objectViewer "gs://${BUCKET}"
  # Set CORS for browser uploads
  cat > /tmp/cors.json <<'EOF'
[{
  "origin": ["*"],
  "method": ["GET", "HEAD"],
  "responseHeader": ["Content-Type", "Cache-Control"],
  "maxAgeSeconds": 3600
}]
EOF
  gsutil cors set /tmp/cors.json "gs://${BUCKET}"
else
  echo "  Bucket already exists, skipping."
fi

# ─── 4. Create Cloud SQL (PostgreSQL) instance ────────────────
echo "▶ Creating Cloud SQL instance: $DB_INSTANCE (this may take 5-10 minutes)..."
if ! gcloud sql instances describe "$DB_INSTANCE" --project "$PROJECT" &>/dev/null; then
  gcloud sql instances create "$DB_INSTANCE" \
    --database-version=POSTGRES_16 \
    --tier=db-f1-micro \
    --region="$REGION" \
    --storage-type=SSD \
    --storage-size=10GB \
    --storage-auto-increase \
    --backup-start-time=02:00 \
    --project "$PROJECT"
else
  echo "  Instance already exists, skipping."
fi

# Create DB user
gcloud sql users create "$DB_USER" \
  --instance="$DB_INSTANCE" \
  --password="$DB_PASSWORD" \
  --project "$PROJECT" 2>/dev/null || echo "  User already exists."

# Create database
gcloud sql databases create "$DB_NAME" \
  --instance="$DB_INSTANCE" \
  --project "$PROJECT" 2>/dev/null || echo "  Database already exists."

# Get the connection string
DB_CONN_NAME=$(gcloud sql instances describe "$DB_INSTANCE" \
  --project "$PROJECT" \
  --format="value(connectionName)")

DATABASE_URL="postgresql://${DB_USER}:${DB_PASSWORD}@/db?host=/cloudsql/${DB_CONN_NAME}&dbname=${DB_NAME}"

echo "  Connection name: $DB_CONN_NAME"

# ─── 5. Create Secret Manager secrets ────────────────────────
echo "▶ Creating secrets in Secret Manager..."

create_or_update_secret() {
  local NAME="$1"
  local VALUE="$2"
  if gcloud secrets describe "$NAME" --project "$PROJECT" &>/dev/null; then
    echo "$VALUE" | gcloud secrets versions add "$NAME" --data-file=- --project "$PROJECT"
    echo "  Updated secret: $NAME"
  else
    echo "$VALUE" | gcloud secrets create "$NAME" --data-file=- --project "$PROJECT"
    echo "  Created secret: $NAME"
  fi
}

create_or_update_secret "slideshow-database-url" "$DATABASE_URL"
create_or_update_secret "slideshow-auth-secret"  "$AUTH_SECRET"
create_or_update_secret "slideshow-nextauth-url"  "https://slideshow-web-${REGION//-/}-${PROJECT}.a.run.app"
# Redis is optional — set to empty to use in-memory fallback
create_or_update_secret "slideshow-redis-url" ""

# ─── 6. Create service account ────────────────────────────────
SA_NAME="slideshow-sa"
SA_EMAIL="${SA_NAME}@${PROJECT}.iam.gserviceaccount.com"

echo "▶ Creating service account: $SA_EMAIL"
if ! gcloud iam service-accounts describe "$SA_EMAIL" --project "$PROJECT" &>/dev/null; then
  gcloud iam service-accounts create "$SA_NAME" \
    --display-name="Slideshow App Service Account" \
    --project "$PROJECT"
fi

# Grant required roles to service account
echo "▶ Granting IAM roles..."
for ROLE in \
  roles/cloudsql.client \
  roles/storage.objectAdmin \
  roles/secretmanager.secretAccessor \
  roles/run.invoker; do
  gcloud projects add-iam-policy-binding "$PROJECT" \
    --member="serviceAccount:${SA_EMAIL}" \
    --role="$ROLE" \
    --condition=None \
    --quiet 2>/dev/null || true
done

# Grant Cloud Build SA access to deploy Cloud Run
CB_SA="${PROJECT}@cloudbuild.gserviceaccount.com"
for ROLE in \
  roles/run.admin \
  roles/iam.serviceAccountUser \
  roles/secretmanager.secretAccessor; do
  gcloud projects add-iam-policy-binding "$PROJECT" \
    --member="serviceAccount:${CB_SA}" \
    --role="$ROLE" \
    --condition=None \
    --quiet 2>/dev/null || true
done

# ─── 7. Connect GitHub repo to Cloud Build ───────────────────
echo ""
echo "──────────────────────────────────────────────────────────────"
echo " Setup complete!"
echo "──────────────────────────────────────────────────────────────"
echo ""
echo "Next steps:"
echo "  1. Connect GitHub repo in Cloud Build:"
echo "     https://console.cloud.google.com/cloud-build/triggers?project=${PROJECT}"
echo ""
echo "  2. Create a trigger pointing to:"
echo "     Repo:   gracie007-cloud/pptx-slideshow-maker"
echo "     Branch: ^master$"
echo "     Config: cloudbuild.yaml"
echo ""
echo "  3. First manual deploy (optional):"
echo "     gcloud builds submit --config cloudbuild.yaml \\"
echo "       --substitutions=_REGION=${REGION},_GCS_BUCKET=${BUCKET},_CLOUDSQL_INSTANCE=${DB_INSTANCE} \\"
echo "       --project=${PROJECT}"
echo ""
echo "  Auth secret (save this): $AUTH_SECRET"
