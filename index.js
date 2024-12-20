document.addEventListener("DOMContentLoaded", () => {
    // DOM Elements
    const movieTitle = document.getElementById("movie-title");
    const moviePoster = document.getElementById("movie-poster");
    const movieDescription = document.getElementById("movie-description");
    const movieRuntime = document.getElementById("movie-runtime");
    const movieShowtime = document.getElementById("movie-showtime");
    const movieTickets = document.getElementById("movie-tickets");
    const buyTicketButton = document.getElementById("buy-ticket");
    const filmsList = document.getElementById("films");

    // Helper Function: Display Movie Details
    function displayMovieDetails(movie) {
        movieTitle.textContent = movie.title;
        moviePoster.src = movie.poster;
        movieDescription.textContent = movie.description;
        movieRuntime.textContent = `Runtime: ${movie.runtime} minutes`;
        movieShowtime.textContent = `Showtime: ${movie.showtime}`;
        const ticketsLeft = movie.capacity - movie.tickets_sold;
        movieTickets.textContent = `Available Tickets: ${ticketsLeft}`;
        buyTicketButton.dataset.movieId = movie.id; // Store movie ID for updates
        buyTicketButton.dataset.remainingTickets = ticketsLeft; // Track remaining tickets

        // Update button state
        if (ticketsLeft > 0) {
            buyTicketButton.textContent = "Buy Ticket";
            buyTicketButton.disabled = false;
        } else {
            buyTicketButton.textContent = "Sold Out";
            buyTicketButton.disabled = true;
        }
    }

    // Save movies data to local storage
    function saveMoviesToLocalStorage(movies) {
        localStorage.setItem("movies", JSON.stringify(movies));
    }

    // Load movies from local storage
    function loadMoviesFromLocalStorage() {
        const storedMovies = localStorage.getItem("movies");
        return storedMovies ? JSON.parse(storedMovies) : null;
    }

    // Fetch the First Movie and Display Its Details
    function fetchFirstMovie() {
        const movies = loadMoviesFromLocalStorage();
        if (movies) {
            displayMovieDetails(movies[0]); // Display the first movie from local storage
        } else {
            // Fallback to fetch if local storage is empty
            fetch("http://localhost:3000/films/1")
                .then((response) => response.json())
                .then((movie) => displayMovieDetails(movie))
                .catch((error) => console.error("Error fetching the first movie:", error));
        }
    }

    // Fetch All Movies and Populate the Sidebar
    function fetchMovies() {
        const storedMovies = loadMoviesFromLocalStorage();
        if (storedMovies) {
            populateMoviesSidebar(storedMovies);
        } else {
            fetch("http://localhost:3000/films")
                .then((response) => response.json())
                .then((movies) => {
                    populateMoviesSidebar(movies);
                    saveMoviesToLocalStorage(movies); // Save to local storage
                })
                .catch((error) => console.error("Error fetching movies:", error));
        }
    }

    // Populate Movies Sidebar
    function populateMoviesSidebar(movies) {
        // Clear any existing list items
        filmsList.innerHTML = "";

        movies.forEach((movie) => {
            const filmItem = document.createElement("li");
            filmItem.textContent = movie.title;
            filmItem.classList.add("film", "item");
            filmItem.dataset.id = movie.id;

            // Add "sold-out" class if movie is sold out
            const ticketsLeft = movie.capacity - movie.tickets_sold;
            if (ticketsLeft === 0) {
                filmItem.classList.add("sold-out");
            }

            // Add click event to display movie details
            filmItem.addEventListener("click", () => displayMovieDetails(movie));

            // Append to the sidebar
            filmsList.appendChild(filmItem);
        });
    }

    // Buy Ticket Button Event Listener
    buyTicketButton.addEventListener("click", () => {
        const movieId = buyTicketButton.dataset.movieId;
        let remainingTickets = parseInt(buyTicketButton.dataset.remainingTickets);

        if (remainingTickets > 0) {
            remainingTickets -= 1;

            // Update ticket count on the frontend
            movieTickets.textContent = `Available Tickets: ${remainingTickets}`;
            buyTicketButton.dataset.remainingTickets = remainingTickets;

            // Update button state if sold out
            if (remainingTickets === 0) {
                buyTicketButton.textContent = "Sold Out";
                buyTicketButton.disabled = true;

                // Add "sold-out" class to the movie in the sidebar
                const filmItem = [...filmsList.children].find(
                    (li) => li.dataset.id === movieId
                );
                if (filmItem) filmItem.classList.add("sold-out");
            }

            // Persist updated tickets in local storage
            const storedMovies = loadMoviesFromLocalStorage();
            const movieToUpdate = storedMovies.find((movie) => movie.id === parseInt(movieId));
            if (movieToUpdate) {
                movieToUpdate.tickets_sold = movieToUpdate.capacity - remainingTickets;
                saveMoviesToLocalStorage(storedMovies);
            }

            // Persist updated tickets on the server
            fetch(`http://localhost:3000/films/${movieId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ tickets_sold: movieToUpdate.tickets_sold }),
            })
                .then((response) => response.json())
                .then((updatedMovie) => console.log("Updated movie:", updatedMovie))
                .catch((error) => console.error("Error updating tickets:", error));
        } else {
            alert("Tickets are already sold out!");
        }
    });

    // Fetch movies and display the first one when the page loads
    fetchFirstMovie();
    fetchMovies();
});
