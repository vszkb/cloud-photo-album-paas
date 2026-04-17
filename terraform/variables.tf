variable "project_id" {
  description = "GCP projekt azonosító"
  type        = string
  default     = "photoalbum-iac"
}

variable "region" {
  description = "GCP régió"
  type        = string
  default     = "europe-west1"
}

variable "registry" {
  description = "Artifact Registry image path"
  type        = string
  default     = "europe-west1-docker.pkg.dev/photoalbum-iac/cloud-run-source-deploy/cloud-photo-album-paas"
}

variable "db_password" {
  description = "Adatbázis jelszava"
  type        = string
  sensitive   = true
}
