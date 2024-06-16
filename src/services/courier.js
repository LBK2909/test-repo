const { OrganizationCourier } = require("../models");
exports.updateOrganizationCourier = async (id, updateData) => {
  try {
    const updatedCourier = await OrganizationCourier.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true } // Returns the updated document
    ).populate("courierId");

    return updatedCourier;
  } catch (error) {
    // console.error("Error updating courier:", error);
    throw new Error(error);
  }
};

exports.removeOrganizationCourier = async (id) => {
  try {
    const deletedCourier = await OrganizationCourier.findByIdAndDelete(id);
    return deletedCourier;
  } catch (error) {
    console.error("Error deleting courier:", error);
    throw new Error("Internal server error");
  }
};
