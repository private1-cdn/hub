// script.js - Main JavaScript logic

// DOM Elements
const entertainerContainer = document.getElementById('entertainerContainer');
const videoModal = document.getElementById('videoModal');
const closeModal = document.getElementById('closeModal');
const videoPlayer = document.getElementById('videoPlayer');
const modalTitle = document.getElementById('modalTitle');
const modalProfilePic = document.getElementById('modalProfilePic');
const modalFavoriteBtn = document.getElementById('modalFavoriteBtn');
const loadingMessage = document.getElementById('loadingMessage');
const totalActiveEntertainersEl = document.getElementById('totalActiveEntertainers');
const thumbnailCanvas = document.getElementById('thumbnailCanvas');
const thumbnailCtx = thumbnailCanvas.getContext('2d');
const savedEntertainersIcon = document.getElementById('savedEntertainersIcon');
const tvIcon = document.getElementById('tvIcon');
const combinedModal = document.getElementById('combinedModal');
const closeCombinedModal = document.getElementById('closeCombinedModal');
const combinedModalBody = document.getElementById('combinedModalBody');
const combinedModalTitle = document.getElementById('combinedModalTitle');
const emptyStateMessage = document.getElementById('emptyStateMessage');
const userIcon = document.getElementById('userIcon');
const menuIcon = document.getElementById('menuIcon');
const countryMenu = document.getElementById('countryMenu');
const countryButtons = document.querySelectorAll('.country-btn');
const warningPopup = document.getElementById('warningPopup');
const closeWarningPopup = document.getElementById('closeWarningPopup');
const headerTitle = document.getElementById('headerTitle');
const loginSuccessAlert = document.getElementById('loginSuccessAlert');
const videoCountdown = document.getElementById('videoCountdown');
const videoCountdownTimer = document.getElementById('videoCountdownTimer');
const packageIcon = document.getElementById('packageIcon'); // New package icon

// Global Variables
let activeEntertainers = [];
let displayedEntertainers = [];
let checkedEntertainers = new Set();
let isInitialLoad = true;
let batchSize = 200;
let batchInterval = 5000;
let batchIntervalId = null;
let entertainersPerPage = 20;
let currentPage = 1;
let thumbnailQueue = [];
let currentThumbnailLoads = 0;
const maxConcurrentThumbnails = 2;
let autoRecheckIntervalId = null;
const autoRecheckInterval = 60000;
let isFirstLoad = true;
let savedEntertainers = JSON.parse(localStorage.getItem('privateLiveSavedEntertainers')) || [];
let currentVideoEntertainer = null;
let isCountryMenuOpen = false;
let currentModalMode = 'favorites'; // 'favorites', 'country', 'tv', 'profile', or 'pricing'
let currentUser = null; // Track logged in user
let countdownInterval = null; // For countdown timer
let videoCountdownInterval = null; // For video modal countdown
let hasShownLoginSuccess = false; // Track if login success has been shown

// Add the ad script
const adScript = document.createElement('script');
adScript.src = '//jagnaimsee.net/vignette.min.js';
adScript.setAttribute('data-zone', '9086463');
adScript.setAttribute('data-sdk', 'show_9086463');
document.head.appendChild(adScript);

// Function to watch ad
function watchAd() {
    return new Promise((resolve, reject) => {
        if (typeof show_9086463 === 'function') {
            show_9086463().then(() => {
                resolve();
            }).catch((error) => {
                console.error('Ad error:', error);
                resolve(); // Resolve anyway to continue
            });
        } else {
            // If ad function is not available, resolve immediately
            console.log('Ad function not available');
            resolve();
        }
    });
}

// Function to check if user should see ads
function shouldShowAds() {
    // If user is not logged in, show ads
    if (!currentUser) {
        return true;
    }
    
    // If user is logged in but subscription is expired, show ads
    const [day, month, year] = currentUser.expiryDate.split(':').map(Number);
    const [hour, minute] = currentUser.expiryTime.split(':').map(Number);
    const expiryDate = new Date(year, month - 1, day, hour, minute);
    const now = new Date();
    
    return expiryDate <= now;
}

function updateWebsiteTitle() {
    if (currentUser) {
        // Check if subscription is active
        const [day, month, year] = currentUser.expiryDate.split(':').map(Number);
        const [hour, minute] = currentUser.expiryTime.split(':').map(Number);
        const expiryDate = new Date(year, month - 1, day, hour, minute);
        const now = new Date();
        
        if (expiryDate > now) {
            headerTitle.innerHTML = '<i class="fas fa-crown"></i> PremiumHub';
            document.getElementById('siteTitle').textContent = 'PremiumHub';
        } else {
            headerTitle.textContent = 'Demo';
            document.getElementById('siteTitle').textContent = 'Demo';
        }
    } else {
        headerTitle.textContent = 'Demo';
        document.getElementById('siteTitle').textContent = 'Demo';
    }
}

function handleBrowserBackButton() {
    if (videoModal.classList.contains('active')) {
        closeVideoModal();
    } else if (combinedModal.classList.contains('active')) {
        closeCombinedModalFunc();
    } else if (isCountryMenuOpen) {
        toggleCountryMenu();
    } else if (warningPopup.classList.contains('active')) {
        closeWarningPopupFunc();
    }
}

function toggleCountryMenu() {
    isCountryMenuOpen = !isCountryMenuOpen;
    if (isCountryMenuOpen) {
        countryMenu.classList.add('active');
        menuIcon.classList.add('active');
        // Change icon to arrow down
        menuIcon.querySelector('i').className = 'fas fa-arrow-down';
    } else {
        countryMenu.classList.remove('active');
        menuIcon.classList.remove('active');
        // Change icon to arrow up
        menuIcon.querySelector('i').className = 'fas fa-arrow-up';
    }
}

