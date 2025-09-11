import { NextFunction, Request, Response } from "express";
import { BaseUserModel } from "..";

const THROTTLE_INTERVAL_MS = 15 * 60 * 1000;

export const updateLastAccess = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const idUser = req.jwt?.user_id;

    if (!idUser) {
        return next();
    }

    try {
        const now = new Date();

        const user = await BaseUserModel.findById(idUser).select("last_access");

        if (!user) {
            return next();
        }

        const lastAccessTime = user.last_access?.getTime() || 0;
        const timeDifference = now.getTime() - lastAccessTime;

        if (timeDifference > THROTTLE_INTERVAL_MS) {
            await BaseUserModel.findByIdAndUpdate(idUser, { last_access: now });
        }
    } catch (error) {
        console.error(
            `Failed to update last access time for user ${idUser}:`,
            error
        );
    }

    next();
};
