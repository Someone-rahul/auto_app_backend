class ApiResponse {
  constructor(statusCode, data, pagination, message = "success") {
    this.statusCode = statusCode;
    this.data = data;
    this.pagination = pagination;
    this.message = message;
    this.success = statusCode < 400;
  }
}
export { ApiResponse };
