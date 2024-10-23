import { Readable } from "stream";
import fs from "fs";
import { promises as fsPromises } from "fs";
import { s3 } from "./s3Config.js"; // Import your S3 configuration

import dotenv from "dotenv";
dotenv.config();

const S3_BUCKET_NAME = process.env.S3_BUCKET_NAME;

/**
 * Upload a file to S3
 * @param {Object} file - The file to upload
 * @returns {Promise<Object>} - Uploaded file details
 */
export async function uploadToS3(file) {
    try {
        const file_key = generateFileKey(file.originalname);
        const params = {
            Bucket: S3_BUCKET_NAME,
            Key: file_key,
            Body: file.buffer,
        };

        // AWS SDK v3 automatically returns a promise
        await s3.putObject(params);

        return {
            file_key,
            file_name: file.originalname,
        };
    } catch (error) {
        console.error("Error uploading to S3:", error);
        throw new Error("Failed to upload file to S3");
    }
}

/**
 * Read a file from S3
 * @param {string} file_key - The key of the file to read
 * @returns {Promise<Buffer>} - The file data
 */
export async function readFromS3(file_key) {
    try {
        const params = {
            Bucket: S3_BUCKET_NAME,
            Key: file_key,
        };

        const data = await s3.getObject(params);

        // Return the Buffer data
        return data.Body;
    } catch (error) {
        console.error("Error reading from S3:", error);
        throw new Error("Failed to read file from S3");
    }
}

/**
 * Download a file from S3 to a local directory
 * @param {string} file_key - The S3 key of the file
 * @param {string} dirname - The directory to store the downloaded file
 * @returns {Promise<string>} - The local file path
 */
export async function downloadFromS3(file_key, dirname) {
    try {
        const params = {
            Bucket: S3_BUCKET_NAME,
            Key: file_key,
        };

        const obj = await s3.getObject(params);
        const file_name = `./uploads/${dirname}/${Date.now().toString()}.png`;

        await setupDirectories(dirname); // Ensure the directory exists

        if (obj.Body instanceof Readable) {
            await streamToFile(obj.Body, file_name);
            return file_name;
        }

        throw new Error("S3 object Body is not a stream");
    } catch (error) {
        console.error("Error downloading from S3:", error);
        throw new Error("Failed to download file from S3");
    }
}

async function setupDirectories(dirname) {
    const parentDir = "./uploads";
    const subDir = `${parentDir}/${dirname}`;

    // Ensure parent and subdirectory exist
    await fsPromises.mkdir(subDir, { recursive: true });
}

async function streamToFile(stream, file_name) {
    const fileStream = fs.createWriteStream(file_name);
    return new Promise((resolve, reject) => {
        stream.pipe(fileStream)
            .on("finish", resolve)
            .on("error", reject);
    });
}

const generateFileKey = (fileName) => {
    return `clients/${Date.now().toString()}_${fileName.replace(/\s/g, "-")}`;
};

export function getSignatureURL(imagePath) {
    const ngrokUrl = process.env.NGROK_URL;
    if (!ngrokUrl) {
        throw new Error("NGROK_URL is not defined in the environment variables");
    }
    return `${ngrokUrl}/${imagePath}`;
}