function openCombinedModal(mode, country = null) {
    currentModalMode = mode;
    
    if (mode === 'country') {
        combinedModalTitle.textContent = `${country} Entertainers`;
        displayCountryEntertainers(country);
    } else if (mode === 'tv') {
        combinedModalTitle.textContent = 'TV Channels';
        displayTVChannels();
    } else if (mode === 'profile') {
        combinedModalTitle.textContent = 'Profile';
        displayProfile();
    } else if (mode === 'pricing') {
        combinedModalTitle.textContent = 'Pricing Plans';
        displayPricing();
    } else {
        combinedModalTitle.textContent = 'Saved Entertainers';
        displaySavedEntertainers();
    }
    
    combinedModal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeCombinedModalFunc() {
    combinedModal.classList.remove('active');
    document.body.style.overflow = 'auto';
    
    // Clear countdown interval when modal closes
    if (countdownInterval) {
        clearInterval(countdownInterval);
        countdownInterval = null;
    }
}

function displayPricing() {
    combinedModalBody.innerHTML = document.getElementById('pricingPlansTemplate').innerHTML;
}

function displayTVChannels() {
    combinedModalBody.innerHTML = '';
    
    if (tvChannels.length === 0) {
        const tvEmptyState = document.createElement('div');
        tvEmptyState.className = 'tv-empty-state';
        tvEmptyState.innerHTML = `
            <h3>No TV Channels Available</h3>
            <p>There are no TV channels available at the moment.</p>
        `;
        combinedModalBody.appendChild(tvEmptyState);
        return;
    }
    
    const tvChannelsGrid = document.createElement('div');
    tvChannelsGrid.className = 'tv-channels-grid';
    
    tvChannels.forEach(channel => {
        const tvChannelCard = document.createElement('div');
        tvChannelCard.className = 'tv-channel-card';
        
        const tvChannelThumbnail = document.createElement('div');
        tvChannelThumbnail.className = 'tv-channel-thumbnail';
        
        const thumbnailImg = document.createElement('img');
        thumbnailImg.src = channel.thumbnail;
        thumbnailImg.alt = channel.name;
        thumbnailImg.onerror = function() {
            this.src = 'https://via.placeholder.com/640x360?text=No+Thumbnail';
        };
        
        const tvChannelName = document.createElement('div');
        tvChannelName.className = 'tv-channel-name';
        tvChannelName.textContent = channel.name;
        
        tvChannelThumbnail.appendChild(thumbnailImg);
        tvChannelCard.appendChild(tvChannelThumbnail);
        tvChannelCard.appendChild(tvChannelName);
        
        tvChannelCard.addEventListener('click', () => openChannel(channel));
        tvChannelsGrid.appendChild(tvChannelCard);
    });
    
    combinedModalBody.appendChild(tvChannelsGrid);
}

function openChannel(channel) {
    // Check if we should show ads
    if (shouldShowAds()) {
        // Show ad first
        watchAd().then(() => {
            // After ad is closed, open the channel
            openChannelAfterAd(channel);
        });
    } else {
        // Premium user, open directly
        openChannelAfterAd(channel);
    }
}

function openChannelAfterAd(channel) {
    modalTitle.textContent = channel.name;
    modalProfilePic.src = channel.thumbnail;
    modalProfilePic.onerror = function() {
        this.src = 'https://via.placeholder.com/300x300?text=Channel';
    };
    
    modalFavoriteBtn.style.display = 'none'; // Hide favorite button for channels
    
    currentVideoEntertainer = channel;
    
    videoModal.classList.add('active');

    videoPlayer.style.width = '100%';
    videoPlayer.style.height = 'auto';
    videoPlayer.style.display = 'none';
    
    const loadingSpinner = document.createElement('div');
    loadingSpinner.className = 'spinner';
    
    const loadingText = document.createElement('div');
    loadingText.textContent = 'Loading ...';
    
    loadingMessage.innerHTML = '';
    loadingMessage.appendChild(loadingSpinner);
    loadingMessage.appendChild(loadingText);
    loadingMessage.style.display = 'flex';
    
    // Check if user is premium and start countdown if not
    checkPremiumStatusAndStartCountdown();
    
    if (Hls.isSupported()) {
        const hls = new Hls({
            maxMaxBufferLength: 30,
            maxBufferSize: 6000000,
            maxBufferLength: 30,
            enableWorker: true
        });
        
        hls.loadSource(channel.m3u8Url);
        hls.attachMedia(videoPlayer);
        
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
            loadingMessage.style.display = 'none';
            videoPlayer.style.display = 'block';
            videoPlayer.play().catch(e => {
                console.error('Autoplay failed:', e);
                loadingMessage.style.display = 'flex';
                loadingText.textContent = 'Click to play';
            });
        });
        
        const resizeObserver = new ResizeObserver(() => {
            const aspectRatio = videoPlayer.videoWidth / videoPlayer.videoHeight;
            videoPlayer.style.width = aspectRatio > 1 ? '100%' : 'auto';
            videoPlayer.style.height = aspectRatio > 1 ? 'auto' : '100%';
        });
        resizeObserver.observe(videoPlayer);
        
        hls.on(Hls.Events.ERROR, (event, data) => {
            console.error('HLS error:', data);
            if (data.fatal) {
                switch(data.type) {
                    case Hls.ErrorTypes.NETWORK_ERROR:
                        loadingText.textContent = 'Offline ...';
                        break;
                    case Hls.ErrorTypes.MEDIA_ERROR:
                        loadingText.textContent = 'Live Error';
                        hls.recoverMediaError();
                        break;
                    default:
                        loadingText.textContent = 'Error, Please try again';
                        break;
                }
            }
        });
        
        videoPlayer._hls = hls;
        videoPlayer._resizeObserver = resizeObserver;
    } else if (videoPlayer.canPlayType('application/vnd.apple.mpegurl')) {
        videoPlayer.src = channel.m3u8Url;
        videoPlayer.addEventListener('loadedmetadata', () => {
            loadingMessage.style.display = 'none';
            videoPlayer.style.display = 'block';
            videoPlayer.play().catch(e => {
                console.error('Autoplay failed:', e);
                loadingMessage.style.display = 'flex';
                loadingText.textContent = 'Click to play';
            });
        });
        
        videoPlayer.addEventListener('error', () => {
            loadingText.textContent = 'Error, Please try again';
        });
    } else {
        loadingText.textContent = 'Please try another browser';
    }
}

