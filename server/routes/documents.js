import express from "express";
import { randomUUID } from "crypto";
import Document from "../models/Document.js";

const router = express.Router();

router.get("/:id", async (req, res, next) => {
  try {
    const document = await Document.findOneAndUpdate(
      { documentId: req.params.id },
      {
        $setOnInsert: {
          documentId: req.params.id,
          content: "",
          updatedAt: new Date()
        }
      },
      {
        new: true,
        upsert: true
      }
    );

    res.json(document);
  } catch (error) {
    next(error);
  }
});

router.post("/", async (_req, res, next) => {
  try {
    const document = await Document.create({
      documentId: randomUUID(),
      content: "",
      updatedAt: new Date()
    });

    res.status(201).json(document);
  } catch (error) {
    next(error);
  }
});

export default router;
