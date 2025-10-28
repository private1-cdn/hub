// Configuration variables
const batchSize = 200;
const batchInterval = 5000;
const channelsPerPage = 20;
const maxConcurrentThumbnails = 2;
const autoRecheckInterval = 60000;

// Package data for package modal
const packages = [
    {
        name: "Basic Package",
        price: "$9.99/month",
        features: [
            { included: true, text: "Access to all channels" },
            { included: true, text: "HD Quality Streaming" },
            { included: true, text: "No Ads" },
            { included: false, text: "TV Channels Access" },
            { included: false, text: "Tools Access" }
        ],
        contactUrl: "https://wa.me/1234567890?text=Hi,%20I'm%20interested%20in%20Basic%20Package"
    },
    {
        name: "Premium Package",
        price: "$19.99/month",
        features: [
            { included: true, text: "Access to all channels" },
            { included: true, text: "HD Quality Streaming" },
            { included: true, text: "No Ads" },
            { included: true, text: "TV Channels Access" },
            { included: true, text: "Tools Access" }
        ],
        contactUrl: "https://wa.me/1234567890?text=Hi,%20I'm%20interested%20in%20Premium%20Package"
    },
    {
        name: "Family Package",
        price: "$29.99/month",
        features: [
            { included: true, text: "Access to all channels" },
            { included: true, text: "HD Quality Streaming" },
            { included: true, text: "No Ads" },
            { included: true, text: "TV Channels Access" },
            { included: true, text: "Tools Access" },
            { included: true, text: "Up to 5 Devices" }
        ],
        contactUrl: "https://wa.me/1234567890?text=Hi,%20I'm%20interested%20in%20Family%20Package"
    }
];

// Utility functions
function validatePhoneNumber(phone) {
    const phoneRegex = /^01[0-9]{9}$/;
    return phoneRegex.test(phone);
}

function formatDate(dateString) {
    const date = new Date(dateString);
    const options = { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    };
    return date.toLocaleString('en-GB', options).replace(',', ' /');
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// Check if user is premium
function isPremiumUser(phone) {
    return premiumUsers.hasOwnProperty(phone);
}

// Check if premium user's package has expired
function isPremiumExpired(phone) {
    if (!isPremiumUser(phone)) return false;
    
    const userPackageInfo = premiumUsers[phone];
    const expiryDate = new Date(userPackageInfo.expiryDate);
    const currentDate = new Date();
    
    return currentDate > expiryDate;
}

// Get user package expiry info
function getUserPackageInfo(phone) {
    if (isPremiumUser(phone)) {
        return premiumUsers[phone];
    }
    return null;
}

// Check if user has TV channel access
function hasTvChannelAccess(phone) {
    if (!isPremiumUser(phone) || isPremiumExpired(phone)) return false;
    
    const userPackageInfo = premiumUsers[phone];
    return userPackageInfo.tvChannel === "yes";
}

// Check if user has tools access
function hasToolsAccess(phone) {
    if (!isPremiumUser(phone) || isPremiumExpired(phone)) return false;
    
    const userPackageInfo = premiumUsers[phone];
    return userPackageInfo.openTools === "yes";
}

// Main application logic
// User verification state
let isVerifiedUser = false;
let userPhoneNumber = '';
let videoStopTimer = null;
let countdownInterval = null;
let isExpiredPremium = false;

// DOM Elements
const loginModal = document.getElementById('loginModal');
const phoneNumberInput = document.getElementById('phoneNumber');
const phoneWarning = document.getElementById('phoneWarning');
const watchBtn = document.getElementById('watchBtn');
const premiumModal = document.getElementById('premiumModal');
const closePremiumModal = document.getElementById('closePremiumModal');
const restrictedModal = document.getElementById('restrictedModal');
const userModal = document.getElementById('userModal');
const closeUserModalHeader = document.getElementById('closeUserModalHeader');
const userIcon = document.getElementById('userIcon');
const headerTitle = document.getElementById('headerTitle');
const headerIcon = document.getElementById('headerIcon');
const totalActiveChannelsEl = document.getElementById('totalActiveChannels');

const channelContainer = document.getElementById('channelContainer');
const videoModal = document.getElementById('videoModal');
const closeModal = document.getElementById('closeModal');
const videoPlayer = document.getElementById('videoPlayer');
const modalTitle = document.getElementById('modalTitle');
const modalProfilePic = document.getElementById('modalProfilePic');
const modalFavoriteBtn = document.getElementById('modalFavoriteBtn');
const loadingMessage = document.getElementById('loadingMessage');
const thumbnailCanvas = document.getElementById('thumbnailCanvas');
const thumbnailCtx = thumbnailCanvas.getContext('2d');
const savedChannelsIcon = document.getElementById('savedChannelsIcon');
const savedChannelsModal = document.getElementById('savedChannelsModal');
const closeSavedChannelsModal = document.getElementById('closeSavedChannelsModal');
const savedChannelsModalBody = document.getElementById('savedChannelsModalBody');
const noSavedChannelsMessage = document.getElementById('noSavedChannelsMessage');
const checkingSavedChannelsStatus = document.getElementById('checkingSavedChannelsStatus');
const emptyStateMessage = document.getElementById('emptyStateMessage');

// New TV channels elements
const tvIcon = document.getElementById('tvIcon');
const tvChannelsModal = document.getElementById('tvChannelsModal');
const closeTvChannelsModal = document.getElementById('closeTvChannelsModal');
const tvChannelsModalBody = document.getElementById('tvChannelsModalBody');

// New Tools elements
const toolsIcon = document.getElementById('toolsIcon');
const toolsModal = document.getElementById('toolsModal');
const closeToolsModal = document.getElementById('closeToolsModal');
const toolsModalBody = document.getElementById('toolsModalBody');

// New Package elements
const packageIcon = document.getElementById('packageIcon');
const packageModal = document.getElementById('packageModal');
const closePackageModal = document.getElementById('closePackageModal');
const packageModalBody = document.getElementById('packageModalBody');

let activeChannels = [];
let displayedChannels = [];
let checkedChannels = new Set();
let isInitialLoad = true;
let batchIntervalId = null;
let currentPage = 1;
let thumbnailQueue = [];
let currentThumbnailLoads = 0;
let autoRecheckIntervalId = null;
let isFirstLoad = true;
let savedChannels = JSON.parse(localStorage.getItem('privateLiveSavedChannels')) || [];
let currentVideoChannel = null;

// Countdown timer function
function startCountdown(expiryDate) {
    const countdownElement = document.querySelector('.premium-countdown');
    if (!countdownElement) return;
    
    function updateCountdown() {
        const now = new Date().getTime();
        const expiry = new Date(expiryDate).getTime();
        const timeLeft = expiry - now;
        
        if (timeLeft <= 0) {
            countdownElement.innerHTML = '<div class="countdown-title">Package Expired!</div>';
            clearInterval(countdownInterval);
            return;
        }
        
        const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
        const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);
        
        countdownElement.innerHTML = `
            <div class="countdown-title">Package Expires In:</div>
            <div class="countdown-timer">
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
            </div>
        `;
    }
    
    updateCountdown();
    countdownInterval = setInterval(updateCountdown, 1000);
    return countdownInterval;
}

