// Canvas top position is y=0 and bottom of the canvas is y=height
// This method just flips that top of canvas is y=height
export const flipYAxes = (y, maxY) => Math.abs(y - maxY);
