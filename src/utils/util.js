function chainMiddleware(middlewares) {
  return (req, res, next) => {
    const dispatch = (index) => {
      if (index >= middlewares.length) {
        return next(); // No more middleware to execute
      }

      const middleware = middlewares[index];
      middleware(req, res, (error) => {
        if (error) {
          return next(error); // Error handling middleware can take it from here
        }
        dispatch(index + 1); // Call the next middleware
      });
    };
    dispatch(0);
  };
}

module.exports = {
  chainMiddleware,
};
