terraform {
  backend "gcs" {
    bucket = "photoalbum-terraform-state"
    prefix = "terraform/state"
  }
}

provider "google" {
  project = "project-9217c1a1-988a-4f7c-990"
  region  = "europe-west1"
}

data "google_secret_manager_secret_version" "db_password" {
  secret = "db_password"
}

# ------------- Service Account létrehozása a backendnek -------------
resource "google_service_account" "backend_sa" {
  account_id   = "photo-album-backend-sa"
  display_name = "photoalbum-be-sa"
}

resource "google_project_iam_member" "sql_client" {
  project = "project-9217c1a1-988a-4f7c-990"
  role    = "roles/cloudsql.client"
  member  = "serviceAccount:${google_service_account.backend_sa.email}"
}

resource "google_storage_bucket_iam_member" "storage_admin" {
  bucket = google_storage_bucket.images.name
  role   = "roles/storage.objectAdmin"
  member = "serviceAccount:${google_service_account.backend_sa.email}"
}

resource "google_project_iam_member" "secret_access" {
  project = "project-9217c1a1-988a-4f7c-990"
  role    = "roles/secretmanager.secretAccessor"
  member  = "serviceAccount:${google_service_account.backend_sa.email}"
}

resource "google_project_iam_member" "log_writer" {
  project = "project-9217c1a1-988a-4f7c-990"
  role    = "roles/logging.logWriter"
  member  = "serviceAccount:${google_service_account.backend_sa.email}"
}

resource "google_project_iam_member" "metric_writer" {
  project = "project-9217c1a1-988a-4f7c-990"
  role    = "roles/monitoring.metricWriter"
  member  = "serviceAccount:${google_service_account.backend_sa.email}"
}

# ------------- Cloud Run Services -------------
resource "google_sql_database_instance" "postgres" {
  name             = "cloud-photo-album-paas"
  database_version = "POSTGRES_18"
  region           = "europe-west1"
  
  deletion_protection = true 

  settings {
    tier = "db-g1-small"
  }
}

resource "google_storage_bucket" "images" {
  name          = "photoalbum-images" 
  location      = "europe-west1"
  force_destroy = false 
}

resource "google_cloud_run_v2_service" "backend" {
  name     = "cloud-photo-album-paas"
  location = "europe-west1"

  template {
    service_account = google_service_account.backend_sa.email

    volumes {
      name = "cloudsql"
      cloud_sql_instance {
        instances = [google_sql_database_instance.postgres.connection_name]
      }
    }

    containers {
      image = "europe-west1-docker.pkg.dev/project-9217c1a1-988a-4f7c-990/cloud-run-source-deploy/cloud-photo-album-paas/cloud-photo-album-paas:latest"
      
      volume_mounts {
        name       = "cloudsql"
        mount_path = "/cloudsql"
      }

      env {
        name  = "GoogleCloudStorage__BucketName"
        value = google_storage_bucket.images.name
      }

      env {
        name  = "ConnectionStrings__DefaultConnection"
        value = "Host=/cloudsql/${google_sql_database_instance.postgres.connection_name};Database=postgres;Username=postgres;Password=${data.google_secret_manager_secret_version.db_password.secret_data}"
      }

      env {
        name  = "AllowedOrigins__0"
        value = "https://photoalbum-fe-107675218729.europe-west1.run.app"
      }
    }

    scaling {
      min_instance_count = 0
      max_instance_count = 10
    }
  }

  depends_on = [google_sql_database_instance.postgres]
}

resource "google_cloud_run_v2_service" "frontend" {
  name     = "photoalbum-fe"
  location = "europe-west1"

  template {
    containers {
      image = "europe-west1-docker.pkg.dev/project-9217c1a1-988a-4f7c-990/cloud-run-source-deploy/cloud-photo-album-paas/photoalbum-fe:latest"
      
      env {
        name  = "API_URL" 
        value = google_cloud_run_v2_service.backend.uri 
      }
    }
  }
}

resource "google_cloud_run_v2_service_iam_member" "backend_public" {
  name     = google_cloud_run_v2_service.backend.name
  location = google_cloud_run_v2_service.backend.location
  role     = "roles/run.invoker"
  member   = "allUsers"
}

resource "google_cloud_run_v2_service_iam_member" "frontend_public" {
  name     = google_cloud_run_v2_service.frontend.name
  location = google_cloud_run_v2_service.frontend.location
  role     = "roles/run.invoker"
  member   = "allUsers"
}