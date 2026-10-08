const { createUploader, IMAGE_MIME } = require("../utils/filestorage");
 
// what it probably needs to look like
module.exports = createUploader({
  folder: "casestudies",
  fields: [
    { name: "bannerImage" },                         // → casestudies/
    { name: "logo", subfolder: "logos" },             // → casestudies/logos/
    { name: "overviewImage", subfolder: "overview" },
    { name: "gallery", subfolder: "gallery" ,maxCount: 20},         // → casestudies/gallery/
    { name: "testimonial_thumbnail", subfolder: "thumbnails" }, // → casestudies/thumbnails/
      { name: "og_image",              maxCount: 1  },
    { name: "twitter_image",         maxCount: 1  },
  ],
  allowedMime: IMAGE_MIME,
  maxSizeMB: 2,
});