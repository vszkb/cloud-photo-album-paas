# Terheléspróba jegyzőkönyv

## Automatikus skálázódás beállítása a Cloud Run-ban

Egy Cloud Run szolgáltatás létrehozásakor be lehet állítani a minimális és maximális instance számot. A minimális nullára a maximális tízre lett állítva. Létrehozás után is lehet módosítani ezeket a értékeket a szolgáltatás beállításainál.

## Felskálázódás kikényszerítése (Erőforrások lefojtása)

Korlátozva lett az egyes instance-ek teljesítménye annak érdekében, hogy látványosabb legyen a skálázódás. A backend memóriája 512MB-ról 256MB-ra lett csökkentve, a maximum concurrent requests per instance értéke, pedig 80-ról 5-re lett csökkentve.

## Locust terheléspróba beállítása

A terheléspróba a Python alapú Locust eszközzel lett végrehajtva. A Locust önálló Dockerfile-al, és külön Cloud Run szolgáltatásként lett telepítve. A szolgáltatáson be lett kapcsolva a "CPU is always allocated" opció is, hogy biztosan lefusson teljes egészében minden teszt.

A teszt szkript lefedi a fényképalbum összes fő funkcióját. A szimulált felhasználók induláskor bejelentkeznek, ezután leggyakrabban a listázó GET végpontokat hívják (publikus és saját galéria). Emellett ritkábban lefut egy teljes életciklus teszt is, ami feltölt egy tesztképet (POST), módosítja a nevét (PUT), majd azonnal letörli (DELETE).

A Locust a cél backend URL-jét, valamint a tesztfelhasználó email címét és jelszavát környezeti változókból olvassa ki.

## A terheléspróba menete

Az alábbi képen látszik, hogy a növekvő terhelés hatására az instancek száma nyolcra nő, a terhelés csökkenésével, pedig az instance-ek száma is csökken.  

![alt text](<Képernyőkép 2026-03-22 144716.png>)

A képen látszik hogy a második teszt során minden locust kérést ki tudott szolgálni a rendszer.

![alt text](<Képernyőkép 2026-03-22 144630.png>)

 A tesztelés 100 és 150 felhasználóra is megtörtént, ami azt mutatja, hogy az alkalmazás még a minimális felhős beállításokkal együtt is könnyedén ki tudna szolgálni ennyi embert, főleg hogy az egyes konténerek feldolgozható kéréseinek száma direkt csökkentve lett.