function displayCountryEntertainers(country) {
    combinedModalBody.innerHTML = '';
    
    const countryActiveEntertainers = activeEntertainers.filter(entertainer => entertainer.country === country);
    
    if (countryActiveEntertainers.length === 0) {
        const countryEmptyState = document.createElement('div');
        countryEmptyState.className = 'combined-empty-state';
        countryEmptyState.innerHTML = `
            <h3>No Active Entertainers</h3>
            <p>There are no active entertainers in ${country} at the moment.</p>
        `;
        combinedModalBody.appendChild(countryEmptyState);
        return;
    }
    
    const combinedEntertainersGrid = document.createElement('div');
    combinedEntertainersGrid.className = 'combined-entertainers-grid';
    
    countryActiveEntertainers.forEach(entertainer => {
        const combinedEntertainerCard = document.createElement('div');
        combinedEntertainerCard.className = 'combined-entertainer-card';
        combinedEntertainerCard.setAttribute('data-entertainer-id', entertainer.id);
        
        const combinedEntertainerThumbnail = document.createElement('div');
        combinedEntertainerThumbnail.className = 'combined-entertainer-thumbnail';
        
        const thumbnailImg = document.createElement('img');
        thumbnailImg.src = entertainer.thumbnail;
        thumbnailImg.alt = entertainer.name;
        thumbnailImg.onerror = function() {
            this.src = 'https://via.placeholder.com/300x300?text=No+Thumbnail';
        };
        
        const combinedEntertainerName = document.createElement('div');
        combinedEntertainerName.className = 'combined-entertainer-name';
        combinedEntertainerName.textContent = entertainer.name;
        
        const combinedEntertainerLiveBadge = document.createElement('div');
        combinedEntertainerLiveBadge.className = 'combined-entertainer-live-badge';
        combinedEntertainerLiveBadge.textContent = 'ONLINE';
        
        const favoriteBtn = document.createElement('button');
        favoriteBtn.className = 'favorite-btn';
        favoriteBtn.setAttribute('data-entertainer-id', entertainer.id);
        favoriteBtn.innerHTML = isEntertainerSaved(entertainer.id) ? '<i class="fas fa-heart"></i>' : '<i class="far fa-heart"></i>';
        if (isEntertainerSaved(entertainer.id)) {
            favoriteBtn.classList.add('active');
        }
        
        favoriteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (isEntertainerSaved(entertainer.id)) {
                removeSavedEntertainer(entertainer.id);
            } else {
                saveEntertainer(entertainer);
            }
            updateFavoriteButtons();
        });
        
        const thumbnailLoading = document.createElement('div');
        thumbnailLoading.className = 'thumbnail-loading';
        thumbnailLoading.style.display = entertainer.hasThumbnail ? 'none' : 'flex';
        thumbnailLoading.innerHTML = `
            <div class="spinner" style="width: 30px; height: 30px;"></div>
        `;
        
        combinedEntertainerThumbnail.appendChild(thumbnailImg);
        combinedEntertainerThumbnail.appendChild(combinedEntertainerName);
        combinedEntertainerThumbnail.appendChild(combinedEntertainerLiveBadge);
        combinedEntertainerThumbnail.appendChild(favoriteBtn);
        combinedEntertainerThumbnail.appendChild(thumbnailLoading);
        combinedEntertainerCard.appendChild(combinedEntertainerThumbnail);
        
        combinedEntertainerCard.addEventListener('click', () => openEntertainer(entertainer));
        combinedEntertainersGrid.appendChild(combinedEntertainerCard);
    });
    
    combinedModalBody.appendChild(combinedEntertainersGrid);
}

function updateStats() {
    totalActiveEntertainersEl.textContent = `Active: ${activeEntertainers.length}`;
}

function saveEntertainer(entertainer) {
    if (!savedEntertainers.some(c => c.id === entertainer.id)) {
        savedEntertainers.push(entertainer);
        localStorage.setItem('privateLiveSavedEntertainers', JSON.stringify(savedEntertainers));
        updateFavoriteButtons();
        return true;
    }
    return false;
}

function removeSavedEntertainer(entertainerId) {
    savedEntertainers = savedEntertainers.filter(c => c.id !== entertainerId);
    localStorage.setItem('privateLiveSavedEntertainers', JSON.stringify(savedEntertainers));
    updateFavoriteButtons();
    
    const entertainerCard = document.querySelector(`.combined-entertainer-card[data-entertainer-id="${entertainerId}"]`);
    if (entertainerCard) {
        entertainerCard.remove();
    }
    
    if (savedEntertainers.length === 0 && currentModalMode === 'favorites') {
        showNoEntertainersMessage();
    }
}

function showNoEntertainersMessage() {
    combinedModalBody.innerHTML = '';
    const noEntertainersMessage = document.createElement('div');
    noEntertainersMessage.className = 'no-entertainers-message';
    noEntertainersMessage.innerHTML = `
        <i class="fas fa-heart-broken broken-heart"></i>
        <h3>No Saved Entertainers</h3>
        <p>You haven't saved any entertainers yet.</p>
    `;
    combinedModalBody.appendChild(noEntertainersMessage);
}

function isEntertainerSaved(entertainerId) {
    return savedEntertainers.some(c => c.id === entertainerId);
}

function updateFavoriteButtons() {
    document.querySelectorAll('.favorite-btn').forEach(btn => {
        const entertainerId = parseInt(btn.getAttribute('data-entertainer-id'));
        if (isEntertainerSaved(entertainerId)) {
            btn.classList.add('active');
            btn.innerHTML = '<i class="fas fa-heart"></i>';
        } else {
            btn.classList.remove('active');
            btn.innerHTML = '<i class="far fa-heart"></i>';
        }
    });
}

function handleModalFavoriteClick() {
    if (currentVideoEntertainer) {
        saveEntertainer(currentVideoEntertainer);
        modalFavoriteBtn.classList.add('hiding');
        setTimeout(() => {
            modalFavoriteBtn.style.display = 'none';
        }, 500);
    }
}