// Update header based on user type
function updateHeader() {
    if (isVerifiedUser && !isExpiredPremium) {
        headerTitle.textContent = "PremiumHub";
        headerTitle.className = "header-premium";
        headerIcon.innerHTML = '<i class="fas fa-crown" style="color: gold;"></i>';
        headerIcon.className = "header-icon header-premium";
    } else if (isExpiredPremium) {
        headerTitle.textContent = "PremiumHub";
        headerTitle.className = "header-premium";
        headerIcon.innerHTML = '<i class="fas fa-crown" style="color: gold;"></i>';
        headerIcon.className = "header-icon header-premium";
    } else {
        headerTitle.textContent = "LocalHub";
        headerTitle.className = "header-local";
        headerIcon.innerHTML = '<i class="fas fa-face-frown-open" style="color: #e50914;"></i>';
        headerIcon.className = "header-icon header-local";
    }
}

// Update user profile modal
function updateUserProfileModal() {
    const userModalBody = document.querySelector('.user-modal-content .user-modal-body');
    const userPackageInfo = getUserPackageInfo(userPhoneNumber);
    
    let modalContent = '';
    
    if (isVerifiedUser && userPackageInfo && !isExpiredPremium) {
        modalContent = `
            <div class="user-icon-large user-icon-premium">
                <i class="fas fa-crown" style="color: gold;"></i>
            </div>
            <div class="user-name">${userPackageInfo.name}</div>
            <div class="user-phone">${userPhoneNumber}</div>
            <div class="user-expiry">Expiry: ${formatDate(userPackageInfo.expiryDate)}</div>
            <div class="user-features">TV Channel: ${userPackageInfo.tvChannel}</div>
            <div class="user-features">Open Tools: ${userPackageInfo.openTools}</div>
            <div class="premium-countdown"></div>
        `;
    } else if (isExpiredPremium) {
        modalContent = `
            <div class="user-icon-large user-icon-expired">
                <i class="fas fa-smile" style="color: #FFD700;"></i>
            </div>
            <div class="user-name">${userPackageInfo.name}</div>
            <div class="user-phone">${userPhoneNumber}</div>
            <div class="user-expiry">Expiry: ${formatDate(userPackageInfo.expiryDate)}</div>
            <div class="user-features">TV Channel: ${userPackageInfo.tvChannel}</div>
            <div class="user-features">Open Tools: ${userPackageInfo.openTools}</div>
            <div class="expired-message">
                আপনার প্যাকেজের মেয়াদ শেষ
            </div>
            <a href="https://buypremium.com" target="_blank" class="local-premium-btn">Buy Premium</a>
        `;
    } else {
        modalContent = `
            <div class="user-icon-large user-icon-local">
                <i class="fas fa-face-frown-open" style="color: #e50914;"></i>
            </div>
            <div class="user-name">Guest User</div>
            <div class="user-phone">${userPhoneNumber}</div>
            <div class="local-message">
                আপনার অ্যাক্সেস সীমিত। সম্পূর্ণ অ্যাক্সেস পেতে প্রিমিয়াম প্যাকেজ কিনুন।
            </div>
            <a href="https://buypremium.com" target="_blank" class="local-premium-btn">Buy Premium</a>
        `;
    }
    
    userModalBody.innerHTML = modalContent;
    
    // Start countdown if premium user and not expired
    if (isVerifiedUser && userPackageInfo && !isExpiredPremium) {
        if (countdownInterval) {
            clearInterval(countdownInterval);
        }
        countdownInterval = startCountdown(userPackageInfo.expiryDate);
    }
}

// Login function
function handleLogin() {
    const phoneNumber = phoneNumberInput.value.trim();
    
    // Hide previous warnings
    phoneWarning.style.display = 'none';
    
    if (!validatePhoneNumber(phoneNumber)) {
        // Show warning message below input field
        phoneWarning.style.display = 'block';
        return;
    }
    
    // Check if user is premium and if package has expired
    userPhoneNumber = phoneNumber;
    isVerifiedUser = isPremiumUser(phoneNumber);
    isExpiredPremium = isPremiumExpired(phoneNumber);
    
    // Update header and profile
    updateHeader();
    updateUserProfileModal();
    
    // Hide login modal and show main content
    loginModal.style.display = 'none';
    document.querySelector('.header').style.display = 'flex';
    document.querySelector('.container').style.display = 'flex';
    document.querySelector('.saved-channels-section').style.display = 'flex';
    
    // Load channels
    loadChannels();
}

