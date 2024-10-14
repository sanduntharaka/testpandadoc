import { Readable } from "stream";
import fs from "fs";
import { promises as fsPromises } from "fs";
import { s3 } from "./config.js";

export async function uploadToS3(file) {
    try {
        const file_key = generateFileKey(file.originalname);
        const params = {
            Bucket: process.env.S3_BUCKET_NAME,
            Key: file_key,
            Body: file.buffer,
        };

        await s3.putObject(params);

        return Promise.resolve({
            file_key,
            file_name: file.originalname,
        });
    } catch (error) {
        console.log(error);
        throw error;
    }
}

// Function to read a file from S3
export async function readFromS3(file_key) {
    try {
        const params = {
            Bucket: process.env.S3_BUCKET_NAME,
            Key: file_key,
        };

        const data = await s3.getObject(params);

        // If the data.Body is a Buffer, you may want to convert it to a string or process it accordingly
        return data.Body; // This is a Buffer
    } catch (error) {
        console.log(error);
        throw error;
    }
}

// Download from S3
export async function downloadFromS3(file_key) {
    const params = {
        Bucket: process.env.S3_BUCKET_NAME,
        Key: file_key,
    };

    try {
        const obj = await s3.getObject(params);
        const file_name = `./documents/${Date.now().toString()}.png`;

        await ensureDirectoryExists("./documents"); // Ensure the directory exists

        if (obj.Body instanceof Readable) {
            await streamToFile(obj.Body, file_name);
            return file_name;
        }
    } catch (error) {
        console.error(error);
        throw error;
    }
}

async function ensureDirectoryExists(dir) {
    await fsPromises.mkdir(dir, { recursive: true });
}

async function streamToFile(stream, file_name) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const fileStream = fs.createWriteStream(file_name);
    await new Promise((resolve, reject) => {
        stream.pipe(fileStream).on("finish", resolve).on("error", reject);
    });
}

const generateFileKey = (fileName) => {
    return `uploads/${Date.now().toString()}_${fileName.replace(" ", "-")}`;
};

export function getSignatureURL(imagePath) {
    return `${process.env.NGROK_URL}/${imagePath}`;
}