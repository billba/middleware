import { Middleware } from './middleware';

export const yoify: Middleware = (req, res, next) => {
    console.log("YO IN");
    return next()
        .then(() => {``
            console.log("YO OUT");
        })
}