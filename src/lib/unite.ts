import geomagnetism from "geomagnetism";

export const toRadians = (degrees) => degrees * (Math.PI / 180);

export const toDegrees = (radians) => radians * (180 / Math.PI);

export const CalculateMagneticNorth = (latitude, longitude) => {
  // Get the current model (defaults to today's date)
  const model = geomagnetism.model();
  return model.point([latitude, longitude]).decl;
};