// Show user profile modal
function showUserProfile() {
    updateUserProfileModal();
    userModal.style.display = 'flex';
}

// Close user profile modal
function closeUserProfile() {
    userModal.style.display = 'none';
}

// Show premium warning modal
function showPremiumWarning() {
    premiumModal.style.display = 'flex';
}

// Close premium warning modal
function closePremiumWarning() {
    premiumModal.style.display = 'none';
}

// Show restricted modal
function showRestrictedModal() {
    restrictedModal.style.display = 'flex';
}

// Close restricted modal
function closeRestrictedModal() {
    restrictedModal.style.display = 'none';
}

// Show package modal
function showPackageModal() {
    packageModal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    
    // Generate package cards
    packageModalBody.innerHTML = '';
    packages.forEach(pkg => {
        const packageCard = document.createElement('div');
        packageCard.className = 'package-card';
        
        const featuresHtml = pkg.features.map(feature => `
            <div class="package-feature">
                <i class="fas ${feature.included ? 'fa-check' : 'fa-times'}"></i>
                <span>${feature.text}</span>
            </div>
        `).join('');
        
        packageCard.innerHTML = `
            <div class="package-header">
                <div class="package-name">${pkg.name}</div>
                <div class="package-price">${pkg.price}</div>
            </div>
            <div class="package-features">
                ${featuresHtml}
            </div>
            <div class="package-footer">
                <a href="${pkg.contactUrl}" target="_blank" class="package-contact-btn">Contact Us</a>
            </div>
        `;
        
        packageModalBody.appendChild(packageCard);
    });
    
    history.pushState({packageModalOpen: true}, null, window.location.href);
}

// Close package modal
function closePackageModalFunc() {
    packageModal.style.display = 'none';
    document.body.style.overflow = 'auto';
    
    if (history.state && history.state.packageModalOpen) {
        history.back();
    }
}

// Handle video playback for non-verified users and expired premium users
function handleNonVerifiedVideoPlayback() {
    if (!isVerifiedUser || isExpiredPremium) {
        // Set timer to stop video after 10 seconds
        videoStopTimer = setTimeout(() => {
            closeVideoModal();
            showPremiumWarning();
        }, 10000);
    }
}

function handleBrowserBackButton() {
    if (videoModal.style.display === 'flex') {
        closeVideoModal();
        history.pushState(null, null, window.location.href);
    }
}

function updateStats() {
    totalActiveChannelsEl.textContent = `Active: ${activeChannels.length}`;
}

function saveChannel(channel) {
    if (!savedChannels.some(c => c.id === channel.id)) {
        savedChannels.push(channel);
        localStorage.setItem('privateLiveSavedChannels', JSON.stringify(savedChannels));
        updateFavoriteButtons();
        return true;
    }
    return false;
}

function removeSavedChannel(channelId) {
    savedChannels = savedChannels.filter(c => c.id !== channelId);
    localStorage.setItem('privateLiveSavedChannels', JSON.stringify(savedChannels));
    updateFavoriteButtons();
    
    const channelCard = document.querySelector(`.saved-channel-card[data-channel-id="${channelId}"]`);
    if (channelCard) {
        channelCard.remove();
    }
    
    if (savedChannels.length === 0) {
        showNoSavedChannelsMessage();
    }
}

function showNoSavedChannelsMessage() {
    savedChannelsModalBody.innerHTML = '';
    savedChannelsModalBody.appendChild(noSavedChannelsMessage);
    noSavedChannelsMessage.style.display = 'block';
}

function isChannelSaved(channelId) {
    return savedChannels.some(c => c.id === channelId);
}

function updateFavoriteButtons() {
    document.querySelectorAll('.favorite-btn').forEach(btn => {
        const channelId = parseInt(btn.getAttribute('data-channel-id'));
        if (isChannelSaved(channelId)) {
            btn.classList.add('active');
            btn.innerHTML = '<i class="fas fa-heart"></i>';
        } else {
            btn.classList.remove('active');
            btn.innerHTML = '<i class="far fa-heart"></i>';
        }
    });
}

function handleModalFavoriteClick() {
    if (currentVideoChannel) {
        saveChannel(currentVideoChannel);
        modalFavoriteBtn.classList.add('hiding');
        setTimeout(() => {
            modalFavoriteBtn.style.display = 'none';
        }, 500);
    }
}

// Display TV Channels
function displayTvChannels() {
    tvChannelsModalBody.innerHTML = '';
    
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
            this.src = 'https://via.placeholder.com/640x360/333333/FFFFFF?text=No+Thumbnail';
        };
        
        const tvChannelName = document.createElement('div');
        tvChannelName.className = 'tv-channel-name';
        tvChannelName.textContent = channel.name;
        
        tvChannelThumbnail.appendChild(thumbnailImg);
        tvChannelCard.appendChild(tvChannelThumbnail);
        tvChannelCard.appendChild(tvChannelName);
        
        tvChannelCard.addEventListener('click', () => {
            openTvChannel(channel);
        });
        
        tvChannelsGrid.appendChild(tvChannelCard);
    });
    
    tvChannelsModalBody.appendChild(tvChannelsGrid);
}

