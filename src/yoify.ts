import { Middleware } from './middleware';

export const yoify: Middleware = async (req, res, next) => {
    console.log("YO IN");
    await next();
    console.log("YO OUT");
}