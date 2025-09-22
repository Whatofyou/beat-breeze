document.addEventListener("DOMContentLoaded", () => {
  // DOM Elements
  const searchInput = document.getElementById("search-input")
  const searchButton = document.getElementById("search-button")
  const resultsList = document.getElementById("results-list")
  const resultsCount = document.getElementById("results-count")
  const audioPlayer = document.getElementById("audio-player")
  const currentSong = document.getElementById("current-song")
  const loading = document.getElementById("loading")

  // Current playing song
  let currentlyPlaying = null

  // Load history from localStorage
  const searchHistory = JSON.parse(localStorage.getItem("deezerSearchHistory")) || []
  const playedSongs = JSON.parse(localStorage.getItem("deezerPlayedSongs")) || []

  // Event Listeners
  searchButton.addEventListener("click", performSearch)
  searchInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      performSearch()
    }
  })

  // Check URL parameters
  function checkUrlParameters() {
    const urlParams = new URLSearchParams(window.location.search)
    const searchQuery = urlParams.get("search")

    if (searchQuery) {
      searchInput.value = searchQuery
      performSearch()
      // Clear the URL parameter after search
      window.history.replaceState({}, document.title, window.location.pathname)
    }
  }

  // Check URL parameters on load
  checkUrlParameters()

  // Search function
  function performSearch() {
    const query = searchInput.value.trim()

    if (!query) {
      alert("Please enter a search term")
      return
    }

    // Add to search history
    addToSearchHistory(query)

    // Show loading spinner
    loading.classList.remove("hidden")
    resultsList.innerHTML = ""
    resultsCount.textContent = ""

    // Create a unique callback function name
    const callbackName = "jsonpCallback_" + Date.now()

    // Create a global callback function
    window[callbackName] = (data) => {
      // Hide loading spinner
      loading.classList.add("hidden")

      // Display results count
      resultsCount.textContent = `Found ${data.data.length} results`

      // Display results
      if (data.data.length === 0) {
        resultsList.innerHTML = "<p>No results found. Try a different search term.</p>"
        return
      }

      // Create song cards
      data.data.forEach((song) => {
        const songCard = createSongCard(song)
        resultsList.appendChild(songCard)
      })

      // Clean up the global callback function
      delete window[callbackName]
      document.head.removeChild(script)
    }

    // Create script element
    const script = document.createElement("script")
    script.src = `https://api.deezer.com/search?q=${encodeURIComponent(query)}&output=jsonp&callback=${callbackName}`

    // Handle errors
    script.onerror = () => {
      loading.classList.add("hidden")
      resultsList.innerHTML = "<p>An error occurred while searching. Please try again later.</p>"
      delete window[callbackName]
      document.head.removeChild(script)
    }

    // Add script to the document
    document.head.appendChild(script)
  }

  // Create song card
  function createSongCard(song) {
    const songCard = document.createElement("div")
    songCard.className = "song-card"

    const albumImage = song.album.cover_medium || "/placeholder.svg?height=250&width=250"

    songCard.innerHTML = `
      <img src="${albumImage}" alt="${song.title}" class="song-image">
      <div class="song-info">
        <div class="song-title">${song.title}</div>
        <div class="song-artist">${song.artist.name}</div>
        <button class="play-button" data-preview="${song.preview}" data-title="${song.title}" data-artist="${song.artist.name}" data-cover="${albumImage}">
          Play Preview
        </button>
      </div>
    `

    // Add event listener to play button
    const playButton = songCard.querySelector(".play-button")
    playButton.addEventListener("click", () => {
      const previewUrl = playButton.getAttribute("data-preview")
      const title = playButton.getAttribute("data-title")
      const artist = playButton.getAttribute("data-artist")
      const cover = playButton.getAttribute("data-cover")
      const songTitle = `${title} - ${artist}`

      if (previewUrl) {
        playPreview(previewUrl, songTitle, title, artist, cover)
      } else {
        alert("No preview available for this song")
      }
    })

    return songCard
  }

  // Play preview function
  function playPreview(previewUrl, songTitle, title, artist, cover) {
    // Stop current song if playing
    if (currentlyPlaying === previewUrl) {
      audioPlayer.pause()
      audioPlayer.currentTime = 0
      currentlyPlaying = null
      currentSong.textContent = "Nothing playing"
      return
    }

    // Play new song
    audioPlayer.src = previewUrl
    audioPlayer.play()
    currentlyPlaying = previewUrl
    currentSong.textContent = songTitle

    // Add to played songs history
    addToPlayedSongs({
      title: title,
      artist: artist,
      fullTitle: songTitle,
      url: previewUrl,
      cover: cover,
    })

    // Reset when song ends
    audioPlayer.onended = () => {
      currentlyPlaying = null
      currentSong.textContent = "Nothing playing"
    }
  }

  // History functions
  function addToSearchHistory(query) {
    // Check if this query already exists in history
    const existingIndex = searchHistory.findIndex((item) => item.query === query)

    // If it exists, remove it (we'll add it back at the top)
    if (existingIndex !== -1) {
      searchHistory.splice(existingIndex, 1)
    }

    // Add new search to the beginning of the array
    searchHistory.unshift({
      query: query,
      timestamp: new Date().toISOString(),
    })

    // Limit history to 20 items
    if (searchHistory.length > 20) {
      searchHistory.pop()
    }

    // Save to localStorage
    localStorage.setItem("deezerSearchHistory", JSON.stringify(searchHistory))
  }

  function addToPlayedSongs(song) {
    // Check if this song already exists in history
    const existingIndex = playedSongs.findIndex((item) => item.url === song.url)

    // If it exists, remove it (we'll add it back at the top)
    if (existingIndex !== -1) {
      playedSongs.splice(existingIndex, 1)
    }

    // Add new song to the beginning of the array
    playedSongs.unshift({
      ...song,
      timestamp: new Date().toISOString(),
    })

    // Limit history to 20 items
    if (playedSongs.length > 20) {
      playedSongs.pop()
    }

    // Save to localStorage
    localStorage.setItem("deezerPlayedSongs", JSON.stringify(playedSongs))
  }

  // Initial focus on search input
  searchInput.focus()
})
