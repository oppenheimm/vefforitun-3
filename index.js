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
  // GET: Retrieve all songs, with optional filtering.
  .get((req, res) => {
    // Extract filter query parameter (if provided) to search for songs by title or artist.
    let { filter } = req.query;
    let filteredSongs = songs;
    if (filter) {
      // Convert filter string to lower case for case-insensitive comparison.
      filter = filter.toLowerCase();
      // Filter songs where the title or artist includes the filter text.
      filteredSongs = songs.filter(
        (song) =>
          song.title.toLowerCase().includes(filter) ||
          song.artist.toLowerCase().includes(filter)
      );
    }
    // Return the (filtered) list of songs as JSON.
    res.json(filteredSongs);
  })
  // POST: Create a new song.
  .post((req, res) => {
    // Destructure title and artist from the request body.
    const { title, artist } = req.body;
    // Ensure both title and artist are provided; if not, respond with a 400 error.
    if (!title || !artist) {
      return res.status(400).json({ error: "Title and artist are required." });
    }
    // Check for duplicates (case-insensitive) to prevent adding the same song twice.
    const exists = songs.some(
      (song) =>
        song.title.toLowerCase() === title.toLowerCase() &&
        song.artist.toLowerCase() === artist.toLowerCase()
    );
    if (exists) {
      return res.status(400).json({ error: "Song already exists." });
    }
    // Create a new song object with a unique id and the provided title and artist.
    const newSong = { id: nextSongId++, title, artist };
    songs.push(newSong); // Add the new song to the songs array.
    // Respond with the new song and a 201 Created status.
    res.status(201).json(newSong);
  })
  // Handle any unsupported HTTP methods on the /songs endpoint.
  .all((req, res) => {
    res.status(405).json({ error: "Method not allowed on /songs" });
  });

// Define routes for operations on individual songs at /api/v1/songs/:id.
app.route(`${basePath}/songs/:id`)
  // PATCH: Partially update a song.
  .patch((req, res) => {
    // Parse the song id from the URL and validate that it is a number.
    const songId = parseInt(req.params.id);
    if (isNaN(songId)) {
      return res.status(400).json({ error: "Invalid song id provided." });
    }
    // Destructure possible updates (title and/or artist) from the request body.
    const { title, artist } = req.body;
    // Find the song with the matching id.
    const song = songs.find((s) => s.id === songId);
    if (!song) {
      return res.status(404).json({ error: "Song not found." });
    }
    // If no fields are provided to update, return an error.
    if (!title && !artist) {
      return res.status(400).json({ error: "At least one field (title or artist) is required." });
    }
    // Update the song's properties if new values are provided.
    if (title) song.title = title;
    if (artist) song.artist = artist;
    // Return the updated song as confirmation.
    res.json(song);
  })
  // DELETE: Remove a song if it is not being used in any playlist.
  .delete((req, res) => {
    // Validate and parse the song id.
    const songId = parseInt(req.params.id);
    if (isNaN(songId)) {
      return res.status(400).json({ error: "Invalid song id provided." });
    }
    // Locate the index of the song in the songs array.
    const songIndex = songs.findIndex((s) => s.id === songId);
    if (songIndex === -1) {
      return res.status(404).json({ error: "Song not found." });
    }
    // Check if the song is referenced in any playlist's songIds.
    const songInPlaylist = playlists.some((playlist) => playlist.songIds.includes(songId));
    if (songInPlaylist) {
      return res.status(400).json({ error: "Cannot delete song. It is used in a playlist." });
    }
    // Remove the song from the songs array and return the deleted song.
    const deletedSong = songs.splice(songIndex, 1)[0];
    res.json(deletedSong);
  })
  // Handle any unsupported HTTP methods for individual songs.
  .all((req, res) => {
    res.status(405).json({ error: "Method not allowed on /songs/:id" });
  });

/* --------------------------
       PLAYLISTS ENDPOINTS    
-------------------------- */

// Define routes for the /api/v1/playlists endpoint.
app.route(`${basePath}/playlists`)
  // GET: Retrieve all playlists.
  .get((req, res) => {
    // Return all playlists (each contains id, name, and songIds).
    res.json(playlists);
  })
  // POST: Create a new playlist.
  .post((req, res) => {
    // Extract the playlist name from the request body.
    const { name } = req.body;
    // Validate that a name is provided.
    if (!name) {
      return res.status(400).json({ error: "Playlist name is required." });
    }
    // Check for duplicate playlist names (case-insensitive).
    const exists = playlists.some((p) => p.name.toLowerCase() === name.toLowerCase());
    if (exists) {
      return res.status(400).json({ error: "Playlist name already exists." });
    }
    // Create a new playlist object with a unique id and an empty songIds array.
    const newPlaylist = { id: nextPlaylistId++, name, songIds: [] };
    playlists.push(newPlaylist);
    // Return the new playlist with a 201 Created status.
    res.status(201).json(newPlaylist);
  })
  // Handle unsupported HTTP methods on the /playlists endpoint.
  .all((req, res) => {
    res.status(405).json({ error: "Method not allowed on /playlists" });
  });

// Define routes for operations on individual playlists at /api/v1/playlists/:id.
app.route(`${basePath}/playlists/:id`)
  // GET: Retrieve a specific playlist, including full details of each song.
  .get((req, res) => {
    // Parse and validate the playlist id from the URL.
    const playlistId = parseInt(req.params.id);
    const playlist = playlists.find((p) => p.id === playlistId);
    if (!playlist) {
      return res.status(404).json({ error: "Playlist not found." });
    }
    // For each song id in the playlist, map it to its full song object.
    const playlistWithSongs = {
      ...playlist,
      songs: playlist.songIds
        .map((songId) => songs.find((song) => song.id === songId))
        .filter(Boolean), // Filter out any undefined results.
    };
    // Return the playlist with complete song details.
    res.json(playlistWithSongs);
  })
  // Handle unsupported HTTP methods for individual playlists.
  .all((req, res) => {
    res.status(405).json({ error: "Method not allowed on /playlists/:id" });
  });

// Define a route to add a song to an existing playlist at /api/v1/playlists/:playlistId/songs/:songId.
app.route(`${basePath}/playlists/:playlistId/songs/:songId`)
  // POST: Add a song to a specific playlist.
  .post((req, res) => {
    // Validate that both playlistId and songId are numbers.
    const playlistId = parseInt(req.params.playlistId);
    const songId = parseInt(req.params.songId);
    if (isNaN(playlistId) || isNaN(songId)) {
      return res.status(400).json({ error: "Invalid playlist id or song id provided." });
    }
    // Find the playlist by id.
    const playlist = playlists.find((p) => p.id === playlistId);
    if (!playlist) {
      return res.status(404).json({ error: "Playlist not found." });
    }
    // Find the song by id.
    const song = songs.find((s) => s.id === songId);
    if (!song) {
      return res.status(404).json({ error: "Song not found." });
    }
    // Check if the song is already in the playlist.
    if (playlist.songIds.includes(songId)) {
      return res.status(400).json({ error: "Song already in playlist." });
    }
    // Add the song id to the playlist's songIds array.
    playlist.songIds.push(songId);

    // Build a response object that includes the full song details in the playlist.
    const playlistWithSongs = {
      ...playlist,
      songs: playlist.songIds
        .map((id) => songs.find((song) => song.id === id))
        .filter(Boolean),
    };
    // Return the updated playlist.
    res.json(playlistWithSongs);
  })
  // Handle unsupported HTTP methods for this route.
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
