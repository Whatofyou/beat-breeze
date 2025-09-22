document.addEventListener("DOMContentLoaded", () => {
  // DOM Elements
  const refreshBtn = document.getElementById("refresh-recommendations")
  const recommendationsLoading = document.getElementById("recommendations-loading")
  const recommendationsList = document.getElementById("recommendations-list")
  const audioPlayer = document.getElementById("audio-player")
  const currentSong = document.getElementById("current-song")

  // Current playing song
  let currentlyPlaying = null

  // Popular search terms for recommendations
  const recommendationTerms = [
    "popular hits",
    "trending music",
    "top songs",
    "chart hits",
    "best music",
    "viral songs",
    "radio hits",
    "new music",
    "popular artists",
    "hit songs",
    "mainstream music",
    "current hits",
    "billboard",
    "spotify hits",
    "dance hits",
    "pop music",
    "rock hits",
    "hip hop",
    "electronic music",
    "indie music",
  ]

  // Event Listeners
  refreshBtn.addEventListener("click", loadRecommendations)

  // Load recommendations on page load
  loadRecommendations()

  // Load random recommendations
  function loadRecommendations() {
    // Show loading
    recommendationsLoading.classList.remove("hidden")
    recommendationsList.innerHTML = ""
    refreshBtn.disabled = true
    refreshBtn.textContent = "🔄 Loading..."

    // Get random search term
    const randomTerm = recommendationTerms[Math.floor(Math.random() * recommendationTerms.length)]

    // Create a unique callback function name
    const callbackName = "recommendationsCallback_" + Date.now()

    // Create a global callback function
    window[callbackName] = (data) => {
      // Hide loading
      recommendationsLoading.classList.add("hidden")
      refreshBtn.disabled = false
      refreshBtn.textContent = "🔄 Get New Songs"

      // Display results
      if (data.data.length === 0) {
        recommendationsList.innerHTML = "<p>No recommendations available. Try refreshing!</p>"
        return
      }

      // Shuffle and limit to 12 songs for better variety
      const shuffledSongs = data.data.sort(() => 0.5 - Math.random()).slice(0, 12)

      // Create song cards
      shuffledSongs.forEach((song) => {
        const songCard = createSongCard(song)
        recommendationsList.appendChild(songCard)
      })

      // Clean up the global callback function
      delete window[callbackName]
      document.head.removeChild(script)
    }

    // Create script element
    const script = document.createElement("script")
    script.src = `https://api.deezer.com/search?q=${encodeURIComponent(randomTerm)}&output=jsonp&callback=${callbackName}`

    // Handle errors
    script.onerror = () => {
      recommendationsLoading.classList.add("hidden")
      recommendationsList.innerHTML = "<p>Unable to load recommendations. Please try again later.</p>"
      refreshBtn.disabled = false
      refreshBtn.textContent = "🔄 Get New Songs"
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

  // Add to played songs history
  function addToPlayedSongs(song) {
    const playedSongs = JSON.parse(localStorage.getItem("deezerPlayedSongs")) || []

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
})
