import requests

BASE_URL = "http://localhost:3000/api/v1"

def test_get_all_songs():
    url = f"{BASE_URL}/songs"
    resp = requests.get(url)
    assert resp.status_code == 200, f"GET /songs failed with status {resp.status_code}"
    data = resp.json()
    print("GET /songs: Retrieved", len(data), "songs")

def test_get_songs_filter():
    url = f"{BASE_URL}/songs?filter=cry"
    resp = requests.get(url)
    assert resp.status_code == 200, f"GET /songs?filter=cry failed with status {resp.status_code}"
    data = resp.json()
    print("GET /songs?filter=cry: Retrieved", len(data), "songs")

def test_create_new_song():
    url = f"{BASE_URL}/songs"
    payload = {"title": "Test Song", "artist": "Test Artist"}
    resp = requests.post(url, json=payload)
    assert resp.status_code == 201, f"POST /songs failed with status {resp.status_code}"
    data = resp.json()
    song_id = data.get("id")
    if not song_id:
        raise Exception("No song id returned.")
    print("POST /songs: Created song with id", song_id)
    return song_id, payload

def test_duplicate_song(payload):
    url = f"{BASE_URL}/songs"
    resp = requests.post(url, json=payload)
    assert resp.status_code == 400, "Duplicate song creation should return status 400"
    print("POST /songs (duplicate): Correctly rejected duplicate song.")

def test_update_song(song_id):
    url = f"{BASE_URL}/songs/{song_id}"
    payload = {"title": "Updated Test Song"}
    resp = requests.patch(url, json=payload)
    assert resp.status_code == 200, f"PATCH /songs/{song_id} failed with status {resp.status_code}"
    data = resp.json()
    assert data.get("title") == "Updated Test Song", "Song title was not updated."
    print(f"PATCH /songs/{song_id}: Updated song title to '{data.get('title')}'.")

def test_delete_song(song_id):
    url = f"{BASE_URL}/songs/{song_id}"
    resp = requests.delete(url)
    assert resp.status_code == 200, f"DELETE /songs/{song_id} failed with status {resp.status_code}"
    data = resp.json()
    assert data.get("id") == song_id, "Deleted song id mismatch."
    print(f"DELETE /songs/{song_id}: Song deleted successfully.")

def test_get_all_playlists():
    url = f"{BASE_URL}/playlists"
    resp = requests.get(url)
    assert resp.status_code == 200, f"GET /playlists failed with status {resp.status_code}"
    data = resp.json()
    print("GET /playlists: Retrieved", len(data), "playlists")

def test_create_new_playlist():
    url = f"{BASE_URL}/playlists"
    payload = {"name": "Test Playlist"}
    resp = requests.post(url, json=payload)
    assert resp.status_code == 201, f"POST /playlists failed with status {resp.status_code}"
    data = resp.json()
    playlist_id = data.get("id")
    if not playlist_id:
        raise Exception("No playlist id returned.")
    print("POST /playlists: Created playlist with id", playlist_id)
    return playlist_id

def test_get_playlist(playlist_id):
    url = f"{BASE_URL}/playlists/{playlist_id}"
    resp = requests.get(url)
    assert resp.status_code == 200, f"GET /playlists/{playlist_id} failed with status {resp.status_code}"
    data = resp.json()
    print(f"GET /playlists/{playlist_id}: Retrieved playlist '{data.get('name')}' with {len(data.get('songIds', []))} songs.")
    return data

def test_add_song_to_playlist(playlist_id, song_id):
    url = f"{BASE_URL}/playlists/{playlist_id}/songs/{song_id}"
    resp = requests.post(url)
    assert resp.status_code == 200, f"POST /playlists/{playlist_id}/songs/{song_id} failed with status {resp.status_code}"
    data = resp.json()
    if song_id not in data.get("songIds", []):
        raise Exception(f"Song {song_id} was not added to playlist {playlist_id}")
    print(f"POST /playlists/{playlist_id}/songs/{song_id}: Song added successfully.")

def main():
    print("----- Testing Songs Endpoints -----")
    test_get_all_songs()
    test_get_songs_filter()

    song_id, song_payload = test_create_new_song()
    test_duplicate_song(song_payload)
    test_update_song(song_id)
    test_delete_song(song_id)

    print("\n----- Testing Playlists Endpoints -----")
    test_get_all_playlists()
    playlist_id = test_create_new_playlist()
    test_get_playlist(playlist_id)

    # For testing adding a song to a playlist, we use an existing song id from the initial data.
    # In this example, we use song with id 2 (make sure it exists in your initial data).
    test_add_song_to_playlist(playlist_id, 2)
    test_get_playlist(playlist_id)

    print("\nAll endpoint tests passed successfully.")

if __name__ == "__main__":
    main()