// Open TV Channel
function openTvChannel(channel) {
    modalTitle.textContent = channel.name;
    modalProfilePic.src = channel.thumbnail;
    modalProfilePic.onerror = function() {
        this.src = 'https://via.placeholder.com/300x300?text=Channel';
    };
    
    modalFavoriteBtn.style.display = 'none';
    
    currentVideoChannel = channel;
    
    videoModal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    
    history.pushState({modalOpen: true}, null, window.location.href);

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
            
            // Handle non-verified user video playback
            handleNonVerifiedVideoPlayback();
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
            
            // Handle non-verified user video playback
            handleNonVerifiedVideoPlayback();
        });
        
        videoPlayer.addEventListener('error', () => {
            loadingText.textContent = 'Error, Please try again';
        });
    } else {
        loadingText.textContent = 'Please try another browser';
    }
}

// Open TV Channels Modal
function openTvChannelsModal() {
    // Check if user has TV channel access
    if (!isVerifiedUser || isExpiredPremium) {
        showPremiumWarning();
        return;
    }
    
    if (!hasTvChannelAccess(userPhoneNumber)) {
        showRestrictedModal();
        return;
    }
    
    tvChannelsModal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    displayTvChannels();
    
    history.pushState({tvModalOpen: true}, null, window.location.href);
}

// Close TV Channels Modal
function closeTvChannelsModalFunc() {
    tvChannelsModal.style.display = 'none';
    document.body.style.overflow = 'auto';
    
    if (history.state && history.state.tvModalOpen) {
        history.back();
    }
}

// Event listeners for TV Channels
tvIcon.addEventListener('click', openTvChannelsModal);
closeTvChannelsModal.addEventListener('click', closeTvChannelsModalFunc);
tvChannelsModal.addEventListener('click', (e) => {
    if (e.target === tvChannelsModal) {
        closeTvChannelsModalFunc();
    }
});

// Display Tools
function displayTools() {
    toolsModalBody.innerHTML = '';
    
    const toolsGrid = document.createElement('div');
    toolsGrid.className = 'tools-grid';
    
    tools.forEach(tool => {
        const toolCard = document.createElement('a');
        toolCard.className = 'tool-card';
        toolCard.href = tool.url;
        toolCard.target = '_blank';
        
        const toolIcon = document.createElement('div');
        toolIcon.className = 'tool-icon';
        toolIcon.innerHTML = `<i class="${tool.icon}"></i>`;
        
        const toolName = document.createElement('div');
        toolName.className = 'tool-name';
        toolName.textContent = tool.name;
        
        toolCard.appendChild(toolIcon);
        toolCard.appendChild(toolName);
        
        toolsGrid.appendChild(toolCard);
    });
    
    toolsModalBody.appendChild(toolsGrid);
}

// Open Tools Modal
function openToolsModal() {
    // Check if user has tools access
    if (!isVerifiedUser || isExpiredPremium) {
        showPremiumWarning();
        return;
    }
    
    if (!hasToolsAccess(userPhoneNumber)) {
        showRestrictedModal();
        return;
    }
    
    toolsModal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    displayTools();
    
    history.pushState({toolsModalOpen: true}, null, window.location.href);
}

// Close Tools Modal
function closeToolsModalFunc() {
    toolsModal.style.display = 'none';
    document.body.style.overflow = 'auto';
    
    if (history.state && history.state.toolsModalOpen) {
        history.back();
    }
}

// Event listeners for Tools
toolsIcon.addEventListener('click', openToolsModal);
closeToolsModal.addEventListener('click', closeToolsModalFunc);
toolsModal.addEventListener('click', (e) => {
    if (e.target === toolsModal) {
        closeToolsModalFunc();
    }
});

