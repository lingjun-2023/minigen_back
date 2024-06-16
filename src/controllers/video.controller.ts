import { Request, Response } from "express";
import { generateAll } from "../lib/steps";

export const generateVideo = async (req: Request, res: Response) => {
  try {
    const { videoInfo, paragraph, pathname, blobId } = req.body;
    console.log(videoInfo, paragraph, pathname, blobId)
    generateAll(paragraph, videoInfo.voice, pathname, blobId)

    res.status(200).json({ message: '创建成功' });
  } catch (error) {
    res.status(500).json({ message: '你好' });
  }
};

export const getTest = async (req: Request, res: Response) => {
  try {
    res.status(200).json({ message: '你好' });
  } catch (error) {
    res.status(500).json({ message: '你好' });
  }
};

