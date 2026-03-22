import os
import random
from locust import HttpUser, task, between

class PhotoAppUser(HttpUser):
    wait_time = between(1, 3)
    known_photo_ids = []

    def on_start(self):
        email = os.environ.get("TEST_USER_EMAIL")
        password = os.environ.get("TEST_USER_PASSWORD")
        
        if not email or not password:
            print("Nincs test user konfigurálva!")
            return

        login_payload = {"email": email, "password": password}
        response = self.client.post("/login", json=login_payload)
        
        if response.status_code == 200:
            token = response.json().get("token")
            self.client.headers.update({"Authorization": f"Bearer {token}"})
            print(f"Sikeres bejelentkezés: {email}")
        else:
            print(f"Bejelentkezési hiba: {response.status_code} - {response.text}")


    @task(4)
    def get_public_photos(self):
        with self.client.get("/api/photos?sortBy=date&sortDirection=desc", name="GET /api/photos", catch_response=True) as response:
            if response.status_code == 200:
                photos = response.json()
                if photos:
                    self.known_photo_ids = [p['id'] for p in photos]

    @task(3)
    def get_my_photos(self):
        self.client.get("/api/photos/my?sortBy=name&sortDirection=asc", name="GET /api/photos/my")

    @task(3)
    def get_single_photo(self):
        if self.known_photo_ids:
            photo_id = random.choice(self.known_photo_ids)
            self.client.get(f"/api/photos/{photo_id}", name="GET /api/photos/{id}")


    @task(1)
    def photo_lifecycle(self):
        """POST, PUT, DELETE"""

        image_bytes = b"test_image_data"
        files = {
            'Image': ('locust_test.jpg', image_bytes, 'image/jpeg') 
        }
        data = {
            'Name': 'Locust Teszt Fotó'
        }
        
        post_res = self.client.post("/api/photos", data=data, files=files, name="POST /api/photos")
        
        if post_res.status_code == 201:
            photo_data = post_res.json()
            photo_id = photo_data.get('id')
            
            if photo_id:
                put_data = {"name": "Szerkesztett Locust Fotó"}
                self.client.put(f"/api/photos/{photo_id}", json=put_data, name="PUT /api/photos/{id}")
                
                self.client.delete(f"/api/photos/{photo_id}", name="DELETE /api/photos/{id}")