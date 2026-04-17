terraform {
  backend "gcs" {
    bucket = "photoalbum-terraform"
    prefix = "terraform/state"
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
}

# ------------- API-k engedélyezése -------------
resource "google_project_service" "apis" {
  for_each = toset([
    "run.googleapis.com",
    "sqladmin.googleapis.com",
    "storage.googleapis.com",
  ])
  service            = each.key
  disable_on_destroy = false
}

# ------------- Service Account létrehozása a backendnek -------------
resource "google_service_account" "backend_sa" {
  account_id   = "photo-album-backend-sa"
  display_name = "photoalbum-be-sa"

  depends_on = [google_project_service.apis]
}

resource "google_project_iam_member" "sql_client" {
  project = var.project_id
  role    = "roles/cloudsql.client"
  member  = "serviceAccount:${google_service_account.backend_sa.email}"
}

resource "google_storage_bucket_iam_member" "storage_admin" {
  bucket = google_storage_bucket.images.name
  role   = "roles/storage.objectAdmin"
  member = "serviceAccount:${google_service_account.backend_sa.email}"
}

resource "google_project_iam_member" "log_writer" {
  project = var.project_id
  role    = "roles/logging.logWriter"
  member  = "serviceAccount:${google_service_account.backend_sa.email}"
}

resource "google_project_iam_member" "metric_writer" {
  project = var.project_id
  role    = "roles/monitoring.metricWriter"
  member  = "serviceAccount:${google_service_account.backend_sa.email}"
}

# ------------- Cloud Run Services -------------
resource "google_sql_database_instance" "postgres" {
  name             = "photoalbum-db"
  database_version = "POSTGRES_18"
  region           = var.region
  
  deletion_protection = true 

  settings {
    tier    = "db-g1-small"
    edition = "ENTERPRISE"
  }

  depends_on = [google_project_service.apis]
}

resource "google_storage_bucket" "images" {
  name                        = "photoalbum-images-bucket" 
  location                    = var.region
  force_destroy               = false
  uniform_bucket_level_access = true
}

resource "google_cloud_run_v2_service" "backend" {
  name     = "photoalbum-be"
  location = var.region

  depends_on = [google_project_service.apis, google_sql_database_instance.postgres]

  template {
    service_account = google_service_account.backend_sa.email

    volumes {
      name = "cloudsql"
      cloud_sql_instance {
        instances = [google_sql_database_instance.postgres.connection_name]
      }
    }

    containers {
      image = "${var.registry}/cloud-photo-album-paas:latest"
      
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
        value = "Host=/cloudsql/${google_sql_database_instance.postgres.connection_name};Database=postgres;Username=postgres;Password=${var.db_password}"
      }

      env {
        name  = "AllowedOrigins__0"
        value = google_cloud_run_v2_service.frontend.uri
      }
    }

    scaling {
      min_instance_count = 0
      max_instance_count = 10
    }
  }
}

resource "google_cloud_run_v2_service" "frontend" {
  name     = "photoalbum-fe"
  location = var.region

  depends_on = [google_project_service.apis]

  template {
    containers {
      image = "${var.registry}/photoalbum-fe:latest"
      
      env {
        name  = "API_URL" 
        value = "" 
      }
    }
  }

  lifecycle {
    ignore_changes = [template[0].containers[0].env]
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