import { unlink } from 'fs/promises';
import { validationResult } from 'express-validator';

// Finds the validation errors in this request and wraps them in an object with handy functions
const validatorMiddleWare = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        if (req.file) {
            await unlink(req.file.path);
        };
        return res.status(400).json({ errors: errors.array() });
    }
    next();
}

export default validatorMiddleWare;