async function displaySavedChannels() {
    savedChannelsModalBody.innerHTML = '';
    
    if (savedChannels.length === 0) {
        showNoSavedChannelsMessage();
        return;
    }
    
    // Show checking status
    savedChannelsModalBody.appendChild(checkingSavedChannelsStatus);
    checkingSavedChannelsStatus.style.display = 'flex';
    noSavedChannelsMessage.style.display = 'none';
    
    const onlineChannels = [];
    const offlineChannels = [];
    
    const checkPromises = savedChannels.map(channel => checkStreamFast(channel));
    const results = await Promise.allSettled(checkPromises);
    
    for (let i = 0; i < savedChannels.length; i++) {
        const channel = savedChannels[i];
        const result = results[i];
        
        if (result.status === 'fulfilled' && result.value) {
            onlineChannels.push(channel);
        } else {
            offlineChannels.push(channel);
        }
    }
    
    checkingSavedChannelsStatus.style.display = 'none';
    
    const savedChannelsGrid = document.createElement('div');
    savedChannelsGrid.className = 'saved-channels-grid';
    
    onlineChannels.forEach(channel => {
        const savedChannelCard = document.createElement('div');
        savedChannelCard.className = 'saved-channel-card';
        savedChannelCard.setAttribute('data-channel-id', channel.id);
        
        const savedChannelThumbnail = document.createElement('div');
        savedChannelThumbnail.className = 'saved-channel-thumbnail';
        
        const thumbnailImg = document.createElement('img');
        thumbnailImg.src = channel.thumbnail;
        thumbnailImg.alt = channel.name;
        thumbnailImg.onerror = function() {
            this.src = 'https://via.placeholder.com/300x300?text=No+Thumbnail';
        };
        
        const savedChannelName = document.createElement('div');
        savedChannelName.className = 'saved-channel-name';
        savedChannelName.textContent = channel.name;
        
        const savedChannelLiveBadge = document.createElement('div');
        savedChannelLiveBadge.className = 'saved-channel-live-badge';
        savedChannelLiveBadge.textContent = 'ONLINE';
        
        const savedChannelRemoveBtn = document.createElement('button');
        savedChannelRemoveBtn.className = 'saved-channel-remove-btn';
        savedChannelRemoveBtn.innerHTML = '<i class="fas fa-times"></i>';
        savedChannelRemoveBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            removeSavedChannel(channel.id);
        });
        
        savedChannelThumbnail.appendChild(thumbnailImg);
        savedChannelThumbnail.appendChild(savedChannelName);
        savedChannelThumbnail.appendChild(savedChannelLiveBadge);
        savedChannelThumbnail.appendChild(savedChannelRemoveBtn);
        savedChannelCard.appendChild(savedChannelThumbnail);
        
        savedChannelCard.addEventListener('click', () => {
            openChannelFromSaved(channel);
        });
        
        savedChannelsGrid.appendChild(savedChannelCard);
    });
    
    offlineChannels.forEach(channel => {
        const savedChannelCard = document.createElement('div');
        savedChannelCard.className = 'saved-channel-card offline-channel';
        savedChannelCard.setAttribute('data-channel-id', channel.id);
        
        const savedChannelThumbnail = document.createElement('div');
        savedChannelThumbnail.className = 'saved-channel-thumbnail';
        
        const thumbnailImg = document.createElement('img');
        thumbnailImg.src = channel.thumbnail;
        thumbnailImg.alt = channel.name;
        thumbnailImg.style.filter = 'grayscale(100%) brightness(0.5)';
        thumbnailImg.onerror = function() {
            this.src = 'https://via.placeholder.com/300x300?text=No+Thumbnail';
        };
        
        const savedChannelName = document.createElement('div');
        savedChannelName.className = 'saved-channel-name';
        savedChannelName.textContent = channel.name;
        
        const offlineOverlay = document.createElement('div');
        offlineOverlay.className = 'offline-overlay';
        
        const offlineText = document.createElement('div');
        offlineText.className = 'offline-text';
        offlineText.textContent = 'Offline';
        
        const savedChannelRemoveBtn = document.createElement('button');
        savedChannelRemoveBtn.className = 'saved-channel-remove-btn';
        savedChannelRemoveBtn.innerHTML = '<i class="fas fa-times"></i>';
        savedChannelRemoveBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            removeSavedChannel(channel.id);
        });
        
        offlineOverlay.appendChild(offlineText);
        savedChannelThumbnail.appendChild(thumbnailImg);
        savedChannelThumbnail.appendChild(savedChannelName);
        savedChannelThumbnail.appendChild(offlineOverlay);
        savedChannelThumbnail.appendChild(savedChannelRemoveBtn);
        savedChannelCard.appendChild(savedChannelThumbnail);
        
        savedChannelCard.style.cursor = 'not-allowed';
        
        savedChannelsGrid.appendChild(savedChannelCard);
    });
    
    savedChannelsModalBody.appendChild(savedChannelsGrid);
}

async function checkStreamFast(channel) {
    return new Promise((resolve) => {
        if (!Hls.isSupported()) {
            const video = document.createElement('video');
            video.src = channel.m3u8Url;
            video.addEventListener('error', () => resolve(false));
            video.addEventListener('loadedmetadata', () => {
                resolve(true);
                video.remove();
            });
            return;
        }
        
        const hls = new Hls({
            maxMaxBufferLength: 5,
            maxBufferSize: 1000000,
            maxBufferLength: 5,
            lowLatencyMode: false,
            enableWorker: false
        });
        
        let timeout = setTimeout(() => {
            hls.destroy();
            resolve(false);
        }, 3000);
        
        hls.loadSource(channel.m3u8Url);
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
            clearTimeout(timeout);
            hls.destroy();
            resolve(true);
        });
        
        hls.on(Hls.Events.ERROR, () => {
            clearTimeout(timeout);
            hls.destroy();
            resolve(false);
        });
    });
}

function openSavedChannelsModal() {
    savedChannelsModal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    displaySavedChannels();
    
    history.pushState({savedModalOpen: true}, null, window.location.href);
}

function closeSavedChannelsModalFunc() {
    savedChannelsModal.style.display = 'none';
    document.body.style.overflow = 'auto';
    
    if (history.state && history.state.savedModalOpen) {
        history.back();
    }
}

function openChannelFromSaved(channel) {
    modalTitle.textContent = channel.name;
    modalProfilePic.src = channel.thumbnail;
    modalProfilePic.onerror = function() {
        this.src = 'https://via.placeholder.com/300x300?text=Channel';
    };
    
    modalFavoriteBtn.style.display = 'flex';
    modalFavoriteBtn.classList.remove('hiding');
    
    if (isChannelSaved(channel.id)) {
        modalFavoriteBtn.style.display = 'none';
    }
    
    currentVideoChannel = channel;
    
    videoModal.style.display = 'flex';
    
    videoModal.style.zIndex = '1001';
    
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
            
            // Handle non-verified user video playback
            handleNonVerifiedVideoPlayback();
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
            
            // Handle non-verified user video playback
            handleNonVerifiedVideoPlayback();
        });
        
        videoPlayer.addEventListener('error', () => {
            loadingText.textContent = 'Error, Please try again';
        });
    } else {
        loadingText.textContent = 'Please try another browser';
    }
}

