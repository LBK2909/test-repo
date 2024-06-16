const { Box } = require("../../models");

const createBox = async (boxData) => {
  const box = new Box(boxData);
  return box.save();
};

const getBoxes = async (orgId) => {
  return Box.find({ orgId });
};

const getBoxById = async (_id) => {
  return Box.findOne({ _id });
};

const updateBox = async (_id, updateData) => {
  return Box.findOneAndUpdate({ _id }, updateData, { new: true });
};

const deleteBox = async (_id) => {
  return Box.findOneAndDelete({ _id });
};

module.exports = {
  createBox,
  getBoxes,
  getBoxById,
  updateBox,
  deleteBox,
};
