const express = require("express");
const router = express.Router();
const {
  getTags,
  addTag,
  deleteTag
} = require("../controllers/tagController");

const authenticate = require("../middleware/authMiddleware");

router.get("/", authenticate, getTags);
router.post("/", authenticate, addTag);
router.delete("/:id", authenticate, deleteTag);

module.exports = router;