function captureThumbnail(videoElement, channelId) {
    return new Promise((resolve) => {
        try {
            if (!videoElement || videoElement.readyState < 2) {
                console.log(`Video not ready for channel ${channelId}, retrying...`);
                setTimeout(() => captureThumbnail(videoElement, channelId).then(resolve), 1000);
                return;
            }
            
            thumbnailCanvas.width = videoElement.videoWidth || 300;
            thumbnailCanvas.height = videoElement.videoHeight || 300;
            
            thumbnailCtx.drawImage(videoElement, 0, 0, thumbnailCanvas.width, thumbnailCanvas.height);
            
            const dataUrl = thumbnailCanvas.toDataURL('image/jpeg', 0.7);
            
            const channel = channels.find(c => c.id === channelId);
            if (channel) {
                channel.hasThumbnail = true;
                channel.thumbnail = dataUrl;
            }
            
            document.querySelectorAll(`.channel-card[data-channel-id="${channelId}"] .channel-thumbnail img`).forEach(img => {
                img.style.opacity = 0;
                setTimeout(() => {
                    img.src = dataUrl;
                    img.style.opacity = 1;
                    
                    const loadingElement = document.querySelector(`.channel-card[data-channel-id="${channelId}"] .thumbnail-loading`);
                    if (loadingElement) {
                        loadingElement.style.display = 'none';
                    }
                }, 100);
            });
            
            resolve(true);
        } catch (error) {
            console.error('Error capturing thumbnail:', error);
            resolve(false);
        }
    });
}

function startThumbnailUpdates(channel) {
    if (!channel.videoElement || channel.hasThumbnail) return;
    
    const loadingElement = document.querySelector(`.channel-card[data-channel-id="${channel.id}"] .thumbnail-loading`);
    if (loadingElement) {
        loadingElement.style.display = 'flex';
    }
    
    const checkVideoReady = () => {
        if (channel.videoElement && channel.videoElement.readyState >= 2) {
            captureThumbnail(channel.videoElement, channel.id).then(success => {
                if (success) {
                    console.log(`Thumbnail captured for channel ${channel.id}`);
                    stopThumbnailUpdates(channel);
                    currentThumbnailLoads--;
                    processThumbnailQueue();
                } else {
                    console.log(`Failed to capture thumbnail for channel ${channel.id}, retrying...`);
                    setTimeout(checkVideoReady, 2000);
                }
            });
        } else {
            setTimeout(checkVideoReady, 1000);
        }
    };
    
    checkVideoReady();
}

function stopThumbnailUpdates(channel) {
    if (channel.thumbnailUpdateInterval) {
        clearInterval(channel.thumbnailUpdateInterval);
        channel.thumbnailUpdateInterval = null;
    }
    if (channel.videoElement) {
        channel.videoElement.pause();
        channel.videoElement.removeAttribute('src');
        channel.videoElement.load();
        channel.videoElement = null;
    }
    if (channel._hls) {
        channel._hls.destroy();
        channel._hls = null;
    }
}

async function checkStream(channel) {
    return new Promise((resolve) => {
        if (!Hls.isSupported()) {
            const video = document.createElement('video');
            video.src = channel.m3u8Url;
            video.addEventListener('error', () => resolve(false));
            video.addEventListener('loadedmetadata', () => {
                resolve(true);
                video.remove();
            });
            return;
        }
        
        const hls = new Hls({
            maxMaxBufferLength: 5,
            maxBufferSize: 1000000,
            maxBufferLength: 5,
            lowLatencyMode: false,
            enableWorker: false
        });
        
        let timeout = setTimeout(() => {
            hls.destroy();
            resolve(false);
        }, 8000);
        
        hls.loadSource(channel.m3u8Url);
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
            clearTimeout(timeout);
            hls.destroy();
            resolve(true);
        });
        
        hls.on(Hls.Events.ERROR, () => {
            clearTimeout(timeout);
            hls.destroy();
            resolve(false);
        });
    });
}

function getNextBatch() {
    const uncheckedChannels = channels.filter(channel => !checkedChannels.has(channel.id));
    
    // র‍্যান্ডমভাবে চ্যানেল শাফল করি
    const shuffledChannels = shuffleArray([...uncheckedChannels]);
    
    return shuffledChannels.slice(0, batchSize);
}

async function checkBatch(batchChannels) {
    const checkPromises = [];
    const newActiveChannels = [];
    
    for (const channel of batchChannels) {
        checkPromises.push(
            checkStream(channel)
                .then(isActive => {
                    if (isActive) {
                        newActiveChannels.push(channel);
                    }
                    checkedChannels.add(channel.id);
                })
                .catch(() => {
                    checkedChannels.add(channel.id);
                })
        );
    }
    
    await Promise.all(checkPromises);
    
    activeChannels = [...activeChannels, ...newActiveChannels];
    
    // প্রথম লোডে একটিভ চ্যানেলগুলোও র‍্যান্ডমভাবে শাফল করি
    if (isFirstLoad) {
        shuffleArray(activeChannels);
        isFirstLoad = false;
    }
    
    displayedChannels = activeChannels.slice(0, channelsPerPage * currentPage);
    displayChannels();
    updateStats();
    loadThumbnailsForVisibleChannels();
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
            console.log('All channels have been checked');
            
            startAutoRecheck();
        }
    }, batchInterval);
}

function startAutoRecheck() {
    if (autoRecheckIntervalId) {
        clearInterval(autoRecheckIntervalId);
    }
    
    autoRecheckIntervalId = setInterval(() => {
        console.log('Auto-rechecking all channels...');
        recheckAllChannels();
    }, autoRecheckInterval);
}

async function recheckAllChannels() {
    console.log('Re-checking all channels...');
    
    const recheckPromises = channels.map(async (channel) => {
        const isStillActive = await checkStream(channel);
        return { channel, isStillActive };
    });
    
    const results = await Promise.all(recheckPromises);
    
    const stillActiveChannels = [];
    const removedChannels = [];
    
    for (const result of results) {
        if (result.isStillActive) {
            stillActiveChannels.push(result.channel);
        } else {
            removedChannels.push(result.channel);
            stopThumbnailUpdates(result.channel);
        }
    }
    
    activeChannels = stillActiveChannels;
    
    displayedChannels = activeChannels.slice(0, channelsPerPage * currentPage);
    
    console.log(`Re-check completed. Removed ${removedChannels.length} offline channels. Total active: ${activeChannels.length}`);
    
    displayChannels();
    updateStats();
    
    loadThumbnailsForVisibleChannels();
}

