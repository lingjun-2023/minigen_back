import express from "express";
import { generateVideo, getTest } from "../controllers/video.controller";

const router = express.Router();
router.post("", generateVideo);
router.get('', getTest)

export default router