async function displaySavedEntertainers() {
    combinedModalBody.innerHTML = '';
    
    if (savedEntertainers.length === 0) {
        showNoEntertainersMessage();
        return;
    }
    
    // Show checking status
    const checkingStatus = document.createElement('div');
    checkingStatus.className = 'checking-status';
    checkingStatus.innerHTML = `
        <div class="spinner"></div>
        Checking saved entertainers status...
    `;
    combinedModalBody.appendChild(checkingStatus);
    
    const onlineEntertainers = [];
    const offlineEntertainers = [];
    
    const checkPromises = savedEntertainers.map(entertainer => checkStreamFast(entertainer));
    const results = await Promise.allSettled(checkPromises);
    
    for (let i = 0; i < savedEntertainers.length; i++) {
        const entertainer = savedEntertainers[i];
        const result = results[i];
        
        if (result.status === 'fulfilled' && result.value) {
            onlineEntertainers.push(entertainer);
        } else {
            offlineEntertainers.push(entertainer);
        }
    }
    
    checkingStatus.style.display = 'none';
    
    const combinedEntertainersGrid = document.createElement('div');
    combinedEntertainersGrid.className = 'combined-entertainers-grid';
    
    onlineEntertainers.forEach(entertainer => {
        const combinedEntertainerCard = document.createElement('div');
        combinedEntertainerCard.className = 'combined-entertainer-card';
        combinedEntertainerCard.setAttribute('data-entertainer-id', entertainer.id);
        
        const combinedEntertainerThumbnail = document.createElement('div');
        combinedEntertainerThumbnail.className = 'combined-entertainer-thumbnail';
        
        const thumbnailImg = document.createElement('img');
        thumbnailImg.src = entertainer.thumbnail;
        thumbnailImg.alt = entertainer.name;
        thumbnailImg.onerror = function() {
            this.src = 'https://via.placeholder.com/300x300?text=No+Thumbnail';
        };
        
        const combinedEntertainerName = document.createElement('div');
        combinedEntertainerName.className = 'combined-entertainer-name';
        combinedEntertainerName.textContent = entertainer.name;
        
        const combinedEntertainerLiveBadge = document.createElement('div');
        combinedEntertainerLiveBadge.className = 'combined-entertainer-live-badge';
        combinedEntertainerLiveBadge.textContent = 'ONLINE';
        
        const combinedRemoveBtn = document.createElement('button');
        combinedRemoveBtn.className = 'combined-remove-btn';
        combinedRemoveBtn.innerHTML = '<i class="fas fa-times"></i>';
        combinedRemoveBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            removeSavedEntertainer(entertainer.id);
        });
        
        combinedEntertainerThumbnail.appendChild(thumbnailImg);
        combinedEntertainerThumbnail.appendChild(combinedEntertainerName);
        combinedEntertainerThumbnail.appendChild(combinedEntertainerLiveBadge);
        combinedEntertainerThumbnail.appendChild(combinedRemoveBtn);
        combinedEntertainerCard.appendChild(combinedEntertainerThumbnail);
        
        combinedEntertainerCard.addEventListener('click', () => {
            openEntertainerFromSaved(entertainer);
        });
        
        combinedEntertainersGrid.appendChild(combinedEntertainerCard);
    });
    
    offlineEntertainers.forEach(entertainer => {
        const combinedEntertainerCard = document.createElement('div');
        combinedEntertainerCard.className = 'combined-entertainer-card offline-entertainer';
        combinedEntertainerCard.setAttribute('data-entertainer-id', entertainer.id);
        
        const combinedEntertainerThumbnail = document.createElement('div');
        combinedEntertainerThumbnail.className = 'combined-entertainer-thumbnail';
        
        const thumbnailImg = document.createElement('img');
        thumbnailImg.src = entertainer.thumbnail;
        thumbnailImg.alt = entertainer.name;
        thumbnailImg.style.filter = 'grayscale(100%) brightness(0.5)';
        thumbnailImg.onerror = function() {
            this.src = 'https://via.placeholder.com/300x300?text=No+Thumbnail';
        };
        
        const combinedEntertainerName = document.createElement('div');
        combinedEntertainerName.className = 'combined-entertainer-name';
        combinedEntertainerName.textContent = entertainer.name;
        
        const offlineOverlay = document.createElement('div');
        offlineOverlay.className = 'offline-overlay';
        
        const offlineText = document.createElement('div');
        offlineText.className = 'offline-text';
        offlineText.textContent = 'Offline';
        
        const combinedRemoveBtn = document.createElement('button');
        combinedRemoveBtn.className = 'combined-remove-btn';
        combinedRemoveBtn.innerHTML = '<i class="fas fa-times"></i>';
        combinedRemoveBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            removeSavedEntertainer(entertainer.id);
        });
        
        offlineOverlay.appendChild(offlineText);
        combinedEntertainerThumbnail.appendChild(thumbnailImg);
        combinedEntertainerThumbnail.appendChild(combinedEntertainerName);
        combinedEntertainerThumbnail.appendChild(offlineOverlay);
        combinedEntertainerThumbnail.appendChild(combinedRemoveBtn);
        combinedEntertainerCard.appendChild(combinedEntertainerThumbnail);
        
        combinedEntertainerCard.style.cursor = 'not-allowed';
        
        combinedEntertainersGrid.appendChild(combinedEntertainerCard);
    });
    
    combinedModalBody.appendChild(combinedEntertainersGrid);
}

