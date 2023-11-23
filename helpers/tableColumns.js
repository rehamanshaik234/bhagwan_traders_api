const tableNames = require("./tableNames.js");
module.exports = {
  getColumns,
  getKeyColumn,
};

function getColumns(tableName) {
  const AppUserCols = {
    branchId: "branch_id",
    userRoleId: "user_role_id",
    userName: "user_name",
    userPassword: "user_password",
    refId: "ref_id",
    mobile: "mobile_no",
    mobileOTP: "mobile_otp",
    lastLogin: "last_login",
    isActive: "is_active",
  };

  const BranchCols = {
    branchId: "branch_id",
    branchName: "branch_name",
    contactNumber: "contact_number",
  };

  const DriverCols = {
    driverId: "driver_id",
    branchId: "branch_id",
    fullName: "full_name",
    address: "address",
    mobile: "mobile",
    drivingLicense: "driving_license",
  };

  const StudentCols = {
    branchId: "branch_id",
    fullName: "full_name",
    mobile: "mobile",
    address: "address",
    routeId: "route_id",
  };

  const VehicleCols = {
    vehicleId: "vehicle_id",
    branchId: "branch_id",
    vehicleType: "vehicle_type",
    vehicleModel: "vehicle_model",
    vehicleRegNo: "vehicle_regno",
    seatCapacity: "seat_capacity",
    otherDetails: "other_det",
  };

  const VehicleRouteCols = {
    routeId: "route_id",
    branchId: "branch_id",
    vehicleId: "vehicle_id",
    driverId: "driver_id",
    routeNumber: "route_number",
    currentLatitude: "current_latitude",
    currentLongitude: "current_longitude",
    lastUpdateTime: "last_update_time",
    isOnline: "is_online",
    isActive: "is_active",
  };

  switch (tableName) {
    case tableNames.Users:
      return AppUserCols;

    case tableNames.Branch:
      return BranchCols;

    case tableNames.Driver:
      return DriverCols;

    case tableNames.Student:
      return StudentCols;

    case tableNames.Vehicle:
      return VehicleCols;

    case tableNames.VehicleRoute:
      return VehicleRouteCols;

    case "":
    default:
      return Object.assign(
        {},
        AppUserCols,
        BranchCols,
        DriverCols,
        StudentCols,
        VehicleCols,
        VehicleRouteCols
      );
  }
}

function getKeyColumn(tableName) {
  const AppUserKey = "app_user_id";
  const BranchKey = "branch_id";
  const DriverKey = "driver_id";
  const StudentKey = "student_id";
  const VehicleKey = "vehicle_id";
  const VehicleRouteKey = "route_id";
  switch (tableName) {
    case tableNames.Users:
      return AppUserKey;

    case tableNames.Branch:
      return BranchKey;

    case tableNames.Driver:
      return DriverKey;

    case tableNames.Student:
      return StudentKey;

    case tableNames.Vehicle:
      return VehicleKey;

    case tableNames.VehicleRoute:
      return VehicleRouteKey;

    default:
      return "id";
  }
}
