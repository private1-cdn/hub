// tvchannels.js - TV Channels data

const tvChannels = [
    {
        name: "Comming Soon",
        thumbnail: "#",
        m3u8Url: "https://test.com/test.m3u8"
    }
];

// প্রতিটি TV channel এর জন্য index-based ID যোগ করছি
tvChannels.forEach((channel, index) => {
    channel.id = index + 1;
});
