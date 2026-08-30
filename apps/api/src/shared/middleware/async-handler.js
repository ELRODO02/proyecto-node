export function asyncHandler(handler) {
    return function wrapperHandler(
        req,
        res,
        next
    ) {
        Promise.resolve(
            handler(req, res, next)
        ).catch(next)
    }
}