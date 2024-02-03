// vehicleId:GUID,
// driverId:GUID(foreign key from driver entity)
// NumberPlate:string,
// color:string(or enum(red,black,white,yelllow)),
// vehicleImage:string(cloudinaryUrl)
// BillbookImage:string(cloudinaryUrl)

import mongoose, { Schema } from "mongoose";
const vehicleSchema = new Schema({
  numberPlate: {
    type: String,
    required: true,
  },
  color: {
    type: String,
  },
  vehicleImage: {
    type: String, // cloudinary url
    required: true,
  },
  billBookImage: {
    type: String, //cloudinary url
    required: true,
  },
});
export const Vehicle = mongoose.model("Vehicle", vehicleSchema);
