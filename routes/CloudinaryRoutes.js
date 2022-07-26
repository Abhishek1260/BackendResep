const express = require("express");
const router = express.Router();
const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: "dvtc9bbr8",
  api_key: "119916486961323",
  api_secret: "sRJk7NXg2eIFGaCeLf7vp1P5GV4",
});

//route to add a single product images
router.post("/image/upload/single", async (req, res) => {
  try {
    const { data } = req.body;
    const uploadedData = await cloudinary.uploader.upload(data, {
      upload_preset: "Resep",
    });
    return res.status(200).json({
      success: true,
      message: "image uploaded successfully",
      url: uploadedData.secure_url,
    });
  } catch (error) {
    //(error);
    return res
      .status(500)
      .json({ success: false, message: "internal server error" });
  }
});

module.exports = router;
