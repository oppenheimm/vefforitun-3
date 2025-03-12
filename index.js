const express = require("express");

// Import body-parser to parse JSON bodies from incoming requests.
const bodyParser = require("body-parser");

// Import cors to enable Cross-Origin Resource Sharing, which allows the backend to be used by the provided frontend.
const cors = require("cors");

const app = express();

// Define base URL parameters and port settings
const apiPath = "/api/";
const version = "v1";
const port = 3000;
// Construct the base path string for the API (e.g., /api/v1)
const basePath = `${apiPath}${version}`;

/* --------------------------
   Middleware Configuration
-------------------------- */
// Enable JSON parsing for request bodies.
app.use(bodyParser.json());
// Enable CORS to allow requests from different origins (useful during development with the frontend).
app.use(cors());
// Manually set CORS-related headers to ensure all clients can access the API without restrictions.
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*"); // Allow any domain to access the API
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next(); // Proceed to the next middleware or route handler.
});

/* --------------------------
   Initial Data Setup
-------------------------- */
// Pre-populated array of songs, each with a unique id, title, and artist.
const songs = [
  { id: 1, title: "Cry For Me", artist: "The Weeknd" },
  { id: 2, title: "Busy Woman", artist: "Sabrina Carpenter" },
  {
    id: 3,
    title: "Call Me When You Break Up",
    artist: "Selena Gomez, benny blanco, Gracie Adams",
  },
  { id: 4, title: "Abracadabra", artist: "Lady Gaga" },
  { id: 5, title: "Róa", artist: "VÆB" },
  { id: 6, title: "Messy", artist: "Lola Young" },
  { id: 7, title: "Lucy", artist: "Idle Cave" },
  { id: 8, title: "Eclipse", artist: "parrow" },
];

// Pre-populated array of playlists. Each playlist contains an id, name, and an array of songIds.
const playlists = [
  { id: 1, name: "Hot Hits Iceland", songIds: [1, 3, 4] },
  { id: 2, name: "Workout Playlist", songIds: [5, 6] },
  { id: 3, name: "Lo-Fi Study", songIds: [] },
];

/* 
  ID counters for songs and playlists.
  These counters are used to generate unique IDs when new resources are created.
  Note: In production, you might use UUIDs or a database auto-increment feature.
*/
let nextSongId = 9;
let nextPlaylistId = 4;

/* --------------------------
         SONGS ENDPOINTS     
-------------------------- */

// Define routes for the /api/v1/songs endpoint.
app.route(`${basePath}/songs`)
  // GET: Retrieve all songs
  .get((req, res) => {
    // filter songs
    let { filter } = req.query;
    let filteredSongs = songs;
    if (filter) {
      filter = filter.toLowerCase();
      filteredSongs = songs.filter(
        (song) =>
          song.title.toLowerCase().includes(filter) ||
          song.artist.toLowerCase().includes(filter)
      );
    }
    res.json(filteredSongs);
  })
  // POST: Create a new song.
  .post((req, res) => {
    const { title, artist } = req.body;
    //ensures both title and artist are provided
    if (!title || !artist) {
      return res.status(400).json({ error: "Title and artist are required." });
    }
    // Check for duplicates
    const exists = songs.some(
      (song) =>
        song.title.toLowerCase() === title.toLowerCase() &&
        song.artist.toLowerCase() === artist.toLowerCase()
    );
    if (exists) {
      return res.status(400).json({ error: "Song already exists." });
    }
    // Create song
    const newSong = { id: nextSongId++, title, artist };
    songs.push(newSong);
    res.status(201).json(newSong);
  })
  // Handle any unsupported methods on /songs endpoint.
  .all((req, res) => {
    res.status(405).json({ error: "Method not allowed on /songs" });
  });

// Define routes for operations on individual songs /api/v1/songs/:id.
app.route(`${basePath}/songs/:id`)
  // PATCH: update a  song
  .patch((req, res) => {
    // validate songId
    const songId = parseInt(req.params.id);
    if (isNaN(songId)) {
      return res.status(400).json({ error: "Invalid song id provided." });
    }
    const { title, artist } = req.body;
    // Find song
    const song = songs.find((s) => s.id === songId);
    if (!song) {
      return res.status(404).json({ error: "Song not found." });
    }
    // error if no fields
    if (!title && !artist) {
      return res.status(400).json({ error: "At least one field is required." });
    }
    // Update the song's properties
    if (title) song.title = title;
    if (artist) song.artist = artist;
    // Return the updated song
    res.json(song);
  })
  // DELETE: Removes a song if not used in any playlist
  .delete((req, res) => {
    // Validate and parse the song id
    const songId = parseInt(req.params.id);
    if (isNaN(songId)) {
      return res.status(400).json({ error: "Invalid song id provided." });
    }
    // locates song
    const songIndex = songs.findIndex((s) => s.id === songId);
    if (songIndex === -1) {
      return res.status(404).json({ error: "Song not found." });
    }
    // check if song in playlist
    const songInPlaylist = playlists.some((playlist) => playlist.songIds.includes(songId));
    if (songInPlaylist) {
      return res.status(400).json({ error: "Cannot delete song. It is used in a playlist." });
    }
    // Deletes song
    const deletedSong = songs.splice(songIndex, 1)[0];
    res.json(deletedSong);
  })
  // Handle any unsupported HTTP for songs.
  .all((req, res) => {
    res.status(405).json({ error: "Method not allowed on /songs/:id" });
  });

