document.addEventListener("DOMContentLoaded", () => {
  // DOM Elements
  const moodCards = document.querySelectorAll(".mood-card")
  const moodSelection = document.querySelector(".mood-selection")
  const moodResults = document.getElementById("mood-results")
  const selectedMoodTitle = document.getElementById("selected-mood-title")
  const backToMoodsBtn = document.getElementById("back-to-moods")
  const moodLoading = document.getElementById("mood-loading")
  const moodResultsCount = document.getElementById("mood-results-count")
  const moodResultsList = document.getElementById("mood-results-list")
  const audioPlayer = document.getElementById("audio-player")
  const currentSong = document.getElementById("current-song")

  // Current playing song
  let currentlyPlaying = null

  // Event Listeners
  moodCards.forEach((card) => {
    card.addEventListener("click", () => {
      const mood = card.getAttribute("data-mood")
      const searchTerms = card.getAttribute("data-search")
      const moodName = card.querySelector("h3").textContent
      selectMood(mood, searchTerms, moodName)
    })
  })

  backToMoodsBtn.addEventListener("click", () => {
    showMoodSelection()
  })

  // Select mood and search for songs
  function selectMood(mood, searchTerms, moodName) {
    // Hide mood selection and show results
    moodSelection.style.display = "none"
    moodResults.style.display = "block"
    selectedMoodTitle.textContent = `${moodName} Songs`

    // Search for songs based on mood
    searchMoodSongs(searchTerms)
  }

  // Search for mood-based songs
  async function searchMoodSongs(searchTerms) {
    // Show loading spinner
    moodLoading.classList.remove("hidden")
    moodResultsList.innerHTML = ""
    moodResultsCount.textContent = ""

    // Create a unique callback function name
    const callbackName = "moodCallback_" + Date.now()

    // Create a global callback function
    window[callbackName] = (data) => {
      // Hide loading spinner
      moodLoading.classList.add("hidden")

      // Display results count
      moodResultsCount.textContent = `Found ${data.data.length} songs for your mood`

      // Display results
      if (data.data.length === 0) {
        moodResultsList.innerHTML = "<p>No songs found for this mood. Try a different mood.</p>"
        return
      }

      // Create song cards
      data.data.forEach((song) => {
        const songCard = createSongCard(song)
        moodResultsList.appendChild(songCard)
      })

      // Clean up the global callback function
      delete window[callbackName]
      document.head.removeChild(script)
    }

    // Create script element
    const script = document.createElement("script")
    script.src = `https://api.deezer.com/search?q=${encodeURIComponent(searchTerms)}&output=jsonp&callback=${callbackName}`

    // Handle errors
    script.onerror = () => {
      moodLoading.classList.add("hidden")
      moodResultsList.innerHTML = "<p>An error occurred while searching. Please try again later.</p>"
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

  // Show mood selection
  function showMoodSelection() {
    moodSelection.style.display = "block"
    moodResults.style.display = "none"
  }
})