function getNextBatch() {
    const uncheckedEntertainers = entertainers.filter(entertainer => !checkedEntertainers.has(entertainer.id));
    
    // র‍্যান্ডমভাবে entertainer শাফল করি
    const shuffledEntertainers = shuffleArray([...uncheckedEntertainers]);
    
    return shuffledEntertainers.slice(0, batchSize);
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

async function checkBatch(batchEntertainers) {
    const checkPromises = [];
    const newActiveEntertainers = [];
    
    for (const entertainer of batchEntertainers) {
        checkPromises.push(
            checkStream(entertainer)
                .then(isActive => {
                    if (isActive) {
                        newActiveEntertainers.push(entertainer);
                    }
                    checkedEntertainers.add(entertainer.id);
                })
                .catch(() => {
                    checkedEntertainers.add(entertainer.id);
                })
        );
    }
    
    await Promise.all(checkPromises);
    
    activeEntertainers = [...activeEntertainers, ...newActiveEntertainers];
    
    // প্রথম লোডে একটিভ entertainerগুলোও র‍্যান্ডমভাবে শাফল করি
    if (isFirstLoad) {
        shuffleArray(activeEntertainers);
        isFirstLoad = false;
    }
    
    displayedEntertainers = activeEntertainers.slice(0, entertainersPerPage * currentPage);
    displayEntertainers();
    updateStats();
    loadThumbnailsForVisibleEntertainers();
}

function startBatchChecking() {
    if (batchIntervalId) {
        clearInterval(batchIntervalId);
    }
    
    const firstBatch = getNextBatch();
    if (firstBatch.length > 0) {
        checkBatch(firstBatch);
    }
    
    batchIntervalId = setInterval(() => {
        const nextBatch = getNextBatch();
        if (nextBatch.length > 0) {
            checkBatch(nextBatch);
        } else {
            clearInterval(batchIntervalId);
            batchIntervalId = null;
            console.log('All entertainers have been checked');
            
            startAutoRecheck();
        }
    }, batchInterval);
}

function startAutoRecheck() {
    if (autoRecheckIntervalId) {
        clearInterval(autoRecheckIntervalId);
    }
    
    autoRecheckIntervalId = setInterval(() => {
        console.log('Auto-rechecking all entertainers...');
        recheckAllEntertainers();
    }, autoRecheckInterval);
}

async function recheckAllEntertainers() {
    console.log('Re-checking all entertainers...');
    
    const recheckPromises = entertainers.map(async (entertainer) => {
        try {
            const isStillActive = await checkStream(entertainer);
            return { entertainer, isStillActive };
        } catch (error) {
            return { entertainer, isStillActive: false };
        }
    });
    
    const results = await Promise.all(recheckPromises);
    
    const stillActiveEntertainers = [];
    
    for (const result of results) {
        if (result.isStillActive) {
            stillActiveEntertainers.push(result.entertainer);
        } else {
            stopThumbnailUpdates(result.entertainer);
        }
    }
    
    activeEntertainers = stillActiveEntertainers;
    
    displayedEntertainers = activeEntertainers.slice(0, entertainersPerPage * currentPage);
    
    console.log(`Re-check completed. Total active: ${activeEntertainers.length}`);
    
    displayEntertainers();
    updateStats();
    
    loadThumbnailsForVisibleEntertainers();
}

async function loadEntertainers() {
    const statusChecking = document.querySelector('.status-checking');
    if (statusChecking) {
        statusChecking.style.display = 'flex';
    }
    
    entertainerContainer.innerHTML = '';
    entertainerContainer.appendChild(statusChecking);
    
    activeEntertainers.forEach(entertainer => {
        if (!entertainer.hasThumbnail) {
            stopThumbnailUpdates(entertainer);
        }
    });
    
    if (!isInitialLoad) {
        activeEntertainers = [];
        displayedEntertainers = [];
        checkedEntertainers.clear();
        currentPage = 1;
        thumbnailQueue = [];
        currentThumbnailLoads = 0;
        
        entertainers.forEach(entertainer => {
            entertainer.hasThumbnail = false;
        });
    }
    
    startBatchChecking();
    isInitialLoad = false;
}

function displayEntertainers() {
    entertainerContainer.innerHTML = '';
    
    if (displayedEntertainers.length === 0) {
        entertainerContainer.appendChild(emptyStateMessage);
        emptyStateMessage.style.display = 'flex';
        return;
    } else {
        emptyStateMessage.style.display = 'none';
    }

    for (const entertainer of displayedEntertainers) {
        const entertainerCard = document.createElement('div');
        entertainerCard.className = 'entertainer-card';
        entertainerCard.setAttribute('data-entertainer-id', entertainer.id);
        
        const entertainerThumbnail = document.createElement('div');
        entertainerThumbnail.className = 'entertainer-thumbnail';
        
        const thumbnailImg = document.createElement('img');
        thumbnailImg.src = entertainer.thumbnail;
        thumbnailImg.alt = entertainer.name;
        thumbnailImg.onerror = function() {
            this.src = 'https://via.placeholder.com/300x300?text=No+Thumbnail';
        };
        
        const entertainerName = document.createElement('div');
        entertainerName.className = 'entertainer-name';
        entertainerName.textContent = entertainer.name;
        
        const liveBadge = document.createElement('div');
        liveBadge.className = 'live-badge';
        liveBadge.textContent = 'ONLINE';
        
        const favoriteBtn = document.createElement('button');
        favoriteBtn.className = 'favorite-btn';
        favoriteBtn.setAttribute('data-entertainer-id', entertainer.id);
        favoriteBtn.innerHTML = isEntertainerSaved(entertainer.id) ? '<i class="fas fa-heart"></i>' : '<i class="far fa-heart"></i>';
        if (isEntertainerSaved(entertainer.id)) {
            favoriteBtn.classList.add('active');
        }
        
        favoriteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (isEntertainerSaved(entertainer.id)) {
                removeSavedEntertainer(entertainer.id);
            } else {
                saveEntertainer(entertainer);
            }
            updateFavoriteButtons();
        });
        
        const thumbnailLoading = document.createElement('div');
        thumbnailLoading.className = 'thumbnail-loading';
        thumbnailLoading.style.display = entertainer.hasThumbnail ? 'none' : 'flex';
        thumbnailLoading.innerHTML = `
            <div class="spinner" style="width: 30px; height: 30px;"></div>
        `;
        
        entertainerThumbnail.appendChild(thumbnailImg);
        entertainerThumbnail.appendChild(entertainerName);
        entertainerThumbnail.appendChild(liveBadge);
        entertainerThumbnail.appendChild(favoriteBtn);
        entertainerThumbnail.appendChild(thumbnailLoading);
        entertainerCard.appendChild(entertainerThumbnail);
        
        entertainerCard.addEventListener('click', () => openEntertainer(entertainer));
        entertainerContainer.appendChild(entertainerCard);
    }
    
    if (activeEntertainers.length > displayedEntertainers.length) {
        const loadMoreContainer = document.createElement('div');
        loadMoreContainer.className = 'load-more-container';
        
        const loadMoreBtn = document.createElement('button');
        loadMoreBtn.className = 'load-more-btn';
        loadMoreBtn.textContent = 'More';
        loadMoreBtn.addEventListener('click', loadMoreEntertainers);
        
        loadMoreContainer.appendChild(loadMoreBtn);
        entertainerContainer.appendChild(loadMoreContainer);
    }
}

async function loadMoreEntertainers() {
    const loadMoreBtn = document.querySelector('.load-more-btn');
    if (loadMoreBtn) {
        loadMoreBtn.disabled = true;
        loadMoreBtn.textContent = 'Loading...';
    }
    
    currentPage++;
    
    const nextPageEntertainers = activeEntertainers.slice(displayedEntertainers.length, entertainersPerPage * currentPage);
    displayedEntertainers = [...displayedEntertainers, ...nextPageEntertainers];
    
    displayEntertainers();
    updateStats();
    
    loadThumbnailsForNewEntertainers();
    
    if (activeEntertainers.length > displayedEntertainers.length) {
        if (loadMoreBtn) {
            loadMoreBtn.disabled = false;
            loadMoreBtn.textContent = 'More';
        }
    } else {
        const loadMoreContainer = document.querySelector('.load-more-container');
        if (loadMoreContainer) {
            loadMoreContainer.remove();
        }
    }
}

