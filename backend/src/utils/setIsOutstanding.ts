import { thresholdOustanding } from "./constants";
import { DoctorOutstanding, DoctorOutstandingWithIsOutstanding } from "src/shared/types/global.type";
export const setIsOutstanding = (doctor: DoctorOutstanding) => {
    const finalScore = calculateFinalScore(doctor.avg_rating, doctor.appointments_completed)
    return finalScore >= thresholdOustanding
}

export const calculateFinalScore = (avg_rating: number, appointments_completed: number) => {
    const finalScore =
        0.7 * avg_rating +
        0.3 * (Math.log(1 + appointments_completed));
    return finalScore
}


export const setIsOutstandingDoctor = (doctor: DoctorOutstanding): DoctorOutstandingWithIsOutstanding => {
    return { ...doctor, isOutstanding: setIsOutstanding(doctor) }
}

export const setIsOutstandingDoctors = (doctors: DoctorOutstanding[]) => {
    return doctors.map((doctor: DoctorOutstanding) => ({ ...doctor, isOutstanding: setIsOutstanding(doctor) }))
}