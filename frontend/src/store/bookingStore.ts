import { create } from 'zustand';

interface BookingState {
  checkIn: string | null;
  checkOut: string | null;
  adultos: number;
  criancas: number;
  codigoPromocional: string | null;
  
  setDates: (checkIn: string | null, checkOut: string | null) => void;
  setGuests: (adultos: number, criancas: number) => void;
  setPromoCode: (codigo: string | null) => void;
}

export const useBookingStore = create<BookingState>((set) => ({
  checkIn: null,
  checkOut: null,
  adultos: 2,
  criancas: 0,
  codigoPromocional: null,
  
  setDates: (checkIn, checkOut) => set({ checkIn, checkOut }),
  setGuests: (adultos, criancas) => set({ adultos, criancas }),
  setPromoCode: (codigoPromocional) => set({ codigoPromocional }),
}));
