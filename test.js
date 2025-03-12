const request = require("supertest");
const app = require("./index"); // Ensure your index.js exports the Express app

describe("Songs API Endpoints", function () {
  let createdSongId;

  // Test GET /api/v1/songs without filter
  it("should get all songs", function (done) {
    request(app)
      .get("/api/v1/songs")
      .expect("Content-Type", /json/)
      .expect(200)
      .expect((res) => {
        if (!Array.isArray(res.body))
          throw new Error("Response is not an array");
      })
      .end(done);
  });

  // Test GET /api/v1/songs with filter (e.g., filter by "cry")
  it("should get filtered songs", function (done) {
    request(app)
      .get("/api/v1/songs?filter=cry")
      .expect("Content-Type", /json/)
      .expect(200)
      .expect((res) => {
        if (!Array.isArray(res.body))
          throw new Error("Response is not an array");
      })
      .end(done);
  });

  // Test POST /api/v1/songs to create a new song
  it("should create a new song", function (done) {
    request(app)
      .post("/api/v1/songs")
      .send({ title: "Test Song", artist: "Test Artist" })
      .set("Content-Type", "application/json")
      .expect(201)
      .expect("Content-Type", /json/)
      .expect((res) => {
        if (!res.body.id) throw new Error("No id returned");
        createdSongId = res.body.id;
      })
      .end(done);
  });

  // Test duplicate song creation fails
  it("should not allow duplicate song creation", function (done) {
    request(app)
      .post("/api/v1/songs")
      .send({ title: "Test Song", artist: "Test Artist" })
      .set("Content-Type", "application/json")
      .expect(400, done);
  });

  // Test PATCH /api/v1/songs/:id to update a song
  it("should update a song", function (done) {
    request(app)
      .patch(`/api/v1/songs/${createdSongId}`)
      .send({ title: "Updated Test Song" })
      .set("Content-Type", "application/json")
      .expect(200)
      .expect((res) => {
        if (res.body.title !== "Updated Test Song")
          throw new Error("Song title was not updated");
      })
      .end(done);
  });

  // Test DELETE /api/v1/songs/:id to delete a song (ensure this song is not used in any playlist)
  it("should delete a song", function (done) {
    request(app)
      .delete(`/api/v1/songs/${createdSongId}`)
      .expect(200)
      .expect((res) => {
        if (res.body.id !== createdSongId)
          throw new Error("Deleted song id mismatch");
      })
      .end(done);
  });
});

describe("Playlists API Endpoints", function () {
  let createdPlaylistId;

  // Test GET /api/v1/playlists
  it("should get all playlists", function (done) {
    request(app)
      .get("/api/v1/playlists")
      .expect("Content-Type", /json/)
      .expect(200)
      .expect((res) => {
        if (!Array.isArray(res.body))
          throw new Error("Response is not an array");
      })
      .end(done);
  });

  // Test POST /api/v1/playlists to create a new playlist
  it("should create a new playlist", function (done) {
    request(app)
      .post("/api/v1/playlists")
      .send({ name: "Test Playlist" })
      .set("Content-Type", "application/json")
      .expect(201)
      .expect((res) => {
        if (!res.body.id) throw new Error("No playlist id returned");
        createdPlaylistId = res.body.id;
      })
      .end(done);
  });

  // Test GET /api/v1/playlists/:id to fetch a specific playlist
  it("should get a specific playlist with full song details", function (done) {
    request(app)
      .get(`/api/v1/playlists/${createdPlaylistId}`)
      .expect(200)
      .expect((res) => {
        if (res.body.id !== createdPlaylistId)
          throw new Error("Playlist id mismatch");
        if (!Array.isArray(res.body.songs))
          throw new Error("Songs property is not an array");
      })
      .end(done);
  });

  // Test POST /api/v1/playlists/:playlistId/songs/:songId to add a song to a playlist
  it("should add an existing song to the playlist", function (done) {
    // Use an existing song from the initial data, e.g. song with id 2
    request(app)
      .post(`/api/v1/playlists/${createdPlaylistId}/songs/2`)
      .expect(200)
      .expect((res) => {
        if (!res.body.songIds.includes(2))
          throw new Error("Song was not added to the playlist");
      })
      .end(done);
  });

  // Verify that the playlist now includes the added song by checking the detailed response
  it("should show the song in the playlist details", function (done) {
    request(app)
      .get(`/api/v1/playlists/${createdPlaylistId}`)
      .expect(200)
      .expect((res) => {
        if (!res.body.songIds.includes(2))
          throw new Error("Song id not present in playlist songIds");
      })
      .end(done);
  });
});
