export interface SuccessResponse<T> {
  success: boolean;
  statusCode: number;
  data?: T;
}

export interface ErrorResponse{
    success:boolean,
    statusCode:number
    errors?:string[],
}

export type ApiResponse<T>  = SuccessResponse<T> | ErrorResponse;