function loadThumbnailsForVisibleEntertainers() {
    const entertainersToLoad = displayedEntertainers.filter(entertainer => !entertainer.hasThumbnail && !entertainer.isThumbnailLoading);
    
    for (const entertainer of entertainersToLoad) {
        thumbnailQueue.push(entertainer);
    }
    
    processThumbnailQueue();
}

function loadThumbnailsForNewEntertainers() {
    const startIndex = entertainersPerPage * (currentPage - 1);
    const endIndex = entertainersPerPage * currentPage;
    const newEntertainers = displayedEntertainers.slice(startIndex, endIndex);
    
    for (const entertainer of newEntertainers) {
        if (!entertainer.hasThumbnail && !entertainer.isThumbnailLoading) {
            thumbnailQueue.push(entertainer);
        }
    }
    
    processThumbnailQueue();
}

function processThumbnailQueue() {
    if (currentThumbnailLoads >= maxConcurrentThumbnails) {
        return;
    }
    
    if (thumbnailQueue.length === 0) {
        return;
    }
    
    const entertainer = thumbnailQueue.shift();
    if (entertainer && !entertainer.hasThumbnail && !entertainer.isThumbnailLoading) {
        currentThumbnailLoads++;
        entertainer.isThumbnailLoading = true;
        
        const videoElement = document.createElement('video');
        videoElement.muted = true;
        videoElement.playsInline = true;
        videoElement.style.display = 'none';
        document.body.appendChild(videoElement);
        
        if (Hls.isSupported()) {
            const hls = new Hls({
                maxMaxBufferLength: 5,
                maxBufferSize: 1000000,
                maxBufferLength: 5,
                enableWorker: false
            });
            hls.loadSource(entertainer.m3u8Url);
            hls.attachMedia(videoElement);
            hls.on(Hls.Events.MANIFEST_PARSED, () => {
                videoElement.play().catch(e => console.error('Autoplay failed:', e));
                entertainer.videoElement = videoElement;
                entertainer._hls = hls;
                startThumbnailUpdates(entertainer);
            });
        } else if (videoElement.canPlayType('application/vnd.apple.mpegurl')) {
            videoElement.src = entertainer.m3u8Url;
            videoElement.addEventListener('loadedmetadata', () => {
                videoElement.play().catch(e => console.error('Autoplay failed:', e));
                entertainer.videoElement = videoElement;
                startThumbnailUpdates(entertainer);
            });
        }
    }
    
    if (currentThumbnailLoads < maxConcurrentThumbnails) {
        setTimeout(processThumbnailQueue, 100);
    }
}

function openEntertainer(entertainer) {
    // Check if we should show ads
    if (shouldShowAds()) {
        // Show ad first
        watchAd().then(() => {
            // After ad is closed, open the entertainer
            openEntertainerAfterAd(entertainer);
        });
    } else {
        // Premium user, open directly
        openEntertainerAfterAd(entertainer);
    }
}

function openEntertainerAfterAd(entertainer) {
    modalTitle.textContent = entertainer.name;
    modalProfilePic.src = entertainer.thumbnail;
    modalProfilePic.onerror = function() {
        this.src = 'https://via.placeholder.com/300x300?text=Entertainer';
    };
    
    modalFavoriteBtn.style.display = 'flex';
    modalFavoriteBtn.classList.remove('hiding');
    
    if (isEntertainerSaved(entertainer.id)) {
        modalFavoriteBtn.style.display = 'none';
    }
    
    currentVideoEntertainer = entertainer;
    
    videoModal.classList.add('active');

    videoPlayer.style.width = '100%';
    videoPlayer.style.height = 'auto';
    videoPlayer.style.display = 'none';
    
    const loadingSpinner = document.createElement('div');
    loadingSpinner.className = 'spinner';
    
    const loadingText = document.createElement('div');
    loadingText.textContent = 'Loading ...';
    
    loadingMessage.innerHTML = '';
    loadingMessage.appendChild(loadingSpinner);
    loadingMessage.appendChild(loadingText);
    loadingMessage.style.display = 'flex';
    
    // Check if user is premium and start countdown if not
    checkPremiumStatusAndStartCountdown();
    
    if (Hls.isSupported()) {
        const hls = new Hls({
            maxMaxBufferLength: 30,
            maxBufferSize: 6000000,
            maxBufferLength: 30,
            enableWorker: true
        });
        
        hls.loadSource(entertainer.m3u8Url);
        hls.attachMedia(videoPlayer);
        
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
            loadingMessage.style.display = 'none';
            videoPlayer.style.display = 'block';
            videoPlayer.play().catch(e => {
                console.error('Autoplay failed:', e);
                loadingMessage.style.display = 'flex';
                loadingText.textContent = 'Click to play';
            });
        });
        
        const resizeObserver = new ResizeObserver(() => {
            const aspectRatio = videoPlayer.videoWidth / videoPlayer.videoHeight;
            videoPlayer.style.width = aspectRatio > 1 ? '100%' : 'auto';
            videoPlayer.style.height = aspectRatio > 1 ? 'auto' : '100%';
        });
        resizeObserver.observe(videoPlayer);
        
        hls.on(Hls.Events.ERROR, (event, data) => {
            console.error('HLS error:', data);
            if (data.fatal) {
                switch(data.type) {
                    case Hls.ErrorTypes.NETWORK_ERROR:
                        loadingText.textContent = 'Offline ...';
                        break;
                    case Hls.ErrorTypes.MEDIA_ERROR:
                        loadingText.textContent = 'Live Error';
                        hls.recoverMediaError();
                        break;
                    default:
                        loadingText.textContent = 'Error, Please try again';
                        break;
                }
            }
        });
        
        videoPlayer._hls = hls;
        videoPlayer._resizeObserver = resizeObserver;
    } else if (videoPlayer.canPlayType('application/vnd.apple.mpegurl')) {
        videoPlayer.src = entertainer.m3u8Url;
        videoPlayer.addEventListener('loadedmetadata', () => {
            loadingMessage.style.display = 'none';
            videoPlayer.style.display = 'block';
            videoPlayer.play().catch(e => {
                console.error('Autoplay failed:', e);
                loadingMessage.style.display = 'flex';
                loadingText.textContent = 'Click to play';
            });
        });
        
        videoPlayer.addEventListener('error', () => {
            loadingText.textContent = 'Error, Please try again';
        });
    } else {
        loadingText.textContent = 'Please try another browser';
    }
}