/* --------------------------
       PLAYLISTS ENDPOINTS    
-------------------------- */

// Define routes for /api/v1/playlists endpoint
app.route(`${basePath}/playlists`)
  // GET: Retrieve all playlists
  .get((req, res) => {
    // Return all playlists
    res.json(playlists);
  })
  // POST: Create a new playlist.
  .post((req, res) => {
    // Extract the playlist name
    const { name } = req.body;
    // Validate that a name
    if (!name) {
      return res.status(400).json({ error: "Playlist name is required." });
    }
    // Check for duplicates
    const exists = playlists.some((p) => p.name.toLowerCase() === name.toLowerCase());
    if (exists) {
      return res.status(400).json({ error: "Playlist name already exists." });
    }
    // Creates a new playlist object
    const newPlaylist = { id: nextPlaylistId++, name, songIds: [] };
    playlists.push(newPlaylist);
    res.status(201).json(newPlaylist);
  })
  // Handles unsupported HTTP on /playlists endpoint.
  .all((req, res) => {
    res.status(405).json({ error: "Method not allowed on /playlists" });
  });

// routes for operations on playlists /api/v1/playlists/:id.
app.route(`${basePath}/playlists/:id`)
  // GET: Retrieves playlists with full song details
  .get((req, res) => {
    // Parse and validates the playlist id
    const playlistId = parseInt(req.params.id);
    const playlist = playlists.find((p) => p.id === playlistId);
    if (!playlist) {
      return res.status(404).json({ error: "Playlist not found." });
    }
    // maps songs in playlist
    const playlistWithSongs = {
      ...playlist,
      songs: playlist.songIds
        .map((songId) => songs.find((song) => song.id === songId))
        .filter(Boolean),
    };
    // Return the playlist with all song details
    res.json(playlistWithSongs);
  })
  // Handle unsupported HTTP for playlists
  .all((req, res) => {
    res.status(405).json({ error: "Method not allowed on /playlists/:id" });
  });

// route to add a song to an existing playlist /api/v1/playlists/:playlistId/songs/:songId
app.route(`${basePath}/playlists/:playlistId/songs/:songId`)
  // POST: Adds song to playlist
  .post((req, res) => {
    // Validates ids are numbers
    const playlistId = parseInt(req.params.playlistId);
    const songId = parseInt(req.params.songId);
    if (isNaN(playlistId) || isNaN(songId)) {
      return res.status(400).json({ error: "Invalid playlist id or song id provided." });
    }
    // Find playlist by id
    const playlist = playlists.find((p) => p.id === playlistId);
    if (!playlist) {
      return res.status(404).json({ error: "Playlist not found." });
    }
    // Find song by id
    const song = songs.find((s) => s.id === songId);
    if (!song) {
      return res.status(404).json({ error: "Song not found." });
    }
    // Check if the song already in playlist
    if (playlist.songIds.includes(songId)) {
      return res.status(400).json({ error: "Song already in playlist." });
    }
    // Add the song id to the playlists songIds array
    playlist.songIds.push(songId);

    // Build a response object that includes song details in the playlist
    const playlistWithSongs = {
      ...playlist,
      songs: playlist.songIds
        .map((id) => songs.find((song) => song.id === id))
        .filter(Boolean),
    };
    // Return the updated playlist
    res.json(playlistWithSongs);
  })
  // Handles unsupported HTTP
  .all((req, res) => {
    res.status(405).json({ error: "Method not allowed on /playlists/:playlistId/songs/:songId" });
  });

/* --------------------------

      SERVER INITIALIZATION  
      
!! DO NOT REMOVE OR CHANGE THE FOLLOWING (IT HAS TO BE AT THE END OF THE FILE) !!
      
-------------------------- */
if (process.env.NODE_ENV !== "test") {
  app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
  });
}

module.exports = app;
