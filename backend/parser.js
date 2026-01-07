export async function parseFacebookVideo(url) {
  return {
    title: "Sample Facebook Video",
    thumbnail: "https://placehold.co/600x400",
    duration: "02:15",
    sources: [
      {
        quality: "HD",
        type: "mp4",
        url: "#",
        sizeMB: 18.4
      },
      {
        quality: "SD",
        type: "mp4",
        url: "#",
        sizeMB: 8.1
      }
    ]
  };
}
