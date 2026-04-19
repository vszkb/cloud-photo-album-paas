# IaC és CI/CD munkamenet dokumentáció

## 1. Használt eszközök

- **Felhőszolgáltató:** Google Cloud Platform (GCP)
- **IaC:** HashiCorp Terraform
- **CI/CD:** GitHub Actions
- **Konténerizáció:** Docker
- **Docker raktár:** GCP Artifact Registry
- **Terraform remote state:** GCP Cloud Storage (GCS bucket)


## 2. Manuális előkészítés

Az alábbi lépések nem automatizálhatók Terraformmal, ezért a Google Cloud Console felhasználói felületén kerültek elvégzésre:

1. Új GCP projekt létrehozása
2. Terraform state bucket létrehozása
3. Artifact Registry repository létrehozása
4. Workload Identity Federation (WIF) konfigurálása
5. CI/CD service account létrehozása és a szükséges jogosultságok kiosztása
6. GitHub Secrets beállítása


## 3. Terraform által kezelt infrastruktúra

- **Cloud SQL (PostgreSQL 18)** – az alkalmazás adatbázisa
- **SQL user** – a postgres felhasználó jelszavának beállítása
- **Cloud Storage bucket** – a feltöltött fotók tárolására, publikus olvasási jogokkal
- **Cloud Run backend** – a .NET 10 ASP.NET alkalmazás
- **Cloud Run frontend** – az Angular alkalmazás
- **Service Account és IAM beállítások** – a backend ezzel fut, csak a szükséges jogosultságokkal


## 4. CI/CD workflow (GitHub Actions)

1. GCP autentikáció Workload Identity Federation (WIF) alapon
2. Docker build és push – a backend és frontend image-ek feltöltése az Artifact Registry-be
3. Terraform init – állapot letöltése a GCS bucketből
4. Terraform apply – infrastruktúra frissítése
5. Service URL-ek beállítása – a workflow lekéri a projekt számát, felépíti mindkét service URL-jét, majd beírja a frontend és a backend megfelelő környezeti változójába


## 5. Kihívások és megoldások

### Körkörös függőség
A backendnek szüksége van a frontend URL-jére (CORS), a frontendnek pedig a backend URL-jére (API). Terraform-ban ez körkörös hivatkozást okoz.

Megoldás: a frontend változója üres stringként jön létre, `lifecycle { ignore_changes }` direktívával. A workflow végén a gcloud run services update parancsok utólag írják be a helyes URL-eket mindkét service-be.

### Adatbázis jelszó hiánya
ELső telepítés során a Cloud SQL instance jelszó nélül jött létre.

Megoldás: `google_sql_user` resource hozzáadása a Terraformhoz, ami beállítja a postgres felhasználó jelszavát.

### Helytelen service URL-ek
A Cloud Run v2 kétféle URL formátumot használ, egy rövid és egy hosszú változatot.

Megoldás: az URL-t felépítése. A Cloud Run v2 hosszú URL formátuma determinisztikus (SERVICE_NAME-PROJECTNUMBER.REGION.run.app), a projekt számát gcloud projects describe adja vissza. Így mindkét service pontosan ugyanazt az URL-t kapja.
