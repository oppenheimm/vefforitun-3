const express = require("express");

/* Import a body parser module to be able to access the request body as json */
const bodyParser = require("body-parser");

/* Use cors to avoid issues with testing on localhost */
const cors = require("cors");

const app = express();

/* Base url parameters and port settings */
const apiPath = "/api/";
const version = "v1";
const port = 3000;

/* Set Cors-related headers to prevent blocking of local requests */
app.use(bodyParser.json());
app.use(cors());
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});

/* Initial Data */
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

const playlists = [
  { id: 1, name: "Hot Hits Iceland", songIds: [1, 2, 3, 4] },
  { id: 2, name: "Workout Playlist", songIds: [2, 5, 6] },
  { id: 3, name: "Lo-Fi Study", songIds: [] },
];

/*  Our id counters
    We use basic integer ids in this assignment, but other solutions (such as UUIDs) would be better. */
let nextSongId = 9;
let nextPlaylistId = 4;

/* --------------------------

        SONGS ENDPOINTS     

-------------------------- */


// Get all songs (with optional filtering)
app.get("/api/v1/songs", (req, res) => {
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
});

// Create a new song
app.post("/api/v1/songs", (req, res) => {
  const { title, artist } = req.body;

  // Check if both fields are provided
  if (!title || !artist) {
    return res.status(400).json({ error: "Title and artist are required." });
  }

  // Check for duplicates (case-insensitive)
  const exists = songs.some(
    (song) =>
      song.title.toLowerCase() === title.toLowerCase() &&
      song.artist.toLowerCase() === artist.toLowerCase()
  );

  if (exists) {
    return res.status(400).json({ error: "Song already exists." });
  }

  // Create new song with unique id
  const newSong = {
    id: songs.length ? songs[songs.length - 1].id + 1 : 1, // Auto-increment ID
    title,
    artist,
  };

  songs.push(newSong);
  res.status(201).json(newSong);
});


/* --------------------------

      PLAYLISTS ENDPOINTS    

-------------------------- */

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
