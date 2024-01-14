import express from 'express'
import bodyParser from 'express'

import sqlite3 from 'sqlite3'
import cors from 'cors'

const app = express()
app.use(express.json())
app.use(cors())

app.use(bodyParser.urlencoded({ extended: true }))

const port = 1337
const db = new sqlite3.Database('./movies.db');

app.get('/', (req, res) => {
    res.send('Hello World!')
})

app.get('/movies', (req, res) => {
    const query = 'SELECT * FROM movies';
    db.all(query, [], (err, movies) => {
        if (err) {
        console.error(err);
        res.status(500).send('Internal Server Error');
        return;
        }
        res.json(movies);
    })
});

app.get('/watchlist', (req, res) => {
    const query = 'SELECT * FROM watchlist';
    db.all(query, [], (err, movies) => {
        if (err) {
        console.error(err);
        res.status(500).send('Internal Server Error');
        return;
        }
        res.json(movies);
    })
});

app.get('/watched', (req, res) => {
    const query = 'SELECT * FROM watched';
    db.all(query, [], (err, movies) => {
        if (err) {
        console.error(err);
        res.status(500).send('Internal Server Error');
        return;
        }
        res.json(movies);
    })
});

app.post('/newmovie', (req, res) => {
    let { title, director, release_year, genre } = req.body;
    if (!title || !director || !release_year || !genre) {
        res.sendStatus(400);
        return;
    }

    const checkQuery = 'SELECT * FROM movies WHERE LOWER(title) = LOWER(?)';
    db.get(checkQuery, [title], (err, row) => {
        if (err) {
            console.error(err);
            res.status(500).send('Internal Server Error');
            return;
        }

        if (row) {
            // Movie with the same title already exists
            res.status(409).send('Movie with this title already exists');
        } else {
            // Code die we in de les zelf hebben gebouwd
            // const query = `INSERT INTO movies (title, release_year, director, genre, poster) VALUES ('${title}', ${release_year}, '${director}', '${genre}', 'poster-shaw.jpg')`;

            // db.run(query, function (err){
            //     if (err){
            //         res.sendStatus(500)
            //     }
            //     res.status(201).json({ title, director, release_year, genre });
            // });
            // Insert new movie
            const insertQuery = 'INSERT INTO movies (title, director, release_year, genre) VALUES (?, ?, ?, ?)';
            const values = [title, director, release_year, genre];

            db.run(insertQuery, values, function (err) {
                if (err) {
                    console.error(err);
                    res.status(500).send('Internal Server Error');
                    return;
                }
                res.status(201).json({ title, director, release_year, genre });
            });
        }
    });
});

// Add to watchlist
app.post('/add-to-watchlist', (req, res) => {
    const { movie_id } = req.body;
    const query = 'INSERT INTO watchlist (movie_id) VALUES (?)';
    db.run(query, [movie_id], function (err) {
        if (err) {
            console.error(err);
            res.status(500).send('Internal Server Error');
            return;
        }
        res.status(201).send('Added to watchlist');
    });
});

// Remove from watchlist
app.post('/remove-from-watchlist', (req, res) => {
    const { movie_id } = req.body;
    const query = 'DELETE FROM watchlist WHERE movie_id = ?';
    db.run(query, [movie_id], function (err) {
        if (err) {
            console.error(err);
            res.status(500).send('Internal Server Error');
            return;
        }
        res.status(200).send('Removed from watchlist');
    });
});

// Adds the movie to watched and removes the movie from watchlist if there
app.post('/add-to-watched', (req, res) => {
    const { movie_id } = req.body;
    const addToWatchedQuery = 'INSERT INTO watched (movie_id) VALUES (?)';
    const removeFromWatchlistQuery = 'DELETE FROM watchlist WHERE movie_id = ?';

    db.run(addToWatchedQuery, [movie_id], function (err) {
        if (err) {
            console.error(err);
            res.status(500).send('Internal Server Error');
            return;
        }

        db.run(removeFromWatchlistQuery, [movie_id], function (err) {
            if (err) {
                console.error(err);
                res.status(500).send('Internal Server Error');
                return;
            }
            res.status(201).send('Added to watched list and removed from watchlist');
        });
    });
});

// Remove from watched(in case of missclick this should be possible)
app.post('/remove-from-watched', (req, res) => {
    const { movie_id } = req.body;
    const query = 'DELETE FROM watched WHERE movie_id = ?';
    db.run(query, [movie_id], function (err) {
        if (err) {
            console.error(err);
            res.status(500).send('Internal Server Error');
            return;
        }
        res.status(200).send('Removed from watched list');
    });
});

// Get individual ratings
app.get('/ratings', (req, res) => {
    db.all('SELECT movie_id, rating FROM ratings', [], (err, rows) => {
        if (err) {
            res.status(500).send('Error occurred: ' + err.message);
        } else {
            res.json(rows);
        }
    });
});

// Add rating or update rating if movie already has a rating
app.post('/add-update-rating', (req, res) => {
    const { movie_id, rating } = req.body;
    const checkQuery = 'SELECT * FROM ratings WHERE movie_id = ?';

    db.get(checkQuery, [movie_id], (err, row) => {
        if (err) {
            console.error(err);
            res.status(500).send('Internal Server Error');
            return;
        }

        if (row) {
            // Rating exists, update it
            const updateQuery = 'UPDATE ratings SET rating = ? WHERE movie_id = ?';
            db.run(updateQuery, [rating, movie_id], function (err) {
                if (err) {
                    console.error(err);
                    res.status(500).send('Internal Server Error');
                    return;
                }
                res.status(200).send('Rating updated');
            });
        } else {
            // Rating does not exist, insert new rating
            const insertQuery = 'INSERT INTO ratings (movie_id, rating) VALUES (?, ?)';
            db.run(insertQuery, [movie_id, rating], function (err) {
                if (err) {
                    console.error(err);
                    res.status(500).send('Internal Server Error');
                    return;
                }
                res.status(201).send('Rating added');
            });
        }
    });
});

// Remove rating
app.post('/remove-rating', (req, res) => {
    const { movie_id } = req.body;
    const query = 'DELETE FROM ratings WHERE movie_id = ?';
    db.run(query, [movie_id], function (err) {
        if (err) {
            console.error(err);
            res.status(500).send('Internal Server Error');
            return;
        }
        res.status(200).send('Rating removed');
    });
});

app.listen(port, () => {
    console.log(`Server is listening at http://localhost:${port}`);
});