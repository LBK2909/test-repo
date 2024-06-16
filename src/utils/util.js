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

function findOptimalBox(totalWeight, boxes) {
  // Calculate total weight of the items
  // const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);

  // Filter boxes based on volumetric weight capacity
  const suitableBoxes = boxes.filter((box) => (box.width * box.length * box.height) / 5000 >= totalWeight / 1000);

  if (suitableBoxes.length === 0) {
    console.log("No suitable box found");
    // throw new Error("No suitable box found");
    return {
      width: 10,
      height: 10,
      length: 10,
      emptyWeight: 10,
      unit: "cm",
    };
  }

  // Select the box with the smallest volume among the suitable ones
  const optimalBox = suitableBoxes.reduce((minBox, box) => (box.volume < minBox.volume ? box : minBox), suitableBoxes[0]);
  let obj = {
    width: parseInt(optimalBox.width),
    height: parseInt(optimalBox.height),
    length: parseInt(optimalBox.length),
    emptyWeight: parseInt(optimalBox.emptyWeight),
    unit: "cm",
  };
  return obj;
}

module.exports = {
  chainMiddleware,
  findOptimalBox,
};
