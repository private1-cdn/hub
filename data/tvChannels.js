// tvchannels.js - TV Channels data

const tvChannels = [
    {
        name: "Music Channel",
        thumbnail: "https://via.placeholder.com/640x360?text=Music+Channel",
        m3u8Url: "https://media-hls.growcdnssedge.com/b-hls-12/196503633/196503633.m3u8"
    },
    {
        name: "Sports TV",
        thumbnail: "https://via.placeholder.com/640x360?text=Sports+TV",
        m3u8Url: "https://webtvstream.bhtelecom.ba/pink_erotic1.m3u8"
    },
    {
        name: "News Network",
        thumbnail: "https://via.placeholder.com/640x360?text=News+Network",
        m3u8Url: "https://media-hls.growcdnssedge.com/b-hls-03/184835341/184835341.m3u8"
    },
    {
        name: "Entertainment Plus",
        thumbnail: "https://via.placeholder.com/640x360?text=Entertainment+Plus",
        m3u8Url: "https://media-hls.growcdnssedge.com/b-hls-29/212919195/212919195.m3u8"
    },
    {
        name: "Movie Channel",
        thumbnail: "https://via.placeholder.com/640x360?text=Movie+Channel",
        m3u8Url: "https://media-hls.growcdnssedge.com/b-hls-29/212772444/212772444.m3u8"
    },
    {
        name: "Documentary TV",
        thumbnail: "https://via.placeholder.com/640x360?text=Documentary+TV",
        m3u8Url: "https://media-hls.growcdnssedge.com/b-hls-12/196503633/196503633.m3u8"
    },
    {
        name: "Kids Channel",
        thumbnail: "https://via.placeholder.com/640x360?text=Kids+Channel",
        m3u8Url: "https://webtvstream.bhtelecom.ba/pink_erotic1.m3u8"
    },
    {
        name: "Lifestyle TV",
        thumbnail: "https://via.placeholder.com/640x360?text=Lifestyle+TV",
        m3u8Url: "https://media-hls.growcdnssedge.com/b-hls-03/184835341/184835341.m3u8"
    }
];

// প্রতিটি TV channel এর জন্য index-based ID যোগ করছি
tvChannels.forEach((channel, index) => {
    channel.id = index + 1;
});
