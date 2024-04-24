import multer from 'multer';
import BadRequest from '../errors/badRequest.js';
import { v4 as uuid } from 'uuid'
import pathOs from 'path';

const multerOptions = (path, type) => {
    // 1) DisStorage engine
    const multerStorage = multer.diskStorage({
        destination: function (req, file, cb) {
            cb(null, pathOs.join('uploads', path))
        },
        filename: function (req, file, cb) {
            // category-{id}-Date.now().jpeg
            const ext = file.mimetype.split('/')[1];
            const filename = `${path.replace(/[\/-]/g, '-')}-${uuid()}.${ext}`;
            cb(null, filename);
        }
    });

    const limits = {
        // Customize the limits according to your requirements
        fileSize: 1024 * 1024 * 2, // 2 MB per file
        files: 5, // Maximum 5 files at a time
    };
    const fileFilter = (req, file, cb) => {
        if (type === 'image') {
            if (file.mimetype.startsWith("image"))
                cb(null, true)
            else
                cb(new BadRequest("Only Images allowed"), false);
        }
        if (type === 'pdf') {
            if (file.mimetype.startsWith("application/pdf")) {
                cb(null, true); // Allow PDF files
            } else {
                cb(new BadRequest("Only PDF files allowed"), false);
            }
        }
        if (type === 'imgAndPdf') {
            if (file.mimetype.startsWith("image") || file.mimetype.startsWith("application/pdf"))
                cb(null, true)
            else
                cb(new BadRequest("Only Images and PDF files allowed"), false);
        }
    };

    return multer({ storage: multerStorage, fileFilter, limits });

}

export function uploadSingleFile(fieldName, path, type) { return multerOptions(path, type).single(fieldName); }

export function uploadArrayOfFiles(arrayOfFiles, path, type) { return multerOptions(path, type).array(arrayOfFiles); }

export function uploadMixedOfFiles(arrayOfFiles, path, type) { return multerOptions(path, type).fields(arrayOfFiles); }

