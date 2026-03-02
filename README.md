# cloud-photo-album-paas

## Technológiai stack

- **Frontend:** Angular v20+
- **Backend:** C# / .NET 10 Web API
- **Adatbáziskezelés:** Entity Framework Core (Code-First megközelítés automatikus migrációkkal)
- **Adatbázis:** PostgreSQL (Relációs adatbázis a felhasználók és a fotók metaadatainak tárolására)

## Release stack

* **Backend & Frontend:** Google Cloud Run
* **Adatbázis:** Google Cloud SQL (PostgreSQL)
* **CI/CD:** Google Cloud Build

## Specifikáció

Megismerkedni egy PaaS környezettel felhasználói szinten és segítségével létrehozni egy fényképalbum alkalmazást.
Eszközök, feltételek:

- A megoldásnak valamilyen publikusan elérhető PaaS környezetben (OpenShift/AppEngine/Heroku/...) kell műkködnie. 
- A végleges alkalmazásváltozatnak skálázhatónak és többrétegűnek kell lennie.
- Tetszőleges nyelv, tetszőleges keretrendszer használható.
- GitHub-ra feltöltve a build induljon el automatikusan.

Funkcionális követelmények:

- Fényképek feltöltése/törlése.
- Miden fényképnek legyen neve (max. 40 karakter), és feltöltési dátuma (év-hó-nap óra:perc)
- Fényképek nevének és dátumának listázása név szerint/dátum szerint rendezve.
- Lista egy elemére kattintva mutassa meg a név mögötti képet.
- Felhasználókezelés (regisztráció, belépés, kilépés).
- Feltöltés, törlés csak bejelentkezett felhasználónak engedélyezett.
- Tetszőleges további opcionális funkciók.