async function loadChannels() {
    const statusChecking = document.querySelector('.status-checking');
    if (statusChecking) {
        statusChecking.style.display = 'flex';
    }
    
    channelContainer.innerHTML = '';
    channelContainer.appendChild(statusChecking);
    
    activeChannels.forEach(channel => {
        if (!channel.hasThumbnail) {
            stopThumbnailUpdates(channel);
        }
    });
    
    if (!isInitialLoad) {
        activeChannels = [];
        displayedChannels = [];
        checkedChannels.clear();
        currentPage = 1;
        thumbnailQueue = [];
        currentThumbnailLoads = 0;
        
        channels.forEach(channel => {
            channel.hasThumbnail = false;
        });
    }
    
    startBatchChecking();
    isInitialLoad = false;
}

function displayChannels() {
    channelContainer.innerHTML = '';
    
    if (displayedChannels.length === 0) {
        channelContainer.appendChild(emptyStateMessage);
        emptyStateMessage.style.display = 'block';
        return;
    } else {
        emptyStateMessage.style.display = 'none';
    }

    for (const channel of displayedChannels) {
        const channelCard = document.createElement('div');
        channelCard.className = 'channel-card';
        channelCard.setAttribute('data-channel-id', channel.id);
        
        const channelThumbnail = document.createElement('div');
        channelThumbnail.className = 'channel-thumbnail';
        
        const thumbnailImg = document.createElement('img');
        thumbnailImg.src = channel.thumbnail;
        thumbnailImg.alt = channel.name;
        thumbnailImg.onerror = function() {
            this.src = 'https://via.placeholder.com/300x300?text=No+Thumbnail';
        };
        
        const channelName = document.createElement('div');
        channelName.className = 'channel-name';
        channelName.textContent = channel.name;
        
        const liveBadge = document.createElement('div');
        liveBadge.className = 'live-badge';
        liveBadge.textContent = 'ONLINE';
        
        const favoriteBtn = document.createElement('button');
        favoriteBtn.className = 'favorite-btn';
        favoriteBtn.setAttribute('data-channel-id', channel.id);
        favoriteBtn.innerHTML = isChannelSaved(channel.id) ? '<i class="fas fa-heart"></i>' : '<i class="far fa-heart"></i>';
        if (isChannelSaved(channel.id)) {
            favoriteBtn.classList.add('active');
        }
        
        favoriteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (isChannelSaved(channel.id)) {
                removeSavedChannel(channel.id);
            } else {
                saveChannel(channel);
            }
            updateFavoriteButtons();
        });
        
        const thumbnailLoading = document.createElement('div');
        thumbnailLoading.className = 'thumbnail-loading';
        thumbnailLoading.style.display = channel.hasThumbnail ? 'none' : 'flex';
        thumbnailLoading.innerHTML = `
            <div class="spinner" style="width: 30px; height: 30px;"></div>
        `;
        
        channelThumbnail.appendChild(thumbnailImg);
        channelThumbnail.appendChild(channelName);
        channelThumbnail.appendChild(liveBadge);
        channelThumbnail.appendChild(favoriteBtn);
        channelThumbnail.appendChild(thumbnailLoading);
        channelCard.appendChild(channelThumbnail);
        
        channelCard.addEventListener('click', () => openChannel(channel));
        channelContainer.appendChild(channelCard);
    }
    
    if (activeChannels.length > displayedChannels.length) {
        const loadMoreContainer = document.createElement('div');
        loadMoreContainer.className = 'load-more-container';
        
        const loadMoreBtn = document.createElement('button');
        loadMoreBtn.className = 'load-more-btn';
        loadMoreBtn.textContent = 'More';
        loadMoreBtn.addEventListener('click', loadMoreChannels);
        
        loadMoreContainer.appendChild(loadMoreBtn);
        channelContainer.appendChild(loadMoreContainer);
    }
}

