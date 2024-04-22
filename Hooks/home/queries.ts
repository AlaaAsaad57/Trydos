import { useQuery } from "@tanstack/react-query";
import HomeService from "services/home";

export async function useClientData() {
  return useQuery({
    queryKey: ["client_data"],
    queryFn: await HomeService.getClientData,
  });
}

export async function useCustomerInfo() {
  return useQuery({
    queryKey: ["customer_info"],
    queryFn: await HomeService.getCustomerInfo,
  });
}

export async function useCheckLogin() {
  return useQuery({
    queryKey: ["check_login"],
    queryFn: await HomeService.CheckLogin,
  });
}

export async function useRegisterDevice() {
  return useQuery({
    queryKey: ["register_device"],
    queryFn: await HomeService.RegisterDevice,
  });
}
