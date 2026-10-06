const cloudinary = require('cloudinary').v2;
const sig = cloudinary.utils.api_sign_request({
  timestamp: 12345,
  public_id: "test",
  upload_preset: "my_preset"
}, "secret");
console.log(sig);
