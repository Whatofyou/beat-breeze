document.addEventListener("DOMContentLoaded", () => {
  // DOM Elements
  const searchHistoryTab = document.getElementById("search-history-tab")
  const playedSongsTab = document.getElementById("played-songs-tab")
  const searchHistoryContent = document.getElementById("search-history-content")
  const playedSongsContent = document.getElementById("played-songs-content")
  const searchHistoryList = document.getElementById("search-history-list")
  const playedSongsGrid = document.getElementById("played-songs-grid")
  const noSearchHistory = document.getElementById("no-search-history")
  const noPlayedSongs = document.getElementById("no-played-songs")
  const clearHistoryBtn = document.getElementById("clear-history")

  // Load history from localStorage
  let searchHistory = JSON.parse(localStorage.getItem("deezerSearchHistory")) || []
  let playedSongs = JSON.parse(localStorage.getItem("deezerPlayedSongs")) || []

  // Event Listeners
  searchHistoryTab.addEventListener("click", () => switchHistoryTab("search"))
  playedSongsTab.addEventListener("click", () => switchHistoryTab("played"))
  clearHistoryBtn.addEventListener("click", clearCurrentHistory)

  // Initialize history display
  updateHistoryDisplay()

  function updateHistoryDisplay() {
    // Update search history
    if (searchHistory.length === 0) {
      searchHistoryList.innerHTML = ""
      noSearchHistory.style.display = "block"
    } else {
      noSearchHistory.style.display = "none"
      searchHistoryList.innerHTML = searchHistory
        .map((item) => {
          const date = new Date(item.timestamp)
          const formattedDate = date.toLocaleDateString() + " " + date.toLocaleTimeString()
          return `
          <li class="history-item">
            <span class="history-item-text" data-query="${item.query}">${item.query}</span>
            <span class="history-item-time">${formattedDate}</span>
            <button class="history-item-action" data-query="${item.query}">Search</button>
          </li>
        `
        })
        .join("")

      // Add event listeners to search history items
      searchHistoryList.querySelectorAll(".history-item-text").forEach((item) => {
        item.addEventListener("click", () => {
          window.location.href = `index.html?search=${encodeURIComponent(item.getAttribute("data-query"))}`
        })
      })

      searchHistoryList.querySelectorAll(".history-item-action").forEach((button) => {
        button.addEventListener("click", () => {
          window.location.href = `index.html?search=${encodeURIComponent(button.getAttribute("data-query"))}`
        })
      })
    }

    // Update played songs history
    if (playedSongs.length === 0) {
      playedSongsGrid.innerHTML = ""
      noPlayedSongs.style.display = "block"
    } else {
      noPlayedSongs.style.display = "none"
      playedSongsGrid.innerHTML = playedSongs
        .map((song) => {
          const date = new Date(song.timestamp)
          const formattedDate = date.toLocaleDateString() + " " + date.toLocaleTimeString()
          return `
          <div class="played-song-card">
            <img src="${song.cover}" alt="${song.title}" class="played-song-image">
            <div class="played-song-info">
              <div class="played-song-title">${song.title}</div>
              <div class="played-song-artist">${song.artist}</div>
              <div class="played-song-time">${formattedDate}</div>
              <button class="played-song-play" data-url="${song.url}" data-title="${song.fullTitle}">
                Play Again
              </button>
            </div>
          </div>
        `
        })
        .join("")

      // Add event listeners to played songs items
      playedSongsGrid.querySelectorAll(".played-song-play").forEach((button) => {
        button.addEventListener("click", () => {
          const url = button.getAttribute("data-url")
          const title = button.getAttribute("data-title")

          // Create audio element if it doesn't exist
          let audioPlayer = document.getElementById("temp-audio-player")
          if (!audioPlayer) {
            audioPlayer = document.createElement("audio")
            audioPlayer.id = "temp-audio-player"
            audioPlayer.controls = true
            audioPlayer.style.display = "none"
            document.body.appendChild(audioPlayer)
          }

          audioPlayer.src = url
          audioPlayer.play()

          // Show notification
          alert(`Now playing: ${title}`)
        })
      })
    }
  }

  function switchHistoryTab(tab) {
    if (tab === "search") {
      searchHistoryTab.classList.add("active")
      playedSongsTab.classList.remove("active")
      searchHistoryContent.classList.add("active")
      playedSongsContent.classList.remove("active")
    } else {
      searchHistoryTab.classList.remove("active")
      playedSongsTab.classList.add("active")
      searchHistoryContent.classList.remove("active")
      playedSongsContent.classList.add("active")
    }
  }

  function clearCurrentHistory() {
    if (searchHistoryContent.classList.contains("active")) {
      // Clear search history
      searchHistory = []
      localStorage.setItem("deezerSearchHistory", JSON.stringify(searchHistory))
    } else {
      // Clear played songs history
      playedSongs = []
      localStorage.setItem("deezerPlayedSongs", JSON.stringify(playedSongs))
    }
    updateHistoryDisplay()
  }

  // Check if we need to handle URL parameters for the main page
  function checkUrlParameters() {
    const urlParams = new URLSearchParams(window.location.search)
    const searchQuery = urlParams.get("search")

    if (searchQuery) {
      window.location.href = `index.html?search=${encodeURIComponent(searchQuery)}`
    }
  }

  // Check URL parameters on load
  checkUrlParameters()
})