function checkPremiumStatusAndStartCountdown() {
    // Clear any existing countdown
    if (videoCountdownInterval) {
        clearInterval(videoCountdownInterval);
        videoCountdownInterval = null;
    }
    
    // Check if user has premium status
    if (currentUser) {
        // Check if subscription is active
        const [day, month, year] = currentUser.expiryDate.split(':').map(Number);
        const [hour, minute] = currentUser.expiryTime.split(':').map(Number);
        const expiryDate = new Date(year, month - 1, day, hour, minute);
        const now = new Date();
        
        if (expiryDate > now) {
            // User has active premium subscription
            videoCountdown.style.display = 'none';
            return;
        }
    }
    
    // User doesn't have premium or subscription expired
    // Show countdown and start timer
    videoCountdown.style.display = 'flex';
    let countdownTime = 30;
    videoCountdownTimer.textContent = countdownTime;
    
    videoCountdownInterval = setInterval(() => {
        countdownTime--;
        videoCountdownTimer.textContent = countdownTime;
        
        if (countdownTime <= 0) {
            closeVideoModal();
            // Show warning popup after closing video modal
            openWarningPopup();
        }
    }, 1000);
}

function closeVideoModal() {
    videoModal.classList.remove('active');
    
    // Clear video countdown
    if (videoCountdownInterval) {
        clearInterval(videoCountdownInterval);
        videoCountdownInterval = null;
    }
    videoCountdown.style.display = 'none';
    
    if (videoPlayer._hls) {
        videoPlayer._hls.destroy();
        delete videoPlayer._hls;
    }
    
    if (videoPlayer._resizeObserver) {
        videoPlayer._resizeObserver.disconnect();
        delete videoPlayer._resizeObserver;
    }
    
    videoPlayer.pause();
    videoPlayer.removeAttribute('src');
    videoPlayer.load();
    
    currentVideoEntertainer = null;
}

function displayProfile() {
    combinedModalBody.innerHTML = '';
    
    const profileContainer = document.createElement('div');
    profileContainer.className = 'profile-container';
    
    if (currentUser) {
        // Create premium user card
        const premiumUserCard = document.createElement('div');
        premiumUserCard.className = 'premium-user-card';
        
        // Crown icon
        const crownIcon = document.createElement('div');
        crownIcon.className = 'premium-crown';
        crownIcon.innerHTML = '<i class="fa-solid fa-crown"></i>';
        
        // User name
        const userName = document.createElement('div');
        userName.className = 'premium-user-name';
        userName.textContent = currentUser.name;
        
        // User phone
        const userPhone = document.createElement('div');
        userPhone.className = 'premium-user-phone';
        userPhone.textContent = currentUser.phone;
        
        // Expiry date - Updated format DD-MM-YYYY | HH:MM AM/PM
        const expiryInfo = document.createElement('div');
        expiryInfo.className = 'premium-expiry';
        
        const expiryLabel = document.createElement('div');
        expiryLabel.className = 'premium-expiry-label';
        expiryLabel.textContent = 'Subscription Expires';
        
        // Format the date as DD-MM-YYYY | HH:MM AM/PM
        const expiryValue = document.createElement('div');
        expiryValue.className = 'premium-expiry-value';
        // Convert from DD:MM:YYYY to DD-MM-YYYY
        const [day, month, year] = currentUser.expiryDate.split(':');
        // Convert time to AM/PM format
        const timeString = convertToAMPM(currentUser.expiryTime);
        const formattedDate = `${day}-${month}-${year} | ${timeString}`;
        expiryValue.textContent = formattedDate;
        
        expiryInfo.appendChild(expiryLabel);
        expiryInfo.appendChild(expiryValue);
        
        premiumUserCard.appendChild(crownIcon);
        premiumUserCard.appendChild(userName);
        premiumUserCard.appendChild(userPhone);
        premiumUserCard.appendChild(expiryInfo);
        
        // Calculate expiry datetime
        const expiryDate = new Date(year, month - 1, day, ...currentUser.expiryTime.split(':').map(Number));
        const now = new Date();
        
        // Check if subscription has expired
        if (expiryDate > now) {
            // Create countdown container
            const countdownContainer = document.createElement('div');
            countdownContainer.className = 'countdown-container';
            
            const countdownTitle = document.createElement('div');
            countdownTitle.className = 'countdown-title';
            countdownTitle.textContent = 'Subscription Expires In';
            
            const countdownTimer = document.createElement('div');
            countdownTimer.className = 'countdown-timer';
            countdownTimer.id = 'countdownTimer';
            
            // Initialize countdown
            updateCountdown(expiryDate, countdownTimer);
            
            // Update countdown every second
            countdownInterval = setInterval(() => {
                updateCountdown(expiryDate, countdownTimer);
            }, 1000);
            
            countdownContainer.appendChild(countdownTitle);
            countdownContainer.appendChild(countdownTimer);
            premiumUserCard.appendChild(countdownContainer);
        } else {
            // Show expired message and contact us button
            const expiredMessage = document.createElement('div');
            expiredMessage.className = 'expired-message';
            expiredMessage.textContent = 'Subscription Expired';
            premiumUserCard.appendChild(expiredMessage);
            
            const contactUsBtn = document.createElement('a');
            contactUsBtn.href = 'https://test.com/contactus';
            contactUsBtn.className = 'contact-us-btn';
            contactUsBtn.textContent = 'Contact Us';
            contactUsBtn.target = '_blank';
            premiumUserCard.appendChild(contactUsBtn);
        }
        
        profileContainer.appendChild(premiumUserCard);
    } else {
        // Show login form if not logged in
        const profileTitle = document.createElement('div');
        profileTitle.className = 'profile-title';
        profileTitle.textContent = 'Premium Login';
        
        const phoneInputContainer = document.createElement('div');
        phoneInputContainer.className = 'phone-input-container';
        
        const phoneInput = document.createElement('input');
        phoneInput.type = 'tel';
        phoneInput.className = 'phone-input';
        phoneInput.placeholder = 'Enter 11-digit phone number';
        phoneInput.maxLength = 11;
        
        const phoneWarning = document.createElement('div');
        phoneWarning.className = 'phone-warning';
        
        const checkPremiumBtn = document.createElement('button');
        checkPremiumBtn.className = 'check-premium-btn';
        checkPremiumBtn.textContent = 'Check Premium';
        checkPremiumBtn.disabled = true;
        
        // Phone number validation
        phoneInput.addEventListener('input', function() {
            const phoneNumber = this.value.trim();
            
            // Check if phone number is exactly 11 digits and contains only numbers
            const phoneRegex = /^01[3-9]\d{8}$/; // Bangladeshi phone number format
            if (phoneRegex.test(phoneNumber)) {
                this.classList.remove('error');
                phoneWarning.textContent = '';
                checkPremiumBtn.disabled = false;
            } else {
                this.classList.add('error');
                if (phoneNumber.length > 0) {
                    phoneWarning.textContent = 'Please enter a valid 11-digit Bangladeshi phone number (e.g., 01712345678)';
                } else {
                    phoneWarning.textContent = '';
                }
                checkPremiumBtn.disabled = true;
            }
        });
        
        checkPremiumBtn.addEventListener('click', function() {
            const phoneNumber = phoneInput.value.trim();
            
            // Check if phone number matches any premium user
            const matchedUser = premiumUsers.find(user => user.phone === phoneNumber);
            if (matchedUser) {
                // Successful login
                currentUser = { ...matchedUser };
                updateWebsiteTitle();
                
                // Show login success alert
                showLoginSuccessAlert();
                
                displayProfile(); // Refresh the profile view
            } else {
                // Show warning popup for incorrect phone number
                openWarningPopup();
            }
        });
        
        phoneInputContainer.appendChild(phoneInput);
        phoneInputContainer.appendChild(phoneWarning);
        
        profileContainer.appendChild(profileTitle);
        profileContainer.appendChild(phoneInputContainer);
        profileContainer.appendChild(checkPremiumBtn);
    }
    
    combinedModalBody.appendChild(profileContainer);
}