async function loadMoreChannels() {
    const loadMoreBtn = document.querySelector('.load-more-btn');
    if (loadMoreBtn) {
        loadMoreBtn.disabled = true;
        loadMoreBtn.textContent = 'Loading...';
    }
    
    currentPage++;
    
    const nextPageChannels = activeChannels.slice(displayedChannels.length, channelsPerPage * currentPage);
    displayedChannels = [...displayedChannels, ...nextPageChannels];
    
    displayChannels();
    updateStats();
    
    loadThumbnailsForNewChannels();
    
    if (activeChannels.length > displayedChannels.length) {
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

function loadThumbnailsForVisibleChannels() {
    const channelsToLoad = displayedChannels.filter(channel => !channel.hasThumbnail && !channel.isThumbnailLoading);
    
    for (const channel of channelsToLoad) {
        thumbnailQueue.push(channel);
    }
    
    processThumbnailQueue();
}

function loadThumbnailsForNewChannels() {
    const startIndex = channelsPerPage * (currentPage - 1);
    const endIndex = channelsPerPage * currentPage;
    const newChannels = displayedChannels.slice(startIndex, endIndex);
    
    for (const channel of newChannels) {
        if (!channel.hasThumbnail && !channel.isThumbnailLoading) {
            thumbnailQueue.push(channel);
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
    
    const channel = thumbnailQueue.shift();
    if (channel && !channel.hasThumbnail && !channel.isThumbnailLoading) {
        currentThumbnailLoads++;
        channel.isThumbnailLoading = true;
        
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
            hls.loadSource(channel.m3u8Url);
            hls.attachMedia(videoElement);
            hls.on(Hls.Events.MANIFEST_PARSED, () => {
                videoElement.play().catch(e => console.error('Autoplay failed:', e));
                channel.videoElement = videoElement;
                channel._hls = hls;
                startThumbnailUpdates(channel);
            });
        } else if (videoElement.canPlayType('application/vnd.apple.mpegurl')) {
            videoElement.src = channel.m3u8Url;
            videoElement.addEventListener('loadedmetadata', () => {
                videoElement.play().catch(e => console.error('Autoplay failed:', e));
                channel.videoElement = videoElement;
                startThumbnailUpdates(channel);
            });
        }
    }
    
    if (currentThumbnailLoads < maxConcurrentThumbnails) {
        setTimeout(processThumbnailQueue, 100);
    }
}

function openChannel(channel) {
    modalTitle.textContent = channel.name;
    modalProfilePic.src = channel.thumbnail;
    modalProfilePic.onerror = function() {
        this.src = 'https://via.placeholder.com/300x300?text=Channel';
    };
    
    modalFavoriteBtn.style.display = 'flex';
    modalFavoriteBtn.classList.remove('hiding');
    
    if (isChannelSaved(channel.id)) {
        modalFavoriteBtn.style.display = 'none';
    }
    
    currentVideoChannel = channel;
    
    videoModal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    
    history.pushState({modalOpen: true}, null, window.location.href);

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
            
            // Handle non-verified user video playback
            handleNonVerifiedVideoPlayback();
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
            
            // Handle non-verified user video playback
            handleNonVerifiedVideoPlayback();
        });
        
        videoPlayer.addEventListener('error', () => {
            loadingText.textContent = 'Error, Please try again';
        });
    } else {
        loadingText.textContent = 'Please try another browser';
    }
}

function closeVideoModal() {
    // Clear the video stop timer if it exists
    if (videoStopTimer) {
        clearTimeout(videoStopTimer);
        videoStopTimer = null;
    }
    
    videoModal.style.display = 'none';
    document.body.style.overflow = 'auto';
    
    if (history.state && history.state.modalOpen) {
        history.back();
    }
    
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
    
    currentVideoChannel = null;
}

// Event listeners for login
watchBtn.addEventListener('click', handleLogin);
phoneNumberInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        handleLogin();
    }
});

// Real-time phone number validation
phoneNumberInput.addEventListener('input', function() {
    const phoneNumber = this.value.trim();
    
    if (phoneNumber.length === 11) {
        if (!validatePhoneNumber(phoneNumber)) {
            phoneWarning.style.display = 'block';
        } else {
            phoneWarning.style.display = 'none';
        }
    } else {
        phoneWarning.style.display = 'none';
    }
});

// Event listeners for user profile
userIcon.addEventListener('click', showUserProfile);
closeUserModalHeader.addEventListener('click', closeUserProfile);
userModal.addEventListener('click', (e) => {
    if (e.target === userModal) {
        closeUserProfile();
    }
});

// Event listeners for premium modal
closePremiumModal.addEventListener('click', closePremiumWarning);
premiumModal.addEventListener('click', (e) => {
    if (e.target === premiumModal) {
        closePremiumWarning();
    }
});

// Event listeners for restricted modal
restrictedModal.addEventListener('click', (e) => {
    if (e.target === restrictedModal) {
        closeRestrictedModal();
    }
});

// Event listeners for package modal
packageIcon.addEventListener('click', showPackageModal);
closePackageModal.addEventListener('click', closePackageModalFunc);
packageModal.addEventListener('click', (e) => {
    if (e.target === packageModal) {
        closePackageModalFunc();
    }
});

closeModal.addEventListener('click', closeVideoModal);
videoModal.addEventListener('click', (e) => {
    if (e.target === videoModal) {
        closeVideoModal();
    }
});

modalFavoriteBtn.addEventListener('click', handleModalFavoriteClick);

savedChannelsIcon.addEventListener('click', openSavedChannelsModal);
closeSavedChannelsModal.addEventListener('click', closeSavedChannelsModalFunc);
savedChannelsModal.addEventListener('click', (e) => {
    if (e.target === savedChannelsModal) {
        closeSavedChannelsModalFunc();
    }
});

document.addEventListener('backbutton', closeVideoModal, false);

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        if (videoModal.style.display === 'flex') {
            closeVideoModal();
        } else if (savedChannelsModal.style.display === 'flex') {
            closeSavedChannelsModalFunc();
        } else if (tvChannelsModal.style.display === 'flex') {
            closeTvChannelsModalFunc();
        } else if (toolsModal.style.display === 'flex') {
            closeToolsModalFunc();
        } else if (premiumModal.style.display === 'flex') {
            closePremiumWarning();
        } else if (userModal.style.display === 'flex') {
            closeUserProfile();
        } else if (restrictedModal.style.display === 'flex') {
            closeRestrictedModal();
        } else if (packageModal.style.display === 'flex') {
            closePackageModalFunc();
        }
    }
});

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    // Always show login modal on page load
    loginModal.style.display = 'flex';
    
    window.addEventListener('popstate', handleBrowserBackButton);
    
    history.pushState(null, null, window.location.href);
});

window.addEventListener('beforeunload', () => {
    // Cleanup code
    activeChannels.forEach(channel => {
        stopThumbnailUpdates(channel);
        if (channel._hls) {
            channel._hls.destroy();
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
    
    if (videoStopTimer) {
        clearTimeout(videoStopTimer);
    }
    
    if (countdownInterval) {
        clearInterval(countdownInterval);
    }
});
