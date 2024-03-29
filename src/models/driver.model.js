// driverId:GUID
// userId:GUID(foreign key from user entity)
// liscenceNumber:string,
// liscenceImage:string(url),(cloudinary url)
// AccountVerifyStatus:bool=false(bydefault)
// AvailabilityStatus:bool
import mongoose, { Schema } from "mongoose";

const driverSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  vehicleId: {
    type: Schema.Types.ObjectId,
    ref: "Vehicle",
    required: true,
  },
  liscenceNumber: {
    type: String,
    required: true,
  },
  liscenceImage: {
    type: String, //cloudinary url
    required: true,
  },
  accountVerifyStatus: {
    type: Boolean,
    default: false,
  },
  availabilityStatus: {
    type: Boolean,
    default: false,
  },
  ratings: {
    type: Number,
    default: 5,
  },
});
export const Driver = mongoose.model("Driver", driverSchema);