// Helper function to convert time to AM/PM format
function convertToAMPM(timeString) {
    let [hours, minutes] = timeString.split(':');
    hours = parseInt(hours);
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    return `${hours}:${minutes} ${ampm}`;
}

function showLoginSuccessAlert() {
    loginSuccessAlert.classList.add('active');
    
    // Auto close after 3 seconds
    setTimeout(() => {
        loginSuccessAlert.classList.remove('active');
    }, 3000);
}

function updateCountdown(expiryDate, countdownElement) {
    const now = new Date();
    const timeRemaining = expiryDate - now;
    
    if (timeRemaining <= 0) {
        countdownElement.innerHTML = '<div class="expired-message">Subscription Expired</div>';
        if (countdownInterval) {
            clearInterval(countdownInterval);
        }
        return;
    }
    
    // Calculate days, hours, minutes, seconds
    const days = Math.floor(timeRemaining / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeRemaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((timeRemaining % (1000 * 60)) / 1000);
    
    countdownElement.innerHTML = `
        <div class="countdown-unit">
            <div class="countdown-value">${days}</div>
            <div class="countdown-label">Days</div>
        </div>
        <div class="countdown-unit">
            <div class="countdown-value">${hours}</div>
            <div class="countdown-label">Hours</div>
        </div>
        <div class="countdown-unit">
            <div class="countdown-value">${minutes}</div>
            <div class="countdown-label">Minutes</div>
        </div>
        <div class="countdown-unit">
            <div class="countdown-value">${seconds}</div>
            <div class="countdown-label">Seconds</div>
        </div>
    `;
}

function openWarningPopup() {
    warningPopup.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeWarningPopupFunc() {
    warningPopup.classList.remove('active');
    document.body.style.overflow = 'auto';
}

// Event Listeners
closeModal.addEventListener('click', closeVideoModal);
videoModal.addEventListener('click', (e) => {
    if (e.target === videoModal) {
        closeVideoModal();
    }
});

modalFavoriteBtn.addEventListener('click', handleModalFavoriteClick);

savedEntertainersIcon.addEventListener('click', () => openCombinedModal('favorites'));
tvIcon.addEventListener('click', () => openCombinedModal('tv'));
userIcon.addEventListener('click', () => openCombinedModal('profile'));
packageIcon.addEventListener('click', () => openCombinedModal('pricing')); // New package icon event listener
closeCombinedModal.addEventListener('click', closeCombinedModalFunc);
combinedModal.addEventListener('click', (e) => {
    if (e.target === combinedModal) {
        closeCombinedModalFunc();
    }
});

closeWarningPopup.addEventListener('click', closeWarningPopupFunc);
warningPopup.addEventListener('click', (e) => {
    if (e.target === warningPopup) {
        closeWarningPopupFunc();
    }
});

menuIcon.addEventListener('click', toggleCountryMenu);

// Add event listeners to country buttons
countryButtons.forEach(button => {
    button.addEventListener('click', () => {
        const country = button.getAttribute('data-country');
        openCombinedModal('country', country);
        toggleCountryMenu(); // Close the country menu after selection
    });
});

document.addEventListener('backbutton', closeVideoModal, false);

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        if (videoModal.classList.contains('active')) {
            closeVideoModal();
        } else if (combinedModal.classList.contains('active')) {
            closeCombinedModalFunc();
        } else if (warningPopup.classList.contains('active')) {
            closeWarningPopupFunc();
        } else if (isCountryMenuOpen) {
            toggleCountryMenu();
        }
    }
});

document.addEventListener('DOMContentLoaded', () => {
    updateWebsiteTitle();
    
    const hlsScript = document.createElement('script');
    hlsScript.src = 'https://cdn.jsdelivr.net/npm/hls.js@latest';
    hlsScript.onload = () => {
        loadEntertainers();
    };
    hlsScript.onerror = () => {
        loadEntertainers();
    };
    document.head.appendChild(hlsScript);

    window.addEventListener('popstate', handleBrowserBackButton);
});

window.addEventListener('beforeunload', () => {
    activeEntertainers.forEach(entertainer => {
        stopThumbnailUpdates(entertainer);
        if (entertainer._hls) {
            entertainer._hls.destroy();
        }
    });
    
    if (videoPlayer._hls) {
        videoPlayer._hls.destroy();
    }
    
    if (videoPlayer._resizeObserver) {
        videoPlayer._resizeObserver.disconnect();
    }
    
    if (batchIntervalId) {
        clearInterval(batchIntervalId);
    }
    
    if (autoRecheckIntervalId) {
        clearInterval(autoRecheckIntervalId);
    }
    
    if (countdownInterval) {
        clearInterval(countdownInterval);
    }
    
    if (videoCountdownInterval) {
        clearInterval(videoCountdownInterval);
    }
});
