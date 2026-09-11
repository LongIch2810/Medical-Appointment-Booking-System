import { bookingAutoAppointment } from "@/api/appointmentApi";
import { useMutation } from "@tanstack/react-query";

export function useAutoBookingAppointment() {
  return useMutation({
    mutationFn: bookingAutoAppointment,
  });
}
